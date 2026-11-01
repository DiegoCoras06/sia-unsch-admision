// Contenido institucional del portal (M14). Solo textos tomados del portal actual o de los documentos oficiales;
// no se atribuyen mensajes inventados a personas reales.

export const contentBlocks: { key: string; bodyMd: string }[] = [
  {
    key: 'mission',
    bodyMd:
      '"Formar profesionales mediante una educación integral de calidad basada en investigación científica, humanística y tecnológica con innovación, para enfrentar diversos escenarios regionales, nacionales e internacionales, con principios éticos, responsabilidad social e interculturalidad que contribuya al desarrollo sostenible."',
  },
  {
    key: 'steps_ord',
    bodyMd: [
      '1. **Registro de datos.** Entra a «Inscripción», llena el formulario (tu DNI completa tus nombres) y obtén tu orden de pago.',
      '2. **Pago por admisión.** Paga en línea o en Santa María Magdalena, Banco de la Nación o Interbank.',
      '3. **Ficha de inscripción y documento informativo.** Descárgala cuando tu pago esté confirmado.',
      '4. **Publicación de estudiantes aptos.** 24 horas antes del examen, consulta tu aula.',
    ].join('\n'),
  },
  {
    key: 'steps_exo',
    bodyMd: [
      '1. **Obtención de autorización.** Presenta los requisitos de tu submodalidad (auditorio del local "Garcilaso de la Vega", Jr. Arequipa N.° 175, de 4:00 p.m. a 8:00 p.m.).',
      '2. **Registro de datos.** Completa la inscripción y obtén tu orden de pago.',
      '3. **Pago por admisión.** Paga en línea o en las entidades autorizadas.',
      '4. **Ficha de inscripción y documento informativo.** Descárgala cuando tu pago esté confirmado.',
      '5. **Publicación de estudiantes aptos.** 24 horas antes del examen, consulta tu aula.',
    ].join('\n'),
  },
  {
    key: 'exam_day',
    bodyMd: [
      '**Lleva:** DNI original vigente y ficha de inscripción con fotografía; lápiz 2B, borrador y tajador.',
      '**No lleves:** celulares, relojes ni dispositivos electrónicos; objetos metálicos, joyas, lapiceros, mochilas, ropa con capucha o de jean.',
      '**Ingreso:** Exonerados de 7:00 a 8:30 a.m.; Ordinario de 6:30 a 8:30 a.m., por las puertas 1 y 2 de la Ciudad Universitaria. Después de las 8:30 a.m. no hay ingreso.',
    ].join('\n\n'),
  },
];

export const heroSlides = [
  { title: 'UNSCH', subtitle: 'Admisión 2027-I', imageUrl: '/img/campus-fachada.jpg', ctaLabel: 'Inscripción', ctaRoute: '/inscripcion', sortOrder: 1 },
  { title: '34 programas de estudios', subtitle: 'Examen de exonerados: 15 de noviembre · Examen ordinario: 22 de noviembre · Ayacucho, Perú', imageUrl: '/img/campus-aereo.jpg', ctaLabel: 'Ver programas', ctaRoute: '/programas', sortOrder: 2 },
  { title: 'Dirección de Admisión', subtitle: 'Proceso de admisión 2027-I', imageUrl: '/img/pabellon-agrarias.jpg', ctaLabel: 'Ver cronograma', ctaRoute: '/cronograma', sortOrder: 3 },
];

export const authorityMessages = [
  {
    name: 'Dr. José A. Quispe Tenorio',
    position: 'Vicerrector de Investigación',
    message:
      'La UNSCH como una institución académica se aboca a la formación académica y a la investigación, fundamentalmente. Que la gestión del conocimiento sirva pues como el motor dinamizador del desarrollo socioeconómico regional y nacional.',
    photoUrl: '/img/escudo-unsch.jpg',
    sortOrder: 1,
  },
];

export const featureFlags = [
  { key: 'INSCRIPCION', label: 'Inscripción', route: '/inscripcion', linkedStageCodes: ['ORD_REGULAR', 'ORD_EXTEMP', 'EXO_REGULAR', 'EXO_EXTEMP', 'CEPRE_REGULAR', 'CEPRE_EXTEMP'], sortOrder: 1 },
  { key: 'REINSCRIPCION', label: 'Reinscripción', route: '/reinscripcion', linkedStageCodes: ['REINS'], sortOrder: 2 },
  { key: 'IMPRIMIR_DOCUMENTOS', label: 'Imprimir documentos', route: '/mi-inscripcion', linkedStageCodes: ['ORD_FICHA', 'ORD_EXTEMP', 'EXO_REGULAR', 'EXO_EXTEMP', 'CEPRE_REGULAR', 'CEPRE_EXTEMP', 'REINS'], sortOrder: 3 },
  { key: 'BUSCAR_AULA', label: 'Buscar aula', route: '/buscar-aula', linkedStageCodes: ['EXAM_EXO', 'EXAM_ORD'], sortOrder: 4 },
  { key: 'VER_PUNTAJE', label: 'Ver puntaje', route: '/resultados', linkedStageCodes: ['EXAM_EXO', 'EXAM_ORD', 'DELIVERY'], sortOrder: 5 },
];

export const announcements = [
  {
    callCode: '2027-I',
    type: 'COMUNICADO' as const,
    title: 'Inicio del Concurso de Admisión 2027-I',
    bodyMd:
      'La inscripción regular en la modalidad Ordinario se realiza del 7 de setiembre al 6 de noviembre de 2026, y en la modalidad Exonerados del 7 de setiembre al 30 de octubre de 2026. El examen de exonerados será el domingo 15 de noviembre y el examen ordinario el domingo 22 de noviembre. Revisa el reglamento, las tasas y los requisitos antes de inscribirte.',
    affectsSection: 'CRONOGRAMA',
    publishedAt: '2026-09-07T08:00:00-05:00',
  },
];
