// API pública del módulo M06 Expedientes (spec 004).
import type { RequestHandler } from 'express';
import type { AuditLog } from '../../shared/audit/audit.js';
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import { renderEmail, type EmailSender } from '../../shared/email/email-sender.js';
import type { Outbox } from '../../shared/events/outbox.js';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter.js';
import type { FileStorage } from '../../shared/storage/file-storage.js';
import type { ConvocatoriasQueries } from '../convocatorias/index.js';
import { DossierService, type DossierContext } from './application/dossier-service.js';
import { expedientesRoutes } from './presentation/routes.js';

export function createExpedientesModule(deps: {
  db: Db;
  clock: Clock;
  outbox: Outbox;
  audit: AuditLog;
  limiter: RateLimiter;
  storage: FileStorage;
  email: EmailSender;
  convocatorias: ConvocatoriasQueries;
  inscriptions: { dossierContext(applicantCode: string, documentNumber?: string): Promise<DossierContext> };
  evaluators: () => Promise<{ id: string; name: string }[]>;
  authenticate: RequestHandler;
  guard: (permission: 'expedientes.evaluar' | 'expedientes.asignar') => RequestHandler;
  seesAll: (roles: string[]) => boolean;
  frontendOrigin: string;
}) {
  const service = new DossierService(deps);
  const link = `<a href="${deps.frontendOrigin}/mi-inscripcion">${deps.frontendOrigin}/mi-inscripcion</a>`;

  // RF-06.05: el postulante recibe un correo en cada cambio de su expediente.
  deps.outbox.subscribe('ExpedienteEnviado', async (e) => {
    const { html, text } = renderEmail(e.resubmitted ? 'Recibimos tu subsanación' : 'Recibimos tu expediente', [
      `Hola ${e.firstNames}:`,
      `Tu expediente (código ${e.applicantCode}) está <strong>en revisión</strong>. Te escribiremos cuando tenga dictamen.`,
      `Puedes ver su avance en ${link} con tu DNI y tu código.`,
    ]);
    await deps.email.send({ to: e.email, subject: 'Expediente en revisión - Admisión UNSCH 2027-I', html, text });
  });
  deps.outbox.subscribe('ExpedienteDictaminado', async (e) => {
    const lines: Record<typeof e.decision, string[]> = {
      AUTORIZADO: ['Tu expediente fue <strong>autorizado</strong>. Ya puedes pagar el derecho de inscripción e imprimir tu ficha.'],
      OBSERVADO: [
        'Tu expediente tiene <strong>observaciones</strong>. Reemplaza solo estos documentos:',
        ...e.observed.map((o) => `• ${o}`),
        `Plazo para subsanar: <strong>${e.deadline ? new Date(e.deadline).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : ''}</strong>.`,
      ],
      RECHAZADO: [`Tu expediente fue <strong>rechazado</strong>. Motivo: ${e.note ?? ''}`],
      NO_SUBSANADO: ['Venció el plazo para subsanar tu expediente y tu inscripción como exonerado quedó anulada.'],
    };
    const { html, text } = renderEmail('Dictamen de tu expediente', [`Hola ${e.firstNames}:`, ...lines[e.decision], `Detalles en ${link}.`]);
    await deps.email.send({ to: e.email, subject: 'Dictamen de tu expediente - Admisión UNSCH 2027-I', html, text });
  });

  return { service, router: expedientesRoutes(service, deps) };
}

export type { DossierService } from './application/dossier-service.js';
