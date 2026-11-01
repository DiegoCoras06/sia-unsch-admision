/** Reglas de sesión (ADR-006, research R-05 de 002). Puras: sin base de datos ni HTTP. */

export const SESSION_TTL = { APPLICANT: 7 * 24 * 3600, STAFF: 8 * 3600 } as const;
export const IDLE_LIMIT_SECONDS = 30 * 60;

export interface SessionState {
  expiresAt: Date;
  lastRefreshedAt: Date;
  revokedAt: Date | null;
  revokeReason: string | null;
}

export type RefreshDecision =
  | { ok: true }
  | { ok: false; code: 'SESSION_EXPIRED' | 'SESSION_IDLE' | 'SESSION_REVOKED'; reuseDetected: boolean };

/**
 * Decide si un refresh token puede rotarse.
 * Un token ya rotado que vuelve a presentarse indica robo: se revoca toda la familia.
 */
export function evaluateRefresh(session: SessionState, now: Date): RefreshDecision {
  if (session.revokedAt) {
    return { ok: false, code: 'SESSION_REVOKED', reuseDetected: session.revokeReason === 'ROTATED' };
  }
  if (now.getTime() >= session.expiresAt.getTime()) return { ok: false, code: 'SESSION_EXPIRED', reuseDetected: false };
  if (now.getTime() - session.lastRefreshedAt.getTime() > IDLE_LIMIT_SECONDS * 1000) {
    return { ok: false, code: 'SESSION_IDLE', reuseDetected: false };
  }
  return { ok: true };
}
