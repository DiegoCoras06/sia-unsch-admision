/** Reloj inyectable (research R-03). Todo el código obtiene la hora de aquí, nunca de `new Date()`. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

/**
 * Reloj que arranca en una fecha simulada y avanza en tiempo real, para probar escenarios
 * ("hoy es 08/11/2026") sin congelar los temporizadores de sesión.
 */
export function shiftedClock(startAt: Date, realStart: number = Date.now()): Clock {
  const offset = startAt.getTime() - realStart;
  return { now: () => new Date(Date.now() + offset) };
}

/** Reloj totalmente fijo, para pruebas unitarias. */
export function fixedClock(at: Date | string): Clock {
  const date = typeof at === 'string' ? new Date(at) : at;
  return { now: () => new Date(date.getTime()) };
}

export const LIMA_TIME_ZONE = 'America/Lima';

/** ISO 8601 con desplazamiento de Lima (UTC−5, sin horario de verano): 2026-10-25T10:00:00-05:00 */
export function toLimaIso(date: Date): string {
  const lima = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  return `${lima.toISOString().slice(0, 19)}-05:00`;
}
