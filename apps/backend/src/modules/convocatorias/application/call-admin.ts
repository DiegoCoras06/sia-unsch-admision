import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db } from '../../../shared/db/prisma.js';
import { businessRule, conflict, notFound, validationError } from '../../../shared/http/errors.js';
import { stageStatus } from '../domain/stage.js';

const iso = (d: Date) => d.toISOString();

/** Gestión de la convocatoria desde el panel (spec 008, Historia 1; RF-01.01 a RF-01.05, RF-14.02). */
export class CallAdmin {
  constructor(private readonly d: { db: Db; clock: Clock; audit: AuditLog }) {}

  async list() {
    const calls = await this.d.db.admissionCall.findMany({ orderBy: [{ year: 'desc' }, { period: 'desc' }] });
    return calls.map((c) => ({ code: c.code, name: c.name, status: c.status, year: c.year, period: c.period, publishedAt: c.publishedAt?.toISOString() ?? null }));
  }

  async detail(code: string) {
    const call = await this.call(code);
    const [stages, fees, vacancies] = await Promise.all([
      this.d.db.scheduleStage.findMany({ where: { callId: call.id }, orderBy: { sortOrder: 'asc' } }),
      this.d.db.fee.findMany({ where: { callId: call.id }, orderBy: { sortOrder: 'asc' } }),
      this.d.db.vacancy.findMany({ where: { callId: call.id }, include: { option: { include: { program: { include: { area: true } } } }, quotaCategory: true } }),
    ]);
    const now = this.d.clock.now();
    const options = new Map<string, { code: string; name: string; area: string; byCategory: Record<string, number>; total: number }>();
    for (const v of vacancies) {
      const o = options.get(v.option.internalCode) ?? { code: v.option.internalCode, name: v.option.displayName, area: v.option.program.area.code, byCategory: {}, total: 0 };
      o.byCategory[v.quotaCategory.code] = v.quantity;
      o.total += v.quantity;
      options.set(o.code, o);
    }
    const categories = [...new Set(vacancies.map((v) => v.quotaCategory.code))];
    return {
      code: call.code, name: call.name, status: call.status,
      stages: stages.map((s) => ({ code: s.code, name: s.name, scope: s.scope, kind: s.kind, startsAt: iso(s.startsAt), endsAt: iso(s.endsAt), status: stageStatus(s, now) })),
      fees: fees.map((f) => ({ code: f.code, concept: f.concept, amount: Number(f.amount).toFixed(2), kind: f.kind, legalNote: f.legalNote })),
      vacancies: { categories, options: [...options.values()].sort((a, b) => a.code.localeCompare(b.code)), total: vacancies.reduce((s, v) => s + v.quantity, 0) },
    };
  }

  /** RF-01.03: fechas válidas; las superposiciones dentro del mismo alcance se informan como advertencia. */
  async updateStage(code: string, stageCode: string, input: { startsAt: string; endsAt: string }, actor: string, meta: RequestMeta) {
    const call = await this.call(code);
    const stage = await this.d.db.scheduleStage.findUnique({ where: { callId_code: { callId: call.id, code: stageCode } } });
    if (!stage) throw notFound('Etapa no encontrada.');
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) throw validationError('Fechas inválidas.', [{ field: 'startsAt', issue: 'fecha' }]);
    if (endsAt <= startsAt) throw validationError('La etapa debe terminar después de empezar.', [{ field: 'endsAt', issue: 'antes del inicio' }]);
    await this.d.db.$transaction(async (tx) => {
      await tx.scheduleStage.update({ where: { id: stage.id }, data: { startsAt, endsAt } });
      await this.d.audit.record({
        actorUserId: actor, action: 'call.stage_updated', resourceType: 'schedule_stage', resourceId: `${code}/${stageCode}`,
        before: { startsAt: iso(stage.startsAt), endsAt: iso(stage.endsAt) }, after: { startsAt: iso(startsAt), endsAt: iso(endsAt) }, ...meta,
      }, tx);
    });
    const overlaps = await this.d.db.scheduleStage.findMany({
      where: { callId: call.id, scope: stage.scope, kind: stage.kind, id: { not: stage.id }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    });
    return { warnings: overlaps.map((o) => `Se superpone con «${o.name}».`) };
  }

  /** RF-14.02: una tasa en 0 exige confirmación explícita (spec 008, casos límite). */
  async updateFee(code: string, feeCode: string, amount: number, confirmZero: boolean, actor: string, meta: RequestMeta) {
    const call = await this.call(code);
    const fee = await this.d.db.fee.findUnique({ where: { callId_code: { callId: call.id, code: feeCode } } });
    if (!fee) throw notFound('Tasa no encontrada.');
    if (amount < 0 || amount > 10_000) throw validationError('Monto fuera de rango.', [{ field: 'amount', issue: 'rango' }]);
    if (amount === 0 && !confirmZero) throw businessRule('ZERO_FEE_CONFIRM', 'Una tasa en S/ 0.00 exige confirmación explícita.');
    await this.d.db.$transaction(async (tx) => {
      await tx.fee.update({ where: { id: fee.id }, data: { amount } });
      await this.d.audit.record({
        actorUserId: actor, action: 'call.fee_updated', resourceType: 'fee', resourceId: `${code}/${feeCode}`,
        before: { amount: Number(fee.amount).toFixed(2) }, after: { amount: amount.toFixed(2) }, ...meta,
      }, tx);
    });
  }

