import type { ProviderResult } from '../domain/payment-rules.js';
import type { CheckoutRequest, PaymentGateway, SignedMessage } from '../domain/ports.js';
import { isValidSignature, parseIzipayPayload, signPayload } from './signature.js';

/**
 * Pasarela simulada (ADR-007): firma mensajes con el mismo formato de Izipay para que el
 * caso de uso de confirmación sea idéntico. Solo para pruebas y uso local sin credenciales.
 */
export class MockPaymentGateway implements PaymentGateway {
  readonly provider = 'mock' as const;
  readonly environment = 'simulated' as const;

  constructor(private readonly hashKey: string) {}

  async createCheckout(_request: CheckoutRequest): Promise<null> {
    return null;
  }

  verify(message: SignedMessage): ProviderResult | null {
    if (!isValidSignature(message.payloadHttp, message.signature, this.hashKey)) return null;
    try {
      return parseIzipayPayload(message.payloadHttp, message.transactionId);
    } catch {
      return null;
    }
  }

  async query(): Promise<null> {
    return null;
  }

  /** Lo que el formulario simulado entregaría al navegador al aprobar o rechazar. */
  complete(attempt: { transactionId: string; orderNumber: string; amount: string }, approve: boolean, now: Date): SignedMessage {
    const lima = new Date(now.getTime() - 5 * 3600_000).toISOString();
    const payloadHttp = JSON.stringify({
      code: approve ? '00' : 'N0',
      message: approve ? 'Operación exitosa' : 'Operación denegada',
      messageUser: approve ? 'Operación exitosa' : 'Tu banco rechazó la operación. Prueba con otra tarjeta.',
      messageUserEng: approve ? 'Successful' : 'Denied',
      transactionId: attempt.transactionId,
      response: {
        payMethod: 'CARD',
        order: [{
          payMethodAuthorization: 'CARD',
          codeAuth: approve ? String(now.getTime()).slice(-6) : '',
          currency: 'PEN',
          amount: attempt.amount,
          installment: '00',
          orderNumber: attempt.orderNumber,
          stateMessage: approve ? 'Autorizado' : 'Denegado',
          dateTransaction: lima.slice(0, 10).replace(/-/g, ''),
          timeTransaction: lima.slice(11, 19).replace(/:/g, ''),
          uniqueId: `SIM${String(now.getTime()).slice(-7)}`,
          referenceNumber: String(now.getTime()).slice(-7),
        }],
        card: { brand: 'VS', pan: '411111******1111' },
      },
    });
    return { transactionId: attempt.transactionId, payloadHttp, signature: signPayload(payloadHttp, this.hashKey), code: approve ? '00' : 'N0' };
  }
}
