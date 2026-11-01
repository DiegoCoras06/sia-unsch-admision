import { randomInt } from 'node:crypto';
import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Db } from '../../../shared/db/prisma.js';
import { businessRule, conflict, notFound, validationError } from '../../../shared/http/errors.js';
import { STAFF_ROLES, type SessionService } from '../../seguridad/index.js';
import { normalizeEmail } from '../domain/account-rules.js';
import type { PasswordHasher } from '../domain/ports.js';

const ROLE_CODES = new Set(STAFF_ROLES.map((r) => r.code));
// Sin caracteres que se confunden al dictarlos (0/O, 1/l/I).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/** Contraseña temporal de 14 caracteres; se muestra una sola vez al administrador. */
export function temporaryPassword(): string {
  return Array.from({ length: 14 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

/** Usuarios internos (spec 008, Historia 3; RF-13.01 a RF-13.03, RF-13.08). */
export class StaffAdmin {
  constructor(private readonly d: { db: Db; audit: AuditLog; hasher: PasswordHasher; sessions: SessionService }) {}

  async list() {
    const users = await this.d.db.user.findMany({ where: { type: 'STAFF' }, include: { staff: true }, orderBy: { createdAt: 'asc' } });
    const roles = await this.d.db.userRole.findMany({ where: { userId: { in: users.map((u) => u.id) } }, include: { role: true } });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.staff?.fullName ?? '',
      status: u.status,
      roles: roles.filter((r) => r.userId === u.id).map((r) => r.role.code),
      mfaEnabled: Boolean(u.staff?.mfaEnabledAt),
      mustChangePassword: Boolean(u.staff?.mustChangePassword),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    }));
  }

  roles() {
    return STAFF_ROLES.map((r) => ({ code: r.code, name: r.name, permissions: r.permissions }));
  }

  async create(input: { email: string; fullName: string; documentNumber?: string | undefined; roles: string[] }, actor: string, meta: RequestMeta) {
    this.checkRoles(input.roles);
    const email = normalizeEmail(input.email);
    if (await this.d.db.user.findUnique({ where: { email } })) throw conflict('EMAIL_IN_USE', 'Ya existe una cuenta con ese correo.');
    const password = temporaryPassword();
    const passwordHash = await this.d.hasher.hash(password);
    const user = await this.d.db.$transaction(async (tx) => {
      const u = await tx.user.create({ data: { email, passwordHash, type: 'STAFF', status: 'ACTIVE' } });
      await tx.staffProfile.create({ data: { userId: u.id, fullName: input.fullName.trim(), documentNumber: input.documentNumber ?? null, createdBy: actor } });
      await this.setRolesTx(tx, u.id, input.roles);
      await this.d.audit.record({ actorUserId: actor, action: 'staff.created', resourceType: 'user', resourceId: u.id, after: { email, roles: input.roles }, ...meta }, tx);
      return u;
    });
    return { id: user.id, email, temporaryPassword: password };
  }

  async updateRoles(userId: string, roles: string[], actor: string, meta: RequestMeta) {
    this.checkRoles(roles);
    const before = await this.rolesOf(userId);
    if (before.includes('ADMIN') && !roles.includes('ADMIN')) await this.ensureAnotherAdmin(userId);
    await this.d.db.$transaction(async (tx) => {
      await this.setRolesTx(tx, userId, roles);
      await this.d.sessions.revokeAll(userId, 'ROLES_CHANGED', tx);
      await this.d.audit.record({ actorUserId: actor, action: 'staff.roles_changed', resourceType: 'user', resourceId: userId, before: { roles: before }, after: { roles }, ...meta }, tx);
    });
  }

  /** Suspender o desactivar cierra todas las sesiones de inmediato (RF-13.08). */
  async setStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED', actor: string, meta: RequestMeta) {
    const user = await this.staffUser(userId);
    if (status !== 'ACTIVE' && (await this.rolesOf(userId)).includes('ADMIN')) await this.ensureAnotherAdmin(userId);
    await this.d.db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { status } });
      if (status !== 'ACTIVE') await this.d.sessions.revokeAll(userId, status, tx);
      await this.d.audit.record({ actorUserId: actor, action: 'staff.status_changed', resourceType: 'user', resourceId: userId, before: { status: user.status }, after: { status }, ...meta }, tx);
    });
  }

  /** Teléfono perdido: el próximo ingreso vuelve a configurar el segundo factor. */
  async resetMfa(userId: string, actor: string, meta: RequestMeta) {
    await this.staffUser(userId);
    await this.d.db.$transaction(async (tx) => {
      await tx.staffProfile.update({ where: { userId }, data: { mfaSecretEnc: null, mfaEnabledAt: null, mfaLastStep: null } });
      await this.d.sessions.revokeAll(userId, 'MFA_RESET', tx);
      await this.d.audit.record({ actorUserId: actor, action: 'staff.mfa_reset', resourceType: 'user', resourceId: userId, ...meta }, tx);
    });
  }

  async resetPassword(userId: string, actor: string, meta: RequestMeta) {
    await this.staffUser(userId);
    const password = temporaryPassword();
    const passwordHash = await this.d.hasher.hash(password);
    await this.d.db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash, failedLoginCount: 0, lockedUntil: null, version: { increment: 1 } } });
      await tx.staffProfile.update({ where: { userId }, data: { mustChangePassword: true } });
      await this.d.sessions.revokeAll(userId, 'PASSWORD_RESET', tx);
      await this.d.audit.record({ actorUserId: actor, action: 'staff.password_reset', resourceType: 'user', resourceId: userId, ...meta }, tx);
    });
    return { temporaryPassword: password };
  }

  private checkRoles(roles: string[]) {
    if (!roles.length) throw validationError('Asigna al menos un rol.', [{ field: 'roles', issue: 'vacío' }]);
    const bad = roles.filter((r) => !ROLE_CODES.has(r));
    if (bad.length) throw validationError(`Rol desconocido: ${bad.join(', ')}`, [{ field: 'roles', issue: 'desconocido' }]);
  }

  private async staffUser(userId: string) {
    const user = await this.d.db.user.findUnique({ where: { id: userId } });
    if (!user || user.type !== 'STAFF') throw notFound('Usuario interno no encontrado.');
    return user;
  }

  private async rolesOf(userId: string) {
    return (await this.d.db.userRole.findMany({ where: { userId }, include: { role: true } })).map((r) => r.role.code);
  }

  /** El último administrador activo no puede perder el rol ni suspenderse (spec 008, casos límite). */
  private async ensureAnotherAdmin(userId: string) {
    const adminIds = (await this.d.db.userRole.findMany({ where: { role: { code: 'ADMIN' }, userId: { not: userId } } })).map((r) => r.userId);
    const activeAdmins = await this.d.db.user.count({ where: { id: { in: adminIds }, status: 'ACTIVE', type: 'STAFF' } });
    if (!activeAdmins) throw businessRule('LAST_ADMIN', 'Debe quedar al menos un administrador general activo.');
  }

  private async setRolesTx(tx: Parameters<Parameters<Db['$transaction']>[0]>[0], userId: string, roles: string[]) {
    await tx.userRole.deleteMany({ where: { userId } });
    const rows = await tx.role.findMany({ where: { code: { in: roles } } });
    if (rows.length !== roles.length) throw validationError('Algún rol no existe en la base; ejecuta la semilla.', [{ field: 'roles', issue: 'sin sembrar' }]);
    await tx.userRole.createMany({ data: rows.map((r) => ({ userId, roleId: r.id })) });
  }
}
