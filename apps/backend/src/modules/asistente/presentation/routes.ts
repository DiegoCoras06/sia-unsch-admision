import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import { handle } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import type { AssistantService } from '../application/assistant-service.js';

const meta = (req: Request): RequestMeta => ({ requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null });

/** Rutas de M10 Asistente (spec 009, ADR-017). */
export function asistenteRoutes(service: AssistantService): Router {
  const router = Router();

  router.get('/assistant/suggestions', handle(async (_req, res) => {
    res.json({ data: service.suggestions() });
  }));

  router.post('/assistant/messages', handle(async (req, res) => {
    const body = parse(z.object({
      conversationId: z.uuid().optional(),
      message: z.string().max(2000),
      accessToken: z.string().max(200).optional(),
    }), req.body);
    res.json({ data: await service.chat(body, meta(req)) });
  }));

  router.post('/assistant/identify', handle(async (req, res) => {
    const body = parse(z.object({
      documentNumber: z.string().trim().toUpperCase().min(6).max(12),
      applicantCode: z.string().regex(/^\d{8}$/, 'El código tiene 8 dígitos'),
    }), req.body);
    res.json({ data: await service.identify(body.documentNumber, body.applicantCode, meta(req)) });
  }));

  router.post('/assistant/handoff', handle(async (req, res) => {
    const body = parse(z.object({
      conversationId: z.uuid(),
      name: z.string().trim().min(2, 'Escribe tu nombre').max(120),
      email: z.email('Correo inválido').max(160),
      note: z.string().max(400).optional(),
    }), req.body);
    res.status(201).json({ data: await service.handoff(body, meta(req)) });
  }));

  return router;
}
