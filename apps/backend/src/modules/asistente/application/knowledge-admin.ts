import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Db } from '../../../shared/db/prisma.js';
import { notFound } from '../../../shared/http/errors.js';
import { normalizeForSearch } from '../../../shared/text/normalize.js';

/** Base de conocimientos editable desde el panel (spec 009 Historia 4; RF-10.12). El asistente la usa al instante. */
export class KnowledgeAdmin {
  constructor(private readonly d: { db: Db; audit: AuditLog }) {}

  async list() {
    const rows = await this.d.db.knowledgeEntry.findMany({ orderBy: [{ topic: 'asc' }, { question: 'asc' }] });
    return rows.map((k) => ({ id: k.id, topic: k.topic, question: k.question, answer: k.answer, source: k.source, active: k.active, updatedAt: k.updatedAt.toISOString() }));
  }

  async save(input: { id?: string | undefined; topic: string; question: string; answer: string; source: string; active: boolean; extraKeywords?: string | undefined }, actor: string, meta: RequestMeta) {
    const data = {
      topic: input.topic.trim().toLowerCase(), question: input.question.trim(), answer: input.answer.trim(), source: input.source.trim(), active: input.active,
      keywords: normalizeForSearch(`${input.extraKeywords ?? ''} ${input.question} ${input.topic}`).slice(0, 400),
    };
    return this.d.db.$transaction(async (tx) => {
      const before = input.id ? await tx.knowledgeEntry.findUnique({ where: { id: input.id } }) : null;
      if (input.id && !before) throw notFound('Entrada no encontrada.');
      const row = input.id ? await tx.knowledgeEntry.update({ where: { id: input.id }, data }) : await tx.knowledgeEntry.create({ data });
      await this.d.audit.record({
        actorUserId: actor, action: input.id ? 'knowledge.updated' : 'knowledge.created', resourceType: 'knowledge_entry', resourceId: row.id,
        before: before ? { answer: before.answer, active: before.active } : null, after: { question: row.question, active: row.active }, ...meta,
      }, tx);
      return { id: row.id };
    });
  }
}
