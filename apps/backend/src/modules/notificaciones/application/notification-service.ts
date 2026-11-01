import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db } from '../../../shared/db/prisma.js';
import type { EmailMessage, EmailSender } from '../../../shared/email/email-sender.js';
import { notFound, validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import { DEFAULT_TEMPLATES, fill, type TemplateKey } from '../domain/templates.js';

export interface Recipient { applicantCode: string; email: string; firstNames: string }
export interface Segment { modality?: string | undefined; optionCode?: string | undefined; status?: string | undefined }

/** Lo que M11 necesita de otros módulos para sus avisos automáticos. */
export interface NoticeSources {
  /** M03: destinatarios de un comunicado segmentado. */
  segment(filter: Segment): Promise<Recipient[]>;
  /** M03 + M01: inscripciones pendientes de pago cuya etapa regular cierra pronto. */
  pendingPayments(withinHours: number): Promise<(Recipient & { amount: string; closesAt: Date; stage: string })[]>;
  /** M03: correo y nombre de una inscripción, con DNI + código. */
  contact(documentNumber: string, applicantCode: string): Promise<Recipient | null>;
  /** M07/M08: exámenes con aulas recién publicadas y exámenes de mañana. */
  roomNotices(): Promise<{ examId: string; exam: string; people: Recipient[] }[]>;
  markRoomsNotified(examId: string): Promise<void>;
  examsSoon(withinHours: number): Promise<{ examId: string; exam: string; opens: Date; closes: Date; bring: string[]; people: Recipient[] }[]>;
}

const MAX_ATTEMPTS = 3;
const hour = (d: Date) => d.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: 'numeric', minute: '2-digit' });
const day = (d: Date) => d.toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long' });

/**
 * Envío que deja constancia de cada correo de cualquier módulo (RF-11.09). Si falla, queda FALLIDA y el error
 * sube al llamador (la outbox reintenta el suscriptor).
 */
export class RecordingEmailSender implements EmailSender {
  constructor(private readonly db: Db, private readonly inner: EmailSender, private readonly clock: Clock) {}

  async send(m: EmailMessage): Promise<void> {
    const base = { email: m.to.toLowerCase(), event: m.event ?? 'SISTEMA', subject: m.subject.slice(0, 200), html: m.html, text: m.text, attempts: 1 };
    try {
      await this.inner.send(m);
      await this.db.notification.create({ data: { ...base, status: 'ENVIADA', sentAt: this.clock.now() } }).catch(() => undefined);
    } catch (e) {
      await this.db.notification.create({ data: { ...base, status: 'FALLIDA', lastError: String((e as Error)?.message ?? e).slice(0, 500) } }).catch(() => undefined);
      throw e;
    }
  }
}

/** M11 Notificaciones (spec 010): cola con deduplicación, avisos automáticos, comunicados, bandeja y plantillas. */
export class NotificationService {
  constructor(
    private readonly d: {
      db: Db;
      clock: Clock;
      audit: AuditLog;
      limiter: RateLimiter;
      /** Envío real, sin el registro (la cola ya guarda la notificación). */
      transport: EmailSender;
      sources: NoticeSources;
      frontendOrigin: string;
    },
  ) {}

  // ── Plantillas (FR-006) ────────────────────────────────────────────
  async templates() {
    const saved = new Map((await this.d.db.notificationTemplate.findMany()).map((t) => [t.key, t]));
    return (Object.keys(DEFAULT_TEMPLATES) as TemplateKey[]).map((key) => ({
      key, name: DEFAULT_TEMPLATES[key].name, subject: saved.get(key)?.subject ?? DEFAULT_TEMPLATES[key].subject,
      body: saved.get(key)?.body ?? DEFAULT_TEMPLATES[key].body, customized: saved.has(key),
    }));
  }

  async saveTemplate(key: string, input: { subject: string; body: string }, actorId: string, meta: RequestMeta) {
    if (!(key in DEFAULT_TEMPLATES)) throw notFound('Plantilla no encontrada.');
    const k = key as TemplateKey;
    await this.d.db.notificationTemplate.upsert({
      where: { key: k }, create: { key: k, name: DEFAULT_TEMPLATES[k].name, subject: input.subject, body: input.body }, update: { subject: input.subject, body: input.body },
    });
    await this.d.audit.record({ actorUserId: actorId, action: 'notification.template_updated', resourceType: 'notification_template', resourceId: k, after: { subject: input.subject }, ...meta });
    return this.templates();
  }

  async render(key: TemplateKey, vars: Record<string, string>) {
    const t = (await this.templates()).find((x) => x.key === key)!;
    return fill(t.subject, t.body, { enlace: this.d.frontendOrigin, ...vars });
  }

  // ── Cola ───────────────────────────────────────────────────────────
  /** Encola sin duplicar: la clave de deduplicación garantiza un solo aviso por hecho (SC-002). */
  async enqueue(items: { email: string; event: string; subject: string; html: string; text: string; dedupeKey?: string; campaignId?: string; mandatory?: boolean }[]) {
    if (!items.length) return 0;
    const r = await this.d.db.notification.createMany({
      data: items.map((i) => ({ email: i.email.toLowerCase(), event: i.event, subject: i.subject.slice(0, 200), html: i.html, text: i.text, dedupeKey: i.dedupeKey ?? null, campaignId: i.campaignId ?? null, mandatory: i.mandatory ?? true })),
      skipDuplicates: true,
    });
    return r.count;
  }

