import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db, Tx } from '../../../shared/db/prisma.js';
import { unauthorized } from '../../../shared/http/errors.js';
import { SESSION_TTL, deviceLabel, evaluateRefresh } from '../domain/session-policy.js';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export interface SessionMeta {
  userAgent: string | null;
  ipHash: string;
}

/** Sesiones con refresh token opaco rotativo (ADR-006). */
export class SessionService {
  constructor(private readonly db: Db, private readonly clock: Clock) {}

  /** `newDevice` trae la etiqueta si entra desde un navegador o sistema que esta cuenta nunca usó; en el primer ingreso no avisa. */
  async create(userId: string, type: 'APPLICANT' | 'STAFF', meta: SessionMeta): Promise<{ sessionId: string; refreshToken: string; expiresAt: Date; newDevice: string | null }> {
    const device = deviceLabel(meta.userAgent);
    const known = await this.db.session.findMany({ where: { userId }, select: { userAgent: true }, distinct: ['userAgent'], take: 100 });
    const newDevice = device && known.length && !known.some((s) => deviceLabel(s.userAgent) === device) ? device : null;
    return { ...(await this.issue(this.db, userId, type, randomUUID(), meta)), newDevice };
  }

  /** Sesiones abiertas, una por dispositivo: cada rotación deja viva solo la última de su familia. */
  async list(userId: string, currentSessionId: string) {
    const now = this.clock.now();
    const [rows, current] = await Promise.all([
      this.db.session.findMany({ where: { userId, revokedAt: null, expiresAt: { gt: now } }, orderBy: { lastRefreshedAt: 'desc' } }),
      this.db.session.findUnique({ where: { id: currentSessionId }, select: { familyId: true } }),
    ]);
    return rows.map((s) => ({ id: s.familyId, device: deviceLabel(s.userAgent) ?? 'Dispositivo desconocido', lastActiveAt: s.lastRefreshedAt.toISOString(), current: s.familyId === current?.familyId }));
  }

  /** Cierra un dispositivo de esta cuenta. Corta la renovación al instante; su token de acceso vence en 15 minutos o menos (ADR-006). */
  async revokeDevice(userId: string, familyId: string): Promise<boolean> {
    const { count } = await this.db.session.updateMany({ where: { userId, familyId, revokedAt: null }, data: { revokedAt: this.clock.now(), revokeReason: 'USER_REVOKED' } });
    return count > 0;
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
