// Datos de la convocatoria 2027-I. Fuente única: docs/reglas-negocio.md (Prospecto de Admisión 2027-I).
// Fechas en hora de Lima (UTC−5, sin horario de verano) - research R-03.

export const call = {
  code: '2027-I',
  name: 'Concurso de Admisión 2027-I',
  year: 2027,
  period: 'I',
  publishedAt: '2026-09-01T00:00:00-05:00',
};

const day = (d: string) => ({ startsAt: `${d}T00:00:00-05:00`, endsAt: `${d}T23:59:59.999-05:00` });
const range = (from: string, to: string) => ({ startsAt: `${from}T00:00:00-05:00`, endsAt: `${to}T23:59:59.999-05:00` });

type Scope = 'ORD' | 'EXO' | 'CEPRE' | 'REINS' | 'ALL';
type Kind = 'REGULAR' | 'EXTEMPORANEOUS' | 'EXAM' | 'PUBLICATION' | 'DELIVERY' | 'OTHER';

/** 13 etapas de la Tabla N.° 2 (reglas-negocio.md §4). */
export const stages: { code: string; name: string; scope: Scope; kind: Kind; startsAt: string; endsAt: string; highlight?: boolean }[] = [
  { code: 'ORD_REGULAR', name: 'Inscripción regular - Ordinario', scope: 'ORD', kind: 'REGULAR', ...range('2026-09-07', '2026-11-06') },
  { code: 'ORD_FICHA', name: 'Impresión de ficha - Ordinario regular', scope: 'ORD', kind: 'OTHER', ...range('2026-09-07', '2026-11-06') },
  { code: 'ORD_EXTEMP', name: 'Inscripción extemporánea - Ordinario', scope: 'ORD', kind: 'EXTEMPORANEOUS', ...range('2026-11-07', '2026-11-14') },
  { code: 'EXO_REGULAR', name: 'Inscripción regular - Exonerados (validación presencial, pago y ficha)', scope: 'EXO', kind: 'REGULAR', ...range('2026-09-07', '2026-10-30') },
  { code: 'EXO_EXTEMP', name: 'Inscripción extemporánea - Exonerados', scope: 'EXO', kind: 'EXTEMPORANEOUS', ...range('2026-10-31', '2026-11-09') },
  { code: 'CEPRE_ADJ', name: 'Adjudicación de vacantes CEPRE-UNSCH (ciclos 2027-I y 2027-II)', scope: 'CEPRE', kind: 'OTHER', ...day('2026-11-11') },
  { code: 'CEPRE_REGULAR', name: 'Inscripción de adjudicados CEPRE-UNSCH', scope: 'CEPRE', kind: 'REGULAR', ...range('2026-11-11', '2026-11-12') },
  { code: 'CEPRE_EXTEMP', name: 'Inscripción extemporánea de adjudicados CEPRE-UNSCH', scope: 'CEPRE', kind: 'EXTEMPORANEOUS', ...day('2026-11-13') },
  { code: 'EXAM_EXO', name: 'Examen de admisión - modalidad Exonerados', scope: 'EXO', kind: 'EXAM', startsAt: '2026-11-15T07:00:00-05:00', endsAt: '2026-11-15T23:59:59.999-05:00', highlight: true },
  { code: 'REINS', name: 'Reinscripción de exonerados no admitidos al examen Ordinario', scope: 'REINS', kind: 'REGULAR', ...range('2026-11-16', '2026-11-17') },
  { code: 'EXAM_ORD', name: 'Examen de admisión - modalidad Ordinario', scope: 'ORD', kind: 'EXAM', startsAt: '2026-11-22T06:30:00-05:00', endsAt: '2026-11-22T23:59:59.999-05:00', highlight: true },
  { code: 'DELIVERY', name: 'Entrega de requisitos y constancia de ingreso (según programa)', scope: 'ALL', kind: 'DELIVERY', ...range('2026-11-24', '2026-12-02') },
  { code: 'DELIVERY_EXT', name: 'Entrega extemporánea de requisitos y constancia de ingreso', scope: 'ALL', kind: 'DELIVERY', ...day('2026-12-03') },
];

