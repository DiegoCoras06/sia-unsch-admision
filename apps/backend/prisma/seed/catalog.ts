// Catálogo académico estable entre convocatorias (fuente: docs/fuentes/programas.pdf, VACANTES.pdf y portal actual).

export const areas = [
  { code: 'I', name: 'Ciencias' },
  { code: 'II', name: 'Letras' },
  { code: 'III', name: 'Biomédicas' },
] as const;

export const faculties = {
  AGR: 'Facultad de Ciencias Agrarias',
  BIO: 'Facultad de Ciencias Biológicas',
  EDU: 'Facultad de Ciencias de la Educación',
  ECO: 'Facultad de Ciencias Económicas, Administrativas y Contables',
  SOC: 'Facultad de Ciencias Sociales',
  DER: 'Facultad de Derecho y Ciencias Políticas',
  MGC: 'Facultad de Ingeniería de Minas, Geología y Civil',
  QMT: 'Facultad de Ingeniería Química y Metalurgia',
  SAL: 'Facultad de Ciencias de la Salud',
} as const;

type FacultyKey = keyof typeof faculties;

/** Programa de estudios; `scheduleNumber` = numeración del cronograma (1–34). */
export const programs: { name: string; faculty: FacultyKey; area: 'I' | 'II' | 'III'; scheduleNumber: number }[] = [
  { name: 'Agronomía', faculty: 'AGR', area: 'I', scheduleNumber: 1 },
  { name: 'Ingeniería Agrícola', faculty: 'AGR', area: 'I', scheduleNumber: 2 },
  { name: 'Medicina Veterinaria', faculty: 'AGR', area: 'III', scheduleNumber: 3 },
  { name: 'Ingeniería Agroforestal', faculty: 'AGR', area: 'I', scheduleNumber: 4 },
  { name: 'Educación Secundaria', faculty: 'EDU', area: 'II', scheduleNumber: 5 },
  { name: 'Educación Física', faculty: 'EDU', area: 'II', scheduleNumber: 6 },
  { name: 'Educación Inicial', faculty: 'EDU', area: 'II', scheduleNumber: 7 },
  { name: 'Educación Primaria', faculty: 'EDU', area: 'II', scheduleNumber: 8 },
  { name: 'Biología', faculty: 'BIO', area: 'III', scheduleNumber: 9 },
  { name: 'Economía', faculty: 'ECO', area: 'I', scheduleNumber: 10 },
  { name: 'Administración de Empresas', faculty: 'ECO', area: 'I', scheduleNumber: 11 },
  { name: 'Contabilidad y Auditoría', faculty: 'ECO', area: 'I', scheduleNumber: 12 },
  { name: 'Derecho', faculty: 'DER', area: 'II', scheduleNumber: 13 },
  { name: 'Ingeniería Química', faculty: 'QMT', area: 'I', scheduleNumber: 14 },
  { name: 'Ingeniería en Industrias Alimentarias', faculty: 'QMT', area: 'I', scheduleNumber: 15 },
  { name: 'Ingeniería Ambiental', faculty: 'QMT', area: 'I', scheduleNumber: 16 },
  { name: 'Ingeniería Agroindustrial', faculty: 'QMT', area: 'I', scheduleNumber: 17 },
  { name: 'Matemática', faculty: 'MGC', area: 'I', scheduleNumber: 18 },
  { name: 'Física', faculty: 'MGC', area: 'I', scheduleNumber: 19 },
  { name: 'Estadística', faculty: 'MGC', area: 'I', scheduleNumber: 20 },
  { name: 'Ingeniería de Minas', faculty: 'MGC', area: 'I', scheduleNumber: 21 },
  { name: 'Ingeniería Civil', faculty: 'MGC', area: 'I', scheduleNumber: 22 },
  { name: 'Arquitectura', faculty: 'MGC', area: 'I', scheduleNumber: 23 },
  { name: 'Ingeniería de Sistemas', faculty: 'MGC', area: 'I', scheduleNumber: 24 },
  { name: 'Ingeniería Geológica', faculty: 'MGC', area: 'I', scheduleNumber: 25 },
  { name: 'Antropología Social', faculty: 'SOC', area: 'II', scheduleNumber: 26 },
  { name: 'Arqueología e Historia', faculty: 'SOC', area: 'II', scheduleNumber: 27 },
  { name: 'Trabajo Social', faculty: 'SOC', area: 'II', scheduleNumber: 28 },
  { name: 'Ciencias de la Comunicación', faculty: 'SOC', area: 'II', scheduleNumber: 29 },
  { name: 'Enfermería', faculty: 'SAL', area: 'III', scheduleNumber: 30 },
  { name: 'Obstetricia', faculty: 'SAL', area: 'III', scheduleNumber: 31 },
  { name: 'Medicina Humana', faculty: 'SAL', area: 'III', scheduleNumber: 32 },
  { name: 'Psicología', faculty: 'SAL', area: 'III', scheduleNumber: 33 },
  { name: 'Farmacia y Bioquímica', faculty: 'SAL', area: 'III', scheduleNumber: 34 },
];

