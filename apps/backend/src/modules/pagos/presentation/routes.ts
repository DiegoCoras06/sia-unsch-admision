import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import { handle } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import type { PaymentService } from '../application/payment-service.js';

const applicant = z.object({
  documentNumber: z.string().trim().toUpperCase().min(6).max(12),
  applicantCode: z.string().regex(/^\d{8}$/, 'El código tiene 8 dígitos'),
});

const meta = (req: Request): RequestMeta => ({ requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null });

/** Rutas de M04 Pagos (contrato: specs/005-pagos/contracts/openapi.yaml, ADR-024). */
export function pagosRoutes(service: PaymentService): Router {
  const router = Router();

  // Abre el intento: el navegador recibe la llave pública y el monto para Culqi Checkout (tarjeta y Yape).
  router.post('/payments/session', handle(async (req, res) => {
    const body = parse(applicant, req.body);
    res.status(201).json({ data: await service.startSession(body.documentNumber, body.applicantCode, meta(req)) });
  }));

  // Cobra el token que entregó Culqi Checkout; la pasarela revisa su formato antes de cobrar.
  router.post('/payments/charge', handle(async (req, res) => {
    const body = parse(applicant.extend({
      transactionId: z.string().min(5).max(40),
      token: z.string().min(5).max(120),
    }), req.body);
    res.json({ data: await service.charge(body.documentNumber, body.applicantCode, body.transactionId, body.token, meta(req)) });
  }));

  router.get('/payments/status', handle(async (req, res) => {
    const q = parse(applicant, req.query);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await service.status(q.documentNumber, q.applicantCode, meta(req)) });
  }));

  return router;
}
