import type { ProviderResult } from '../domain/payment-rules.js';
import type { ChargeRequest, PaymentGateway } from '../domain/ports.js';

/** Tokens de la pasarela simulada: los entrega el recuadro «Pasarela simulada» del portal. */
export const MOCK_TOKENS = {
  card: 'mock_tarjeta_aprobada',
  yape: 'mock_yape_aprobado',
  rejected: 'mock_rechazado',
} as const;

/**
 * Pasarela simulada (ADR-007): para desarrollo y pruebas sin Culqi. Cobra como Culqi, servidor a servidor,
 * y su resultado depende del token que eligió la persona en el recuadro simulado.
 */
export class MockPaymentGateway implements PaymentGateway {
  readonly provider = 'mock' as const;
  readonly environment = 'simulated' as const;
  readonly publicKey = 'pk_simulada';
  private seq = 0;

  acceptsToken(token: string): boolean {
    return (Object.values(MOCK_TOKENS) as string[]).includes(token);
  }

  async charge(r: ChargeRequest): Promise<ProviderResult> {
    const approved = r.token !== MOCK_TOKENS.rejected;
    const yape = r.token === MOCK_TOKENS.yape;
    this.seq += 1;
    return {
      transactionId: r.transactionId,
      approved,
      inconclusive: false,
      code: approved ? 'AUT0000' : 'card_declined',
      message: approved ? 'Pago aprobado (simulado)' : 'Pago rechazado por la pasarela simulada',
      orderNumber: r.orderNumber,
      amount: (r.amountCents / 100).toFixed(2),
      currency: 'PEN',
      payMethod: yape ? 'YAPE' : 'CARD',
      authorizationCode: approved ? String(100000 + this.seq) : null,
      operationNumber: approved ? `SIM${r.transactionId.slice(-8)}` : null,
      referenceNumber: null,
      cardMasked: approved && !yape ? 'Visa 411111******1111' : null,
    };
  }
}
