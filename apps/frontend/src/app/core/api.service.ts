import type { UploadTicket } from './direct-upload';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  ApiErrorBody,
  AnnouncementDto, ApiResponse, AssistantPassDto, AssistantReplyDto, DossierDto, AreaDto, ContactRequestDto, CurrentCallDto, FeeDto, FeeQuoteDto, HomeContentDto,
  IdentityResultDto, InscriptionOptionsDto, InscriptionRequestDto, InscriptionSummaryDto, OfficialDocumentDto,
  OptionDetailDto, OptionSummaryDto, OptionsMeta, PageMeta, PaymentAttemptResultDto, PaymentSessionDto, PaymentStatusDto,
  QuotaCategoryDto, RequirementDto, StatsDto, SyllabusNodeDto,
} from '@sia/contracts';
import { map, type Observable } from 'rxjs';

export interface SubmodalityDto {
  code: string;
  name: string;
  modality: 'ORD' | 'EXO' | 'CEPRE';
  legalBasis: string;
  evaluationCriteria: string | null;
}

const API = '/api/v1';

export interface ReinscriptionCheck {
  eligible: boolean;
  reason: string | null;
  fullName: string;
  fromModality: string;
  amount: string | null;
  window: { startsAt: string; endsAt: string; open: boolean } | null;
}

/** Spec 006, Historia 4: respuesta de «Buscar aula». */
export interface ExamRoomDto {
  applicantCode: string; fullName: string; program: string; modality: string;
  state: 'NO_EXAM' | 'NOT_ELIGIBLE' | 'NOT_PUBLISHED' | 'NOT_ASSIGNED' | 'ASSIGNED';
  message: string | null;
  exam?: { name: string; date: string; entryOpensAt: string; entryClosesAt: string; durationMinutes: number; place: string; publishAt: string; instructions: { llevar: string[]; prohibido: string[]; notas: string } };
  accommodation?: { needs: string; late: boolean; createdAt: string } | null;
  canRequestAccommodation?: boolean;
  room?: { venue: string; address: string; building: string; floor: number; code: string; gate: string; accessible: boolean; seat: number };
}

/** Spec 007, Historia 4: «Ver puntaje». */
export interface MyResultDto {
  applicantCode: string; fullName: string; program: string; modality: string;
  state: 'NO_EXAM' | 'NOT_PUBLISHED' | 'NOT_IN_RESULTS' | 'PUBLISHED'; exam?: string; message: string | null;
  version?: number; score?: string | null; rank?: number | null; groupSize?: number; vacancies?: number; minimum?: number;
  condition?: 'ADMITIDO' | 'NO_ADMITIDO' | 'AUSENTE' | 'NO_CALIFICABLE' | 'SIN_DERECHO_VACANTE'; conditionLabel?: string;
  breakdown?: { label: string; correct: number | null; points: string }[] | null;
  admission?: { status: 'PENDIENTE' | 'INGRESANTE' | 'PERDIDA'; receivedAt: string | null; late: boolean; deliveryFrom: string | null; deliveryTo: string | null; lateDay: string | null; fee: string; surcharge: string } | null;
}
export interface AdmittedListDto { exam: string; published: boolean; version?: number; rows: { applicantCode: string; fullName: string; program: string; quotaCategory: string; score: string; rank: number }[] }
export interface InboxDto { reminders: boolean; unread: number; items: { id: string; subject: string; text: string; event: string; read: boolean; at: string }[] }

export type FichaVerification =
  | { valid: true; applicantCode: string; name: string; document: string; program: string; modality: string; call: string; photo: string | null }
  | { valid: false; reason: string };

