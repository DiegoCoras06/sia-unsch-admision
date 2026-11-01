import type { Logger } from 'pino';
import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db, Tx } from '../../../shared/db/prisma.js';
import type { Outbox } from '../../../shared/events/outbox.js';
import { AppError, businessRule, conflict, notFound } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import type { PaymentContext } from '../../inscripciones/index.js';
import {
  ATTEMPT_LABEL, ATTEMPT_TTL_SECONDS, YAPE_MAX_AMOUNT, formatAmount, newTransactionId, orderNumberFor,
  type AttemptStatus, type OrderStatus, type ProviderResult,
} from '../domain/payment-rules.js';
import type { CheckoutSession, PaymentGateway, SignedMessage, YapeGateway } from '../domain/ports.js';
import { MockPaymentGateway } from '../infrastructure/mock-gateway.js';
import { sha256Hex } from '../infrastructure/signature.js';

export interface PaymentSessionDto {
  provider: PaymentGateway['provider'];
  environment: PaymentGateway['environment'];
  transactionId: string;
  orderNumber: string;
  amount: string;
  currency: 'PEN';
  checkout: CheckoutSession | null;
}

/** Lo que el navegador necesita para abrir Culqi Checkout con Yape (sin la llave secreta). */
export interface YapeSessionDto {
  provider: 'culqi';
  environment: YapeGateway['environment'];
  publicKey: string;
  transactionId: string;
  orderNumber: string;
  amount: string;
  /** Monto en céntimos, como lo pide Culqi. */
  amountCents: number;
  currency: 'PEN';
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
  /** Yape con Culqi (ADR-019): `null` si no está configurado. */
  yape: { environment: YapeGateway['environment']; maxAmount: string } | null;
}

type Via = 'SDK' | 'IPN' | 'CONSULTA';
type Attempt = NonNullable<Awaited<ReturnType<Db['paymentAttempt']['findUnique']>>>;

/** Casos de uso de M05 Pagos (spec 005 iteración 1, ADR-016). */
export class PaymentService {
  constructor(
    private readonly d: {
      db: Db;
      clock: Clock;
      outbox: Outbox;
      audit: AuditLog;
      limiter: RateLimiter;
      gateway: PaymentGateway;
      /** Segunda pasarela, solo para Yape (ADR-019); sin llaves no se ofrece. */
      yape?: YapeGateway | null;
      logger: Logger;
      inscriptions: { paymentContext(documentNumber: string, applicantCode: string): Promise<PaymentContext> };
    },
  ) {}

  /** H1: abre un intento de pago y pide a la pasarela el token de sesión. */
  async startSession(documentNumber: string, applicantCode: string, meta: RequestMeta): Promise<PaymentSessionDto> {
    const { ctx, attempt, amount, now } = await this.openAttempt(documentNumber, applicantCode, this.d.gateway.provider, meta);

    let checkout: CheckoutSession | null;
    try {
      checkout = await this.d.gateway.createCheckout({
        transactionId: attempt.transactionId,
        orderNumber: attempt.orderNumber,
        amount,
        currency: 'PEN',
        createdAt: now,
        buyer: {
          applicantCode, firstNames: ctx.firstNames, surnames: ctx.surnames, email: ctx.email, mobile: ctx.mobile,
          address: ctx.address, city: ctx.city, state: ctx.state, documentType: ctx.documentType, documentNumber: ctx.documentNumber,
        },
      });
    } catch (error) {
      await this.d.db.paymentAttempt.update({ where: { id: attempt.id }, data: { status: 'VENCIDO', providerMessage: 'No se generó el token de sesión' } });
      throw error;
    }
    await this.d.audit.record({
      actorUserId: null, action: 'payment.started', resourceType: 'payment_attempt', resourceId: attempt.transactionId,
      after: { applicantCode, orderNumber: attempt.orderNumber, amount, provider: this.d.gateway.provider }, ...meta,
    });
    return {
      provider: this.d.gateway.provider,
      environment: this.d.gateway.environment,
      transactionId: attempt.transactionId,
      orderNumber: attempt.orderNumber,
      amount,
      currency: 'PEN',
      checkout,
    };
  }

  /** FR-013 (ADR-019): abre un intento para pagar con Yape mediante Culqi. */
  async startYape(documentNumber: string, applicantCode: string, meta: RequestMeta): Promise<YapeSessionDto> {
    const yape = this.d.yape;
    if (!yape) throw businessRule('YAPE_NOT_AVAILABLE', 'El pago con Yape no está disponible por ahora. Paga con tarjeta o en ventanilla.');
    const { attempt, amount } = await this.openAttempt(documentNumber, applicantCode, yape.provider, meta, (value) => {
      if (Number(value) > YAPE_MAX_AMOUNT) {
        throw businessRule('YAPE_LIMIT', `Yape acepta pagos de hasta S/ ${YAPE_MAX_AMOUNT}. Paga con tarjeta o en ventanilla.`);
      }
    });
    return {
      provider: yape.provider, environment: yape.environment, publicKey: yape.publicKey,
      transactionId: attempt.transactionId, orderNumber: attempt.orderNumber,
      amount, amountCents: Math.round(Number(amount) * 100), currency: 'PEN',
    };
  }