  /** Envía en lotes; cada notificación se reclama antes de enviar para no duplicar, con hasta 3 intentos. */
  async dispatch(limit = 50) {
    const pending = await this.d.db.notification.findMany({ where: { status: 'PENDIENTE', attempts: { lt: MAX_ATTEMPTS } }, orderBy: { createdAt: 'asc' }, take: limit });
    let sent = 0;
    for (const n of pending) {
      const claimed = await this.d.db.notification.updateMany({ where: { id: n.id, status: 'PENDIENTE', attempts: n.attempts }, data: { attempts: { increment: 1 } } });
      if (!claimed.count) continue;
      try {
        await this.d.transport.send({ to: n.email, subject: n.subject, html: n.html, text: n.text, event: n.event });
        await this.d.db.notification.update({ where: { id: n.id }, data: { status: 'ENVIADA', sentAt: this.d.clock.now(), lastError: null } });
        sent++;
      } catch (e) {
        await this.d.db.notification.update({
          where: { id: n.id }, data: { lastError: String((e as Error)?.message ?? e).slice(0, 500), ...(n.attempts + 1 >= MAX_ATTEMPTS ? { status: 'FALLIDA' } : {}) },
        });
      }
    }
    return sent;
  }

  /** Ciclo periódico: genera los avisos automáticos que correspondan y envía la cola. */
  async tick() {
    const queued = (await this.paymentReminders()) + (await this.roomNotices()) + (await this.examReminders());
    const sent = await this.dispatch();
    return { queued, sent };
  }

  /** H3-1: dos días antes del cierre de la inscripción regular, a quien no pagó (respeta la preferencia). */
  private async paymentReminders() {
    const people = await this.d.sources.pendingPayments(48);
    const off = await this.optedOut(people.map((p) => p.email));
    const items = [];
    for (const p of people.filter((x) => !off.has(x.email.toLowerCase()))) {
      const m = await this.render('RECORDATORIO_PAGO', { nombre: p.firstNames, codigo: p.applicantCode, monto: p.amount, fecha: `${day(p.closesAt)} a las ${hour(p.closesAt)}`, enlace: `${this.d.frontendOrigin}/mi-inscripcion` });
      items.push({ email: p.email, event: 'RECORDATORIO_PAGO', ...m, dedupeKey: `pago:${p.applicantCode}:${p.stage}`, mandatory: false });
    }
    return this.enqueue(items);
  }

  /** RF-11.06: aulas publicadas, una sola vez por examen. */
  private async roomNotices() {
    let total = 0;
    for (const e of await this.d.sources.roomNotices()) {
      const items = [];
      for (const p of e.people) {
        const m = await this.render('AULA_PUBLICADA', { nombre: p.firstNames, codigo: p.applicantCode, examen: e.exam, enlace: `${this.d.frontendOrigin}/buscar-aula` });
        items.push({ email: p.email, event: 'AULA_PUBLICADA', ...m, dedupeKey: `aula:${e.examId}:${p.applicantCode}` });
      }
      total += await this.enqueue(items);
      await this.d.sources.markRoomsNotified(e.examId);
    }
    return total;
  }

  /** H3-2: la víspera del examen, con la hora de cierre y qué llevar (respeta la preferencia). */
  private async examReminders() {
    let total = 0;
    for (const e of await this.d.sources.examsSoon(24)) {
      const off = await this.optedOut(e.people.map((p) => p.email));
      const items = [];
      for (const p of e.people.filter((x) => !off.has(x.email.toLowerCase()))) {
        const m = await this.render('RECORDATORIO_EXAMEN', {
          nombre: p.firstNames, codigo: p.applicantCode, examen: e.exam, apertura: hour(e.opens), cierre: hour(e.closes), llevar: e.bring.join(', '), enlace: `${this.d.frontendOrigin}/buscar-aula`,
        });
        items.push({ email: p.email, event: 'RECORDATORIO_EXAMEN', ...m, dedupeKey: `examen:${e.examId}:${p.applicantCode}`, mandatory: false });
      }
      total += await this.enqueue(items);
    }
    return total;
  }

  private async optedOut(emails: string[]) {
    const rows = await this.d.db.notificationPreference.findMany({ where: { email: { in: emails.map((e) => e.toLowerCase()) }, reminders: false } });
    return new Set(rows.map((r) => r.email));
  }

  // ── H4: comunicados segmentados (RF-11.08) ─────────────────────────
  async preview(segment: Segment) {
    return { recipients: (await this.d.sources.segment(segment)).length };
  }

