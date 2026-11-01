import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { ProviderResult } from '../../src/modules/pagos/domain/payment-rules.js';
import type { PaymentGateway } from '../../src/modules/pagos/domain/ports.js';
import { MockPaymentGateway } from '../../src/modules/pagos/infrastructure/mock-gateway.js';
import { testApp } from '../helpers.js';

/**
 * Pasarela real (sandbox) sin IPN: la aprobación que trae el navegador solo cuenta si la consulta
 * servidor a servidor la ratifica. Se reutiliza la simulada para firmar y se hace pasar por sandbox.
 */
const gateway = new MockPaymentGateway('mock-gateway:test-hmac-secret-test-hmac-secret-test-hmac');
Object.assign(gateway, { environment: 'sandbox' });
let serverAnswer: (r: ProviderResult | null) => ProviderResult | null = () => null;
let lastVerified: ProviderResult | null = null;
(gateway as PaymentGateway).query = async () => serverAnswer(lastVerified);

const t = testApp('2026-10-25T10:00:00-05:00', { paymentGateway: gateway });
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
    residenceUbigeo: '050101', economicDependency: 'PADRES', mobile: '987654321', email: `srv${dni}@example.com`,
    photo: fakeJpeg(240, 320), schoolUbigeo: '050101', schoolName: 'IE Nuestra Señora de Fátima', schoolType: 'ESTATAL',
    graduationYear: 2025, inFourthOrBelow: false, preparation: 'ACADEMIA', attempts: 1, modality: 'ORD', quotaCategory: 'ORD',
    campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
  }).expect(201);
  return { dni, code: res.body.data.applicantCode };
}

/** Abre un intento y devuelve la aprobación firmada que el navegador enviaría. */
async function browserApproval(dni: string) {
  const a = await register(dni);
  const s = (await t.request.post('/api/v1/payments/session').send({ documentNumber: a.dni, applicantCode: a.code }).expect(201)).body.data;
  const attempt = await t.db.paymentAttempt.findUniqueOrThrow({ where: { transactionId: s.transactionId } });
  const msg = gateway.complete({ transactionId: s.transactionId, orderNumber: attempt.orderNumber, amount: '250.00' }, true, new Date());
  lastVerified = gateway.verify(msg);
  return { a, msg };
}

const appStatus = async (code: string) => (await t.db.application.findUniqueOrThrow({ where: { applicantCode: code } })).status;

describe('Confirmación sin IPN: el navegador no basta (spec 005, FR-004)', () => {
  it('si la pasarela no ratifica la aprobación, el intento sigue en proceso y la inscripción no cambia', async () => {
    serverAnswer = () => null;
    const { a, msg } = await browserApproval('99900061');
    const res = (await t.request.post('/api/v1/payments/confirm').send(msg).expect(200)).body.data;
    expect(res).toMatchObject({ status: 'INICIADO', orderStatus: 'PENDIENTE' });
    expect(res.message).toContain('verificando');
    expect(await appStatus(a.code)).toBe('PENDIENTE_PAGO');
    const log = await t.db.paymentNotification.findFirstOrThrow({ where: { transactionId: msg.transactionId } });
    expect(log).toMatchObject({ source: 'SDK', signatureValid: true, outcome: 'POR_VERIFICAR' });
  });

  it('si la pasarela informa otro monto, no se confirma', async () => {
    serverAnswer = (r) => (r ? { ...r, amount: '1.00' } : null);
    const { a, msg } = await browserApproval('99900062');
    const res = (await t.request.post('/api/v1/payments/confirm').send(msg).expect(200)).body.data;
    expect(res).toMatchObject({ status: 'INICIADO', orderStatus: 'PENDIENTE' });
    expect(await appStatus(a.code)).toBe('PENDIENTE_PAGO');
  });

  it('con la ratificación de la pasarela el pago se confirma por CONSULTA y la inscripción queda Apta', async () => {
    serverAnswer = (r) => r;
    const { a, msg } = await browserApproval('99900063');
    const res = (await t.request.post('/api/v1/payments/confirm').send(msg).expect(200)).body.data;
    expect(res).toMatchObject({ status: 'AUTORIZADO', orderStatus: 'PAGADA' });
    const attempt = await t.db.paymentAttempt.findUniqueOrThrow({ where: { transactionId: msg.transactionId } });
    expect(attempt.confirmedVia).toBe('CONSULTA');
    await t.outbox.dispatch();
    expect(await appStatus(a.code)).toBe('APTA');
  });
});
