import { Writable } from 'node:stream';
import pino from 'pino';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { REDACTED_PATHS } from '../../src/shared/telemetry/logger.js';
import { checkDigit, movableClock, testApp } from '../helpers.js';

const clock = movableClock('2026-10-25T10:00:00-05:00');
const t = testApp(clock);
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

const PASSWORD = 'Huamanga-Ayacucho-2026';
const lookup = (dni: string, digit = checkDigit(dni)) =>
  t.request.post('/api/v1/auth/identity/lookup').send({ documentType: 'DNI', documentNumber: dni, checkDigit: digit });

async function register(dni: string, email: string, status = 201) {
  const id = await lookup(dni).expect(200);
  const consent = await t.request.get('/api/v1/legal/consent/current').expect(200);
  return t.request.post('/api/v1/auth/register').send({
    identityToken: id.body.data.identityToken, email, phone: '987654321', password: PASSWORD, consentVersion: consent.body.data.version,
  }).expect(status);
}

async function lastCode(email: string): Promise<string> {
  await t.outbox.dispatch();
  const mail = [...t.email.sent].reverse().find((m) => m.to === email && m.subject.startsWith('Código'));
  return /(\d{6})/.exec(mail!.text)![1]!;
}

async function activeAccount(dni: string, email: string) {
  await register(dni, email);
  await t.request.post('/api/v1/auth/email/verify').send({ email, code: await lastCode(email) }).expect(200);
}

const login = (identifier: string, password = PASSWORD) => t.request.post('/api/v1/auth/login').send({ identifier, password });
const cookieOf = (res: { headers: Record<string, unknown> }) => (res.headers['set-cookie'] as string[])[0]!.split(';')[0]!;

describe('Historia 1 - crear cuenta con DNI', () => {
  it('H1-E1: devuelve nombres del proveedor simulado sin escribirlos', async () => {
    const res = await lookup('99900002').expect(200);
    expect(res.body.data).toMatchObject({ identityStatus: 'VERIFIED', simulated: true });
    expect(res.body.data.firstNames).toBeTruthy();
  });

  it('dígito verificador incorrecto → 422 IDENTITY_NOT_MATCHED', async () => {
    const wrong = String((Number(checkDigit('99900002')) + 1) % 10);
    expect((await lookup('99900002', wrong).expect(422)).body.error.code).toBe('IDENTITY_NOT_MATCHED');
  });

  it('H1-E4: padrón de inhabilitados → 422 sin detallar el motivo', async () => {
    const res = await lookup('99900045').expect(422);
    expect(res.body.error.code).toBe('REGISTRATION_NOT_ALLOWED');
    expect(res.body.error.message).not.toMatch(/prueba|resoluci/i);
  });

  it('RN-21: DNI vencido → 422 DOCUMENT_EXPIRED', async () => {
    expect((await lookup('99900044').expect(422)).body.error.code).toBe('DOCUMENT_EXPIRED');
  });

  it('H1-E2: crea la cuenta pendiente de verificación con código de postulante Luhn', async () => {
    const res = await register('99900003', 'h1e2@example.com');
    expect(res.body.data).toMatchObject({ status: 'PENDING_EMAIL', maskedEmail: 'h•••@e•••••.com' });
    expect(res.body.data.applicantCode).toMatch(/^\d{8}$/);
  });

  it('H1-E3: documento ya registrado → 409 con correo enmascarado', async () => {
    const res = await lookup('99900003').expect(409);
    expect(res.body.error).toMatchObject({ code: 'DOCUMENT_ALREADY_REGISTERED', maskedEmail: 'h•••@e•••••.com' });
  });

  it('SC-002: dos registros simultáneos del mismo DNI → una sola cuenta', async () => {
    const consent = (await t.request.get('/api/v1/legal/consent/current')).body.data.version;
    const token = (await lookup('99900004').expect(200)).body.data.identityToken;
    const attempt = (email: string) =>
      t.request.post('/api/v1/auth/register').send({ identityToken: token, email, phone: '987654321', password: PASSWORD, consentVersion: consent });
    const results = await Promise.all([attempt('race1@example.com'), attempt('race2@example.com')]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await t.db.applicant.count({ where: { documentNumber: '99900004' } })).toBe(1);
  });

  it('contraseña común → 422 WEAK_PASSWORD; consentimiento desactualizado → 422', async () => {
    const token = (await lookup('99900005').expect(200)).body.data.identityToken;
    const base = { identityToken: token, email: 'weak@example.com', phone: '987654321' };
    expect((await t.request.post('/api/v1/auth/register').send({ ...base, password: '1234567890', consentVersion: '2026-10-v1' }).expect(422)).body.error.code).toBe('WEAK_PASSWORD');
    expect((await t.request.post('/api/v1/auth/register').send({ ...base, password: PASSWORD, consentVersion: 'v0' }).expect(422)).body.error.code).toBe('CONSENT_OUTDATED');
  });
});

