/** Documentos oficiales del Prospecto 2027-I servidos como PDF (spec 001, FR-014). */
export interface OfficialDoc {
  slug: string;
  title: string;
  file: string;
  /** Página HTML equivalente, si existe. */
  html?: string;
}

export const OFFICIAL_DOCS: OfficialDoc[] = [
  { slug: 'reglamento', title: 'Reglamento del concurso de admisión', file: 'docs/reglamento.pdf' },
  { slug: 'cronograma', title: 'Cronograma del concurso de admisión 2027-I', file: 'docs/cronograma.pdf', html: '/cronograma' },
  { slug: 'requisitos', title: 'Requisitos para la inscripción', file: 'docs/requisitos.pdf', html: '/requisitos' },
  { slug: 'tasas', title: 'Tasas educativas para la inscripción', file: 'docs/tasas.pdf', html: '/tasas' },
  { slug: 'vacantes', title: 'Cuadro de vacantes por programa de estudios', file: 'docs/vacantes.pdf', html: '/programas' },
  { slug: 'temario', title: 'Temario del examen de admisión', file: 'docs/temario.pdf', html: '/temario' },
  { slug: 'programas', title: 'Programas de estudios y perfiles de ingreso', file: 'docs/programas.pdf', html: '/programas' },
];

export const docBySlug = (slug: string) => OFFICIAL_DOCS.find((d) => d.slug === slug);
