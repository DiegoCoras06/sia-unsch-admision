import type { Request, RequestHandler, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import { handle } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import type { DossierService } from '../application/dossier-service.js';

const meta = (req: Request): RequestMeta => ({ requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null });
const applicant = z.object({
  documentNumber: z.string().trim().toUpperCase().min(6).max(12),
  applicantCode: z.string().regex(/^\d{8}$/, 'El código tiene 8 dígitos'),
});
/** Archivo privado: el contenido (almacenamiento local) o un enlace temporal de S3 para abrirlo. */
const sendFile = (res: Response, f: { content: Buffer; mimeType: string; fileName: string } | { url: string }) => {
  res.setHeader('Cache-Control', 'no-store');
  if ('url' in f) {
    res.json({ data: { url: f.url } });
    return;
  }
  res.setHeader('Content-Type', f.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(f.fileName)}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(f.content);
};

/** Rutas de M06 (spec 004): el postulante con DNI + código; el personal con permiso del panel (ADR-018). */
export function expedientesRoutes(service: DossierService, staff: {
  authenticate: RequestHandler;
  guard: (permission: 'expedientes.evaluar' | 'expedientes.asignar') => RequestHandler;
  seesAll: (roles: string[]) => boolean;
}): Router {
  const r = Router();

  // ── Postulante ─────────────────────────────────────────────────────
  r.get('/dossier', handle(async (req, res) => {
    const q = parse(applicant, req.query);
    res.json({ data: await service.view(q.documentNumber, q.applicantCode, meta(req)) });
  }));
  // ADR-010: con S3 el navegador sube el archivo directo al bucket y luego confirma con la clave temporal.
  r.post('/dossier/documents/upload-url', handle(async (req, res) => {
    const b = parse(applicant.extend({
      requirementCode: z.string().max(30), contentType: z.string().max(60), size: z.number().int().min(1),
    }), req.body);
    res.json({ data: await service.presignUpload(b.documentNumber, b.applicantCode, b, meta(req)) });
  }));
  r.post('/dossier/documents', handle(async (req, res) => {
    const b = parse(applicant.extend({
      requirementCode: z.string().max(30), fileName: z.string().trim().min(1).max(160),
      contentBase64: z.string().min(8).max(7_200_000, 'El archivo supera los 5 MB').optional(),
      uploadKey: z.string().max(120).optional(),
    }).refine((v) => !!v.contentBase64 !== !!v.uploadKey, { message: 'Envía el archivo o la clave de la subida.', path: ['contentBase64'] }), req.body);
    res.status(201).json({ data: await service.upload(b.documentNumber, b.applicantCode, b, meta(req)) });
  }));
  r.put('/dossier/complementary', handle(async (req, res) => {
    const b = parse(applicant.extend({ values: z.record(z.string(), z.string().max(200)) }), req.body);
    res.json({ data: await service.saveComplementary(b.documentNumber, b.applicantCode, b.values, meta(req)) });
  }));
  r.post('/dossier/submit', handle(async (req, res) => {
    const b = parse(applicant, req.body);
    res.json({ data: await service.submit(b.documentNumber, b.applicantCode, meta(req)) });
  }));
  r.get('/dossier/documents/:documentId', handle(async (req, res) => {
    const q = parse(applicant, req.query);
    const { documentId } = parse(z.object({ documentId: z.uuid() }), req.params);
    sendFile(res, await service.ownFile(q.documentNumber, q.applicantCode, documentId));
  }));

  // ── Evaluador (panel) ──────────────────────────────────────────────
  const actor = (req: Request) => ({ userId: req.principal!.userId, seesAll: staff.seesAll(req.principal!.roles) });
  const id = (req: Request) => parse(z.object({ id: z.uuid() }), req.params).id;
  const ev = [staff.authenticate, staff.guard('expedientes.evaluar')];

  r.get('/admin/dossiers', ...ev, handle(async (req, res) => {
    const q = parse(z.object({
      status: z.enum(['EN_REVISION', 'OBSERVADO', 'AUTORIZADO', 'RECHAZADO', 'NO_SUBSANADO', 'BORRADOR']).optional(),
      submodality: z.string().max(10).optional(), mine: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
    }), req.query);
    res.json({ data: await service.queue(actor(req), q) });
  }));
  r.get('/admin/dossiers/stats', ...ev, handle(async (_req, res) => res.json({ data: await service.stats() })));
  r.get('/admin/dossiers/:id', ...ev, handle(async (req, res) => res.json({ data: await service.detail(id(req), actor(req)) })));
  r.get('/admin/dossiers/:id/documents/:documentId', ...ev, handle(async (req, res) => {
    const { documentId } = parse(z.object({ documentId: z.uuid() }), req.params);
    sendFile(res, await service.staffFile(id(req), documentId, actor(req), meta(req)));
  }));
  r.post('/admin/dossiers/:id/documents/:documentId/review', ...ev, handle(async (req, res) => {
    const { documentId } = parse(z.object({ documentId: z.uuid() }), req.params);
    const b = parse(z.object({ verdict: z.enum(['CONFORME', 'OBSERVADO']), note: z.string().trim().max(400).optional() }), req.body);
    res.json({ data: await service.reviewDocument(id(req), documentId, b.verdict, b.note, actor(req)) });
  }));
  r.post('/admin/dossiers/:id/decision', ...ev, handle(async (req, res) => {
    const b = parse(z.object({ decision: z.enum(['AUTORIZAR', 'OBSERVAR', 'RECHAZAR']), note: z.string().trim().max(600).optional() }), req.body);
    res.json({ data: await service.decide(id(req), b.decision, b.note, actor(req), meta(req)) });
  }));
  r.post('/admin/dossiers/:id/in-person', ...ev, handle(async (req, res) => {
    const b = parse(z.object({ note: z.string().trim().min(5, 'Describe qué documentos verificaste').max(600) }), req.body);
    res.json({ data: await service.verifyInPerson(id(req), b.note, actor(req), meta(req)) });
  }));
  r.post('/admin/dossiers/:id/special', ...ev, handle(async (req, res) => {
    const b = parse(z.object({ date: z.string().trim().min(5).max(60), place: z.string().trim().min(3).max(160), note: z.string().trim().max(400).default('') }), req.body);
    res.json({ data: await service.scheduleSpecial(id(req), b, actor(req)) });
  }));
  r.post('/admin/dossiers/:id/assign', staff.authenticate, staff.guard('expedientes.asignar'), handle(async (req, res) => {
    const b = parse(z.object({ evaluatorId: z.uuid() }), req.body);
    await service.assign(id(req), b.evaluatorId, { userId: req.principal!.userId }, meta(req));
    res.json({ data: await service.detail(id(req), actor(req)) });
  }));

  return r;
}
