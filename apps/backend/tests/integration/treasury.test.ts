import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SecretBox, totpService } from '../../src/modules/seguridad/index.js';
import { Argon2Hasher } from '../../src/modules/usuarios/infrastructure/argon2-hasher.js';
import { movableClock, testApp } from '../helpers.js';

const clock = movableClock('2026-10-25T10:00:00-05:00');
const t = testApp(clock);
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

const PASSWORD = 'Tesoreria-Segura-2027';
const box = new SecretBox('staff:test-hmac-secret-test-hmac-secret-test-hmac');
const secrets = new Map<string, string>();
async function staff(email: string) {
  const secret = totpService.newSecret();
  secrets.set(email, secret);
  const user = await t.db.user.create({ data: { email, passwordHash: await new Argon2Hasher().hash(PASSWORD), type: 'STAFF', status: 'ACTIVE' } });
  await t.db.staffProfile.create({ data: { userId: user.id, fullName: email.split('@')[0]!, mustChangePassword: false, mfaSecretEnc: box.seal(secret), mfaEnabledAt: new Date() } });
  await t.db.userRole.create({ data: { userId: user.id, roleId: (await t.db.role.findUniqueOrThrow({ where: { code: 'TESORERIA' } })).id } });
  clock.advance(31);
  const c = (await t.request.post('/api/v1/admin/auth/login').send({ email, password: PASSWORD }).expect(200)).body.data;
  return (await t.request.post('/api/v1/admin/auth/mfa').send({ challenge: c.challenge, code: totpService.code(secret, clock.now()) }).expect(200)).body.data.accessToken as string;
}
const as = (token: string) => ({ Authorization: `Bearer ${token}` });

function fakeJpeg(): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 320 >> 8, 320 & 255, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}
const DNI = '99900014';
let tes1 = '';
let tes2 = '';
let paid = { orderNumber: '', transactionId: '', amount: '' };
let duplicate = { orderNumber: '', transactionId: '' };
// Los intentos guardan la fecha real de la base: el periodo de conciliación es el día de hoy en Lima.
const today = new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);

beforeAll(async () => {
  tes1 = await staff('tesoreria.uno@unsch.test');
  tes2 = await staff('tesoreria.dos@unsch.test');
  const r = await t.request.post('/api/v1/inscriptions').send({
    documentType: 'DNI', documentNumber: DNI, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'F',
    maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2007-06-06', address: 'Jr. Lima 9, Ayacucho', residenceUbigeo: '050101',
    economicDependency: 'PADRES', mobile: '987654321', email: 'teso14@example.com', photo: fakeJpeg(), schoolUbigeo: '050101',
    schoolName: 'IE San Ramón', schoolType: 'ESTATAL', graduationYear: 2025, inFourthOrBelow: false, preparation: 'COLEGIO', attempts: 1,
    modality: 'ORD', quotaCategory: 'ORD', campus: 'HUAMANGA', optionCode: 'P07', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
  }).expect(201);
  const code = r.body.data.applicantCode;
  const s = (await t.request.post('/api/v1/payments/session').send({ documentNumber: DNI, applicantCode: code }).expect(201)).body.data;
  const msg = (await t.request.post('/api/v1/payments/mock/complete').send({ transactionId: s.transactionId, approve: true }).expect(200)).body.data;
  await t.request.post('/api/v1/payments/confirm').send(msg).expect(200);
  const a = await t.db.paymentAttempt.findUniqueOrThrow({ where: { transactionId: s.transactionId } });
  paid = { orderNumber: a.orderNumber, transactionId: a.transactionId, amount: Number(a.amount).toFixed(2) };
  // Segundo cobro de la misma orden (en banco y en línea): la pasarela lo marca Duplicado (probado en payments.test.ts).
  const dup = await t.db.paymentAttempt.create({
    data: { orderId: a.orderId, provider: 'mock', transactionId: `DUP${Date.now()}`.slice(0, 20), orderNumber: `D${String(Date.now()).slice(-9)}`, amount: a.amount, status: 'DUPLICADO', expiresAt: a.expiresAt },
  });
  duplicate = { orderNumber: dup.orderNumber, transactionId: dup.transactionId };
});

