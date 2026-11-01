import type { Request, RequestHandler, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import { handle } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import type { AttendanceService } from '../application/attendance-service.js';
import type { ExamService } from '../application/exam-service.js';
import { INCIDENT_TYPES, type IncidentType } from '../domain/exam-rules.js';

const meta = (req: Request): RequestMeta => ({ requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null });
const applicant = z.object({
  documentNumber: z.string().trim().toUpperCase().min(6).max(12),
  applicantCode: z.string().regex(/^\d{8}$/, 'El código tiene 8 dígitos'),
});
const pdf = (res: Response, content: Buffer, fileName: string, disposition: 'inline' | 'attachment' = 'attachment') => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(content);
};
const when = z.iso.datetime({ offset: true });
const examBody = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(3).max(120),
  modalities: z.array(z.enum(['ORD', 'EXO', 'CEPRE'])).min(1),
  entryOpensAt: when,
  entryClosesAt: when,
  durationMinutes: z.number().int().min(30).max(600),
  place: z.string().trim().min(3).max(200),
  publishAt: when.optional(),
  structure: z.object({
    conocimientos: z.number().int().min(0).max(500), aptitudVocacional: z.number().int().min(0).max(500), actitudPersonal: z.number().int().min(0).max(500),
    cursos: z.array(z.object({ name: z.string().trim().min(2).max(120), questions: z.number().int().min(0).max(200) })).max(40).optional(),
  }).optional(),
  scoring: z.record(z.string(), z.union([z.number().min(0).max(10000), z.boolean()])).optional(),
  instructions: z.object({ llevar: z.array(z.string().trim().min(1).max(160)).max(20), prohibido: z.array(z.string().trim().min(1).max(160)).max(30), notas: z.string().trim().max(600) }).optional(),
  reason: z.string().trim().max(400).optional(),
});
const roomBody = z.object({
  venueId: z.uuid(), building: z.string().trim().min(1).max(60), floor: z.number().int().min(-2).max(20), code: z.string().trim().min(1).max(20),
  capacity: z.number().int().min(1).max(500), gate: z.string().trim().min(1).max(40), accessible: z.boolean(), active: z.boolean().default(true),
});
const venueBody = z.object({ code: z.string().trim().min(2).max(20), name: z.string().trim().min(3).max(120), address: z.string().trim().min(3).max(200), active: z.boolean().default(true) });

