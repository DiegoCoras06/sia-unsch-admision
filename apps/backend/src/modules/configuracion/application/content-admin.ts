import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db } from '../../../shared/db/prisma.js';
import type { Outbox } from '../../../shared/events/outbox.js';
import { notFound, validationError } from '../../../shared/http/errors.js';

/** Parámetros operativos con su valor por defecto (RF-13.10, RF-14.10). */
export const DEFAULT_PARAMETERS: Record<string, { value: string; label: string }> = {
  'retencion.conversaciones_dias': { value: '90', label: 'Días que se conservan las conversaciones del asistente' },
  'retencion.inscripciones_anios': { value: '5', label: 'Años que se conservan las inscripciones tras cerrar la convocatoria' },
  'retencion.auditoria': { value: 'Permanente', label: 'Conservación de la auditoría (no se borra, RNF-10)' },
  'respaldo.retencion_dias': { value: '7', label: 'Días de copias automáticas diarias de Amazon RDS' },
  'respaldo.ultimo_manual': { value: '-', label: 'Última instantánea manual registrada' },
  'respaldo.ultima_prueba_restauracion': { value: '-', label: 'Última prueba de restauración registrada' },
  'respaldo.rpo_rto': { value: 'RPO 24 h · RTO 4 h', label: 'Objetivos de recuperación' },
};

/**
 * Gestión de M14 desde el panel: comunicados y fe de erratas (Historia 6), contenido del portal,
 * funciones por etapa (Historia 8), parámetros de retención y respaldo, y fallas de integración con reintento.
 */
export class ContentAdmin {
  constructor(private readonly d: { db: Db; clock: Clock; audit: AuditLog; outbox: Outbox }) {}

  // ── Comunicados ────────────────────────────────────────────────────────
  async announcements() {
    const rows = await this.d.db.announcement.findMany({ orderBy: { publishedAt: 'desc' } });
    return rows.map((a) => ({ id: a.id, callCode: a.callCode, type: a.type, title: a.title, bodyMd: a.bodyMd, affectsSection: a.affectsSection, publishedAt: a.publishedAt.toISOString() }));
  }

  async saveAnnouncement(
    input: { id?: string | undefined; callCode?: string | undefined; type: 'COMUNICADO' | 'FE_ERRATAS' | 'RESULTADO'; title: string; bodyMd: string; affectsSection?: string | undefined; publishedAt?: string | undefined },
    actor: string, meta: RequestMeta,
  ) {
    if (input.type === 'FE_ERRATAS' && !input.affectsSection) {
      throw validationError('Una fe de erratas debe indicar la sección que corrige.', [{ field: 'affectsSection', issue: 'obligatorio' }]);
    }
    const data = {
      callCode: input.callCode ?? null, type: input.type, title: input.title.trim(), bodyMd: input.bodyMd.trim(),
      affectsSection: input.affectsSection ?? null, publishedAt: input.publishedAt ? new Date(input.publishedAt) : this.d.clock.now(),
    };
    return this.d.db.$transaction(async (tx) => {
      const before = input.id ? await tx.announcement.findUnique({ where: { id: input.id } }) : null;
      if (input.id && !before) throw notFound('Comunicado no encontrado.');
      const row = input.id ? await tx.announcement.update({ where: { id: input.id }, data }) : await tx.announcement.create({ data });
      await this.d.audit.record({
        actorUserId: actor, action: input.id ? 'announcement.updated' : 'announcement.published', resourceType: 'announcement', resourceId: row.id,
        before: before ? { title: before.title } : null, after: { title: row.title, type: row.type }, ...meta,
      }, tx);
      return { id: row.id };
    });
  }

  async deleteAnnouncement(id: string, actor: string, meta: RequestMeta) {
    const row = await this.d.db.announcement.findUnique({ where: { id } });
    if (!row) throw notFound('Comunicado no encontrado.');
    await this.d.db.$transaction(async (tx) => {
      await tx.announcement.delete({ where: { id } });
      await this.d.audit.record({ actorUserId: actor, action: 'announcement.removed', resourceType: 'announcement', resourceId: id, before: { title: row.title, bodyMd: row.bodyMd }, ...meta }, tx);
    });
  }

  // ── Contenido del portal (RF-14.01) ────────────────────────────────────
  async blocks() {
    const rows = await this.d.db.contentBlock.findMany({ orderBy: { key: 'asc' } });
    return rows.map((b) => ({ key: b.key, bodyMd: b.bodyMd, updatedAt: b.updatedAt.toISOString() }));
  }

