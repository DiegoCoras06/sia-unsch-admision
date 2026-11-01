import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db, Tx } from '../../../shared/db/prisma.js';
import { unauthorized } from '../../../shared/http/errors.js';
import { SESSION_TTL, evaluateRefresh } from '../domain/session-policy.js';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export interface SessionMeta {
  userAgent: string | null;
  ipHash: string;
}

/** Sesiones con refresh token opaco rotativo (ADR-006). */
export class SessionService {
  constructor(private readonly db: Db, private readonly clock: Clock) {}

  async create(userId: string, type: 'APPLICANT' | 'STAFF', meta: SessionMeta): Promise<{ sessionId: string; refreshToken: string; expiresAt: Date }> {
    return this.issue(this.db, userId, type, randomUUID(), meta);
  }

  /** Rota el refresh token. Lanza 401 con el motivo; si detecta reutilización, revoca la familia. */
  async rotate(refreshToken: string, type: 'APPLICANT' | 'STAFF' | null, meta: SessionMeta) {
    const now = this.clock.now();
    const session = await this.db.session.findUnique({ where: { refreshTokenHash: sha256(refreshToken) } });
    if (!session) throw unauthorized('SESSION_REVOKED', 'Tu sesión ya no es válida. Inicia sesión de nuevo.');

    const decision = evaluateRefresh(session, now);
    if (!decision.ok) {
      if (decision.reuseDetected) await this.revokeFamily(session.familyId, 'REUSE_DETECTED');
      const messages = {
        SESSION_IDLE: 'Tu sesión se cerró por inactividad.',
        SESSION_EXPIRED: 'Tu sesión expiró. Inicia sesión de nuevo.',
        SESSION_REVOKED: 'Tu sesión se cerró. Inicia sesión de nuevo.',
      } as const;
      const message = messages[decision.code];
      throw unauthorized(decision.code, message);
    }

    return this.db.$transaction(async (tx) => {
      const next = await this.issue(tx, session.userId, type ?? 'APPLICANT', session.familyId, meta);
      await tx.session.update({
        where: { id: session.id },
        data: { revokedAt: now, revokeReason: 'ROTATED', replacedBy: next.sessionId },
      });
      return { ...next, userId: session.userId };
    });
  }

  async revoke(refreshToken: string, reason = 'LOGOUT'): Promise<string | null> {
    const session = await this.db.session.findUnique({ where: { refreshTokenHash: sha256(refreshToken) } });
    if (!session) return null;
    await this.db.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: this.clock.now(), revokeReason: reason } });
    return session.userId;
  }

  async revokeAll(userId: string, reason: string, tx?: Tx): Promise<number> {
    const { count } = await (tx ?? this.db).session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: this.clock.now(), revokeReason: reason },
    });
    return count;
  }

  private async revokeFamily(familyId: string, reason: string): Promise<void> {
    await this.db.session.updateMany({ where: { familyId, revokedAt: null }, data: { revokedAt: this.clock.now(), revokeReason: reason } });
  }

  private async issue(client: Db | Tx, userId: string, type: 'APPLICANT' | 'STAFF', familyId: string, meta: SessionMeta) {
    const now = this.clock.now();
    const refreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + SESSION_TTL[type] * 1000);
    const session = await client.session.create({
      data: {
        userId, familyId, refreshTokenHash: sha256(refreshToken), expiresAt, lastRefreshedAt: now,
        userAgent: meta.userAgent?.slice(0, 300) ?? null, ipHash: meta.ipHash,
      },
    });
    return { sessionId: session.id, refreshToken, expiresAt };
  }
}
