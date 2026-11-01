import { afterEach, describe, expect, it, vi } from 'vitest';
import { CulqiYapeGateway, parseCulqiCharge } from '../../../src/modules/pagos/infrastructure/culqi-gateway.js';

// Llaves inventadas solo para la prueba.
const gw = new CulqiYapeGateway({ publicKey: 'pk_test_prueba', secretKey: 'sk_test_prueba' });
const req = { transactionId: 'T2026000001', orderNumber: '2700001701', applicantCode: '27000017', amountCents: 25000, email: 'p@example.com', token: 'ype_test_abc', description: 'Admisión' };

afterEach(() => vi.unstubAllGlobals());

describe('Culqi: cargo con token de Yape (ADR-019)', () => {
  it('un cargo exitoso se normaliza como aprobado con medio YAPE y número de operación', () => {
    const r = parseCulqiCharge(201, {
      object: 'charge', id: 'chr_test_1', amount: 25000, currency_code: 'PEN', reference_code: 'REF123', authorization_code: 'AUT9',
      outcome: { type: 'venta_exitosa', code: 'AUT0000', user_message: 'Su compra ha sido exitosa.' },
    }, req);
    expect(r).toMatchObject({ transactionId: 'T2026000001', approved: true, inconclusive: false, amount: '250.00', currency: 'PEN', payMethod: 'YAPE', operationNumber: 'REF123', authorizationCode: 'AUT9', orderNumber: '2700001701' });
  });

  it('un rechazo de Culqi guarda el mensaje para el postulante', () => {
    const r = parseCulqiCharge(402, { object: 'error', type: 'card_error', decline_code: 'insufficient_funds', user_message: 'Saldo insuficiente.' }, req);
    expect(r).toMatchObject({ approved: false, inconclusive: false, code: 'insufficient_funds', message: 'Saldo insuficiente.' });
  });

  it('un error 5xx no dice si se cobró: queda sin resultado', () => {
    expect(parseCulqiCharge(503, {}, req)).toMatchObject({ approved: false, inconclusive: true });
  });

  it('envía el cargo con la llave secreta, en céntimos y con el token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ object: 'charge', id: 'chr_test_2', amount: 25000, currency_code: 'PEN', outcome: { type: 'venta_exitosa' } }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await gw.charge(req);
    expect(r.approved).toBe(true);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.culqi.com/v2/charges');
    expect(init.headers.Authorization).toBe('Bearer sk_test_prueba');
    expect(JSON.parse(init.body)).toMatchObject({ amount: 25000, currency_code: 'PEN', source_id: 'ype_test_abc', email: 'p@example.com', metadata: { transactionId: 'T2026000001' } });
    expect(gw.environment).toBe('sandbox');
  });

  it('sin conexión con Culqi responde 502 con un mensaje claro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(gw.charge(req)).rejects.toMatchObject({ status: 502 });
  });
});
