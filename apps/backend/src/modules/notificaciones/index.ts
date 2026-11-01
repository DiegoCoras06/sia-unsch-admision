// API pública del módulo M11 Notificaciones (spec 010).
import type { RequestHandler } from 'express';
import type { AuditLog } from '../../shared/audit/audit.js';
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import type { EmailSender } from '../../shared/email/email-sender.js';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter.js';
import { NotificationService, type NoticeSources } from './application/notification-service.js';
import { notificacionesRoutes } from './presentation/routes.js';

export function createNotificacionesModule(deps: {
  db: Db;
  clock: Clock;
  audit: AuditLog;
  limiter: RateLimiter;
  transport: EmailSender;
  sources: NoticeSources;
  authenticate: RequestHandler;
  guard: (permission: 'notificaciones.gestionar') => RequestHandler;
  frontendOrigin: string;
}) {
  const service = new NotificationService(deps);
  return { service, router: notificacionesRoutes(service, deps) };
}

export { RecordingEmailSender, type NotificationService } from './application/notification-service.js';
export type { TemplateKey } from './domain/templates.js';
