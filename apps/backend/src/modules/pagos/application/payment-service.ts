import type { Logger } from 'pino';
import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db, Tx } from '../../../shared/db/prisma.js';
import type { Outbox } from '../../../shared/events/outbox.js';
import { AppError, businessRule, conflict, notFound, validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import type { PaymentContext } from '../../inscripciones/index.js';
import {
  ATTEMPT_LABEL, ATTEMPT_TTL_SECONDS, YAPE_MAX_AMOUNT, formatAmount, newTransactionId, orderNumberFor,
  type AttemptStatus, type OrderStatus, type ProviderResult,
} from '../domain/payment-rules.js';
import type { PaymentGateway } from '../domain/ports.js';

/** Lo que el navegador necesita para abrir Culqi Checkout (tarjeta y Yape), sin la llave secreta (ADR-024). */
export interface PaymentSessionDto {
  provider: PaymentGateway['provider'];
  environment: PaymentGateway['environment'];
  publicKey: string;
  transactionId: string;
  orderNumber: string;
  amount: string;
  /** Monto en céntimos, como lo pide Culqi. */
  amountCents: number;
  currency: 'PEN';
  /** Yape solo acepta hasta S/ 2000 por pago (ADR-019). */
  yape: boolean;
}

export interface AttemptResultDto {
  transactionId: string;
  status: AttemptStatus;
  label: string;
  message: string | null;
  orderStatus: OrderStatus;
}

export interface PaymentStatusDto {
  provider: PaymentGateway['provider'];
  environment: PaymentGateway['environment'];
  order: {
    orderNumber: string | null;
    amount: string;
    status: OrderStatus;
    paidAt: string | null;
    receipt: { operationNumber: string | null; authorizationCode: string | null; payMethod: string | null; cardMasked: string | null; transactionId: string } | null;
  };
  attempts: { transactionId: string; orderNumber: string; status: AttemptStatus; label: string; message: string | null; payMethod: string | null; createdAt: string }[];
  /** Tope de Yape por pago. */
  yapeMaxAmount: string;
}

type Via = 'SDK' | 'CONSULTA';
type Attempt = NonNullable<Awaited<ReturnType<Db['paymentAttempt']['findUnique']>>>;

/** Casos de uso de M04 Pagos (spec 005, ADR-024): Culqi cobra con tarjeta y con Yape. */
export class PaymentService {
  constructor(
    private readonly d: {
      db: Db;
      clock: Clock;
      outbox: Outbox;
      audit: AuditLog;
      limiter: RateLimiter;
      gateway: PaymentGateway;
      logger: Logger;
      inscriptions: { paymentContext(documentNumber: string, applicantCode: string): Promise<PaymentContext> };
    },
  ) {}

  /** H1: abre un intento de pago; el navegador abre Culqi Checkout con la llave pública y el monto de la orden. */
  async startSession(documentNumber: string, applicantCode: string, meta: RequestMeta): Promise<PaymentSessionDto> {
    const g = this.d.gateway;
    const { attempt, amount } = await this.openAttempt(documentNumber, applicantCode, meta);
    await this.d.audit.record({
      actorUserId: null, action: 'payment.started', resourceType: 'payment_attempt', resourceId: attempt.transactionId,
      after: { applicantCode, orderNumber: attempt.orderNumber, amount, provider: g.provider }, ...meta,
    });
    return {
      provider: g.provider, environment: g.environment, publicKey: g.publicKey,
      transactionId: attempt.transactionId, orderNumber: attempt.orderNumber,
      amount, amountCents: Math.round(Number(amount) * 100), currency: 'PEN',
      yape: Number(amount) <= YAPE_MAX_AMOUNT,
    };
  }

  /**
   * H1 (ADR-024): el navegador entrega el token de Culqi (tarjeta o Yape) y el servidor crea el cargo.
   * El resultado es la respuesta del cargo, servidor a servidor; un intento se cobra una sola vez.
   */
  async charge(documentNumber: string, applicantCode: string, transactionId: string, token: string, meta: RequestMeta): Promise<AttemptResultDto> {
    const g = this.d.gateway;
    if (!g.acceptsToken(token)) throw validationError('El token de pago no es válido.', [{ field: 'token', issue: 'formato' }]);
    await this.d.limiter.consume(`payment-charge:${meta.ipHash}`, 10, 3600);
    // DNI + código: solo el postulante cobra su propio intento; el correo del cargo es el de la inscripción.
    const ctx = await this.d.inscriptions.paymentContext(documentNumber, applicantCode);
    const attempt = await this.d.db.paymentAttempt.findUnique({ where: { transactionId }, include: { order: true } });
    if (!attempt || attempt.provider !== g.provider || attempt.order.applicantCode !== applicantCode) {
      throw notFound('No encontramos ese intento de pago.');
    }
    if (attempt.expiresAt < this.d.clock.now()) throw businessRule('ATTEMPT_EXPIRED', 'Pasó el tiempo para este pago. Vuelve a pulsar «Pagar».');
    if (token.startsWith('ype_') && Number(attempt.amount) > YAPE_MAX_AMOUNT) {
      throw businessRule('YAPE_LIMIT', `Yape acepta pagos de hasta S/ ${YAPE_MAX_AMOUNT}. Paga con tarjeta o en ventanilla.`);
    }
    // Reserva el intento: dos tokens para el mismo intento no generan dos cargos.
    const claimed = await this.d.db.paymentAttempt.updateMany({
      where: { id: attempt.id, status: 'INICIADO', providerCode: null },
      data: { providerCode: 'EN_COBRO' },
    });
    if (claimed.count === 0) throw conflict('ATTEMPT_IN_USE', 'Este pago ya se está procesando. Revisa el estado en unos segundos.');

    let result: ProviderResult;
    try {
      result = await g.charge({
        transactionId: attempt.transactionId, orderNumber: attempt.orderNumber, applicantCode: attempt.order.applicantCode,
        amountCents: Math.round(Number(attempt.amount) * 100), email: ctx.email,
        token, description: `Admisión UNSCH - pedido ${attempt.orderNumber}`,
      });
    } catch (error) {
      await this.d.db.paymentAttempt.update({ where: { id: attempt.id }, data: { providerMessage: 'Sin respuesta de Culqi: Tesorería lo verificará' } });
      throw error;
    }
    if (!this.matches(attempt, result)) {
      this.d.logger.warn({ transactionId: attempt.transactionId }, 'cargo con monto o moneda distintos');
      throw new AppError(400, 'PAYMENT_MISMATCH', 'La respuesta de la pasarela no corresponde a tu orden.');
    }
    return this.apply(attempt, result, 'SDK', meta);
  }

  /** H2: estado de la orden e historial; los intentos sin respuesta vencen. */
  async status(documentNumber: string, applicantCode: string, meta: RequestMeta): Promise<PaymentStatusDto> {
    await this.d.limiter.consume(`payment-status:${meta.ipHash}`, 30, 3600);
    const ctx = await this.d.inscriptions.paymentContext(documentNumber, applicantCode);
    const order = await this.d.db.paymentOrder.findUnique({ where: { applicantCode } });
    if (order) await this.expireStale(order.id);
    const attempts = order
      ? await this.d.db.paymentAttempt.findMany({ where: { orderId: order.id }, orderBy: { createdAt: 'desc' } })
      : [];
    const paid = attempts.find((a) => a.status === 'AUTORIZADO');
    return {
      provider: this.d.gateway.provider,
      environment: this.d.gateway.environment,
      order: {
        orderNumber: paid?.orderNumber ?? attempts[0]?.orderNumber ?? null,
        amount: formatAmount(order?.amount ?? ctx.amount),
        status: order?.status ?? 'PENDIENTE',
        paidAt: order?.paidAt?.toISOString() ?? null,
        receipt: paid
          ? { operationNumber: paid.operationNumber, authorizationCode: paid.authorizationCode, payMethod: paid.payMethod, cardMasked: paid.cardMasked, transactionId: paid.transactionId }
          : null,
      },
      attempts: attempts.map((a) => ({
        transactionId: a.transactionId, orderNumber: a.orderNumber, status: a.status, label: ATTEMPT_LABEL[a.status],
        message: a.providerMessage, payMethod: a.payMethod, createdAt: a.createdAt.toISOString(),
      })),
      yapeMaxAmount: formatAmount(YAPE_MAX_AMOUNT),
    };
  }

  /** API pública para M10 Asistente: estado de la orden por código ya verificado (sin datos de tarjeta). */
  async orderSummary(applicantCode: string) {
    const order = await this.d.db.paymentOrder.findUnique({
      where: { applicantCode },
      include: { attempts: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order) return { estadoPago: 'Sin pagos en línea registrados', pagado: false, monto: null, pagadoEl: null, ultimoIntento: null };
    const last = order.attempts[0];
    return {
      estadoPago: order.status === 'PAGADA' ? 'Pago confirmado' : 'Pendiente de pago',
      pagado: order.status === 'PAGADA',
      monto: formatAmount(order.amount),
      pagadoEl: order.paidAt?.toISOString() ?? null,
      ultimoIntento: last ? ATTEMPT_LABEL[last.status] : null,
    };
  }

  /** Abre un intento de la orden de la inscripción (reglas comunes a tarjeta y Yape). */
  private async openAttempt(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    await this.d.limiter.consume(`payment-session:${meta.ipHash}`, 10, 3600);
    const ctx = await this.d.inscriptions.paymentContext(documentNumber, applicantCode);
    if (ctx.status === 'ANULADA') throw businessRule('PAYMENT_NOT_REQUIRED', 'La inscripción está anulada; no corresponde pagar.');
    // RN-24 (spec 004, FR-008): el exonerado paga solo con su expediente autorizado.
    if (ctx.status === 'PENDIENTE_VALIDACION' || ctx.status === 'OBSERVADA') {
      throw businessRule('DOSSIER_NOT_AUTHORIZED', 'Primero tu expediente debe ser autorizado. Revisa su estado en «Mi inscripción».');
    }

    const order = await this.d.db.paymentOrder.upsert({
      where: { applicantCode },
      create: { applicantCode, callCode: ctx.callCode, concept: 'INSCRIPCION', amount: ctx.amount },
      update: {},
    });
    if (order.status === 'PAGADA') throw conflict('ALREADY_PAID', 'Tu pago ya fue confirmado. Descarga tu constancia en «Mi inscripción».');
    const amount = formatAmount(order.amount);
    await this.expireStale(order.id);

    const now = this.d.clock.now();
    const index = (await this.d.db.paymentAttempt.count({ where: { orderId: order.id } })) + 1;
    if (index > 20) throw businessRule('TOO_MANY_ATTEMPTS', 'Superaste los intentos de pago en línea. Paga en ventanilla con tu código de postulante.');
    const attempt = await this.d.db.paymentAttempt.create({
      data: {
        orderId: order.id,
        provider: this.d.gateway.provider,
        transactionId: newTransactionId(now),
        orderNumber: orderNumberFor(applicantCode, index),
        amount: order.amount,
        expiresAt: new Date(now.getTime() + ATTEMPT_TTL_SECONDS * 1000),
      },
    });
    return { ctx, attempt, amount, now };
  }

  private matches(attempt: Attempt, r: ProviderResult): boolean {
    if (r.orderNumber && r.orderNumber !== attempt.orderNumber) return false;
    if (r.currency && r.currency !== 'PEN') return false;
    if (r.approved && (!r.amount || Number(r.amount).toFixed(2) !== formatAmount(attempt.amount))) return false;
    return true;
  }

  /** Aplica un resultado una sola vez (FR-005); un segundo pago aprobado de una orden pagada queda DUPLICADO. */
  private async apply(attempt: Attempt, r: ProviderResult, via: Via, meta: RequestMeta | null): Promise<AttemptResultDto> {
    if (!r.inconclusive) {
      const now = this.d.clock.now();
      await this.d.db.$transaction(async (tx) => {
        const claimed = await tx.paymentAttempt.updateMany({
          where: { id: attempt.id, status: { in: ['INICIADO', 'VENCIDO'] } },
          data: {
            status: r.approved ? 'AUTORIZADO' : 'RECHAZADO',
            providerCode: r.code.slice(0, 30) || null,
            // Lo que llega de la pasarela se recorta al tamaño de cada columna.
            providerMessage: r.message?.slice(0, 120) || null,
            payMethod: r.payMethod?.slice(0, 20) ?? null,
            authorizationCode: r.authorizationCode?.slice(0, 20) ?? null,
            operationNumber: r.operationNumber?.slice(0, 40) ?? null,
            referenceNumber: r.referenceNumber?.slice(0, 40) ?? null,
            cardMasked: r.cardMasked?.slice(0, 30) ?? null,
            confirmedVia: via,
            confirmedAt: now,
          },
        });
        if (claimed.count === 0 || !r.approved) {
          if (claimed.count === 1) await this.audit(tx, 'payment.rejected', attempt, { code: r.code, via }, meta);
          return;
        }
        const order = await tx.paymentOrder.findUniqueOrThrow({ where: { id: attempt.orderId } });
        const paid = await tx.paymentOrder.updateMany({ where: { id: order.id, status: 'PENDIENTE' }, data: { status: 'PAGADA', paidAt: now } });
        if (paid.count === 1) {
          await this.audit(tx, 'payment.confirmed', attempt, { operationNumber: r.operationNumber, via }, meta);
          await this.d.outbox.publish(tx, 'PagoConfirmado', {
            applicantCode: order.applicantCode,
            amount: formatAmount(order.amount), operationNumber: r.operationNumber ?? attempt.transactionId,
            payMethod: r.payMethod ?? 'en línea', paidAt: now.toISOString(),
          }, meta?.requestId);
        } else {
          await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { status: 'DUPLICADO' } });
          await this.audit(tx, 'payment.duplicate', attempt, { operationNumber: r.operationNumber, via }, meta);
          await this.d.outbox.publish(tx, 'PagoDuplicado', {
            applicantCode: order.applicantCode, transactionId: attempt.transactionId,
            amount: formatAmount(attempt.amount), operationNumber: r.operationNumber ?? '',
          }, meta?.requestId);
        }
      });
      this.d.outbox.kick();
    }
    const current = await this.d.db.paymentAttempt.findUniqueOrThrow({ where: { id: attempt.id }, include: { order: true } });
    return {
      transactionId: current.transactionId,
      status: current.status,
      label: ATTEMPT_LABEL[current.status],
      message: current.providerMessage,
      orderStatus: current.order.status,
    };
  }

  private async expireStale(orderId: string): Promise<void> {
    await this.d.db.paymentAttempt.updateMany({
      where: { orderId, status: 'INICIADO', expiresAt: { lt: this.d.clock.now() } },
      data: { status: 'VENCIDO' },
    });
  }

  private audit(tx: Tx, action: string, attempt: Attempt, after: Record<string, unknown>, meta: RequestMeta | null) {
    return this.d.audit.record({
      actorUserId: null, action, resourceType: 'payment_attempt', resourceId: attempt.transactionId,
      after: { orderNumber: attempt.orderNumber, ...after },
      requestId: meta?.requestId ?? null, ipHash: meta?.ipHash ?? null, userAgent: meta?.userAgent ?? null,
    }, tx);
  }
}
