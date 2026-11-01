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

const signedMessage = z.object({
  code: z.string().max(40).optional(),
  transactionId: z.string().min(5).max(40),
  payloadHttp: z.string().min(2).max(60_000),
  signature: z.string().min(16).max(200),
});

const meta = (req: Request): RequestMeta => ({ requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null });

/** Rutas de M05 (contrato: specs/005-pagos/contracts/openapi.yaml). */
export function pagosRoutes(service: PaymentService): Router {
  const router = Router();

  router.post('/payments/session', handle(async (req, res) => {
    const body = parse(applicant, req.body);
    res.status(201).json({ data: await service.startSession(body.documentNumber, body.applicantCode, meta(req)) });
  }));

  // Yape con Culqi (ADR-019): abre el intento y luego cobra el token que dio Culqi Checkout.
  router.post('/payments/yape/session', handle(async (req, res) => {
    const body = parse(applicant, req.body);
    res.status(201).json({ data: await service.startYape(body.documentNumber, body.applicantCode, meta(req)) });
  }));

  router.post('/payments/yape/charge', handle(async (req, res) => {
    const body = parse(applicant.extend({
      transactionId: z.string().min(5).max(40),
      token: z.string().regex(/^ype_(test|live)_[A-Za-z0-9]+$/, 'El token de Yape no es válido'),
    }), req.body);
    res.json({ data: await service.chargeYape(body.documentNumber, body.applicantCode, body.transactionId, body.token, meta(req)) });
  }));

  router.post('/payments/confirm', handle(async (req, res) => {
    res.json({ data: await service.confirm(parse(signedMessage, req.body), 'SDK', meta(req)) });
  }));

  // IPN de Izipay: el id de transacción viaja en la cabecera y en el cuerpo firmado.
  router.post('/payments/izipay/notify', handle(async (req, res) => {
    const body = parse(signedMessage, { ...req.body, transactionId: req.body?.transactionId ?? req.get('transactionId') });
    const result = await service.confirm(body, 'IPN', meta(req));
    res.json({ data: { received: true, status: result.status } });
  }));

  // IPN de Izipay micuentaweb: kr-answer firmado con la contraseña de la API REST (kr-hash-key = password).
  router.post('/payments/micuentaweb/notify', handle(async (req, res) => {
    const b = parse(z.object({ 'kr-answer': z.string().min(2).max(60_000), 'kr-hash': z.string().min(16).max(200), 'kr-hash-key': z.string().max(30).optional() }), req.body);
    const tx = (JSON.parse(b['kr-answer']) as { transactions?: { metadata?: { transactionId?: string } }[] }).transactions?.[0]?.metadata?.transactionId;
    if (!tx) { res.json({ data: { received: true, status: 'SIN_TRANSACCION' } }); return; }
    const result = await service.confirm({ transactionId: tx, payloadHttp: b['kr-answer'], signature: b['kr-hash'], code: b['kr-hash-key'] === 'password' ? 'password' : 'sha256_hmac' }, 'IPN', meta(req));
    res.json({ data: { received: true, status: result.status } });
  }));

  router.get('/payments/status', handle(async (req, res) => {
    const q = parse(applicant, req.query);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await service.status(q.documentNumber, q.applicantCode, meta(req)) });
  }));

  router.post('/payments/mock/complete', handle(async (req, res) => {
    const body = parse(z.object({ transactionId: z.string().min(5).max(40), approve: z.boolean() }), req.body);
    res.json({ data: await service.mockComplete(body.transactionId, body.approve) });
  }));

  return router;
}