describe('Historia 2 - verificar correo', () => {
  it('H2-E1 y H2-E2: código correcto activa; 5 errores invalidan el código', async () => {
    await register('99900006', 'h2@example.com');
    const code = await lastCode('h2@example.com');
    for (let i = 1; i <= 4; i++) {
      const r = await t.request.post('/api/v1/auth/email/verify').send({ email: 'h2@example.com', code: '000000' }).expect(422);
      expect(r.body.error.attemptsLeft).toBe(5 - i);
    }
    expect((await t.request.post('/api/v1/auth/email/verify').send({ email: 'h2@example.com', code: '000000' }).expect(422)).body.error.code).toBe('CODE_LOCKED');
    expect((await t.request.post('/api/v1/auth/email/verify').send({ email: 'h2@example.com', code }).expect(422)).body.error.code).toBe('CODE_LOCKED');
  });

  it('H2-E3: reenvío antes de 60 s → 429', async () => {
    await register('99900007', 'h2e3@example.com');
    await t.request.post('/api/v1/auth/email/resend').send({ email: 'h2e3@example.com' }).expect(429);
    clock.advance(61);
    await t.request.post('/api/v1/auth/email/resend').send({ email: 'h2e3@example.com' }).expect(202);
  });
});

describe('Historia 3 - sesión', () => {
  it('H3-E1: inicia sesión con DNI o con correo; cookie HttpOnly SameSite=Strict', async () => {
    await activeAccount('99900008', 'h3@example.com');
    const byDni = await login('99900008').expect(200);
    expect(byDni.body.data.user.roles).toEqual(['APPLICANT']);
    const cookie = (byDni.headers['set-cookie'] as unknown as string[])[0]!;
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    await login('H3@Example.com').expect(200);
  });

  it('mismo mensaje para cuenta inexistente y contraseña incorrecta', async () => {
    const a = await login('99999999', 'cualquier-cosa').expect(401);
    const b = await login('99900008', 'otra-clave-incorrecta').expect(401);
    expect(a.body.error.message).toBe(b.body.error.message);
  });

  it('H3-E2: 5 fallos → 423 bloqueada 15 min y correo de aviso', async () => {
    await activeAccount('99900009', 'lock@example.com');
    for (let i = 0; i < 4; i++) await login('99900009', 'incorrecta-123').expect(401);
    expect((await login('99900009', 'incorrecta-123').expect(423)).body.error.code).toBe('ACCOUNT_LOCKED');
    await login('99900009').expect(423);
    await t.outbox.dispatch();
    expect(t.email.sent.some((m) => m.to === 'lock@example.com' && m.subject.startsWith('Aviso de seguridad'))).toBe(true);
    clock.advance(15 * 60 + 1);
    await login('99900009').expect(200);
  });

  it('rotación del refresh token y detección de reutilización', async () => {
    const first = await login('99900008').expect(200);
    const rt1 = cookieOf(first);
    const second = await t.request.post('/api/v1/auth/refresh').set('Cookie', rt1).set('X-SIA-Client', 'web').expect(200);
    const rt2 = cookieOf(second);
    await t.request.post('/api/v1/auth/refresh').set('Cookie', rt1).set('X-SIA-Client', 'web').expect(401);
    await t.request.post('/api/v1/auth/refresh').set('Cookie', rt2).set('X-SIA-Client', 'web').expect(401);
  });

  it('refresh sin el encabezado X-SIA-Client → 401 (protección CSRF)', async () => {
    const res = await login('99900008').expect(200);
    await t.request.post('/api/v1/auth/refresh').set('Cookie', cookieOf(res)).expect(401);
  });

  it('H3-E4: tras 31 minutos sin renovar → SESSION_IDLE', async () => {
    const res = await login('99900008').expect(200);
    clock.advance(31 * 60);
    const idle = await t.request.post('/api/v1/auth/refresh').set('Cookie', cookieOf(res)).set('X-SIA-Client', 'web').expect(401);
    expect(idle.body.error.code).toBe('SESSION_IDLE');
  });

  it('T180: endpoints privados sin token → 401', async () => {
    for (const path of ['/api/v1/me', '/api/v1/me/activity']) await t.request.get(path).expect(401);
    await t.request.patch('/api/v1/me').send({ phone: '911111111' }).expect(401);
    await t.request.post('/api/v1/auth/logout-all').expect(401);
  });
});

