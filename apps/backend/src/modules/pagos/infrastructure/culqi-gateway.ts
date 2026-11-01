import { gatewayUnavailable } from '../../../shared/http/errors.js';
import type { ProviderResult } from '../domain/payment-rules.js';
import type { YapeChargeRequest, YapeGateway } from '../domain/ports.js';

export interface CulqiConfig {
  /** Llave pública (pk_test_… o pk_live_…): va al navegador para Culqi Checkout. */
  publicKey: string;
  /** Llave secreta (sk_test_… o sk_live_…): solo el servidor la usa para crear el cargo. */
  secretKey: string;
  apiUrl?: string | undefined;
}

/** Respuesta de `POST /v2/charges`: un cargo, o un error con mensajes para el comercio y para el cliente. */
interface CulqiCharge {
  object?: string;
  id?: string;
  amount?: number;
  currency_code?: string;
  reference_code?: string;
  authorization_code?: string;
  outcome?: { type?: string; code?: string; user_message?: string; merchant_message?: string };
  type?: string;
  code?: string;
  decline_code?: string;
  user_message?: string;
  merchant_message?: string;
}

/** Adaptador real de `YapeGateway` (ADR-019): cargo de Culqi con un token de Yape. */
export class CulqiYapeGateway implements YapeGateway {
  readonly provider = 'culqi' as const;
  readonly environment: 'sandbox' | 'production';
  private readonly apiUrl: string;

  constructor(private readonly cfg: CulqiConfig, private readonly timeoutMs = 15_000) {
    this.environment = cfg.secretKey.startsWith('sk_live') ? 'production' : 'sandbox';
    this.apiUrl = (cfg.apiUrl ?? 'https://api.culqi.com').replace(/\/$/, '');
  }

  get publicKey(): string {
    return this.cfg.publicKey;
  }

  async charge(r: YapeChargeRequest): Promise<ProviderResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let status: number;
    let body: CulqiCharge;
    try {
      const res = await fetch(`${this.apiUrl}/v2/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${this.cfg.secretKey}` },
        body: JSON.stringify({
          amount: r.amountCents,
          currency_code: 'PEN',
          email: r.email,
          source_id: r.token,
          description: r.description.slice(0, 80),
          metadata: { transactionId: r.transactionId, orderNumber: r.orderNumber, applicantCode: r.applicantCode },
        }),
        signal: controller.signal,
      });
      status = res.status;
      try {
        body = JSON.parse(await res.text()) as CulqiCharge;
      } catch {
        throw gatewayUnavailable(`Culqi respondió ${status} sin JSON.`);
      }
    } catch (error) {
      if ((error as { status?: number }).status) throw error;
      throw gatewayUnavailable('No pudimos comunicarnos con Culqi. Si se debitó tu Yape, Tesorería lo verificará; no vuelvas a pagar todavía.');
    } finally {
      clearTimeout(timer);
    }
    return parseCulqiCharge(status, body, r);
  }
}

/** Normaliza la respuesta del cargo (respuesta servidor a servidor con nuestra llave secreta: confiable sin firma). */
export function parseCulqiCharge(status: number, b: CulqiCharge, r: YapeChargeRequest): ProviderResult {
  const approved = status >= 200 && status < 300 && b.object === 'charge' && b.outcome?.type === 'venta_exitosa';
  // Un 5xx no dice si se cobró: el intento queda en proceso y Tesorería lo concilia.
  const inconclusive = status >= 500;
  return {
    transactionId: r.transactionId,
    approved,
    inconclusive,
    code: (approved ? b.outcome?.code : b.decline_code ?? b.code ?? b.outcome?.code) ?? String(status),
    message: (approved ? b.outcome?.user_message : b.user_message ?? b.outcome?.user_message) ?? (approved ? 'Pago aprobado' : 'Culqi no aprobó el pago con Yape.'),
    orderNumber: r.orderNumber,
    amount: typeof b.amount === 'number' ? (b.amount / 100).toFixed(2) : null,
    currency: b.currency_code ?? null,
    payMethod: 'YAPE',
    authorizationCode: b.authorization_code ?? null,
    operationNumber: b.reference_code ?? b.id ?? null,
    referenceNumber: b.id ?? null,
    cardMasked: null,
  };
}
