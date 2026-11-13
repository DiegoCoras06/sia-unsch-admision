import type { Request } from 'express';
import type { ApplicationDocuments } from '../application/application-documents.js';
import { Router } from 'express';
import { z } from 'zod';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import { handle } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import type { FichaService } from '../application/ficha-service.js';
import type { OrdenPagoService } from '../application/orden-pago-pdf.js';
import type { CepreAwardees } from '../application/cepre-awardees.js';
import type { InscriptionService } from '../application/inscription-service.js';
import type { UsabilitySurveyService } from '../application/usability-survey.js';

const name = z.string().trim().min(1, 'Obligatorio').max(80);
const ubigeo = z.string().regex(/^\d{6}$/, 'Elige departamento, provincia y distrito');

const inscriptionSchema = z
  .object({
    documentType: z.enum(['DNI', 'CE']),
    documentNumber: z.string().trim().toUpperCase(),
    paternalSurname: name,
    maternalSurname: name,
    firstNames: name,
    sex: z.enum(['M', 'F']),
    maritalStatus: z.enum(['SOLTERO', 'CASADO', 'CONVIVIENTE', 'DIVORCIADO', 'VIUDO']),
    birthUbigeo: ubigeo,
    birthDate: z.iso.date(),
    address: z.string().trim().min(5, 'Escribe tu dirección').max(200),
    residenceUbigeo: ubigeo,
    economicDependency: z.enum(['PADRES', 'PROPIA', 'OTROS_FAMILIARES', 'OTROS']),
    phone: z.string().trim().regex(/^\d{6,9}$/, 'Solo números').optional().or(z.literal('').transform(() => undefined)),
    mobile: z.string().regex(/^9\d{8}$/, 'Debe ser un celular de 9 dígitos que empiece con 9'),
    email: z.email('Correo inválido').max(160),
    photo: z.string().max(3_000_000, 'La foto es demasiado pesada'),
    schoolUbigeo: ubigeo,
    schoolName: z.string().trim().min(3, 'Escribe el nombre de tu colegio').max(200),
    schoolType: z.enum(['ESTATAL', 'PARTICULAR']),
    graduationYear: z.coerce.number().int(),
    inFourthOrBelow: z.boolean(),
    preparation: z.enum(['ACADEMIA', 'CEPRE_UNSCH', 'COLEGIO', 'AUTODIDACTA', 'OTRA']),
    attempts: z.coerce.number().int().min(1).max(20),
    modality: z.enum(['ORD', 'EXO', 'CEPRE']),
    quotaCategory: z.string().max(6),
    campus: z.enum(['HUAMANGA']),
    optionCode: z.string().regex(/^P\d{2}$/, 'Elige un programa de estudio'),
    militaryCondition: z.enum(['NONE', 'ACTIVE', 'DISCHARGED']).default('NONE'),
    familyLink: z.boolean().default(false),
    declarationAccepted: z.literal(true, 'Debes aceptar la declaración jurada'),
    consentVersion: z.string().trim().min(1, 'Debes aceptar la política de tratamiento de datos').max(20),
  })
  .refine((v) => (v.documentType === 'DNI' ? /^\d{8}$/.test(v.documentNumber) : /^[A-Z0-9]{8,12}$/.test(v.documentNumber)), {
    message: 'Número de documento inválido (DNI: 8 dígitos; carné de extranjería: 8 a 12 caracteres)',
    path: ['documentNumber'],
  });

const meta = (req: Request): RequestMeta => ({ requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null });

