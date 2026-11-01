import { Router } from 'express';
import { z } from 'zod';
import { handle } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import type { SupportCases } from '../application/support-cases.js';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(160),
  phone: z.string().regex(/^9\d{8}$/, 'Debe ser un celular de 9 dígitos que empiece con 9').optional().or(z.literal('').transform(() => undefined)),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(200).optional(),
});

export function seguridadRoutes(cases: SupportCases, currentCallCode: () => Promise<string>): Router {
  const router = Router();

  router.post('/support/contact', handle(async (req, res) => {
    const input = parse(contactSchema, req.body);
    const caseNumber = await cases.createContact(input, req.ipHash, await currentCallCode());
    res.status(201).json({ data: { caseNumber: caseNumber ?? 'RECIBIDO' } });
  }));

  router.post('/support/complaint', handle(async (req, res) => {
    const input = parse(contactSchema.extend({ name: z.string().trim().max(120).optional() }), req.body);
    const caseNumber = await cases.createComplaint(input, req.ipHash, await currentCallCode());
    res.status(201).json({ data: { caseNumber: caseNumber ?? 'RECIBIDO' } });
  }));

  return router;
}
