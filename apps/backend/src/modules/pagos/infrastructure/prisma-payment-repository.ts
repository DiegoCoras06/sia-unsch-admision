import type { Db, Tx } from '../../../shared/db/prisma.js';
import type {
  AttemptRecord, AttemptWithOrder, OrderRecord, PaymentRepository, SettleData, SettleOutcome,
} from '../application/payment-repository.js';

type Decimalish = { toString(): string };
type OrderRow = { id: string; applicantCode: string; amount: Decimalish; status: OrderRecord['status']; paidAt: Date | null };
type AttemptRow = {
  id: string; orderId: string; provider: string; transactionId: string; orderNumber: string; amount: Decimalish;
  status: AttemptRecord['status']; expiresAt: Date; createdAt: Date; providerMessage: string | null; payMethod: string | null;
  operationNumber: string | null; authorizationCode: string | null; cardMasked: string | null;
};

const toOrder = (o: OrderRow): OrderRecord => ({ id: o.id, applicantCode: o.applicantCode, amount: o.amount.toString(), status: o.status, paidAt: o.paidAt });
const toAttempt = (a: AttemptRow): AttemptRecord => ({
  id: a.id, orderId: a.orderId, provider: a.provider, transactionId: a.transactionId, orderNumber: a.orderNumber,
  amount: a.amount.toString(), status: a.status, expiresAt: a.expiresAt, createdAt: a.createdAt,
  providerMessage: a.providerMessage, payMethod: a.payMethod, operationNumber: a.operationNumber,
  authorizationCode: a.authorizationCode, cardMasked: a.cardMasked,
});
const withOrder = (a: AttemptRow & { order: OrderRow }): AttemptWithOrder => ({ ...toAttempt(a), order: toOrder(a.order) });

/** Repositorio de pagos sobre PostgreSQL (Prisma): órdenes, intentos y su resolución en una transacción. */
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly db: Db) {}

  async findOrder(applicantCode: string) {
    const o = await this.db.paymentOrder.findUnique({ where: { applicantCode } });
    return o ? toOrder(o) : null;
  }

  async ensureOrder(data: { applicantCode: string; callCode: string; amount: string }) {
    const o = await this.db.paymentOrder.upsert({
      where: { applicantCode: data.applicantCode },
      create: { applicantCode: data.applicantCode, callCode: data.callCode, concept: 'INSCRIPCION', amount: data.amount },
      update: {},
    });
    return toOrder(o);
  }

  async orderWithLastAttempt(applicantCode: string) {
    const o = await this.db.paymentOrder.findUnique({ where: { applicantCode }, include: { attempts: { orderBy: { createdAt: 'desc' }, take: 1 } } });
    if (!o) return null;
    return { ...toOrder(o), lastAttempt: o.attempts[0] ? toAttempt(o.attempts[0]) : null };
  }

  async findAttempt(transactionId: string) {
    const a = await this.db.paymentAttempt.findUnique({ where: { transactionId }, include: { order: true } });
    return a ? withOrder(a) : null;
  }

  async getAttempt(id: string) {
    return withOrder(await this.db.paymentAttempt.findUniqueOrThrow({ where: { id }, include: { order: true } }));
  }

  async listAttempts(orderId: string) {
    return (await this.db.paymentAttempt.findMany({ where: { orderId }, orderBy: { createdAt: 'desc' } })).map(toAttempt);
  }

  countAttempts(orderId: string) {
    return this.db.paymentAttempt.count({ where: { orderId } });
  }

  async createAttempt(data: { orderId: string; provider: string; transactionId: string; orderNumber: string; amount: string; expiresAt: Date }) {
    return toAttempt(await this.db.paymentAttempt.create({ data }));
  }

  async claimForCharge(attemptId: string) {
    const r = await this.db.paymentAttempt.updateMany({ where: { id: attemptId, status: 'INICIADO', providerCode: null }, data: { providerCode: 'EN_COBRO' } });
    return r.count === 1;
  }

  async noteNoResponse(attemptId: string, message: string) {
    await this.db.paymentAttempt.update({ where: { id: attemptId }, data: { providerMessage: message } });
  }

  async expireStale(orderId: string, now: Date) {
    await this.db.paymentAttempt.updateMany({ where: { orderId, status: 'INICIADO', expiresAt: { lt: now } }, data: { status: 'VENCIDO' } });
  }

  settle(
    attempt: AttemptRecord,
    data: SettleData,
    then: (outcome: Exclude<SettleOutcome, 'IGNORADO'>, order: OrderRecord, tx: Tx) => Promise<void>,
  ): Promise<SettleOutcome> {
    const { approved, ...columns } = data;
    return this.db.$transaction(async (tx) => {
      // Solo un resultado por intento: si ya estaba resuelto, no se toca nada.
      const claimed = await tx.paymentAttempt.updateMany({
        where: { id: attempt.id, status: { in: ['INICIADO', 'VENCIDO'] } },
        data: { status: approved ? 'AUTORIZADO' : 'RECHAZADO', ...columns },
      });
      if (claimed.count === 0) return 'IGNORADO';
      const order = toOrder(await tx.paymentOrder.findUniqueOrThrow({ where: { id: attempt.orderId } }));
      if (!approved) {
        await then('RECHAZADO', order, tx);
        return 'RECHAZADO';
      }
      const paid = await tx.paymentOrder.updateMany({ where: { id: order.id, status: 'PENDIENTE' }, data: { status: 'PAGADA', paidAt: data.confirmedAt } });
      if (paid.count === 1) {
        await then('CONFIRMADO', order, tx);
        return 'CONFIRMADO';
      }
      // Segundo pago aprobado de una orden ya pagada: queda DUPLICADO para que Tesorería lo devuelva.
      await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { status: 'DUPLICADO' } });
      await then('DUPLICADO', order, tx);
      return 'DUPLICADO';
    });
  }
}
