import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ProviderResult } from '../domain/payment-rules.js';
import type { CheckoutRequest, CheckoutSession, PaymentGateway, SignedMessage } from '../domain/ports.js';

/**
 * Izipay «micuentaweb» (API REST V4 y formulario incrustado Krypton). Es otro producto de Izipay que el
 * «botón de pagos web»: se autentica con el identificador de la tienda y la contraseña de la API REST,
 * el navegador abre el formulario con la clave pública y la respuesta (`kr-answer`) llega firmada:
 *  - por el navegador, con HMAC-SHA-256 y la clave HMAC (`kr-hash-key = sha256_hmac`);
 *  - por la notificación instantánea (IPN), con HMAC-SHA-256 y la contraseña (`kr-hash-key = password`).
 */
export interface MiCuentaWebConfig {
  environment: 'sandbox' | 'production';
  /** Identificador de la tienda (usuario de la API REST). */
  shopId: string;
  /** Contraseña de la API REST (de test en el ambiente de pruebas). */
  password: string;
  /** Clave pública JavaScript: `tienda:testpublickey_…`. */
  publicKey: string;
  /** Clave HMAC-SHA-256 para verificar la respuesta del navegador. */
  hmacKey: string;
  apiUrl?: string | undefined;
  /** URL pública HTTPS para la notificación instantánea (IPN); sin ella se confirma con la respuesta del navegador. */
  ipnUrl?: string | undefined;
}

const SCRIPT = 'https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js';
const THEME = 'https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic';

interface KrTransaction {
  uuid?: string; detailedStatus?: string; errorCode?: string | null; errorMessage?: string | null; detailedErrorMessage?: string | null;
  metadata?: Record<string, unknown> | null; paymentMethodType?: string;
  transactionDetails?: { cardDetails?: { pan?: string; effectiveBrand?: string; authorizationResponse?: { authorizationNumber?: string | null } } };
}
interface KrAnswer {
  orderStatus?: string; orderCycle?: string;
  orderDetails?: { orderId?: string; orderTotalAmount?: number; orderCurrency?: string; metadata?: Record<string, unknown> | null };
  transactions?: KrTransaction[];
}

export class MiCuentaWebGateway implements PaymentGateway {
  readonly provider = 'micuentaweb' as const;
  readonly environment: 'sandbox' | 'production';
  private readonly api: string;

  constructor(private readonly cfg: MiCuentaWebConfig) {
    this.environment = cfg.environment;
    this.api = (cfg.apiUrl ?? 'https://api.micuentaweb.pe').replace(/\/$/, '');
  }

  async createCheckout(r: CheckoutRequest): Promise<CheckoutSession> {
    const body = await this.call('/api-payment/V4/Charge/CreatePayment', {
      amount: Math.round(Number(r.amount) * 100),
      currency: r.currency,
      orderId: r.orderNumber,
      formAction: 'PAYMENT',
      metadata: { transactionId: r.transactionId, applicantCode: r.buyer.applicantCode },
      ...(this.cfg.ipnUrl ? { ipnTargetUrl: this.cfg.ipnUrl } : {}),
      customer: {
        email: r.buyer.email,
        reference: r.buyer.applicantCode,
        billingDetails: {
          firstName: r.buyer.firstNames, lastName: r.buyer.surnames, cellPhoneNumber: r.buyer.mobile,
          identityType: r.buyer.documentType, identityCode: r.buyer.documentNumber,
          address: r.buyer.address.slice(0, 120), city: r.buyer.city, state: r.buyer.state, country: 'PE', language: 'ES',
        },
      },
    });
    const formToken = (body['answer'] as { formToken?: string } | undefined)?.formToken;
    if (!formToken) throw new Error('micuentaweb no devolvió el formToken');
    return { scriptUrl: SCRIPT, authorization: formToken, keyRSA: this.cfg.publicKey, config: { kind: 'krypton', theme: THEME, language: 'es-ES' } };
  }

  /** `payloadHttp` es el `kr-answer` tal cual; `code` indica con qué clave se firmó. */
  verify(message: SignedMessage): ProviderResult | null {
    const key = message.code === 'password' ? this.cfg.password : this.cfg.hmacKey;
    if (!key || !isValidHex(message.payloadHttp, message.signature, key)) return null;
    try {
      return parseKrAnswer(JSON.parse(message.payloadHttp) as KrAnswer, message.transactionId);
    } catch {
      return null;
    }
  }

  async query(attempt: { transactionId: string; orderNumber: string; amount: string }): Promise<ProviderResult | null> {
    try {
      const body = await this.call('/api-payment/V4/Order/Get', { orderId: attempt.orderNumber });
      const answer = body['answer'] as { transactions?: KrTransaction[] } | undefined;
      const tx = answer?.transactions?.find((t) => t.metadata?.['transactionId'] === attempt.transactionId);
      if (!tx) return null;
      const paid = tx.detailedStatus === 'AUTHORISED' || tx.detailedStatus === 'CAPTURED';
      return parseKrAnswer({ orderStatus: paid ? 'PAID' : 'UNPAID', orderDetails: { orderId: attempt.orderNumber, orderTotalAmount: Math.round(Number(attempt.amount) * 100), orderCurrency: 'PEN' }, transactions: [tx] }, attempt.transactionId);
    } catch {
      return null;
    }
  }

  private async call(path: string, payload: object): Promise<Record<string, unknown>> {
    const auth = Buffer.from(`${this.cfg.shopId}:${this.cfg.password}`).toString('base64');
    const res = await fetch(`${this.api}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || body['status'] !== 'SUCCESS') {
      const a = body['answer'] as { errorCode?: string; errorMessage?: string } | undefined;
      throw new Error(`micuentaweb ${path}: ${a?.errorCode ?? res.status} ${a?.errorMessage ?? ''}`.trim());
    }
    return body;
  }
}

/** kr-hash = HMAC-SHA-256(clave, kr-answer) en hexadecimal. */
export function signKrAnswer(answer: string, key: string): string {
  return createHmac('sha256', Buffer.from(key, 'utf8')).update(Buffer.from(answer, 'utf8')).digest('hex');
}

function isValidHex(answer: string, hash: string, key: string): boolean {
  const expected = Buffer.from(signKrAnswer(answer, key));
  const given = Buffer.from(hash.trim().toLowerCase());
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function parseKrAnswer(a: KrAnswer, fallbackTransactionId: string): ProviderResult {
  const tx = a.transactions?.[0];
  const card = tx?.transactionDetails?.cardDetails;
  const status = a.orderStatus ?? '';
  const meta = tx?.metadata ?? a.orderDetails?.metadata ?? {};
  const cents = a.orderDetails?.orderTotalAmount;
  return {
    transactionId: typeof meta['transactionId'] === 'string' ? meta['transactionId'] : fallbackTransactionId,
    approved: status === 'PAID',
    inconclusive: status === 'RUNNING',
    code: tx?.detailedStatus ?? status,
    message: tx?.detailedErrorMessage ?? tx?.errorMessage ?? (status === 'PAID' ? 'Pago autorizado' : 'Pago no autorizado'),
    orderNumber: a.orderDetails?.orderId ?? null,
    amount: typeof cents === 'number' ? (cents / 100).toFixed(2) : null,
    currency: a.orderDetails?.orderCurrency ?? null,
    payMethod: tx?.paymentMethodType ?? 'CARD',
    authorizationCode: card?.authorizationResponse?.authorizationNumber ?? null,
    operationNumber: tx?.uuid ?? null,
    referenceNumber: null,
    cardMasked: card?.pan ? `${card.effectiveBrand ?? ''} ${card.pan}`.trim() : null,
  };
}
