import type { Db } from '../../../shared/db/prisma.js';

export interface ReportFilter {
  modality?: string | undefined;
  optionCode?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: 'Pendiente de pago', PENDIENTE_VALIDACION: 'Pendiente de validación', APTA: 'Apta', OBSERVADA: 'Observada', ANULADA: 'Anulada',
};
const MODALITY_LABEL: Record<string, string> = { ORD: 'Ordinario', EXO: 'Exonerados', CEPRE: 'CEPRE-UNSCH' };

/**
 * M12 Reportes: consultas de solo lectura sobre los datos de los demás módulos (arquitectura §5:
 * reportes nunca escribe). Cada bloque se entrega solo si el rol tiene el permiso (spec 008 H2-4).
 */
export class ReportQueries {
  constructor(private readonly db: Db) {}

  private applicationWhere(f: ReportFilter) {
    return {
      ...(f.modality ? { modality: f.modality } : {}),
      ...(f.optionCode ? { optionCode: f.optionCode } : {}),
      ...(f.from || f.to ? { createdAt: { ...(f.from ? { gte: new Date(`${f.from}T00:00:00-05:00`) } : {}), ...(f.to ? { lte: new Date(`${f.to}T23:59:59.999-05:00`) } : {}) } } : {}),
    };
  }

  async dashboard(f: ReportFilter, can: { inscripciones: boolean; pagos: boolean; asistente: boolean; casos: boolean }) {
    const [inscripciones, pagos, asistente, casos, expedientes, examenes, resultados] = await Promise.all([
      can.inscripciones ? this.inscriptionStats(f) : null,
      can.pagos ? this.paymentStats(f) : null,
      can.asistente ? this.assistantStats() : null,
      can.casos ? this.db.supportCase.count({ where: { status: { not: 'CLOSED' } } }) : null,
      can.inscripciones ? this.dossierStats() : null,
      can.inscripciones ? this.examStats() : null,
      can.inscripciones ? this.resultStats() : null,
    ]);
    return {
      inscripciones, pagos, asistente, casosAbiertos: casos, expedientes, examenes, resultados,
      proximamente: [],
    };
  }

  /** RF-12.04: expedientes de exonerados por estado. */
  async dossierStats() {
    const label: Record<string, string> = { BORRADOR: 'Por enviar', EN_REVISION: 'En revisión', OBSERVADO: 'Observados', AUTORIZADO: 'Autorizados', RECHAZADO: 'Rechazados', NO_SUBSANADO: 'No subsanados' };
    const g = await this.db.dossier.groupBy({ by: ['status'], _count: { _all: true } });
    return g.map((x) => ({ key: x.status, label: label[x.status] ?? x.status, count: x._count._all }));
  }

  /** Ocupación de aulas y asistencia por examen (M07/M08). */
  async examStats() {
    const exams = await this.db.exam.findMany({ orderBy: { entryOpensAt: 'asc' }, include: { rooms: { include: { room: true } } } });
    const att = await this.db.examAssignment.groupBy({ by: ['examId', 'attendance'], _count: { _all: true } });
    const count = (examId: string, a?: string) => att.filter((x) => x.examId === examId && (!a || x.attendance === a)).reduce((s, x) => s + x._count._all, 0);
    return exams.map((e) => ({
      key: e.code, label: e.name, capacity: e.rooms.reduce((s, r) => s + r.room.capacity, 0),
      assigned: count(e.id), present: count(e.id, 'PRESENTE'), absent: count(e.id, 'AUSENTE'),
    }));
  }

  /** RF-12.07: condición por examen (versión publicada) e ingresantes. */
  async resultStats() {
    const label: Record<string, string> = { ADMITIDO: 'Admitidos', NO_ADMITIDO: 'No admitidos', AUSENTE: 'Ausentes', NO_CALIFICABLE: 'No calificables', SIN_DERECHO_VACANTE: 'Sin derecho a vacante' };
    const versions = await this.db.resultVersion.findMany({ where: { status: 'PUBLICADA' }, select: { id: true } });
    const [byCondition, admissions] = await Promise.all([
      this.db.examResult.groupBy({ by: ['condition'], where: { versionId: { in: versions.map((v) => v.id) } }, _count: { _all: true } }),
      this.db.admission.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    const adm = (s: string) => admissions.find((a) => a.status === s)?._count._all ?? 0;
    return {
      porCondicion: byCondition.map((c) => ({ key: c.condition, label: label[c.condition] ?? c.condition, count: c._count._all })),
      ingresantes: adm('INGRESANTE'), porEntregar: adm('PENDIENTE'), perdidas: adm('PERDIDA'),
    };
  }

  async inscriptionStats(f: ReportFilter) {
    const where = this.applicationWhere(f);
    const [total, byStatus, byModality, byOption, rows] = await Promise.all([
      this.db.application.count({ where }),
      this.db.application.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.db.application.groupBy({ by: ['modality'], where, _count: { _all: true } }),
      this.db.application.groupBy({ by: ['optionCode'], where, _count: { _all: true }, orderBy: { _count: { optionCode: 'desc' } }, take: 10 }),
      this.db.application.findMany({ where, select: { createdAt: true } }),
    ]);
    const names = new Map((await this.db.applicationOption.findMany({ select: { internalCode: true, displayName: true } })).map((o) => [o.internalCode, o.displayName]));
    const byDay = new Map<string, number>();
    for (const r of rows) {
      const day = new Date(r.createdAt.getTime() - 5 * 3600_000).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    return {
      total,
      habilitadas: byStatus.find((s) => s.status === 'APTA')?._count._all ?? 0,
      porEstado: byStatus.map((s) => ({ key: s.status, label: STATUS_LABEL[s.status] ?? s.status, count: s._count._all })),
      porModalidad: byModality.map((m) => ({ key: m.modality, label: MODALITY_LABEL[m.modality] ?? m.modality, count: m._count._all })),
      porPrograma: byOption.map((o) => ({ key: o.optionCode, label: names.get(o.optionCode) ?? o.optionCode, count: o._count._all })),
      porDia: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, count]) => ({ day, count })),
    };
  }

