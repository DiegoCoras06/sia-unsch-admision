/** Reglas del examen tomadas del reglamento (docs/reglas-negocio.md, RN-30 a RN-39). */

export const EXAM_STATUS_LABEL = {
  PROGRAMADO: 'Programado',
  DISTRIBUIDO: 'Distribución por confirmar',
  CONFIRMADO: 'Distribución confirmada',
  FINALIZADO: 'Asistencia cerrada',
} as const;

/** RN-30, RN-31: estructura por defecto del examen. */
export const DEFAULT_STRUCTURE = { conocimientos: 100, aptitudVocacional: 10, actitudPersonal: 10 };

/** RN-31 a RN-34: calificación provisional configurable (Tabla 5 pendiente). */
export const DEFAULT_SCORING = { puntosConocimientos: 9, puntosTest: 5, factorArea: 1, puntajeMaximo: 1000, puntajeMinimo: 450, incorrectasRestan: false };

/** RN-37, RN-38: lo que se lleva y lo prohibido (Art. 26). */
export const DEFAULT_INSTRUCTIONS = {
  llevar: ['DNI original vigente', 'Ficha de inscripción impresa con foto', 'Lápiz 2B, borrador y tajador'],
  prohibido: ['Celulares, relojes y cualquier equipo electrónico', 'Objetos metálicos y joyas', 'Lapiceros', 'Mochilas, carteras o bolsos', 'Ropa con capucha o de jean'],
  notas: 'Después de la hora de cierre no se permite el ingreso. Los resultados se publican el mismo día del examen.',
};

/** RN-39: la adecuación se pide por escrito al menos 72 h antes. */
export const ACCOMMODATION_HOURS = 72;

/** RN-35: la distribución se publica 24 h antes del examen. */
export const PUBLISH_HOURS_BEFORE = 24;

export const INCIDENT_TYPES = {
  DISPOSITIVO: 'Dispositivo electrónico',
  SUPLANTACION: 'Posible suplantación',
  DOCUMENTO: 'Documento alterado o falso',
  CONDUCTA: 'Conducta inapropiada',
  SALUD: 'Atención de salud',
  OTRO: 'Otro',
} as const;
export type IncidentType = keyof typeof INCIDENT_TYPES;

/** Intervalo en que un examen ocupa sus aulas: desde que abre el ingreso hasta que termina la prueba. */
export function occupiedWindow(e: { entryOpensAt: Date; entryClosesAt: Date; durationMinutes: number }): [number, number] {
  return [e.entryOpensAt.getTime(), e.entryClosesAt.getTime() + e.durationMinutes * 60_000];
}

export function overlaps(a: [number, number], b: [number, number]): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

/** Extrae el código de postulante de lo que escribe un lector de QR o una persona (enlace, token o código). */
export function codeFromScan(text: string): string | null {
  const t = text.trim();
  const m = /(?:^|[/=])(\d{8})(?:\.[\w-]+)?$/.exec(t) ?? /^(\d{8})$/.exec(t);
  return m?.[1] ?? null;
}
