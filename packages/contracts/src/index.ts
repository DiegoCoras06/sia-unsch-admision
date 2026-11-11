// DTO de la API /api/v1. Deben coincidir con specs/001 y specs/002 contracts/openapi.yaml.

// ── Sobres ───────────────────────────────────────────────────────────────
export interface ApiResponse<T, M = Record<string, unknown>> {
  data: T;
  meta?: M;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: { field: string; issue: string }[];
    [extra: string]: unknown;
  };
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}

// ── 001 Convocatoria y cronograma ───────────────────────────────────────
export type StageScope = 'ORD' | 'EXO' | 'CEPRE' | 'REINS' | 'ALL';
export type StageKind = 'REGULAR' | 'EXTEMPORANEOUS' | 'EXAM' | 'PUBLICATION' | 'DELIVERY' | 'OTHER';
export type StageStatus = 'UPCOMING' | 'IN_PROGRESS' | 'FINISHED';

export interface StageDto {
  code: string;
  name: string;
  scope: StageScope;
  kind: StageKind;
  startsAt: string;
  endsAt: string;
  status: StageStatus;
  highlight: boolean;
}

export interface NextMilestoneDto {
  code: string;
  name: string;
  startsAt: string;
  secondsRemaining: number;
}

export interface CurrentCallDto {
  code: string;
  name: string;
  status: 'PUBLISHED' | 'CLOSED';
  now: string;
  stages: StageDto[];
  nextMilestone: NextMilestoneDto | null;
}

// ── 001 Programas y vacantes ────────────────────────────────────────────
export type AreaCode = 'I' | 'II' | 'III';

export interface AreaDto {
  code: AreaCode;
  name: string;
  optionCount: number;
}

export interface QuotaCategoryDto {
  code: string;
  name: string;
  modality: 'ORD' | 'EXO' | 'CEPRE';
  submodality: string | null;
  variant: string | null;
}

export interface OptionSummaryDto {
  internalCode: string;
  displayName: string;
  program: string;
  specialty: string | null;
  area: AreaCode;
  ordinaryVacancies: number;
  totalVacancies: number;
  categoryVacancies: number | null;
}

export interface OptionDetailDto extends OptionSummaryDto {
  faculty: string;
  durationYears: number;
  degree: string;
  professionalTitle: string;
  profileMarkdown: string;
  vacanciesByCategory: { category: string; name: string; quantity: number }[];
}

export interface OptionsMeta {
  totalOptions: number;
  totalVacancies: number;
}

// ── 001 Tasas ───────────────────────────────────────────────────────────
export type Modality = 'ORD' | 'EXO' | 'CEPRE';
export type SchoolType = 'ESTATAL' | 'PARTICULAR';
export type MilitaryCondition = 'NONE' | 'ACTIVE' | 'DISCHARGED';

export interface FeeDto {
  code: string;
  concept: string;
  amount: string;
  kind: 'BASE' | 'SURCHARGE' | 'OTHER';
  legalNote: string;
}

export interface FeeQuoteLineDto {
  code: string;
  concept: string;
  amount: string;
  legalNote: string;
}

export interface FeeQuoteDto {
  total: string;
  currency: 'PEN';
  lines: FeeQuoteLineDto[];
  warnings: string[];
}

// ── 001 Contenido ───────────────────────────────────────────────────────
export interface RequirementDto {
  code: string;
  name: string;
  description: string;
  article: string;
  isBase: boolean;
  mandatory: boolean;
  acceptedFormats: string[];
}

export interface SyllabusNodeDto {
  id: string;
  level: 'AREA' | 'COURSE' | 'SECTION' | 'TOPIC';
  title: string;
  path: string[];
  children: SyllabusNodeDto[];
}

export interface OfficialDocumentDto {
  type: string;
  title: string;
  url: string;
  publishedAt: string;
  sizeBytes: number;
}

export interface StatsDto {
  ordinary: number;
  exempted: number;
  total: number;
  source: 'live' | 'pending';
  updatedAt: string;
}

export type AnnouncementType = 'COMUNICADO' | 'FE_ERRATAS' | 'RESULTADO';

export interface AnnouncementDto {
  id: string;
  type: AnnouncementType;
  title: string;
  bodyMarkdown: string;
  affectsSection: string | null;
  publishedAt: string;
}

export type QuickAccessKey = 'INSCRIPCION' | 'REINSCRIPCION' | 'BUSCAR_AULA' | 'VER_PUNTAJE' | 'IMPRIMIR_DOCUMENTOS';