  async paymentStats(f: ReportFilter) {
    const codes = f.modality || f.optionCode || f.from || f.to
      ? (await this.db.application.findMany({ where: this.applicationWhere(f), select: { applicantCode: true } })).map((a) => a.applicantCode)
      : null;
    const orderWhere = codes ? { applicantCode: { in: codes } } : {};
    const [paid, pending, attempts] = await Promise.all([
      this.db.paymentOrder.aggregate({ where: { ...orderWhere, status: 'PAGADA' }, _sum: { amount: true }, _count: { _all: true } }),
      this.db.paymentOrder.count({ where: { ...orderWhere, status: 'PENDIENTE' } }),
      this.db.paymentAttempt.groupBy({ by: ['status'], where: codes ? { order: orderWhere } : {}, _count: { _all: true } }),
    ]);
    const byMethod = await this.db.paymentAttempt.groupBy({
      by: ['payMethod'], where: { status: 'AUTORIZADO', ...(codes ? { order: orderWhere } : {}) }, _count: { _all: true }, _sum: { amount: true },
    });
    const count = (s: string) => attempts.find((a) => a.status === s)?._count._all ?? 0;
    return {
      recaudado: Number(paid._sum.amount ?? 0).toFixed(2),
      ordenesPagadas: paid._count._all,
      ordenesPendientes: pending,
      intentosRechazados: count('RECHAZADO'),
      intentosVencidos: count('VENCIDO'),
      pagosDuplicados: count('DUPLICADO'),
      porMedio: byMethod.map((m) => ({ key: m.payMethod ?? 'OTRO', label: m.payMethod ?? 'Otro', count: m._count._all, monto: Number(m._sum.amount ?? 0).toFixed(2) })),
    };
  }

  async assistantStats() {
    const since = new Date(Date.now() - 13 * 86_400_000);
    const rows = await this.db.chatUsageDaily.findMany({ where: { day: { gte: new Date(since.toISOString().slice(0, 10)) } }, orderBy: { day: 'asc' } });
    const sum = (k: 'requests' | 'aiReplies' | 'handoffs' | 'errors' | 'tokensIn' | 'tokensOut') => rows.reduce((s, r) => s + r[k], 0);
    return {
      consultas: sum('requests'), conIa: sum('aiReplies'), derivaciones: sum('handoffs'), errores: sum('errors'),
      tokens: sum('tokensIn') + sum('tokensOut'), costoUsd: rows.reduce((s, r) => s + Number(r.costUsd), 0).toFixed(4),
      porDia: rows.map((r) => ({ day: r.day.toISOString().slice(0, 10), count: r.requests })),
    };
  }

  /** Filas para exportar: inscripciones con el programa y el estado del pago. */
  async inscriptionRows(f: ReportFilter) {
    const rows = await this.db.application.findMany({ where: this.applicationWhere(f), orderBy: { createdAt: 'asc' } });
    const [names, orders] = await Promise.all([
      this.db.applicationOption.findMany({ select: { internalCode: true, displayName: true } }),
      this.db.paymentOrder.findMany({ where: { applicantCode: { in: rows.map((r) => r.applicantCode) } } }),
    ]);
    const name = new Map(names.map((o) => [o.internalCode, o.displayName]));
    const pay = new Map(orders.map((o) => [o.applicantCode, o.status]));
    return rows.map((r) => ({
      codigo: r.applicantCode, documento: `${r.documentType} ${r.documentNumber}`, postulante: `${r.paternalSurname} ${r.maternalSurname}, ${r.firstNames}`,
      modalidad: MODALITY_LABEL[r.modality] ?? r.modality, programa: name.get(r.optionCode) ?? r.optionCode, estado: STATUS_LABEL[r.status] ?? r.status,
      tasa: Number(r.feeTotal.toString()).toFixed(2), pago: pay.get(r.applicantCode) === 'PAGADA' ? 'Pagado' : 'Pendiente',
      registrada: new Date(r.createdAt.getTime() - 5 * 3600_000).toISOString().slice(0, 16).replace('T', ' '),
    }));
  }

