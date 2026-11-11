import type { Db } from '../../../shared/db/prisma.js';
import { normalizeForSearch } from '../../../shared/text/normalize.js';
import type { ConvocatoriasQueries } from '../../convocatorias/index.js';
import type { ToolSpec } from '../domain/ports.js';

/** Resultado de una herramienta: datos reales + fuente que el asistente debe citar. */
export interface ToolResult {
  data: Record<string, unknown>;
  sources: string[];
  /** La herramienta no encontró nada: cuenta como respuesta sin información verificada. */
  empty?: boolean;
}

export interface ToolDeps {
  db: Db;
  convocatorias: ConvocatoriasQueries;
  inscriptions: { processSnapshot(applicantCode: string): Promise<Record<string, unknown> | null> };
  payments: { orderSummary(applicantCode: string): Promise<Record<string, unknown>> };
  /** M06, M08 y M09 (RF-10.06 a RF-10.08): avance real del postulante identificado. */
  progress?: {
    dossier(applicantCode: string): Promise<{ estado: string; documentosObservados: string[]; plazoSubsanacion: string | null; dictamen: string | null } | null>;
    room(applicantCode: string): Promise<{ publicada: boolean; detalle: string } | null>;
    result(applicantCode: string): Promise<{ publicado: boolean; detalle?: string; puntaje?: string | null; puesto?: number | null; condicion?: string; ingreso?: string | null } | null>;
  };
}

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const ESTADO_ETAPA = { UPCOMING: 'próxima', IN_PROGRESS: 'en curso', FINISHED: 'finalizada' } as const;
const STOP = new Set(['que', 'cual', 'cuales', 'como', 'para', 'por', 'con', 'una', 'uno', 'los', 'las', 'del', 'mis', 'tengo', 'puedo', 'debo', 'esta', 'este', 'hay', 'quiero', 'saber', 'donde', 'cuando']);

/** Palabras útiles de una consulta, sin tildes ni palabras vacías; se comparan por su raíz (5 letras). */
function terms(text: string): string[] {
  return normalizeForSearch(text).replace(/[^a-z0-9ñ ]/g, ' ').split(' ').filter((w) => w.length >= 3 && !STOP.has(w));
}

/** Herramientas del asistente (ADR-017): leen la base de datos por las API públicas de los módulos. */
export class AssistantTools {
  constructor(private readonly d: ToolDeps) {}

  specs(): ToolSpec[] {
    const fn = (name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []): ToolSpec => ({
      type: 'function',
      function: { name, description, parameters: { type: 'object', properties, required, additionalProperties: false } },
    });
    return [
      fn('buscar_conocimiento', 'Busca en la base de conocimientos oficial (reglamento, pasos, examen, cómo y dónde pagar, contacto). Úsala para cualquier duda general y para todo «cómo» o «dónde».',
        { consulta: { type: 'string', description: 'La duda del postulante en pocas palabras' } }, ['consulta']),
      fn('consultar_cronograma', 'Fechas oficiales de cada etapa de la convocatoria vigente (inscripciones, exámenes, publicación, entrega de constancias) y su estado.'),
      fn('consultar_tasas', 'Montos oficiales del derecho de inscripción por modalidad y tipo de colegio, recargos y otros pagos (Tabla N.° 3). Solo montos: para cómo y dónde pagar, usa buscar_conocimiento.'),
      fn('consultar_vacantes', 'Vacantes de un programa de estudios en la convocatoria vigente.',
        { programa: { type: 'string', description: 'Nombre o parte del nombre del programa, p. ej. "medicina" o "sistemas"' } }, ['programa']),
      fn('consultar_requisitos', 'Requisitos documentales generales y de las submodalidades de exonerados.'),
      fn('estado_de_mi_proceso', 'Estado del proceso del postulante identificado: inscripción, pago, documentos, aula y resultado. Devuelve NO_IDENTIFICADO si no se identificó con «Consultar mi proceso».'),
    ];
  }

  async run(name: string, args: Record<string, unknown>, ctx: { applicantCode: string | null }): Promise<ToolResult> {
    switch (name) {
      case 'buscar_conocimiento': return this.knowledge(String(args['consulta'] ?? ''));
      case 'consultar_cronograma': return this.schedule();
      case 'consultar_tasas': return this.fees();
      case 'consultar_vacantes': return this.vacancies(String(args['programa'] ?? ''));
      case 'consultar_requisitos': return this.requirements();
      case 'estado_de_mi_proceso': return this.myProcess(ctx.applicantCode);
      default: return { data: { error: 'HERRAMIENTA_DESCONOCIDA' }, sources: [], empty: true };
    }
  }

