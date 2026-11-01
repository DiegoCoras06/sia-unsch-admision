// API pública del módulo M03 Inscripción pública (ADR-015).
import type { AuditLog } from '../../shared/audit/audit.js';
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import { renderEmail, type EmailSender } from '../../shared/email/email-sender.js';
import type { Outbox } from '../../shared/events/outbox.js';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter.js';
import type { FileStorage } from '../../shared/storage/file-storage.js';
import type { ConvocatoriasQueries } from '../convocatorias/index.js';
import type { AccessService } from '../seguridad/index.js';
import type { IdentityProvider } from '../usuarios/index.js';
import { InscriptionService } from './application/inscription-service.js';
import { FichaService } from './application/ficha-service.js';
import { OrdenPagoService } from './application/orden-pago-pdf.js';
import { CepreAwardees } from './application/cepre-awardees.js';
import { inscripcionesRoutes } from './presentation/routes.js';
import { ApplicationDocuments } from './application/application-documents.js';

export function createInscripcionesModule(deps: {
  db: Db;
  clock: Clock;
  outbox: Outbox;
  audit: AuditLog;
  limiter: RateLimiter;
  storage: FileStorage;
  identity: IdentityProvider;
  convocatorias: ConvocatoriasQueries;
  access: AccessService;
  email: EmailSender;
  frontendOrigin: string;
  /** Firma del QR de la ficha (spec 003, Historia 5). */
  fichaSecret: string;
  currentConsent?: () => Promise<{ version: string; textMarkdown: string }>;
}) {
  const service = new InscriptionService(deps);
  const ficha = new FichaService({ ...deps, secret: deps.fichaSecret });
  const orden = new OrdenPagoService({ inscriptions: service, clock: deps.clock, frontendOrigin: deps.frontendOrigin });
  const cepre = new CepreAwardees(deps);

  // Correo de confirmación con el código de postulante y la orden de pago (sin datos sensibles en el asunto).
  deps.outbox.subscribe('InscripcionRegistrada', async (e) => {
    const { html, text } = renderEmail('Tu inscripción quedó registrada', [
      `Hola ${e.firstNames}:`,
      `Tu código de postulante es <strong style="font-size:22px">${e.applicantCode}</strong>.`,
      `Programa: <strong>${e.program}</strong> · Modalidad: ${e.modality}.`,
      `Monto a pagar: <strong>S/ ${e.total}</strong>. Paga en línea desde «Mi inscripción» (tarjeta, Yape o Plin con Izipay) o en Santa María Magdalena, Banco de la Nación o Interbank indicando tu código de postulante.`,
      `Estado: ${e.status}. Examen: ${e.examDate}.`,
      `Consulta tu inscripción en <a href="${deps.frontendOrigin}/mi-inscripcion">${deps.frontendOrigin}/mi-inscripcion</a> con tu DNI y tu código.`,
    ]);
    await deps.email.send({ to: e.email, subject: 'Inscripción registrada - Admisión UNSCH 2027-I', html, text });
  });

  // «¿No encuentras tu código?»: el código va solo al correo registrado en la inscripción.
  deps.outbox.subscribe('CodigoPostulanteRecordado', async (e) => {
    const { html, text } = renderEmail('Tu código de postulante', [
      `Hola ${e.firstNames}:`,
      `Tu código de postulante es <strong style="font-size:22px">${e.applicantCode}</strong>.`,
      `Úsalo con tu DNI en <a href="${deps.frontendOrigin}/mi-inscripcion">${deps.frontendOrigin}/mi-inscripcion</a> para pagar, ver tu estado, imprimir tu ficha, buscar tu aula y ver tu puntaje.`,
      'Si no pediste este correo, ignóralo: tu inscripción no cambió.',
    ]);
    await deps.email.send({ to: e.email, subject: 'Tu código de postulante - Admisión UNSCH 2027-I', html, text });
  });

  // M05 confirmó el pago (ADR-008): la inscripción pasa a Apta y se avisa al postulante.
  deps.outbox.subscribe('PagoConfirmado', async (e) => {
    const row = await service.markPaid(e.applicantCode, e.operationNumber);
    if (!row) return;
    const { html, text } = renderEmail('Recibimos tu pago', [
      `Hola ${row.firstNames}:`,
      `Confirmamos tu pago de <strong>S/ ${e.amount}</strong> (operación ${e.operationNumber}, ${e.payMethod}).`,
      row.changed ? 'Tu inscripción ahora está <strong>Apta</strong>.' : 'Tu inscripción ya tenía el pago registrado.',
      `Descarga tu ficha de inscripción con código QR en <a href="${deps.frontendOrigin}/mi-inscripcion">${deps.frontendOrigin}/mi-inscripcion</a> con tu DNI y tu código ${e.applicantCode}. Imprímela y llévala al examen con tu DNI.`,
    ]);
    await deps.email.send({ to: row.email, subject: 'Pago confirmado - Admisión UNSCH 2027-I', html, text });
  });

  // RF-11.03: la anulación por Admisión también se avisa, con el motivo y a quién acudir.
  deps.outbox.subscribe('InscripcionAnulada', async (e) => {
    const { html, text } = renderEmail('Tu inscripción fue anulada', [
      `Hola ${e.firstNames}:`,
      `La Dirección de Admisión anuló tu inscripción con código ${e.applicantCode}.`,
      `Motivo: ${e.reason}.`,
      'Si crees que es un error, acércate a la Dirección de Admisión (Jr. Arequipa N.° 175, Ayacucho, de 4:00 p.m. a 8:00 p.m.) con tu DNI.',
    ]);
    await deps.email.send({ to: e.email, subject: 'Inscripción anulada - Admisión UNSCH 2027-I', html, text, event: 'INSCRIPCION_ANULADA' });
  });

  // M06 (spec 004): el estado de la inscripción de exonerado sigue al expediente (RN-24, RF-04.09).
  deps.outbox.subscribe('ExpedienteEnviado', async (e) => {
    await service.applyDossierDecision(e.applicantCode, 'EN_REVISION');
  });
  deps.outbox.subscribe('ExpedienteDictaminado', async (e) => {
    await service.applyDossierDecision(e.applicantCode, e.decision);
  });

  const documents = new ApplicationDocuments(deps);
  return { service, ficha, documents, cepre, router: inscripcionesRoutes(service, ficha, documents, orden, cepre) };
}

export type { PaymentContext } from './application/inscription-service.js';
export type { ApplicationDocuments } from './application/application-documents.js';
