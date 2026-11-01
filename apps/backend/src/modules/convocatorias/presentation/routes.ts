import { Router } from 'express';
import { z } from 'zod';
import { handle, publicCache } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import type { ConvocatoriasQueries } from '../application/convocatorias-queries.js';

const callCode = z.string().regex(/^\d{4}-(I|II)$/, 'Código de convocatoria inválido (p. ej. 2027-I)');
const callParams = z.object({ callCode });
const booleanish = z.enum(['true', 'false']).transform((v) => v === 'true');

const optionsQuery = z.object({
  q: z.string().trim().max(60).optional(),
  area: z.enum(['I', 'II', 'III']).optional(),
  category: z.string().max(6).optional(),
});

const feeQuoteQuery = z.object({
  modality: z.enum(['ORD', 'EXO', 'CEPRE']),
  submodality: z.string().max(10).optional(),
  schoolType: z.enum(['ESTATAL', 'PARTICULAR']).optional(),
  militaryCondition: z.enum(['NONE', 'ACTIVE', 'DISCHARGED']).default('NONE'),
  familyLink: booleanish.default(false),
  at: z.iso.datetime({ offset: true }).optional(),
});

/** Rutas públicas de M01 (contrato: specs/001-portal-publico/contracts/openapi.yaml). */
export function convocatoriasRoutes(queries: ConvocatoriasQueries): Router {
  const router = Router();
  const cache = publicCache(300);

  router.get('/calls/current', cache, handle(async (_req, res) => {
    res.json({ data: await queries.getCurrentCall() });
  }));

  router.get('/calls/:callCode/areas', cache, handle(async (req, res) => {
    const { callCode: code } = parse(callParams, req.params);
    res.json({ data: await queries.listAreas(code) });
  }));

  router.get('/calls/:callCode/quota-categories', cache, handle(async (req, res) => {
    const { callCode: code } = parse(callParams, req.params);
    res.json({ data: await queries.listQuotaCategories(code) });
  }));

  router.get('/calls/:callCode/submodalities', cache, handle(async (req, res) => {
    const { callCode: code } = parse(callParams, req.params);
    res.json({ data: await queries.listSubmodalities(code) });
  }));

  router.get('/calls/:callCode/options', cache, handle(async (req, res) => {
    const { callCode: code } = parse(callParams, req.params);
    const filter = parse(optionsQuery, req.query);
    res.json(await queries.searchOptions(code, filter));
  }));

  router.get('/calls/:callCode/options/:internalCode', cache, handle(async (req, res) => {
    const { callCode: code, internalCode } = parse(callParams.extend({ internalCode: z.string().regex(/^P\d{2}$/) }), req.params);
    res.json({ data: await queries.getOption(code, internalCode) });
  }));

  router.get('/calls/:callCode/fees', cache, handle(async (req, res) => {
    const { callCode: code } = parse(callParams, req.params);
    res.json({ data: await queries.listFees(code) });
  }));

  router.get('/calls/:callCode/fee-quote', handle(async (req, res) => {
    const { callCode: code } = parse(callParams, req.params);
    const { at, ...criteria } = parse(feeQuoteQuery, req.query);
    res.json({ data: await queries.quoteFee(code, criteria, at ? new Date(at) : undefined) });
  }));

  router.get('/calls/:callCode/requirements', cache, handle(async (req, res) => {
    const { callCode: code } = parse(callParams, req.params);
    const { submodality } = parse(z.object({ submodality: z.string().max(10).optional() }), req.query);
    res.json({ data: await queries.listRequirements(code, submodality) });
  }));

  router.get('/calls/:callCode/syllabus', cache, handle(async (req, res) => {
    const { callCode: code } = parse(callParams, req.params);
    const { q } = parse(z.object({ q: z.string().trim().max(60).optional() }), req.query);
    res.json({ data: await queries.getSyllabus(code, q) });
  }));

  router.get('/calls/:callCode/documents', cache, handle(async (req, res) => {
    const { callCode: code } = parse(callParams, req.params);
    res.json({ data: await queries.listDocuments(code) });
  }));

  router.get('/calls/:callCode/stats', publicCache(3600), handle(async (req, res) => {
    const { callCode: code } = parse(callParams, req.params);
    res.json({ data: await queries.getStats(code) });
  }));

  return router;
}
