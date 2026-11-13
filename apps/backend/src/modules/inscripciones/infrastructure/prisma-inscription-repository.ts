import { nextCounterValue } from '../../../shared/db/counters.js';
import type { Db, Tx } from '../../../shared/db/prisma.js';
import {
  DuplicateApplicationError,
  type ApplicationFilter, type ApplicationRecord, type InscriptionRepository, type InscriptionUnitOfWork, type NewApplication,
} from '../application/inscription-repository.js';
import type { InscriptionStatus } from '../domain/inscription-rules.js';

const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === 'P2002';

/** Traduce los filtros del caso de uso a la consulta de Prisma. */
function where(f: ApplicationFilter) {
  return {
    ...(f.callCode ? { callCode: f.callCode } : {}),
    ...(f.status ? { status: f.status } : f.excludeAnnulled ? { status: { not: 'ANULADA' as const } } : {}),
    ...(f.modality ? { modality: f.modality } : {}),
    ...(f.modalities ? { modality: { in: f.modalities } } : {}),
    ...(f.optionCode ? { optionCode: f.optionCode } : {}),
    ...(f.text
      ? { OR: [{ applicantCode: { contains: f.text } }, { documentNumber: { contains: f.text } }, { paternalSurname: { contains: f.text } }, { firstNames: { contains: f.text } }] }
      : {}),
  };
}

/** Operaciones de inscripción dentro de una transacción de Prisma. */
class PrismaInscriptionUnitOfWork implements InscriptionUnitOfWork {
  constructor(readonly tx: Tx) {}

  nextApplicantCodeValue() {
    return nextCounterValue(this.tx, 'applicant_code', 2_700_001);
  }

  async create(data: NewApplication) {
    try {
      return await this.tx.application.create({ data });
    } catch (e) {
      if (isUniqueViolation(e)) throw new DuplicateApplicationError();
      throw e;
    }
  }

  findByCode(applicantCode: string) {
    return this.tx.application.findUnique({ where: { applicantCode } });
  }

  async setStatus(applicantCode: string, status: InscriptionStatus) {
    await this.tx.application.update({ where: { applicantCode }, data: { status } });
  }

  async markPaidIfPending(applicantCode: string) {
    const r = await this.tx.application.updateMany({ where: { applicantCode, status: 'PENDIENTE_PAGO' }, data: { status: 'APTA' } });
    return r.count === 1;
  }

  async anonymize(a: ApplicationRecord, now: Date) {
    await this.tx.applicationDocument.deleteMany({ where: { applicantCode: a.applicantCode } });
    await this.tx.application.update({
      where: { id: a.id },
      data: {
        documentNumber: `X${a.applicantCode}`, paternalSurname: 'ANONIMIZADO', maternalSurname: '', firstNames: 'ANONIMIZADO',
        address: '', phone: null, mobile: '000000000', email: `${a.applicantCode}@anonimizado.invalid`, photoKey: '',
        birthDate: new Date('1900-01-01'), schoolName: '', anonymizedAt: now,
      },
    });
  }
}

/** Repositorio de inscripciones sobre PostgreSQL (Prisma). */
export class PrismaInscriptionRepository implements InscriptionRepository {
  constructor(private readonly db: Db) {}

  findByCode(applicantCode: string) {
    return this.db.application.findUnique({ where: { applicantCode } });
  }

  async existsForDocument(callCode: string, documentType: string, documentNumber: string, modality?: string) {
    const row = await this.db.application.findFirst({ where: { callCode, documentType, documentNumber, ...(modality ? { modality } : {}) }, select: { id: true } });
    return Boolean(row);
  }

  findInCallByDocument(callCode: string, documentNumber: string) {
    return this.db.application.findFirst({ where: { callCode, documentNumber, anonymizedAt: null } });
  }

  listByDocument(documentType: string, documentNumber: string, opts: { excludeAnnulled?: boolean } = {}) {
    return this.db.application.findMany({
      where: { documentType, documentNumber: documentNumber.toUpperCase(), ...(opts.excludeAnnulled ? { status: { not: 'ANULADA' as const } } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  list(filter: ApplicationFilter, opts: { orderBy?: 'createdAt' | 'applicantCode'; skip?: number; take?: number } = {}) {
    const orderBy = opts.orderBy === 'applicantCode' ? { applicantCode: 'asc' as const } : { createdAt: 'desc' as const };
    return this.db.application.findMany({
      where: where(filter), orderBy,
      ...(opts.skip !== undefined ? { skip: opts.skip } : {}),
      ...(opts.take !== undefined ? { take: opts.take } : {}),
    });
  }

  count(filter: ApplicationFilter) {
    return this.db.application.count({ where: where(filter) });
  }

  listExpired(currentCallCode: string, before: Date, take: number) {
    return this.db.application.findMany({ where: { callCode: { not: currentCallCode }, createdAt: { lt: before }, anonymizedAt: null }, take });
  }

  async documentKeys(applicantCode: string) {
    return (await this.db.applicationDocument.findMany({ where: { applicantCode }, select: { fileKey: true } })).map((d) => d.fileKey);
  }

  findCepreAwardee(callCode: string, documentNumber: string) {
    return this.db.cepreAwardee.findUnique({ where: { callCode_documentNumber: { callCode, documentNumber } }, select: { optionCode: true, cycle: true } });
  }

  async latestPublishedCondition(applicantCode: string) {
    const r = await this.db.examResult.findFirst({
      where: { applicantCode, version: { status: 'PUBLICADA' } },
      orderBy: { version: { version: 'desc' } },
      select: { condition: true },
    });
    return r?.condition ?? null;
  }

  transaction<T>(work: (uow: InscriptionUnitOfWork) => Promise<T>) {
    return this.db.$transaction((tx) => work(new PrismaInscriptionUnitOfWork(tx)));
  }
}
