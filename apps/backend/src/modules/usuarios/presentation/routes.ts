import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import { unauthorized } from '../../../shared/http/errors.js';
import { handle } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import { SESSION_TTL, type Permission } from '../../seguridad/index.js';
import type { StaffAdmin } from '../application/staff-admin.js';
import type { StaffAuthService } from '../application/staff-auth-service.js';
import type { AuthService } from '../application/auth-service.js';
import { IDENTITY_FIELDS } from '../domain/account-rules.js';
import type { ProfileService } from '../application/profile-service.js';

const phone = z.string().regex(/^9\d{8}$/, 'Debe ser un celular de 9 dígitos que empiece con 9');

const lookupSchema = z.object({
  documentType: z.enum(['DNI', 'CE', 'PASAPORTE']),
  documentNumber: z.string().trim().min(6).max(12),
  checkDigit: z.string().trim().regex(/^[0-9A-K]$/i, 'Un dígito o letra').optional(),
});

const registerSchema = z.object({
  identityToken: z.string().min(20),
  manualNames: z
    .object({
      firstNames: z.string().trim().min(2).max(80),
      paternalSurname: z.string().trim().min(2).max(80),
      maternalSurname: z.string().trim().min(1).max(80),
    })
    .optional(),
  email: z.email().max(160),
  phone,
  password: z.string().min(10, 'Debe tener al menos 10 caracteres').max(128),
  consentVersion: z.string().min(1),
});

