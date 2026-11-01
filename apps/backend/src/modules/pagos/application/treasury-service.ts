import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Db } from '../../../shared/db/prisma.js';
import { businessRule, conflict, forbidden, notFound, validationError } from '../../../shared/http/errors.js';

export const RECONCILIATION_LABEL = {
  CONCILIADO: 'Conciliado',
  DIFERENCIA_MONTO: 'Diferencia de monto',
  DIFERENCIA_ESTADO: 'Diferencia de estado',
  SOLO_PROVEEDOR: 'Solo en el reporte',
  SOLO_SISTEMA: 'Solo en el sistema',
} as const;
type Result = keyof typeof RECONCILIATION_LABEL;

/** RN-08 (Art. 18): no hay devolución por desistimiento; solo se corrige un error de cobro. */
export const ANNULMENT_REASONS = {
  COBRO_DUPLICADO: 'Cobro duplicado (el postulante pagó dos veces)',
  COBRO_INDEBIDO: 'Cobro indebido (monto distinto al de la orden)',
  ERROR_PROVEEDOR: 'Error de la pasarela o del banco',
} as const;
type Reason = keyof typeof ANNULMENT_REASONS;

const PAID = new Set(['AUTORIZADO', 'DUPLICADO']);
/** Estados del reporte del proveedor o de Tesorería normalizados a pagado / no pagado. */
const providerPaid = (s: string) => /^(PAGAD[OA]|AUTORIZAD[OA]|APROBAD[OA]|PAID|CAPTURED|CONFIRMAD[OA]|ABONAD[OA])$/i.test(s.trim());
const money = (n: number) => n.toFixed(2);

/** Tesorería (spec 005, Historias 4 y 5): conciliación con el reporte externo y anulaciones por error de cobro. */
export class TreasuryService {
  constructor(private readonly d: { db: Db; audit: AuditLog }) {}

  // ── H4: conciliación (RF-05.11) ────────────────────────────────────
  /**
   * CSV con encabezado: `pedido` o `transaccion`, `monto`, `estado` (y opcionales `fecha`, `operacion`).
   * Cruza cada fila con los intentos del sistema y agrega lo pagado en el sistema que no figura en el reporte.
   */
  async reconcile(input: { source: string; fileName: string; content: string; from: string; to: string }, actorId: string, meta: RequestMeta) {
    const from = new Date(`${input.from}T00:00:00-05:00`);
    const to = new Date(`${input.to}T23:59:59.999-05:00`);
    if (!(to >= from)) throw validationError('El rango de fechas no es válido.', [{ field: 'to', issue: 'orden' }]);
    const lines = input.content.replace(/^﻿/, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) throw validationError('El archivo no tiene filas.', [{ field: 'content', issue: 'vacío' }]);
    const sep = lines[0]!.includes(';') ? ';' : ',';
    const head = lines[0]!.toLowerCase().split(sep).map((h) => h.trim());
    const ref = head.indexOf('pedido') >= 0 ? head.indexOf('pedido') : head.indexOf('transaccion');
    const amt = head.indexOf('monto');
    const st = head.indexOf('estado');
    if (ref < 0 || amt < 0 || st < 0) throw validationError('Encabezado inválido. Se espera: pedido (o transaccion), monto, estado.', [{ field: 'content', issue: 'encabezado' }]);
    const byOrder = head[ref] === 'pedido';

    const rows = lines.slice(1).map((l) => l.split(sep).map((x) => x.trim()));
    const refs = rows.map((c) => c[ref] ?? '').filter(Boolean);
    const attempts = await this.d.db.paymentAttempt.findMany({
      where: { OR: [{ [byOrder ? 'orderNumber' : 'transactionId']: { in: refs } }, { status: { in: ['AUTORIZADO', 'DUPLICADO'] }, createdAt: { gte: from, lte: to } }] },
      include: { order: true },
    });
    const find = new Map(attempts.map((a) => [byOrder ? a.orderNumber : a.transactionId, a]));
    const seen = new Set<string>();
    const items: { reference: string; applicantCode: string | null; providerAmount: string | null; providerStatus: string | null; systemAmount: string | null; systemStatus: string | null; result: Result }[] = [];
    for (const c of rows) {
      const reference = c[ref] ?? '';
      if (!reference || seen.has(reference)) continue;
      seen.add(reference);
      const pAmount = Number((c[amt] ?? '').replace(',', '.'));
      const pStatus = (c[st] ?? '').toUpperCase();
      const a = find.get(reference);
      if (!a) {
        items.push({ reference, applicantCode: null, providerAmount: Number.isFinite(pAmount) ? money(pAmount) : null, providerStatus: pStatus, systemAmount: null, systemStatus: null, result: 'SOLO_PROVEEDOR' });
        continue;
      }
      const sAmount = Number(a.amount);
      const result: Result = providerPaid(pStatus) !== PAID.has(a.status) ? 'DIFERENCIA_ESTADO' : Math.abs(sAmount - pAmount) > 0.004 && providerPaid(pStatus) ? 'DIFERENCIA_MONTO' : 'CONCILIADO';
      items.push({ reference, applicantCode: a.order.applicantCode, providerAmount: Number.isFinite(pAmount) ? money(pAmount) : null, providerStatus: pStatus, systemAmount: money(sAmount), systemStatus: a.status, result });
    }
    for (const a of attempts) {
      const reference = byOrder ? a.orderNumber : a.transactionId;
      if (seen.has(reference) || !PAID.has(a.status) || a.createdAt < from || a.createdAt > to) continue;
      items.push({ reference, applicantCode: a.order.applicantCode, providerAmount: null, providerStatus: null, systemAmount: money(Number(a.amount)), systemStatus: a.status, result: 'SOLO_SISTEMA' });
    }
    const count = (r: Result) => items.filter((i) => i.result === r).length;
    const summary = {
      rows: items.length, ...Object.fromEntries((Object.keys(RECONCILIATION_LABEL) as Result[]).map((r) => [r, count(r)])),
      providerTotal: money(items.filter((i) => i.providerStatus && providerPaid(i.providerStatus)).reduce((s, i) => s + Number(i.providerAmount ?? 0), 0)),
      systemTotal: money(items.filter((i) => i.systemStatus && PAID.has(i.systemStatus)).reduce((s, i) => s + Number(i.systemAmount ?? 0), 0)),
    };
    const run = await this.d.db.$transaction(async (tx) => {
      const r = await tx.reconciliationRun.create({ data: { source: input.source, fileName: input.fileName, periodFrom: from, periodTo: to, summary, createdBy: actorId } });
      await tx.reconciliationItem.createMany({ data: items.map((i) => ({ ...i, runId: r.id })) });
      await this.d.audit.record({ actorUserId: actorId, action: 'payments.reconciled', resourceType: 'reconciliation_run', resourceId: r.id, after: summary, ...meta }, tx);
      return r;
    });
    return this.run(run.id, {});
  }

