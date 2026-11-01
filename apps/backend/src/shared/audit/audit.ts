import type { Db, Tx } from '../db/prisma.js';

export interface AuditEntry {
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  requestId?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
}

/** Datos de la solicitud que acompañan a cada evento de auditoría. */
export interface RequestMeta {
  requestId: string;
  ipHash: string;
  userAgent: string | null;
}

const FORBIDDEN_KEYS = /password|token|code|secret/i;

/** Auditoría solo de inserción (RNF-10). Nunca guarda contraseñas, códigos ni tokens. */
export class AuditLog {
  constructor(private readonly db: Db) {}

  async record(entry: AuditEntry, tx?: Tx): Promise<void> {
    const client = tx ?? this.db;
    await client.auditEvent.create({
      data: {
        actorUserId: entry.actorUserId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        before: (sanitize(entry.before) ?? undefined) as object | undefined,
        after: (sanitize(entry.after) ?? undefined) as object | undefined,
        requestId: entry.requestId ?? null,
        ipHash: entry.ipHash ?? null,
        userAgent: entry.userAgent?.slice(0, 300) ?? null,
      },
    });
  }
}

function sanitize(value: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!value) return null;
  return Object.fromEntries(Object.entries(value).filter(([k]) => !FORBIDDEN_KEYS.test(k)));
}
