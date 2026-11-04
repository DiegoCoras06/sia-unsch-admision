// ADR-022: códigos de respaldo del segundo factor del personal.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { totpService } from '../../src/modules/seguridad/index.js';
import { normalizeRecoveryCode, newRecoveryCodes } from '../../src/modules/usuarios/domain/recovery-codes.js';
import { Argon2Hasher } from '../../src/modules/usuarios/infrastructure/argon2-hasher.js';
import { movableClock, testApp } from '../helpers.js';

const clock = movableClock('2026-10-25T10:00:00-05:00');
const t = testApp(clock);
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

const EMAIL = 'respaldo.prueba@unsch.test';
const PASSWORD = 'Respaldo-Seguro-2027';
let userId = '';
let secret = '';
let codes: string[] = [];
let token = '';

const login = async () => {
  clock.advance(31);
  return (await t.request.post('/api/v1/admin/auth/login').send({ email: EMAIL, password: PASSWORD }).expect(200)).body.data;
};
const recovery = async (code: string) => {
  const { challenge } = await login();
  return t.request.post('/api/v1/admin/auth/recovery').send({ challenge, code });
};
const as = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  const user = await t.db.user.create({ data: { email: EMAIL, passwordHash: await new Argon2Hasher().hash(PASSWORD), type: 'STAFF', status: 'ACTIVE' } });
  userId = user.id;
  await t.db.staffProfile.create({ data: { userId, fullName: 'Prueba respaldo', mustChangePassword: false } });
  await t.db.userRole.create({ data: { userId, roleId: (await t.db.role.findUniqueOrThrow({ where: { code: 'SOPORTE' } })).id } });
});

describe('Formato de los códigos', () => {
  it('genera códigos únicos y acepta minúsculas, espacios o sin guion', () => {
    const list = newRecoveryCodes();
    expect(new Set(list).size).toBe(10);
    expect(list[0]).toMatch(/^[2-9A-HJKMNP-TV-Z]{5}-[2-9A-HJKMNP-TV-Z]{5}$/);
    const c = list[0]!;
    expect(normalizeRecoveryCode(c.toLowerCase().replace('-', ' '))).toBe(c);
    expect(normalizeRecoveryCode(c.replace('-', ''))).toBe(c);
    expect(normalizeRecoveryCode('123456')).toBeNull();
    expect(normalizeRecoveryCode('OOOOO-IIIII')).toBeNull();
  });
});

describe('Códigos de respaldo del personal (ADR-022)', () => {
  it('no sirven para saltarse la activación del segundo factor', async () => {
    const step = await login();
    expect(step.step).toBe('SETUP_MFA');
    await t.request.post('/api/v1/admin/auth/recovery').send({ challenge: step.challenge, code: 'ABCDE-FGHJK' }).expect(401);
  });

  it('se entregan una sola vez al activar y solo se guarda su huella', async () => {
    const step = await login();
    secret = step.mfaSetup.secret;
    const res = await t.request.post('/api/v1/admin/auth/mfa').send({ challenge: step.challenge, code: totpService.code(secret, clock.now()) }).expect(200);
    codes = res.body.data.recoveryCodes;
    token = res.body.data.accessToken;
    expect(codes).toHaveLength(10);

    const stored = await t.db.staffRecoveryCode.findMany({ where: { userId } });
    expect(stored).toHaveLength(10);
    expect(stored.every((r) => /^[0-9a-f]{64}$/.test(r.codeHash))).toBe(true);
    expect(JSON.stringify(stored)).not.toContain(codes[0]);

    const again = await login();
    const normal = await t.request.post('/api/v1/admin/auth/mfa').send({ challenge: again.challenge, code: totpService.code(secret, clock.now()) }).expect(200);
    expect(normal.body.data.recoveryCodes).toBeUndefined();
    token = normal.body.data.accessToken;
  });

  it('un código abre sesión una sola vez y queda registrado en auditoría', async () => {
    const res = await recovery(codes[0]!.toLowerCase().replace('-', ''));
    expect(res.status).toBe(200);
    token = res.body.data.accessToken;
    expect((await t.request.get('/api/v1/admin/me/recovery-codes').set(as()).expect(200)).body.data.remaining).toBe(9);

    expect((await recovery(codes[0]!)).status).toBe(401);
    expect((await recovery('ABCDE-FGHJK')).status).toBe(401);
    const actions = (await t.db.auditEvent.findMany({ where: { actorUserId: userId } })).map((a) => a.action);
    expect(actions).toContain('staff.login_recovery');
    expect(actions).toContain('staff.recovery_failed');
  });

  it('regenerar pide el código actual e invalida los anteriores', async () => {
    await t.request.post('/api/v1/admin/me/recovery-codes').set(as()).send({ code: '000000' }).expect(401);
    clock.advance(31);
    const res = await t.request.post('/api/v1/admin/me/recovery-codes').set(as()).send({ code: totpService.code(secret, clock.now()) }).expect(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.data.codes).toHaveLength(10);
    expect((await recovery(codes[1]!)).status).toBe(401);
    expect((await recovery(res.body.data.codes[0])).status).toBe(200);
  });
});