  /** RN-03: con la convocatoria publicada, cambiar vacantes exige resolución y motivo. */
  async updateVacancy(
    code: string, input: { optionCode: string; category: string; quantity: number; resolution?: string | undefined; reason?: string | undefined },
    actor: string, meta: RequestMeta,
  ) {
    const call = await this.call(code);
    if (call.status === 'PUBLISHED' && (!input.resolution?.trim() || !input.reason?.trim())) {
      throw businessRule('RESOLUTION_REQUIRED', 'La convocatoria está publicada: registra la resolución y el motivo del cambio (RN-03).');
    }
    if (!Number.isInteger(input.quantity) || input.quantity < 0 || input.quantity > 500) throw validationError('Cantidad inválida.', [{ field: 'quantity', issue: 'rango' }]);
    const [option, category] = await Promise.all([
      this.d.db.applicationOption.findFirst({ where: { internalCode: input.optionCode } }),
      this.d.db.quotaCategory.findUnique({ where: { code: input.category } }),
    ]);
    if (!option || !category) throw notFound('Programa o categoría no encontrados.');
    const current = await this.d.db.vacancy.findUnique({ where: { callId_optionId_quotaCategoryId: { callId: call.id, optionId: option.id, quotaCategoryId: category.id } } });
    await this.d.db.$transaction(async (tx) => {
      await tx.vacancy.upsert({
        where: { callId_optionId_quotaCategoryId: { callId: call.id, optionId: option.id, quotaCategoryId: category.id } },
        create: { callId: call.id, optionId: option.id, quotaCategoryId: category.id, quantity: input.quantity },
        update: { quantity: input.quantity },
      });
      await this.d.audit.record({
        actorUserId: actor, action: 'call.vacancy_updated', resourceType: 'vacancy', resourceId: `${code}/${input.optionCode}/${input.category}`,
        before: { quantity: current?.quantity ?? 0 }, after: { quantity: input.quantity, resolution: input.resolution ?? null, reason: input.reason ?? null }, ...meta,
      }, tx);
    });
  }

  /**
   * Historia 1, escenario 1: copia etapas (desplazadas N meses), tasas con sus reglas, vacantes,
   * requisitos y documentos a una convocatoria nueva en borrador.
   */
  async copy(fromCode: string, input: { code: string; name: string; year: number; period: string; monthsOffset: number }, actor: string, meta: RequestMeta) {
    const from = await this.call(fromCode);
    if (await this.d.db.admissionCall.findUnique({ where: { code: input.code } })) throw conflict('CALL_EXISTS', `Ya existe la convocatoria ${input.code}.`);
    const shift = (d: Date) => {
      const n = new Date(d);
      n.setUTCMonth(n.getUTCMonth() + input.monthsOffset);
      return n;
    };
    const created = await this.d.db.$transaction(async (tx) => {
      const call = await tx.admissionCall.create({ data: { code: input.code, name: input.name, year: input.year, period: input.period, status: 'DRAFT' } });
      const stages = await tx.scheduleStage.findMany({ where: { callId: from.id } });
      await tx.scheduleStage.createMany({
        data: stages.map(({ id: _id, callId: _c, startsAt, endsAt, ...s }) => ({ ...s, callId: call.id, startsAt: shift(startsAt), endsAt: shift(endsAt) })),
      });
      const fees = await tx.fee.findMany({ where: { callId: from.id }, include: { rules: true, surchargeRules: true } });
      for (const { id: _id, callId: _c, rules, surchargeRules, ...f } of fees) {
        const fee = await tx.fee.create({ data: { ...f, callId: call.id } });
        await tx.feeRule.createMany({ data: rules.map(({ id: _r, callId: _rc, feeId: _f, ...r }) => ({ ...r, callId: call.id, feeId: fee.id })) });
        await tx.surchargeRule.createMany({ data: surchargeRules.map(({ id: _r, callId: _rc, feeId: _f, ...r }) => ({ ...r, callId: call.id, feeId: fee.id })) });
      }
      const vacancies = await tx.vacancy.findMany({ where: { callId: from.id } });
      await tx.vacancy.createMany({ data: vacancies.map(({ id: _id, callId: _c, ...v }) => ({ ...v, callId: call.id })) });
      const reqs = await tx.requirementDocument.findMany({ where: { callId: from.id }, include: { submodalities: true } });
      for (const { id: _id, callId: _c, submodalities, ...r } of reqs) {
        const req = await tx.requirementDocument.create({ data: { ...r, callId: call.id } });
        await tx.submodalityRequirement.createMany({
          data: submodalities.map(({ id: _s, requirementId: _r, ...s }) => ({ ...s, requirementId: req.id })),
        });
      }
      const docs = await tx.officialDocument.findMany({ where: { callId: from.id } });
      await tx.officialDocument.createMany({ data: docs.map(({ id: _id, callId: _c, ...doc }) => ({ ...doc, callId: call.id })) });
      await this.d.audit.record({ actorUserId: actor, action: 'call.copied', resourceType: 'admission_call', resourceId: input.code, after: { from: fromCode, monthsOffset: input.monthsOffset }, ...meta }, tx);
      return call;
    }, { timeout: 60_000 });
    return { code: created.code, status: created.status };
  }

  private async call(code: string) {
    const call = await this.d.db.admissionCall.findUnique({ where: { code } });
    if (!call) throw notFound(`No existe la convocatoria ${code}.`);
    return call;
  }
}
