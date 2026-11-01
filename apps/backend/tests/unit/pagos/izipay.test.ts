import { afterEach, describe, expect, it, vi } from 'vitest';
import { IzipayPaymentGateway } from '../../../src/modules/pagos/infrastructure/izipay-gateway.js';
import { isValidSignature, parseIzipayPayload, signPayload } from '../../../src/modules/pagos/infrastructure/signature.js';
import { newTransactionId, orderNumberFor } from '../../../src/modules/pagos/domain/payment-rules.js';

const cfg = { environment: 'sandbox' as const, merchantCode: '4001234', apiKey: 'API-KEY-DE-PRUEBA-000000', hashKey: 'HASH-KEY-DE-PRUEBA' };

const payload = JSON.stringify({
  code: '00', message: 'Operación exitosa', messageUser: 'Operación exitosa', transactionId: '17370677285350',
  response: {
    payMethod: 'CARD',
    order: [{ payMethodAuthorization: 'CARD', codeAuth: '831000', currency: 'PEN', amount: '250.00', orderNumber: '2700001701', stateMessage: 'Autorizado', uniqueId: '1429383', referenceNumber: '6330602' }],
    card: { brand: 'MC', pan: '511842******6017' },
  },
});

afterEach(() => vi.unstubAllGlobals());

describe('Firma de Izipay (research R-04)', () => {
  it('base64(HMAC-SHA256(clave hash, payloadHttp)) se verifica y rechaza cualquier cambio', () => {
    const signature = signPayload(payload, cfg.hashKey);
    expect(signature).toMatch(/^[A-Za-z0-9+/]{43}=$/);
    expect(isValidSignature(payload, signature, cfg.hashKey)).toBe(true);
    expect(isValidSignature(payload.replace('250.00', '1.00'), signature, cfg.hashKey)).toBe(false);
    expect(isValidSignature(payload, signature, 'otra-clave')).toBe(false);
  });

  it('normaliza el payload: aprobado, operación, tarjeta enmascarada', () => {
    expect(parseIzipayPayload(payload, 'x')).toMatchObject({
      transactionId: '17370677285350', approved: true, inconclusive: false, orderNumber: '2700001701', amount: '250.00',
      payMethod: 'CARD', authorizationCode: '831000', operationNumber: '1429383', cardMasked: 'MC 511842******6017',
    });
    expect(parseIzipayPayload(JSON.stringify({ code: '021', message: 'Error de comunicación' }), 'x').inconclusive).toBe(true);
  });
});

describe('Pedido y transacción', () => {
  it('número de pedido de 10 caracteres y transactionId de 17 dígitos', () => {
    expect(orderNumberFor('27000017', 1)).toBe('2700001701');
    expect(newTransactionId(new Date('2026-10-25T15:00:00Z'), () => 0.1234)).toMatch(/^\d{17}$/);
  });
});

describe('IzipayPaymentGateway.createCheckout', () => {
  it('pide el token al sandbox con la clave de API y no la expone al navegador', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: '00', message: 'OK', response: { token: 'tok_'.padEnd(260, 'x') } })));
    vi.stubGlobal('fetch', fetchMock);
    const gw = new IzipayPaymentGateway({ ...cfg, rsaPublicKey: 'MIIB-PUBLICA', ipnUrl: 'https://api.example.edu.pe/api/v1/payments/izipay/notify' });
    const s = await gw.createCheckout({
      transactionId: '17614000000001234', orderNumber: '2700001701', amount: '250.00', currency: 'PEN', createdAt: new Date('2026-10-25T15:00:00Z'),
      buyer: { applicantCode: '27000017', firstNames: 'MARÍA', surnames: 'GUTIÉRREZ MENDOZA', email: 'm@example.com', mobile: '987654321', address: 'Jr. Lima 1', city: 'Huamanga', state: 'Ayacucho', documentType: 'DNI', documentNumber: '99900021' },
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://sandbox-api-pw.izipay.pe/security/v1/Token/Generate');
    expect(init.headers).toMatchObject({ transactionId: '17614000000001234' });
    expect(JSON.parse(init.body)).toEqual({ requestSource: 'ECOMMERCE', merchantCode: '4001234', orderNumber: '2700001701', publicKey: cfg.apiKey, amount: '250.00' });

    expect(s.scriptUrl).toBe('https://sandbox-checkout.izipay.pe/payments/v1/js/index.js');
    expect(s.keyRSA).toBe('MIIB-PUBLICA');
    expect(s.config).toMatchObject({ action: 'pay', merchantCode: '4001234', urlIPN: 'https://api.example.edu.pe/api/v1/payments/izipay/notify', render: { typeForm: 'pop-up' } });
    const browserJson = JSON.stringify(s);
    expect(browserJson).not.toContain(cfg.apiKey);
    expect(browserJson).not.toContain(cfg.hashKey);
  });

  it('token rechazado por Izipay → 502 GATEWAY_UNAVAILABLE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: '400', message: 'Estructura del request inválida.', response: {} }))));
    const gw = new IzipayPaymentGateway(cfg);
    await expect(gw.createCheckout({
      transactionId: '17614000000001234', orderNumber: '2700001701', amount: '250.00', currency: 'PEN', createdAt: new Date(),
      buyer: { applicantCode: '27000017', firstNames: 'A', surnames: 'B', email: 'a@b.pe', mobile: '987654321', address: 'x', city: 'x', state: 'x', documentType: 'DNI', documentNumber: '99900021' },
    })).rejects.toMatchObject({ status: 502, code: 'GATEWAY_UNAVAILABLE' });
  });
});
