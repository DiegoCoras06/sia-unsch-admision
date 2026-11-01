// API pública del módulo M13 Seguridad.
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import type { Outbox } from '../../shared/events/outbox.js';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter.js';
import { AccessService } from './application/access-service.js';
import { SessionService } from './application/session-service.js';
import { SupportCases } from './application/support-cases.js';
import { JoseTokenService } from './infrastructure/token-service.js';
import { authenticate, authorize } from './presentation/auth-middleware.js';
import { seguridadRoutes } from './presentation/routes.js';
import type { AuditLog } from '../../shared/audit/audit.js';
import { guardFactory } from './presentation/guard.js';
import { newTotpSecret, otpauthUri, totp, verifyTotp } from './infrastructure/totp.js';

export type { Principal } from './presentation/auth-middleware.js';
export type { SessionService } from './application/session-service.js';
export type { AccessService } from './application/access-service.js';
export { ACCESS_TOKEN_TTL_SECONDS, type JoseTokenService } from './infrastructure/token-service.js';
export { SESSION_TTL } from './domain/session-policy.js';
export { PERMISSIONS, STAFF_ROLES, hasPermission, permissionsOf, type Permission } from './domain/permissions.js';
export { SecretBox } from './infrastructure/secret-box.js';
export { SecurityAdmin } from './application/security-admin.js';

/** Segundo factor TOTP (ADR-018) como servicio inyectable. */
export const totpService = { newSecret: newTotpSecret, verify: verifyTotp, uri: otpauthUri, code: totp };
export type Totp = typeof totpService;

export function createSeguridadModule(deps: {
  db: Db;
  clock: Clock;
  outbox: Outbox;
  limiter: RateLimiter;
  jwtSecret: string;
  identityTokenSecret: string;
  currentCallCode: () => Promise<string>;
  audit: AuditLog;
}) {
  const tokens = new JoseTokenService(deps.jwtSecret, deps.identityTokenSecret, () => deps.clock.now());
  const sessions = new SessionService(deps.db, deps.clock);
  const access = new AccessService(deps.db, deps.clock);
  const cases = new SupportCases(deps.db, deps.outbox, deps.limiter);
  return {
    tokens,
    sessions,
    access,
    authenticate: authenticate(tokens),
    authorize,
    /** `guard('permiso')`: usuario interno con ese permiso; el rechazo queda auditado (RF-13.07). */
    guard: guardFactory(deps.audit),
    cases,
    router: seguridadRoutes(cases, deps.currentCallCode),
    /** API pública para M10: caso de atención derivado del asistente. */
    support: {
      createCase: async (input: { name: string; email: string; message: string }, ipHash: string) =>
        cases.createEscalation(input, ipHash, await deps.currentCallCode()),
      /** M09: solicitud de revisión de resultados. */
      createReview: async (input: { name: string; email: string; message: string }, ipHash: string) =>
        cases.createResultReview(input, ipHash, await deps.currentCallCode()),
    },
  };
}
