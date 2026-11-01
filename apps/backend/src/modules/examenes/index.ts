// API pública del módulo M07 Exámenes y M08 Sedes y aulas (spec 006).
import type { RequestHandler } from 'express';
import type { AuditLog } from '../../shared/audit/audit.js';
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import { renderEmail, type EmailSender } from '../../shared/email/email-sender.js';
import type { Outbox } from '../../shared/events/outbox.js';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter.js';
import type { FileStorage } from '../../shared/storage/file-storage.js';
import type { ConvocatoriasQueries } from '../convocatorias/index.js';
import { AttendanceService } from './application/attendance-service.js';
import { ExamService, type ExamInscriptions } from './application/exam-service.js';
import { examenesRoutes } from './presentation/routes.js';

export function createExamenesModule(deps: {
  db: Db;
  clock: Clock;
  outbox: Outbox;
  audit: AuditLog;
  limiter: RateLimiter;
  storage: FileStorage;
  email: EmailSender;
  convocatorias: ConvocatoriasQueries;
  inscriptions: ExamInscriptions;
  /** Correos de la Comisión de Admisión para las incidencias (RN-60). */
  commission: () => Promise<string[]>;
  authenticate: RequestHandler;
  guard: (permission: 'examenes.gestionar' | 'asistencia.registrar') => RequestHandler;
  secret: string;
  frontendOrigin: string;
}) {
  const exams = new ExamService(deps);
  const attendance = new AttendanceService(exams, deps.commission);
  const link = `<a href="${deps.frontendOrigin}/buscar-aula">${deps.frontendOrigin}/buscar-aula</a>`;

  // RF-08.09 y RF-07.09: aviso a cada afectado por un cambio de aula o una reprogramación.
  deps.outbox.subscribe('AulaCambiada', async (e) => {
    const { html, text } = renderEmail('Cambió tu aula de examen', [
      `Hola ${e.firstNames}:`,
      `Para el <strong>${e.exam}</strong> tu nueva ubicación es: <strong>${e.room}</strong>.`,
      `Motivo: ${e.reason}.`,
      `Descarga tu ficha de examen actualizada en ${link} con tu DNI y tu código ${e.applicantCode}.`,
    ]);
    await deps.email.send({ to: e.email, subject: 'Cambio de aula - Admisión UNSCH 2027-I', html, text });
  });
  deps.outbox.subscribe('ExamenReprogramado', async (e) => {
    const { html, text } = renderEmail('Tu examen fue reprogramado', [
      `Hola ${e.firstNames}:`,
      `El <strong>${e.exam}</strong> se realizará el <strong>${e.when}</strong>.`,
      `Motivo: ${e.reason}.`,
      `Revisa tu aula y descarga tu ficha de examen en ${link}.`,
    ]);
    await deps.email.send({ to: e.email, subject: 'Reprogramación del examen - Admisión UNSCH 2027-I', html, text });
  });
  deps.outbox.subscribe('IncidenciaRegistrada', async (e) => {
    const { html, text } = renderEmail(`Incidencia: ${e.type}`, [
      `<strong>${e.exam}</strong> · ${e.room} · ${new Date(e.at).toLocaleString('es-PE', { timeZone: 'America/Lima' })}`,
      e.applicantCode ? `Postulante: ${e.applicantCode}` : 'Sin postulante identificado.',
      e.description,
      'Registrada en el panel de Admisión para la evaluación de la Comisión (Art. 53).',
    ]);
    for (const to of e.to) await deps.email.send({ to, subject: `Incidencia en el examen - ${e.type}`, html, text });
  });

  return { exams, attendance, router: examenesRoutes(exams, attendance, deps) };
}

export type { ExamService } from './application/exam-service.js';