const profileSchema = z
  .strictObject({
    phone: phone.optional(),
    ubigeo: z.string().regex(/^\d{6}$/, 'Código de 6 dígitos').optional(),
    addressLine: z.string().trim().max(200).optional(),
    guardianName: z.string().trim().max(160).optional(),
    email: z.email().max(160).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Envía al menos un campo');

/** Protección CSRF de las rutas que usan la cookie (research R-05 de 002). */
const requireClientHeader: RequestHandler = (req, _res, next) => {
  if (req.get('X-SIA-Client') !== 'web') return next(unauthorized('CLIENT_HEADER_REQUIRED', 'Solicitud no permitida.'));
  next();
};

export interface StaffRouteDeps {
  auth: StaffAuthService;
  admin: StaffAdmin;
  guard: (permission: Permission) => RequestHandler;
}

export function usuariosRoutes(
  auth: AuthService, profile: ProfileService, authenticate: RequestHandler, cookieSecure: boolean, staff?: StaffRouteDeps,
  inscriptionsOf?: (documentType: string, documentNumber: string) => Promise<unknown[]>,
): Router {
  const router = Router();
  // El prefijo __Host- exige HTTPS; en local (http) se usa un nombre simple.
  const cookieName = cookieSecure ? '__Host-sia_rt' : 'sia_rt';
  const cookieOptions = (maxAgeSeconds: number): CookieOptions => ({
    httpOnly: true, secure: cookieSecure, sameSite: 'strict', path: '/', maxAge: maxAgeSeconds * 1000,
  });
  const meta = (req: Request): RequestMeta => ({ requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null });
  const sendSession = (res: Response, result: Awaited<ReturnType<AuthService['login']>> & { recoveryCodes?: string[] }) => {
    res.cookie(cookieName, result.refreshToken, cookieOptions(SESSION_TTL[result.token.user.type]));
    res.json({ data: { ...result.token, ...(result.recoveryCodes ? { recoveryCodes: result.recoveryCodes } : {}) } });
  };
  const readCookie = (req: Request): string | undefined => (req.cookies as Record<string, string> | undefined)?.[cookieName];

  router.get('/legal/consent/current', handle(async (_req, res) => {
    res.json({ data: await auth.currentConsent() });
  }));

  router.post('/auth/identity/lookup', handle(async (req, res) => {
    res.json({ data: await auth.lookupIdentity(parse(lookupSchema, req.body), meta(req)) });
  }));

  router.post('/auth/register', handle(async (req, res) => {
    res.status(201).json({ data: await auth.register(parse(registerSchema, req.body), meta(req)) });
  }));

  router.post('/auth/email/verify', handle(async (req, res) => {
    const { email, code } = parse(z.object({ email: z.email(), code: z.string().regex(/^\d{6}$/, '6 dígitos') }), req.body);
    await auth.verifyEmail(email, code, meta(req));
    res.json({ data: { verified: true } });
  }));

  router.post('/auth/email/resend', handle(async (req, res) => {
    const { email } = parse(z.object({ email: z.email() }), req.body);
    await auth.resendCode(email);
    res.status(202).json({ data: { message: 'Si la cuenta está pendiente de verificación, te enviamos un código nuevo.' } });
  }));

  router.post('/auth/login', handle(async (req, res) => {
    const { identifier, password } = parse(z.object({ identifier: z.string().trim().min(3).max(160), password: z.string().min(1).max(128) }), req.body);
    sendSession(res, await auth.login(identifier, password, meta(req)));
  }));

  router.post('/auth/refresh', requireClientHeader, handle(async (req, res) => {
    const token = readCookie(req);
    if (!token) throw unauthorized('SESSION_EXPIRED', 'Inicia sesión.');
    try {
      sendSession(res, await auth.refresh(token, meta(req)));
    } catch (error) {
      res.clearCookie(cookieName, { path: '/' });
      throw error;
    }
  }));

  router.post('/auth/logout', requireClientHeader, handle(async (req, res) => {
    await auth.logout(readCookie(req), meta(req));
    res.clearCookie(cookieName, { path: '/' });
    res.status(204).end();
  }));

  router.post('/auth/logout-all', authenticate, handle(async (req, res) => {
    await auth.logoutAll(req.principal!.userId, meta(req));
    res.clearCookie(cookieName, { path: '/' });
    res.status(204).end();
  }));

  router.post('/auth/password/forgot', handle(async (req, res) => {
    const { identifier } = parse(z.object({ identifier: z.string().trim().min(3).max(160) }), req.body);
    await auth.forgotPassword(identifier, meta(req));
    res.status(202).json({ data: { message: 'Si existe una cuenta con esos datos, te enviamos un enlace para restablecer tu contraseña.' } });
  }));

  router.post('/auth/password/reset', handle(async (req, res) => {
    const { token, newPassword } = parse(z.object({ token: z.string().min(20).max(200), newPassword: z.string().min(10, 'Debe tener al menos 10 caracteres').max(128) }), req.body);
    await auth.resetPassword(token, newPassword, meta(req));
    res.status(204).end();
  }));

  router.get('/me', authenticate, handle(async (req, res) => {
    res.json({ data: await profile.get(req.principal!.userId) });
  }));

  router.patch('/me', authenticate, handle(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    // Campos de identidad → 422 en el caso de uso; cualquier otro campo desconocido → 400 aquí.
    const touchesIdentity = Object.keys(body).some((k) => IDENTITY_FIELDS.includes(k));
    const input = touchesIdentity ? {} : parse(profileSchema, body);
    const result = await profile.update(req.principal!.userId, body, input, meta(req));
    res.json({ data: result.profile, meta: { pendingEmailVerification: result.pendingEmailVerification } });
  }));

  // Cuenta opcional (enmienda de ADR-015): las inscripciones del mismo documento, sin pedir el código.
  router.get('/me/inscriptions', authenticate, handle(async (req, res) => {
    if (req.principal!.type !== 'APPLICANT' || !inscriptionsOf) { res.json({ data: [] }); return; }
    const me = await profile.get(req.principal!.userId);
    res.json({ data: await inscriptionsOf(me.documentType, me.documentNumber) });
  }));

  router.get('/me/sessions', authenticate, handle(async (req, res) => {
    res.json({ data: await auth.listSessions(req.principal!.userId, req.principal!.sessionId) });
  }));
  router.delete('/me/sessions/:id', authenticate, handle(async (req, res) => {
    const { id } = parse(z.object({ id: z.uuid() }), req.params);
    await auth.closeSession(req.principal!.userId, id, meta(req));
    res.status(204).end();
  }));

  router.get('/me/activity', authenticate, handle(async (req, res) => {
    const { page } = parse(z.object({ page: z.coerce.number().int().min(1).default(1) }), req.query);
    res.json({ data: await profile.activity(req.principal!.userId, page) });
  }));

  // ── Personal de Admisión (spec 008, ADR-018) ─────────────────────────
  if (staff) {
    const { auth: staffAuth, admin, guard } = staff;
    const idParam = (req: Request) => parse(z.object({ id: z.uuid() }), req.params).id;

    router.post('/admin/auth/login', handle(async (req, res) => {
      const b = parse(z.object({ email: z.email().max(160), password: z.string().min(1).max(128) }), req.body);
      res.json({ data: await staffAuth.login(b.email, b.password, meta(req)) });
    }));
    router.post('/admin/auth/password', handle(async (req, res) => {
      const b = parse(z.object({ challenge: z.string().min(20), newPassword: z.string().min(10, 'Debe tener al menos 10 caracteres').max(128) }), req.body);
      res.json({ data: await staffAuth.changePassword(b.challenge, b.newPassword, meta(req)) });
    }));
    router.post('/admin/auth/mfa', handle(async (req, res) => {
      const b = parse(z.object({ challenge: z.string().min(20), code: z.string().trim().regex(/^\d{6}$/, 'El código tiene 6 dígitos') }), req.body);
      sendSession(res, await staffAuth.verifyMfa(b.challenge, b.code, meta(req)));
    }));
    router.post('/admin/auth/recovery', handle(async (req, res) => {
      const b = parse(z.object({ challenge: z.string().min(20), code: z.string().trim().min(10).max(16) }), req.body);
      sendSession(res, await staffAuth.verifyRecoveryCode(b.challenge, b.code, meta(req)));
    }));
    router.get('/admin/me/recovery-codes', authenticate, guard('panel.ver'), handle(async (req, res) => {
      res.json({ data: { remaining: await staffAuth.recoveryRemaining(req.principal!.userId) } });
    }));
    router.post('/admin/me/recovery-codes', authenticate, guard('panel.ver'), handle(async (req, res) => {
      const b = parse(z.object({ code: z.string().trim().regex(/^\d{6}$/, 'El código tiene 6 dígitos') }), req.body);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ data: { codes: await staffAuth.regenerateRecoveryCodes(req.principal!.userId, b.code, meta(req)) } });
    }));
    router.get('/admin/me', authenticate, guard('panel.ver'), handle(async (req, res) => {
      res.json({ data: await staffAuth.me(req.principal!.userId) });
    }));

    router.get('/admin/roles', authenticate, guard('usuarios.gestionar'), handle(async (_req, res) => {
      res.json({ data: admin.roles() });
    }));
    router.get('/admin/users', authenticate, guard('usuarios.gestionar'), handle(async (_req, res) => {
      res.json({ data: await admin.list() });
    }));
    router.post('/admin/users', authenticate, guard('usuarios.gestionar'), handle(async (req, res) => {
      const b = parse(z.object({
        email: z.email().max(160), fullName: z.string().trim().min(3).max(120),
        documentNumber: z.string().trim().max(12).optional(), roles: z.array(z.string()).min(1),
      }), req.body);
      res.status(201).json({ data: await admin.create(b, req.principal!.userId, meta(req)) });
    }));
    router.put('/admin/users/:id/roles', authenticate, guard('usuarios.gestionar'), handle(async (req, res) => {
      const b = parse(z.object({ roles: z.array(z.string()).min(1) }), req.body);
      await admin.updateRoles(idParam(req), b.roles, req.principal!.userId, meta(req));
      res.status(204).end();
    }));
    router.post('/admin/users/:id/status', authenticate, guard('usuarios.gestionar'), handle(async (req, res) => {
      const b = parse(z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED']) }), req.body);
      await admin.setStatus(idParam(req), b.status, req.principal!.userId, meta(req));
      res.status(204).end();
    }));
    router.post('/admin/users/:id/reset-mfa', authenticate, guard('usuarios.gestionar'), handle(async (req, res) => {
      await admin.resetMfa(idParam(req), req.principal!.userId, meta(req));
      res.status(204).end();
    }));
    router.post('/admin/users/:id/reset-password', authenticate, guard('usuarios.gestionar'), handle(async (req, res) => {
      res.json({ data: await admin.resetPassword(idParam(req), req.principal!.userId, meta(req)) });
    }));
  }

  return router;
}
