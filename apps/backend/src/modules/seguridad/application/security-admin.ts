import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db } from '../../../shared/db/prisma.js';
import { notFound, validationError } from '../../../shared/http/errors.js';

const CASE_STATUS_LABEL = { OPEN: 'Recibido', IN_PROGRESS: 'En atención', CLOSED: 'Cerrado' } as const;
const CASE_TYPE_LABEL = { CONTACT: 'Consulta', COMPLAINT: 'Denuncia', CHATBOT_ESCALATION: 'Derivado del asistente', RESULT_REVIEW: 'Revisión de resultados' } as const;

/**
 * Gestión de M13 desde el panel: auditoría (Historia 4), inhabilitados (Historia 5) y casos (Historia 7).
 * La auditoría solo se lee: no existe operación para modificarla o borrarla (RNF-10).
 */
export class SecurityAdmin {
  constructor(
    private readonly d: {
      db: Db;
      clock: Clock;
      audit: AuditLog;
      inscriptions: { annulByDocument(documentType: string, documentNumber: string, resolution: string, actor: string, meta: RequestMeta): Promise<string[]> };
    },
  ) {}

  // ── Auditoría ──────────────────────────────────────────────────────────
  async auditSearch(f: { actor?: string | undefined; action?: string | undefined; resource?: string | undefined; from?: string | undefined; to?: string | undefined; page: number }) {
    const actorIds = f.actor
      ? (await this.d.db.user.findMany({ where: { email: { contains: f.actor.toLowerCase() } }, select: { id: true } })).map((u) => u.id)
      : null;
    const where = {
      ...(actorIds ? { actorUserId: { in: actorIds } } : {}),
      ...(f.action ? { action: { contains: f.action } } : {}),
      ...(f.resource ? { OR: [{ resourceType: { contains: f.resource } }, { resourceId: { contains: f.resource } }] } : {}),
      ...(f.from || f.to ? { occurredAt: { ...(f.from ? { gte: new Date(f.from) } : {}), ...(f.to ? { lte: new Date(`${f.to}T23:59:59.999-05:00`) } : {}) } } : {}),
    };
    const pageSize = 30;
    const [total, rows] = await Promise.all([
      this.d.db.auditEvent.count({ where }),
      this.d.db.auditEvent.findMany({ where, orderBy: { occurredAt: 'desc' }, skip: (f.page - 1) * pageSize, take: pageSize }),
    ]);
    const emails = new Map(
      (await this.d.db.user.findMany({ where: { id: { in: rows.map((r) => r.actorUserId).filter((x): x is string => Boolean(x)) } }, select: { id: true, email: true } }))
        .map((u) => [u.id, u.email]),
    );
    return {
      total, page: f.page, pageSize,
      items: rows.map((r) => ({
        id: r.id, occurredAt: r.occurredAt.toISOString(), actor: r.actorUserId ? (emails.get(r.actorUserId) ?? r.actorUserId) : 'Sistema / público',
        action: r.action, resourceType: r.resourceType, resourceId: r.resourceId, before: r.before, after: r.after,
        origin: r.ipHash ? `IP ${r.ipHash.slice(0, 8)}…` : null, requestId: r.requestId,
      })),
    };
  }

  // ── Inhabilitados ──────────────────────────────────────────────────────
  async disqualifiedList() {
    const rows = await this.d.db.disqualifiedPerson.findMany({ orderBy: { validFrom: 'desc' } });
    const today = this.d.clock.now();
    return rows.map((r) => ({
      id: r.id, documentType: r.documentType, documentNumber: r.documentNumber, reason: r.reason, resolution: r.resolution,
      validFrom: r.validFrom.toISOString().slice(0, 10), validUntil: r.validUntil?.toISOString().slice(0, 10) ?? null,
      active: r.validFrom <= today && (!r.validUntil || r.validUntil >= today),
    }));
  }

