import type { TokenDto } from '@sia/contracts';
import QRCode from 'qrcode';
import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db, Tx } from '../../../shared/db/prisma.js';
import type { Outbox } from '../../../shared/events/outbox.js';
import { forbidden, locked, unauthorized, validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import {
  ACCESS_TOKEN_TTL_SECONDS, permissionsOf, type AccessService, type JoseTokenService, type SecretBox, type SessionService, type Totp,
} from '../../seguridad/index.js';
import { normalizeEmail, passwordIssues, registerLoginFailure } from '../domain/account-rules.js';
import type { PasswordHasher } from '../domain/ports.js';
import { newRecoveryCodes, normalizeRecoveryCode } from '../domain/recovery-codes.js';

export type StaffStep = 'CHANGE_PASSWORD' | 'SETUP_MFA' | 'MFA';

export interface StaffChallenge {
  step: StaffStep;
  challenge: string;
  fullName: string;
  /** Solo en SETUP_MFA: lo que el personal escanea con su aplicación de autenticación. */
  mfaSetup?: { secret: string; otpauthUri: string; qrDataUrl: string };
}

interface StaffSession { token: TokenDto; refreshToken: string }
interface ChallengePayload { purpose: 'staff'; uid: string; step: StaffStep }

/**
 * Ingreso del personal (ADR-018): contraseña → cambio obligatorio en el primer ingreso → TOTP → sesión.
 * La sesión (cookie de refresco + JWT con roles) es la misma infraestructura de la spec 002.
 */
export class StaffAuthService {
  private dummyHash: Promise<string> | null = null;

  constructor(
    private readonly d: {
      db: Db;
      clock: Clock;
      outbox: Outbox;
      audit: AuditLog;
      limiter: RateLimiter;
      hasher: PasswordHasher;
      tokens: JoseTokenService;
      sessions: SessionService;
      access: AccessService;
      secrets: SecretBox;
      totp: Totp;
    },
  ) {}

  async login(email: string, password: string, meta: RequestMeta): Promise<StaffChallenge> {
    await this.d.limiter.consume(`staff-login:${meta.ipHash}`, 20, 3600);
    const now = this.d.clock.now();
    const user = await this.d.db.user.findUnique({ where: { email: normalizeEmail(email) }, include: { staff: true } });
    if (!user || user.type !== 'STAFF' || !user.staff) {
      this.dummyHash ??= this.d.hasher.hash('cuenta-inexistente-para-igualar-tiempos');
      await this.d.hasher.verify(await this.dummyHash, password);
      throw unauthorized('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
    }
    if (user.lockedUntil && user.lockedUntil > now) {
      throw locked('ACCOUNT_LOCKED', 'Cuenta bloqueada temporalmente por intentos fallidos.', { lockedUntil: user.lockedUntil.toISOString() });
    }
    if (user.status === 'SUSPENDED' || user.status === 'DISABLED') throw forbidden('Tu cuenta está suspendida o desactivada.');
    if (!(await this.d.hasher.verify(user.passwordHash, password))) {
      const next = registerLoginFailure(user, now);
      await this.d.db.user.update({
        where: { id: user.id },
        data: { failedLoginCount: next.failedLoginCount, failedLoginSince: next.failedLoginSince, ...(next.lockUntil ? { lockedUntil: next.lockUntil } : {}) },
      });
      await this.d.audit.record({ actorUserId: user.id, action: next.lockUntil ? 'staff.locked' : 'staff.login_failed', resourceType: 'user', resourceId: user.id, ...meta });
      throw unauthorized('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
    }
    await this.d.db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, failedLoginSince: null, lockedUntil: null } });
    if (user.staff.mustChangePassword) return this.challenge(user.id, 'CHANGE_PASSWORD', user.staff.fullName);
    if (!user.staff.mfaEnabledAt) return this.setupChallenge(user.id, user.email, user.staff.fullName);
    return this.challenge(user.id, 'MFA', user.staff.fullName);
  }

  async changePassword(challenge: string, newPassword: string, meta: RequestMeta): Promise<StaffChallenge> {
    const { uid } = await this.readChallenge(challenge, 'CHANGE_PASSWORD');
    const user = await this.d.db.user.findUniqueOrThrow({ where: { id: uid }, include: { staff: true } });
    const issues = passwordIssues(newPassword, { email: user.email });
    if (issues.length) throw validationError(issues[0]!, issues.map((i) => ({ field: 'newPassword', issue: i })));
    if (await this.d.hasher.verify(user.passwordHash, newPassword)) {
      throw validationError('La nueva contraseña debe ser distinta de la temporal.', [{ field: 'newPassword', issue: 'igual a la anterior' }]);
    }
    await this.d.db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: uid }, data: { passwordHash: await this.d.hasher.hash(newPassword), version: { increment: 1 } } });
      await tx.staffProfile.update({ where: { userId: uid }, data: { mustChangePassword: false } });
      await this.d.audit.record({ actorUserId: uid, action: 'staff.password_changed', resourceType: 'user', resourceId: uid, ...meta }, tx);
    });
    const staff = user.staff!;
    return staff.mfaEnabledAt ? this.challenge(uid, 'MFA', staff.fullName) : this.setupChallenge(uid, user.email, staff.fullName);
  }

  /** Último paso: código TOTP (al activar o en cada ingreso) → sesión. Al activar entrega los códigos de respaldo, una sola vez. */
  async verifyMfa(challenge: string, code: string, meta: RequestMeta): Promise<StaffSession & { recoveryCodes?: string[] }> {
    const { uid, step } = await this.readChallenge(challenge, 'MFA', 'SETUP_MFA');
    await this.d.limiter.consume(`staff-mfa:${uid}`, 10, 900);
    const user = await this.d.db.user.findUniqueOrThrow({ where: { id: uid }, include: { staff: true } });
    const staff = user.staff!;
    if (!staff.mfaSecretEnc) throw unauthorized('MFA_NOT_CONFIGURED', 'Vuelve a iniciar sesión para configurar el segundo factor.');
    const now = this.d.clock.now();
    const usedStep = this.d.totp.verify(this.d.secrets.open(staff.mfaSecretEnc), code.trim(), now, staff.mfaLastStep ?? null);
    if (usedStep === null) {
      await this.d.audit.record({ actorUserId: uid, action: 'staff.mfa_failed', resourceType: 'user', resourceId: uid, ...meta });
      throw unauthorized('MFA_INVALID', 'El código no es válido o ya fue usado. Escribe el código actual de tu aplicación.');
    }
    let recoveryCodes: string[] | undefined;
    await this.d.db.$transaction(async (tx) => {
      await tx.staffProfile.update({
        where: { userId: uid },
        data: { mfaLastStep: usedStep, ...(step === 'SETUP_MFA' ? { mfaEnabledAt: now } : {}) },
      });
      await tx.user.update({ where: { id: uid }, data: { lastLoginAt: now, status: 'ACTIVE', emailVerifiedAt: user.emailVerifiedAt ?? now } });
      await this.d.audit.record({ actorUserId: uid, action: step === 'SETUP_MFA' ? 'staff.mfa_enabled' : 'staff.login', resourceType: 'user', resourceId: uid, ...meta }, tx);
      if (step === 'SETUP_MFA') recoveryCodes = await this.replaceRecoveryCodes(tx, uid);
    });
    return { ...(await this.openSession(uid, meta)), ...(recoveryCodes ? { recoveryCodes } : {}) };
  }

  /** Celular perdido: un código de respaldo reemplaza al TOTP en un ingreso y no vuelve a servir (ADR-022). */
  async verifyRecoveryCode(challenge: string, code: string, meta: RequestMeta): Promise<StaffSession> {
    const { uid } = await this.readChallenge(challenge, 'MFA');
    await this.d.limiter.consume(`staff-mfa:${uid}`, 10, 900);
    const normalized = normalizeRecoveryCode(code);
    const now = this.d.clock.now();
    // updateMany con `usedAt: null`: dos ingresos simultáneos no pueden gastar el mismo código.
    const used = normalized
      ? await this.d.db.staffRecoveryCode.updateMany({ where: { userId: uid, codeHash: this.d.secrets.fingerprint(normalized), usedAt: null }, data: { usedAt: now } })
      : { count: 0 };
    if (used.count === 0) {
      await this.d.audit.record({ actorUserId: uid, action: 'staff.recovery_failed', resourceType: 'user', resourceId: uid, ...meta });
      throw unauthorized('RECOVERY_INVALID', 'El código de respaldo no es válido o ya fue usado.');
    }
    await this.d.db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: uid }, data: { lastLoginAt: now } });
      await this.d.audit.record({ actorUserId: uid, action: 'staff.login_recovery', resourceType: 'user', resourceId: uid, ...meta }, tx);
    });
    return this.openSession(uid, meta);
  }

  /** Cuántos códigos de respaldo sin usar le quedan. */
  recoveryRemaining(userId: string): Promise<number> {
    return this.d.db.staffRecoveryCode.count({ where: { userId, usedAt: null } });
  }

  /** Nuevos códigos con el TOTP actual: los anteriores dejan de valer. También para quien activó el segundo factor antes de que existieran. */
  async regenerateRecoveryCodes(userId: string, code: string, meta: RequestMeta): Promise<string[]> {
    await this.d.limiter.consume(`staff-mfa:${userId}`, 10, 900);
    const staff = await this.d.db.staffProfile.findUniqueOrThrow({ where: { userId } });
    const usedStep = staff.mfaSecretEnc ? this.d.totp.verify(this.d.secrets.open(staff.mfaSecretEnc), code.trim(), this.d.clock.now(), staff.mfaLastStep ?? null) : null;
    if (usedStep === null) throw unauthorized('MFA_INVALID', 'El código no es válido o ya fue usado. Escribe el código actual de tu aplicación.');
    return this.d.db.$transaction(async (tx) => {
      await tx.staffProfile.update({ where: { userId }, data: { mfaLastStep: usedStep } });
      await this.d.audit.record({ actorUserId: userId, action: 'staff.recovery_regenerated', resourceType: 'user', resourceId: userId, ...meta }, tx);
      return this.replaceRecoveryCodes(tx, userId);
    });
  }

  private async replaceRecoveryCodes(tx: Tx, userId: string): Promise<string[]> {
    const codes = newRecoveryCodes();
    await tx.staffRecoveryCode.deleteMany({ where: { userId } });
    await tx.staffRecoveryCode.createMany({ data: codes.map((c) => ({ userId, codeHash: this.d.secrets.fingerprint(c) })) });
    return codes;
  }

  private async openSession(uid: string, meta: RequestMeta): Promise<StaffSession> {
    const session = await this.d.sessions.create(uid, 'STAFF', { userAgent: meta.userAgent, ipHash: meta.ipHash });
    if (session.newDevice) {
      const { email } = await this.d.db.user.findUniqueOrThrow({ where: { id: uid }, select: { email: true } });
      const event = { email, device: session.newDevice, at: this.d.clock.now().toISOString(), staff: true };
      await this.d.db.$transaction((tx) => this.d.outbox.publish(tx, 'InicioSesionNuevo', event));
      this.d.outbox.kick();
    }
    const roles = await this.d.access.rolesOf(uid);
    const accessToken = await this.d.tokens.signAccess({ sub: uid, sid: session.sessionId, typ: 'STAFF', roles });
    return { token: { accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS, user: { id: uid, type: 'STAFF', status: 'ACTIVE', roles } }, refreshToken: session.refreshToken };
  }

  /** Perfil del personal en sesión: nombre, roles y permisos efectivos. */
  async me(userId: string) {
    const user = await this.d.db.user.findUniqueOrThrow({ where: { id: userId }, include: { staff: true } });
    const roles = await this.d.access.rolesOf(userId);
    return { id: user.id, email: user.email, fullName: user.staff?.fullName ?? user.email, roles, permissions: permissionsOf(roles) };
  }

  private async setupChallenge(uid: string, email: string, fullName: string): Promise<StaffChallenge> {
    const secret = this.d.totp.newSecret();
    await this.d.db.staffProfile.update({ where: { userId: uid }, data: { mfaSecretEnc: this.d.secrets.seal(secret), mfaLastStep: null } });
    const otpauthUri = this.d.totp.uri(secret, email);
    const base = await this.challenge(uid, 'SETUP_MFA', fullName);
    return { ...base, mfaSetup: { secret, otpauthUri, qrDataUrl: await QRCode.toDataURL(otpauthUri, { margin: 1, width: 220 }) } };
  }

  private async challenge(uid: string, step: StaffStep, fullName: string): Promise<StaffChallenge> {
    const payload: ChallengePayload = { purpose: 'staff', uid, step };
    return { step, challenge: await this.d.tokens.signIdentity(payload as unknown as Record<string, unknown>, 600), fullName };
  }

  private async readChallenge(token: string, ...steps: StaffStep[]): Promise<ChallengePayload> {
    const p = await this.d.tokens.verifyIdentity<ChallengePayload>(token);
    if (!p || p === 'expired' || p.purpose !== 'staff' || !steps.includes(p.step)) {
      throw unauthorized('CHALLENGE_INVALID', 'Tu ingreso venció. Vuelve a escribir tu correo y contraseña.');
    }
    return p;
  }
}