  async runs() {
    const rows = await this.d.db.reconciliationRun.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
    return rows.map((r) => ({ id: r.id, source: r.source, fileName: r.fileName, periodFrom: r.periodFrom.toISOString(), periodTo: r.periodTo.toISOString(), summary: r.summary, createdAt: r.createdAt.toISOString() }));
  }

  async run(id: string, f: { result?: string | undefined }) {
    const r = await this.d.db.reconciliationRun.findUnique({ where: { id } });
    if (!r) throw notFound('Conciliación no encontrada.');
    const items = await this.d.db.reconciliationItem.findMany({ where: { runId: id, ...(f.result ? { result: f.result as Result } : {}) }, orderBy: [{ result: 'asc' }, { reference: 'asc' }] });
    return {
      id: r.id, source: r.source, fileName: r.fileName, periodFrom: r.periodFrom.toISOString(), periodTo: r.periodTo.toISOString(), summary: r.summary, createdAt: r.createdAt.toISOString(),
      items: items.map((i) => ({
        id: i.id, reference: i.reference, applicantCode: i.applicantCode, providerAmount: i.providerAmount?.toFixed(2) ?? null, providerStatus: i.providerStatus,
        systemAmount: i.systemAmount?.toFixed(2) ?? null, systemStatus: i.systemStatus, result: i.result, resultLabel: RECONCILIATION_LABEL[i.result],
        resolution: i.resolution, resolvedAt: i.resolvedAt?.toISOString() ?? null,
      })),
    };
  }

  /** H4-2: cada diferencia se resuelve con justificación, auditada. */
  async resolve(itemId: string, resolution: string, actorId: string, meta: RequestMeta) {
    const i = await this.d.db.reconciliationItem.findUnique({ where: { id: itemId } });
    if (!i) throw notFound('Partida no encontrada.');
    if (i.result === 'CONCILIADO') throw businessRule('NOTHING_TO_RESOLVE', 'La partida ya está conciliada.');
    await this.d.db.$transaction(async (tx) => {
      await tx.reconciliationItem.update({ where: { id: itemId }, data: { resolution, resolvedBy: actorId, resolvedAt: new Date() } });
      await this.d.audit.record({ actorUserId: actorId, action: 'payments.reconciliation_resolved', resourceType: 'reconciliation_item', resourceId: itemId, after: { reference: i.reference, result: i.result, resolution }, ...meta }, tx);
    });
    return this.run(i.runId, {});
  }

