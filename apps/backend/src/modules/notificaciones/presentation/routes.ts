import type { Request, RequestHandler } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import { handle } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import type { NotificationService } from '../application/notification-service.js';

const meta = (req: Request): RequestMeta => ({ requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null });
const applicant = z.object({
  documentNumber: z.string().trim().toUpperCase().min(6).max(12),
  applicantCode: z.string().regex(/^\d{8}$/, 'El código tiene 8 dígitos'),
});
const segment = z.object({
  modality: z.enum(['ORD', 'EXO', 'CEPRE']).optional(),
  optionCode: z.string().regex(/^P\d{2}$/).optional(),
  status: z.enum(['PENDIENTE_PAGO', 'PENDIENTE_VALIDACION', 'APTA', 'OBSERVADA', 'ANULADA']).optional(),
});

/** Rutas de M11 (spec 010): bandeja del postulante con DNI + código; registro, comunicados y plantillas en el panel. */
export function notificacionesRoutes(service: NotificationService, staff: { authenticate: RequestHandler; guard: (p: 'notificaciones.gestionar') => RequestHandler }): Router {
  const r = Router();

  // ── Postulante (Historias 2 y 5) ───────────────────────────────────
  r.get('/notifications', handle(async (req, res) => {
    const q = parse(applicant, req.query);
    res.json({ data: await service.inbox(q.documentNumber, q.applicantCode, meta(req)) });
  }));
  r.post('/notifications/read', handle(async (req, res) => {
    const b = parse(applicant.extend({ ids: z.array(z.uuid()).max(100) }), req.body);
    res.json({ data: await service.markRead(b.documentNumber, b.applicantCode, b.ids, meta(req)) });
  }));
  r.put('/notifications/preferences', handle(async (req, res) => {
    const b = parse(applicant.extend({ reminders: z.boolean() }), req.body);
    res.json({ data: await service.setReminders(b.documentNumber, b.applicantCode, b.reminders, meta(req)) });
  }));

  // ── Panel ──────────────────────────────────────────────────────────
  const g = [staff.authenticate, staff.guard('notificaciones.gestionar')];
  const actor = (req: Request) => req.principal!.userId;
  r.get('/admin/notifications', ...g, handle(async (req, res) => {
    const q = parse(z.object({
      status: z.enum(['PENDIENTE', 'ENVIADA', 'FALLIDA', 'REBOTADA']).optional(), event: z.string().max(40).optional(), email: z.string().max(120).optional(),
      page: z.coerce.number().int().min(1).default(1),
    }), req.query);
    res.json({ data: await service.log(q) });
  }));
  r.post('/admin/notifications/retry', ...g, handle(async (req, res) => res.json({ data: await service.retryFailed(actor(req), meta(req)) })));
  r.post('/admin/notifications/dispatch', ...g, handle(async (_req, res) => res.json({ data: await service.tick() })));
  r.get('/admin/campaigns', ...g, handle(async (_req, res) => res.json({ data: await service.campaigns() })));
  r.post('/admin/campaigns/preview', ...g, handle(async (req, res) => res.json({ data: await service.preview(parse(segment, req.body)) })));
  r.post('/admin/campaigns', ...g, handle(async (req, res) => {
    const b = parse(z.object({ subject: z.string().trim().min(5).max(200), body: z.string().trim().min(10).max(5000), segment }), req.body);
    res.status(201).json({ data: await service.campaign(b, actor(req), meta(req)) });
  }));
  r.get('/admin/notification-templates', ...g, handle(async (_req, res) => res.json({ data: await service.templates() })));
  r.put('/admin/notification-templates/:key', ...g, handle(async (req, res) => {
    const { key } = parse(z.object({ key: z.string().max(40) }), req.params);
    const b = parse(z.object({ subject: z.string().trim().min(5).max(200), body: z.string().trim().min(10).max(5000) }), req.body);
    res.json({ data: await service.saveTemplate(key, b, actor(req), meta(req)) });
  }));
  return r;
}
