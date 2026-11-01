import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type {
  ConsentDto, IdentityLookupDto, IdentityLookupRequestDto, RegisterRequestDto, RegisterResultDto, TokenDto,
} from '@sia/contracts';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import type { AuditLog } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import { nextCounterValue } from '../../../shared/db/counters.js';
import type { Db } from '../../../shared/db/prisma.js';
import type { Outbox } from '../../../shared/events/outbox.js';
import { businessRule, conflict, forbidden, locked, tooManyRequests, unauthorized, validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import { maskEmail } from '../../../shared/telemetry/logger.js';
import { ACCESS_TOKEN_TTL_SECONDS, type AccessService, type JoseTokenService, type SessionService } from '../../seguridad/index.js';
import {
  applicantCodeFromSequence, isMinor, normalizeEmail, passwordIssues, registerLoginFailure,
} from '../domain/account-rules.js';
import type { DocumentType, IdentityProvider, PasswordHasher } from '../domain/ports.js';

interface IdentityTokenPayload {
  documentType: DocumentType;
  documentNumber: string;
  identityStatus: 'VERIFIED' | 'PENDING';
  firstNames: string | null;
  paternalSurname: string | null;
  maternalSurname: string | null;
  birthDate: string | null;
  provider: 'MOCK' | 'RENIEC' | 'MANUAL';
  providerResult: string;
}

const CODE_TTL_MS = 15 * 60_000;
const RESET_TTL_MS = 30 * 60_000;
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

export interface AuthDeps {
  db: Db;
  clock: Clock;
  outbox: Outbox;
  audit: AuditLog;
  limiter: RateLimiter;
  identity: IdentityProvider;
  hasher: PasswordHasher;
  tokens: JoseTokenService;
  sessions: SessionService;
  access: AccessService;
  hmacSecret: string;
  frontendOrigin: string;
}

/** Casos de uso de la spec 002, Historias 1–4 (registro, verificación, sesión y recuperación). */
export class AuthService {
  /** Hash ficticio para igualar tiempos cuando la cuenta no existe (anti-enumeración). */
  private dummyHash: Promise<string> | null = null;

  constructor(private readonly d: AuthDeps) {}

  private hmac(value: string): string {
    return createHmac('sha256', this.d.hmacSecret).update(value).digest('hex');
  }

  async currentConsent(): Promise<ConsentDto> {
    const doc = await this.d.db.consentDocument.findFirstOrThrow({ orderBy: { publishedAt: 'desc' } });
    return { version: doc.version, textMarkdown: doc.textMd };
  }

  // ── H1: paso 1, consulta de identidad ─────────────────────────────────
  async lookupIdentity(input: IdentityLookupRequestDto, meta: RequestMeta): Promise<IdentityLookupDto> {
    await this.d.limiter.consume(`idlookup:ip:${meta.ipHash}`, 10, 3600);
    const docKey = `idlookup:doc:${this.hmac(`${input.documentType}:${input.documentNumber}`)}`;
    if ((await this.d.limiter.peek(docKey, 3600)) >= 3) {
      throw businessRule('IDENTITY_LOOKUP_BLOCKED', 'Demasiados intentos fallidos con este documento. Inténtalo en una hora.');
    }

    let payload: IdentityTokenPayload;
    if (input.documentType === 'DNI') {
      if (!/^\d{8}$/.test(input.documentNumber)) throw validationError('El DNI debe tener 8 dígitos.', [{ field: 'documentNumber', issue: '8 dígitos' }]);
      if (!input.checkDigit) throw validationError('Ingresa el dígito verificador de tu DNI.', [{ field: 'checkDigit', issue: 'obligatorio' }]);
      const result = await this.d.identity.lookupDni(input.documentNumber, input.checkDigit);
      if (result.kind === 'NOT_MATCHED') {
        await this.d.limiter.hit(docKey, 3600);
        throw businessRule('IDENTITY_NOT_MATCHED', 'No pudimos verificar ese documento. Revisa el número y el dígito verificador.');
      }
      if (result.kind === 'EXPIRED') throw businessRule('DOCUMENT_EXPIRED', 'Tu DNI no está vigente. Renuévalo antes de registrarte (Art. 17.2).');
      payload =
        result.kind === 'MATCHED'
          ? { documentType: 'DNI', documentNumber: input.documentNumber, identityStatus: 'VERIFIED', firstNames: result.firstNames, paternalSurname: result.paternalSurname, maternalSurname: result.maternalSurname, birthDate: result.birthDate, provider: this.d.identity.name, providerResult: 'MATCHED' }
          : { documentType: 'DNI', documentNumber: input.documentNumber, identityStatus: 'PENDING', firstNames: null, paternalSurname: null, maternalSurname: null, birthDate: null, provider: this.d.identity.name, providerResult: 'UNAVAILABLE' };
    } else {
      if (!/^[A-Z0-9]{6,12}$/i.test(input.documentNumber)) throw validationError('Número de documento inválido.', [{ field: 'documentNumber', issue: '6 a 12 caracteres' }]);
      payload = { documentType: input.documentType, documentNumber: input.documentNumber.toUpperCase(), identityStatus: 'PENDING', firstNames: null, paternalSurname: null, maternalSurname: null, birthDate: null, provider: 'MANUAL', providerResult: 'MANUAL' };
    }

    if (await this.d.access.isDisqualified(payload.documentType, payload.documentNumber)) {
      throw businessRule('REGISTRATION_NOT_ALLOWED', 'No es posible continuar con el registro. Acércate a la Dirección de Admisión.');
    }

    const existing = await this.d.db.applicant.findUnique({
      where: { documentType_documentNumber: { documentType: payload.documentType, documentNumber: payload.documentNumber } },
      include: { user: true },
    });
    if (existing) {
      throw conflict('DOCUMENT_ALREADY_REGISTERED', 'Este documento ya tiene una cuenta. Si es tuya, recupera tu contraseña.', {
        maskedEmail: maskEmail(existing.user.email),
      });
    }

    return {
      identityStatus: payload.identityStatus,
      firstNames: payload.firstNames,
      paternalSurname: payload.paternalSurname,
      maternalSurname: payload.maternalSurname,
      isMinor: payload.birthDate ? isMinor(new Date(payload.birthDate), this.d.clock.now()) : false,
      simulated: this.d.identity.simulated,
      identityToken: await this.d.tokens.signIdentity({ ...payload }),
    };
  }

  // ── H1: paso 2, crear la cuenta ────────────────────────────────────────
  async register(input: RegisterRequestDto, meta: RequestMeta): Promise<RegisterResultDto> {
    const identity = await this.d.tokens.verifyIdentity<IdentityTokenPayload>(input.identityToken);
    if (identity === 'expired') throw businessRule('IDENTITY_TOKEN_EXPIRED', 'Pasaron más de 10 minutos. Vuelve a verificar tu documento.');
    if (!identity) throw businessRule('IDENTITY_TOKEN_INVALID', 'La verificación de identidad no es válida. Vuelve a empezar.');

    const consent = await this.d.db.consentDocument.findFirstOrThrow({ orderBy: { publishedAt: 'desc' } });
    if (input.consentVersion !== consent.version) {
      throw businessRule('CONSENT_OUTDATED', 'El texto de tratamiento de datos cambió. Léelo y acéptalo de nuevo.');
    }

    const email = normalizeEmail(input.email);
    const issues = passwordIssues(input.password, { documentNumber: identity.documentNumber, email });
    if (issues.length) {
      throw businessRule('WEAK_PASSWORD', issues[0]!, { details: issues.map((issue) => ({ field: 'password', issue })) });
    }

    const names =
      identity.identityStatus === 'VERIFIED'
        ? { firstNames: identity.firstNames!, paternalSurname: identity.paternalSurname!, maternalSurname: identity.maternalSurname! }
        : input.manualNames;
    if (!names) throw validationError('Escribe tus nombres y apellidos.', [{ field: 'manualNames', issue: 'obligatorio' }]);

    const passwordHash = await this.d.hasher.hash(input.password);
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const now = this.d.clock.now();

    try {
      const result = await this.d.db.$transaction(async (tx) => {
        const user = await tx.user.create({ data: { email, passwordHash, type: 'APPLICANT', status: 'PENDING_EMAIL' } });
        const applicantCode = applicantCodeFromSequence(await nextCounterValue(tx, 'applicant_code', 2_700_001));
        const applicant = await tx.applicant.create({
          data: {
            userId: user.id,
            documentType: identity.documentType,
            documentNumber: identity.documentNumber,
            applicantCode,
            firstNames: names.firstNames.trim().toUpperCase(),
            paternalSurname: names.paternalSurname.trim().toUpperCase(),
            maternalSurname: names.maternalSurname.trim().toUpperCase(),
            birthDate: identity.birthDate ? new Date(`${identity.birthDate}T00:00:00Z`) : null,
            phone: input.phone,
            identityStatus: identity.identityStatus,
          },
        });
        await tx.identityVerification.create({ data: { applicantId: applicant.id, provider: identity.provider, result: identity.providerResult } });
        await tx.consent.create({ data: { userId: user.id, version: consent.version, textHash: consent.textHash } });
        await tx.emailVerificationCode.create({
          data: { userId: user.id, email, codeHmac: this.hmac(`${user.id}:${code}`), expiresAt: new Date(now.getTime() + CODE_TTL_MS), sentAt: now },
        });
        await this.d.access.assignRole(tx, user.id, 'APPLICANT');
        await this.d.audit.record({ actorUserId: user.id, action: 'account.created', resourceType: 'user', resourceId: user.id, after: { identityStatus: identity.identityStatus }, ...meta }, tx);
        await this.d.outbox.publish(tx, 'CodigoVerificacionSolicitado', { userId: user.id, email, code, firstNames: names.firstNames }, meta.requestId);
        return { userId: user.id, applicantCode };
      });
      this.d.outbox.kick();
      return { userId: result.userId, status: 'PENDING_EMAIL', applicantCode: result.applicantCode, maskedEmail: maskEmail(email) };
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }
  }

  // ── H2: verificar correo ───────────────────────────────────────────────
  async verifyEmail(emailInput: string, code: string, meta: RequestMeta): Promise<void> {
    const email = normalizeEmail(emailInput);
    const record = await this.d.db.emailVerificationCode.findFirst({
      where: { email, consumedAt: null },
      orderBy: { sentAt: 'desc' },
      include: { user: true },
    });
    const now = this.d.clock.now();
    if (!record || record.expiresAt.getTime() < now.getTime()) {
      throw businessRule('CODE_EXPIRED', 'El código venció. Pide uno nuevo.');
    }
    if (record.attempts >= 5) throw businessRule('CODE_LOCKED', 'Superaste los intentos. Pide un código nuevo.');

    const expected = Buffer.from(record.codeHmac, 'hex');
    const given = Buffer.from(this.hmac(`${record.userId}:${code}`), 'hex');
    if (!timingSafeEqual(expected, given)) {
      const attempts = record.attempts + 1;
      await this.d.db.emailVerificationCode.update({ where: { id: record.id }, data: { attempts } });
      if (attempts >= 5) throw businessRule('CODE_LOCKED', 'Superaste los intentos. Pide un código nuevo.');
      throw businessRule('CODE_INVALID', `Código incorrecto. Te quedan ${5 - attempts} intentos.`, { attemptsLeft: 5 - attempts });
    }

    const isEmailChange = record.user.email !== email;
    try {
      await this.d.db.$transaction(async (tx) => {
        await tx.emailVerificationCode.update({ where: { id: record.id }, data: { consumedAt: now } });
        await tx.user.update({
          where: { id: record.userId },
          data: isEmailChange
            ? { email, emailVerifiedAt: now, version: { increment: 1 } }
            : { status: record.user.status === 'PENDING_EMAIL' ? 'ACTIVE' : record.user.status, emailVerifiedAt: now, version: { increment: 1 } },
        });
        await this.d.audit.record({ actorUserId: record.userId, action: isEmailChange ? 'profile.email_changed' : 'account.email_verified', resourceType: 'user', resourceId: record.userId, ...meta }, tx);
        if (!isEmailChange && record.user.status === 'PENDING_EMAIL') {
          const applicant = await tx.applicant.findUniqueOrThrow({ where: { userId: record.userId } });
          await this.d.outbox.publish(tx, 'CuentaCreada', { userId: record.userId, email, firstNames: applicant.firstNames, applicantCode: applicant.applicantCode });
        }
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }
    this.d.outbox.kick();
  }

  async resendCode(emailInput: string): Promise<void> {
    const email = normalizeEmail(emailInput);
    const user = await this.d.db.user.findUnique({ where: { email } });
    if (!user || user.status !== 'PENDING_EMAIL') return; // misma respuesta exista o no (anti-enumeración)
    const now = this.d.clock.now();
    const last = await this.d.db.emailVerificationCode.findFirst({ where: { userId: user.id }, orderBy: { sentAt: 'desc' } });
    if (last && now.getTime() - last.sentAt.getTime() < 60_000) {
      const wait = Math.ceil((60_000 - (now.getTime() - last.sentAt.getTime())) / 1000);
      throw tooManyRequests(wait, `Espera ${wait} segundos para pedir otro código.`);
    }
    await this.d.limiter.consume(`resend:${user.id}`, 5, 3600);
    const applicant = await this.d.db.applicant.findUnique({ where: { userId: user.id } });
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.d.db.$transaction(async (tx) => {
      await tx.emailVerificationCode.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: now } });
      await tx.emailVerificationCode.create({
        data: { userId: user.id, email, codeHmac: this.hmac(`${user.id}:${code}`), expiresAt: new Date(now.getTime() + CODE_TTL_MS), sentAt: now },
      });
      await this.d.outbox.publish(tx, 'CodigoVerificacionSolicitado', { userId: user.id, email, code, firstNames: applicant?.firstNames ?? '' });
    });
    this.d.outbox.kick();
  }

  // ── H3: sesión ─────────────────────────────────────────────────────────
  async login(identifier: string, password: string, meta: RequestMeta): Promise<{ token: TokenDto; refreshToken: string }> {
    await this.d.limiter.consume(`login:ip:${meta.ipHash}`, 20, 3600);
    const user = await this.findUserByIdentifier(identifier);
    const now = this.d.clock.now();

    if (!user) {
      this.dummyHash ??= this.d.hasher.hash('cuenta-inexistente-para-igualar-tiempos');
      await this.d.hasher.verify(await this.dummyHash, password);
      throw unauthorized('INVALID_CREDENTIALS', 'Documento, correo o contraseña incorrectos.');
    }
    if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
      throw locked('ACCOUNT_LOCKED', 'Tu cuenta está bloqueada temporalmente por intentos fallidos.', { lockedUntil: user.lockedUntil.toISOString() });
    }
    if (user.status === 'SUSPENDED' || user.status === 'DISABLED') {
      throw forbidden('Tu cuenta no está habilitada. Comunícate con la Dirección de Admisión.');
    }
    // El personal entra solo por el ingreso del panel, que exige segundo factor (ADR-018).
    if (user.type === 'STAFF') throw unauthorized('INVALID_CREDENTIALS', 'Documento, correo o contraseña incorrectos.');

    if (!(await this.d.hasher.verify(user.passwordHash, password))) {
      const next = registerLoginFailure(user, now);
      await this.d.db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { failedLoginCount: next.failedLoginCount, failedLoginSince: next.failedLoginSince, ...(next.lockUntil ? { lockedUntil: next.lockUntil } : {}) },
        });
        await this.d.audit.record({ actorUserId: user.id, action: next.lockUntil ? 'auth.locked' : 'auth.login_failed', resourceType: 'user', resourceId: user.id, ...meta }, tx);
        if (next.lockUntil) await this.d.outbox.publish(tx, 'CuentaBloqueada', { userId: user.id, email: user.email, lockedUntil: next.lockUntil.toISOString() });
      });
      if (next.lockUntil) {
        this.d.outbox.kick();
        throw locked('ACCOUNT_LOCKED', 'Superaste los 5 intentos. Tu cuenta quedó bloqueada 15 minutos.', { lockedUntil: next.lockUntil.toISOString() });
      }
      throw unauthorized('INVALID_CREDENTIALS', 'Documento, correo o contraseña incorrectos.');
    }

    await this.d.db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, failedLoginSince: null, lockedUntil: null, lastLoginAt: now } });
    await this.d.audit.record({ actorUserId: user.id, action: 'auth.login', resourceType: 'user', resourceId: user.id, ...meta });
    const session = await this.d.sessions.create(user.id, user.type, { userAgent: meta.userAgent, ipHash: meta.ipHash });
    return { token: await this.accessTokenFor(user.id, session.sessionId), refreshToken: session.refreshToken };
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<{ token: TokenDto; refreshToken: string }> {
    const rotated = await this.d.sessions.rotate(refreshToken, null, { userAgent: meta.userAgent, ipHash: meta.ipHash });
    const user = await this.d.db.user.findUnique({ where: { id: rotated.userId } });
    if (!user || user.status === 'SUSPENDED' || user.status === 'DISABLED') {
      await this.d.sessions.revokeAll(rotated.userId, 'SUSPENDED');
      throw unauthorized('SESSION_REVOKED', 'Tu cuenta no está habilitada.');
    }
    return { token: await this.accessTokenFor(user.id, rotated.sessionId), refreshToken: rotated.refreshToken };
  }

  async logout(refreshToken: string | undefined, meta: RequestMeta): Promise<void> {
    if (!refreshToken) return;
    const userId = await this.d.sessions.revoke(refreshToken);
    if (userId) await this.d.audit.record({ actorUserId: userId, action: 'auth.logout', resourceType: 'user', resourceId: userId, ...meta });
  }

  async logoutAll(userId: string, meta: RequestMeta): Promise<void> {
    await this.d.sessions.revokeAll(userId, 'LOGOUT_ALL');
    await this.d.audit.record({ actorUserId: userId, action: 'sessions.revoked_all', resourceType: 'user', resourceId: userId, ...meta });
  }

  // ── H4: recuperar contraseña ──────────────────────────────────────────
  async forgotPassword(identifier: string, meta: RequestMeta): Promise<void> {
    await this.d.limiter.consume(`forgot:ip:${meta.ipHash}`, 5, 3600);
    const user = await this.findUserByIdentifier(identifier);
    if (!user || user.status === 'DISABLED') return; // respuesta idéntica (escenario 4.1)
    const token = randomBytes(32).toString('base64url');
    const now = this.d.clock.now();
    await this.d.db.$transaction(async (tx) => {
      await tx.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(now.getTime() + RESET_TTL_MS) } });
      await this.d.audit.record({ actorUserId: user.id, action: 'auth.password_reset_requested', resourceType: 'user', resourceId: user.id, ...meta }, tx);
      await this.d.outbox.publish(tx, 'RecuperacionSolicitada', {
        userId: user.id, email: user.email, resetUrl: `${this.d.frontendOrigin}/restablecer?token=${token}`,
      });
    });
    this.d.outbox.kick();
  }

  async resetPassword(token: string, newPassword: string, meta: RequestMeta): Promise<void> {
    const now = this.d.clock.now();
    const record = await this.d.db.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) }, include: { user: { include: { applicant: true } } } });
    if (!record || record.usedAt || record.expiresAt.getTime() < now.getTime()) {
      throw businessRule('TOKEN_INVALID_OR_EXPIRED', 'El enlace no es válido o ya venció. Solicita uno nuevo.');
    }
    const issues = passwordIssues(newPassword, { documentNumber: record.user.applicant?.documentNumber, email: record.user.email });
    if (issues.length) throw businessRule('WEAK_PASSWORD', issues[0]!, { details: issues.map((issue) => ({ field: 'newPassword', issue })) });

    const passwordHash = await this.d.hasher.hash(newPassword);
    await this.d.db.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: now } });
      if (claimed.count === 0) throw businessRule('TOKEN_INVALID_OR_EXPIRED', 'El enlace ya fue usado.');
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash, failedLoginCount: 0, failedLoginSince: null, lockedUntil: null, version: { increment: 1 } },
      });
      await this.d.sessions.revokeAll(record.userId, 'PASSWORD_CHANGED', tx);
      await this.d.audit.record({ actorUserId: record.userId, action: 'auth.password_reset', resourceType: 'user', resourceId: record.userId, ...meta }, tx);
      await this.d.outbox.publish(tx, 'ContrasenaCambiada', { userId: record.userId, email: record.user.email });
    });
    this.d.outbox.kick();
  }

  // ── auxiliares ────────────────────────────────────────────────────────
  private async accessTokenFor(userId: string, sessionId: string): Promise<TokenDto> {
    const user = await this.d.db.user.findUniqueOrThrow({ where: { id: userId } });
    const roles = await this.d.access.rolesOf(userId);
    const accessToken = await this.d.tokens.signAccess({ sub: userId, sid: sessionId, typ: user.type, roles });
    return { accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS, user: { id: userId, type: user.type, status: user.status, roles } };
  }

  private async findUserByIdentifier(identifier: string) {
    const value = identifier.trim();
    if (value.includes('@')) return this.d.db.user.findUnique({ where: { email: normalizeEmail(value) } });
    const applicant = await this.d.db.applicant.findFirst({
      where: { documentNumber: value.toUpperCase() },
      include: { user: true },
    });
    return applicant?.user ?? null;
  }

  private mapUniqueViolation(error: unknown): unknown {
    const e = error as { code?: string; meta?: { target?: unknown; driverAdapterError?: { cause?: { constraint?: { fields?: string[] } } } } };
    if (e?.code !== 'P2002') return error;
    const fields = JSON.stringify(e.meta ?? {});
    if (fields.includes('email')) return conflict('EMAIL_ALREADY_USED', 'Ese correo ya está registrado en otra cuenta.');
    return conflict('DOCUMENT_ALREADY_REGISTERED', 'Este documento ya tiene una cuenta. Si es tuya, recupera tu contraseña.');
  }
}