const EDU_DEGREE = 'Bachiller en Ciencias de la Educación';
const BIO_DEGREE = 'Bachiller en Ciencias Biológicas';
const FM = 'Licenciado(a) en Ciencias Físico-Matemáticas, con especialidad en';
const SEC = 'Licenciado(a) en Educación Secundaria, especialidad:';

/**
 * Opciones de postulación P01–P40 en el orden del cuadro de vacantes.
 * `vac` = código oficial del cuadro (con el 26 repetido y sin el 25, DQ-1); `page` = página del perfil en programas.pdf.
 */
export const options: {
  code: string; program: string; specialty: string | null; vac: string; page: number;
  years: number; degree: string; title: string;
}[] = [
  { code: 'P01', program: 'Agronomía', specialty: null, vac: '1', page: 1, years: 5, degree: 'Bachiller en Ciencias Agrícolas', title: 'Ingeniero(a) Agrónomo(a)' },
  { code: 'P02', program: 'Biología', specialty: 'Microbiología', vac: '2', page: 5, years: 5, degree: BIO_DEGREE, title: 'Biólogo(a) con mención en la especialidad de Microbiología' },
  { code: 'P03', program: 'Biología', specialty: 'Biotecnología', vac: '2', page: 6, years: 5, degree: BIO_DEGREE, title: 'Biólogo(a) con mención en la especialidad de Biotecnología' },
  { code: 'P04', program: 'Biología', specialty: 'Ecología y Recursos Naturales', vac: '2', page: 7, years: 5, degree: BIO_DEGREE, title: 'Biólogo(a) con mención en la especialidad de Ecología y Recursos Naturales' },
  { code: 'P05', program: 'Educación Inicial', specialty: null, vac: '3', page: 8, years: 5, degree: EDU_DEGREE, title: 'Licenciado(a) en Educación Inicial' },
  { code: 'P06', program: 'Educación Primaria', specialty: null, vac: '4', page: 9, years: 5, degree: EDU_DEGREE, title: 'Licenciado(a) en Educación Primaria' },
  { code: 'P07', program: 'Educación Secundaria', specialty: 'Lengua Española y Literatura', vac: '5', page: 10, years: 5, degree: EDU_DEGREE, title: `${SEC} Lengua Española y Literatura con mención en Comunicación` },
  { code: 'P08', program: 'Educación Secundaria', specialty: 'Matemática, Física e Informática', vac: '5', page: 13, years: 5, degree: EDU_DEGREE, title: `${SEC} Matemática, Física e Informática` },
  { code: 'P09', program: 'Educación Secundaria', specialty: 'Ciencias Sociales y Filosofía', vac: '5', page: 12, years: 5, degree: EDU_DEGREE, title: `${SEC} Ciencias Sociales con mención en Turismo` },
  { code: 'P10', program: 'Educación Secundaria', specialty: 'Inglés y Lengua Española', vac: '5', page: 11, years: 5, degree: EDU_DEGREE, title: `${SEC} Inglés y Lengua Española` },
  { code: 'P11', program: 'Educación Física', specialty: null, vac: '6', page: 14, years: 5, degree: EDU_DEGREE, title: 'Licenciado(a) en Educación Física' },
  { code: 'P12', program: 'Administración de Empresas', specialty: null, vac: '7', page: 15, years: 5, degree: 'Bachiller en Ciencias Administrativas', title: 'Licenciado(a) en Administración' },
  { code: 'P13', program: 'Contabilidad y Auditoría', specialty: null, vac: '8', page: 16, years: 5, degree: 'Bachiller en Ciencias Contables', title: 'Licenciado(a) en Contabilidad' },
  { code: 'P14', program: 'Economía', specialty: null, vac: '9', page: 17, years: 5, degree: 'Bachiller en Economía', title: 'Economista' },
  { code: 'P15', program: 'Antropología Social', specialty: null, vac: '10', page: 18, years: 5, degree: 'Bachiller en Ciencias Sociales: Antropología Social', title: 'Licenciado(a) en Antropología' },
  { code: 'P16', program: 'Arqueología e Historia', specialty: 'Arqueología', vac: '11', page: 19, years: 5, degree: 'Bachiller en Ciencias Sociales: Arqueología', title: 'Licenciado(a) en Arqueología' },
  { code: 'P17', program: 'Arqueología e Historia', specialty: 'Historia', vac: '11', page: 20, years: 5, degree: 'Bachiller en Ciencias Sociales: Historia', title: 'Licenciado(a) en Historia' },
  { code: 'P18', program: 'Trabajo Social', specialty: null, vac: '12', page: 21, years: 5, degree: 'Bachiller en Ciencias Sociales: Trabajo Social', title: 'Licenciado(a) en Trabajo Social' },
  { code: 'P19', program: 'Derecho', specialty: null, vac: '13', page: 23, years: 6, degree: 'Bachiller en Ciencias Políticas', title: 'Abogado(a)' },
  { code: 'P20', program: 'Enfermería', specialty: null, vac: '14', page: 38, years: 5, degree: 'Bachiller en Ciencias de la Enfermería', title: 'Licenciado(a) en Enfermería' },
  { code: 'P21', program: 'Ingeniería de Minas', specialty: null, vac: '15', page: 26, years: 5, degree: 'Bachiller en Ciencias de Ingeniería de Minas', title: 'Ingeniero de Minas' },
  { code: 'P22', program: 'Ingeniería Civil', specialty: null, vac: '16', page: 24, years: 5, degree: 'Bachiller en Ingeniería Civil', title: 'Ingeniero Civil' },
  { code: 'P23', program: 'Ingeniería Química', specialty: null, vac: '17', page: 32, years: 5, degree: 'Bachiller en Ingeniería Química', title: 'Ingeniero(a) Químico(a)' },
  { code: 'P24', program: 'Obstetricia', specialty: null, vac: '18', page: 39, years: 5, degree: 'Bachiller en Obstetricia', title: 'Obstetra' },
  { code: 'P25', program: 'Ingeniería en Industrias Alimentarias', specialty: null, vac: '19', page: 34, years: 5, degree: 'Bachiller en Ingeniería en Industrias Alimentarias', title: 'Ingeniero(a) en Industrias Alimentarias' },
  { code: 'P26', program: 'Farmacia y Bioquímica', specialty: null, vac: '20', page: 37, years: 5, degree: 'Bachiller en Farmacia y Bioquímica', title: 'Químico(a) Farmacéutico(a)' },
  { code: 'P27', program: 'Ingeniería Agrícola', specialty: null, vac: '21', page: 3, years: 5, degree: 'Bachiller en Ingeniería Agrícola', title: 'Ingeniero(a) Agrícola' },
  { code: 'P28', program: 'Ingeniería Agroindustrial', specialty: null, vac: '22', page: 35, years: 5, degree: 'Bachiller en Ingeniería Agroindustrial', title: 'Ingeniero(a) Agroindustrial' },
  { code: 'P29', program: 'Ciencias de la Comunicación', specialty: null, vac: '23', page: 22, years: 5, degree: 'Bachiller en Ciencias de la Comunicación', title: 'Licenciado(a) en Comunicación' },
  { code: 'P30', program: 'Medicina Veterinaria', specialty: null, vac: '24', page: 2, years: 6, degree: 'Bachiller en Medicina Veterinaria', title: 'Médico Veterinario' },
  { code: 'P31', program: 'Estadística', specialty: null, vac: '26', page: 31, years: 5, degree: 'Bachiller en Estadística', title: `${FM} Estadística` },
  { code: 'P32', program: 'Física', specialty: null, vac: '26', page: 30, years: 5, degree: 'Bachiller en Física', title: `${FM} Física` },
  { code: 'P33', program: 'Matemática', specialty: null, vac: '26', page: 29, years: 5, degree: 'Bachiller en Matemáticas', title: `${FM} Matemática` },
  { code: 'P34', program: 'Ingeniería de Sistemas', specialty: null, vac: '27', page: 28, years: 5, degree: 'Bachiller en Ingeniería de Sistemas', title: 'Ingeniero(a) de Sistemas' },
  { code: 'P35', program: 'Ingeniería Agroforestal', specialty: null, vac: '28', page: 4, years: 5, degree: 'Bachiller en Ingeniería Agroforestal', title: 'Ingeniero(a) Agroforestal' },
  { code: 'P36', program: 'Medicina Humana', specialty: null, vac: '29', page: 36, years: 7, degree: 'Bachiller en Medicina Humana', title: 'Médico Cirujano' },
  { code: 'P37', program: 'Arquitectura', specialty: null, vac: '30', page: 25, years: 5, degree: 'Bachiller en Arquitectura', title: 'Arquitecto' },
  { code: 'P38', program: 'Ingeniería Ambiental', specialty: null, vac: '31', page: 33, years: 6, degree: 'Bachiller en Ingeniería Ambiental', title: 'Ingeniero(a) Ambiental' },
  { code: 'P39', program: 'Psicología', specialty: null, vac: '32', page: 40, years: 5, degree: 'Bachiller en Psicología', title: 'Licenciado en Psicología' },
  { code: 'P40', program: 'Ingeniería Geológica', specialty: null, vac: '33', page: 27, years: 5, degree: 'Bachiller en Ingeniería Geológica', title: 'Ingeniero Geólogo' },
];