  /**
   * FR-013 (ADR-019): el navegador entrega el token de Yape y el servidor crea el cargo en Culqi.
   * El resultado es la respuesta del cargo (servidor a servidor); un intento se cobra una sola vez.
   */
  async chargeYape(documentNumber: string, applicantCode: string, transactionId: string, token: string, meta: RequestMeta): Promise<AttemptResultDto> {
    const yape = this.d.yape;
    if (!yape) throw businessRule('YAPE_NOT_AVAILABLE', 'El pago con Yape no está disponible por ahora.');
    await this.d.limiter.consume(`payment-yape:${meta.ipHash}`, 10, 3600);
    // DNI + código: solo el postulante cobra su propio intento; el correo del cargo es el de la inscripción.
    const ctx = await this.d.inscriptions.paymentContext(documentNumber, applicantCode);
    const attempt = await this.d.db.paymentAttempt.findUnique({ where: { transactionId }, include: { order: true } });
    if (!attempt || attempt.provider !== yape.provider || attempt.order.applicantCode !== applicantCode) {
      throw notFound('No encontramos ese intento de pago con Yape.');
    }
    if (attempt.expiresAt < this.d.clock.now()) throw businessRule('ATTEMPT_EXPIRED', 'Pasó el tiempo para este pago. Vuelve a pulsar «Pagar».');
    // Reserva el intento: dos tokens para el mismo intento no generan dos cargos.
    const claimed = await this.d.db.paymentAttempt.updateMany({
      where: { id: attempt.id, status: 'INICIADO', providerCode: null },
      data: { providerCode: 'EN_COBRO' },
    });
    if (claimed.count === 0) throw conflict('ATTEMPT_IN_USE', 'Este pago ya se está procesando. Revisa el estado en unos segundos.');

    let result: ProviderResult;
    try {
      result = await yape.charge({
        transactionId: attempt.transactionId, orderNumber: attempt.orderNumber, applicantCode: attempt.order.applicantCode,
        amountCents: Math.round(Number(attempt.amount) * 100), email: ctx.email,
        token, description: `Admisión UNSCH - pedido ${attempt.orderNumber}`,
      });
    } catch (error) {
      await this.d.db.paymentAttempt.update({ where: { id: attempt.id }, data: { providerMessage: 'Sin respuesta de Culqi: Tesorería lo verificará' } });
      throw error;
    }
    if (!this.matches(attempt, result)) {
      this.d.logger.warn({ transactionId: attempt.transactionId }, 'cargo de Yape con monto o moneda distintos');
      throw new AppError(400, 'PAYMENT_MISMATCH', 'La respuesta de Culqi no corresponde a tu orden.');
    }
    return this.apply(attempt, result, 'SDK', meta);
  }

  /** H1: mensaje firmado del proveedor, por el navegador (SDK) o servidor a servidor (IPN). */
  async confirm(message: SignedMessage, via: 'SDK' | 'IPN', meta: RequestMeta): Promise<AttemptResultDto> {
    const result = this.d.gateway.verify(message);
    const log = (outcome: string) => this.d.db.paymentNotification.create({
      data: {
        source: via, transactionId: message.transactionId.slice(0, 40), signatureValid: Boolean(result),
        providerCode: (result?.code ?? message.code ?? '').slice(0, 30) || null, payloadHash: sha256Hex(message.payloadHttp), outcome,
      },
    });
    if (!result || result.transactionId !== message.transactionId) {
      await log('FIRMA_INVALIDA');
      this.d.logger.warn({ transactionId: message.transactionId, via }, 'mensaje de pago con firma inválida');
      throw new AppError(400, 'INVALID_SIGNATURE', 'No pudimos verificar la respuesta de la pasarela.');
    }
    const attempt = await this.d.db.paymentAttempt.findUnique({ where: { transactionId: result.transactionId } });
    if (!attempt) {
      await log('DESCONOCIDO');
      throw notFound('No encontramos ese intento de pago.');
    }
    if (!this.matches(attempt, result)) {
      await log('NO_COINCIDE');
      this.d.logger.warn({ transactionId: attempt.transactionId, via }, 'mensaje de pago con pedido o monto distinto');
      throw new AppError(400, 'PAYMENT_MISMATCH', 'La respuesta de la pasarela no corresponde a tu orden.');
    }
    // Una aprobación que llega por el navegador no basta: se confirma consultando a la pasarela servidor a servidor.
    // Si la consulta no la ratifica, el intento sigue «En proceso» y lo resuelven la IPN o la conciliación de status().
    if (via === 'SDK' && result.approved && this.d.gateway.environment !== 'simulated') {
      const server = await this.d.gateway.query({ transactionId: attempt.transactionId, orderNumber: attempt.orderNumber, amount: formatAmount(attempt.amount) });
      if (!server || server.inconclusive || !server.approved || server.orderNumber !== attempt.orderNumber || !this.matches(attempt, server)) {
        await log('POR_VERIFICAR');
        this.d.logger.warn({ transactionId: attempt.transactionId, serverCode: server?.code ?? null }, 'aprobación del navegador sin ratificar por la pasarela');
        const current = await this.d.db.paymentAttempt.findUniqueOrThrow({ where: { id: attempt.id }, include: { order: true } });
        return {
          transactionId: current.transactionId, status: current.status, label: ATTEMPT_LABEL[current.status],
          message: current.status === 'INICIADO' ? 'Estamos verificando tu pago con la pasarela. Revisa el estado en unos minutos.' : current.providerMessage,
          orderStatus: current.order.status,
        };
      }
      const outcome = await this.apply(attempt, server, 'CONSULTA', meta);
      await log(outcome.status);
      return outcome;
    }
    const outcome = await this.apply(attempt, result, via, meta);
    await log(outcome.status);
    return outcome;
  }