  /** RF-12.04: expedientes de exonerados para exportar, con su estado y fechas. */
  async dossierRows() {
    const label: Record<string, string> = { BORRADOR: 'Por enviar', EN_REVISION: 'En revisión', OBSERVADO: 'Observado', AUTORIZADO: 'Autorizado', RECHAZADO: 'Rechazado', NO_SUBSANADO: 'No subsanado' };
    const rows = await this.db.dossier.findMany({ orderBy: [{ status: 'asc' }, { applicantCode: 'asc' }] });
    const apps = new Map((await this.db.application.findMany({ where: { applicantCode: { in: rows.map((r) => r.applicantCode) } } })).map((a) => [a.applicantCode, a]));
    const lima = (d: Date | null) => (d ? new Date(d.getTime() - 5 * 3600_000).toISOString().slice(0, 16).replace('T', ' ') : '');
    return rows.map((r) => {
      const a = apps.get(r.applicantCode);
      return {
        codigo: r.applicantCode, postulante: a ? `${a.paternalSurname} ${a.maternalSurname}, ${a.firstNames}` : '', submodalidad: r.submodality,
        estado: label[r.status] ?? r.status, enviado: lima(r.submittedAt), dictamen: lima(r.decidedAt), nota: r.decisionNote ?? '',
        presencial: r.verifiedInPerson ? 'Sí' : 'No',
      };
    });
  }

  /** RF-12.06: asistencia por examen y aula para exportar. */
  async attendanceRows() {
    const label: Record<string, string> = { PENDIENTE: 'Por ingresar', PRESENTE: 'Presente', AUSENTE: 'Ausente' };
    const rows = await this.db.examAssignment.findMany({ include: { exam: true, room: true }, orderBy: [{ examId: 'asc' }, { roomId: 'asc' }, { seat: 'asc' }] });
    const apps = new Map((await this.db.application.findMany({ where: { applicantCode: { in: rows.map((r) => r.applicantCode) } } })).map((a) => [a.applicantCode, a]));
    return rows.map((r) => {
      const a = apps.get(r.applicantCode);
      return {
        examen: r.exam.name, aula: `${r.room.building} · ${r.room.code}`, asiento: r.seat, codigo: r.applicantCode,
        postulante: a ? `${a.paternalSurname} ${a.maternalSurname}, ${a.firstNames}` : '',
        asistencia: r.attendance === 'PRESENTE' && r.late ? 'Presente (fuera de hora)' : (label[r.attendance] ?? r.attendance),
        ingreso: r.checkedInAt ? new Date(r.checkedInAt.getTime() - 5 * 3600_000).toISOString().slice(11, 16) : '',
      };
    });
  }

  /** Filas para exportar: intentos de pago (sin datos de tarjeta salvo la máscara). */
  async paymentRows(f: ReportFilter) {
    const codes = (await this.db.application.findMany({ where: this.applicationWhere(f), select: { applicantCode: true } })).map((a) => a.applicantCode);
    const rows = await this.db.paymentAttempt.findMany({ where: { order: { applicantCode: { in: codes } } }, include: { order: true }, orderBy: { createdAt: 'asc' } });
    return rows.map((a) => ({
      codigo: a.order.applicantCode, pedido: a.orderNumber, transaccion: a.transactionId, proveedor: a.provider, estado: a.status,
      monto: Number(a.amount).toFixed(2), medio: a.payMethod ?? '', operacion: a.operationNumber ?? '', tarjeta: a.cardMasked ?? '',
      fecha: new Date(a.createdAt.getTime() - 5 * 3600_000).toISOString().slice(0, 16).replace('T', ' '),
    }));
  }

  /** Pagos del panel: lista paginada para Tesorería. */
  async paymentsPage(f: ReportFilter & { status?: string | undefined; page: number }) {
    const where = f.status ? { status: f.status as 'INICIADO' } : {};
    const pageSize = 25;
    const [total, rows] = await Promise.all([
      this.db.paymentAttempt.count({ where }),
      this.db.paymentAttempt.findMany({ where, include: { order: true }, orderBy: { createdAt: 'desc' }, skip: (f.page - 1) * pageSize, take: pageSize }),
    ]);
    return {
      total, page: f.page, pageSize,
      items: rows.map((a) => ({
        applicantCode: a.order.applicantCode, orderNumber: a.orderNumber, transactionId: a.transactionId, provider: a.provider, status: a.status,
        amount: Number(a.amount).toFixed(2), payMethod: a.payMethod, operationNumber: a.operationNumber, cardMasked: a.cardMasked,
        confirmedVia: a.confirmedVia, createdAt: a.createdAt.toISOString(),
      })),
    };
  }
}
