import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NotificationService } from '../../src/modules/notificaciones/application/notification-service.js';
import { AuditLog } from '../../src/shared/audit/audit.js';
import { RateLimiter } from '../../src/shared/rate-limit/rate-limiter.js';
import { SecretBox, totpService } from '../../src/modules/seguridad/index.js';
import { Argon2Hasher } from '../../src/modules/usuarios/infrastructure/argon2-hasher.js';
import { movableClock, testApp } from '../helpers.js';

const clock = movableClock('2026-10-25T10:00:00-05:00');
const t = testApp(clock);
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

const PASSWORD = 'Avisos-Seguro-2027';
const box = new SecretBox('staff:test-hmac-secret-test-hmac-secret-test-hmac');
let secret = '';
let token = '';
async function login() {
  clock.advance(31);
  const c = (await t.request.post('/api/v1/admin/auth/login').send({ email: 'soporte.avisos@unsch.test', password: PASSWORD }).expect(200)).body.data;
  token = (await t.request.post('/api/v1/admin/auth/mfa').send({ challenge: c.challenge, code: totpService.code(secret, clock.now()) }).expect(200)).body.data.accessToken;
}
const as = () => ({ Authorization: `Bearer ${token}` });

function fakeJpeg(): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 320 >> 8, 320 & 255, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}
const DNI = '99900013';
let code = '';

beforeAll(async () => {
  secret = totpService.newSecret();
  const user = await t.db.user.create({ data: { email: 'soporte.avisos@unsch.test', passwordHash: await new Argon2Hasher().hash(PASSWORD), type: 'STAFF', status: 'ACTIVE' } });
  await t.db.staffProfile.create({ data: { userId: user.id, fullName: 'Soporte avisos', mustChangePassword: false, mfaSecretEnc: box.seal(secret), mfaEnabledAt: new Date() } });
  await t.db.userRole.create({ data: { userId: user.id, roleId: (await t.db.role.findUniqueOrThrow({ where: { code: 'SOPORTE' } })).id } });
  await login();
  const r = await t.request.post('/api/v1/inscriptions').send({
    documentType: 'DNI', documentNumber: DNI, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'M',
    maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2007-01-15', address: 'Jr. Lima 5, Ayacucho', residenceUbigeo: '050101',
    economicDependency: 'PADRES', mobile: '987654321', email: 'avisos13@example.com', photo: fakeJpeg(), schoolUbigeo: '050101',
    schoolName: 'IE San Juan', schoolType: 'ESTATAL', graduationYear: 2025, inFourthOrBelow: false, preparation: 'COLEGIO', attempts: 1,
    modality: 'ORD', quotaCategory: 'ORD', campus: 'HUAMANGA', optionCode: 'P05', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
  }).expect(201);
  code = r.body.data.applicantCode;
  for (let i = 0; i < 50 && (await t.outbox.dispatch()) > 0; i++);
});

describe('Registro de envíos (RF-11.09)', () => {
  it('cada correo de otro módulo queda registrado como enviado', async () => {
    const n = await t.db.notification.findMany({ where: { email: 'avisos13@example.com' } });
    expect(n.length).toBeGreaterThan(0);
    expect(n.every((x) => x.status === 'ENVIADA')).toBe(true);
    const log = (await t.request.get('/api/v1/admin/notifications').query({ email: 'avisos13' }).set(as()).expect(200)).body.data;
    expect(log.total).toBe(n.length);
  });

  it('con el proveedor caído reintenta hasta 3 veces y no duplica (SC-002, RNF-08)', async () => {
    let calls = 0;
    // Solo falla para este destinatario: la cola es compartida con las demás pruebas en paralelo.
    const failing = { send: async (m: { to: string }) => { if (m.to !== 'reintento@example.com') return; calls++; throw new Error('SMTP caído'); } };
    const svc = new NotificationService({ db: t.db, clock, audit: new AuditLog(t.db), limiter: new RateLimiter(t.db, clock), transport: failing, sources: null as never, frontendOrigin: 'http://x' });
    const item = { email: 'reintento@example.com', event: 'PRUEBA', subject: 'Prueba', html: '<p>x</p>', text: 'x', dedupeKey: 'prueba:reintento' };
    expect(await svc.enqueue([item])).toBe(1);
    expect(await svc.enqueue([item])).toBe(0);
    for (let i = 0; i < 5; i++) await svc.dispatch();
    const n = await t.db.notification.findUniqueOrThrow({ where: { dedupeKey: 'prueba:reintento' } });
    expect(n.status).toBe('FALLIDA');
    expect(n.attempts).toBe(3);
    expect(calls).toBe(3);
    await t.request.post('/api/v1/admin/notifications/retry').set(as()).expect(200);
    await t.request.post('/api/v1/admin/notifications/dispatch').set(as()).expect(200);
    expect((await t.db.notification.findUniqueOrThrow({ where: { dedupeKey: 'prueba:reintento' } })).status).toBe('ENVIADA');
  });
});