  async campaign(input: { subject: string; body: string; segment: Segment }, actorId: string, meta: RequestMeta) {
    const people = await this.d.sources.segment(input.segment);
    if (!people.length) throw validationError('Ningún postulante cumple ese filtro.', [{ field: 'segment', issue: 'vacío' }]);
    const c = await this.d.db.campaign.create({ data: { subject: input.subject, body: input.body, segment: input.segment as object, recipients: people.length, createdBy: actorId } });
    const items = people.map((p) => ({
      email: p.email, event: 'COMUNICADO', ...fill(input.subject, input.body, { nombre: p.firstNames, codigo: p.applicantCode, enlace: this.d.frontendOrigin }),
      dedupeKey: `campana:${c.id}:${p.applicantCode}`, campaignId: c.id,
    }));
    await this.enqueue(items);
    await this.d.audit.record({ actorUserId: actorId, action: 'notification.campaign', resourceType: 'campaign', resourceId: c.id, after: { recipients: people.length, segment: input.segment }, ...meta });
    return this.campaigns();
  }

  async campaigns() {
    const list = await this.d.db.campaign.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
    const counts = await this.d.db.notification.groupBy({ by: ['campaignId', 'status'], where: { campaignId: { in: list.map((c) => c.id) } }, _count: { _all: true } });
    const n = (id: string, s: string) => counts.find((x) => x.campaignId === id && x.status === s)?._count._all ?? 0;
    return list.map((c) => ({
      id: c.id, subject: c.subject, segment: c.segment, recipients: c.recipients, createdAt: c.createdAt.toISOString(),
      sent: n(c.id, 'ENVIADA'), pending: n(c.id, 'PENDIENTE'), failed: n(c.id, 'FALLIDA'), bounced: n(c.id, 'REBOTADA'),
    }));
  }

  // ── Panel: registro de envíos (RF-11.09) ───────────────────────────
  async log(f: { status?: string | undefined; event?: string | undefined; email?: string | undefined; page: number }) {
    const where = {
      ...(f.status ? { status: f.status as 'ENVIADA' } : {}), ...(f.event ? { event: f.event } : {}), ...(f.email ? { email: { contains: f.email.toLowerCase() } } : {}),
    };
    const pageSize = 25;
    const [total, rows, byStatus, byEvent] = await Promise.all([
      this.d.db.notification.count({ where }),
      this.d.db.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (f.page - 1) * pageSize, take: pageSize, select: { id: true, email: true, event: true, subject: true, status: true, attempts: true, lastError: true, sentAt: true, createdAt: true } }),
      this.d.db.notification.groupBy({ by: ['status'], _count: { _all: true } }),
      this.d.db.notification.groupBy({ by: ['event'], _count: { _all: true } }),
    ]);
    return {
      total, page: f.page, pageSize,
      byStatus: byStatus.map((s) => ({ key: s.status, count: s._count._all })), byEvent: byEvent.map((e) => ({ key: e.event, count: e._count._all })),
      items: rows.map((r) => ({ ...r, sentAt: r.sentAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() })),
    };
  }

  /** Reintento manual de las fallidas (vuelven a la cola con intentos en cero). */
  async retryFailed(actorId: string, meta: RequestMeta) {
    const r = await this.d.db.notification.updateMany({ where: { status: 'FALLIDA' }, data: { status: 'PENDIENTE', attempts: 0 } });
    await this.d.audit.record({ actorUserId: actorId, action: 'notification.retry', resourceType: 'notification', resourceId: 'FALLIDA', after: { count: r.count }, ...meta });
    return { requeued: r.count };
  }

  // ── Postulante: bandeja y preferencias (Historias 2 y 5) ───────────
  private async who(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    await this.d.limiter.consume(`avisos:${meta.ipHash}`, 60, 3600);
    const p = await this.d.sources.contact(documentNumber, applicantCode);
    if (!p) throw notFound('No encontramos una inscripción con ese documento y código.');
    return p;
  }

  async inbox(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    const p = await this.who(documentNumber, applicantCode, meta);
    const [rows, pref] = await Promise.all([
      this.d.db.notification.findMany({ where: { email: p.email.toLowerCase(), status: { in: ['ENVIADA', 'PENDIENTE'] } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.d.db.notificationPreference.findUnique({ where: { email: p.email.toLowerCase() } }),
    ]);
    return {
      reminders: pref?.reminders ?? true,
      unread: rows.filter((r) => !r.readAt).length,
      items: rows.map((r) => ({ id: r.id, subject: r.subject, text: r.text, event: r.event, read: Boolean(r.readAt), at: r.createdAt.toISOString() })),
    };
  }

  async markRead(documentNumber: string, applicantCode: string, ids: string[], meta: RequestMeta) {
    const p = await this.who(documentNumber, applicantCode, meta);
    await this.d.db.notification.updateMany({ where: { id: { in: ids }, email: p.email.toLowerCase(), readAt: null }, data: { readAt: this.d.clock.now() } });
    return this.inbox(documentNumber, applicantCode, meta);
  }

  async setReminders(documentNumber: string, applicantCode: string, reminders: boolean, meta: RequestMeta) {
    const p = await this.who(documentNumber, applicantCode, meta);
    await this.d.db.notificationPreference.upsert({ where: { email: p.email.toLowerCase() }, create: { email: p.email.toLowerCase(), reminders }, update: { reminders } });
    return this.inbox(documentNumber, applicantCode, meta);
  }
}