/** Rutas de M07/M08 (spec 006): consulta del postulante con DNI + código; programación y asistencia en el panel. */
export function examenesRoutes(exams: ExamService, attendance: AttendanceService, staff: {
  authenticate: RequestHandler;
  guard: (permission: 'examenes.gestionar' | 'asistencia.registrar') => RequestHandler;
}): Router {
  const r = Router();
  const id = (req: Request) => parse(z.object({ id: z.uuid() }), req.params).id;
  const actor = (req: Request) => req.principal!.userId;

  // ── Postulante: «Buscar aula» (Historia 4) ─────────────────────────
  r.get('/exam/room', handle(async (req, res) => {
    const q = parse(applicant, req.query);
    res.json({ data: await exams.findRoom(q.documentNumber, q.applicantCode, meta(req)) });
  }));
  r.get('/exam/slip.pdf', handle(async (req, res) => {
    const q = parse(applicant, req.query);
    pdf(res, await exams.slip(q.documentNumber, q.applicantCode, meta(req)), `ficha-examen-${q.applicantCode}.pdf`);
  }));
  r.post('/exam/accommodation', handle(async (req, res) => {
    const b = parse(applicant.extend({ needs: z.string().trim().min(10, 'Describe qué adecuación necesitas').max(600) }), req.body);
    res.json({ data: await exams.requestAccommodation(b.documentNumber, b.applicantCode, b.needs, meta(req)) });
  }));

  // ── Coordinador de examen (Historias 1, 2, 3 y 6) ──────────────────
  const co = [staff.authenticate, staff.guard('examenes.gestionar')];
  r.get('/admin/exams', ...co, handle(async (_req, res) => res.json({ data: await exams.list() })));
  r.get('/admin/exams/syllabus-courses', ...co, handle(async (_req, res) => res.json({ data: await exams.syllabusCourses() })));
  r.post('/admin/exams', ...co, handle(async (req, res) => res.status(201).json({ data: await exams.save(null, parse(examBody, req.body), actor(req), meta(req)) })));
  r.get('/admin/exams/:id', ...co, handle(async (req, res) => res.json({ data: await exams.detail(id(req)) })));
  r.put('/admin/exams/:id', ...co, handle(async (req, res) => res.json({ data: await exams.save(id(req), parse(examBody, req.body), actor(req), meta(req)) })));
  r.put('/admin/exams/:id/rooms', ...co, handle(async (req, res) => {
    const b = parse(z.object({ roomIds: z.array(z.uuid()).max(1000) }), req.body);
    res.json({ data: await exams.setRooms(id(req), b.roomIds, actor(req), meta(req)) });
  }));
  r.post('/admin/exams/:id/distribute', ...co, handle(async (req, res) => {
    const b = parse(z.object({ reason: z.string().trim().max(400).optional() }), req.body ?? {});
    res.json({ data: await exams.distribute(id(req), b.reason, actor(req), meta(req)) });
  }));
  r.post('/admin/exams/:id/confirm', ...co, handle(async (req, res) => res.json({ data: await exams.confirm(id(req), actor(req), meta(req)) })));
  r.get('/admin/exams/:id/assignments', ...co, handle(async (req, res) => {
    const q = parse(z.object({ roomId: z.uuid().optional(), q: z.string().max(60).optional() }), req.query);
    res.json({ data: await exams.assignments(id(req), q) });
  }));
  r.post('/admin/exams/:id/assignments/:code/move', ...co, handle(async (req, res) => {
    const { code } = parse(z.object({ code: z.string().regex(/^\d{8}$/) }), req.params);
    const b = parse(z.object({ roomId: z.uuid(), reason: z.string().trim().min(5, 'Indica el motivo del cambio').max(400) }), req.body);
    res.json({ data: await exams.move(id(req), code, b.roomId, b.reason, actor(req), meta(req)) });
  }));
  r.get('/admin/exams/:id/eligible.pdf', ...co, handle(async (req, res) => pdf(res, await exams.eligiblePdf(id(req)), 'relacion-de-aptos.pdf')));
  r.post('/admin/exams/:id/close-attendance', ...co, handle(async (req, res) => res.json({ data: await attendance.close(id(req), actor(req), meta(req)) })));

  r.get('/admin/venues', ...co, handle(async (_req, res) => res.json({ data: await exams.venues() })));
  r.post('/admin/venues', ...co, handle(async (req, res) => res.status(201).json({ data: await exams.saveVenue(null, parse(venueBody, req.body), actor(req), meta(req)) })));
  r.put('/admin/venues/:id', ...co, handle(async (req, res) => res.json({ data: await exams.saveVenue(id(req), parse(venueBody, req.body), actor(req), meta(req)) })));
  r.post('/admin/rooms', ...co, handle(async (req, res) => res.status(201).json({ data: await exams.saveRoom(null, parse(roomBody, req.body), actor(req), meta(req)) })));
  r.put('/admin/rooms/:id', ...co, handle(async (req, res) => res.json({ data: await exams.saveRoom(id(req), parse(roomBody, req.body), actor(req), meta(req)) })));

  // ── Responsable de aula (Historia 5) ───────────────────────────────
  const at = [staff.authenticate, staff.guard('asistencia.registrar')];
  const roomParams = (req: Request) => parse(z.object({ id: z.uuid(), roomId: z.uuid() }), req.params);
  r.get('/admin/attendance', ...at, handle(async (_req, res) => res.json({ data: await attendance.board() })));
  r.get('/admin/attendance/:id/rooms/:roomId', ...at, handle(async (req, res) => {
    const p = roomParams(req);
    res.json({ data: await attendance.roomList(p.id, p.roomId) });
  }));
  r.get('/admin/attendance/:id/rooms/:roomId/list.pdf', ...at, handle(async (req, res) => {
    const p = roomParams(req);
    pdf(res, await attendance.roomPdf(p.id, p.roomId), 'lista-de-asistencia.pdf');
  }));
  r.post('/admin/attendance/:id/check-in', ...at, handle(async (req, res) => {
    const b = parse(z.object({ scan: z.string().trim().min(8).max(300), scannedAt: z.iso.datetime({ offset: true }).optional() }), req.body);
    res.json({ data: await attendance.checkIn(id(req), b.scan, actor(req), meta(req), b.scannedAt) });
  }));
  r.post('/admin/attendance/:id/applicants/:code', ...at, handle(async (req, res) => {
    const { code } = parse(z.object({ code: z.string().regex(/^\d{8}$/) }), req.params);
    const b = parse(z.object({ status: z.enum(['PRESENTE', 'AUSENTE', 'PENDIENTE']) }), req.body);
    res.json({ data: await attendance.setAttendance(id(req), code, b.status, actor(req), meta(req)) });
  }));
  r.get('/admin/attendance/:id/incidents', ...at, handle(async (req, res) => res.json({ data: await attendance.incidents(id(req)) })));
  r.post('/admin/attendance/:id/incidents', ...at, handle(async (req, res) => {
    const b = parse(z.object({
      roomId: z.uuid().optional(), applicantCode: z.string().regex(/^\d{8}$/).optional(),
      type: z.enum(Object.keys(INCIDENT_TYPES) as [IncidentType, ...IncidentType[]]), description: z.string().trim().min(5).max(1000),
    }), req.body);
    res.status(201).json({ data: await attendance.incident(id(req), b, actor(req), meta(req)) });
  }));

  return r;
}
