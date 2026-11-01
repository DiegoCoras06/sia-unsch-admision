/** Reglas del módulo M05 Pagos (spec 005, ADR-016). */

export type AttemptStatus = 'INICIADO' | 'AUTORIZADO' | 'RECHAZADO' | 'VENCIDO' | 'DUPLICADO';
export type OrderStatus = 'PENDIENTE' | 'PAGADA';

/** Yape solo acepta pagos de hasta S/ 2000 (ADR-019). */
export const YAPE_MAX_AMOUNT = 2000;

/** El token de sesión de Izipay vale 15 minutos; damos 5 más para que llegue la notificación. */
export const ATTEMPT_TTL_SECONDS = 20 * 60;

export const ATTEMPT_LABEL: Record<AttemptStatus, string> = {
  INICIADO: 'En proceso',
  AUTORIZADO: 'Pago aprobado',
  RECHAZADO: 'Pago rechazado',
  VENCIDO: 'Sin respuesta (vencido)',
  DUPLICADO: 'Pago duplicado - se gestionará la devolución',
};

/** Montos con 2 decimales y punto, sin separador de miles, como los pide Izipay. */
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

/** Resultado normalizado de un mensaje firmado del proveedor. */
export interface ProviderResult {
  transactionId: string;
  approved: boolean;
  /** Error de comunicación: no hay resultado todavía (Izipay `021` / `COMMUNICATION_ERROR`). */
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