  // ── H5: anulaciones y devoluciones por error (RF-05.12, RN-08) ─────
  async annulments() {
    const rows = await this.d.db.paymentAnnulment.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    const attempts = new Map((await this.d.db.paymentAttempt.findMany({ where: { id: { in: rows.map((r) => r.attemptId) } }, include: { order: true } })).map((a) => [a.id, a]));
    return rows.map((r) => ({
      id: r.id, kind: r.kind, reason: r.reason, reasonLabel: ANNULMENT_REASONS[r.reason as Reason] ?? r.reason, detail: r.detail, resolution: r.resolution,
      amount: Number(r.amount).toFixed(2), status: r.status, decisionNote: r.decisionNote, createdAt: r.createdAt.toISOString(), decidedAt: r.decidedAt?.toISOString() ?? null,
      transactionId: attempts.get(r.attemptId)?.transactionId ?? '', orderNumber: attempts.get(r.attemptId)?.orderNumber ?? '', applicantCode: attempts.get(r.attemptId)?.order.applicantCode ?? '',
      attemptStatus: attempts.get(r.attemptId)?.status ?? '',
    }));
  }

  async requestAnnulment(input: { reference: string; kind: 'ANULACION' | 'DEVOLUCION'; reason: Reason; detail: string; resolution: string }, actorId: string, meta: RequestMeta) {
    const a = await this.d.db.paymentAttempt.findFirst({ where: { OR: [{ transactionId: input.reference }, { orderNumber: input.reference }] } });
    if (!a) throw notFound('No encontramos ese pedido o transacción.');
    if (!PAID.has(a.status)) throw businessRule('NOT_CHARGED', 'Solo se anula o devuelve un cobro efectivo (autorizado o duplicado).');
    if (input.reason === 'COBRO_DUPLICADO' && a.status !== 'DUPLICADO') {
      throw businessRule('NOT_DUPLICATED', 'Ese intento no está marcado como pago duplicado. El pago válido de la inscripción no se devuelve (Art. 18).');
    }
    if (await this.d.db.paymentAnnulment.findFirst({ where: { attemptId: a.id, status: { in: ['SOLICITADA', 'APROBADA'] } } })) throw conflict('ANNULMENT_EXISTS', 'Ese cobro ya tiene una solicitud en trámite o aprobada.');
    await this.d.db.$transaction(async (tx) => {
      const r = await tx.paymentAnnulment.create({ data: { attemptId: a.id, kind: input.kind, reason: input.reason, detail: input.detail, resolution: input.resolution, amount: a.amount, requestedBy: actorId } });
      await this.d.audit.record({ actorUserId: actorId, action: 'payments.annulment_requested', resourceType: 'payment_annulment', resourceId: r.id, after: { transactionId: a.transactionId, reason: input.reason, resolution: input.resolution }, ...meta }, tx);
    });
    return this.annulments();
  }

  /** Lo aprueba o rechaza otra persona (segregación); el dinero lo devuelve Tesorería por su canal, no el sistema. */
  async decideAnnulment(id: string, approve: boolean, note: string, actorId: string, meta: RequestMeta) {
    const r = await this.d.db.paymentAnnulment.findUnique({ where: { id } });
    if (!r) throw notFound('Solicitud no encontrada.');
    if (r.status !== 'SOLICITADA') throw businessRule('ALREADY_DECIDED', 'La solicitud ya fue resuelta.');
    if (r.requestedBy === actorId) throw forbidden('La aprueba o rechaza una persona distinta de quien la solicitó.');
    await this.d.db.$transaction(async (tx) => {
      await tx.paymentAnnulment.update({ where: { id }, data: { status: approve ? 'APROBADA' : 'RECHAZADA', decidedBy: actorId, decidedAt: new Date(), decisionNote: note } });
      await this.d.audit.record({ actorUserId: actorId, action: approve ? 'payments.annulment_approved' : 'payments.annulment_rejected', resourceType: 'payment_annulment', resourceId: id, after: { note }, ...meta }, tx);
    });
    return this.annulments();
  }
}