/** Rutas públicas de M03 (contrato: specs/003-inscripcion-ordinaria/contracts/openapi.yaml). */
export function inscripcionesRoutes(service: InscriptionService, ficha: FichaService, documents: ApplicationDocuments, orden: OrdenPagoService, cepre: CepreAwardees, survey: UsabilitySurveyService): Router {
  const router = Router();

  // AC07 (EQ-07): encuesta SUS al terminar la inscripción, con DNI + código; una respuesta por inscripción.
  router.post('/inscriptions/survey', handle(async (req, res) => {
    const body = parse(z.object({
      documentNumber: z.string().trim().min(6).max(12),
      applicantCode: z.string().regex(/^\d{8}$/, 'El código tiene 8 dígitos'),
      answers: z.array(z.number().int().min(1).max(5)).length(10, 'Responde las 10 afirmaciones'),
      comment: z.string().trim().max(500).optional(),
      durationSeconds: z.number().int().min(0).max(86_400).optional(),
      device: z.enum(['celular', 'tableta', 'computadora']).optional(),
    }), req.body);
    res.status(201).json({ data: await survey.submit(body, meta(req)) });
  }));

  router.post('/identity/lookup', handle(async (req, res) => {
    const body = parse(z.object({ documentType: z.enum(['DNI', 'CE']), documentNumber: z.string().trim().toUpperCase().min(6).max(12) }), req.body);
    res.json({ data: await service.lookupIdentity(body.documentType, body.documentNumber, meta(req)) });
  }));

  router.get('/inscriptions/options', handle(async (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({ data: await service.options() });
  }));

  router.post('/inscriptions', handle(async (req, res) => {
    const input = parse(inscriptionSchema, req.body);
    res.status(201).json({ data: await service.register(input, meta(req)) });
  }));

  router.get('/inscriptions/status', handle(async (req, res) => {
    const q = parse(z.object({ documentNumber: z.string().trim().min(6).max(12), applicantCode: z.string().regex(/^\d{8}$/, 'El código tiene 8 dígitos') }), req.query);
    res.json({ data: await service.status(q.documentNumber, q.applicantCode, meta(req)) });
  }));

  router.post('/inscriptions/code-reminder', handle(async (req, res) => {
    const body = parse(z.object({ documentNumber: z.string().trim().min(6, 'Escribe tu número de documento').max(12) }), req.body);
    await service.remindCode(body.documentNumber, meta(req));
    res.status(202).json({ data: { message: 'Si hay una inscripción con ese documento, enviamos tu código de postulante al correo que registraste. Revisa también la carpeta de spam.' } });
  }));

  router.get('/inscriptions/observed', handle(async (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.json({ data: await service.observedList() });
  }));

  // RF-03.05: documentos adicionales, con DNI + código.
  const who = { documentNumber: z.string().trim().min(6).max(12), applicantCode: z.string().regex(/^\d{8}$/, 'El código tiene 8 dígitos') };
  router.get('/inscriptions/documents', handle(async (req, res) => {
    const q = parse(z.object(who), req.query);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await documents.list(q.documentNumber, q.applicantCode, meta(req)) });
  }));
  router.post('/inscriptions/documents/upload-url', handle(async (req, res) => {
    const b = parse(z.object({ ...who, kind: z.string().max(30), contentType: z.string().max(60), size: z.number().int().min(1) }), req.body);
    res.json({ data: await documents.presignUpload(b, meta(req)) });
  }));
  router.post('/inscriptions/documents', handle(async (req, res) => {
    const b = parse(z.object({
      ...who, kind: z.string().max(30), fileName: z.string().trim().min(1).max(200),
      content: z.string().max(7_200_000).optional(), uploadKey: z.string().max(120).optional(),
    }).refine((v) => !!v.content !== !!v.uploadKey, { message: 'Envía el archivo o la clave de la subida.', path: ['content'] }), req.body);
    res.json({ data: await documents.upload(b, meta(req)) });
  }));

  // Spec 004, Historia 6: programa adjudicado de un DNI de la lista del CEPRE.
  router.get('/inscriptions/cepre-awardee', handle(async (req, res) => {
    const q = parse(z.object({ documentNumber: z.string().regex(/^\d{8}$/, 'El DNI tiene 8 dígitos') }), req.query);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await cepre.lookup(q.documentNumber, meta(req)) });
  }));

  // Historia 6 (RN-16): reinscripción de exonerados no admitidos al Ordinario.
  router.get('/inscriptions/reinscription', handle(async (req, res) => {
    const q = parse(z.object(who), req.query);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await service.reinscriptionCheck(q.documentNumber, q.applicantCode, meta(req)) });
  }));
  router.post('/inscriptions/reinscription', handle(async (req, res) => {
    const b = parse(z.object({ ...who, optionCode: z.string().regex(/^P\d{2}$/, 'Elige un programa de estudio') }), req.body);
    res.status(201).json({ data: await service.reinscribe(b.documentNumber, b.applicantCode, b.optionCode, meta(req)) });
  }));

  // Historia 4: orden de pago y constancia en una sola hoja A4 (con DNI + código).
  router.get('/inscriptions/orden-pago.pdf', handle(async (req, res) => {
    const q = parse(z.object(who), req.query);
    const pdf = await orden.pdf(q.documentNumber, q.applicantCode, meta(req));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="orden-de-pago-${q.applicantCode}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(pdf);
  }));

  // Historia 5: ficha PDF con QR (con DNI + código) y su verificación pública.
  router.get('/inscriptions/ficha.pdf', handle(async (req, res) => {
    const q = parse(z.object({ documentNumber: z.string().trim().min(6).max(12), applicantCode: z.string().regex(/^\d{8}$/, 'El código tiene 8 dígitos') }), req.query);
    const pdf = await ficha.pdf(q.documentNumber, q.applicantCode, meta(req));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ficha-inscripcion-${q.applicantCode}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(pdf);
  }));

  router.get('/inscriptions/verify/:token', handle(async (req, res) => {
    const { token } = parse(z.object({ token: z.string().min(10).max(40) }), req.params);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await ficha.verify(token) });
  }));

  return router;
}
