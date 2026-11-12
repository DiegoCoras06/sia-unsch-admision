/**
 * Reconoce cuando la base de datos no responde (red caída, RDS reiniciándose, conexiones agotadas).
 * No es un error del programa: la API responde 503 y el despachador en segundo plano espera sin llenar el registro.
 */
const CODES = new Set(['P1001', 'P1002', 'P1017', 'P2024']);

export function isDatabaseUnreachable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: unknown; meta?: { driverAdapterError?: { cause?: { kind?: unknown } } } };
  if (typeof e.code === 'string' && CODES.has(e.code)) return true;
  const kind = e.meta?.driverAdapterError?.cause?.kind;
  return kind === 'DatabaseNotReachable' || kind === 'DatabaseConnectionTimeout' || kind === 'ConnectionClosed';
}

/** Segundos que se sugieren al cliente antes de reintentar. */
export const DB_RETRY_AFTER_SECONDS = 10;
