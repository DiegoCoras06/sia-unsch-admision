import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { signPayload } from '../../src/modules/pagos/infrastructure/signature.js';
import { testApp } from '../helpers.js';

const t = testApp('2026-10-25T10:00:00-05:00');
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

/** Clave con la que firma la pasarela simulada en las pruebas (app.ts: `mock-gateway:${HMAC_SECRET}`). */
const MOCK_KEY = 'mock-gateway:test-hmac-secret-test-hmac-secret-test-hmac';

function fakeJpeg(width: number, height: number): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}

async function register(dni: string): Promise<{ dni: string; code: string }> {
  const res = await t.request.post('/api/v1/inscriptions').send({
    documentType: 'DNI', documentNumber: dni, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'M',
    maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-01-10', address: 'Jr. Asamblea 100, Ayacucho',
    residenceUbigeo: '050101', economicDependency: 'PADRES', mobile: '987654321', email: `pago${dni}@example.com`,
    photo: fakeJpeg(240, 320), schoolUbigeo: '050101', schoolName: 'IE Nuestra Señora de Fátima', schoolType: 'ESTATAL',
    graduationYear: 2025, inFourthOrBelow: false, preparation: 'ACADEMIA', attempts: 1, modality: 'ORD', quotaCategory: 'ORD',
    campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
  }).expect(201);
  return { dni, code: res.body.data.applicantCode };
}

const session = (a: { dni: string; code: string }) =>
  t.request.post('/api/v1/payments/session').send({ documentNumber: a.dni, applicantCode: a.code });
const signed = async (transactionId: string, approve: boolean) =>
  (await t.request.post('/api/v1/payments/mock/complete').send({ transactionId, approve }).expect(200)).body.data;
/** Primero el mensaje firmado y luego la confirmación (supertest no admite crear una solicitud mientras otra está en curso). */
const confirmWith = async (transactionId: string, approve: boolean) => {
  const msg = await signed(transactionId, approve);
  return t.request.post('/api/v1/payments/confirm').send(msg);
};
const status = (a: { dni: string; code: string }) =>
  t.request.get('/api/v1/payments/status').query({ documentNumber: a.dni, applicantCode: a.code });

describe('Pagar en línea (spec 005, H1)', () => {
  it('pago aprobado: orden pagada, inscripción Apta, constancia y correo', async () => {
    const a = await register('99900036');
    const s = (await session(a).expect(201)).body.data;
    expect(s).toMatchObject({ provider: 'mock', environment: 'simulated', amount: '250.00', currency: 'PEN', orderNumber: `${a.code}01`, checkout: null });

    const res = (await confirmWith(s.transactionId, true).then((r) => { expect(r.status).toBe(200); return r; }));
    expect(res.body.data).toMatchObject({ status: 'AUTORIZADO', orderStatus: 'PAGADA' });

    await t.outbox.dispatch();
    const app = await t.db.application.findUniqueOrThrow({ where: { applicantCode: a.code } });
    expect(app.status).toBe('APTA');
    expect(t.email.sent.some((m) => m.to === 'pago99900036@example.com' && m.subject.includes('Pago confirmado'))).toBe(true);

    const st = (await status(a).expect(200)).body.data;
    expect(st.order).toMatchObject({ status: 'PAGADA', amount: '250.00' });
    expect(st.order.receipt).toMatchObject({ payMethod: 'CARD', cardMasked: 'VS 411111******1111' });
    expect(st.order.receipt.operationNumber).toMatch(/^SIM/);

    // Orden pagada: no se abre otro intento.
    await session(a).expect(409);
  });

  it('pago rechazado: queda registrado y se puede reintentar con otro número de pedido', async () => {
    const a = await register('99900037');
    const s1 = (await session(a).expect(201)).body.data;
    const r1 = (await confirmWith(s1.transactionId, false).then((r) => { expect(r.status).toBe(200); return r; }));
    expect(r1.body.data).toMatchObject({ status: 'RECHAZADO', orderStatus: 'PENDIENTE' });

    const s2 = (await session(a).expect(201)).body.data;
    expect(s2.orderNumber).toBe(`${a.code}02`);
    const st = (await status(a).expect(200)).body.data;
    expect(st.attempts.map((x: { status: string }) => x.status)).toEqual(['INICIADO', 'RECHAZADO']);
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: a.code } })).status).toBe('PENDIENTE_PAGO');
  });

  it('firma inválida o monto alterado → 400 y no cambia nada (FR-004)', async () => {
    const a = await register('99900038');
    const s = (await session(a).expect(201)).body.data;
    const msg = await signed(s.transactionId, true);

    await t.request.post('/api/v1/payments/confirm').send({ ...msg, signature: Buffer.alloc(32).toString('base64') }).expect(400);

    // Payload con monto de S/ 1.00 firmado con la clave correcta: no corresponde a la orden.
    const tampered = msg.payloadHttp.replace('"amount":"250.00"', '"amount":"1.00"');
    const res = await t.request.post('/api/v1/payments/confirm')
      .send({ ...msg, payloadHttp: tampered, signature: signPayload(tampered, MOCK_KEY) }).expect(400);
    expect(res.body.error.code).toBe('PAYMENT_MISMATCH');

    const attempt = await t.db.paymentAttempt.findUniqueOrThrow({ where: { transactionId: s.transactionId } });
    expect(attempt.status).toBe('INICIADO');
    const log = await t.db.paymentNotification.findMany({ where: { transactionId: s.transactionId } });
    expect(log.map((l) => l.outcome).sort()).toEqual(['FIRMA_INVALIDA', 'NO_COINCIDE']);
  });

  it('la misma notificación IPN 10 veces confirma una sola vez (SC-002)', async () => {
    const a = await register('99900039');
    const s = (await session(a).expect(201)).body.data;
    const msg = await signed(s.transactionId, true);
    for (let i = 0; i < 10; i++) {
      await t.request.post('/api/v1/payments/izipay/notify').set('transactionId', s.transactionId).send(msg).expect(200);
    }
    await t.request.post('/api/v1/payments/confirm').send(msg).expect(200);
    const events = await t.db.outboxEvent.findMany({ where: { eventType: 'PagoConfirmado' } });
    expect(events.filter((e) => (e.payload as { applicantCode: string }).applicantCode === a.code)).toHaveLength(1);
    const attempt = await t.db.paymentAttempt.findUniqueOrThrow({ where: { transactionId: s.transactionId } });
    expect(attempt).toMatchObject({ status: 'AUTORIZADO', confirmedVia: 'IPN' });
  });

  it('dos intentos aprobados de la misma orden: el segundo queda DUPLICADO (RF-05.09)', async () => {
    const a = await register('99900040');
    const s1 = (await session(a).expect(201)).body.data;
    const s2 = (await session(a).expect(201)).body.data;
    (await confirmWith(s1.transactionId, true).then((r) => { expect(r.status).toBe(200); return r; }));
    const r2 = (await confirmWith(s2.transactionId, true).then((r) => { expect(r.status).toBe(200); return r; }));
    expect(r2.body.data).toMatchObject({ status: 'DUPLICADO', orderStatus: 'PAGADA' });
    expect(await t.db.outboxEvent.count({ where: { eventType: 'PagoDuplicado' } })).toBeGreaterThanOrEqual(1);
  });

  it('DNI y código que no coinciden → 404', async () => {
    await t.request.post('/api/v1/payments/session').send({ documentNumber: '12345678', applicantCode: '27000017' }).expect(404);
  });
});