  async disqualify(input: { documentType: string; documentNumber: string; reason: string; resolution: string; validUntil?: string | undefined }, actor: string, meta: RequestMeta) {
    const doc = input.documentNumber.trim().toUpperCase();
    if (input.documentType === 'DNI' && !/^\d{8}$/.test(doc)) throw validationError('El DNI debe tener 8 dígitos.', [{ field: 'documentNumber', issue: '8 dígitos' }]);
    const row = await this.d.db.$transaction(async (tx) => {
      const created = await tx.disqualifiedPerson.create({
        data: {
          documentType: input.documentType, documentNumber: doc, reason: input.reason.trim(), resolution: input.resolution.trim(),
          validFrom: new Date(this.d.clock.now().toISOString().slice(0, 10)), validUntil: input.validUntil ? new Date(input.validUntil) : null,
        },
      });
      await this.d.audit.record({ actorUserId: actor, action: 'disqualified.added', resourceType: 'disqualified_person', resourceId: created.id, after: { documentType: input.documentType, resolution: input.resolution }, ...meta }, tx);
      return created;
    });
    const annulled = await this.d.inscriptions.annulByDocument(input.documentType, doc, input.resolution, actor, meta);
    return { id: row.id, annulled };
  }

  /** Retirar no borra: cierra la vigencia hoy, así queda la historia. */
  async lift(id: string, actor: string, meta: RequestMeta) {
    const row = await this.d.db.disqualifiedPerson.findUnique({ where: { id } });
    if (!row) throw notFound('Registro no encontrado.');
    const today = new Date(this.d.clock.now().toISOString().slice(0, 10));
    await this.d.db.$transaction(async (tx) => {
      await tx.disqualifiedPerson.update({ where: { id }, data: { validUntil: new Date(today.getTime() - 86_400_000) } });
      await this.d.audit.record({ actorUserId: actor, action: 'disqualified.lifted', resourceType: 'disqualified_person', resourceId: id, ...meta }, tx);
    });
  }

  // ── Casos de atención ──────────────────────────────────────────────────
  async cases(f: { status?: string | undefined; type?: string | undefined; page: number }) {
    const where = { ...(f.status ? { status: f.status as keyof typeof CASE_STATUS_LABEL } : {}), ...(f.type ? { type: f.type as keyof typeof CASE_TYPE_LABEL } : {}) };
    const pageSize = 25;
    const [total, rows] = await Promise.all([
      this.d.db.supportCase.count({ where }),
      this.d.db.supportCase.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (f.page - 1) * pageSize, take: pageSize }),
    ]);
    return {
      total, page: f.page, pageSize,
      items: rows.map((c) => ({
        caseNumber: c.caseNumber, type: c.type, typeLabel: CASE_TYPE_LABEL[c.type], status: c.status, statusLabel: CASE_STATUS_LABEL[c.status],
        name: c.name, email: c.email, phone: c.phone, message: c.message, createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  async setCaseStatus(caseNumber: string, status: keyof typeof CASE_STATUS_LABEL, note: string | undefined, actor: string, meta: RequestMeta) {
    const c = await this.d.db.supportCase.findUnique({ where: { caseNumber } });
    if (!c) throw notFound('Caso no encontrado.');
    await this.d.db.$transaction(async (tx) => {
      await tx.supportCase.update({ where: { caseNumber }, data: { status } });
      await this.d.audit.record({ actorUserId: actor, action: 'case.status_changed', resourceType: 'support_case', resourceId: caseNumber, before: { status: c.status }, after: { status, note: note ?? null }, ...meta }, tx);
    });
  }

  /** Historia 7, escenario 2: el ciudadano consulta el avance con su número de caso (sin datos personales). */
  async publicCaseStatus(caseNumber: string) {
    const c = await this.d.db.supportCase.findUnique({ where: { caseNumber: caseNumber.trim().toUpperCase() } });
    if (!c) throw notFound('No encontramos un caso con ese número.');
    return { caseNumber: c.caseNumber, type: CASE_TYPE_LABEL[c.type], status: CASE_STATUS_LABEL[c.status], createdAt: c.createdAt.toISOString() };
  }
}
