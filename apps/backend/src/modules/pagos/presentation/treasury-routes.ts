import type { Request, RequestHandler } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import { handle } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import { ANNULMENT_REASONS, RECONCILIATION_LABEL, type TreasuryService } from '../application/treasury-service.js';

const meta = (req: Request): RequestMeta => ({ requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null });
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Tesorería en el panel (spec 005, Historias 4 y 5). */
export function treasuryRoutes(service: TreasuryService, staff: { authenticate: RequestHandler; guard: (p: 'pagos.conciliar' | 'pagos.anular') => RequestHandler }): Router {
  const r = Router();
  const id = (req: Request) => parse(z.object({ id: z.uuid() }), req.params).id;
  const actor = (req: Request) => req.principal!.userId;

  const c = [staff.authenticate, staff.guard('pagos.conciliar')];
  r.get('/admin/reconciliations', ...c, handle(async (_req, res) => res.json({ data: await service.runs() })));
  r.post('/admin/reconciliations', ...c, handle(async (req, res) => {
    const b = parse(z.object({
      source: z.enum(['CULQI', 'TESORERIA', 'BANCO']), fileName: z.string().trim().min(1).max(160), content: z.string().min(10).max(3_000_000), from: day, to: day,
    }), req.body);
    res.status(201).json({ data: await service.reconcile(b, actor(req), meta(req)) });
  }));
  r.get('/admin/reconciliations/:id', ...c, handle(async (req, res) => {
    const q = parse(z.object({ result: z.enum(Object.keys(RECONCILIATION_LABEL) as [string, ...string[]]).optional() }), req.query);
    res.json({ data: await service.run(id(req), q) });
  }));
  r.post('/admin/reconciliations/items/:id/resolve', ...c, handle(async (req, res) => {
    const b = parse(z.object({ resolution: z.string().trim().min(5, 'Explica cómo se resolvió').max(400) }), req.body);
    res.json({ data: await service.resolve(id(req), b.resolution, actor(req), meta(req)) });
  }));

  const a = [staff.authenticate, staff.guard('pagos.anular')];
  r.get('/admin/annulments', ...a, handle(async (_req, res) => res.json({ data: await service.annulments() })));
  r.post('/admin/annulments', ...a, handle(async (req, res) => {
    const b = parse(z.object({
      reference: z.string().trim().min(4).max(40), kind: z.enum(['ANULACION', 'DEVOLUCION']),
      reason: z.enum(Object.keys(ANNULMENT_REASONS) as [keyof typeof ANNULMENT_REASONS, ...(keyof typeof ANNULMENT_REASONS)[]]),
      detail: z.string().trim().min(10).max(600), resolution: z.string().trim().min(3, 'Indica la resolución o el documento que la sustenta').max(120),
    }), req.body);
    res.status(201).json({ data: await service.requestAnnulment(b, actor(req), meta(req)) });
  }));
  r.post('/admin/annulments/:id/decision', ...a, handle(async (req, res) => {
    const b = parse(z.object({ approve: z.boolean(), note: z.string().trim().min(5).max(400) }), req.body);
    res.json({ data: await service.decideAnnulment(id(req), b.approve, b.note, actor(req), meta(req)) });
  }));
  return r;
}
