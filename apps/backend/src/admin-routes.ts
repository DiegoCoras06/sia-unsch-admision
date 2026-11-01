/**
 * Panel administrativo (spec 008, ADR-018 §5): capa de presentación `/api/v1/admin/*`.
 * Cada ruta declara su permiso (verificado en el servidor y auditado si se niega) y llama a la
 * API pública del módulo dueño del dato. Aquí no hay reglas de negocio.
 */
import type { CepreAwardees } from './modules/inscripciones/application/cepre-awardees.js';
import type { VacancyImport } from './modules/convocatorias/index.js';
import type { Request, RequestHandler, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { RequestMeta } from './shared/audit/audit.js';
import { handle } from './shared/http/middleware.js';
import { parse } from './shared/http/validate.js';
import type { AssistantService, KnowledgeAdmin } from './modules/asistente/index.js';
import type { ContentAdmin, SiteAssets } from './modules/configuracion/index.js';
import type { CallAdmin, CatalogAdmin } from './modules/convocatorias/index.js';
import type { InscriptionService } from './modules/inscripciones/application/inscription-service.js';
import type { ApplicationDocuments } from './modules/inscripciones/index.js';
import { ATTENDANCE_COLUMNS, DOSSIER_COLUMNS, INSCRIPTION_COLUMNS, PAYMENT_COLUMNS, type Column, type ReportFilter, type ReportQueries } from './modules/reportes/index.js';
import { hasPermission, type Permission, type SecurityAdmin } from './modules/seguridad/index.js';

export interface AdminDeps {
  authenticate: RequestHandler;
  guard: (permission: Permission) => RequestHandler;
  calls: CallAdmin;
  catalog: CatalogAdmin;
  content: ContentAdmin;
  siteAssets: SiteAssets;
  security: SecurityAdmin;
  inscriptions: InscriptionService;
  inscriptionDocuments: ApplicationDocuments;
  cepre: CepreAwardees;
  vacancyImport: VacancyImport;
  reports: ReportQueries;
  exporters: {
    toExcel(title: string, filters: string, columns: Column[], rows: Record<string, unknown>[]): Promise<Buffer>;
    toPdf(title: string, filters: string, columns: Column[], rows: Record<string, unknown>[]): Promise<Buffer>;
  };
  knowledge: KnowledgeAdmin;
  assistant: AssistantService;
  integrations: () => Record<string, { label: string; value: string; ok: boolean }>;
}

const meta = (req: Request): RequestMeta => ({ requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null });
const actor = (req: Request) => req.principal!.userId;
const page = z.coerce.number().int().min(1).max(10_000).default(1);
const day = z.iso.date().optional();
const filterSchema = z.object({ modality: z.enum(['ORD', 'EXO', 'CEPRE']).optional(), optionCode: z.string().regex(/^P\d{2}$/).optional(), from: day, to: day });

function describe(f: ReportFilter): string {
  const parts = [f.modality && `Modalidad ${f.modality}`, f.optionCode && `Programa ${f.optionCode}`, f.from && `desde ${f.from}`, f.to && `hasta ${f.to}`].filter(Boolean);
  return parts.length ? `Filtros: ${parts.join(', ')}` : 'Sin filtros';
}

export function adminRoutes(d: AdminDeps): Router {
  const r = Router();
  const g = d.guard;
  r.use('/admin', (req, res, next) => (req.path.startsWith('/auth/') ? next() : d.authenticate(req, res, next)));

  const sendFile = (res: Response, buf: Buffer, name: string, type: 'xlsx' | 'pdf') => {
    res.setHeader('Content-Type', type === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.${type}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(buf);
  };

  // ── Indicadores y reportes (Historia 2) ────────────────────────────────
  r.get('/admin/dashboard', g('panel.ver'), handle(async (req, res) => {
    const f = parse(filterSchema, req.query);
    const roles = req.principal!.roles;
    res.json({
      data: await d.reports.dashboard(f, {
        inscripciones: hasPermission(roles, 'reportes.inscripciones'), pagos: hasPermission(roles, 'reportes.pagos'),
        asistente: hasPermission(roles, 'asistente.gestionar') || hasPermission(roles, 'auditoria.ver'), casos: hasPermission(roles, 'casos.gestionar'),
      }),
    });
  }));
  r.get('/admin/reports/inscripciones.:type', g('reportes.inscripciones'), handle(async (req, res) => {
    const { type } = parse(z.object({ type: z.enum(['xlsx', 'pdf']) }), req.params);
    const f = parse(filterSchema, req.query);
    const rows = await d.reports.inscriptionRows(f);
    const fn = type === 'xlsx' ? d.exporters.toExcel : d.exporters.toPdf;
    sendFile(res, await fn('Reporte de inscripciones', describe(f), INSCRIPTION_COLUMNS, rows), 'inscripciones', type);
  }));
  r.get('/admin/reports/expedientes.:type', g('reportes.inscripciones'), handle(async (req, res) => {
    const { type } = parse(z.object({ type: z.enum(['xlsx', 'pdf']) }), req.params);
    const fn = type === 'xlsx' ? d.exporters.toExcel : d.exporters.toPdf;
    sendFile(res, await fn('Expedientes de exonerados', 'Todos los expedientes', DOSSIER_COLUMNS, await d.reports.dossierRows()), 'expedientes', type);
  }));
  r.get('/admin/reports/asistencia.:type', g('reportes.inscripciones'), handle(async (req, res) => {
    const { type } = parse(z.object({ type: z.enum(['xlsx', 'pdf']) }), req.params);
    const fn = type === 'xlsx' ? d.exporters.toExcel : d.exporters.toPdf;
    sendFile(res, await fn('Asistencia a los exámenes', 'Por examen y aula', ATTENDANCE_COLUMNS, await d.reports.attendanceRows()), 'asistencia', type);
  }));
  r.get('/admin/reports/pagos.:type', g('reportes.pagos'), handle(async (req, res) => {
    const { type } = parse(z.object({ type: z.enum(['xlsx', 'pdf']) }), req.params);
    const f = parse(filterSchema, req.query);
    const rows = await d.reports.paymentRows(f);
    const fn = type === 'xlsx' ? d.exporters.toExcel : d.exporters.toPdf;
    sendFile(res, await fn('Reporte de pagos en línea', describe(f), PAYMENT_COLUMNS, rows), 'pagos', type);
  }));

  // ── Inscripciones y pagos ──────────────────────────────────────────────
  r.get('/admin/inscriptions', g('inscripciones.ver'), handle(async (req, res) => {
    const q = parse(z.object({ q: z.string().max(60).optional(), status: z.string().max(30).optional(), modality: z.string().max(6).optional(), page }), req.query);
    res.json({ data: await d.inscriptions.adminList(q) });
  }));
  r.get('/admin/inscriptions/:code/documents', g('inscripciones.ver'), handle(async (req, res) => {
    const { code } = parse(z.object({ code: z.string().regex(/^\d{8}$/) }), req.params);
    res.json({ data: await d.inscriptionDocuments.forStaff(code) });
  }));
  r.get('/admin/inscriptions/:code/documents/:kind', g('inscripciones.ver'), handle(async (req, res) => {
    const { code, kind } = parse(z.object({ code: z.string().regex(/^\d{8}$/), kind: z.string().max(30) }), req.params);
    const f = await d.inscriptionDocuments.file(code, kind);
    res.setHeader('Cache-Control', 'no-store');
    if ('url' in f) {
      res.json({ data: { url: f.url } });
      return;
    }
    res.setHeader('Content-Disposition', `inline; filename="${code}-${kind.toLowerCase()}.${f.mimeType === 'application/pdf' ? 'pdf' : f.mimeType === 'image/png' ? 'png' : 'jpg'}"`);
    res.type(f.mimeType).send(f.content);
  }));
  r.post('/admin/inscriptions/:code/annul', g('inscripciones.anular'), handle(async (req, res) => {
    const { code } = parse(z.object({ code: z.string().regex(/^\d{8}$/) }), req.params);
    const b = parse(z.object({ reason: z.string().trim().min(5, 'Escribe el motivo').max(300) }), req.body);
    await d.inscriptions.annul(code, b.reason, actor(req), meta(req));
    res.status(204).end();
  }));
  r.get('/admin/payments', g('pagos.ver'), handle(async (req, res) => {
    const q = parse(z.object({ status: z.enum(['INICIADO', 'AUTORIZADO', 'RECHAZADO', 'VENCIDO', 'DUPLICADO']).optional(), page }), req.query);
    res.json({ data: await d.reports.paymentsPage(q) });
  }));

  // ── Convocatoria (Historia 1) ──────────────────────────────────────────
  const callCode = (req: Request) => parse(z.object({ code: z.string().regex(/^\d{4}-[A-Z0-9]{1,3}$/) }), req.params).code;
  r.get('/admin/calls', g('convocatoria.gestionar'), handle(async (_req, res) => res.json({ data: await d.calls.list() })));
  r.get('/admin/calls/:code', g('convocatoria.gestionar'), handle(async (req, res) => res.json({ data: await d.calls.detail(callCode(req)) })));
  r.put('/admin/calls/:code/stages/:stage', g('convocatoria.gestionar'), handle(async (req, res) => {
    const { stage } = parse(z.object({ stage: z.string().max(40) }), req.params);
    const b = parse(z.object({ startsAt: z.iso.datetime({ offset: true }), endsAt: z.iso.datetime({ offset: true }) }), req.body);
    res.json({ data: await d.calls.updateStage(callCode(req), stage, b, actor(req), meta(req)) });
  }));
  r.put('/admin/calls/:code/fees/:fee', g('convocatoria.gestionar'), handle(async (req, res) => {
    const { fee } = parse(z.object({ fee: z.string().max(16) }), req.params);
    const b = parse(z.object({ amount: z.coerce.number(), confirmZero: z.boolean().default(false) }), req.body);
    await d.calls.updateFee(callCode(req), fee, b.amount, b.confirmZero, actor(req), meta(req));
    res.status(204).end();
  }));
  r.put('/admin/calls/:code/vacancies', g('convocatoria.gestionar'), handle(async (req, res) => {
    const b = parse(z.object({
      optionCode: z.string().regex(/^P\d{2}$/), category: z.string().max(6), quantity: z.coerce.number().int(),
      resolution: z.string().trim().max(120).optional(), reason: z.string().trim().max(300).optional(),
    }), req.body);
    await d.calls.updateVacancy(callCode(req), b, actor(req), meta(req));
    res.status(204).end();
  }));
  // RF-01.05: cuadro de vacantes desde Excel (plantilla, vista previa con diferencias y guardado todo o nada).
  r.get('/admin/calls/:code/vacancies/template.xlsx', g('convocatoria.gestionar'), handle(async (req, res) => {
    sendFile(res, await d.vacancyImport.template(callCode(req)), `vacantes-${callCode(req)}`, 'xlsx');
  }));
  const xlsx = z.string().min(20).max(4_000_000);
  r.post('/admin/calls/:code/vacancies/import/preview', g('convocatoria.gestionar'), handle(async (req, res) => {
    const b = parse(z.object({ file: xlsx }), req.body);
    res.json({ data: await d.vacancyImport.preview(callCode(req), b.file) });
  }));
  r.post('/admin/calls/:code/vacancies/import', g('convocatoria.gestionar'), handle(async (req, res) => {
    const b = parse(z.object({ file: xlsx, resolution: z.string().trim().max(120).optional(), reason: z.string().trim().max(300).optional() }), req.body);
    res.json({ data: await d.vacancyImport.apply(callCode(req), b.file, b, actor(req), meta(req)) });
  }));
  // Spec 004, Historia 6: lista de adjudicados del CEPRE-UNSCH.
  r.get('/admin/cepre-awardees', g('convocatoria.gestionar'), handle(async (_req, res) => res.json({ data: await d.cepre.list() })));
  r.post('/admin/cepre-awardees', g('convocatoria.gestionar'), handle(async (req, res) => {
    const b = parse(z.object({ csv: z.string().min(10).max(2_000_000) }), req.body);
    res.json({ data: await d.cepre.replace(b.csv, actor(req), meta(req)) });
  }));
  // ── Catálogo del concurso (RF-01.02, RF-01.04, RF-04.11, RF-06.01, RF-14.03) ──
  const name = z.string().trim().min(3).max(160);
  r.get('/admin/calls/:code/catalog', g('convocatoria.gestionar'), handle(async (req, res) => res.json({ data: await d.catalog.catalog(callCode(req)) })));
  r.put('/admin/catalog/modalities/:id', g('convocatoria.gestionar'), handle(async (req, res) => {
    const { id } = parse(z.object({ id: z.string().max(6) }), req.params);
    await d.catalog.updateModality(id, parse(z.object({ name: name.max(80) }), req.body), actor(req), meta(req));
    res.status(204).end();
  }));
  r.put('/admin/catalog/submodalities/:id', g('convocatoria.gestionar'), handle(async (req, res) => {
    const { id } = parse(z.object({ id: z.string().max(10) }), req.params);
    const b = parse(z.object({
      name, legalBasis: z.string().trim().min(3).max(200), usesBaseDocuments: z.boolean(),
      evaluationCriteria: z.string().trim().max(2000).nullable().transform((v) => v || null),
    }), req.body);
    await d.catalog.updateSubmodality(id, b, actor(req), meta(req));
    res.status(204).end();
  }));
  r.put('/admin/catalog/categories/:id', g('convocatoria.gestionar'), handle(async (req, res) => {
    const { id } = parse(z.object({ id: z.string().max(6) }), req.params);
    await d.catalog.updateCategory(id, parse(z.object({ name }), req.body), actor(req), meta(req));
    res.status(204).end();
  }));
  r.post('/admin/catalog/faculties', g('convocatoria.gestionar'), handle(async (req, res) => {
    res.json({ data: await d.catalog.saveFaculty(parse(z.object({ id: z.uuid().optional(), name }), req.body), actor(req), meta(req)) });
  }));
  r.put('/admin/catalog/areas/:id', g('convocatoria.gestionar'), handle(async (req, res) => {
    const { id } = parse(z.object({ id: z.string().max(3) }), req.params);
    await d.catalog.updateArea(id, parse(z.object({ name: name.max(60) }), req.body), actor(req), meta(req));
    res.status(204).end();
  }));
  r.post('/admin/catalog/programs', g('convocatoria.gestionar'), handle(async (req, res) => {
    const b = parse(z.object({ id: z.uuid().optional(), name, facultyId: z.uuid(), areaId: z.uuid(), scheduleNumber: z.coerce.number().int().min(1).max(999) }), req.body);
    res.json({ data: await d.catalog.saveProgram(b, actor(req), meta(req)) });
  }));
  r.post('/admin/calls/:code/requirements', g('convocatoria.gestionar'), handle(async (req, res) => {
    const b = parse(z.object({
      id: z.uuid().optional(), code: z.string().trim().regex(/^[A-Z0-9_]{2,30}$/, 'Solo mayúsculas, números y guion bajo'), name: z.string().trim().min(5).max(300),
      description: z.string().trim().min(5).max(2000), article: z.string().trim().min(2).max(20), acceptedFormats: z.array(z.string()).min(1).max(3), isBase: z.boolean(),
    }), req.body);
    res.json({ data: await d.catalog.saveRequirement(callCode(req), b, actor(req), meta(req)) });
  }));
  r.put('/admin/calls/:code/submodalities/:sub/requirements', g('convocatoria.gestionar'), handle(async (req, res) => {
    const { sub } = parse(z.object({ sub: z.string().max(10) }), req.params);
    const b = parse(z.object({ items: z.array(z.object({ requirementId: z.uuid(), mandatory: z.boolean() })).max(30) }), req.body);
    await d.catalog.setSubmodalityRequirements(callCode(req), sub, b.items, actor(req), meta(req));
    res.status(204).end();
  }));
  r.post('/admin/calls/:code/copy', g('convocatoria.gestionar'), handle(async (req, res) => {
    const b = parse(z.object({
      code: z.string().regex(/^\d{4}-[A-Z0-9]{1,3}$/, 'Formato AAAA-PERIODO, p. ej. 2027-II'), name: z.string().trim().min(5).max(120),
      year: z.coerce.number().int().min(2026).max(2100), period: z.string().trim().min(1).max(3), monthsOffset: z.coerce.number().int().min(0).max(24).default(6),
    }), req.body);
    res.status(201).json({ data: await d.calls.copy(callCode(req), b, actor(req), meta(req)) });
  }));

  // ── Auditoría, inhabilitados y casos (Historias 4, 5 y 7) ──────────────
  r.get('/admin/audit', g('auditoria.ver'), handle(async (req, res) => {
    const q = parse(z.object({ actor: z.string().max(80).optional(), action: z.string().max(60).optional(), resource: z.string().max(60).optional(), from: day, to: day, page }), req.query);
    res.json({ data: await d.security.auditSearch(q) });
  }));
  r.get('/admin/disqualified', g('inhabilitados.gestionar'), handle(async (_req, res) => res.json({ data: await d.security.disqualifiedList() })));
  r.post('/admin/disqualified', g('inhabilitados.gestionar'), handle(async (req, res) => {
    const b = parse(z.object({
      documentType: z.enum(['DNI', 'CE', 'PASAPORTE']), documentNumber: z.string().trim().min(6).max(12),
      reason: z.string().trim().min(5).max(300), resolution: z.string().trim().min(3).max(120), validUntil: day,
    }), req.body);
    res.status(201).json({ data: await d.security.disqualify(b, actor(req), meta(req)) });
  }));
  r.post('/admin/disqualified/:id/lift', g('inhabilitados.gestionar'), handle(async (req, res) => {
    const { id } = parse(z.object({ id: z.uuid() }), req.params);
    await d.security.lift(id, actor(req), meta(req));
    res.status(204).end();
  }));
  r.get('/admin/cases', g('casos.gestionar'), handle(async (req, res) => {
    const q = parse(z.object({ status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).optional(), type: z.enum(['CONTACT', 'COMPLAINT', 'CHATBOT_ESCALATION', 'RESULT_REVIEW']).optional(), page }), req.query);
    res.json({ data: await d.security.cases(q) });
  }));
  r.post('/admin/cases/:number/status', g('casos.gestionar'), handle(async (req, res) => {
    const { number } = parse(z.object({ number: z.string().max(20) }), req.params);
    const b = parse(z.object({ status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']), note: z.string().max(400).optional() }), req.body);
    await d.security.setCaseStatus(number, b.status, b.note, actor(req), meta(req));
    res.status(204).end();
  }));
  r.get('/admin/cases/:number/attachments/:id', g('casos.gestionar'), handle(async (req, res) => {
    const p = parse(z.object({ number: z.string().max(20), id: z.uuid() }), req.params);
    const f = await d.security.caseAttachment(p.number, p.id, actor(req), meta(req));
    res.setHeader('Content-Type', f.contentType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(f.fileName)}`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(f.content);
  }));
  r.get('/support/cases/:number', handle(async (req, res) => {
    const { number } = parse(z.object({ number: z.string().min(5).max(20) }), req.params);
    res.json({ data: await d.security.publicCaseStatus(number) });
  }));

  // ── Contenido y funciones (Historias 6 y 8) ────────────────────────────
  // ── Imágenes del portal (RF-14.01) ─────────────────────────────────────
  r.get('/admin/site-assets', g('contenido.gestionar'), handle(async (_req, res) => res.json({ data: await d.siteAssets.list() })));
  r.put('/admin/site-assets/:key', g('contenido.gestionar'), handle(async (req, res) => {
    const { key } = parse(z.object({ key: z.string().max(40) }), req.params);
    const b = parse(z.object({ image: z.string().max(4_500_000), alt: z.string().trim().min(10, 'Describe la imagen para quien no la ve').max(300) }), req.body);
    await d.siteAssets.upload(key, b.image, b.alt, actor(req), meta(req));
    res.status(204).end();
  }));
  r.delete('/admin/site-assets/:key', g('contenido.gestionar'), handle(async (req, res) => {
    const { key } = parse(z.object({ key: z.string().max(40) }), req.params);
    await d.siteAssets.reset(key, actor(req), meta(req));
    res.status(204).end();
  }));
  r.get('/admin/announcements', g('contenido.gestionar'), handle(async (_req, res) => res.json({ data: await d.content.announcements() })));
  r.post('/admin/announcements', g('contenido.gestionar'), handle(async (req, res) => {
    const b = parse(z.object({
      id: z.uuid().optional(), callCode: z.string().max(10).optional(), type: z.enum(['COMUNICADO', 'FE_ERRATAS', 'RESULTADO']),
      title: z.string().trim().min(5).max(200), bodyMd: z.string().trim().min(10).max(8000), affectsSection: z.string().max(30).optional(),
      publishedAt: z.iso.datetime({ offset: true }).optional(),
    }), req.body);
    res.status(b.id ? 200 : 201).json({ data: await d.content.saveAnnouncement(b, actor(req), meta(req)) });
  }));
  r.delete('/admin/announcements/:id', g('contenido.gestionar'), handle(async (req, res) => {
    const { id } = parse(z.object({ id: z.uuid() }), req.params);
    await d.content.deleteAnnouncement(id, actor(req), meta(req));
    res.status(204).end();
  }));
  r.get('/admin/content-blocks', g('contenido.gestionar'), handle(async (_req, res) => res.json({ data: await d.content.blocks() })));
  r.put('/admin/content-blocks/:key', g('contenido.gestionar'), handle(async (req, res) => {
    const { key } = parse(z.object({ key: z.string().max(40) }), req.params);
    const b = parse(z.object({ bodyMd: z.string().trim().min(5).max(20_000) }), req.body);
    await d.content.saveBlock(key, b.bodyMd, actor(req), meta(req));
    res.status(204).end();
  }));
  r.get('/admin/features', g('contenido.gestionar'), handle(async (_req, res) => res.json({ data: await d.content.flags() })));
  r.put('/admin/features/:key', g('contenido.gestionar'), handle(async (req, res) => {
    const { key } = parse(z.object({ key: z.string().max(40) }), req.params);
    const b = parse(z.object({ enabled: z.boolean() }), req.body);
    await d.content.setFlag(key, b.enabled, actor(req), meta(req));
    res.status(204).end();
  }));

  // ── Configuración del sistema (Historia 8, RF-13.10, RF-14.04 a RF-14.10) ─
  r.get('/admin/system', g('configuracion.gestionar'), handle(async (_req, res) => {
    const [parameters, failures] = await Promise.all([d.content.parameters(), d.content.failures()]);
    res.json({ data: { integrations: d.integrations(), parameters, failures } });
  }));
  r.put('/admin/parameters/:key', g('configuracion.gestionar'), handle(async (req, res) => {
    const { key } = parse(z.object({ key: z.string().max(60) }), req.params);
    const b = parse(z.object({ value: z.string().trim().min(1).max(400) }), req.body);
    await d.content.setParameter(key, b.value, actor(req), meta(req));
    res.status(204).end();
  }));
  r.post('/admin/failures/:id/retry', g('configuracion.gestionar'), handle(async (req, res) => {
    const { id } = parse(z.object({ id: z.uuid() }), req.params);
    await d.content.retry(id, actor(req), meta(req));
    res.status(202).end();
  }));
  r.post('/admin/retention/run', g('configuracion.gestionar'), handle(async (req, res) => {
    const years = Number(await d.content.parameter('retencion.inscripciones_anios')) || 5;
    const inscriptions = await d.inscriptions.anonymizeExpired(years, actor(req), meta(req));
    res.json({ data: { conversacionesBorradas: await d.assistant.purgeExpired(), inscripcionesAnonimizadas: inscriptions.anonymized } });
  }));

  // ── Asistente (RF-10.12, RF-12.10) ─────────────────────────────────────
  r.get('/admin/knowledge', g('asistente.gestionar'), handle(async (_req, res) => res.json({ data: await d.knowledge.list() })));
  r.post('/admin/knowledge', g('asistente.gestionar'), handle(async (req, res) => {
    const b = parse(z.object({
      id: z.uuid().optional(), topic: z.string().trim().min(3).max(40), question: z.string().trim().min(5).max(200),
      answer: z.string().trim().min(10).max(2000), source: z.string().trim().min(3).max(160), active: z.boolean().default(true),
      extraKeywords: z.string().max(200).optional(),
    }), req.body);
    res.status(b.id ? 200 : 201).json({ data: await d.knowledge.save(b, actor(req), meta(req)) });
  }));
  r.get('/admin/assistant/usage', g('asistente.gestionar'), handle(async (_req, res) => res.json({ data: await d.assistant.usage(30) })));

  return r;
}
