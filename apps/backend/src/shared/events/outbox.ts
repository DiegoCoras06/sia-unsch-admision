import type { Logger } from 'pino';
import type { Db, Tx } from '../db/prisma.js';
import type { Clock } from '../clock/clock.js';
import type { EventQueue } from './event-queue.js';

/** Eventos de dominio conocidos (ADR-008). El contenido nunca incluye contraseñas ni tokens. */
export interface DomainEvents {
  CasoContactoCreado: { caseNumber: string; name: string; email: string };
  CodigoVerificacionSolicitado: { userId: string; email: string; code: string; firstNames: string };
  CuentaCreada: { userId: string; email: string; firstNames: string; applicantCode: string };
  CuentaBloqueada: { userId: string; email: string; lockedUntil: string };
  RecuperacionSolicitada: { userId: string; email: string; resetUrl: string };
  ContrasenaCambiada: { userId: string; email: string };
  /** Entró desde un navegador o sistema que la cuenta nunca usó. */
  InicioSesionNuevo: { email: string; device: string; at: string; staff: boolean };
  InscripcionRegistrada: {
    email: string;
    firstNames: string;
    applicantCode: string;
    program: string;
    modality: string;
    total: string;
    status: string;
    examDate: string;
  };
  PagoConfirmado: { applicantCode: string; amount: string; operationNumber: string; payMethod: string; paidAt: string };
  PagoDuplicado: { applicantCode: string; transactionId: string; amount: string; operationNumber: string };
  ExpedienteEnviado: { applicantCode: string; email: string; firstNames: string; resubmitted: boolean };
  ExpedienteDictaminado: {
    applicantCode: string;
    email: string;
    firstNames: string;
    decision: 'AUTORIZADO' | 'OBSERVADO' | 'RECHAZADO' | 'NO_SUBSANADO';
    note: string | null;
    deadline: string | null;
    observed: string[];
  };
  /** M03: Admisión anuló una inscripción (RF-11.03). */
  InscripcionAnulada: { applicantCode: string; email: string; firstNames: string; reason: string };
  CodigoPostulanteRecordado: { applicantCode: string; email: string; firstNames: string };
  /** M08: cambio de aula de un postulante ya publicado (RF-08.09). */
  AulaCambiada: {
    applicantCode: string;
    email: string;
    firstNames: string;
    exam: string;
    room: string;
    reason: string;
  };
  /** M07: reprogramación autorizada de un examen (RF-07.09). */
  ExamenReprogramado: {
    applicantCode: string;
    email: string;
    firstNames: string;
    exam: string;
    when: string;
    reason: string;
  };
  /** M08: incidencia durante el examen, para la Comisión (RN-60). */
  IncidenciaRegistrada: {
    to: string[];
    exam: string;
    room: string;
    type: string;
    description: string;
    applicantCode: string | null;
    at: string;
  };
}
export type EventType = keyof DomainEvents;

const SECRET_BEARING_EVENTS = new Set<EventType>([
  'CodigoVerificacionSolicitado',
  'RecuperacionSolicitada',
  'CodigoPostulanteRecordado',
]);
type Handler<T extends EventType> = (payload: DomainEvents[T], meta: { eventId: string }) => Promise<void>;

/** Un evento enviado a la cola y no procesado en este tiempo se vuelve a enviar (mensaje perdido o con errores). */
const REQUEUE_AFTER_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;
const RETRY_BASE_MS = 5_000;
/** Si quien reservó un evento muere sin terminar, otro lo retoma pasado este tiempo. */
const CLAIM_MS = 2 * 60_000;
/** Reserva corta del relay; no significa que SQS haya aceptado el mensaje. */
const RELAY_CLAIM_MS = 2 * 60_000;

/**
 * Transactional Outbox (ADR-008): `publish` guarda el evento en la misma transacción que el cambio de estado.
 * - Sin cola: `dispatch` lo procesa aquí mismo (tarea cada minuto, o inmediatamente tras la respuesta).
 * - Con cola (ADR-021, Amazon SQS): `dispatch` solo envía los ID a la cola y el worker los procesa con `processEvent`.
 */