  async saveBlock(key: string, bodyMd: string, actor: string, meta: RequestMeta) {
    const before = await this.d.db.contentBlock.findUnique({ where: { key } });
    if (!before) throw notFound('Bloque no encontrado.');
    await this.d.db.$transaction(async (tx) => {
      await tx.contentBlock.update({ where: { key }, data: { bodyMd } });
      await this.d.audit.record({ actorUserId: actor, action: 'content.updated', resourceType: 'content_block', resourceId: key, before: { bodyMd: before.bodyMd }, after: { bodyMd }, ...meta }, tx);
    });
  }

  // ── Funciones por etapa (RF-14.08) ─────────────────────────────────────
  async flags() {
    return (await this.d.db.featureFlag.findMany({ orderBy: { sortOrder: 'asc' } }))
      .map((f) => ({ key: f.key, label: f.label, enabled: f.enabled, linkedStageCodes: f.linkedStageCodes }));
  }

  async setFlag(key: string, enabled: boolean, actor: string, meta: RequestMeta) {
    const f = await this.d.db.featureFlag.findUnique({ where: { key } });
    if (!f) throw notFound('Función no encontrada.');
    await this.d.db.$transaction(async (tx) => {
      await tx.featureFlag.update({ where: { key }, data: { enabled } });
      await this.d.audit.record({ actorUserId: actor, action: 'feature.toggled', resourceType: 'feature_flag', resourceId: key, before: { enabled: f.enabled }, after: { enabled }, ...meta }, tx);
    });
  }

  // ── Parámetros de retención y respaldo ─────────────────────────────────
  async parameters() {
    const rows = new Map((await this.d.db.systemParameter.findMany()).map((r) => [r.key, r]));
    return Object.entries(DEFAULT_PARAMETERS).map(([key, def]) => ({
      key, label: def.label, value: rows.get(key)?.value ?? def.value, updatedAt: rows.get(key)?.updatedAt.toISOString() ?? null,
    }));
  }

  async parameter(key: string): Promise<string> {
    return (await this.d.db.systemParameter.findUnique({ where: { key } }))?.value ?? DEFAULT_PARAMETERS[key]?.value ?? '';
  }

  async setParameter(key: string, value: string, actor: string, meta: RequestMeta) {
    const def = DEFAULT_PARAMETERS[key];
    if (!def || key === 'retencion.auditoria') throw validationError('Parámetro no editable.', [{ field: 'key', issue: 'no editable' }]);
    if (key.endsWith('_dias') || key.endsWith('_anios')) {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 3650) throw validationError('Escribe un número entero positivo.', [{ field: 'value', issue: 'número' }]);
    }
    const before = await this.parameter(key);
    await this.d.db.$transaction(async (tx) => {
      await tx.systemParameter.upsert({ where: { key }, create: { key, value, label: def.label, updatedBy: actor }, update: { value, updatedBy: actor } });
      await this.d.audit.record({ actorUserId: actor, action: 'parameter.updated', resourceType: 'system_parameter', resourceId: key, before: { value: before }, after: { value }, ...meta }, tx);
    });
  }

  // ── Fallas de integración (RF-14.09) ───────────────────────────────────
  async failures() {
    const rows = await this.d.db.outboxEvent.findMany({ where: { processedAt: null, lastError: { not: null } }, orderBy: { occurredAt: 'desc' }, take: 50 });
    return rows.map((e) => ({ id: e.id, eventType: e.eventType, occurredAt: e.occurredAt.toISOString(), attempts: e.attempts, lastError: e.lastError }));
  }

  /** Reintento controlado: vuelve a dejar el evento con intentos disponibles y despacha. */
  async retry(id: string, actor: string, meta: RequestMeta) {
    const e = await this.d.db.outboxEvent.findUnique({ where: { id } });
    if (!e || e.processedAt) throw notFound('Evento no encontrado o ya procesado.');
    await this.d.db.$transaction(async (tx) => {
      await tx.outboxEvent.update({ where: { id }, data: { attempts: 0 } });
      await this.d.audit.record({ actorUserId: actor, action: 'integration.retry', resourceType: 'outbox_event', resourceId: id, after: { eventType: e.eventType }, ...meta }, tx);
    });
    this.d.outbox.kick();
  }
}
