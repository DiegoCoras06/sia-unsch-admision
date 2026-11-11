import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { testApp } from '../helpers.js';

/** Pasarela simulada: cobra como Culqi, servidor a servidor, según el token elegido (ADR-024). */
const t = testApp('2026-10-25T10:00:00-05:00');
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

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

type Who = { dni: string; code: string };
const session = (a: Who) => t.request.post('/api/v1/payments/session').send({ documentNumber: a.dni, applicantCode: a.code });
const charge = (a: Who, transactionId: string, token: string) =>
  t.request.post('/api/v1/payments/charge').send({ documentNumber: a.dni, applicantCode: a.code, transactionId, token });
const status = (a: Who) => t.request.get('/api/v1/payments/status').query({ documentNumber: a.dni, applicantCode: a.code });

describe('Pagar en línea (spec 005, H1)', () => {
  it('pago con tarjeta aprobado: orden pagada, inscripción Apta, constancia y correo', async () => {
    const a = await register('99900036');
    const s = (await session(a).expect(201)).body.data;
    expect(s).toMatchObject({ provider: 'mock', environment: 'simulated', publicKey: 'pk_simulada', amount: '250.00', amountCents: 25000, currency: 'PEN', orderNumber: `${a.code}01`, yape: true });

    const res = (await charge(a, s.transactionId, 'mock_tarjeta_aprobada').expect(200)).body.data;
    expect(res).toMatchObject({ status: 'AUTORIZADO', orderStatus: 'PAGADA' });

    for (let i = 0; i < 20 && (await t.outbox.dispatch()) > 0; i++);
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: a.code } })).status).toBe('APTA');
    expect(t.email.sent.some((m) => m.to === 'pago99900036@example.com' && m.subject.includes('Pago confirmado'))).toBe(true);

    const st = (await status(a).expect(200)).body.data;
    expect(st.order).toMatchObject({ status: 'PAGADA', amount: '250.00' });
    expect(st.order.receipt).toMatchObject({ payMethod: 'CARD', cardMasked: 'Visa 411111******1111' });
    expect(st.order.receipt.operationNumber).toMatch(/^SIM/);
    expect(st.yapeMaxAmount).toBe('2000.00');

    // Orden pagada: no se abre otro intento y el mismo intento no se cobra dos veces.
    await session(a).expect(409);
    await charge(a, s.transactionId, 'mock_tarjeta_aprobada').expect(409);
  });

  it('pago con Yape aprobado: el comprobante registra el medio YAPE', async () => {
    const a = await register('99900041');
    const s = (await session(a).expect(201)).body.data;
    await charge(a, s.transactionId, 'mock_yape_aprobado').expect(200);
    const st = (await status(a).expect(200)).body.data;
    expect(st.order.receipt).toMatchObject({ payMethod: 'YAPE', cardMasked: null });
  });

  it('pago rechazado: queda registrado y se puede reintentar con otro número de pedido', async () => {
    const a = await register('99900037');
    const s1 = (await session(a).expect(201)).body.data;
    const r1 = (await charge(a, s1.transactionId, 'mock_rechazado').expect(200)).body.data;
    expect(r1).toMatchObject({ status: 'RECHAZADO', orderStatus: 'PENDIENTE' });

    const s2 = (await session(a).expect(201)).body.data;
    expect(s2.orderNumber).toBe(`${a.code}02`);
    const st = (await status(a).expect(200)).body.data;
    expect(st.attempts.map((x: { status: string }) => x.status)).toEqual(['INICIADO', 'RECHAZADO']);
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: a.code } })).status).toBe('PENDIENTE_PAGO');
  });

  it('token inválido → 400; el intento de otro postulante no se puede cobrar → 404', async () => {
    const a = await register('99900038');
    const b = await register('99900039');
    const s = (await session(a).expect(201)).body.data;
    expect((await charge(a, s.transactionId, 'tkn_test_desconocido').expect(400)).body.error.code).toBe('VALIDATION_ERROR');
    await charge(b, s.transactionId, 'mock_tarjeta_aprobada').expect(404);
    expect((await t.db.paymentAttempt.findUniqueOrThrow({ where: { transactionId: s.transactionId } })).status).toBe('INICIADO');
  });

  it('dos intentos aprobados de la misma orden: el segundo queda DUPLICADO (RF-05.09)', async () => {
    const a = await register('99900040');
    const s1 = (await session(a).expect(201)).body.data;
    const s2 = (await session(a).expect(201)).body.data;
    await charge(a, s1.transactionId, 'mock_tarjeta_aprobada').expect(200);
    const r2 = (await charge(a, s2.transactionId, 'mock_tarjeta_aprobada').expect(200)).body.data;
    expect(r2).toMatchObject({ status: 'DUPLICADO', orderStatus: 'PAGADA' });
    expect(await t.db.outboxEvent.count({ where: { eventType: 'PagoDuplicado' } })).toBeGreaterThanOrEqual(1);
  });

  it('DNI y código que no coinciden → 404', async () => {
    await t.request.post('/api/v1/payments/session').send({ documentNumber: '12345678', applicantCode: '27000017' }).expect(404);
  });
});