  async knowledge(query: string): Promise<ToolResult> {
    const words = terms(query);
    const entries = await this.d.db.knowledgeEntry.findMany({ where: { active: true } });
    const scored = entries
      .map((e) => {
        const hay = e.keywords;
        const score = words.reduce((s, w) => s + (hay.includes(w) ? 2 : hay.includes(w.slice(0, 5)) ? 1 : 0), 0);
        return { e, score };
      })
      .filter((x) => x.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    if (!scored.length) return { data: { resultados: [] }, sources: [], empty: true };
    return {
      data: { resultados: scored.map(({ e }) => ({ pregunta: e.question, respuesta: e.answer, fuente: e.source })) },
      sources: [...new Set(scored.slice(0, 1).map(({ e }) => e.source))],
    };
  }

  async schedule(): Promise<ToolResult> {
    const call = await this.d.convocatorias.getCurrentCall();
    return {
      data: {
        convocatoria: call.name,
        etapas: call.stages.map((s) => ({ etapa: s.name, desde: fecha(s.startsAt), hasta: fecha(s.endsAt), estado: ESTADO_ETAPA[s.status] })),
      },
      sources: [`Cronograma del Concurso de Admisión ${call.code}`],
    };
  }

  async fees(): Promise<ToolResult> {
    const call = await this.d.convocatorias.getCurrentCall();
    const fees = await this.d.convocatorias.listFees(call.code);
    return {
      data: { tasas: fees.map((f) => ({ concepto: f.concept, monto: `S/ ${f.amount}`, tipo: f.kind, referencia: f.legalNote })) },
      sources: [`Tabla N.° 3 de tasas, Prospecto de Admisión ${call.code}`],
    };
  }

  async vacancies(program: string): Promise<ToolResult> {
    const call = await this.d.convocatorias.getCurrentCall();
    const words = terms(program);
    let found = (await this.d.convocatorias.searchOptions(call.code, { q: words.join(' ') })).data;
    if (!found.length && words.length > 1) {
      // Si la frase completa no coincide, prueba palabra por palabra ("medicina humana" → "medicina").
      for (const w of words) {
        found = (await this.d.convocatorias.searchOptions(call.code, { q: w })).data;
        if (found.length) break;
      }
    }
    if (!found.length) return { data: { programas: [], nota: 'No hay un programa con ese nombre en la convocatoria vigente.' }, sources: [], empty: true };
    return {
      data: {
        programas: found.slice(0, 5).map((o) => ({ programa: o.displayName, area: o.area, vacantesOrdinario: o.ordinaryVacancies, vacantesTotales: o.totalVacancies })),
      },
      sources: [`Cuadro de vacantes, Concurso de Admisión ${call.code}`],
    };
  }

  async requirements(): Promise<ToolResult> {
    const call = await this.d.convocatorias.getCurrentCall();
    const [base, subs] = await Promise.all([this.d.convocatorias.listRequirements(call.code), this.d.convocatorias.listSubmodalities(call.code)]);
    return {
      data: {
        requisitosGenerales: base.filter((r) => r.isBase).map((r) => ({ requisito: r.name, articulo: r.article })),
        submodalidadesExonerados: subs.filter((s) => s.modality === 'EXO').map((s) => s.name),
        detalle: 'Los requisitos de cada submodalidad están en la página «Requisitos».',
      },
      sources: [`Requisitos del Concurso de Admisión ${call.code}`],
    };
  }

  async myProcess(applicantCode: string | null): Promise<ToolResult> {
    if (!applicantCode) {
      return { data: { error: 'NO_IDENTIFICADO', indicacion: 'Pide al postulante que pulse «Consultar mi proceso» e ingrese su DNI y código en ese formulario.' }, sources: [] };
    }
    const snap = await this.d.inscriptions.processSnapshot(applicantCode);
    if (!snap) return { data: { error: 'SIN_INSCRIPCION' }, sources: [], empty: true };
    const pago = await this.d.payments.orderSummary(applicantCode);
    const examIso = snap['fechaExamenIso'] as string | null;
    const aulaIso = examIso ? new Date(new Date(examIso).getTime() - 24 * 3600_000).toISOString() : null;
    const { fechaExamenIso: _omit, ...inscripcion } = snap;
    const [dossier, room, result] = await Promise.all([
      this.d.progress?.dossier(applicantCode).catch(() => null) ?? null,
      this.d.progress?.room(applicantCode).catch(() => null) ?? null,
      this.d.progress?.result(applicantCode).catch(() => null) ?? null,
    ]);
    return {
      data: {
        inscripcion,
        pago,
        documentos: {
          fotografia: snap['fotografiaRecibida'] ? 'Recibida con la inscripción' : 'No recibida',
          observaciones: dossier
            ? (dossier.documentosObservados.length ? `Documentos observados: ${dossier.documentosObservados.join('; ')}.` : 'No hay documentos observados.')
            : 'No hay observaciones registradas en tus documentos.',
        },
        ...(dossier ? {
          expediente: {
            estado: dossier.estado,
            plazoSubsanacion: dossier.plazoSubsanacion ? fecha(dossier.plazoSubsanacion) : null,
            dictamen: dossier.dictamen,
          },
        } : {}),
        aula: room ?? { publicada: false, detalle: aulaIso ? `Se publica 24 horas antes del examen (${fecha(aulaIso)}).` : 'Se publica según el cronograma.' },
        resultado: result ?? { publicado: false, detalle: snap['fechaExamen'] ? `Se publica el mismo día del examen (${snap['fechaExamen']}).` : 'Se publica según el cronograma.' },
      },
      sources: ['Sistema de Admisión UNSCH - datos de tu inscripción'],
    };
  }
}
