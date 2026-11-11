import type { ProviderResult } from './payment-rules.js';

/** Cargo con el token que entregó Culqi Checkout en el navegador: de tarjeta (`tkn_…`) o de Yape (`ype_…`), ADR-024. */
export interface ChargeRequest {
  transactionId: string;
  orderNumber: string;
  applicantCode: string;
  amountCents: number;
  email: string;
  token: string;
  description: string;
}

/**
 * Puerto de la pasarela de pagos (ADR-007, ADR-024). El navegador solo obtiene un token; el cobro lo hace el servidor
 * con su llave secreta y su respuesta (servidor a servidor) es el resultado del pago.
 */
export interface PaymentGateway {
  readonly provider: 'culqi' | 'mock';
  readonly environment: 'sandbox' | 'production' | 'simulated';
  /** Llave pública para Culqi Checkout en el navegador (nunca la secreta). */
  readonly publicKey: string;
  /** ¿El token tiene el formato que emite esta pasarela? Se revisa antes de cobrar. */
  acceptsToken(token: string): boolean;
  charge(request: ChargeRequest): Promise<ProviderResult>;
}
