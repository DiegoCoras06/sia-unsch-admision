// Sesiones activas por dispositivo y aviso de inicio de sesión nuevo.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SecretBox, totpService } from '../../src/modules/seguridad/index.js';
import { deviceLabel } from '../../src/modules/seguridad/domain/session-policy.js';
import { Argon2Hasher } from '../../src/modules/usuarios/infrastructure/argon2-hasher.js';
import { movableClock, testApp } from '../helpers.js';

const clock = movableClock('2026-10-25T10:00:00-05:00');
const t = testApp(clock);
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

const CHROME_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const CHROME_WIN_NUEVO = CHROME_WIN.replace('140.0.0.0', '141.0.0.0');
const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const PASSWORD = 'Sesiones-Seguras-2027';
const box = new SecretBox('staff:test-hmac-secret-test-hmac-secret-test-hmac');
const secrets = new Map<string, string>();

async function makeStaff(email: string) {
  const secret = totpService.newSecret();
  secrets.set(email, secret);
  const user = await t.db.user.create({ data: { email, passwordHash: await new Argon2Hasher().hash(PASSWORD), type: 'STAFF', status: 'ACTIVE' } });
  await t.db.staffProfile.create({ data: { userId: user.id, fullName: 'Prueba sesiones', mustChangePassword: false, mfaSecretEnc: box.seal(secret), mfaEnabledAt: new Date() } });
  await t.db.userRole.create({ data: { userId: user.id, roleId: (await t.db.role.findUniqueOrThrow({ where: { code: 'SOPORTE' } })).id } });
}

async function login(email: string, ua: string) {
  clock.advance(31);
  const step = (await t.request.post('/api/v1/admin/auth/login').set('User-Agent', ua).send({ email, password: PASSWORD }).expect(200)).body.data;
  const res = await t.request.post('/api/v1/admin/auth/mfa').set('User-Agent', ua).send({ challenge: step.challenge, code: totpService.code(secrets.get(email)!, clock.now()) }).expect(200);
  for (let i = 0; i < 50 && (await t.outbox.dispatch()) > 0; i++);
  return { token: res.body.data.accessToken as string, cookie: String(res.headers['set-cookie']?.[0] ?? '').split(';')[0]! };
}
const alerts = (email: string) => t.email.sent.filter((m) => m.to === email && m.subject.startsWith('Nuevo inicio de sesión'));
const as = (token: string) => ({ Authorization: `Bearer ${token}` });

const A = 'sesiones.a@unsch.test';
const B = 'sesiones.b@unsch.test';
beforeAll(async () => { await makeStaff(A); await makeStaff(B); });

describe('Etiqueta del dispositivo', () => {
  it('reconoce navegador y sistema, e ignora la versión', () => {
    expect(deviceLabel(CHROME_WIN)).toBe('Chrome en Windows');
    expect(deviceLabel(CHROME_WIN_NUEVO)).toBe('Chrome en Windows');
    expect(deviceLabel(SAFARI_IPHONE)).toBe('Safari en iPhone');
    expect(deviceLabel('node-superagent/3')).toBeNull();
    expect(deviceLabel(null)).toBeNull();
  });
});

describe('Aviso de inicio de sesión nuevo', () => {
  it('no avisa en el primer ingreso ni al actualizar el navegador; sí desde otro dispositivo', async () => {
    await login(A, CHROME_WIN);
    expect(alerts(A)).toHaveLength(0);
    await login(A, CHROME_WIN_NUEVO);
    expect(alerts(A)).toHaveLength(0);
    await login(A, SAFARI_IPHONE);
    expect(alerts(A)).toHaveLength(1);
    expect(alerts(A)[0]!.html).toContain('Safari en iPhone');
    expect(alerts(A)[0]!.html).toContain('/admin/seguridad');
    await login(A, SAFARI_IPHONE);
    expect(alerts(A)).toHaveLength(1);
  });
});

describe('Sesiones activas', () => {
  it('lista por dispositivo, cierra uno y corta su renovación', async () => {
    const pc = await login(B, CHROME_WIN);
    const phone = await login(B, SAFARI_IPHONE);

    const list = (await t.request.get('/api/v1/me/sessions').set(as(pc.token)).expect(200)).body.data as { id: string; device: string; current: boolean }[];
    expect(list.map((s) => s.device).sort()).toEqual(['Chrome en Windows', 'Safari en iPhone']);
    expect(list.find((s) => s.current)?.device).toBe('Chrome en Windows');

    const other = list.find((s) => !s.current)!;
    await t.request.delete(`/api/v1/me/sessions/${other.id}`).set(as(pc.token)).expect(204);
    await t.request.post('/api/v1/auth/refresh').set('X-SIA-Client', 'web').set('Cookie', phone.cookie).expect(401);
    await t.request.post('/api/v1/auth/refresh').set('X-SIA-Client', 'web').set('Cookie', pc.cookie).expect(200);

    const actions = (await t.db.auditEvent.findMany({ where: { action: 'sessions.revoked_one' } })).length;
    expect(actions).toBeGreaterThan(0);
  });

  it('nadie puede cerrar la sesión de otra cuenta', async () => {
    const a = await login(A, CHROME_WIN);
    const b = await login(B, CHROME_WIN);
    const victim = ((await t.request.get('/api/v1/me/sessions').set(as(b.token)).expect(200)).body.data as { id: string; current: boolean }[]).find((s) => s.current)!;
    await t.request.delete(`/api/v1/me/sessions/${victim.id}`).set(as(a.token)).expect(204);
    await t.request.post('/api/v1/auth/refresh').set('X-SIA-Client', 'web').set('Cookie', b.cookie).expect(200);
  });
});
