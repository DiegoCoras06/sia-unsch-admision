import type { ProviderResult } from './payment-rules.js';

/** Datos de un intento que la pasarela necesita para abrir el formulario. */
export interface CheckoutRequest {
  transactionId: string;
  orderNumber: string;
  amount: string;
  currency: 'PEN';
  createdAt: Date;
  buyer: {
    applicantCode: string;
    firstNames: string;
    surnames: string;
    email: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    documentType: 'DNI' | 'CE';
    documentNumber: string;
  };
}

/** Lo que el navegador necesita para abrir el formulario certificado (sin claves secretas). */
export interface CheckoutSession {
  scriptUrl: string;
  authorization: string;
  keyRSA: string;
  config: Record<string, unknown>;
}

/** Mensaje firmado que llega por el navegador (respuesta del SDK) o por IPN. */
export interface SignedMessage {
  transactionId: string;
  payloadHttp: string;
  signature: string;
  code?: string | undefined;
}

/** Cargo con un token de Yape obtenido en el navegador (ADR-019). */
export interface YapeChargeRequest {
  transactionId: string;
  orderNumber: string;
  applicantCode: string;
  amountCents: number;
  email: string;
  token: string;
  description: string;
}

/** Puerto de la pasarela de Yape (ADR-019): el resultado lo da el cargo, servidor a servidor. */
export interface YapeGateway {
  readonly provider: 'culqi';
  readonly environment: 'sandbox' | 'production';
  /** Llave pública para Culqi Checkout en el navegador. */
  readonly publicKey: string;
  charge(request: YapeChargeRequest): Promise<ProviderResult>;
}

/** Puerto de la pasarela de pagos (ADR-007, ADR-016). */
export interface PaymentGateway {
  readonly provider: 'izipay' | 'micuentaweb' | 'mock';
  readonly environment: 'sandbox' | 'production' | 'simulated';
  /** Genera el token de sesión en el servidor; `null` en la simulada (el formulario lo dibuja la web). */
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession | null>;
  /** Verifica la firma y normaliza el contenido de `payloadHttp`; `null` si la firma no es válida. */
  verify(message: SignedMessage): ProviderResult | null;
  /** Consulta al proveedor el estado de un intento sin respuesta; `null` si no se puede saber. */
  query(attempt: { transactionId: string; orderNumber: string; amount: string }): Promise<ProviderResult | null>;
}
