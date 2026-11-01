const TZ = 'America/Lima';

/** "domingo 15 de noviembre" */
export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
}

/** "15 nov." */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { timeZone: TZ, day: 'numeric', month: 'short' });
}

/** "07 set. - 06 nov." o "11 nov." si es un solo día */
export function dateRange(startIso: string, endIso: string): string {
  const a = shortDate(startIso);
  const b = shortDate(endIso);
  return a === b ? a : `${a} - ${b}`;
}

export function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Fecha y hora compactas para tablas del panel: "26 oct. 2026, 9:06 p. m.". */
export function shortDateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('es-PE', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('es-PE', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time}`;
}

/** "S/ 250.00" */
export const soles = (amount: string) => `S/ ${amount}`;

export const STAGE_STATUS_LABEL = { UPCOMING: 'Próxima', IN_PROGRESS: 'En curso', FINISHED: 'Finalizada' } as const;

export const AREA_NAMES: Record<string, string> = { I: 'Ciencias', II: 'Letras', III: 'Biomédicas' };
