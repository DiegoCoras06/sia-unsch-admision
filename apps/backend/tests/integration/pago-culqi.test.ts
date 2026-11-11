import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { ChargeRequest, PaymentGateway } from '../../src/modules/pagos/domain/ports.js';
import { testApp } from '../helpers.js';

/** Culqi falso: aprueba salvo con los tokens «…_rechazo»; guarda cada cargo para revisarlo (ADR-024). */
class FakeCulqi implements PaymentGateway {
  readonly provider = 'culqi' as const;
  readonly environment = 'sandbox' as const;
  readonly publicKey = 'pk_test_falsa';
  readonly charges: ChargeRequest[] = [];
  amountOverride: string | null = null;
  acceptsToken(token: string) {
    return /^(tkn|ype)_test_[A-Za-z0-9]+$/.test(token);
  }
  async charge(r: ChargeRequest) {
    this.charges.push(r);
    const approved = !r.token.endsWith('rechazo');
    const yape = r.token.startsWith('ype_');
    return {
      transactionId: r.transactionId, approved, inconclusive: false, code: approved ? 'AUT0000' : 'insufficient_funds',
      message: approved ? 'Su compra ha sido exitosa.' : 'Fondos insuficientes.', orderNumber: r.orderNumber,
      amount: this.amountOverride ?? (r.amountCents / 100).toFixed(2), currency: 'PEN', payMethod: yape ? 'YAPE' : 'CARD',
      authorizationCode: approved ? 'AUT1' : null, operationNumber: approved ? `REF${this.charges.length}` : null, referenceNumber: null,
      cardMasked: approved && !yape ? 'Visa 411111******1111' : null,
    };
  }
}

const culqi = new FakeCulqi();
const t = testApp('2026-10-25T10:00:00-05:00', { paymentGateway: culqi });
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
    residenceUbigeo: '050101', economicDependency: 'PADRES', mobile: '987654321', email: `culqi${dni}@example.com`,
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

describe('Pagar con Culqi: tarjeta y Yape (spec 005, ADR-024)', () => {
  it('tarjeta aprobada: el servidor cobra con el token, la orden queda pagada y la inscripción Apta', async () => {
    const a = await register('99900047');
    const s = (await session(a).expect(201)).body.data;
    expect(s).toMatchObject({ provider: 'culqi', environment: 'sandbox', publicKey: 'pk_test_falsa', amount: '250.00', amountCents: 25000, currency: 'PEN', orderNumber: `${a.code}01`, yape: true });

    const res = (await charge(a, s.transactionId, 'tkn_test_ok123').expect(200)).body.data;
    expect(res).toMatchObject({ status: 'AUTORIZADO', orderStatus: 'PAGADA' });
    expect(culqi.charges.at(-1)).toMatchObject({ amountCents: 25000, email: 'culqi99900047@example.com', token: 'tkn_test_ok123' });

    for (let i = 0; i < 20 && (await t.outbox.dispatch()) > 0; i++);
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: a.code } })).status).toBe('APTA');
    const st = (await status(a).expect(200)).body.data;
    expect(st.order.receipt).toMatchObject({ payMethod: 'CARD', cardMasked: 'Visa 411111******1111', operationNumber: expect.stringMatching(/^REF/) });

    await charge(a, s.transactionId, 'tkn_test_otra').expect(409);
    await session(a).expect(409);
  });

  it('Yape rechazado: queda registrado con el mensaje de Culqi y se puede reintentar', async () => {
    const a = await register('99900048');
    const s = (await session(a).expect(201)).body.data;
    const res = (await charge(a, s.transactionId, 'ype_test_rechazo').expect(200)).body.data;
    expect(res).toMatchObject({ status: 'RECHAZADO', orderStatus: 'PENDIENTE', message: 'Fondos insuficientes.' });
    const s2 = (await session(a).expect(201)).body.data;
    expect(s2.orderNumber).toBe(`${a.code}02`);
    await charge(a, s2.transactionId, 'ype_test_ok').expect(200);
    expect((await status(a).expect(200)).body.data.order.receipt).toMatchObject({ payMethod: 'YAPE' });
  });

  it('un monto distinto al de la orden no se acepta; un token que no es de Culqi tampoco', async () => {
    const a = await register('99900049');
    const s = (await session(a).expect(201)).body.data;
    culqi.amountOverride = '1.00';
    await charge(a, s.transactionId, 'tkn_test_x').expect(400);
    culqi.amountOverride = null;
    await charge(a, s.transactionId, 'token-invalido').expect(400);
  });
});
