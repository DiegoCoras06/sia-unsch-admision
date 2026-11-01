import type { Logger } from 'pino';
import type { Db, Tx } from '../db/prisma.js';
import type { Clock } from '../clock/clock.js';

/** Eventos de dominio conocidos (ADR-008). El contenido nunca incluye contraseñas ni tokens. */
export interface DomainEvents {
  CasoContactoCreado: { caseNumber: string; name: string; email: string };
  CodigoVerificacionSolicitado: { userId: string; email: string; code: string; firstNames: string };
  CuentaCreada: { userId: string; email: string; firstNames: string; applicantCode: string };
  CuentaBloqueada: { userId: string; email: string; lockedUntil: string };
  RecuperacionSolicitada: { userId: string; email: string; resetUrl: string };
  ContrasenaCambiada: { userId: string; email: string };
  InscripcionRegistrada: {
    email: string; firstNames: string; applicantCode: string; program: string; modality: string;
    total: string; status: string; examDate: string;
  };
  PagoConfirmado: { applicantCode: string; amount: string; operationNumber: string; payMethod: string; paidAt: string };
  PagoDuplicado: { applicantCode: string; transactionId: string; amount: string; operationNumber: string };
  ExpedienteEnviado: { applicantCode: string; email: string; firstNames: string; resubmitted: boolean };
  ExpedienteDictaminado: {
    applicantCode: string; email: string; firstNames: string;
    decision: 'AUTORIZADO' | 'OBSERVADO' | 'RECHAZADO' | 'NO_SUBSANADO'; note: string | null; deadline: string | null; observed: string[];
  };
  /** M03: Admisión anuló una inscripción (RF-11.03). */
  InscripcionAnulada: { applicantCode: string; email: string; firstNames: string; reason: string };
  CodigoPostulanteRecordado: { applicantCode: string; email: string; firstNames: string };
  /** M08: cambio de aula de un postulante ya publicado (RF-08.09). */
  AulaCambiada: { applicantCode: string; email: string; firstNames: string; exam: string; room: string; reason: string };
  /** M07: reprogramación autorizada de un examen (RF-07.09). */
  ExamenReprogramado: { applicantCode: string; email: string; firstNames: string; exam: string; when: string; reason: string };
  /** M08: incidencia durante el examen, para la Comisión (RN-60). */
  IncidenciaRegistrada: { to: string[]; exam: string; room: string; type: string; description: string; applicantCode: string | null; at: string };
}
export type EventType = keyof DomainEvents;

const SECRET_BEARING_EVENTS = new Set<EventType>(['CodigoVerificacionSolicitado', 'RecuperacionSolicitada', 'CodigoPostulanteRecordado']);
type Handler<T extends EventType> = (payload: DomainEvents[T], meta: { eventId: string }) => Promise<void>;

/**
 * Transactional Outbox: `publish` guarda el evento en la misma transacción que el cambio de estado;
 * `dispatch` lo entrega después (worker cada minuto, o inmediatamente tras la respuesta).
 */
export class Outbox {
  private readonly handlers = new Map<EventType, Handler<EventType>[]>();

  constructor(private readonly db: Db, private readonly clock: Clock, private readonly logger: Logger) {}

  async publish<T extends EventType>(tx: Tx, type: T, payload: DomainEvents[T], correlationId?: string): Promise<void> {
    await tx.outboxEvent.create({ data: { eventType: type, payload: payload as object, correlationId: correlationId ?? null } });
  }

  subscribe<T extends EventType>(type: T, handler: Handler<T>): void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler as unknown as Handler<EventType>);
    this.handlers.set(type, list);
  }

  /** Procesa eventos pendientes; cada evento se marca como procesado solo si todos sus suscriptores terminan. */
  async dispatch(batchSize = 20): Promise<number> {
    const pending = await this.db.outboxEvent.findMany({
      where: { processedAt: null, attempts: { lt: 5 } },
      orderBy: { occurredAt: 'asc' },
      take: batchSize,
    });
    for (const event of pending) {
      // Reclama el evento para que dos despachadores simultáneos no lo procesen a la vez.
      const claimed = await this.db.outboxEvent.updateMany({
        where: { id: event.id, processedAt: null, attempts: event.attempts },
        data: { attempts: { increment: 1 } },
      });
      if (claimed.count === 0) continue;
      try {
        for (const handler of this.handlers.get(event.eventType as EventType) ?? []) {
          await handler(event.payload as never, { eventId: event.id });
        }
        // Los eventos con secretos de un solo uso (código, enlace) no conservan su contenido tras el envío.
        const redact = SECRET_BEARING_EVENTS.has(event.eventType as EventType);
        await this.db.outboxEvent.update({
          where: { id: event.id },
          data: { processedAt: this.clock.now(), lastError: null, ...(redact ? { payload: { redacted: true } } : {}) },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn({ eventId: event.id, eventType: event.eventType, err: message }, 'falló un suscriptor de la outbox');
        await this.db.outboxEvent.update({ where: { id: event.id }, data: { lastError: message.slice(0, 500) } });
      }
    }
    return pending.length;
  }

  /** Despacho inmediato tras responder, sin bloquear la solicitud. */
  kick(): void {
    setImmediate(() => {
      this.dispatch().catch((error: unknown) => this.logger.error({ err: error }, 'error al despachar la outbox'));
    });
  }
}
