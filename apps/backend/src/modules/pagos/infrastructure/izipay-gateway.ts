import { gatewayUnavailable } from '../../../shared/http/errors.js';
import type { ProviderResult } from '../domain/payment-rules.js';
import type { CheckoutRequest, CheckoutSession, PaymentGateway, SignedMessage } from '../domain/ports.js';
import { isValidSignature, parseIzipayPayload } from './signature.js';

export interface IzipayConfig {
  environment: 'sandbox' | 'production';
  apiUrl?: string | undefined;
  merchantCode: string;
  /** «Clave de API del nuevo botón de pagos»: solo genera el token de sesión (campo `publicKey` del API). */
  apiKey: string;
  hashKey: string;
  /** Clave pública RSA del panel; es pública por diseño (va al navegador como `keyRSA`). */
  rsaPublicKey?: string | undefined;
  /** URL pública de la API para la notificación IPN; sin ella Izipay usa la del panel. */
  ipnUrl?: string | undefined;
}

const API = { sandbox: 'https://sandbox-api-pw.izipay.pe', production: 'https://api-pw.izipay.pe' };
const SDK = {
  sandbox: 'https://sandbox-checkout.izipay.pe/payments/v1/js/index.js',
  production: 'https://checkout.izipay.pe/payments/v1/js/index.js',
};

/** Adaptador real del puerto PaymentGateway: nuevo botón de pagos de Izipay (research R-02 a R-06). */
export class IzipayPaymentGateway implements PaymentGateway {
  readonly provider = 'izipay' as const;
  readonly environment: 'sandbox' | 'production';
  private readonly apiUrl: string;

  constructor(private readonly cfg: IzipayConfig, private readonly timeoutMs = 15_000) {
    this.environment = cfg.environment;
    this.apiUrl = (cfg.apiUrl ?? API[cfg.environment]).replace(/\/$/, '');
  }

  async createCheckout(r: CheckoutRequest): Promise<CheckoutSession> {
    const authorization = await this.sessionToken(r.transactionId, r.orderNumber, r.amount);
    const person = {
      firstName: r.buyer.firstNames.slice(0, 50),
      lastName: r.buyer.surnames.slice(0, 50),
      email: r.buyer.email,
      phoneNumber: r.buyer.mobile,
      street: r.buyer.address.slice(0, 100),
      city: r.buyer.city.slice(0, 50),
      state: r.buyer.state.slice(0, 50),
      country: 'PE',
      postalCode: '05001',
      documentType: r.buyer.documentType,
      document: r.buyer.documentNumber,
    };
    return {
      scriptUrl: SDK[this.environment],
      authorization,
      keyRSA: this.cfg.rsaPublicKey?.trim() || 'RSA',
      config: {
        transactionId: r.transactionId,
        action: 'pay',
        merchantCode: this.cfg.merchantCode,
        order: {
          orderNumber: r.orderNumber,
          currency: r.currency,
          amount: r.amount,
          processType: 'AT',
          merchantBuyerId: r.buyer.applicantCode,
          dateTimeTransaction: `${r.createdAt.getTime()}000`,
        },
        billing: person,
        shipping: person,
        render: { typeForm: 'pop-up' },
        ...(this.cfg.ipnUrl ? { urlIPN: this.cfg.ipnUrl } : {}),
      },
    };
  }

  verify(message: SignedMessage): ProviderResult | null {
    if (!isValidSignature(message.payloadHttp, message.signature, this.cfg.hashKey)) return null;
    try {
      return parseIzipayPayload(message.payloadHttp, message.transactionId);
    } catch {
      return null;
    }
  }

  async query(attempt: { transactionId: string; orderNumber: string; amount: string }): Promise<ProviderResult | null> {
    try {
      const token = await this.sessionToken(attempt.transactionId, attempt.orderNumber, attempt.amount);
      const body = await this.post('/orderinfo/v1/Transaction/Search', attempt.transactionId, {
        merchantCode: this.cfg.merchantCode,
        numberOrden: attempt.orderNumber,
        language: 'ESP',
      }, token);
      // Respuesta servidor a servidor por HTTPS con nuestro token: confiable aunque no traiga firma.
      return parseIzipayPayload(JSON.stringify(body), attempt.transactionId);
    } catch {
      return null;
    }
  }

  private async sessionToken(transactionId: string, orderNumber: string, amount: string): Promise<string> {
    const body = await this.post('/security/v1/Token/Generate', transactionId, {
      requestSource: 'ECOMMERCE',
      merchantCode: this.cfg.merchantCode,
      orderNumber,
      publicKey: this.cfg.apiKey,
      amount,
    });
    const token = (body['response'] as { token?: unknown } | undefined)?.token;
    if (body['code'] !== '00' || typeof token !== 'string') {
      throw gatewayUnavailable(`Izipay no generó el token de sesión (${String(body['code'] ?? '')} ${String(body['message'] ?? '')}).`.trim());
    }
    return token;
  }

  private async post(path: string, transactionId: string, payload: object, bearer?: string): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.apiUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          transactionId,
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const text = await res.text();
      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw gatewayUnavailable(`Izipay respondió ${res.status} sin JSON.`);
      }
    } catch (error) {
      if ((error as { status?: number }).status) throw error;
      throw gatewayUnavailable('No pudimos comunicarnos con Izipay. Intenta de nuevo en unos minutos.');
    } finally {
      clearTimeout(timer);
    }
  }
}