/** Cuadro de vacantes: una fila por opción P01–P40, columnas en el orden de catalog.quotaCategories. */
export const vacancyMatrix: Record<string, number[]> = {
  P01: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P02: [15, 1, 1, 1, 1, 3, 3, 1, 1, 1, 0, 0, 1, 1, 1, 1],
  P03: [8, 1, 1, 1, 1, 2, 2, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  P04: [8, 1, 1, 1, 1, 2, 2, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  P05: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P06: [29, 1, 1, 1, 1, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P07: [8, 1, 1, 0, 1, 2, 2, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  P08: [8, 1, 0, 1, 1, 2, 2, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  P09: [8, 1, 1, 0, 1, 2, 2, 0, 0, 0, 0, 1, 0, 1, 0, 0],
  P10: [8, 1, 0, 1, 1, 2, 2, 1, 1, 0, 0, 0, 1, 0, 1, 1],
  P11: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P12: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P13: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P14: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P15: [20, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P16: [15, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P17: [15, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P18: [20, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P19: [32, 2, 1, 1, 1, 6, 6, 1, 1, 1, 1, 1, 1, 2, 2, 1],
  P20: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P21: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P22: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P23: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P24: [30, 2, 1, 1, 1, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P25: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P26: [20, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P27: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P28: [33, 2, 1, 1, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P29: [20, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P30: [15, 1, 1, 1, 0, 3, 3, 1, 0, 0, 0, 1, 1, 1, 1, 1],
  P31: [20, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P32: [20, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P33: [20, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  P34: [20, 1, 2, 2, 2, 4, 4, 2, 2, 1, 1, 1, 1, 3, 3, 1],
  P35: [35, 2, 2, 2, 1, 7, 7, 1, 1, 1, 1, 1, 1, 1, 4, 1],
  P36: [15, 1, 1, 1, 1, 3, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1],
  P37: [17, 1, 1, 1, 1, 3, 3, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  P38: [33, 2, 2, 3, 2, 7, 7, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  P39: [18, 1, 1, 1, 1, 4, 4, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  P40: [20, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
};

/** Totales oficiales del cuadro para verificar la semilla (SC-003). */
export const officialTotals = {
  byColumn: [926, 57, 42, 42, 41, 189, 189, 34, 32, 30, 29, 36, 37, 39, 42, 38],
  total: 1803,
};

type FeeSeed = { code: string; concept: string; amount: string; kind: 'BASE' | 'SURCHARGE' | 'OTHER'; legal: string };

/** Tabla N.° 3 + recargo CEPRE extemporáneo (aclaración 25/10/2026) + corrección de datos (portal). */
export const fees: FeeSeed[] = [
  { code: 'T-1.1E', concept: 'Ordinario - colegio estatal', amount: '250.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 1.1' },
  { code: 'T-1.1P', concept: 'Ordinario - colegio particular', amount: '300.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 1.1' },
  { code: 'T-1.2E', concept: 'Personal del servicio militar acuartelado - colegio estatal', amount: '125.00', kind: 'BASE', legal: '50 % de descuento - Art. 54, Ley 29248' },
  { code: 'T-1.2P', concept: 'Personal del servicio militar acuartelado - colegio particular', amount: '150.00', kind: 'BASE', legal: '50 % de descuento - Art. 54, Ley 29248' },
  { code: 'T-1.3E', concept: 'Licenciado del servicio militar acuartelado - colegio estatal', amount: '187.50', kind: 'BASE', legal: '25 % de descuento - Art. 61, Ley 29248' },
  { code: 'T-1.3P', concept: 'Licenciado del servicio militar acuartelado - colegio particular', amount: '225.00', kind: 'BASE', legal: '25 % de descuento - Art. 61, Ley 29248' },
  { code: 'T-2.1E', concept: 'Exonerados: 1.º y 2.º puesto de secundaria y COAR - colegio estatal', amount: '250.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.1' },
  { code: 'T-2.1P', concept: 'Exonerados: 1.º y 2.º puesto de secundaria y COAR - colegio particular', amount: '300.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.1' },
  { code: 'T-2.2', concept: 'Adjudicados del Centro Preuniversitario', amount: '335.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.2' },
  { code: 'T-2.3', concept: 'Deportistas calificados (Ley 28036)', amount: '300.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.3' },
  { code: 'T-2.4', concept: 'Víctimas del terrorismo (Ley 27277) - solo prospecto', amount: '30.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.4' },
  { code: 'T-2.5', concept: 'Afectados por la violencia sociopolítica (Ley 28592) - solo prospecto', amount: '30.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.5' },
  { code: 'T-2.6', concept: 'Personas con discapacidad', amount: '250.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.6' },
  { code: 'T-2.7', concept: 'Integrantes de pueblos indígenas andino/amazónicos', amount: '250.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.7' },
  { code: 'T-2.8', concept: 'Graduados y/o titulados de nivel universitario', amount: '485.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.8' },
  { code: 'T-2.9', concept: 'Traslado interno', amount: '250.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.9' },
  { code: 'T-2.10', concept: 'Traslado externo nacional', amount: '380.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.10' },
  { code: 'T-2.11', concept: 'Traslado externo internacional', amount: '425.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 2.11' },
  { code: 'T-2.12', concept: 'Constancia de ingreso', amount: '15.00', kind: 'OTHER', legal: 'Tabla N.° 3, ítem 2.12' },
  { code: 'T-3', concept: 'Vínculo familiar de primer grado con servidores de la UNSCH - solo prospecto', amount: '30.00', kind: 'BASE', legal: 'Tabla N.° 3, ítem 3 · Art. 15' },
  { code: 'T-4', concept: 'Recargo por inscripción extemporánea', amount: '65.00', kind: 'SURCHARGE', legal: 'Tabla N.° 3, ítem 4' },
  { code: 'T-CEPRE-EXT', concept: 'Recargo por inscripción extemporánea - adjudicados CEPRE', amount: '50.00', kind: 'SURCHARGE', legal: 'Cronograma, ítem 6.3' },
  { code: 'T-5', concept: 'Reinscripción de postulantes no admitidos en exonerados', amount: '180.00', kind: 'OTHER', legal: 'Tabla N.° 3, ítem 5' },
  { code: 'T-6', concept: 'Recargo por recepción extemporánea de requisitos y constancia de ingreso', amount: '65.00', kind: 'OTHER', legal: 'Tabla N.° 3, ítem 6' },
  { code: 'T-7', concept: 'Corrección de datos o fotografía (caja UNSCH)', amount: '15.00', kind: 'OTHER', legal: 'Relación de observados' },
];

type RuleSeed = { fee: string; modality: string; sub?: string; school?: 'ESTATAL' | 'PARTICULAR'; military?: 'ACTIVE' | 'DISCHARGED'; family?: boolean; priority: number };

/** Reglas de tasa base: gana la coincidente con mayor prioridad (research R-05). `*` = cualquier modalidad. */
export const feeRules: RuleSeed[] = [
  { fee: 'T-1.1E', modality: 'ORD', school: 'ESTATAL', priority: 10 },
  { fee: 'T-1.1P', modality: 'ORD', school: 'PARTICULAR', priority: 10 },
  { fee: 'T-1.2E', modality: 'ORD', school: 'ESTATAL', military: 'ACTIVE', priority: 20 },
  { fee: 'T-1.2P', modality: 'ORD', school: 'PARTICULAR', military: 'ACTIVE', priority: 20 },
  { fee: 'T-1.3E', modality: 'ORD', school: 'ESTATAL', military: 'DISCHARGED', priority: 20 },
  { fee: 'T-1.3P', modality: 'ORD', school: 'PARTICULAR', military: 'DISCHARGED', priority: 20 },
  { fee: 'T-2.1E', modality: 'EXO', sub: 'EXO-PSP', school: 'ESTATAL', priority: 10 },
  { fee: 'T-2.1P', modality: 'EXO', sub: 'EXO-PSP', school: 'PARTICULAR', priority: 10 },
  { fee: 'T-2.1E', modality: 'EXO', sub: 'EXO-COAR', school: 'ESTATAL', priority: 10 },
  { fee: 'T-2.1P', modality: 'EXO', sub: 'EXO-COAR', school: 'PARTICULAR', priority: 10 },
  { fee: 'T-2.2', modality: 'CEPRE', priority: 10 },
  { fee: 'T-2.3', modality: 'EXO', sub: 'EXO-DEP', priority: 10 },
  { fee: 'T-2.4', modality: 'EXO', sub: 'EXO-VIC', priority: 10 },
  { fee: 'T-2.6', modality: 'EXO', sub: 'EXO-DIS', priority: 10 },
  { fee: 'T-2.7', modality: 'EXO', sub: 'EXO-PIN', priority: 10 },
  { fee: 'T-2.8', modality: 'EXO', sub: 'EXO-GRA', priority: 10 },
  { fee: 'T-2.9', modality: 'EXO', sub: 'EXO-TRI', priority: 10 },
  { fee: 'T-2.10', modality: 'EXO', sub: 'EXO-TEN', priority: 10 },
  { fee: 'T-2.11', modality: 'EXO', sub: 'EXO-TEI', priority: 10 },
  { fee: 'T-3', modality: '*', family: true, priority: 100 },
];

/** Recargos por etapa extemporánea en curso (research R-05). */
export const surchargeRules: { fee: string; scope: 'ORD' | 'EXO' | 'CEPRE'; priority: number }[] = [
  { fee: 'T-4', scope: 'ORD', priority: 10 },
  { fee: 'T-4', scope: 'EXO', priority: 10 },
  { fee: 'T-CEPRE-EXT', scope: 'CEPRE', priority: 20 },
];

type ReqSeed = { code: string; name: string; description: string; article: string; base?: boolean; formats?: string[] };

/** Documentos de los Art. 36–49 (reglas-negocio.md §6). */
export const requirements: ReqSeed[] = [
  { code: 'BASE-CERT-SEC', name: 'Certificado de estudios secundarios original', description: 'Sin enmendaduras, firmado por el director. Si no es digital: con fotografía reciente y visado por la UGEL, antigüedad no mayor de 3 años. Del extranjero: convalidado o revalidado por el MINEDU.', article: 'Art. 36', base: true },
  { code: 'BASE-DNI', name: 'DNI vigente: original y copia a color ampliada', description: 'Documento Nacional de Identidad vigente.', article: 'Art. 36', base: true },
  { code: 'BASE-PARTIDA', name: 'Partida de nacimiento original', description: 'Partida de nacimiento original.', article: 'Art. 36', base: true },
  { code: 'BASE-RECIBO', name: 'Recibo de pago de constancia de ingreso', description: 'Según la tasa vigente (S/ 15.00).', article: 'Art. 36', base: true },
  { code: 'DIS-CONADIS', name: 'Carné CONADIS y/o certificado de discapacidad', description: 'Copia simple del carné del CONADIS y/o certificado emitido por médicos certificadores de una IPRESS.', article: 'Art. 37' },
  { code: 'PSP-RESOL', name: 'Resolución o acta de adjudicación del 1.º o 2.º puesto', description: 'En original o transcripción, expedida por el director o subdirector de la institución educativa; validada por la Comisión de Admisión.', article: 'Art. 38' },
  { code: 'COAR-DIPLOMA', name: 'Informe final y diploma del Bachillerato Internacional (24 a más puntos)', description: 'En original, firmado por el director del COAR-Ayacucho.', article: 'Art. 39' },
  { code: 'DEP-CONST', name: 'Constancia de deportista calificado de alto nivel', description: 'En original, otorgada por la DINADAF; verificable en el SISDENA.', article: 'Art. 40' },
  { code: 'DEP-CARTA-PASE', name: 'Carta pase o declaración jurada', description: 'Carta pase de la liga o institución deportiva a favor de la UNSCH, o declaración jurada de no pertenecer a ninguna.', article: 'Art. 40' },
  { code: 'DEP-COMPROMISO', name: 'Carta de compromiso deportivo', description: 'Compromiso de representar a la UNSCH en su disciplina durante sus estudios.', article: 'Art. 40' },
  { code: 'CEPRE-CONST', name: 'Constancia de adjudicación de vacante CEPRE-UNSCH', description: 'Constancia original de adjudicación del ciclo de estudios correspondiente.', article: 'Art. 41' },
  { code: 'CEPRE-FICHA', name: 'Ficha de inscripción', description: 'Ficha de inscripción al concurso.', article: 'Art. 41' },
  { code: 'GRA-DNI', name: 'DNI vigente: original y copia', description: 'Documento Nacional de Identidad vigente.', article: 'Art. 42' },
  { code: 'GRA-GRADO', name: 'Copia del grado o título profesional', description: 'Copia fotostática del grado académico o título profesional.', article: 'Art. 42' },
  { code: 'GRA-SUNEDU', name: 'Constancia de registro en SUNEDU', description: 'Constancia de registro del grado o título expedida por la SUNEDU.', article: 'Art. 42' },
  { code: 'TRI-DNI', name: 'DNI vigente: original y copia', description: 'Documento Nacional de Identidad vigente.', article: 'Art. 43' },
  { code: 'TRI-CERT', name: 'Certificado de estudios universitarios original', description: 'Que acredite al menos 4 semestres, 2 años o 72 créditos aprobados.', article: 'Art. 43' },
  { code: 'TRI-DJ', name: 'Declaración jurada de no haber sido sancionado', description: 'Según formato de la Oficina de Admisión y Estudios Generales.', article: 'Art. 43' },
  { code: 'TEN-DNI', name: 'DNI vigente: original y copia', description: 'Documento Nacional de Identidad vigente.', article: 'Art. 44' },
  { code: 'TEN-CERT', name: 'Certificado de estudios universitarios original', description: 'Que acredite al menos 4 semestres, 2 años o 72 créditos aprobados.', article: 'Art. 44' },
  { code: 'TEN-MATRICULA', name: 'Constancia de matrícula vigente', description: 'Del último año académico, emitida por la universidad de origen.', article: 'Art. 44' },
  { code: 'TEN-NO-SEPARADO', name: 'Constancia de no haber sido separado', description: 'Por medida disciplinaria o bajo rendimiento, expedida por la Secretaría General de la universidad de origen.', article: 'Art. 44' },
  { code: 'TEI-PASAPORTE', name: 'Pasaporte (extranjeros) o DNI vigente (peruanos)', description: 'Original y copia.', article: 'Art. 45' },
  { code: 'TEI-CERT', name: 'Certificado de estudios visado', description: 'Visado por el Ministerio de Relaciones Exteriores del Perú o apostillado; al menos 4 semestres, 2 años o 72 créditos.', article: 'Art. 45' },
  { code: 'TEI-NO-SEPARADO', name: 'Constancia de no haber sido separado', description: 'Emitida por la universidad de origen.', article: 'Art. 45' },
  { code: 'TEI-MATRICULA', name: 'Constancia de matrícula vigente', description: 'Del último año académico en la universidad de origen.', article: 'Art. 45' },
  { code: 'VIC-RESOL', name: 'Resolución de beneficiario o de pensión de orfandad (según el caso)', description: 'Titular: resolución del régimen indemnizatorio (D.S. 047-2011-PCM). Hijo(a): resolución de pensión de orfandad. Autenticadas por fedatario.', article: 'Art. 46–47' },
  { code: 'VIC-BOLETAS', name: 'Tres últimas boletas de pago de pensión', description: 'Copias legalizadas (titular) o boletas de pensión de orfandad (hijo/a).', article: 'Art. 46–47' },
  { code: 'VIC-DJ', name: 'Declaración jurada de no haber usado este derecho en otra universidad', description: 'Para víctimas del terrorismo e hijos.', article: 'Art. 46–47' },
  { code: 'VIC-CMAN', name: 'Certificado del Consejo de Reparaciones o registro CMAN', description: 'Para afectados por la violencia sociopolítica (Ley 28592).', article: 'Art. 48' },
  { code: 'PIN-SUNARP', name: 'Personería jurídica vigente de la organización indígena', description: 'Copia legalizada de la inscripción en la SUNARP.', article: 'Art. 49' },
  { code: 'PIN-AVAL', name: 'Carta aval de la junta directiva', description: 'Acredita residencia y estudios secundarios en la comunidad (formato anexo).', article: 'Art. 49' },
  { code: 'PIN-COMPROMISO', name: 'Carta de compromiso (Convenio 169 OIT)', description: 'Firmada por el presidente de la comunidad y el postulante (formato anexo).', article: 'Art. 49' },
];

/** Documentos propios de cada submodalidad (la base común se agrega si la submodalidad la usa). */
export const submodalityRequirements: Record<string, { code: string; mandatory?: boolean }[]> = {
  'ORD': [],
  'EXO-DIS': [{ code: 'DIS-CONADIS' }],
  'EXO-PSP': [{ code: 'PSP-RESOL' }],
  'EXO-COAR': [{ code: 'COAR-DIPLOMA' }],
  'EXO-DEP': [{ code: 'DEP-CONST' }, { code: 'DEP-CARTA-PASE' }, { code: 'DEP-COMPROMISO' }],
  'EXO-GRA': [{ code: 'GRA-DNI' }, { code: 'GRA-GRADO' }, { code: 'GRA-SUNEDU' }],
  'EXO-TRI': [{ code: 'TRI-DNI' }, { code: 'TRI-CERT' }, { code: 'TRI-DJ' }],
  'EXO-TEN': [{ code: 'TEN-DNI' }, { code: 'TEN-CERT' }, { code: 'TEN-MATRICULA' }, { code: 'TEN-NO-SEPARADO' }],
  'EXO-TEI': [{ code: 'TEI-PASAPORTE' }, { code: 'TEI-CERT' }, { code: 'TEI-NO-SEPARADO' }, { code: 'TEI-MATRICULA' }],
  'EXO-VIC': [{ code: 'VIC-RESOL', mandatory: false }, { code: 'VIC-BOLETAS', mandatory: false }, { code: 'VIC-DJ', mandatory: false }, { code: 'VIC-CMAN', mandatory: false }],
  'EXO-PIN': [{ code: 'PIN-SUNARP' }, { code: 'PIN-AVAL' }, { code: 'PIN-COMPROMISO' }],
  'CEPRE': [{ code: 'CEPRE-CONST' }, { code: 'CEPRE-FICHA' }],
};

/** Temario (Tabla N.° 1). El detalle por tema está en el PDF oficial (temario.pdf). */
export const syllabus: { area: string; courses: string[] }[] = [
  { area: 'I. Comunicación', courses: ['Razonamiento verbal', 'Lenguaje', 'Literatura'] },
  { area: 'II. Matemática', courses: ['Razonamiento lógico matemático', 'Aritmética', 'Álgebra', 'Geometría', 'Trigonometría'] },
  { area: 'III. Ciencia y Tecnología', courses: ['Física', 'Química', 'Biología', 'Anatomía'] },
  { area: 'IV. Ciencias Sociales', courses: ['Historia Universal', 'Historia del Perú', 'Geografía y ambiente', 'Economía'] },
  { area: 'V. Desarrollo Personal, Ciudadanía y Cívica', courses: ['Formación ciudadana y cívica', 'Actualidad regional, nacional e internacional'] },
];

export const officialDocuments: { type: string; title: string; file: string }[] = [
  { type: 'REGLAMENTO', title: 'Reglamento del Concurso de Admisión a Pregrado 2027-I', file: 'reglamento.pdf' },
  { type: 'CRONOGRAMA', title: 'Cronograma del Concurso de Admisión 2027-I (Tabla N.° 2)', file: 'cronograma.pdf' },
  { type: 'TASAS', title: 'Tasas educativas para la inscripción 2027-I (Tabla N.° 3)', file: 'tasas.pdf' },
  { type: 'VACANTES', title: 'Cuadro de vacantes por programas de estudios 2027-I', file: 'vacantes.pdf' },
  { type: 'REQUISITOS', title: 'Requisitos de inscripción - Ordinario y Exonerado', file: 'requisitos.pdf' },
  { type: 'TEMARIO', title: 'Temario del Examen de Admisión 2027-I', file: 'temario.pdf' },
  { type: 'PROGRAMAS', title: 'Programas de estudios - perfiles de ingreso', file: 'programas.pdf' },
];