export interface HomeContentDto {
  heroSlides: { title: string; subtitle: string; imageUrl: string; ctaLabel: string | null; ctaRoute: string | null }[];
  authorities: { name: string; position: string; message: string; photoUrl: string }[];
  blocks: Record<string, string>;
  quickAccess: { key: QuickAccessKey; label: string; enabled: boolean; reason: string }[];
}

export interface ContactRequestDto {
  name: string;
  email: string;
  phone?: string;
  message: string;
  website?: string;
}

// ── 002 Cuentas e identidad ─────────────────────────────────────────────
export type DocumentType = 'DNI' | 'CE' | 'PASAPORTE';
export type IdentityStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';
export type UserStatus = 'PENDING_EMAIL' | 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'DISABLED';

export interface ConsentDto {
  version: string;
  textMarkdown: string;
}

export interface IdentityLookupRequestDto {
  documentType: DocumentType;
  documentNumber: string;
  checkDigit?: string;
}

export interface IdentityLookupDto {
  identityStatus: 'VERIFIED' | 'PENDING';
  firstNames: string | null;
  paternalSurname: string | null;
  maternalSurname: string | null;
  isMinor: boolean;
  simulated: boolean;
  identityToken: string;
}

export interface RegisterRequestDto {
  identityToken: string;
  manualNames?: { firstNames: string; paternalSurname: string; maternalSurname: string };
  email: string;
  phone: string;
  password: string;
  consentVersion: string;
}

export interface RegisterResultDto {
  userId: string;
  status: 'PENDING_EMAIL';
  applicantCode: string;
  maskedEmail: string;
}

export interface SessionUserDto {
  id: string;
  type: 'APPLICANT' | 'STAFF';
  status: UserStatus;
  roles: string[];
}

export interface TokenDto {
  accessToken: string;
  expiresIn: number;
  user: SessionUserDto;
}

export interface ProfileDto {
  applicantCode: string;
  documentType: DocumentType;
  documentNumber: string;
  firstNames: string;
  paternalSurname: string;
  maternalSurname: string;
  birthDate: string | null;
  identityStatus: IdentityStatus;
  identitySimulated: boolean;
  email: string;
  phone: string;
  ubigeo: string | null;
  addressLine: string | null;
  guardianName: string | null;
  editableFields: string[];
}

export interface UpdateProfileRequestDto {
  phone?: string;
  ubigeo?: string;
  addressLine?: string;
  guardianName?: string;
  email?: string;
}

// ── 003 Inscripción pública (ADR-015) ───────────────────────────────────
export interface IdentityResultDto {
  found: boolean;
  paternalSurname: string | null;
  maternalSurname: string | null;
  firstNames: string | null;
  birthDate: string | null;
  simulated: boolean;
  alreadyRegistered: boolean;
  /** RENIEC no respondió o rechazó la consulta: el postulante escribe sus nombres. */
  unavailable?: boolean;
}

export interface InscriptionOptionsDto {
  callCode: string;
  /** true: la consulta de DNI usa identidades de prueba; false: RENIEC real. */
  identitySimulated?: boolean;
  maritalStatus: Record<string, string>;
  economicDependency: Record<string, string>;
  preparation: Record<string, string>;
  campuses: Record<string, string>;
  modalities: {
    code: 'ORD' | 'EXO' | 'CEPRE';
    name: string;
    open: boolean;
    categories: { code: string; name: string; submodality: string | null }[];
  }[];
}

export interface InscriptionRequestDto {
  documentType: 'DNI' | 'CE';
  documentNumber: string;
  paternalSurname: string;
  maternalSurname: string;
  firstNames: string;
  sex: 'M' | 'F';
  maritalStatus: string;
  birthUbigeo: string;
  birthDate: string;
  address: string;
  residenceUbigeo: string;
  economicDependency: string;
  phone?: string;
  mobile: string;
  email: string;
  photo: string;
  schoolUbigeo: string;
  schoolName: string;
  schoolType: SchoolType;
  graduationYear: number;
  inFourthOrBelow: boolean;
  preparation: string;
  attempts: number;
  modality: 'ORD' | 'EXO' | 'CEPRE';
  quotaCategory: string;
  campus: string;
  optionCode: string;
  militaryCondition: MilitaryCondition;
  familyLink: boolean;
  declarationAccepted: boolean;
  /** Versión de la política de tratamiento de datos aceptada (RF-13.09). */
  consentVersion: string;
}