export class Outbox {
  private readonly handlers = new Map<EventType, Handler<EventType>[]>();
  /** Despacho en curso de este proceso: uno nuevo lo espera en lugar de cruzarse con él. */
  private running: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
    private readonly logger: Logger,
    private readonly queue: EventQueue | null = null,
  ) {}

  get usesQueue(): boolean {
    return this.queue !== null;
  }

  async publish<T extends EventType>(tx: Tx, type: T, payload: DomainEvents[T], correlationId?: string): Promise<void> {
    await tx.outboxEvent.create({
      data: { eventType: type, payload: payload as object, correlationId: correlationId ?? null },
    });
  }

  subscribe<T extends EventType>(type: T, handler: Handler<T>): void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler as unknown as Handler<EventType>);
    this.handlers.set(type, list);
  }

  /** Entrega los eventos pendientes: los procesa aquí, o los envía a la cola si la hay. Devuelve cuántos atendió. */
  dispatch(batchSize = 20): Promise<number> {
    const run = this.running.catch(() => undefined).then(() => this.dispatchNow(batchSize));
    this.running = run;
    return run;
  }

  private async dispatchNow(batchSize: number): Promise<number> {
    if (this.queue) return this.relay(batchSize);
    const pending = await this.db.outboxEvent.findMany({
      where: {
        processedAt: null,
        deadLetteredAt: null,
        attempts: { lt: MAX_ATTEMPTS },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: this.clock.now() } }],
      },
      orderBy: { occurredAt: 'asc' },
      take: batchSize,
      select: { id: true },
    });
    for (const event of pending) await this.processEvent(event.id);
    return pending.length;
  }

  /**
   * Procesa un evento una sola vez aunque llegue repetido (SQS entrega «al menos una vez»).
   * Devuelve `false` si un suscriptor falló, para que la cola lo reintente.
   */
  async processEvent(eventId: string): Promise<boolean> {
    const event = await this.db.outboxEvent.findUnique({ where: { id: eventId } });
    if (!event || event.processedAt) return true;
    // Un poison message debe continuar fallando para que SQS lo mueva a su DLQ.
    if (event.deadLetteredAt || event.attempts >= MAX_ATTEMPTS) return false;
    // Reserva el evento: el contador solo no basta, porque otro procesador leería el ya incrementado y lo tomaría también.
    const now = this.clock.now();
    if (event.nextAttemptAt && event.nextAttemptAt > now) return false;
    const claimed = await this.db.outboxEvent.updateMany({
      where: {
        id: event.id,
        processedAt: null,
        attempts: event.attempts,
        OR: [{ claimedAt: null }, { claimedAt: { lt: new Date(now.getTime() - CLAIM_MS) } }],
      },
      data: { attempts: { increment: 1 }, claimedAt: now },
    });
    if (claimed.count === 0) return true;
    try {
      for (const handler of this.handlers.get(event.eventType as EventType) ?? []) {
        await handler(event.payload as never, { eventId: event.id });
      }
      // Los eventos con secretos de un solo uso (código, enlace) no conservan su contenido tras el envío.
      const redact = SECRET_BEARING_EVENTS.has(event.eventType as EventType);
      await this.db.outboxEvent.update({
        where: { id: event.id },
        data: {
          processedAt: this.clock.now(),
          lastError: null,
          nextAttemptAt: null,
          ...(redact ? { payload: { redacted: true } } : {}),
        },
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        { eventId: event.id, eventType: event.eventType, err: message },
        'falló un suscriptor de la outbox',
      );
      const attempts = event.attempts + 1;
      const dead = attempts >= MAX_ATTEMPTS;
      const delay = Math.min(5 * 60_000, RETRY_BASE_MS * 2 ** Math.max(0, attempts - 1));
      await this.db.outboxEvent.update({
        where: { id: event.id },
        data: {
          lastError: message.slice(0, 500),
          claimedAt: null,
          queuedAt: null,
          nextAttemptAt: dead ? null : new Date(this.clock.now().getTime() + delay),
          deadLetteredAt: dead ? this.clock.now() : null,
        },
      });
      return false;
    }
  }

  /**
   * Envía a la cola los eventos aún no enviados y reenvía los atascados. Marca `queuedAt` con un UPDATE atómico,
   * así dos peticiones simultáneas no envían el mismo evento.
   */
  private async relay(batchSize: number): Promise<number> {
    const now = this.clock.now();
    const stale = new Date(now.getTime() - REQUEUE_AFTER_MS);
    const abandonedClaim = new Date(now.getTime() - RELAY_CLAIM_MS);
    const rows = await this.db.$queryRaw<{ id: string }[]>`
      UPDATE "shared"."outbox" SET "relay_claimed_at" = ${now}
      WHERE "id" IN (
        SELECT "id" FROM "shared"."outbox"
        WHERE "processed_at" IS NULL AND "dead_lettered_at" IS NULL AND "attempts" < ${MAX_ATTEMPTS}
          AND ("next_attempt_at" IS NULL OR "next_attempt_at" <= ${now})
          AND ("queued_at" IS NULL OR "queued_at" < ${stale})
          AND ("relay_claimed_at" IS NULL OR "relay_claimed_at" < ${abandonedClaim})
        ORDER BY "occurred_at" LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id"`;
    if (!rows.length) return 0;
    const ids = rows.map((row) => row.id);
    try {
      const result = await this.queue!.send(ids);
      if (result.sent.length) {
        await this.db.outboxEvent.updateMany({
          where: { id: { in: result.sent }, relayClaimedAt: now },
          data: { queuedAt: this.clock.now(), relayClaimedAt: null },
        });
      }
      const failed = new Set(result.failed.map((entry) => entry.eventId));
      for (const id of ids) if (!result.sent.includes(id)) failed.add(id);
      if (failed.size) {
        await this.db.outboxEvent.updateMany({
          where: { id: { in: [...failed] }, relayClaimedAt: now },
          data: { relayClaimedAt: null },
        });
      }
      return result.sent.length;
    } catch (error) {
      // Si SQS no responde, se libera la marca y la próxima tarea programada los vuelve a intentar.
      this.logger.error({ err: error }, 'no se pudieron enviar eventos a la cola');
      await this.db.outboxEvent.updateMany({
        where: { id: { in: ids }, relayClaimedAt: now },
        data: { relayClaimedAt: null },
      });
      return 0;
    }
  }

  /** Despacho inmediato tras responder, sin bloquear la solicitud. */
  kick(): void {
    setImmediate(() => {
      this.dispatch().catch((error: unknown) => this.logger.error({ err: error }, 'error al despachar la outbox'));
    });
  }

  async stats(): Promise<{ pending: number; dead: number; oldestPendingAt: string | null }> {
    const now = this.clock.now();
    const [pending, dead, oldest] = await Promise.all([
      this.db.outboxEvent.count({ where: { processedAt: null, deadLetteredAt: null } }),
      this.db.outboxEvent.count({ where: { deadLetteredAt: { not: null } } }),
      this.db.outboxEvent.findFirst({
        where: {
          processedAt: null,
          deadLetteredAt: null,
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
        orderBy: { occurredAt: 'asc' },
        select: { occurredAt: true },
      }),
    ]);
    return { pending, dead, oldestPendingAt: oldest?.occurredAt.toISOString() ?? null };
  }

  async deadLetters(limit = 50) {
    return this.db.outboxEvent.findMany({
      where: { deadLetteredAt: { not: null } },
      orderBy: { deadLetteredAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
      select: {
        id: true,
        eventType: true,
        occurredAt: true,
        deadLetteredAt: true,
        attempts: true,
        lastError: true,
        correlationId: true,
      },
    });
  }

  async retryDead(eventId: string): Promise<boolean> {
    const reset = await this.db.outboxEvent.updateMany({
      where: { id: eventId, deadLetteredAt: { not: null }, processedAt: null },
      data: {
        attempts: 0,
        lastError: null,
        deadLetteredAt: null,
        nextAttemptAt: null,
        claimedAt: null,
        relayClaimedAt: null,
        queuedAt: null,
      },
    });
    if (reset.count) this.kick();
    return reset.count === 1;
  }
}
