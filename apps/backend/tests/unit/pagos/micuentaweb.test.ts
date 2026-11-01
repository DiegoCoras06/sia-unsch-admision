import { describe, expect, it } from 'vitest';
import { MiCuentaWebGateway, signKrAnswer } from '../../../src/modules/pagos/infrastructure/micuentaweb-gateway.js';

// Claves inventadas solo para la prueba.
const gw = new MiCuentaWebGateway({ environment: 'sandbox', shopId: '11111111', password: 'testpassword_x', publicKey: '11111111:testpublickey_x', hmacKey: 'hmac-de-prueba' });
const answer = JSON.stringify({
  orderStatus: 'PAID',
  orderDetails: { orderId: 'SIA000123', orderTotalAmount: 25000, orderCurrency: 'PEN' },
  transactions: [{ uuid: 'abc123', detailedStatus: 'AUTHORISED', metadata: { transactionId: 'T2026000001' }, transactionDetails: { cardDetails: { pan: '497010XXXXXX0055', effectiveBrand: 'VISA', authorizationResponse: { authorizationNumber: '3fc116' } } } }],
});

describe('Izipay micuentaweb (kr-answer / kr-hash)', () => {
  it('acepta la respuesta del navegador firmada con la clave HMAC y la normaliza', () => {
    const r = gw.verify({ transactionId: 'T2026000001', payloadHttp: answer, signature: signKrAnswer(answer, 'hmac-de-prueba'), code: 'sha256_hmac' });
    expect(r).toMatchObject({ transactionId: 'T2026000001', approved: true, orderNumber: 'SIA000123', amount: '250.00', currency: 'PEN', operationNumber: 'abc123', authorizationCode: '3fc116', cardMasked: 'VISA 497010XXXXXX0055' });
  });

  it('rechaza una respuesta alterada o firmada con otra clave', () => {
    const forged = answer.replace('25000', '100');
    expect(gw.verify({ transactionId: 'T2026000001', payloadHttp: forged, signature: signKrAnswer(answer, 'hmac-de-prueba'), code: 'sha256_hmac' })).toBeNull();
    expect(gw.verify({ transactionId: 'T2026000001', payloadHttp: answer, signature: signKrAnswer(answer, 'otra'), code: 'sha256_hmac' })).toBeNull();
  });

  it('la notificación instantánea (IPN) se verifica con la contraseña de la API REST', () => {
    const r = gw.verify({ transactionId: 'T2026000001', payloadHttp: answer, signature: signKrAnswer(answer, 'testpassword_x'), code: 'password' });
    expect(r?.approved).toBe(true);
    expect(gw.verify({ transactionId: 'T2026000001', payloadHttp: answer, signature: signKrAnswer(answer, 'testpassword_x'), code: 'sha256_hmac' })).toBeNull();
  });
});