describe('Conciliación (Historia 4, RF-05.11)', () => {
  it('cruza el reporte con el sistema y clasifica cada partida', async () => {
    const content = `pedido;monto;estado;fecha\n${paid.orderNumber};${paid.amount};PAGADO;${today}\n${duplicate.orderNumber};1.00;PAGADO;${today}\nZZ9999999;250.00;PAGADO;${today}\n`;
    const run = (await t.request.post('/api/v1/admin/reconciliations').set(as(tes1)).send({ source: 'IZIPAY', fileName: 'izipay.csv', content, from: today, to: today }).expect(201)).body.data;
    const by = (ref: string) => run.items.find((i: { reference: string }) => i.reference === ref);
    expect(by(paid.orderNumber).result).toBe('CONCILIADO');
    expect(by(duplicate.orderNumber).result).toBe('DIFERENCIA_MONTO');
    expect(by('ZZ9999999').result).toBe('SOLO_PROVEEDOR');
    expect(run.summary.SOLO_PROVEEDOR).toBe(1);
    const fixed = (await t.request.post(`/api/v1/admin/reconciliations/items/${by('ZZ9999999').id}/resolve`).set(as(tes1)).send({ resolution: 'Pago de otro proceso; se informa al banco.' }).expect(200)).body.data;
    expect(fixed.items.find((i: { reference: string }) => i.reference === 'ZZ9999999').resolution).toMatch(/otro proceso/);
    await t.request.post(`/api/v1/admin/reconciliations/items/${by(paid.orderNumber).id}/resolve`).set(as(tes1)).send({ resolution: 'Nada que resolver aquí' }).expect(422);
  });

  it('rechaza un archivo sin las columnas requeridas', async () => {
    await t.request.post('/api/v1/admin/reconciliations').set(as(tes1)).send({ source: 'TESORERIA', fileName: 'x.csv', content: 'a,b,c\n1,2,3\n', from: today, to: today }).expect(400);
  });
});

describe('Anulaciones por error de cobro (Historia 5, RF-05.12, RN-08)', () => {
  it('el pago válido de la inscripción no se devuelve (Art. 18)', async () => {
    const r = await t.request.post('/api/v1/admin/annulments').set(as(tes1)).send({
      reference: paid.transactionId, kind: 'DEVOLUCION', reason: 'COBRO_DUPLICADO', detail: 'El postulante pide la devolución por desistir.', resolution: 'Sin resolución',
    }).expect(422);
    expect(r.body.error.code).toBe('NOT_DUPLICATED');
  });

  it('el cobro duplicado se anula con resolución y lo aprueba otra persona', async () => {
    const list = (await t.request.post('/api/v1/admin/annulments').set(as(tes1)).send({
      reference: duplicate.transactionId, kind: 'DEVOLUCION', reason: 'COBRO_DUPLICADO', detail: 'Pagó en ventanilla y en línea el mismo día.', resolution: 'R.D. 045-2026-DA',
    }).expect(201)).body.data;
    const req = list.find((x: { transactionId: string }) => x.transactionId === duplicate.transactionId);
    expect(req.status).toBe('SOLICITADA');
    await t.request.post(`/api/v1/admin/annulments/${req.id}/decision`).set(as(tes1)).send({ approve: true, note: 'Aprobado por mí mismo' }).expect(403);
    await t.request.post('/api/v1/admin/annulments').set(as(tes1)).send({
      reference: duplicate.transactionId, kind: 'DEVOLUCION', reason: 'COBRO_DUPLICADO', detail: 'Repetida por error de digitación.', resolution: 'R.D. 045-2026-DA',
    }).expect(409);
    const done = (await t.request.post(`/api/v1/admin/annulments/${req.id}/decision`).set(as(tes2)).send({ approve: true, note: 'Conforme con la conciliación del día.' }).expect(200)).body.data;
    expect(done.find((x: { id: string }) => x.id === req.id).status).toBe('APROBADA');
  });
});
