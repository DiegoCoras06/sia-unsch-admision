/** Reglas y catálogos de la inscripción pública (spec 003, aclaraciones del 25/10/2026; ADR-015). */

export const MARITAL_STATUS = { SOLTERO: 'Soltero(a)', CASADO: 'Casado(a)', CONVIVIENTE: 'Conviviente', DIVORCIADO: 'Divorciado(a)', VIUDO: 'Viudo(a)' } as const;
export const ECONOMIC_DEPENDENCY = { PADRES: 'De mis padres', PROPIA: 'Propia (trabajo)', OTROS_FAMILIARES: 'De otros familiares', OTROS: 'Otra' } as const;
export const PREPARATION = { ACADEMIA: 'Academia preuniversitaria', CEPRE_UNSCH: 'CEPRE-UNSCH', COLEGIO: 'Solo el colegio', AUTODIDACTA: 'Por mi cuenta', OTRA: 'Otra' } as const;
export const CAMPUSES = { HUAMANGA: 'Huamanga - Ciudad Universitaria (Ayacucho)' } as const;
export const MODALITIES = { ORD: 'Ordinario', EXO: 'Exonerados', CEPRE: 'Adjudicados CEPRE-UNSCH' } as const;

export type InscriptionStatus = 'PENDIENTE_PAGO' | 'PENDIENTE_VALIDACION' | 'APTA' | 'OBSERVADA' | 'ANULADA';

export const STATUS_LABEL: Record<InscriptionStatus, string> = {
  PENDIENTE_PAGO: 'Inscripción registrada - pendiente de pago',
  PENDIENTE_VALIDACION: 'Inscripción registrada - tus requisitos deben ser validados por la Dirección de Admisión',
  APTA: 'Apto para rendir el examen',
  OBSERVADA: 'Inscripción observada',
  ANULADA: 'Inscripción anulada',
};

/** Exonerados requieren validación de requisitos antes del pago (RN-24, Art. 9). */
export const initialStatus = (modality: 'ORD' | 'EXO' | 'CEPRE'): InscriptionStatus =>
  modality === 'EXO' ? 'PENDIENTE_VALIDACION' : 'PENDIENTE_PAGO';

/** "99900020" → "9990••20" */
export const maskDocument = (doc: string): string =>
  doc.length <= 4 ? doc : `${doc.slice(0, 4)}${'•'.repeat(Math.max(0, doc.length - 6))}${doc.slice(-2)}`;

export const PHOTO = { width: 240, height: 320, maxBytes: 2 * 1024 * 1024 } as const;

/** Año de egreso razonable: hasta 60 años atrás y como máximo dos años adelante (quienes cursan 4.º/5.º). */
export const isPlausibleGraduationYear = (year: number, now: Date): boolean =>
  year >= now.getUTCFullYear() - 60 && year <= now.getUTCFullYear() + 2;

export const PAYMENT_ENTITIES = ['Santa María Magdalena', 'Banco de la Nación', 'Interbank'];