export const modalities = [
  { code: 'ORD', name: 'Examen ordinario' },
  { code: 'EXO', name: 'Examen de exonerados' },
  { code: 'CEPRE', name: 'Adjudicados CEPRE-UNSCH' },
] as const;

/** Submodalidades (incluye ORD y CEPRE como "submodalidad única" para reutilizar requisitos). */
export const submodalities = [
  { code: 'ORD', modality: 'ORD', name: 'Ordinario (primera profesión)', legal: 'Art. 7.2', base: true },
  { code: 'EXO-DIS', modality: 'EXO', name: 'Personas con discapacidad', legal: 'Ley 29973 · Art. 8.1', base: true },
  { code: 'EXO-PSP', modality: 'EXO', name: 'Primer y segundo puesto de secundaria', legal: 'Art. 8.2', base: true },
  { code: 'EXO-COAR', modality: 'EXO', name: 'COAR / Bachillerato Internacional Ayacucho', legal: 'Art. 8.3', base: true },
  { code: 'EXO-DEP', modality: 'EXO', name: 'Deportista calificado de alto nivel', legal: 'Ley 28036 · Art. 8.4', base: true },
  { code: 'EXO-GRA', modality: 'EXO', name: 'Graduados y/o titulados universitarios', legal: 'Art. 8.5', base: false },
  { code: 'EXO-TRI', modality: 'EXO', name: 'Traslado interno', legal: 'Art. 8.6', base: false },
  { code: 'EXO-TEN', modality: 'EXO', name: 'Traslado externo nacional', legal: 'Art. 8.7', base: false },
  { code: 'EXO-TEI', modality: 'EXO', name: 'Traslado externo internacional', legal: 'Art. 8.7', base: false },
  { code: 'EXO-VIC', modality: 'EXO', name: 'Víctimas del terrorismo / violencia sociopolítica', legal: 'Ley 27277, Ley 28592 · Art. 8.8', base: true },
  { code: 'EXO-PIN', modality: 'EXO', name: 'Pueblos indígenas andino-amazónicos', legal: 'Convenio 169 OIT · Art. 8.9', base: true },
  { code: 'CEPRE', modality: 'CEPRE', name: 'Adjudicados CEPRE-UNSCH', legal: 'Art. 8.10', base: true },
] as const;

