import type { Tx } from '../../../shared/db/prisma.js';
import type { AttemptStatus, OrderStatus } from '../domain/payment-rules.js';

/** Orden de pago de una inscripción (una por código de postulante). */
export interface OrderRecord {
  id: string;
  applicantCode: string;
  amount: string;
  status: OrderStatus;
  paidAt: Date | null;
}

/** Intento de pago en línea de una orden. */
export interface AttemptRecord {
  id: string;
  orderId: string;
  provider: string;
  transactionId: string;
  orderNumber: string;
  amount: string;
  status: AttemptStatus;
  expiresAt: Date;
  createdAt: Date;
  providerMessage: string | null;
  payMethod: string | null;
  operationNumber: string | null;
  authorizationCode: string | null;
  cardMasked: string | null;
}

export interface AttemptWithOrder extends AttemptRecord {
  order: OrderRecord;
}

/** Resultado de la pasarela listo para guardar (ya recortado al tamaño de cada columna). */
export interface SettleData {
  approved: boolean;
  providerCode: string | null;
  providerMessage: string | null;
  payMethod: string | null;
  authorizationCode: string | null;
  operationNumber: string | null;
  referenceNumber: string | null;
  cardMasked: string | null;
  confirmedVia: 'SDK' | 'CONSULTA';
  confirmedAt: Date;
}

/**
 * Qué pasó al guardar el resultado: el intento ya estaba resuelto (IGNORADO), fue rechazado, confirmó la orden
 * o llegó un segundo pago aprobado para una orden ya pagada (DUPLICADO).
 */
export type SettleOutcome = 'IGNORADO' | 'RECHAZADO' | 'CONFIRMADO' | 'DUPLICADO';

/**
 * Repositorio de M04 Pagos (Clean Architecture): el caso de uso decide, el repositorio guarda.
 * La implementación con Prisma está en `infrastructure/prisma-payment-repository.ts`.
 */
export interface PaymentRepository {
  findOrder(applicantCode: string): Promise<OrderRecord | null>;
  /** Crea la orden si no existe; si existe, la devuelve sin cambiarla. */
  ensureOrder(data: { applicantCode: string; callCode: string; amount: string }): Promise<OrderRecord>;
  orderWithLastAttempt(applicantCode: string): Promise<(OrderRecord & { lastAttempt: AttemptRecord | null }) | null>;

  findAttempt(transactionId: string): Promise<AttemptWithOrder | null>;
  getAttempt(id: string): Promise<AttemptWithOrder>;
  listAttempts(orderId: string): Promise<AttemptRecord[]>;
  countAttempts(orderId: string): Promise<number>;
  createAttempt(data: { orderId: string; provider: string; transactionId: string; orderNumber: string; amount: string; expiresAt: Date }): Promise<AttemptRecord>;
  /** Reserva el intento para cobrarlo una sola vez; false si ya está en cobro o resuelto. */
  claimForCharge(attemptId: string): Promise<boolean>;
  noteNoResponse(attemptId: string, message: string): Promise<void>;
  /** Los intentos iniciados que pasaron su plazo quedan VENCIDO. */
  expireStale(orderId: string, now: Date): Promise<void>;

  /**
   * Guarda el resultado en una sola transacción y aplica sus efectos sobre la orden.
   * `then` corre dentro de la misma transacción (auditoría y eventos) solo si algo cambió.
   */
  settle(
    attempt: AttemptRecord,
    data: SettleData,
    then: (outcome: Exclude<SettleOutcome, 'IGNORADO'>, order: OrderRecord, tx: Tx) => Promise<void>,
  ): Promise<SettleOutcome>;
}