/** Cliente tipado de /api/v1 (contratos en specs/00x/contracts/openapi.yaml). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== '') p = p.set(k, String(v));
    return this.http.get<ApiResponse<T>>(`${API}${path}`, { params: p }).pipe(map((r) => r.data));
  }

  // ── 001 Portal público ───────────────────────────────────────────
  currentCall = () => this.get<CurrentCallDto>('/calls/current');
  areas = (call: string) => this.get<AreaDto[]>(`/calls/${call}/areas`);
  quotaCategories = (call: string) => this.get<QuotaCategoryDto[]>(`/calls/${call}/quota-categories`);
  submodalities = (call: string) => this.get<SubmodalityDto[]>(`/calls/${call}/submodalities`);
  options(call: string, filter: { q?: string; area?: string; category?: string } = {}) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(filter)) if (v) p = p.set(k, v);
    return this.http.get<ApiResponse<OptionSummaryDto[], OptionsMeta>>(`${API}/calls/${call}/options`, { params: p });
  }
  option = (call: string, code: string) => this.get<OptionDetailDto>(`/calls/${call}/options/${code}`);
  fees = (call: string) => this.get<FeeDto[]>(`/calls/${call}/fees`);
  feeQuote = (call: string, q: Record<string, string | boolean | undefined>) => this.get<FeeQuoteDto>(`/calls/${call}/fee-quote`, q);
  requirements = (call: string, submodality?: string) => this.get<RequirementDto[]>(`/calls/${call}/requirements`, { submodality });
  syllabus = (call: string, q?: string) => this.get<SyllabusNodeDto[]>(`/calls/${call}/syllabus`, { q });
  documents = (call: string) => this.get<OfficialDocumentDto[]>(`/calls/${call}/documents`);
  stats = (call: string) => this.get<StatsDto>(`/calls/${call}/stats`);
  announcements(filter: { section?: string; type?: string; page?: number } = {}) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(filter)) if (v) p = p.set(k, String(v));
    return this.http.get<ApiResponse<AnnouncementDto[], PageMeta>>(`${API}/announcements`, { params: p });
  }
  home = () => this.get<HomeContentDto>('/content/home');
  contact = (body: ContactRequestDto) =>
    this.http.post<ApiResponse<{ caseNumber: string }>>(`${API}/support/contact`, body).pipe(map((r) => r.data));
  /** Denuncia atendida con reserva: el nombre es opcional. */
  complaint = (body: Omit<ContactRequestDto, 'name'> & { name?: string; attachments?: { fileName: string; content: string }[] }) =>
    this.http.post<ApiResponse<{ caseNumber: string }>>(`${API}/support/complaint`, body).pipe(map((r) => r.data));
  /** Relación pública de observados (código y modalidad). */
  observed = () => this.get<{ callCode: string; rows: { applicantCode: string; modality: string; since: string }[] }>('/inscriptions/observed');

  // ── 003 Inscripción pública (ADR-015) ────────────────────────────
  identityLookup = (documentType: 'DNI' | 'CE', documentNumber: string) =>
    this.http.post<ApiResponse<IdentityResultDto>>(`${API}/identity/lookup`, { documentType, documentNumber }).pipe(map((r) => r.data));

  /** «¿No encuentras tu código?»: lo reenvía al correo registrado (la respuesta no dice si existe). */
  remindCode = (documentNumber: string) =>
    this.http.post<ApiResponse<{ message: string }>>(`${API}/inscriptions/code-reminder`, { documentNumber }).pipe(map((r) => r.data));
  inscriptionOptions = () => this.get<InscriptionOptionsDto>('/inscriptions/options');
  register = (body: InscriptionRequestDto) =>
    this.http.post<ApiResponse<InscriptionSummaryDto>>(`${API}/inscriptions`, body).pipe(map((r) => r.data));
  inscriptionStatus = (documentNumber: string, applicantCode: string) =>
    this.get<InscriptionSummaryDto>('/inscriptions/status', { documentNumber, applicantCode });

  /** Ficha PDF con QR (spec 003, Historia 5): se descarga como archivo, sin abrir una URL con el DNI. */
  fichaPdf = (documentNumber: string, applicantCode: string) =>
    this.http.get(`${API}/inscriptions/ficha.pdf`, { params: new HttpParams().set('documentNumber', documentNumber).set('applicantCode', applicantCode), responseType: 'blob' });
  /** Spec 004, Historia 6: programa y ciclo adjudicados por el CEPRE a un DNI. */
  cepreAwardee = (documentNumber: string) =>
    this.get<{ optionCode: string; program: string; area: string; quotaCategory: string; cycle: string }>('/inscriptions/cepre-awardee', { documentNumber });
  /** Historia 6 (RN-16): reinscripción de exonerados no admitidos al Ordinario. */
  reinscriptionCheck = (documentNumber: string, applicantCode: string) =>
    this.get<ReinscriptionCheck>('/inscriptions/reinscription', { documentNumber, applicantCode });
  reinscribe = (documentNumber: string, applicantCode: string, optionCode: string) =>
    this.http.post<ApiResponse<InscriptionSummaryDto>>(`${API}/inscriptions/reinscription`, { documentNumber, applicantCode, optionCode }).pipe(map((r) => r.data));
  ordenPagoPdf = (documentNumber: string, applicantCode: string) =>
    this.http.get(`${API}/inscriptions/orden-pago.pdf`, { params: new HttpParams().set('documentNumber', documentNumber).set('applicantCode', applicantCode), responseType: 'blob' });
  verifyFicha = (token: string) => this.get<FichaVerification>(`/inscriptions/verify/${encodeURIComponent(token)}`);

  // ── 004 Expediente de exonerados (M06) ───────────────────────────
  dossier = (documentNumber: string, applicantCode: string) => this.get<DossierDto>('/dossier', { documentNumber, applicantCode });
  /** ADR-010: con S3 devuelve un formulario prefirmado; sin S3, `inline` (el archivo va en base64). */
  dossierUploadUrl = (body: { documentNumber: string; applicantCode: string; requirementCode: string; contentType: string; size: number }) =>
    this.http.post<ApiResponse<UploadTicket>>(`${API}/dossier/documents/upload-url`, body).pipe(map((r) => r.data));
  dossierUpload = (body: { documentNumber: string; applicantCode: string; requirementCode: string; fileName: string; contentBase64?: string; uploadKey?: string }) =>
    this.http.post<ApiResponse<DossierDto>>(`${API}/dossier/documents`, body).pipe(map((r) => r.data));
  dossierComplementary = (documentNumber: string, applicantCode: string, values: Record<string, string>) =>
    this.http.put<ApiResponse<DossierDto>>(`${API}/dossier/complementary`, { documentNumber, applicantCode, values }).pipe(map((r) => r.data));
  dossierSubmit = (documentNumber: string, applicantCode: string) =>
    this.http.post<ApiResponse<DossierDto>>(`${API}/dossier/submit`, { documentNumber, applicantCode }).pipe(map((r) => r.data));
  dossierFile = (documentNumber: string, applicantCode: string, documentId: string) =>
    this.http.get(`${API}/dossier/documents/${documentId}`, { params: new HttpParams().set('documentNumber', documentNumber).set('applicantCode', applicantCode), responseType: 'blob' });

  // ── 006 Examen y aulas (M07, M08) ────────────────────────────────
  examRoom = (documentNumber: string, applicantCode: string) => this.get<ExamRoomDto>('/exam/room', { documentNumber, applicantCode });
  examSlip = (documentNumber: string, applicantCode: string) =>
    this.http.get(`${API}/exam/slip.pdf`, { params: new HttpParams().set('documentNumber', documentNumber).set('applicantCode', applicantCode), responseType: 'blob' });
  examAccommodation = (documentNumber: string, applicantCode: string, needs: string) =>
    this.http.post<ApiResponse<ExamRoomDto>>(`${API}/exam/accommodation`, { documentNumber, applicantCode, needs }).pipe(map((r) => r.data));

  // ── 007 Resultados e ingreso (M09) ───────────────────────────────
  myResult = (documentNumber: string, applicantCode: string) => this.get<MyResultDto>('/results/me', { documentNumber, applicantCode });
  admitted = (exam: string, option?: string) => this.get<AdmittedListDto>('/results/admitted', { exam, option });
  admissionCertificate = (documentNumber: string, applicantCode: string) =>
    this.http.get(`${API}/results/certificate.pdf`, { params: new HttpParams().set('documentNumber', documentNumber).set('applicantCode', applicantCode), responseType: 'blob' });
  verifyAdmission = (token: string) => this.get<{ valid: true; applicantCode: string; name: string; program: string; modality: string } | { valid: false; reason: string }>(`/results/verify/${encodeURIComponent(token)}`);
  resultReview = (documentNumber: string, applicantCode: string, description: string) =>
    this.http.post<ApiResponse<{ caseNumber: string }>>(`${API}/results/review`, { documentNumber, applicantCode, description }).pipe(map((r) => r.data));

  // ── 010 Notificaciones (M11) ─────────────────────────────────────
  inbox = (documentNumber: string, applicantCode: string) => this.get<InboxDto>('/notifications', { documentNumber, applicantCode });
  inboxRead = (documentNumber: string, applicantCode: string, ids: string[]) =>
    this.http.post<ApiResponse<InboxDto>>(`${API}/notifications/read`, { documentNumber, applicantCode, ids }).pipe(map((r) => r.data));
  inboxReminders = (documentNumber: string, applicantCode: string, reminders: boolean) =>
    this.http.put<ApiResponse<InboxDto>>(`${API}/notifications/preferences`, { documentNumber, applicantCode, reminders }).pipe(map((r) => r.data));

  /** AC07 (EQ-07): encuesta SUS al terminar la inscripción. */
  usabilitySurvey = (body: { documentNumber: string; applicantCode: string; answers: number[]; comment?: string; durationSeconds?: number; device?: 'celular' | 'tableta' | 'computadora' }) =>
    this.http.post<ApiResponse<{ score: number }>>(`${API}/inscriptions/survey`, body).pipe(map((r) => r.data));

  // ── 005 Pagos en línea con Culqi: tarjeta y Yape (ADR-024) ─────────
  paymentSession = (documentNumber: string, applicantCode: string) =>
    this.http.post<ApiResponse<PaymentSessionDto>>(`${API}/payments/session`, { documentNumber, applicantCode }).pipe(map((r) => r.data));
  /** Cobra el token que entregó Culqi Checkout (o el de la pasarela simulada). */
  paymentCharge = (documentNumber: string, applicantCode: string, transactionId: string, token: string) =>
    this.http.post<ApiResponse<PaymentAttemptResultDto>>(`${API}/payments/charge`, { documentNumber, applicantCode, transactionId, token }).pipe(map((r) => r.data));
  paymentStatus = (documentNumber: string, applicantCode: string) =>
    this.get<PaymentStatusDto>('/payments/status', { documentNumber, applicantCode });
  // ── 009 Asistente virtual (ADR-017) ──────────────────────────────
  assistantSuggestions = () => this.get<{ suggestions: string[]; aiEnabled: boolean }>('/assistant/suggestions');
  assistantAsk = (body: { message: string; conversationId?: string; accessToken?: string }) =>
    this.http.post<ApiResponse<AssistantReplyDto>>(`${API}/assistant/messages`, body).pipe(map((r) => r.data));
  assistantIdentify = (documentNumber: string, applicantCode: string) =>
    this.http.post<ApiResponse<AssistantPassDto>>(`${API}/assistant/identify`, { documentNumber, applicantCode }).pipe(map((r) => r.data));
  assistantHandoff = (body: { conversationId: string; name: string; email: string }) =>
    this.http.post<ApiResponse<{ caseNumber: string }>>(`${API}/assistant/handoff`, body).pipe(map((r) => r.data));

}

/** Error HTTP de Angular cuyo cuerpo es el sobre de error de la API (contrato compartido con el backend). */
type ApiHttpError = { error?: Partial<ApiErrorBody> | null; status?: number } | null | undefined;

/** Extrae el mensaje legible del sobre `{ error }` de la API. */
export function apiErrorMessage(error: unknown, fallback = 'No pudimos completar la acción. Inténtalo de nuevo.'): string {
  const e = error as ApiHttpError;
  if (e?.status === 0) return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  return e?.error?.error?.message ?? fallback;
}

export function apiErrorCode(error: unknown): string | undefined {
  return (error as ApiHttpError)?.error?.error?.code;
}

export function apiErrorDetails(error: unknown): NonNullable<ApiErrorBody['error']['details']> {
  return (error as ApiHttpError)?.error?.error?.details ?? [];
}
