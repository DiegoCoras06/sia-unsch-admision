// API pública del módulo M02 Usuarios e identidad.
import type { RequestHandler } from 'express';
import type { AuditLog } from '../../shared/audit/audit.js';
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import type { EmailSender } from '../../shared/email/email-sender.js';
import type { Outbox } from '../../shared/events/outbox.js';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter.js';
import { SecretBox, totpService, type AccessService, type JoseTokenService, type Permission, type SessionService } from '../seguridad/index.js';
import { StaffAdmin } from './application/staff-admin.js';
import { StaffAuthService } from './application/staff-auth-service.js';
export { temporaryPassword } from './application/staff-admin.js';
import { AuthService } from './application/auth-service.js';
import { ProfileService } from './application/profile-service.js';
import type { IdentityProvider } from './domain/ports.js';
import { subscribeAccountNotifications } from './infrastructure/account-notifications.js';
import { Argon2Hasher } from './infrastructure/argon2-hasher.js';
import { MockIdentityProvider } from './infrastructure/mock-identity-provider.js';
import { usuariosRoutes } from './presentation/routes.js';
import { ApiPeruIdentityProvider } from './infrastructure/apiperu-identity-provider.js';

export type { IdentityProvider, IdentityLookupResult } from './domain/ports.js';
export { isMinor, applicantCodeFromSequence } from './domain/account-rules.js';

/** Elige el adaptador de identidad según la configuración (ADR-007). */
export function createIdentityProvider(
  cfg: { provider: 'mock' | 'apiperu'; url?: string | undefined; token?: string | undefined },
  now: () => Date,
): IdentityProvider {
  if (cfg.provider === 'apiperu' && cfg.token) return new ApiPeruIdentityProvider(cfg.token, cfg.url);
  return new MockIdentityProvider(10_000, now);
}

export function createUsuariosModule(deps: {
  db: Db;
  clock: Clock;
  outbox: Outbox;
  audit: AuditLog;
  limiter: RateLimiter;
  email: EmailSender;
  tokens: JoseTokenService;
  sessions: SessionService;
  access: AccessService;
  authenticate: RequestHandler;
  hmacSecret: string;
  frontendOrigin: string;
  cookieSecure: boolean;
  identityProvider?: IdentityProvider;
  /** Panel (ADR-018): permiso por ruta y clave para cifrar el secreto TOTP. */
  guard: (permission: Permission) => RequestHandler;
  staffSecretKey: string;
  /** M03: inscripciones del documento de la cuenta (enmienda de ADR-015). */
  inscriptionsOf?: (documentType: string, documentNumber: string) => Promise<unknown[]>;
}) {
  const identity = deps.identityProvider ?? new MockIdentityProvider(10_000, () => deps.clock.now());
  const hasher = new Argon2Hasher();
  const auth = new AuthService({ ...deps, identity, hasher });
  const profile = new ProfileService(deps.db, deps.clock, deps.audit, deps.outbox, deps.hmacSecret, identity.simulated);
  const staffAuth = new StaffAuthService({ ...deps, hasher, secrets: new SecretBox(deps.staffSecretKey), totp: totpService });
  const staffAdmin = new StaffAdmin({ db: deps.db, audit: deps.audit, hasher, sessions: deps.sessions });
  subscribeAccountNotifications(deps.outbox, deps.email, deps.frontendOrigin);
  return {
    auth, profile, staffAuth, staffAdmin, hasher,
    router: usuariosRoutes(auth, profile, deps.authenticate, deps.cookieSecure, { auth: staffAuth, admin: staffAdmin, guard: deps.guard }, deps.inscriptionsOf),
  };
}