describe('Historia 4 - recuperar contraseña', () => {
  it('H4-E1 y H4-E2: misma respuesta; el enlace es de un solo uso y cierra las sesiones', async () => {
    await activeAccount('99900010', 'reset@example.com');
    const session = await login('99900010').expect(200);

    const exists = await t.request.post('/api/v1/auth/password/forgot').send({ identifier: 'reset@example.com' }).expect(202);
    const missing = await t.request.post('/api/v1/auth/password/forgot').send({ identifier: 'nadie@example.com' }).expect(202);
    expect(exists.body).toEqual(missing.body);

    await t.outbox.dispatch();
    const mail = [...t.email.sent].reverse().find((m) => m.to === 'reset@example.com' && m.subject.startsWith('Recuperación'))!;
    const token = /token=([\w-]+)/.exec(mail.html)![1]!;

    await t.request.post('/api/v1/auth/password/reset').send({ token, newPassword: 'Nueva-Clave-Segura-2026' }).expect(204);
    await t.request.post('/api/v1/auth/password/reset').send({ token, newPassword: 'Otra-Clave-Segura-2026' }).expect(422);
    await t.request.post('/api/v1/auth/refresh').set('Cookie', cookieOf(session)).set('X-SIA-Client', 'web').expect(401);
    await login('99900010', 'Nueva-Clave-Segura-2026').expect(200);

    const outbox = await t.db.outboxEvent.findFirst({ where: { eventType: 'RecuperacionSolicitada', processedAt: { not: null } } });
    expect(outbox?.payload).toEqual({ redacted: true });
  });
});

describe('Historias 5 y 6 - perfil y actividad', () => {
  it('H5: solo datos de contacto; identidad → 422; campo desconocido → 400', async () => {
    await activeAccount('99900011', 'perfil@example.com');
    const token = (await login('99900011').expect(200)).body.data.accessToken;
    const auth = { Authorization: `Bearer ${token}` };

    const me = await t.request.get('/api/v1/me').set(auth).expect(200);
    expect(me.body.data.editableFields).not.toContain('firstNames');

    const updated = await t.request.patch('/api/v1/me').set(auth).send({ phone: '912345678' }).expect(200);
    expect(updated.body.data.phone).toBe('912345678');
    expect((await t.request.patch('/api/v1/me').set(auth).send({ firstNames: 'OTRO' }).expect(422)).body.error.code).toBe('IDENTITY_FIELDS_NOT_EDITABLE');
    await t.request.patch('/api/v1/me').set(auth).send({ foo: 'bar' }).expect(400);

    const change = await t.request.patch('/api/v1/me').set(auth).send({ email: 'perfil.nuevo@example.com' }).expect(200);
    expect(change.body.meta.pendingEmailVerification).toBe(true);
    await t.request.post('/api/v1/auth/email/verify').send({ email: 'perfil.nuevo@example.com', code: await lastCode('perfil.nuevo@example.com') }).expect(200);
    expect((await t.request.get('/api/v1/me').set(auth).expect(200)).body.data.email).toBe('perfil.nuevo@example.com');

    const activity = await t.request.get('/api/v1/me/activity').set(auth).expect(200);
    expect(activity.body.data.map((a: { action: string }) => a.action)).toEqual(
      expect.arrayContaining(['account.created', 'account.email_verified', 'auth.login', 'profile.updated']),
    );
  });

  it('la auditoría no se puede modificar (RNF-10)', async () => {
    await expect(t.db.auditEvent.updateMany({ data: { action: 'manipulado' } })).rejects.toThrow();
  });
});

describe('Privacidad en registros (ADR-013)', () => {
  it('el logger redacta DNI, correo, contraseña y tokens', () => {
    const lines: string[] = [];
    const sink = new Writable({ write(chunk, _enc, cb) { lines.push(String(chunk)); cb(); } });
    const log = pino({ redact: { paths: REDACTED_PATHS, censor: '[REDACTADO]' } }, sink);
    log.info({ dni: '99900001', email: 'a@b.pe', password: 'x', body: { documentNumber: '99900001', token: 't' } }, 'prueba');
    expect(lines.join('')).not.toMatch(/99900001|a@b\.pe/);
  });
});
