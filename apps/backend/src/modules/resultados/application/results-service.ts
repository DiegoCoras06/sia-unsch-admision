import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db } from '../../../shared/db/prisma.js';
import { businessRule, forbidden, notFound, validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import type { FileStorage } from '../../../shared/storage/file-storage.js';
import type { ConvocatoriasQueries } from '../../convocatorias/index.js';
import { CONDITION_LABEL, groupKey, rank, uncovered, type Condition, type Contender } from '../domain/ranking.js';
import { parseScoreFile, type Issue, type ScoreRow } from '../domain/score-file.js';
import { admissionCertificatePdf } from './certificate-pdf.js';

export interface ResultPerson {
  applicantCode: string; fullName: string; firstNames: string; document: string; modality: string; program: string; area: string;
  optionCode: string; quotaCategory: string; noVacancyRight: boolean; email: string; photoKey: string;
}
export interface ResultsPorts {
  exams: {
    gradingContext(id: string): Promise<{
      id: string; code: string; name: string; callCode: string; modalities: string[]; closedAt: Date | null;
      structure: { conocimientos: number; aptitudVocacional: number; actitudPersonal: number };
      scoring: { puntosConocimientos: number; puntosTest: number; factorArea: number | Record<string, number>; puntajeMinimo: number };
      attendance: Map<string, 'PENDIENTE' | 'PRESENTE' | 'AUSENTE'>;
    }>;
    examList(): Promise<{ id: string; code: string; name: string; modalities: string[]; status: string; date: Date }[]>;
  };
  inscriptions: {
    eligibleFor(callCode: string, modalities: string[]): Promise<ResultPerson[]>;
    examContext(applicantCode: string, documentNumber?: string): Promise<(ResultPerson & { callCode: string; status: string }) | null>;
  };
  notify: {
    render(key: 'RESULTADOS_DISPONIBLES', vars: Record<string, string>): Promise<{ subject: string; html: string; text: string }>;
    enqueue(items: { email: string; event: string; subject: string; html: string; text: string; dedupeKey?: string }[]): Promise<number>;
  };
  support: { createReview(input: { name: string; email: string; message: string }, ipHash: string): Promise<string> };
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const MODALITY_LABEL: Record<string, string> = { ORD: 'Ordinario', EXO: 'Exonerados', CEPRE: 'CEPRE-UNSCH' };
const CONSTANCIA = 15;
const RECARGO = 65;

/**
 * M09 Resultados (spec 007): importación validada, cálculo y orden de mérito, versiones con aprobación,
 * publicación a la hora autorizada, consulta segura, trámite de ingreso y reportes.
 */
export class ResultsService {
  constructor(
    private readonly d: {
      db: Db;
      clock: Clock;
      audit: AuditLog;
      limiter: RateLimiter;
      storage: FileStorage;
      convocatorias: ConvocatoriasQueries;
      ports: ResultsPorts;
      secret: string;
      frontendOrigin: string;
    },
  ) {}

  private get p() {
    return this.d.ports;
  }

  // ── Panel: resumen por examen ──────────────────────────────────────
  async overview() {
    const exams = await this.p.exams.examList();
    return Promise.all(exams.map(async (e) => {
      const [batches, versions] = await Promise.all([
        this.d.db.scoreBatch.findMany({ where: { examId: e.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
        this.d.db.resultVersion.findMany({ where: { examId: e.id }, orderBy: { version: 'desc' } }),
      ]);
      return {
        id: e.id, code: e.code, name: e.name, modalities: e.modalities, date: iso(e.date), examStatus: e.status,
        batches: batches.map((b) => ({ id: b.id, fileName: b.fileName, status: b.status, validCount: b.validCount, issues: (b.issues as unknown as Issue[]).length, createdAt: iso(b.createdAt) })),
        versions: versions.map((v) => this.versionSummary(v)),
      };
    }));
  }

  private versionSummary(v: NonNullable<Awaited<ReturnType<Db['resultVersion']['findUnique']>>>) {
    return {
      id: v.id, version: v.version, status: v.status, reason: v.reason, publishAt: iso(v.publishAt), visible: v.status === 'PUBLICADA' && !!v.publishAt && v.publishAt <= this.d.clock.now(),
      submittedAt: iso(v.submittedAt), approvedAt: iso(v.approvedAt), createdAt: iso(v.createdAt), notifiedAt: iso(v.notifiedAt),
    };
  }

  // ── H1: importar y validar (RF-09.01, RF-09.02) ────────────────────
  async importBatch(examId: string, fileName: string, content: string, actorId: string, meta: RequestMeta) {
    const ctx = await this.p.exams.gradingContext(examId);
    if (!ctx.closedAt) throw businessRule('ATTENDANCE_OPEN', 'Primero cierra la asistencia del examen: los ausentes salen de ahí.');
    const { rows, issues } = parseScoreFile(content, ctx.attendance, ctx.structure);
    const b = await this.d.db.$transaction(async (tx) => {
      const batch = await tx.scoreBatch.create({
        data: { examId, fileName, status: issues.length ? 'CON_ERRORES' : 'VALIDO', rows: rows as object[], issues: issues as object[], validCount: rows.length, uploadedBy: actorId },
      });
      await this.d.audit.record({ actorUserId: actorId, action: 'results.batch_imported', resourceType: 'score_batch', resourceId: batch.id, after: { examId, rows: rows.length, issues: issues.length }, ...meta }, tx);
      return batch;
    });
    return { id: b.id, status: b.status, validCount: rows.length, unreadable: rows.filter((r) => r.unreadable).length, issues };
  }

  // ── H2: procesar (RF-09.03 a RF-09.05) ─────────────────────────────
  async process(batchId: string, reason: string | undefined, actorId: string, meta: RequestMeta) {
    const batch = await this.d.db.scoreBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw notFound('Lote no encontrado.');
    if (batch.status === 'CON_ERRORES') throw businessRule('BATCH_HAS_ERRORS', 'El lote tiene inconsistencias: corrígelas e impórtalo de nuevo.');
    const ctx = await this.p.exams.gradingContext(batch.examId);
    const published = await this.d.db.resultVersion.findFirst({ where: { examId: ctx.id, status: 'PUBLICADA' } });
    // H3-4: una rectificación de resultados publicados exige motivo y queda como nueva versión.
    if (published && (reason?.trim().length ?? 0) < 10) {
      throw validationError('Ya hay resultados publicados: indica el motivo de la rectificación (mínimo 10 caracteres).', [{ field: 'reason', issue: 'obligatorio' }]);
    }
    const started = Date.now();
    const [people, vacancies] = await Promise.all([this.p.inscriptions.eligibleFor(ctx.callCode, ctx.modalities), this.vacancies(ctx.callCode, ctx.modalities)]);
    const answers = new Map((batch.rows as unknown as ScoreRow[]).map((r) => [r.applicantCode, r]));
    const contenders: Contender[] = people.map((p) => {
      const a = ctx.attendance.get(p.applicantCode) === 'AUSENTE' ? undefined : answers.get(p.applicantCode);
      return { applicantCode: p.applicantCode, optionCode: p.optionCode, quotaCategory: p.quotaCategory, area: p.area, noVacancyRight: p.noVacancyRight, answers: a ?? null };
    });
    const ranked = rank(contenders, vacancies, ctx.scoring);
    const last = await this.d.db.resultVersion.findFirst({ where: { examId: ctx.id }, orderBy: { version: 'desc' } });
    const version = await this.d.db.$transaction(async (tx) => {
      await tx.resultVersion.updateMany({ where: { examId: ctx.id, status: { in: ['BORRADOR', 'EN_APROBACION'] } }, data: { status: 'DESCARTADA' } });
      const v = await tx.resultVersion.create({
        data: { examId: ctx.id, callCode: ctx.callCode, version: (last?.version ?? 0) + 1, batchId, reason: reason?.trim() || null, createdBy: actorId, vacancies: Object.fromEntries(vacancies) },
      });
      await tx.examResult.createMany({
        data: ranked.map((r) => ({
          versionId: v.id, applicantCode: r.applicantCode, optionCode: r.optionCode, quotaCategory: r.quotaCategory,
          knowledge: r.answers?.unreadable ? null : (r.answers?.knowledge ?? null), vocational: r.answers?.unreadable ? null : (r.answers?.vocational ?? null),
          attitude: r.answers?.unreadable ? null : (r.answers?.attitude ?? null), score: r.score, rank: r.rank, condition: r.condition,
        })),
      });
      await tx.scoreBatch.update({ where: { id: batchId }, data: { status: 'PROCESADO' } });
      await this.d.audit.record({
        actorUserId: actorId, action: published ? 'results.rectification_drafted' : 'results.processed', resourceType: 'result_version', resourceId: v.id,
        after: { version: v.version, total: ranked.length, admitted: ranked.filter((r) => r.condition === 'ADMITIDO').length, reason: reason ?? null, ms: Date.now() - started }, ...meta,
      }, tx);
      return v;
    }, { timeout: 60_000 });
    return this.version(version.id, {});
  }

  /** Vacantes por programa y categoría; las de exonerados no cubiertas pasan al ordinario del mismo programa (RN-05). */
  private async vacancies(callCode: string, modalities: string[]) {
    const categories = (await this.d.convocatorias.listQuotaCategories(callCode)).filter((c) => modalities.includes(c.modality));
    const out = new Map<string, number>();
    for (const c of categories) {
      const opts = await this.d.convocatorias.searchOptions(callCode, { category: c.code });
      for (const o of opts.data) if ((o.categoryVacancies ?? 0) > 0) out.set(groupKey(o.internalCode, c.code), o.categoryVacancies ?? 0);
    }
    if (modalities.includes('ORD')) {
      const exo = (await this.p.exams.examList()).find((e) => e.modalities.includes('EXO'));
      const v = exo ? await this.d.db.resultVersion.findFirst({ where: { examId: exo.id, status: 'PUBLICADA' }, include: { results: true } }) : null;
      if (v) {
        const left = uncovered(v.results.map((r) => ({ optionCode: r.optionCode, quotaCategory: r.quotaCategory, condition: r.condition as Condition })), new Map(Object.entries(v.vacancies as Record<string, number>)));
        for (const [k, n] of left) {
          if (!n) continue;
          const ord = groupKey(k.split('|')[0]!, 'ORD');
          out.set(ord, (out.get(ord) ?? 0) + n);
        }
      }
    }
    return out;
  }

  async version(id: string, f: { optionCode?: string | undefined; condition?: string | undefined; q?: string | undefined }) {
    const v = await this.d.db.resultVersion.findUnique({ where: { id } });
    if (!v) throw notFound('Versión no encontrada.');
    const [rows, ctx] = await Promise.all([this.d.db.examResult.findMany({ where: { versionId: id } }), this.p.exams.gradingContext(v.examId)]);
    const people = new Map((await this.p.inscriptions.eligibleFor(v.callCode, ctx.modalities)).map((p) => [p.applicantCode, p]));
    const vac = v.vacancies as Record<string, number>;
    const byCondition = Object.keys(CONDITION_LABEL).map((k) => ({ key: k, label: CONDITION_LABEL[k as Condition], count: rows.filter((r) => r.condition === k).length }));
    const coverage = Object.entries(vac).map(([k, n]) => {
      const [optionCode, quotaCategory] = k.split('|') as [string, string];
      const admitted = rows.filter((r) => r.optionCode === optionCode && r.quotaCategory === quotaCategory && r.condition === 'ADMITIDO').length;
      const any = rows.find((r) => r.optionCode === optionCode);
      return { optionCode, program: any ? (people.get(any.applicantCode)?.program ?? optionCode) : optionCode, quotaCategory, vacancies: n, admitted, uncovered: Math.max(0, n - admitted) };
    }).filter((c) => c.admitted || rows.some((r) => r.optionCode === c.optionCode)).sort((a, b) => a.program.localeCompare(b.program, 'es'));
    const q = f.q?.trim().toUpperCase();
    const list = rows
      .filter((r) => (!f.optionCode || r.optionCode === f.optionCode) && (!f.condition || r.condition === f.condition))
      .map((r) => {
        const p = people.get(r.applicantCode);
        return {
          applicantCode: r.applicantCode, fullName: p?.fullName ?? r.applicantCode, program: p?.program ?? r.optionCode, optionCode: r.optionCode, quotaCategory: r.quotaCategory,
          knowledge: r.knowledge, vocational: r.vocational, attitude: r.attitude, score: r.score ? Number(r.score).toFixed(2) : null, rank: r.rank,
          condition: r.condition, conditionLabel: CONDITION_LABEL[r.condition as Condition],
        };
      })
      .filter((r) => !q || r.applicantCode.includes(q) || r.fullName.toUpperCase().includes(q))
      .sort((a, b) => a.program.localeCompare(b.program, 'es') || a.quotaCategory.localeCompare(b.quotaCategory) || (a.rank ?? 1e9) - (b.rank ?? 1e9) || Number(b.score ?? -1) - Number(a.score ?? -1));
    return { ...this.versionSummary(v), examId: v.examId, exam: ctx.name, total: rows.length, byCondition, coverage, rows: list.slice(0, 500), shown: Math.min(500, list.length), matching: list.length };
  }

  // ── H3: aprobación y publicación (RF-09.06, RF-09.07, RF-09.11) ────
  async submit(id: string, actorId: string, meta: RequestMeta) {
    const v = await this.d.db.resultVersion.findUnique({ where: { id } });
    if (!v) throw notFound('Versión no encontrada.');
    if (v.status !== 'BORRADOR') throw businessRule('NOT_DRAFT', 'Solo se envía a aprobación un borrador.');
    await this.d.db.$transaction(async (tx) => {
      await tx.resultVersion.update({ where: { id }, data: { status: 'EN_APROBACION', submittedBy: actorId, submittedAt: this.d.clock.now() } });
      await this.d.audit.record({ actorUserId: actorId, action: 'results.submitted', resourceType: 'result_version', resourceId: id, after: { version: v.version }, ...meta }, tx);
    });
    return this.version(id, {});
  }

  async approve(id: string, publishAt: Date, actorId: string, meta: RequestMeta) {
    const v = await this.d.db.resultVersion.findUnique({ where: { id }, include: { results: { where: { condition: 'ADMITIDO' } } } });
    if (!v) throw notFound('Versión no encontrada.');
    if (v.status !== 'EN_APROBACION') throw businessRule('NOT_SUBMITTED', 'Solo se aprueba una versión enviada a aprobación.');
    // Segregación de funciones: quien procesa o envía no aprueba (RNF-09).
    if (v.submittedBy === actorId || v.createdBy === actorId) throw forbidden('La aprobación la da otra persona de la Comisión, no quien procesó o envió los resultados.');
    const admitted = new Set(v.results.map((r) => r.applicantCode));
    await this.d.db.$transaction(async (tx) => {
      const prev = await tx.resultVersion.findMany({ where: { examId: v.examId, status: 'PUBLICADA' } });
      await tx.resultVersion.updateMany({ where: { examId: v.examId, status: 'PUBLICADA' }, data: { status: 'REEMPLAZADA' } });
      await tx.resultVersion.update({ where: { id }, data: { status: 'PUBLICADA', approvedBy: actorId, approvedAt: this.d.clock.now(), publishAt, notifiedAt: prev.length ? this.d.clock.now() : null } });
      // Trámite de ingreso para cada admitido; una rectificación retira los trámites pendientes de quien deja de ser admitido.
      if (prev.length) {
        const before = await tx.examResult.findMany({ where: { versionId: { in: prev.map((p) => p.id) }, condition: 'ADMITIDO' }, select: { applicantCode: true } });
        const dropped = before.map((b) => b.applicantCode).filter((c) => !admitted.has(c));
        await tx.admission.deleteMany({ where: { applicantCode: { in: dropped }, status: 'PENDIENTE' } });
      }
      await tx.admission.createMany({ data: [...admitted].map((applicantCode) => ({ applicantCode, callCode: v.callCode })), skipDuplicates: true });
      await this.d.audit.record({
        actorUserId: actorId, action: prev.length ? 'results.rectified' : 'results.approved', resourceType: 'result_version', resourceId: id,
        before: prev.length ? { versions: prev.map((p) => p.version) } : null, after: { version: v.version, publishAt: publishAt.toISOString(), admitted: admitted.size, reason: v.reason }, ...meta,
      }, tx);
    });
    return this.version(id, {});
  }

  async sendBack(id: string, note: string, actorId: string, meta: RequestMeta) {
    const v = await this.d.db.resultVersion.findUnique({ where: { id } });
    if (!v || v.status !== 'EN_APROBACION') throw businessRule('NOT_SUBMITTED', 'Solo se devuelve una versión enviada a aprobación.');
    await this.d.db.$transaction(async (tx) => {
      await tx.resultVersion.update({ where: { id }, data: { status: 'BORRADOR', submittedBy: null, submittedAt: null } });
      await this.d.audit.record({ actorUserId: actorId, action: 'results.sent_back', resourceType: 'result_version', resourceId: id, after: { note }, ...meta }, tx);
    });
    return this.version(id, {});
  }

  /** Ciclo periódico: aviso de resultados disponibles (sin puntaje, RF-11.07) y admisión perdida al vencer la entrega (RN-55). */
  async tick() {
    const now = this.d.clock.now();
    let queued = 0;
    for (const v of await this.d.db.resultVersion.findMany({ where: { status: 'PUBLICADA', publishAt: { lte: now }, notifiedAt: null } })) {
      const ctx = await this.p.exams.gradingContext(v.examId);
      const codes = new Set((await this.d.db.examResult.findMany({ where: { versionId: v.id }, select: { applicantCode: true } })).map((r) => r.applicantCode));
      const people = (await this.p.inscriptions.eligibleFor(v.callCode, ctx.modalities)).filter((p) => codes.has(p.applicantCode));
      const items = [];
      for (const p of people) {
        const m = await this.p.notify.render('RESULTADOS_DISPONIBLES', { nombre: p.firstNames, codigo: p.applicantCode, examen: ctx.name, enlace: `${this.d.frontendOrigin}/resultados` });
        items.push({ email: p.email, event: 'RESULTADOS_DISPONIBLES', ...m, dedupeKey: `resultados:${v.examId}:${p.applicantCode}` });
      }
      queued += await this.p.notify.enqueue(items);
      await this.d.db.resultVersion.update({ where: { id: v.id }, data: { notifiedAt: now } });
    }
    const end = await this.deliveryWindow();
    let lost = 0;
    if (end && now > end.lateEnd) {
      lost = (await this.d.db.admission.updateMany({ where: { status: 'PENDIENTE' }, data: { status: 'PERDIDA', note: 'No entregó documentos en el plazo (Art. 34).' } })).count;
    }
    return { queued, lost };
  }

  // ── H4: consulta del postulante (RF-09.08) ─────────────────────────
  private async visibleFor(modality: string) {
    const exam = (await this.p.exams.examList()).find((e) => e.modalities.includes(modality));
    if (!exam) return { exam: null, version: null };
    const version = await this.d.db.resultVersion.findFirst({ where: { examId: exam.id, status: 'PUBLICADA' } });
    return { exam, version };
  }

  async mine(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    await this.d.limiter.consume(`resultados:${meta.ipHash}`, 60, 3600);
    const ctx = await this.p.inscriptions.examContext(applicantCode, documentNumber);
    if (!ctx) throw notFound('Datos no encontrados. Revisa tu número de documento y tu código de postulante.');
    const base = { applicantCode, fullName: ctx.fullName, program: ctx.program, modality: MODALITY_LABEL[ctx.modality] ?? ctx.modality };
    const { exam, version } = await this.visibleFor(ctx.modality);
    if (!exam) return { ...base, state: 'NO_EXAM' as const, message: 'Tu modalidad no rinde examen en este proceso.' };
    const now = this.d.clock.now();
    if (!version || !version.publishAt || version.publishAt > now) {
      return { ...base, state: 'NOT_PUBLISHED' as const, exam: exam.name, message: version?.publishAt ? `Los resultados se publican el ${version.publishAt.toLocaleString('es-PE', { timeZone: 'America/Lima' })}.` : 'Los resultados se publican el mismo día del examen (Art. 30).' };
    }
    const r = await this.d.db.examResult.findUnique({ where: { versionId_applicantCode: { versionId: version.id, applicantCode } } });
    if (!r) return { ...base, state: 'NOT_IN_RESULTS' as const, exam: exam.name, message: 'No figuras en los resultados de este examen. Comunícate con la Dirección de Admisión.' };
    const ctxExam = await this.p.exams.gradingContext(exam.id);
    const s = ctxExam.scoring;
    const group = await this.d.db.examResult.count({ where: { versionId: version.id, optionCode: r.optionCode, quotaCategory: r.quotaCategory, rank: { not: null } } });
    const admission = r.condition === 'ADMITIDO' ? await this.d.db.admission.findUnique({ where: { applicantCode } }) : null;
    const window = await this.deliveryWindow();
    return {
      ...base, state: 'PUBLISHED' as const, exam: exam.name, version: version.version, message: null,
      score: r.score ? Number(r.score).toFixed(2) : null, rank: r.rank, groupSize: group, vacancies: (version.vacancies as Record<string, number>)[groupKey(r.optionCode, r.quotaCategory)] ?? 0,
      condition: r.condition, conditionLabel: CONDITION_LABEL[r.condition as Condition], minimum: s.puntajeMinimo,
      breakdown: r.knowledge === null ? null : [
        { label: 'Conocimientos', correct: r.knowledge, points: (r.knowledge * s.puntosConocimientos * (typeof s.factorArea === 'number' ? s.factorArea : (s.factorArea[ctx.area] ?? 1))).toFixed(2) },
        { label: 'Aptitud vocacional', correct: r.vocational, points: ((r.vocational ?? 0) * s.puntosTest).toFixed(2) },
        { label: 'Actitud personal', correct: r.attitude, points: ((r.attitude ?? 0) * s.puntosTest).toFixed(2) },
      ],
      admission: admission ? {
        status: admission.status, receivedAt: iso(admission.documentsReceivedAt), late: admission.late,
        deliveryFrom: iso(window?.start), deliveryTo: iso(window?.end), lateDay: iso(window?.lateEnd), fee: CONSTANCIA.toFixed(2), surcharge: RECARGO.toFixed(2),
      } : null,
    };
  }

  /** M10 (RF-10.08): resultado del postulante ya identificado, solo si está publicado. */
  async summaryFor(applicantCode: string) {
    const ctx = await this.p.inscriptions.examContext(applicantCode);
    if (!ctx) return null;
    const { exam, version } = await this.visibleFor(ctx.modality);
    if (!exam) return { publicado: false, detalle: 'Tu modalidad no rinde examen en este proceso.' };
    if (!version?.publishAt || version.publishAt > this.d.clock.now()) {
      return { publicado: false, detalle: version?.publishAt ? `Se publica el ${version.publishAt.toLocaleString('es-PE', { timeZone: 'America/Lima' })}.` : 'Se publica el mismo día del examen (Art. 30).' };
    }
    const r = await this.d.db.examResult.findUnique({ where: { versionId_applicantCode: { versionId: version.id, applicantCode } } });
    if (!r) return { publicado: true, detalle: 'No figuras en los resultados de este examen.' };
    const admission = await this.d.db.admission.findUnique({ where: { applicantCode } });
    return {
      publicado: true,
      puntaje: r.score ? Number(r.score).toFixed(2) : null, puesto: r.rank, condicion: CONDITION_LABEL[r.condition as Condition],
      ingreso: admission ? { PENDIENTE: 'debes entregar tus documentos y pagar la constancia de ingreso', INGRESANTE: 'eres ingresante', PERDIDA: 'perdiste la vacante por no entregar documentos en el plazo' }[admission.status] : null,
    };
  }

  /** H4-3: lista pública de admitidos sin DNI. */
  async admittedList(examCode: string, optionCode: string | undefined) {
    const exam = (await this.p.exams.examList()).find((e) => e.code === examCode);
    if (!exam) throw notFound('Examen no encontrado.');
    const version = await this.d.db.resultVersion.findFirst({ where: { examId: exam.id, status: 'PUBLICADA', publishAt: { lte: this.d.clock.now() } } });
    if (!version) return { exam: exam.name, published: false, rows: [] };
    const [rows, people] = await Promise.all([
      this.d.db.examResult.findMany({ where: { versionId: version.id, condition: 'ADMITIDO', ...(optionCode ? { optionCode } : {}) }, orderBy: [{ optionCode: 'asc' }, { rank: 'asc' }] }),
      this.p.inscriptions.eligibleFor(version.callCode, exam.modalities),
    ]);
    const who = new Map(people.map((p) => [p.applicantCode, p]));
    return {
      exam: exam.name, published: true, version: version.version,
      rows: rows.map((r) => ({ applicantCode: r.applicantCode, fullName: who.get(r.applicantCode)?.fullName ?? '', program: who.get(r.applicantCode)?.program ?? r.optionCode, quotaCategory: r.quotaCategory, score: Number(r.score).toFixed(2), rank: r.rank })),
    };
  }

  /** H7: solicitud de revisión por error material (RN-57: los resultados son inimpugnables). */
  async review(documentNumber: string, applicantCode: string, description: string, meta: RequestMeta) {
    const ctx = await this.p.inscriptions.examContext(applicantCode, documentNumber);
    if (!ctx) throw notFound('Datos no encontrados. Revisa tu número de documento y tu código de postulante.');
    const caseNumber = await this.p.support.createReview({
      name: ctx.fullName, email: ctx.email, message: `Solicitud de revisión de resultados (código ${applicantCode}, ${ctx.program}). Solo procede por error material.\n\n${description}`,
    }, meta.ipHash);
    return { caseNumber };
  }

  // ── H5: ingreso (RF-09.10, RN-54 a RN-56) ──────────────────────────
  private async deliveryWindow() {
    const call = await this.d.convocatorias.getCurrentCall();
    const regular = call.stages.find((s) => s.code === 'DELIVERY');
    const late = call.stages.find((s) => s.code === 'DELIVERY_EXT');
    if (!regular) return null;
    return { start: new Date(regular.startsAt), end: new Date(regular.endsAt), lateEnd: new Date((late ?? regular).endsAt) };
  }

  async admissions(f: { status?: string | undefined; q?: string | undefined }) {
    const rows = await this.d.db.admission.findMany({ where: f.status ? { status: f.status as 'PENDIENTE' } : {}, orderBy: { applicantCode: 'asc' } });
    const people = new Map<string, ResultPerson>();
    for (const code of rows.map((r) => r.applicantCode)) {
      const p = await this.p.inscriptions.examContext(code);
      if (p) people.set(code, p);
    }
    const q = f.q?.trim().toUpperCase();
    const window = await this.deliveryWindow();
    return {
      window: window ? { start: iso(window.start), end: iso(window.end), lateEnd: iso(window.lateEnd) } : null,
      rows: rows.map((r) => ({
        applicantCode: r.applicantCode, fullName: people.get(r.applicantCode)?.fullName ?? '', document: people.get(r.applicantCode)?.document ?? '',
        program: people.get(r.applicantCode)?.program ?? '', status: r.status, receivedAt: iso(r.documentsReceivedAt), receiptNumber: r.receiptNumber,
        late: r.late, amountPaid: r.amountPaid ? Number(r.amountPaid).toFixed(2) : null, note: r.note,
      })).filter((r) => !q || r.applicantCode.includes(q) || r.fullName.toUpperCase().includes(q) || r.document.includes(q)),
    };
  }

  /** H5-1, H5-2: entrega de documentos y pago de la constancia (S/ 15.00; con recargo de S/ 65.00 si es extemporánea). */
  async deliver(applicantCode: string, receiptNumber: string, actorId: string, meta: RequestMeta) {
    const a = await this.d.db.admission.findUnique({ where: { applicantCode } });
    if (!a) throw notFound('El postulante no tiene un trámite de ingreso (no es admitido).');
    if (a.status !== 'PENDIENTE') throw businessRule('ADMISSION_CLOSED', a.status === 'INGRESANTE' ? 'Ya es ingresante.' : 'Perdió la admisión: venció el plazo de entrega (Art. 34).');
    const w = await this.deliveryWindow();
    const now = this.d.clock.now();
    if (w && now < w.start) throw businessRule('DELIVERY_NOT_OPEN', `La entrega de documentos empieza el ${w.start.toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}.`);
    if (w && now > w.lateEnd) throw businessRule('DELIVERY_CLOSED', 'Venció el plazo de entrega: la admisión se pierde (Art. 34).');
    const late = Boolean(w && now > w.end);
    await this.d.db.$transaction(async (tx) => {
      await tx.admission.update({
        where: { applicantCode },
        data: { status: 'INGRESANTE', documentsReceivedAt: now, receivedBy: actorId, receiptNumber: receiptNumber.trim(), late, amountPaid: (CONSTANCIA + (late ? RECARGO : 0)).toFixed(2) },
      });
      await this.d.audit.record({ actorUserId: actorId, action: 'admission.delivered', resourceType: 'admission', resourceId: applicantCode, after: { late, receiptNumber }, ...meta }, tx);
    });
    return this.admissions({ q: applicantCode });
  }

  /** RF-09.10: constancia de ingreso con QR verificable, solo para ingresantes. */
  async certificate(applicantCode: string, documentNumber: string | undefined, meta: RequestMeta) {
    await this.d.limiter.consume(`constancia:${meta.ipHash}`, 30, 3600);
    const ctx = await this.p.inscriptions.examContext(applicantCode, documentNumber);
    if (!ctx) throw notFound('Datos no encontrados.');
    const a = await this.d.db.admission.findUnique({ where: { applicantCode } });
    if (a?.status !== 'INGRESANTE') throw businessRule('NOT_INGRESANTE', 'La constancia se emite cuando Admisión registra la entrega de tus documentos y el pago.');
    const { version } = await this.visibleFor(ctx.modality);
    const r = version ? await this.d.db.examResult.findUnique({ where: { versionId_applicantCode: { versionId: version.id, applicantCode } } }) : null;
    const call = await this.d.convocatorias.getCurrentCall();
    return admissionCertificatePdf({
      applicantCode, fullName: ctx.fullName, document: ctx.document, program: ctx.program, modality: MODALITY_LABEL[ctx.modality] ?? ctx.modality,
      score: r?.score ? Number(r.score).toFixed(2) : '-', rank: r?.rank ?? null, callName: call.name, issuedAt: this.d.clock.now(),
      photo: await this.d.storage.get(ctx.photoKey), verifyUrl: `${this.d.frontendOrigin}/verificar-ingreso/${applicantCode}.${this.sign(applicantCode)}`,
    });
  }

  async verify(token: string) {
    const [code, sig] = token.split('.');
    const ok = Boolean(code && sig && /^\d{8}$/.test(code) && sig.length === 16 && timingSafeEqual(Buffer.from(sig), Buffer.from(this.sign(code))));
    if (!ok) return { valid: false as const, reason: 'El código QR no corresponde a una constancia emitida por la UNSCH.' };
    const a = await this.d.db.admission.findUnique({ where: { applicantCode: code } });
    if (a?.status !== 'INGRESANTE') return { valid: false as const, reason: 'La constancia no está vigente.' };
    const ctx = await this.p.inscriptions.examContext(code!);
    return { valid: true as const, applicantCode: code!, name: ctx?.firstNames ?? '', program: ctx?.program ?? '', modality: MODALITY_LABEL[ctx?.modality ?? ''] ?? '' };
  }

  private sign(code: string) {
    return createHmac('sha256', this.d.secret).update(`ingreso:${code}`).digest('base64url').slice(0, 16);
  }

  // ── H6: reportes (RF-09.09, RF-12.07) ──────────────────────────────
  async reportRows(versionId: string) {
    const v = await this.version(versionId, {});
    const row = await this.d.db.resultVersion.findUniqueOrThrow({ where: { id: versionId } });
    const ctx = await this.p.exams.gradingContext(row.examId);
    const all = await this.d.db.examResult.findMany({ where: { versionId } });
    const people = new Map((await this.p.inscriptions.eligibleFor(row.callCode, ctx.modalities)).map((p) => [p.applicantCode, p]));
    const admissions = new Map((await this.d.db.admission.findMany({ where: { applicantCode: { in: all.map((r) => r.applicantCode) } } })).map((a) => [a.applicantCode, a.status]));
    return {
      v,
      results: all.map((r) => ({
        codigo: r.applicantCode, postulante: people.get(r.applicantCode)?.fullName ?? '', programa: people.get(r.applicantCode)?.program ?? r.optionCode, categoria: r.quotaCategory,
        conocimientos: r.knowledge ?? '', aptitud: r.vocational ?? '', actitud: r.attitude ?? '', puntaje: r.score ? Number(r.score).toFixed(2) : '', puesto: r.rank ?? '',
        condicion: CONDITION_LABEL[r.condition as Condition], ingreso: admissions.get(r.applicantCode) === 'INGRESANTE' ? 'Ingresante' : admissions.get(r.applicantCode) === 'PERDIDA' ? 'Admisión perdida' : admissions.get(r.applicantCode) ? 'Pendiente' : '',
      })).sort((a, b) => a.programa.localeCompare(b.programa, 'es') || Number(a.puesto || 1e9) - Number(b.puesto || 1e9)),
      coverage: v.coverage.map((c) => ({ programa: c.program, categoria: c.quotaCategory, vacantes: c.vacancies, admitidos: c.admitted, sin_cubrir: c.uncovered })),
    };
  }
}
