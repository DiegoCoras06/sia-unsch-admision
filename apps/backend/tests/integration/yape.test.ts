import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { YapeChargeRequest, YapeGateway } from '../../src/modules/pagos/domain/ports.js';
import { testApp } from '../helpers.js';

/** Culqi falso: aprueba salvo con el token «ype_test_rechazo»; guarda cada cargo para revisarlo. */
class FakeYape implements YapeGateway {
  readonly provider = 'culqi' as const;
  readonly environment = 'sandbox' as const;
  readonly publicKey = 'pk_test_falsa';
  readonly charges: YapeChargeRequest[] = [];
  amountOverride: string | null = null;
  async charge(r: YapeChargeRequest) {
    this.charges.push(r);
    const approved = r.token !== 'ype_test_rechazo';
    return {
      transactionId: r.transactionId, approved, inconclusive: false, code: approved ? 'AUT0000' : 'insufficient_funds',
      message: approved ? 'Su compra ha sido exitosa.' : 'Saldo insuficiente en Yape.', orderNumber: r.orderNumber,
      amount: this.amountOverride ?? (r.amountCents / 100).toFixed(2), currency: 'PEN', payMethod: 'YAPE',
      authorizationCode: approved ? 'AUT1' : null, operationNumber: approved ? `REF${this.charges.length}` : null, referenceNumber: null, cardMasked: null,
    };
  }
}

const yape = new FakeYape();
const t = testApp('2026-10-25T10:00:00-05:00', { yapeGateway: yape });
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

function fakeJpeg(width: number, height: number): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}

async function register(dni: string): Promise<{ dni: string; code: string }> {
  const res = await t.request.post('/api/v1/inscriptions').send({
    documentType: 'DNI', documentNumber: dni, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'F',
    maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-01-10', address: 'Jr. Asamblea 100, Ayacucho',
    residenceUbigeo: '050101', economicDependency: 'PADRES', mobile: '987654321', email: `yape${dni}@example.com`,
    photo: fakeJpeg(240, 320), schoolUbigeo: '050101', schoolName: 'IE Nuestra Señora de Fátima', schoolType: 'ESTATAL',
    graduationYear: 2025, inFourthOrBelow: false, preparation: 'ACADEMIA', attempts: 1, modality: 'ORD', quotaCategory: 'ORD',
    campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
  }).expect(201);
  return { dni, code: res.body.data.applicantCode };
}

const session = (a: { dni: string; code: string }) =>
  t.request.post('/api/v1/payments/yape/session').send({ documentNumber: a.dni, applicantCode: a.code });
const charge = (a: { dni: string; code: string }, transactionId: string, token: string) =>
  t.request.post('/api/v1/payments/yape/charge').send({ documentNumber: a.dni, applicantCode: a.code, transactionId, token });

describe('Pagar con Yape mediante Culqi (spec 005, FR-013, ADR-019)', () => {
  it('cargo aprobado: orden pagada con medio YAPE, evento e inscripción Apta', async () => {
    const a = await register('99900047');
    const s = (await session(a).expect(201)).body.data;
    expect(s).toMatchObject({ provider: 'culqi', environment: 'sandbox', publicKey: 'pk_test_falsa', amount: '250.00', amountCents: 25000, currency: 'PEN', orderNumber: `${a.code}01` });

    const res = (await charge(a, s.transactionId, 'ype_test_ok123').expect(200)).body.data;
    expect(res).toMatchObject({ status: 'AUTORIZADO', orderStatus: 'PAGADA' });
    expect(yape.charges.at(-1)).toMatchObject({ amountCents: 25000, email: 'yape99900047@example.com', token: 'ype_test_ok123' });

    for (let i = 0; i < 20 && (await t.outbox.dispatch()) > 0; i++);
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: a.code } })).status).toBe('APTA');
    const st = (await t.request.get('/api/v1/payments/status').query({ documentNumber: a.dni, applicantCode: a.code }).expect(200)).body.data;
    expect(st.order).toMatchObject({ status: 'PAGADA' });
    expect(st.order.receipt).toMatchObject({ payMethod: 'YAPE', operationNumber: expect.stringMatching(/^REF/) });
    expect(st.yape).toMatchObject({ environment: 'sandbox', maxAmount: '2000.00' });

    // El mismo intento no se cobra dos veces; con la orden pagada no se abre otro.
    await charge(a, s.transactionId, 'ype_test_otra').expect(409);
    await session(a).expect(409);
  });

  it('cargo rechazado: queda registrado con el mensaje de Culqi y se puede reintentar', async () => {
    const a = await register('99900048');
    const s = (await session(a).expect(201)).body.data;
    const res = (await charge(a, s.transactionId, 'ype_test_rechazo').expect(200)).body.data;
    expect(res).toMatchObject({ status: 'RECHAZADO', orderStatus: 'PENDIENTE', message: 'Saldo insuficiente en Yape.' });
    const s2 = (await session(a).expect(201)).body.data;
    expect(s2.orderNumber).toBe(`${a.code}02`);
  });

  it('un monto distinto al de la orden no se acepta; el intento de otro postulante no se puede cobrar', async () => {
    const a = await register('99900049');
    const s = (await session(a).expect(201)).body.data;
    await charge({ dni: '99900047', code: (await t.db.application.findFirstOrThrow({ where: { documentNumber: '99900047' } })).applicantCode }, s.transactionId, 'ype_test_x').expect(404);
    yape.amountOverride = '1.00';
    await charge(a, s.transactionId, 'ype_test_x').expect(400);
    yape.amountOverride = null;
    await charge(a, s.transactionId, 'token-invalido').expect(400);
  });
});
