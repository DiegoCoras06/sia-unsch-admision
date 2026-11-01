import type { Request, RequestHandler, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import { handle } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import type { ResultsService } from '../application/results-service.js';

type Column = { key: string; header: string; width: number };
const meta = (req: Request): RequestMeta => ({ requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null });
const applicant = z.object({
  documentNumber: z.string().trim().toUpperCase().min(6).max(12),
  applicantCode: z.string().regex(/^\d{8}$/, 'El código tiene 8 dígitos'),
});
const send = (res: Response, content: Buffer, type: string, fileName: string) => {
  res.setHeader('Content-Type', type);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(content);
};
const RESULT_COLUMNS: Column[] = [
  { key: 'codigo', header: 'Código', width: 11 }, { key: 'postulante', header: 'Postulante', width: 34 }, { key: 'programa', header: 'Programa', width: 30 },
  { key: 'categoria', header: 'Categoría', width: 10 }, { key: 'conocimientos', header: 'Conoc.', width: 8 }, { key: 'aptitud', header: 'Aptitud', width: 8 },
  { key: 'actitud', header: 'Actitud', width: 8 }, { key: 'puntaje', header: 'Puntaje', width: 9 }, { key: 'puesto', header: 'Puesto', width: 8 },
  { key: 'condicion', header: 'Condición', width: 20 }, { key: 'ingreso', header: 'Ingreso', width: 16 },
];
const COVERAGE_COLUMNS: Column[] = [
  { key: 'programa', header: 'Programa', width: 36 }, { key: 'categoria', header: 'Categoría', width: 12 }, { key: 'vacantes', header: 'Vacantes', width: 10 },
  { key: 'admitidos', header: 'Admitidos', width: 10 }, { key: 'sin_cubrir', header: 'Sin cubrir', width: 10 },
];
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Rutas de M09 (spec 007): consulta pública segura; operación, aprobación e ingreso en el panel. */
export function resultadosRoutes(service: ResultsService, deps: {
  authenticate: RequestHandler;
  guard: (p: 'resultados.gestionar' | 'resultados.aprobar' | 'ingreso.registrar') => RequestHandler;
  toExcel: (title: string, filters: string, columns: Column[], rows: Record<string, unknown>[]) => Promise<Buffer>;
  toPdf: (title: string, filters: string, columns: Column[], rows: Record<string, unknown>[]) => Promise<Buffer>;
}): Router {
  const r = Router();
  const id = (req: Request) => parse(z.object({ id: z.uuid() }), req.params).id;
  const actor = (req: Request) => req.principal!.userId;

  // ── Postulante y público (Historias 4, 5 y 7) ──────────────────────
  r.get('/results/me', handle(async (req, res) => {
    const q = parse(applicant, req.query);
    res.json({ data: await service.mine(q.documentNumber, q.applicantCode, meta(req)) });
  }));
  r.get('/results/admitted', handle(async (req, res) => {
    const q = parse(z.object({ exam: z.string().max(20), option: z.string().regex(/^P\d{2}$/).optional() }), req.query);
    res.json({ data: await service.admittedList(q.exam, q.option) });
  }));
  r.get('/results/certificate.pdf', handle(async (req, res) => {
    const q = parse(applicant, req.query);
    send(res, await service.certificate(q.applicantCode, q.documentNumber, meta(req)), 'application/pdf', `constancia-ingreso-${q.applicantCode}.pdf`);
  }));
  r.get('/results/verify/:token', handle(async (req, res) => {
    const { token } = parse(z.object({ token: z.string().max(40) }), req.params);
    res.json({ data: await service.verify(token) });
  }));
  r.post('/results/review', handle(async (req, res) => {
    const b = parse(applicant.extend({ description: z.string().trim().min(20, 'Describe el error material con detalle').max(2000) }), req.body);
    res.status(201).json({ data: await service.review(b.documentNumber, b.applicantCode, b.description, meta(req)) });
  }));

  // ── Operador de resultados (Historias 1, 2, 3 y 6) ─────────────────
  const op = [deps.authenticate, deps.guard('resultados.gestionar')];
  r.get('/admin/results', ...op, handle(async (_req, res) => res.json({ data: await service.overview() })));
  r.post('/admin/results/exams/:id/batches', ...op, handle(async (req, res) => {
    const b = parse(z.object({ fileName: z.string().trim().min(1).max(160), content: z.string().min(10).max(2_000_000) }), req.body);
    res.status(201).json({ data: await service.importBatch(id(req), b.fileName, b.content, actor(req), meta(req)) });
  }));
  r.post('/admin/results/batches/:id/process', ...op, handle(async (req, res) => {
    const b = parse(z.object({ reason: z.string().trim().max(400).optional() }), req.body ?? {});
    res.json({ data: await service.process(id(req), b.reason, actor(req), meta(req)) });
  }));
  r.get('/admin/results/versions/:id', ...op, handle(async (req, res) => {
    const q = parse(z.object({ option: z.string().max(3).optional(), condition: z.string().max(25).optional(), q: z.string().max(60).optional() }), req.query);
    res.json({ data: await service.version(id(req), { optionCode: q.option, condition: q.condition, q: q.q }) });
  }));
  r.post('/admin/results/versions/:id/submit', ...op, handle(async (req, res) => res.json({ data: await service.submit(id(req), actor(req), meta(req)) })));
  r.get('/admin/results/versions/:id/report.:format', ...op, handle(async (req, res) => {
    const p = parse(z.object({ id: z.uuid(), format: z.enum(['xlsx', 'pdf']) }), req.params);
    const q = parse(z.object({ kind: z.enum(['resultados', 'cobertura']).default('resultados'), condition: z.string().max(25).optional() }), req.query);
    const data = await service.reportRows(p.id);
    const rows = q.kind === 'cobertura' ? data.coverage : data.results.filter((x) => !q.condition || x.condicion === q.condition);
    const title = q.kind === 'cobertura' ? 'Cobertura de vacantes' : `Resultados${q.condition ? ` - ${q.condition}` : ''}`;
    const filters = `${data.v.exam} · versión ${data.v.version}`;
    const cols = q.kind === 'cobertura' ? COVERAGE_COLUMNS : RESULT_COLUMNS;
    const out = p.format === 'xlsx' ? await deps.toExcel(title, filters, cols, rows) : await deps.toPdf(title, filters, cols, rows);
    send(res, out, p.format === 'xlsx' ? XLSX : 'application/pdf', `${q.kind}-v${data.v.version}.${p.format}`);
  }));

  // ── Comisión (Historia 3) ──────────────────────────────────────────
  const ap = [deps.authenticate, deps.guard('resultados.aprobar')];
  r.post('/admin/results/versions/:id/approve', ...ap, handle(async (req, res) => {
    const b = parse(z.object({ publishAt: z.iso.datetime({ offset: true }) }), req.body);
    res.json({ data: await service.approve(id(req), new Date(b.publishAt), actor(req), meta(req)) });
  }));
  r.post('/admin/results/versions/:id/send-back', ...ap, handle(async (req, res) => {
    const b = parse(z.object({ note: z.string().trim().min(5).max(400) }), req.body);
    res.json({ data: await service.sendBack(id(req), b.note, actor(req), meta(req)) });
  }));

  // ── Ingreso (Historia 5) ───────────────────────────────────────────
  const ing = [deps.authenticate, deps.guard('ingreso.registrar')];
  r.get('/admin/admissions', ...ing, handle(async (req, res) => {
    const q = parse(z.object({ status: z.enum(['PENDIENTE', 'INGRESANTE', 'PERDIDA']).optional(), q: z.string().max(60).optional() }), req.query);
    res.json({ data: await service.admissions(q) });
  }));
  r.post('/admin/admissions/:code/deliver', ...ing, handle(async (req, res) => {
    const { code } = parse(z.object({ code: z.string().regex(/^\d{8}$/) }), req.params);
    const b = parse(z.object({ receiptNumber: z.string().trim().min(3, 'Indica el número del recibo de caja').max(40) }), req.body);
    res.json({ data: await service.deliver(code, b.receiptNumber, actor(req), meta(req)) });
  }));
  r.get('/admin/admissions/:code/certificate.pdf', ...ing, handle(async (req, res) => {
    const { code } = parse(z.object({ code: z.string().regex(/^\d{8}$/) }), req.params);
    send(res, await service.certificate(code, undefined, meta(req)), 'application/pdf', `constancia-ingreso-${code}.pdf`);
  }));
  return r;
}
