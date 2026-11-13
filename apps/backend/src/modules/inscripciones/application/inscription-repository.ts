import type { ApplicationModel, ApplicationUncheckedCreateInput } from '../../../generated/prisma/models.js';
import type { Tx } from '../../../shared/db/prisma.js';
import type { InscriptionStatus } from '../domain/inscription-rules.js';

/**
 * Fila de inscripción tal como se guarda. Es el tipo que se genera del esquema (solo la forma de los datos):
 * el caso de uso no usa el cliente de base de datos, solo este repositorio.
 */
export type ApplicationRecord = ApplicationModel;
/** Datos para crear una inscripción (los que tienen valor por defecto son opcionales). */
export type NewApplication = ApplicationUncheckedCreateInput;

/** La inscripción ya existe para ese documento y convocatoria (restricción única de la tabla). */
export class DuplicateApplicationError extends Error {
  constructor() {
    super('Ya existe una inscripción para ese documento en la convocatoria.');
  }
}

/** Filtros del panel y de los comunicados segmentados. */
export interface ApplicationFilter {
  callCode?: string;
  status?: InscriptionStatus;
  /** Sin `status`: excluye las anuladas. */
  excludeAnnulled?: boolean;
  modality?: string;
  modalities?: string[];
  optionCode?: string;
  /** Busca en código, documento, apellido paterno y nombres. */
  text?: string;
}

/** Operaciones dentro de una transacción: lo que se guarde aquí se confirma o se deshace junto con la auditoría y los eventos. */
export interface InscriptionUnitOfWork {
  /** Para la auditoría y la bandeja de eventos, que se guardan en la misma transacción. */
  readonly tx: Tx;
  nextApplicantCodeValue(): Promise<number>;
  /** Lanza `DuplicateApplicationError` si el documento ya tiene inscripción en la convocatoria. */
  create(data: NewApplication): Promise<ApplicationRecord>;
  findByCode(applicantCode: string): Promise<ApplicationRecord | null>;
  setStatus(applicantCode: string, status: InscriptionStatus): Promise<void>;
  /** Cambia de PENDIENTE_PAGO a APTA; false si no estaba pendiente de pago. */
  markPaidIfPending(applicantCode: string): Promise<boolean>;
  /** Borra los datos personales y los documentos adjuntos (retención, RF-13.10). */
  anonymize(application: ApplicationRecord, now: Date): Promise<void>;
}

/**
 * Repositorio de M03 Inscripciones (Clean Architecture): el caso de uso decide, el repositorio guarda.
 * La implementación con Prisma está en `infrastructure/prisma-inscription-repository.ts`.
 */
export interface InscriptionRepository {
  findByCode(applicantCode: string): Promise<ApplicationRecord | null>;
  existsForDocument(callCode: string, documentType: string, documentNumber: string, modality?: string): Promise<boolean>;
  findInCallByDocument(callCode: string, documentNumber: string): Promise<ApplicationRecord | null>;
  listByDocument(documentType: string, documentNumber: string, opts?: { excludeAnnulled?: boolean }): Promise<ApplicationRecord[]>;
  list(filter: ApplicationFilter, opts?: { orderBy?: 'createdAt' | 'applicantCode'; skip?: number; take?: number }): Promise<ApplicationRecord[]>;
  count(filter: ApplicationFilter): Promise<number>;
  /** Inscripciones de convocatorias anteriores a `callCode`, creadas antes de `before` y aún no anonimizadas. */
  listExpired(currentCallCode: string, before: Date, take: number): Promise<ApplicationRecord[]>;
  documentKeys(applicantCode: string): Promise<string[]>;

  /** Programa y ciclo adjudicados por el CEPRE-UNSCH a ese DNI, si figura en la lista. */
  findCepreAwardee(callCode: string, documentNumber: string): Promise<{ optionCode: string; cycle: string } | null>;
  /** Condición en el último resultado publicado del examen (ADMITIDO, NO_ADMITIDO, AUSENTE…), o null. */
  latestPublishedCondition(applicantCode: string): Promise<string | null>;

  transaction<T>(work: (uow: InscriptionUnitOfWork) => Promise<T>): Promise<T>;
}