export interface InscriptionSummaryDto {
  applicantCode: string;
  fullName: string;
  /** Apellidos y nombres por separado, para la orden de pago. */
  surnames: string;
  firstNames: string;
  maskedDocument: string;
  maskedEmail: string;
  modality: string;
  modalityCode: 'ORD' | 'EXO' | 'CEPRE';
  quotaCategoryName: string;
  program: string;
  status: 'PENDIENTE_PAGO' | 'PENDIENTE_VALIDACION' | 'APTA' | 'OBSERVADA' | 'ANULADA';
  statusLabel: string;
  noVacancyRight: boolean;
  fee: { total: string; lines: FeeQuoteLineDto[] };
  paymentEntities: string[];
  fichaAvailable: boolean;
  examDate: string;
  createdAt: string;
}

/** Una sesión abierta por dispositivo (spec 002). */
export interface SessionDto {
  id: string;
  device: string;
  lastActiveAt: string;
  current: boolean;
}

export interface ActivityDto {
  occurredAt: string;
  action: string;
  description: string;
}

// ── 005 Pagos en línea con Culqi: tarjeta y Yape (ADR-024) ─────────
export type PaymentAttemptStatus = 'INICIADO' | 'AUTORIZADO' | 'RECHAZADO' | 'VENCIDO' | 'DUPLICADO';

/** Lo que el navegador necesita para abrir Culqi Checkout, sin la llave secreta. */
export interface PaymentSessionDto {
  provider: 'culqi' | 'mock';
  environment: 'sandbox' | 'production' | 'simulated';
  publicKey: string;
  transactionId: string;
  orderNumber: string;
  amount: string;
  /** Monto en céntimos, como lo pide Culqi. */
  amountCents: number;
  currency: 'PEN';
  /** Yape solo acepta hasta S/ 2000 por pago. */
  yape: boolean;
}

export interface PaymentAttemptResultDto {
  transactionId: string;
  status: PaymentAttemptStatus;
  label: string;
  message: string | null;
  orderStatus: 'PENDIENTE' | 'PAGADA';
}

export interface PaymentStatusDto {
  provider: 'culqi' | 'mock';
  environment: 'sandbox' | 'production' | 'simulated';
  order: {
    orderNumber: string | null;
    amount: string;
    status: 'PENDIENTE' | 'PAGADA';
    paidAt: string | null;
    receipt: { operationNumber: string | null; authorizationCode: string | null; payMethod: string | null; cardMasked: string | null; transactionId: string } | null;
  };
  attempts: { transactionId: string; orderNumber: string; status: PaymentAttemptStatus; label: string; message: string | null; payMethod: string | null; createdAt: string }[];
  /** Tope de Yape por pago. */
  yapeMaxAmount: string;
}

// ── 009 Asistente virtual (ADR-017) ─────────────────────────────────
export interface AssistantReplyDto {
  conversationId: string;
  reply: string;
  sources: string[];
  mode: 'ia' | 'basico';
  suggestHandoff: boolean;
  identified: boolean;
}

export interface AssistantPassDto {
  accessToken: string;
  expiresAt: string;
  firstName: string;
}

// ── 004 Expediente de exonerados (M06) ──────────────────────────────
export type DossierStatus = 'BORRADOR' | 'EN_REVISION' | 'OBSERVADO' | 'AUTORIZADO' | 'RECHAZADO' | 'NO_SUBSANADO';

export interface DossierDocumentDto {
  id: string;
  version: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  status: 'CARGADO' | 'CONFORME' | 'OBSERVADO' | 'REEMPLAZADO';
  note: string | null;
  uploadedAt: string;
}

export interface DossierDto {
  id?: string;
  applicantCode: string;
  fullName?: string;
  document?: string;
  inscriptionStatus?: string;
  submodality: string;
  category: string;
  program: string;
  status: DossierStatus;
  statusLabel: string;
  editable: boolean;
  submittedAt: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  observeDeadline: string | null;
  verifiedInPerson: boolean;
  specialEvaluation: { date: string; place: string; note: string } | null;
  complementaryFields: { key: string; label: string; type?: 'number' }[];
  /** RF-04.11: criterios con que la Comisión evalúa esta submodalidad. */
  evaluationCriteria?: string | null;
  complementary: Record<string, string>;
  requirements: {
    code: string; name: string; description: string; article: string; mandatory: boolean; acceptedFormats: string[];
    current: DossierDocumentDto | null; history?: DossierDocumentDto[];
  }[];
  events: { action: string; note: string | null; at: string; byStaff: boolean }[];
  evaluators?: { id: string; name: string }[];
}
