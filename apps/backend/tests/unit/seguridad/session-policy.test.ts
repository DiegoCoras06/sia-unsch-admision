import { describe, expect, it } from 'vitest';
import { evaluateRefresh } from '../../../src/modules/seguridad/domain/session-policy.js';

const now = new Date('2026-10-25T10:00:00-05:00');
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);
const session = (over: Partial<Parameters<typeof evaluateRefresh>[0]> = {}) => ({
  expiresAt: new Date(now.getTime() + 86_400_000), lastRefreshedAt: minutesAgo(5), revokedAt: null, revokeReason: null, ...over,
});

describe('Renovación de sesión (ADR-006, research R-05 de 002)', () => {
  it('permite rotar una sesión vigente y activa', () => {
    expect(evaluateRefresh(session(), now)).toEqual({ ok: true });
  });
  it('H3-E4: rechaza tras más de 30 minutos sin renovar', () => {
    expect(evaluateRefresh(session({ lastRefreshedAt: minutesAgo(31) }), now)).toMatchObject({ ok: false, code: 'SESSION_IDLE' });
  });
  it('rechaza una sesión vencida', () => {
    expect(evaluateRefresh(session({ expiresAt: minutesAgo(1) }), now)).toMatchObject({ ok: false, code: 'SESSION_EXPIRED' });
  });
  it('un token ya rotado que reaparece es reutilización (posible robo)', () => {
    expect(evaluateRefresh(session({ revokedAt: minutesAgo(1), revokeReason: 'ROTATED' }), now)).toEqual({ ok: false, code: 'SESSION_REVOKED', reuseDetected: true });
  });
  it('un token cerrado por logout no dispara la detección de robo', () => {
    expect(evaluateRefresh(session({ revokedAt: minutesAgo(1), revokeReason: 'LOGOUT' }), now)).toMatchObject({ reuseDetected: false });
  });
});