/** 16 categorías de vacante, en el orden de las columnas del cuadro oficial. */
export const quotaCategories = [
  { code: 'ORD', name: 'Ordinario', modality: 'ORD', sub: 'ORD', variant: null },
  { code: 'DIS', name: 'Personas con discapacidad', modality: 'EXO', sub: 'EXO-DIS', variant: null },
  { code: 'PS-U', name: '1.º y 2.º puesto - Urbano', modality: 'EXO', sub: 'EXO-PSP', variant: 'URBANO' },
  { code: 'PS-R', name: '1.º y 2.º puesto - Rural', modality: 'EXO', sub: 'EXO-PSP', variant: 'RURAL' },
  { code: 'DEP', name: 'Deportista calificado de alto nivel', modality: 'EXO', sub: 'EXO-DEP', variant: null },
  { code: 'CE-I', name: 'CEPRE - Ciclo I', modality: 'CEPRE', sub: 'CEPRE', variant: 'CICLO_I' },
  { code: 'CE-II', name: 'CEPRE - Ciclo II', modality: 'CEPRE', sub: 'CEPRE', variant: 'CICLO_II' },
  { code: 'GRA', name: 'Graduados y/o titulados', modality: 'EXO', sub: 'EXO-GRA', variant: null },
  { code: 'TI', name: 'Traslado interno', modality: 'EXO', sub: 'EXO-TRI', variant: null },
  { code: 'TEN', name: 'Traslado externo nacional', modality: 'EXO', sub: 'EXO-TEN', variant: null },
  { code: 'TEI', name: 'Traslado externo internacional', modality: 'EXO', sub: 'EXO-TEI', variant: null },
  { code: 'VI-U', name: 'Víctimas (Ley 27277 y 28592) - Urbano', modality: 'EXO', sub: 'EXO-VIC', variant: 'URBANO' },
  { code: 'VI-R', name: 'Víctimas (Ley 27277 y 28592) - Rural', modality: 'EXO', sub: 'EXO-VIC', variant: 'RURAL' },
  { code: 'AND', name: 'Pueblos indígenas - Andino', modality: 'EXO', sub: 'EXO-PIN', variant: 'ANDINO' },
  { code: 'AMZ', name: 'Pueblos indígenas - Amazónico', modality: 'EXO', sub: 'EXO-PIN', variant: 'AMAZONICO' },
  { code: 'COAR', name: 'COAR / Bachillerato Internacional', modality: 'EXO', sub: 'EXO-COAR', variant: null },
] as const;
