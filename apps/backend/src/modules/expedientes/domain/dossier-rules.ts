/** Reglas del expediente de exonerados (spec 004). */

export type DossierStatus = 'BORRADOR' | 'EN_REVISION' | 'OBSERVADO' | 'AUTORIZADO' | 'RECHAZADO' | 'NO_SUBSANADO';

export const DOSSIER_STATUS_LABEL: Record<DossierStatus, string> = {
  BORRADOR: 'Por enviar',
  EN_REVISION: 'En revisión',
  OBSERVADO: 'Observado: subsana los documentos marcados',
  AUTORIZADO: 'Autorizado: ya puedes pagar',
  RECHAZADO: 'Rechazado',
  NO_SUBSANADO: 'No subsanado dentro del plazo',
};

/** Plazo para subsanar: 72 horas, sin pasar el cierre de la inscripción de exonerados (H3, escenario 4). */
export const OBSERVE_HOURS = 72;

/**
 * Datos complementarios propios de cada submodalidad (FR-014). Se piden en el expediente y los ve el evaluador.
 */
export const COMPLEMENTARY_FIELDS: Record<string, { key: string; label: string; type?: 'number' }[]> = {
  'EXO-DIS': [{ key: 'tipoDiscapacidad', label: 'Tipo de discapacidad' }, { key: 'adecuaciones', label: 'Adecuaciones que necesitas para el examen (RN-39)' }],
  'EXO-PSP': [{ key: 'puesto', label: 'Puesto obtenido (1 o 2)', type: 'number' }, { key: 'ambito', label: 'Ámbito del colegio (urbano o rural)' }],
  'EXO-COAR': [{ key: 'puntajeIB', label: 'Puntaje del Bachillerato Internacional', type: 'number' }],
  'EXO-DEP': [{ key: 'disciplina', label: 'Disciplina deportiva' }, { key: 'federacion', label: 'Federación que te acredita' }],
  'EXO-GRA': [{ key: 'universidadOrigen', label: 'Universidad de origen' }, { key: 'gradoTitulo', label: 'Grado o título obtenido' }],
  'EXO-TRI': [{ key: 'programaOrigen', label: 'Programa de origen en la UNSCH' }, { key: 'creditosAprobados', label: 'Créditos aprobados', type: 'number' }],
  'EXO-TEN': [{ key: 'universidadOrigen', label: 'Universidad de origen' }, { key: 'creditosAprobados', label: 'Créditos aprobados', type: 'number' }],
  'EXO-TEI': [{ key: 'universidadOrigen', label: 'Universidad de origen (extranjera)' }, { key: 'pais', label: 'País' }, { key: 'creditosAprobados', label: 'Créditos aprobados', type: 'number' }],
  'EXO-VIC': [{ key: 'registroRUV', label: 'Número de inscripción en el Registro Único de Víctimas' }],
  'EXO-PIN': [{ key: 'pueblo', label: 'Pueblo indígena (andino o amazónico)' }, { key: 'comunidad', label: 'Comunidad de procedencia' }],
};

/** Alternativa reglamentaria que se sugiere al rechazar (H3, escenario 5). */
export const REJECTION_HINT = 'Puedes postular por otra submodalidad que cumplas o por la modalidad Ordinario mientras su inscripción siga abierta.';