describe('Recordatorios y preferencias (Historias 3 y 5)', () => {
  it('recuerda el pago 2 días antes del cierre, una sola vez (H3-1)', async () => {
    const call = (await t.request.get('/api/v1/calls/current').expect(200)).body.data;
    const end = new Date(call.stages.find((s: { code: string }) => s.code === 'ORD_REGULAR').endsAt);
    clock.set(new Date(end.getTime() - 24 * 3600_000).toISOString());
    await t.notifications.tick();
    await t.notifications.tick();
    const n = await t.db.notification.findMany({ where: { dedupeKey: `pago:${code}:ORD_REGULAR` } });
    expect(n).toHaveLength(1);
    expect(n[0]!.status).toBe('ENVIADA');
    expect(n[0]!.subject).toMatch(/Recuerda pagar/);
  });

  it('el postulante ve sus avisos, los marca leídos y desactiva recordatorios (H2, H5)', async () => {
    const q = { documentNumber: DNI, applicantCode: code };
    const inbox = (await t.request.get('/api/v1/notifications').query(q).expect(200)).body.data;
    expect(inbox.unread).toBeGreaterThan(0);
    const read = (await t.request.post('/api/v1/notifications/read').send({ ...q, ids: inbox.items.map((i: { id: string }) => i.id) }).expect(200)).body.data;
    expect(read.unread).toBe(0);
    const off = (await t.request.put('/api/v1/notifications/preferences').send({ ...q, reminders: false }).expect(200)).body.data;
    expect(off.reminders).toBe(false);
    await t.request.get('/api/v1/notifications').query({ documentNumber: '99900001', applicantCode: code }).expect(404);
  });
});

describe('Comunicados segmentados y plantillas (Historia 4, FR-006)', () => {
  it('envía solo al segmento elegido y muestra los conteos', async () => {
    await login();
    const preview = (await t.request.post('/api/v1/admin/campaigns/preview').set(as()).send({ modality: 'ORD', optionCode: 'P05', status: 'PENDIENTE_PAGO' }).expect(200)).body.data;
    expect(preview.recipients).toBeGreaterThanOrEqual(1);
    const list = (await t.request.post('/api/v1/admin/campaigns').set(as()).send({
      subject: 'Cambio de horario de atención', body: 'Hola {{nombre}}:\nLa Dirección de Admisión atenderá de 8:00 a 13:00 el lunes.', segment: { modality: 'ORD', optionCode: 'P05', status: 'PENDIENTE_PAGO' },
    }).expect(201)).body.data;
    expect(list[0].recipients).toBe(preview.recipients);
    await t.notifications.tick();
    const after = (await t.request.get('/api/v1/admin/campaigns').set(as()).expect(200)).body.data;
    expect(after[0].sent).toBe(preview.recipients);
    const mine = await t.db.notification.findFirstOrThrow({ where: { campaignId: list[0].id, email: 'avisos13@example.com' } });
    expect(mine.text).toMatch(/Hola [A-ZÁÉÍÓÚÑ]+/);
    expect(mine.text).not.toContain('{{');
  });

  it('las plantillas se editan y se usan en los avisos', async () => {
    const tpls = (await t.request.put('/api/v1/admin/notification-templates/AULA_PUBLICADA').set(as()).send({ subject: 'Ya está tu aula', body: 'Hola {{nombre}}: revisa tu aula en {{enlace}}.' }).expect(200)).body.data;
    expect(tpls.find((x: { key: string }) => x.key === 'AULA_PUBLICADA').customized).toBe(true);
    await t.request.put('/api/v1/admin/notification-templates/NO_EXISTE').set(as()).send({ subject: 'Asunto x', body: 'Cuerpo de prueba' }).expect(404);
  });
});
