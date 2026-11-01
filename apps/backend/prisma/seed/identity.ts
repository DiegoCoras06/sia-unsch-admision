// Semilla de identidad y seguridad (002): consentimiento, roles, permisos y padrón de inhabilitados de prueba.

export const consentDocument = {
  version: '2026-10-v1',
  publishedAt: '2026-10-25T00:00:00-05:00',
  textMd: [
    '## Tratamiento de datos personales',
    '',
    // Texto ya aceptado por los postulantes (versión con huella): no se modifica.
    '**Proyecto académico — no es el portal oficial de la UNSCH.**',
    '',
    'Al crear tu cuenta autorizas el tratamiento de tus datos personales (documento de identidad, nombres, fecha de nacimiento, correo, celular y dirección) con la única finalidad de gestionar tu participación en el proceso de admisión, conforme a la Ley N.° 29733, Ley de Protección de Datos Personales, y su reglamento.',
    '',
    '- Tus datos no se publican en listados públicos ni se comparten con terceros, salvo obligación legal.',
    '- La verificación de identidad de esta versión es **simulada**: no se consulta a RENIEC.',
    '- Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición escribiendo a la Dirección de Admisión.',
    '- Tus datos se conservarán solo durante el proceso y el plazo que fije la política de retención.',
  ].join('\n'),
};

export const permissions = ['me.read', 'me.update', 'applications.own'] as const;

export const roles = [
  { code: 'APPLICANT', name: 'Postulante', permissions: [...permissions] },
];

/** Padrón de prueba: el DNI sintético 99900045 está inhabilitado (escenario H1-E4 de 002). */
export const disqualifiedPersons = [
  {
    documentType: 'DNI',
    documentNumber: '99900045',
    reason: 'Registro de prueba (identidad sintética)',
    resolution: 'PRUEBA-001-2026',
    validFrom: '2026-01-01',
    validUntil: null,
  },
];
