import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { ProviderResult } from '../domain/payment-rules.js';

/** Firma de Izipay: base64(HMAC-SHA256(clave hash, payloadHttp)), en UTF-8 (research R-04). */
export function signPayload(payloadHttp: string, hashKey: string): string {
  return createHmac('sha256', Buffer.from(hashKey, 'utf8')).update(Buffer.from(payloadHttp, 'utf8')).digest('base64');
}

export function isValidSignature(payloadHttp: string, signature: string, hashKey: string): boolean {
  if (!hashKey || !signature) return false;
  const expected = Buffer.from(signPayload(payloadHttp, hashKey));
  const given = Buffer.from(signature.trim());
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : typeof v === 'number' ? String(v) : null);

/**
 * Normaliza el contenido firmado de Izipay. Se parsea `payloadHttp` (lo único firmado),
 * nunca el objeto `response` que viaja al lado.
 */
export function parseIzipayPayload(payloadHttp: string, fallbackTransactionId: string): ProviderResult {
  const body = JSON.parse(payloadHttp) as {
    code?: unknown; message?: unknown; messageUser?: unknown; transactionId?: unknown;
    response?: { payMethod?: unknown; order?: Record<string, unknown>[]; card?: { pan?: unknown; brand?: unknown } };
  };
  const code = str(body.code) ?? '';
  const order = body.response?.order?.[0] ?? {};
  const approved = code === '00' && str(order['stateMessage'])?.toLowerCase() === 'autorizado';
  const brand = str(body.response?.card?.brand);
  const pan = str(body.response?.card?.pan);
  return {
    transactionId: str(body.transactionId) ?? fallbackTransactionId,
    approved,
    inconclusive: code === '021' || code === 'COMMUNICATION_ERROR',
    code,
    message: (str(body.messageUser) ?? str(body.message) ?? '').slice(0, 120),
    orderNumber: str(order['orderNumber']),
    amount: str(order['amount']),
    currency: str(order['currency']),
    payMethod: str(order['payMethodAuthorization']) ?? str(body.response?.payMethod),
    authorizationCode: str(order['codeAuth']),
    operationNumber: str(order['uniqueId']),
    referenceNumber: str(order['referenceNumber']),
    cardMasked: pan ? `${brand ? `${brand} ` : ''}${pan}`.slice(0, 30) : null,
  };
}
