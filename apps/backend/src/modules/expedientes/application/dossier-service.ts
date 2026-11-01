import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db, Tx } from '../../../shared/db/prisma.js';
import type { Outbox } from '../../../shared/events/outbox.js';
import { AppError, businessRule, conflict, forbidden, notFound, validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import type { FileStorage } from '../../../shared/storage/file-storage.js';
import { presignApplicantUpload, readApplicantUpload } from '../../../shared/storage/uploads.js';
import type { ConvocatoriasQueries } from '../../convocatorias/index.js';
import { COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, OBSERVE_HOURS, REJECTION_HINT, type DossierStatus } from '../domain/dossier-rules.js';
import { MAX_DOCUMENT_BYTES, checkDocument } from '../domain/file-check.js';

export interface DossierContext {
  applicantCode: string; callCode: string; modality: string; status: string; submodality: string | null; categoryName: string;
  program: string; fullName: string; firstNames: string; email: string; documentType: string; documentNumber: string;
}

type Doc = Awaited<ReturnType<Db['dossierDocument']['findMany']>>[number];
type Row = NonNullable<Awaited<ReturnType<Db['dossier']['findUnique']>>>;

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
/** Última versión de cada requisito. */
function latest(docs: Doc[]): Map<string, Doc> {
  const m = new Map<string, Doc>();
  for (const d of docs) if (!m.has(d.requirementCode) || m.get(d.requirementCode)!.version < d.version) m.set(d.requirementCode, d);
  return m;
}

/**
 * M06 Expedientes (spec 004): el postulante arma y subsana su expediente; el evaluador lo dictamina.
 * El estado de la inscripción lo cambia M03 al recibir `ExpedienteDictaminado` (RN-24).
 */
export class DossierService {
  constructor(
    private readonly d: {
      db: Db;
      clock: Clock;
      outbox: Outbox;
      audit: AuditLog;
      limiter: RateLimiter;
      storage: FileStorage;
      convocatorias: ConvocatoriasQueries;
      inscriptions: { dossierContext(applicantCode: string, documentNumber?: string): Promise<DossierContext> };
      /** Personal con el rol de evaluador activo (para el reparto equitativo). */
      evaluators: () => Promise<{ id: string; name: string }[]>;
    },
  ) {}

  // ════════════════════════════════════════════════════════════════════
  // Postulante (DNI + código): Historias 1, 2 y 4
  // ════════════════════════════════════════════════════════════════════

  async view(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    await this.d.limiter.consume(`dossier:${meta.ipHash}`, 120, 3600);
    const { ctx, row } = await this.open(applicantCode, documentNumber);
    return this.present(ctx, await this.expire(row), false);
  }

  /**
   * ADR-010: con S3, el navegador sube el archivo directo al bucket con un formulario prefirmado (Lambda no
   * acepta cuerpos de más de 6 MB). Antes se comprueba que el documento todavía se pueda cargar.
   */
  async presignUpload(documentNumber: string, applicantCode: string, input: { requirementCode: string; contentType: string; size: number }, meta: RequestMeta) {
    await this.d.limiter.consume(`dossier-upload:${meta.ipHash}`, 60, 3600);
    await this.uploadTarget(documentNumber, applicantCode, input.requirementCode);
    return presignApplicantUpload(this.d.storage, 'expedientes', applicantCode, input.contentType, input.size, MAX_DOCUMENT_BYTES);
  }

  /** RF-04.04, RF-04.05: sube o reemplaza un documento; se valida el contenido real del archivo. */
  async upload(
    documentNumber: string, applicantCode: string,
    input: { requirementCode: string; fileName: string; contentBase64?: string | undefined; uploadKey?: string | undefined },
    meta: RequestMeta,
  ) {
    await this.d.limiter.consume(`dossier-upload:${meta.ipHash}`, 60, 3600);
    const { ctx, row, req, prev } = await this.uploadTarget(documentNumber, applicantCode, input.requirementCode);
    const buf = input.uploadKey
      ? await readApplicantUpload(this.d.storage, 'expedientes', applicantCode, input.uploadKey)
      : Buffer.from(input.contentBase64 ?? '', 'base64');
    const check = checkDocument(buf, req.acceptedFormats);
    if (!check.ok && input.uploadKey) await this.d.storage.delete(input.uploadKey).catch(() => undefined);
    if (!check.ok) throw validationError(check.reason, [{ field: 'file', issue: check.reason }]);
    const version = (prev?.version ?? 0) + 1;
    const fileKey = `expedientes/${ctx.callCode}/${applicantCode}/${req.code}-v${version}.${check.file.extension}`;
    await this.d.storage.put(fileKey, buf, check.file.mimeType);
    if (input.uploadKey) await this.d.storage.delete(input.uploadKey).catch(() => undefined);
    await this.d.db.$transaction(async (tx) => {
      if (prev) await tx.dossierDocument.update({ where: { id: prev.id }, data: { status: prev.status === 'OBSERVADO' ? 'REEMPLAZADO' : 'REEMPLAZADO' } });
      await tx.dossierDocument.create({
        data: {
          dossierId: row.id, requirementCode: req.code, version, fileKey, fileName: input.fileName.slice(0, 160),
          mimeType: check.file.mimeType, sizeBytes: check.file.sizeBytes, sha256: check.file.sha256,
        },
      });
      await this.event(tx, row.id, null, prev ? 'documento.reemplazado' : 'documento.cargado', `${req.name} (versión ${version})`);
    });
    return this.present(ctx, await this.d.db.dossier.findUniqueOrThrow({ where: { id: row.id } }), false);
  }

  /** Expediente, requisito y versión anterior de un documento que el postulante puede cargar ahora. */
  private async uploadTarget(documentNumber: string, applicantCode: string, requirementCode: string) {
    const { ctx, row: current } = await this.open(applicantCode, documentNumber);
    const row = await this.expire(current);
    const requirements = await this.requirements(ctx);
    const req = requirements.find((r) => r.code === requirementCode);
    if (!req) throw validationError('Ese documento no corresponde a tu submodalidad.', [{ field: 'requirementCode', issue: 'no aplica' }]);
    const docs = await this.d.db.dossierDocument.findMany({ where: { dossierId: row.id } });
    const prev = latest(docs).get(req.code);
    if (row.status === 'OBSERVADO') {
      if (prev?.status !== 'OBSERVADO') throw businessRule('NOT_OBSERVED', 'Solo puedes reemplazar los documentos observados.');
    } else if (row.status !== 'BORRADOR') {
      throw businessRule('DOSSIER_LOCKED', `Tu expediente está «${DOSSIER_STATUS_LABEL[row.status as DossierStatus]}»: no se puede modificar.`);
    }
    return { ctx, row, req, prev };
  }

  /** FR-014: datos complementarios de la submodalidad. */
  async saveComplementary(documentNumber: string, applicantCode: string, values: Record<string, string>, meta: RequestMeta) {
    await this.d.limiter.consume(`dossier:${meta.ipHash}`, 120, 3600);
    const { ctx, row } = await this.open(applicantCode, documentNumber);
    if (row.status !== 'BORRADOR' && row.status !== 'OBSERVADO') throw businessRule('DOSSIER_LOCKED', 'Tu expediente ya fue enviado.');
    const fields = COMPLEMENTARY_FIELDS[row.submodality] ?? [];
    const clean = Object.fromEntries(fields.map((f) => [f.key, String(values[f.key] ?? '').trim().slice(0, 200)]));
    const updated = await this.d.db.dossier.update({ where: { id: row.id }, data: { complementary: clean } });
    return this.present(ctx, updated, false);
  }

  /** Historia 2, escenarios 2 y 4; Historia 4, escenario 2: enviar (o reenviar) a revisión. */
  async submit(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    const { ctx, row: current } = await this.open(applicantCode, documentNumber);
    const row = await this.expire(current);
    if (row.status !== 'BORRADOR' && row.status !== 'OBSERVADO') {
      throw businessRule('DOSSIER_LOCKED', `Tu expediente está «${DOSSIER_STATUS_LABEL[row.status as DossierStatus]}».`);
    }
    const requirements = await this.requirements(ctx);
    const last = latest(await this.d.db.dossierDocument.findMany({ where: { dossierId: row.id } }));
    const missing = requirements.filter((r) => r.mandatory && !last.get(r.code));
    if (missing.length) {
      throw new AppError(422, 'DOSSIER_INCOMPLETE', `Falta cargar: ${missing.map((m) => m.name).join('; ')}.`, { missing: missing.map((m) => m.code) });
    }
    const stillObserved = [...last.values()].filter((d) => d.status === 'OBSERVADO');
    if (stillObserved.length) throw businessRule('STILL_OBSERVED', 'Reemplaza todos los documentos observados antes de reenviar.');
    const fields = COMPLEMENTARY_FIELDS[row.submodality] ?? [];
    const comp = row.complementary as Record<string, string>;
    const missingData = fields.filter((f) => !comp[f.key]);
    if (missingData.length) throw businessRule('COMPLEMENTARY_MISSING', `Completa tus datos: ${missingData.map((f) => f.label).join('; ')}.`);

    const resubmitted = row.status === 'OBSERVADO';
    const evaluatorId = row.evaluatorId ?? (await this.pickEvaluator());
    await this.d.db.$transaction(async (tx) => {
      await tx.dossier.update({ where: { id: row.id }, data: { status: 'EN_REVISION', submittedAt: this.d.clock.now(), evaluatorId, observeDeadline: null } });
      await this.event(tx, row.id, null, resubmitted ? 'expediente.reenviado' : 'expediente.enviado', evaluatorId ? 'Asignado a un evaluador' : 'En espera de asignación');
      await this.d.outbox.publish(tx, 'ExpedienteEnviado', { applicantCode, email: ctx.email, firstNames: ctx.firstNames, resubmitted }, meta.requestId);
    });
    this.d.outbox.kick();
    return this.present(ctx, await this.d.db.dossier.findUniqueOrThrow({ where: { id: row.id } }), false);
  }

  async ownFile(documentNumber: string, applicantCode: string, documentId: string) {
    const { row } = await this.open(applicantCode, documentNumber);
    return this.file(row.id, documentId);
  }

  // ════════════════════════════════════════════════════════════════════
  // Evaluador (panel): Historias 3 y 7, FR-015
  // ════════════════════════════════════════════════════════════════════

  /** Bandeja: el evaluador ve solo lo asignado a él; Admisión y el administrador ven todo (H3, escenario 1). */
  async queue(actor: { userId: string; seesAll: boolean }, f: { status?: string | undefined; submodality?: string | undefined; mine?: boolean | undefined }) {
    const rows = await this.d.db.dossier.findMany({
      where: {
        ...(f.status ? { status: f.status as DossierStatus } : { status: { not: 'BORRADOR' } }),
        ...(f.submodality ? { submodality: f.submodality } : {}),
        ...(!actor.seesAll || f.mine ? { evaluatorId: actor.userId } : {}),
      },
      orderBy: [{ submittedAt: 'asc' }],
      take: 200,
    });
    const evaluators = new Map((await this.d.evaluators()).map((e) => [e.id, e.name]));
    return Promise.all(rows.map(async (r) => {
      const ctx = await this.d.inscriptions.dossierContext(r.applicantCode);
      return {
        id: r.id, applicantCode: r.applicantCode, fullName: ctx.fullName, submodality: r.submodality, category: ctx.categoryName, program: ctx.program,
        status: r.status, statusLabel: DOSSIER_STATUS_LABEL[r.status as DossierStatus], submittedAt: iso(r.submittedAt),
        evaluator: r.evaluatorId ? (evaluators.get(r.evaluatorId) ?? 'Otro evaluador') : null, observeDeadline: iso(r.observeDeadline),
      };
    }));
  }

  async detail(id: string, actor: { userId: string; seesAll: boolean }) {
    const row = await this.d.db.dossier.findUnique({ where: { id } });
    if (!row) throw notFound('Expediente no encontrado.');
    this.ensureAccess(row, actor);
    const ctx = await this.d.inscriptions.dossierContext(row.applicantCode);
    return { ...(await this.present(ctx, await this.expire(row), true)), id: row.id, evaluators: actor.seesAll ? await this.d.evaluators() : [] };
  }

  /** RF-06.02: descarga del personal, auditada. */
  async staffFile(id: string, documentId: string, actor: { userId: string; seesAll: boolean }, meta: RequestMeta) {
    const row = await this.d.db.dossier.findUnique({ where: { id } });
    if (!row) throw notFound('Expediente no encontrado.');
    this.ensureAccess(row, actor);
    const f = await this.file(row.id, documentId);
    await this.d.audit.record({ actorUserId: actor.userId, action: 'dossier.file_downloaded', resourceType: 'dossier_document', resourceId: documentId, after: { applicantCode: row.applicantCode }, ...meta });
    return f;
  }

  /** H3, escenario 2: Conforme u Observado (con motivo obligatorio) por documento (RF-06.04). */
  async reviewDocument(id: string, documentId: string, verdict: 'CONFORME' | 'OBSERVADO', note: string | undefined, actor: { userId: string; seesAll: boolean }) {
    const row = await this.d.db.dossier.findUnique({ where: { id } });
    if (!row) throw notFound('Expediente no encontrado.');
    this.ensureAccess(row, actor);
    if (row.status !== 'EN_REVISION') throw businessRule('NOT_IN_REVIEW', 'Solo se revisan expedientes «En revisión».');
    if (verdict === 'OBSERVADO' && !note?.trim()) throw validationError('Escribe el motivo de la observación.', [{ field: 'note', issue: 'obligatorio' }]);
    const doc = await this.d.db.dossierDocument.findFirst({ where: { id: documentId, dossierId: id } });
    if (!doc || doc.status === 'REEMPLAZADO') throw notFound('Documento no encontrado o reemplazado.');
    await this.d.db.$transaction(async (tx) => {
      await tx.dossierDocument.update({ where: { id: doc.id }, data: { status: verdict, note: verdict === 'OBSERVADO' ? note!.trim() : null, reviewedAt: this.d.clock.now(), reviewerId: actor.userId } });
      await this.event(tx, id, actor.userId, verdict === 'CONFORME' ? 'documento.conforme' : 'documento.observado', `${doc.requirementCode}${note ? `: ${note}` : ''}`);
    });
    return this.detail(id, actor);
  }

  /** H3, escenarios 3 a 5 (RF-04.07, RF-04.09, RF-06.07): Autorizar · Observar · Rechazar. */
  async decide(id: string, decision: 'AUTORIZAR' | 'OBSERVAR' | 'RECHAZAR', note: string | undefined, actor: { userId: string; seesAll: boolean }, meta: RequestMeta) {
    const row = await this.d.db.dossier.findUnique({ where: { id } });
    if (!row) throw notFound('Expediente no encontrado.');
    this.ensureAccess(row, actor);
    if (row.status !== 'EN_REVISION') throw businessRule('NOT_IN_REVIEW', 'Solo se dictaminan expedientes «En revisión».');
    const ctx = await this.d.inscriptions.dossierContext(row.applicantCode);
    const requirements = await this.requirements(ctx);
    const last = latest(await this.d.db.dossierDocument.findMany({ where: { dossierId: id } }));
    const mandatory = requirements.filter((r) => r.mandatory);
    const observed = [...last.values()].filter((d) => d.status === 'OBSERVADO');
    const now = this.d.clock.now();
    let status: DossierStatus;
    let deadline: Date | null = null;
    if (decision === 'AUTORIZAR') {
      const notOk = mandatory.filter((r) => last.get(r.code)?.status !== 'CONFORME');
      if (notOk.length) throw businessRule('NOT_ALL_CONFORMING', `Para autorizar, todos los documentos deben estar conformes. Falta: ${notOk.map((r) => r.name).join('; ')}.`);
      status = 'AUTORIZADO';
    } else if (decision === 'OBSERVAR') {
      if (!observed.length) throw businessRule('NOTHING_OBSERVED', 'Marca al menos un documento como observado.');
      status = 'OBSERVADO';
      deadline = await this.observeDeadline(now);
    } else {
      if (!note?.trim()) throw validationError('Escribe el motivo del rechazo.', [{ field: 'note', issue: 'obligatorio' }]);
      status = 'RECHAZADO';
    }
    const reqName = new Map(requirements.map((r) => [r.code, r.name]));
    await this.d.db.$transaction(async (tx) => {
      await tx.dossier.update({ where: { id }, data: { status, decidedAt: now, decisionNote: note?.trim() || null, observeDeadline: deadline } });
      await this.event(tx, id, actor.userId, `expediente.${status.toLowerCase()}`, note?.trim() || null);
      await this.d.audit.record({ actorUserId: actor.userId, action: 'dossier.decided', resourceType: 'dossier', resourceId: row.applicantCode, before: { status: row.status }, after: { status, note: note ?? null }, ...meta }, tx);
      await this.d.outbox.publish(tx, 'ExpedienteDictaminado', {
        applicantCode: row.applicantCode, email: ctx.email, firstNames: ctx.firstNames, decision: status as 'AUTORIZADO' | 'OBSERVADO' | 'RECHAZADO',
        note: status === 'RECHAZADO' ? `${note!.trim()} ${REJECTION_HINT}` : (note?.trim() || null), deadline: iso(deadline),
        observed: observed.map((d) => `${reqName.get(d.requirementCode) ?? d.requirementCode}: ${d.note ?? ''}`),
      }, meta.requestId);
    });
    this.d.outbox.kick();
    return this.detail(id, actor);
  }

  /** Historia 7: verificación presencial de los documentos físicos, con responsable (FR-012). */
  async verifyInPerson(id: string, note: string, actor: { userId: string; seesAll: boolean }, meta: RequestMeta) {
    const row = await this.d.db.dossier.findUnique({ where: { id } });
    if (!row) throw notFound('Expediente no encontrado.');
    this.ensureAccess(row, actor);
    if (row.status === 'AUTORIZADO' || row.status === 'RECHAZADO') throw businessRule('ALREADY_DECIDED', 'El expediente ya tiene dictamen.');
    const ctx = await this.d.inscriptions.dossierContext(row.applicantCode);
    const now = this.d.clock.now();
    await this.d.db.$transaction(async (tx) => {
      await tx.dossier.update({ where: { id }, data: { status: 'AUTORIZADO', verifiedInPerson: true, decidedAt: now, decisionNote: note, evaluatorId: row.evaluatorId ?? actor.userId } });
      await this.event(tx, id, actor.userId, 'expediente.verificado_presencialmente', note);
      await this.d.audit.record({ actorUserId: actor.userId, action: 'dossier.verified_in_person', resourceType: 'dossier', resourceId: row.applicantCode, after: { note }, ...meta }, tx);
      await this.d.outbox.publish(tx, 'ExpedienteDictaminado', {
        applicantCode: row.applicantCode, email: ctx.email, firstNames: ctx.firstNames, decision: 'AUTORIZADO', note: 'Verificado presencialmente en la Dirección de Admisión.', deadline: null, observed: [],
      }, meta.requestId);
    });
    this.d.outbox.kick();
    return this.detail(id, actor);
  }

  /** RF-06.03: asignación manual (Admisión). */
  async assign(id: string, evaluatorId: string, actor: { userId: string }, meta: RequestMeta) {
    const row = await this.d.db.dossier.findUnique({ where: { id } });
    if (!row) throw notFound('Expediente no encontrado.');
    const evaluators = await this.d.evaluators();
    if (!evaluators.some((e) => e.id === evaluatorId)) throw validationError('Esa persona no es evaluadora activa.', [{ field: 'evaluatorId', issue: 'no evaluador' }]);
    await this.d.db.$transaction(async (tx) => {
      await tx.dossier.update({ where: { id }, data: { evaluatorId } });
      await this.event(tx, id, actor.userId, 'expediente.asignado', evaluators.find((e) => e.id === evaluatorId)!.name);
      await this.d.audit.record({ actorUserId: actor.userId, action: 'dossier.assigned', resourceType: 'dossier', resourceId: row.applicantCode, before: { evaluatorId: row.evaluatorId }, after: { evaluatorId }, ...meta }, tx);
    });
  }

  /** RF-04.12, FR-015: evaluación o adecuación especial programada para el postulante. */
  async scheduleSpecial(id: string, input: { date: string; place: string; note: string }, actor: { userId: string; seesAll: boolean }) {
    const row = await this.d.db.dossier.findUnique({ where: { id } });
    if (!row) throw notFound('Expediente no encontrado.');
    this.ensureAccess(row, actor);
    await this.d.db.$transaction(async (tx) => {
      await tx.dossier.update({ where: { id }, data: { specialEvaluation: input } });
      await this.event(tx, id, actor.userId, 'expediente.evaluacion_especial', `${input.date} · ${input.place} · ${input.note}`);
    });
    return this.detail(id, actor);
  }

  /** M10 (RF-10.06): resumen del expediente para el asistente, del postulante ya identificado. */
  async summaryFor(applicantCode: string) {
    const row = await this.d.db.dossier.findUnique({ where: { applicantCode }, include: { documents: true } });
    if (!row) return null;
    const fresh = await this.expire(row);
    const ctx = await this.d.inscriptions.dossierContext(applicantCode);
    const names = new Map((await this.requirements(ctx)).map((r) => [r.code, r.name]));
    const observed = [...latest(row.documents).values()].filter((d) => d.status === 'OBSERVADO').map((d) => `${names.get(d.requirementCode) ?? d.requirementCode}: ${d.note ?? 'observado'}`);
    return {
      estado: DOSSIER_STATUS_LABEL[fresh.status as DossierStatus],
      documentosObservados: observed,
      plazoSubsanacion: fresh.status === 'OBSERVADO' && fresh.observeDeadline ? fresh.observeDeadline.toISOString() : null,
      dictamen: fresh.decisionNote,
    };
  }

  /** RF-12.04: expedientes por estado. */
  async stats() {
    const g = await this.d.db.dossier.groupBy({ by: ['status'], _count: { _all: true } });
    return g.map((x) => ({ key: x.status, label: DOSSIER_STATUS_LABEL[x.status as DossierStatus], count: x._count._all }));
  }

  // ── Auxiliares ────────────────────────────────────────────────────────

  /** Abre (o crea) el expediente de una inscripción de exonerado. */
  private async open(applicantCode: string, documentNumber: string) {
    const ctx = await this.d.inscriptions.dossierContext(applicantCode, documentNumber);
    if (ctx.modality !== 'EXO' || !ctx.submodality) throw businessRule('NOT_EXEMPT', 'El expediente es solo para la modalidad Exonerados.');
    if (ctx.status === 'ANULADA') throw businessRule('ANNULLED', 'La inscripción está anulada.');
    const row = await this.d.db.dossier.upsert({
      where: { applicantCode },
      create: { applicantCode, callCode: ctx.callCode, submodality: ctx.submodality },
      update: {},
    });
    return { ctx, row };
  }

  /** H4, escenario 3: con el plazo vencido sin subsanar, el expediente pasa a «No subsanado». */
  private async expire(row: Row): Promise<Row> {
    if (row.status !== 'OBSERVADO' || !row.observeDeadline || row.observeDeadline > this.d.clock.now()) return row;
    const ctx = await this.d.inscriptions.dossierContext(row.applicantCode);
    const updated = await this.d.db.$transaction(async (tx) => {
      const u = await tx.dossier.update({ where: { id: row.id }, data: { status: 'NO_SUBSANADO' } });
      await this.event(tx, row.id, null, 'expediente.no_subsanado', 'Venció el plazo de subsanación');
      await this.d.outbox.publish(tx, 'ExpedienteDictaminado', {
        applicantCode: row.applicantCode, email: ctx.email, firstNames: ctx.firstNames, decision: 'NO_SUBSANADO', note: 'Venció el plazo para subsanar.', deadline: null, observed: [],
      });
      return u;
    });
    this.d.outbox.kick();
    return updated;
  }

  private async requirements(ctx: DossierContext) {
    return this.d.convocatorias.listRequirements(ctx.callCode, ctx.submodality ?? undefined);
  }

  /** Reparto equitativo: el evaluador activo con menos expedientes en revisión (RF-06.03). */
  private async pickEvaluator(): Promise<string | null> {
    const evaluators = await this.d.evaluators();
    if (!evaluators.length) return null;
    const load = await this.d.db.dossier.groupBy({ by: ['evaluatorId'], where: { status: 'EN_REVISION', evaluatorId: { in: evaluators.map((e) => e.id) } }, _count: { _all: true } });
    const count = new Map(load.map((l) => [l.evaluatorId, l._count._all]));
    return [...evaluators].sort((a, b) => (count.get(a.id) ?? 0) - (count.get(b.id) ?? 0) || a.name.localeCompare(b.name))[0]!.id;
  }

  /** 72 horas, sin pasar el fin de la última etapa de inscripción de exonerados en curso o próxima. */
  private async observeDeadline(now: Date): Promise<Date> {
    const call = await this.d.convocatorias.getCurrentCall();
    const ends = call.stages.filter((s) => s.scope === 'EXO' && (s.kind === 'REGULAR' || s.kind === 'EXTEMPORANEOUS') && s.status !== 'FINISHED').map((s) => new Date(s.endsAt).getTime());
    const limit = now.getTime() + OBSERVE_HOURS * 3600_000;
    return new Date(ends.length ? Math.min(limit, Math.max(...ends)) : limit);
  }

  private ensureAccess(row: Row, actor: { userId: string; seesAll: boolean }) {
    if (!actor.seesAll && row.evaluatorId !== actor.userId) throw forbidden('Este expediente está asignado a otro evaluador.');
  }

  private async file(dossierId: string, documentId: string) {
    const doc = await this.d.db.dossierDocument.findFirst({ where: { id: documentId, dossierId } });
    if (!doc) throw notFound('Documento no encontrado.');
    // Con S3, un enlace temporal: el archivo no pasa por la Lambda (límite de 6 MB en la respuesta).
    if (this.d.storage.presignDownload) return { url: await this.d.storage.presignDownload(doc.fileKey, doc.fileName, doc.mimeType) };
    const content = await this.d.storage.get(doc.fileKey);
    if (!content) throw conflict('FILE_MISSING', 'El archivo no está disponible en el almacenamiento.');
    return { content, mimeType: doc.mimeType, fileName: doc.fileName };
  }

  private event(tx: Tx, dossierId: string, actorUserId: string | null, action: string, note: string | null) {
    return tx.dossierEvent.create({ data: { dossierId, actorUserId, action, note: note?.slice(0, 600) ?? null } });
  }

  /** Vista del expediente: requisitos con su última versión; el personal ve además todas las versiones. */
  private async present(ctx: DossierContext, row: Row, staff: boolean) {
    const [requirements, docs, events, subs] = await Promise.all([
      this.requirements(ctx),
      this.d.db.dossierDocument.findMany({ where: { dossierId: row.id }, orderBy: [{ requirementCode: 'asc' }, { version: 'desc' }] }),
      this.d.db.dossierEvent.findMany({ where: { dossierId: row.id }, orderBy: { at: 'asc' } }),
      this.d.convocatorias.listSubmodalities(ctx.callCode),
    ]);
    const last = latest(docs);
    const status = row.status as DossierStatus;
    const doc = (d: Doc) => ({ id: d.id, version: d.version, fileName: d.fileName, mimeType: d.mimeType, sizeBytes: d.sizeBytes, sha256: d.sha256, status: d.status, note: d.note, uploadedAt: d.uploadedAt.toISOString() });
    return {
      applicantCode: row.applicantCode,
      ...(staff ? { fullName: ctx.fullName, document: `${ctx.documentType} ${ctx.documentNumber}`, inscriptionStatus: ctx.status } : {}),
      submodality: row.submodality, category: ctx.categoryName, program: ctx.program,
      status, statusLabel: DOSSIER_STATUS_LABEL[status],
      editable: status === 'BORRADOR' || status === 'OBSERVADO',
      submittedAt: iso(row.submittedAt), decidedAt: iso(row.decidedAt), decisionNote: row.decisionNote,
      observeDeadline: iso(row.observeDeadline), verifiedInPerson: row.verifiedInPerson,
      specialEvaluation: row.specialEvaluation as { date: string; place: string; note: string } | null,
      complementaryFields: COMPLEMENTARY_FIELDS[row.submodality] ?? [],
      evaluationCriteria: subs.find((s) => s.code === row.submodality)?.evaluationCriteria ?? null,
      complementary: row.complementary as Record<string, string>,
      requirements: requirements.map((r) => {
        const d = last.get(r.code);
        return {
          code: r.code, name: r.name, description: r.description, article: r.article, mandatory: r.mandatory, acceptedFormats: r.acceptedFormats,
          current: d ? doc(d) : null,
          ...(staff ? { history: docs.filter((x) => x.requirementCode === r.code && x.id !== d?.id).map(doc) } : {}),
        };
      }),
      events: events.map((e) => ({ action: e.action, note: e.note, at: e.at.toISOString(), byStaff: Boolean(e.actorUserId) })),
    };
  }
}
