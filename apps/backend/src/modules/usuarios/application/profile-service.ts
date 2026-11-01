import { createHmac, randomInt } from 'node:crypto';
import type { ActivityDto, ProfileDto, UpdateProfileRequestDto } from '@sia/contracts';
import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db } from '../../../shared/db/prisma.js';
import type { Outbox } from '../../../shared/events/outbox.js';
import { businessRule, conflict, notFound } from '../../../shared/http/errors.js';
import { EDITABLE_FIELDS, IDENTITY_FIELDS, normalizeEmail } from '../domain/account-rules.js';

const ACTIONS: Record<string, string> = {
  'account.created': 'Creaste tu cuenta',
  'account.email_verified': 'Verificaste tu correo',
  'auth.login': 'Iniciaste sesión',
  'auth.login_failed': 'Intento de inicio de sesión con contraseña incorrecta',
  'auth.locked': 'Tu cuenta se bloqueó temporalmente por intentos fallidos',
  'auth.logout': 'Cerraste sesión',
  'auth.password_reset_requested': 'Solicitaste recuperar tu contraseña',
  'auth.password_reset': 'Cambiaste tu contraseña',
  'sessions.revoked_all': 'Cerraste todas tus sesiones',
  'profile.updated': 'Actualizaste tus datos de contacto',
  'profile.email_change_requested': 'Solicitaste cambiar tu correo',
  'profile.email_changed': 'Confirmaste tu nuevo correo',
};

const describeDevice = (ua: string | null) =>
  !ua ? '' : /mobile|android|iphone/i.test(ua) ? ' desde un celular' : ' desde una computadora';

/** Spec 002, Historias 5 y 6. */
export class ProfileService {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
    private readonly audit: AuditLog,
    private readonly outbox: Outbox,
    private readonly hmacSecret: string,
    private readonly identitySimulated: boolean,
  ) {}

  async get(userId: string): Promise<ProfileDto> {
    const user = await this.db.user.findUnique({ where: { id: userId }, include: { applicant: true } });
    if (!user?.applicant) throw notFound('Perfil no encontrado.');
    const a = user.applicant;
    return {
      applicantCode: a.applicantCode,
      documentType: a.documentType,
      documentNumber: a.documentNumber,
      firstNames: a.firstNames,
      paternalSurname: a.paternalSurname,
      maternalSurname: a.maternalSurname,
      birthDate: a.birthDate ? a.birthDate.toISOString().slice(0, 10) : null,
      identityStatus: a.identityStatus,
      identitySimulated: this.identitySimulated,
      email: user.email,
      phone: a.phone,
      ubigeo: a.ubigeo,
      addressLine: a.addressLine,
      guardianName: a.guardianName,
      editableFields: EDITABLE_FIELDS,
    };
  }

  /** FR-011: solo datos de contacto; el cambio de correo se aplica al verificar el código. */
  async update(userId: string, body: Record<string, unknown>, input: UpdateProfileRequestDto, meta: RequestMeta) {
    const forbiddenFields = Object.keys(body).filter((k) => IDENTITY_FIELDS.includes(k));
    if (forbiddenFields.length) {
      throw businessRule('IDENTITY_FIELDS_NOT_EDITABLE', 'Tus nombres y documento provienen del registro de identidad. Para corregirlos, presenta una solicitud a la Dirección de Admisión.', { fields: forbiddenFields });
    }
    const user = await this.db.user.findUnique({ where: { id: userId }, include: { applicant: true } });
    if (!user?.applicant) throw notFound('Perfil no encontrado.');

    const changed = Object.keys(input).filter((k) => k !== 'email');
    const newEmail = input.email ? normalizeEmail(input.email) : null;
    const emailChange = newEmail && newEmail !== user.email ? newEmail : null;
    if (emailChange && (await this.db.user.findUnique({ where: { email: emailChange } }))) {
      throw conflict('EMAIL_ALREADY_USED', 'Ese correo ya está registrado en otra cuenta.');
    }

    await this.db.$transaction(async (tx) => {
      if (changed.length) {
        await tx.applicant.update({
          where: { userId },
          data: {
            ...(input.phone !== undefined ? { phone: input.phone } : {}),
            ...(input.ubigeo !== undefined ? { ubigeo: input.ubigeo } : {}),
            ...(input.addressLine !== undefined ? { addressLine: input.addressLine } : {}),
            ...(input.guardianName !== undefined ? { guardianName: input.guardianName } : {}),
          },
        });
        await this.audit.record({ actorUserId: userId, action: 'profile.updated', resourceType: 'applicant', resourceId: user.applicant!.id, after: { fields: changed }, ...meta }, tx);
      }
      if (emailChange) {
        const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
        const now = this.clock.now();
        await tx.emailVerificationCode.create({
          data: {
            userId, email: emailChange,
            codeHmac: createHmac('sha256', this.hmacSecret).update(`${userId}:${code}`).digest('hex'),
            expiresAt: new Date(now.getTime() + 15 * 60_000),
            sentAt: now,
          },
        });
        await this.audit.record({ actorUserId: userId, action: 'profile.email_change_requested', resourceType: 'user', resourceId: userId, ...meta }, tx);
        await this.outbox.publish(tx, 'CodigoVerificacionSolicitado', { userId, email: emailChange, code, firstNames: user.applicant!.firstNames });
      }
    });
    if (emailChange) this.outbox.kick();
    return { profile: await this.get(userId), pendingEmailVerification: Boolean(emailChange) };
  }

  async activity(userId: string, page: number): Promise<ActivityDto[]> {
    const events = await this.db.auditEvent.findMany({
      where: { actorUserId: userId },
      orderBy: { occurredAt: 'desc' },
      skip: (page - 1) * 20,
      take: 20,
    });
    return events.map((e) => ({
      occurredAt: e.occurredAt.toISOString(),
      action: e.action,
      description: `${ACTIONS[e.action] ?? e.action}${e.action === 'auth.login' ? describeDevice(e.userAgent) : ''}`,
    }));
  }
}