  /** H2: estado de la orden e historial; resuelve intentos sin respuesta consultando al proveedor. */
  async status(documentNumber: string, applicantCode: string, meta: RequestMeta): Promise<PaymentStatusDto> {
    await this.d.limiter.consume(`payment-status:${meta.ipHash}`, 30, 3600);
    const ctx = await this.d.inscriptions.paymentContext(documentNumber, applicantCode);
    let order = await this.d.db.paymentOrder.findUnique({ where: { applicantCode } });
    if (order) {
      await this.reconcile(order.id, meta);
      order = await this.d.db.paymentOrder.findUniqueOrThrow({ where: { id: order.id } });
    }
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
      yape: this.d.yape ? { environment: this.d.yape.environment, maxAmount: formatAmount(YAPE_MAX_AMOUNT) } : null,
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

  /** Solo con la pasarela simulada: el mensaje firmado que daría el formulario. */
  async mockComplete(transactionId: string, approve: boolean): Promise<SignedMessage> {
    if (!(this.d.gateway instanceof MockPaymentGateway)) throw notFound();
    const attempt = await this.d.db.paymentAttempt.findUnique({ where: { transactionId } });
    if (!attempt) throw notFound('No encontramos ese intento de pago.');
    return this.d.gateway.complete({ transactionId, orderNumber: attempt.orderNumber, amount: formatAmount(attempt.amount) }, approve, this.d.clock.now());
  }

  /** Abre un intento de la orden de la inscripción (reglas comunes a tarjeta y Yape). */
  private async openAttempt(documentNumber: string, applicantCode: string, provider: string, meta: RequestMeta, check?: (amount: string) => void) {
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
    check?.(amount);
    await this.expireStale(order.id);

    const now = this.d.clock.now();
    const index = (await this.d.db.paymentAttempt.count({ where: { orderId: order.id } })) + 1;
    if (index > 20) throw businessRule('TOO_MANY_ATTEMPTS', 'Superaste los intentos de pago en línea. Paga en ventanilla con tu código de postulante.');
    const attempt = await this.d.db.paymentAttempt.create({
      data: {
        orderId: order.id,
        provider,
        transactionId: newTransactionId(now),
        orderNumber: orderNumberFor(applicantCode, index),
        amount: order.amount,
        expiresAt: new Date(now.getTime() + ATTEMPT_TTL_SECONDS * 1000),
      },
    });
    if (provider !== this.d.gateway.provider) {
      await this.d.audit.record({
        actorUserId: null, action: 'payment.started', resourceType: 'payment_attempt', resourceId: attempt.transactionId,
        after: { applicantCode, orderNumber: attempt.orderNumber, amount, provider }, ...meta,
      });
    }
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

  /** Intentos sin respuesta: se consulta al proveedor (servidor a servidor) y, si no hay respuesta, vencen. */
  private async reconcile(orderId: string, meta: RequestMeta): Promise<void> {
    const now = this.d.clock.now();
    const pending = await this.d.db.paymentAttempt.findMany({
      where: { orderId, status: 'INICIADO', createdAt: { lt: new Date(now.getTime() - 60_000) } },
    });
    for (const attempt of pending) {
      if (attempt.provider !== this.d.gateway.provider) continue;
      const r = await this.d.gateway.query({ transactionId: attempt.transactionId, orderNumber: attempt.orderNumber, amount: formatAmount(attempt.amount) });
      if (r && !r.inconclusive && r.orderNumber === attempt.orderNumber && this.matches(attempt, r)) {
        await this.apply(attempt, r, 'CONSULTA', meta);
      }
    }
    await this.expireStale(orderId);
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
