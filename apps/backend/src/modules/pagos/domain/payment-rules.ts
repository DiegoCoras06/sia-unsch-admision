/** Reglas del módulo M04 Pagos (spec 005, ADR-024). */

export type AttemptStatus = 'INICIADO' | 'AUTORIZADO' | 'RECHAZADO' | 'VENCIDO' | 'DUPLICADO';
export type OrderStatus = 'PENDIENTE' | 'PAGADA';

/** Yape solo acepta pagos de hasta S/ 2000 (ADR-019). */
export const YAPE_MAX_AMOUNT = 2000;

/** Un intento de pago vale 20 minutos: tiempo de sobra para completar Culqi Checkout. */
export const ATTEMPT_TTL_SECONDS = 20 * 60;

export const ATTEMPT_LABEL: Record<AttemptStatus, string> = {
  INICIADO: 'En proceso',
  AUTORIZADO: 'Pago aprobado',
  RECHAZADO: 'Pago rechazado',
  VENCIDO: 'Sin respuesta (vencido)',
  DUPLICADO: 'Pago duplicado - se gestionará la devolución',
};

/** Montos con 2 decimales y punto, sin separador de miles. */
export function formatAmount(value: { toString(): string } | number): string {
  return Number(value.toString()).toFixed(2);
}

/**
 * Número de pedido (5–15 caracteres, único por intento): código de postulante + número de intento.
 * Ej.: 27000017 + 01 → "2700001701".
 */
export function orderNumberFor(applicantCode: string, attemptIndex: number): string {
  return `${applicantCode}${String(attemptIndex).padStart(2, '0')}`;
}

/** Id de transacción del comercio (5–40 caracteres): milisegundos + 4 dígitos aleatorios. */
export function newTransactionId(now: Date, random: () => number = Math.random): string {
  return `${now.getTime()}${String(Math.floor(random() * 10_000)).padStart(4, '0')}`;
}

/** Resultado normalizado del cargo en la pasarela. */
export interface ProviderResult {
  transactionId: string;
  approved: boolean;
  /** Error de comunicación: no hay resultado todavía (por ejemplo, un 5xx de Culqi). */
  inconclusive: boolean;
  code: string;
  message: string;
  orderNumber: string | null;
  amount: string | null;
  currency: string | null;
  payMethod: string | null;
  authorizationCode: string | null;
  operationNumber: string | null;
  referenceNumber: string | null;
  cardMasked: string | null;
}
