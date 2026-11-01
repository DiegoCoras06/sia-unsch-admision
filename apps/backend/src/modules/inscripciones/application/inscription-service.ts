import { createHash } from 'node:crypto';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import type { AuditLog } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import { districtLabel, isValidDistrict } from '../../../shared/data/ubigeo.js';
import { nextCounterValue } from '../../../shared/db/counters.js';
import type { Db } from '../../../shared/db/prisma.js';
import type { Outbox } from '../../../shared/events/outbox.js';
import { businessRule, conflict, notFound, validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import { jpegSize, type FileStorage } from '../../../shared/storage/file-storage.js';
import { maskEmail } from '../../../shared/telemetry/logger.js';
import type { ConvocatoriasQueries } from '../../convocatorias/index.js';
import type { AccessService } from '../../seguridad/index.js';
import { applicantCodeFromSequence, type IdentityProvider } from '../../usuarios/index.js';
import {
  CAMPUSES, ECONOMIC_DEPENDENCY, MARITAL_STATUS, MODALITIES, PAYMENT_ENTITIES, PHOTO, PREPARATION, STATUS_LABEL,
  initialStatus, isPlausibleGraduationYear, maskDocument, type InscriptionStatus,
} from '../domain/inscription-rules.js';

/** Tasa de reinscripción (Tabla N.° 3, ítem 5) y submodalidades que no pueden reinscribirse (Art. 21). */
const REINSCRIPTION_FEE = 'T-5';
const NO_REINSCRIPTION = new Set(['GRA', 'TI', 'TEN', 'TEI']);

export interface InscriptionInput {
  documentType: 'DNI' | 'CE';
  documentNumber: string;
  paternalSurname: string;
  maternalSurname: string;
  firstNames: string;
  sex: 'M' | 'F';
  maritalStatus: keyof typeof MARITAL_STATUS;
  birthUbigeo: string;
  birthDate: string;
  address: string;
  residenceUbigeo: string;
  economicDependency: keyof typeof ECONOMIC_DEPENDENCY;
  phone?: string | undefined;
  mobile: string;
  email: string;
  photo: string;
  schoolUbigeo: string;
  schoolName: string;
  schoolType: 'ESTATAL' | 'PARTICULAR';
  graduationYear: number;
  inFourthOrBelow: boolean;
  preparation: keyof typeof PREPARATION;
  attempts: number;
  modality: 'ORD' | 'EXO' | 'CEPRE';
  quotaCategory: string;
  campus: keyof typeof CAMPUSES;
  optionCode: string;
  militaryCondition: 'NONE' | 'ACTIVE' | 'DISCHARGED';
  familyLink: boolean;
  declarationAccepted: true;
  /** Versión de la política de datos que el postulante aceptó en el formulario. */
  consentVersion: string;
}

export interface InscriptionSummary {
  applicantCode: string;
  fullName: string;
  maskedDocument: string;
  maskedEmail: string;
  modality: string;
  modalityCode: 'ORD' | 'EXO' | 'CEPRE';
  quotaCategoryName: string;
  program: string;
  status: InscriptionStatus;
  statusLabel: string;
  noVacancyRight: boolean;
  fee: { total: string; lines: { code: string; concept: string; amount: string; legalNote: string }[] };
  paymentEntities: string[];
  /** La ficha PDF con QR se habilita con la inscripción Apta (spec 003, Historia 5). */
  fichaAvailable: boolean;
  examDate: string;
  createdAt: string;
}

/** Lo que M05 Pagos necesita de una inscripción (sin la foto ni datos académicos). */
export interface PaymentContext {
  applicantCode: string;
  callCode: string;
  status: InscriptionStatus;
  amount: string;
  firstNames: string;
  surnames: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  documentType: 'DNI' | 'CE';
  documentNumber: string;
}

const longDate = (d: Date) => d.toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (d: Date) => d.toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'long' });

/** Casos de uso de la inscripción pública (spec 003 iteración 1, ADR-015). */
export class InscriptionService {
  constructor(
    private readonly d: {
      db: Db;
      clock: Clock;
      outbox: Outbox;
      audit: AuditLog;
      limiter: RateLimiter;
      storage: FileStorage;
      identity: IdentityProvider;
      convocatorias: ConvocatoriasQueries;
      access: AccessService;
      /** RF-13.09: política de tratamiento de datos vigente (la publica M02). */
      currentConsent?: () => Promise<{ version: string; textMarkdown: string }>;
    },
  ) {}

  private async callCode(): Promise<string> {
    return (await this.d.convocatorias.getCurrentCall()).code;
  }

  /** Autocompletar nombres por DNI (sin dígito verificador, como el portal oficial). */
  async lookupIdentity(documentType: 'DNI' | 'CE', documentNumber: string, meta: RequestMeta) {
    await this.d.limiter.consume(`inscription-lookup:${meta.ipHash}`, 20, 3600);
    const callCode = await this.callCode();
    const alreadyRegistered = Boolean(
      await this.d.db.application.findFirst({
        where: { callCode, documentType, documentNumber },
        select: { id: true },
      }),
    );
    const empty = { found: false, paternalSurname: null, maternalSurname: null, firstNames: null, birthDate: null, simulated: this.d.identity.simulated, alreadyRegistered };
    if (documentType !== 'DNI') return empty;
    if (!/^\d{8}$/.test(documentNumber)) throw validationError('El DNI debe tener 8 dígitos.', [{ field: 'documentNumber', issue: '8 dígitos' }]);
    const result = await this.d.identity.lookupDni(documentNumber);
    if (result.kind === 'EXPIRED') throw businessRule('DOCUMENT_EXPIRED', 'Tu DNI no está vigente. Renuévalo antes de inscribirte (Art. 17.2).');
    if (result.kind === 'UNAVAILABLE') return { ...empty, unavailable: true };
    if (result.kind !== 'MATCHED') return empty;
    await this.d.audit.record({ actorUserId: null, action: 'identity.lookup', resourceType: 'document', resourceId: maskDocument(documentNumber), ...meta });
    return {
      found: true,
      paternalSurname: result.paternalSurname,
      maternalSurname: result.maternalSurname,
      firstNames: result.firstNames,
      birthDate: result.birthDate || null,
      simulated: this.d.identity.simulated,
      alreadyRegistered,
    };
  }

  /** Catálogos del formulario. */
  async options() {
    const call = await this.d.convocatorias.getCurrentCall();
    const categories = await this.d.convocatorias.listQuotaCategories(call.code);
    const open = (scope: string) => call.stages.some((s) => s.scope === scope && (s.kind === 'REGULAR' || s.kind === 'EXTEMPORANEOUS') && s.status === 'IN_PROGRESS');
    return {
      callCode: call.code,
      /** La consulta de DNI es simulada (identidades de prueba) y no RENIEC real. */
      identitySimulated: this.d.identity.simulated,
      maritalStatus: MARITAL_STATUS,
      economicDependency: ECONOMIC_DEPENDENCY,
      preparation: PREPARATION,
      campuses: CAMPUSES,
      modalities: (Object.keys(MODALITIES) as (keyof typeof MODALITIES)[]).map((code) => ({
        code,
        name: MODALITIES[code],
        open: open(code),
        categories: categories.filter((c) => c.modality === code).map((c) => ({ code: c.code, name: c.name, submodality: c.submodality })),
      })),
    };
  }

  /** H1–H3: registrar la inscripción. */
  async register(input: InscriptionInput, meta: RequestMeta): Promise<InscriptionSummary> {
    await this.d.limiter.consume(`inscription:${meta.ipHash}`, 10, 3600);
    const now = this.d.clock.now();
    const call = await this.d.convocatorias.getCurrentCall();

    // 0. RF-13.09: el consentimiento debe ser sobre la versión vigente del texto.
    const consent = this.d.currentConsent ? await this.d.currentConsent() : null;
    if (consent && input.consentVersion !== consent.version) {
      throw businessRule('CONSENT_OUTDATED', 'La política de tratamiento de datos cambió. Vuelve a leerla y acéptala para continuar.');
    }

    // 1. Etapa abierta para la modalidad.
    const stages = call.stages.filter((s) => s.scope === input.modality && (s.kind === 'REGULAR' || s.kind === 'EXTEMPORANEOUS'));
    if (!stages.some((s) => s.status === 'IN_PROGRESS')) {
      const next = stages.find((s) => s.status === 'UPCOMING');
      throw businessRule(
        'STAGE_CLOSED',
        next
          ? `La inscripción de ${MODALITIES[input.modality]} se abre el ${shortDate(new Date(next.startsAt))}.`
          : `La inscripción de ${MODALITIES[input.modality]} ya cerró.`,
      );
    }

    // 1.1 Una inscripción por documento en la convocatoria (la reinscripción al Ordinario tiene su propio caso de uso).
    if (await this.d.db.application.findFirst({ where: { callCode: call.code, documentType: input.documentType, documentNumber: input.documentNumber }, select: { id: true } })) {
      throw conflict('ALREADY_REGISTERED', 'Este documento ya tiene una inscripción en esta convocatoria. Consulta tu inscripción con tu DNI y tu código de postulante.');
    }

    // 1.2 Adjudicados CEPRE (spec 004, Historia 6): solo quien figura en la lista, con el programa y el ciclo adjudicados.
    if (input.modality === 'CEPRE') {
      const awardee = input.documentType === 'DNI'
        ? await this.d.db.cepreAwardee.findUnique({ where: { callCode_documentNumber: { callCode: call.code, documentNumber: input.documentNumber } } })
        : null;
      if (!awardee) throw businessRule('NOT_CEPRE_AWARDEE', 'Tu DNI no figura en la lista de adjudicados del CEPRE-UNSCH. Elige otra modalidad o consulta en la Dirección de Admisión.');
      input = { ...input, optionCode: awardee.optionCode, quotaCategory: awardee.cycle };
    }

    // 2. Padrón de inhabilitados (RN-09).
    if (await this.d.access.isDisqualified(input.documentType, input.documentNumber)) {
      throw businessRule('REGISTRATION_NOT_ALLOWED', 'No es posible registrar la inscripción. Acércate a la Dirección de Admisión.');
    }

    // 3. Ubigeos, fechas y año de egreso.
    for (const [field, code] of [['birthUbigeo', input.birthUbigeo], ['residenceUbigeo', input.residenceUbigeo], ['schoolUbigeo', input.schoolUbigeo]] as const) {
      if (!isValidDistrict(code)) throw businessRule('INVALID_UBIGEO', 'Elige departamento, provincia y distrito.', { details: [{ field, issue: 'ubigeo inválido' }] });
    }
    const birthDate = new Date(`${input.birthDate}T00:00:00Z`);
    if (Number.isNaN(birthDate.getTime()) || birthDate.getTime() > now.getTime() || now.getUTCFullYear() - birthDate.getUTCFullYear() > 90) {
      throw validationError('Revisa tu fecha de nacimiento.', [{ field: 'birthDate', issue: 'fecha inválida' }]);
    }
    if (!isPlausibleGraduationYear(input.graduationYear, now)) {
      throw validationError('Revisa el año en que culminaste el colegio.', [{ field: 'graduationYear', issue: 'año inválido' }]);
    }

    // 4. Categoría de la modalidad y vacantes del programa.
    const categories = await this.d.convocatorias.listQuotaCategories(call.code);
    const category = categories.find((c) => c.code === input.quotaCategory && c.modality === input.modality);
    if (!category) throw validationError('Elige el tipo de tu modalidad.', [{ field: 'quotaCategory', issue: 'no corresponde a la modalidad' }]);
    const option = await this.d.convocatorias.getOption(call.code, input.optionCode);
    const vacancies = option.vacanciesByCategory.find((v) => v.category === category.code)?.quantity ?? 0;
    if (vacancies === 0) throw businessRule('NO_VACANCIES', `${option.displayName} no ofrece vacantes en ${category.name}. Elige otro programa o tipo.`);

    // 5. Foto (RN-22): JPEG 240 × 320, ≤ 2 MB.
    const photo = this.decodePhoto(input.photo);

    // 6. Identidad: si el proveedor reconoce el DNI, prevalecen sus nombres.
    let names = { paternalSurname: input.paternalSurname.trim(), maternalSurname: input.maternalSurname.trim(), firstNames: input.firstNames.trim() };
    let identityStatus: 'VERIFIED' | 'PENDING' = 'PENDING';
    if (input.documentType === 'DNI') {
      const r = await this.d.identity.lookupDni(input.documentNumber);
      if (r.kind === 'EXPIRED') throw businessRule('DOCUMENT_EXPIRED', 'Tu DNI no está vigente (Art. 17.2).');
      if (r.kind === 'MATCHED') {
        names = { paternalSurname: r.paternalSurname, maternalSurname: r.maternalSurname, firstNames: r.firstNames };
        identityStatus = 'VERIFIED';
      }
    }

    // 7. Tasa calculada en el servidor por M01.
    const fee = await this.d.convocatorias.quoteFee(call.code, {
      modality: input.modality,
      submodality: input.modality === 'EXO' ? (category.submodality ?? undefined) : undefined,
      schoolType: input.schoolType,
      militaryCondition: input.modality === 'ORD' ? input.militaryCondition : 'NONE',
      familyLink: input.familyLink,
    });

    const status = initialStatus(input.modality);
    const examStage = call.stages.find((s) => s.kind === 'EXAM' && s.scope === input.modality);
    const examDate = examStage ? longDate(new Date(examStage.startsAt)) : 'Adjudicado por el CEPRE-UNSCH: no rinde examen';

    try {
      const created = await this.d.db.$transaction(async (tx) => {
        const applicantCode = applicantCodeFromSequence(await nextCounterValue(tx, 'applicant_code', 2_700_001));
        const photoKey = `inscripciones/${call.code}/${applicantCode}.jpg`;
        const row = await tx.application.create({
          data: {
            callCode: call.code,
            applicantCode,
            documentType: input.documentType,
            documentNumber: input.documentNumber,
            identityStatus,
            ...Object.fromEntries(Object.entries(names).map(([k, v]) => [k, v.toUpperCase()])) as typeof names,
            sex: input.sex,
            maritalStatus: input.maritalStatus,
            birthUbigeo: input.birthUbigeo,
            birthDate,
            address: input.address.trim(),
            residenceUbigeo: input.residenceUbigeo,
            economicDependency: input.economicDependency,
            phone: input.phone || null,
            mobile: input.mobile,
            email: input.email.trim().toLowerCase(),
            photoKey,
            schoolUbigeo: input.schoolUbigeo,
            schoolName: input.schoolName.trim().toUpperCase(),
            schoolType: input.schoolType,
            graduationYear: input.graduationYear,
            inFourthOrBelow: input.inFourthOrBelow,
            preparation: input.preparation,
            attempts: input.attempts,
            modality: input.modality,
            quotaCategory: category.code,
            campus: input.campus,
            area: option.area,
            optionCode: option.internalCode,
            militaryCondition: input.modality === 'ORD' ? input.militaryCondition : 'NONE',
            familyLink: input.familyLink,
            noVacancyRight: input.inFourthOrBelow,
            feeTotal: fee.total,
            feeLines: fee.lines as unknown as object[],
            status,
            declarationAcceptedAt: now,
            consentVersion: consent?.version ?? input.consentVersion,
            consentTextHash: consent ? createHash('sha256').update(consent.textMarkdown).digest('hex') : null,
          },
        });
        await this.d.audit.record({ actorUserId: null, action: 'inscription.created', resourceType: 'application', resourceId: row.id, after: { modality: row.modality, optionCode: row.optionCode, status }, ...meta }, tx);
        await this.d.outbox.publish(tx, 'InscripcionRegistrada', {
          email: row.email, firstNames: row.firstNames, applicantCode, program: option.displayName, modality: category.name,
          total: fee.total, status: STATUS_LABEL[status], examDate,
        }, meta.requestId);
        return row;
      });
      await this.d.storage.put(created.photoKey, photo, 'image/jpeg');
      this.d.outbox.kick();
      return this.summary(created, option.displayName, category.name, examDate);
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2002') {
        throw conflict('ALREADY_REGISTERED', 'Este documento ya tiene una inscripción en esta convocatoria. Consulta tu inscripción con tu DNI y tu código de postulante.');
      }
      throw error;
    }
  }

  /**
   * Cuenta opcional (enmienda de ADR-015): inscripciones del mismo documento que la cuenta verificada.
   * La cuenta ya comprobó la identidad (DNI con dígito verificador y correo), así que no pide el código.
   */
  async byDocument(documentType: string, documentNumber: string): Promise<InscriptionSummary[]> {
    const rows = await this.d.db.application.findMany({ where: { documentType, documentNumber: documentNumber.toUpperCase() }, orderBy: { createdAt: 'desc' } });
    if (!rows.length) return [];
    const call = await this.d.convocatorias.getCurrentCall();
    return Promise.all(rows.map(async (row) => {
      const [option, categories] = await Promise.all([
        this.d.convocatorias.getOption(row.callCode, row.optionCode),
        this.d.convocatorias.listQuotaCategories(row.callCode),
      ]);
      const exam = call.stages.find((s) => s.kind === 'EXAM' && s.scope === row.modality);
      return this.summary(row, option.displayName, categories.find((c) => c.code === row.quotaCategory)?.name ?? row.quotaCategory,
        exam ? longDate(new Date(exam.startsAt)) : 'Adjudicado por el CEPRE-UNSCH: no rinde examen');
    }));
  }

  /**
   * Historia 6 (RN-16, Art. 21): ¿puede este exonerado reinscribirse al Ordinario? No pueden los admitidos,
   * los traslados ni los graduados/titulados; solo durante la etapa de reinscripción del cronograma.
   */
  async reinscriptionCheck(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    await this.d.limiter.consume(`reinscription:${meta.ipHash}`, 20, 3600);
    const { row, call } = await this.reinscriptionSource(documentNumber, applicantCode);
    const fee = (await this.d.convocatorias.listFees(call.code)).find((f) => f.code === REINSCRIPTION_FEE);
    const stage = call.stages.find((st) => st.scope === 'REINS');
    const reason = await this.reinscriptionBlocker(row, call);
    return {
      eligible: !reason,
      reason,
      fullName: `${row.firstNames} ${row.paternalSurname} ${row.maternalSurname}`.trim(),
      fromModality: (await this.d.convocatorias.listQuotaCategories(call.code)).find((c) => c.code === row.quotaCategory)?.name ?? row.quotaCategory,
      amount: fee ? Number(fee.amount).toFixed(2) : null,
      window: stage ? { startsAt: stage.startsAt, endsAt: stage.endsAt, open: stage.status === 'IN_PROGRESS' } : null,
    };
  }

  /** Historia 6: crea la inscripción al Ordinario con los datos de la de Exonerados y la tasa T-5 (S/ 180.00). */
  async reinscribe(documentNumber: string, applicantCode: string, optionCode: string, meta: RequestMeta): Promise<InscriptionSummary> {
    await this.d.limiter.consume(`reinscription:${meta.ipHash}`, 20, 3600);
    const { row, call } = await this.reinscriptionSource(documentNumber, applicantCode);
    const reason = await this.reinscriptionBlocker(row, call);
    if (reason) throw businessRule('REINSCRIPTION_NOT_ALLOWED', reason);
    const option = await this.d.convocatorias.getOption(call.code, optionCode);
    if ((option.vacanciesByCategory.find((v) => v.category === 'ORD')?.quantity ?? 0) === 0) {
      throw businessRule('NO_VACANCIES', `${option.displayName} no ofrece vacantes ordinarias. Elige otro programa.`);
    }
    const fee = (await this.d.convocatorias.listFees(call.code)).find((f) => f.code === REINSCRIPTION_FEE);
    if (!fee) throw businessRule('FEE_NOT_CONFIGURED', 'La tasa de reinscripción no está configurada. Consulta en la Dirección de Admisión.');
    const amount = Number(fee.amount).toFixed(2);
    const lines = [{ code: fee.code, concept: fee.concept, amount, legalNote: fee.legalNote }];
    const examStage = call.stages.find((st) => st.kind === 'EXAM' && st.scope === 'ORD');
    const examDate = examStage ? longDate(new Date(examStage.startsAt)) : 'Por publicar';
    const photo = await this.d.storage.get(row.photoKey);

    try {
      const created = await this.d.db.$transaction(async (tx) => {
        const code = applicantCodeFromSequence(await nextCounterValue(tx, 'applicant_code', 2_700_001));
        const { id: _id, applicantCode: _code, createdAt: _c, updatedAt: _u, anonymizedAt: _a, feeLines: _f, ...personal } = row;
        const app = await tx.application.create({
          data: {
            ...personal,
            applicantCode: code,
            photoKey: `inscripciones/${call.code}/${code}.jpg`,
            modality: 'ORD',
            quotaCategory: 'ORD',
            area: option.area,
            optionCode: option.internalCode,
            militaryCondition: 'NONE',
            familyLink: false,
            feeTotal: amount,
            feeLines: lines,
            status: 'PENDIENTE_PAGO',
            declarationAcceptedAt: this.d.clock.now(),
            reinscriptionOf: row.applicantCode,
          },
        });
        await this.d.audit.record({ actorUserId: null, action: 'inscription.reinscribed', resourceType: 'application', resourceId: app.id, after: { from: row.applicantCode, optionCode: app.optionCode }, ...meta }, tx);
        await this.d.outbox.publish(tx, 'InscripcionRegistrada', {
          email: app.email, firstNames: app.firstNames, applicantCode: code, program: option.displayName, modality: 'Ordinario (reinscripción)',
          total: amount, status: STATUS_LABEL.PENDIENTE_PAGO, examDate,
        }, meta.requestId);
        return app;
      });
      if (photo) await this.d.storage.put(created.photoKey, photo, 'image/jpeg');
      this.d.outbox.kick();
      return this.summary(created, option.displayName, 'Ordinario (reinscripción)', examDate);
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2002') throw conflict('ALREADY_REGISTERED', 'Ya tienes una inscripción en el Ordinario. Consúltala en «Mi inscripción».');
      throw error;
    }
  }

  private async reinscriptionSource(documentNumber: string, applicantCode: string) {
    const row = await this.d.db.application.findUnique({ where: { applicantCode } });
    if (!row || row.documentNumber !== documentNumber.trim().toUpperCase()) {
      throw notFound('No encontramos una inscripción con ese documento y código. Revisa los datos.');
    }
    return { row, call: await this.d.convocatorias.getCurrentCall() };
  }

  /** Motivo por el que no puede reinscribirse, o null si puede. */
  private async reinscriptionBlocker(
    row: { applicantCode: string; callCode: string; documentType: string; documentNumber: string; modality: string; quotaCategory: string; status: InscriptionStatus },
    call: Awaited<ReturnType<ConvocatoriasQueries['getCurrentCall']>>,
  ): Promise<string | null> {
    if (row.callCode !== call.code) return 'La inscripción no corresponde a la convocatoria vigente.';
    if (row.modality !== 'EXO') return 'La reinscripción es solo para postulantes de Exonerados que no alcanzaron vacante (Art. 21).';
    if (NO_REINSCRIPTION.has(row.quotaCategory)) return 'Los postulantes por traslado o graduados/titulados no pueden reinscribirse al Ordinario (Art. 21).';
    if (row.status !== 'APTA') return 'Tu inscripción de Exonerados no llegó a estar apta para el examen.';
    if (await this.d.db.application.findFirst({ where: { callCode: row.callCode, documentType: row.documentType, documentNumber: row.documentNumber, modality: 'ORD' }, select: { id: true } })) {
      return 'Ya tienes una inscripción en el Ordinario. Consúltala en «Mi inscripción».';
    }
    // Resultado publicado del examen de Exonerados: solo los no admitidos o ausentes.
    const result = await this.d.db.examResult.findFirst({
      where: { applicantCode: row.applicantCode, version: { status: 'PUBLICADA' } },
      orderBy: { version: { version: 'desc' } },
      select: { condition: true },
    });
    if (!result) return 'Todavía no hay resultados publicados del examen de Exonerados.';
    if (result.condition === 'ADMITIDO') return 'Alcanzaste una vacante en Exonerados: no corresponde reinscribirte.';
    const stage = call.stages.find((st) => st.scope === 'REINS');
    if (!stage || stage.status !== 'IN_PROGRESS') {
      return stage && stage.status === 'UPCOMING'
        ? `La reinscripción se abre el ${shortDate(new Date(stage.startsAt))}.`
        : 'La etapa de reinscripción ya cerró.';
    }
    return null;
  }

  /** H4: consulta con documento + código de postulante. */
  async status(documentNumber: string, applicantCode: string, meta: RequestMeta): Promise<InscriptionSummary> {
    await this.d.limiter.consume(`inscription-status:${meta.ipHash}`, 20, 3600);
    const row = await this.d.db.application.findUnique({ where: { applicantCode } });
    if (!row || row.documentNumber !== documentNumber.trim().toUpperCase()) {
      throw notFound('No encontramos una inscripción con ese documento y código. Revisa los datos.');
    }
    const call = await this.d.convocatorias.getCurrentCall();
    const [option, categories] = await Promise.all([
      this.d.convocatorias.getOption(row.callCode, row.optionCode),
      this.d.convocatorias.listQuotaCategories(row.callCode),
    ]);
    const examStage = call.stages.find((s) => s.kind === 'EXAM' && s.scope === row.modality);
    return this.summary(
      row,
      option.displayName,
      categories.find((c) => c.code === row.quotaCategory)?.name ?? row.quotaCategory,
      examStage ? longDate(new Date(examStage.startsAt)) : 'Adjudicado por el CEPRE-UNSCH: no rinde examen',
    );
  }

  /**
   * «¿No encuentras tu código?»: si hay una inscripción con ese documento en la convocatoria vigente, el código
   * se reenvía al correo registrado. La respuesta no dice si existe (evita averiguar quién se inscribió) y el
   * uso se limita por IP y por documento.
   */
  async remindCode(documentNumber: string, meta: RequestMeta): Promise<void> {
    const doc = documentNumber.trim().toUpperCase();
    await this.d.limiter.consume(`inscription-remind:${meta.ipHash}`, 5, 3600);
    if ((await this.d.limiter.hit(`inscription-remind-doc:${doc}`, 86_400)) > 3) return;
    const call = await this.d.convocatorias.getCurrentCall();
    const row = await this.d.db.application.findFirst({ where: { callCode: call.code, documentNumber: doc, anonymizedAt: null } });
    if (!row) return;
    await this.d.db.$transaction(async (tx) => {
      await this.d.audit.record({ actorUserId: null, action: 'inscription.code_reminded', resourceType: 'application', resourceId: row.id, ...meta }, tx);
      await this.d.outbox.publish(tx, 'CodigoPostulanteRecordado', { applicantCode: row.applicantCode, email: row.email, firstNames: row.firstNames }, meta.requestId);
    });
    this.d.outbox.kick();
  }

  /**
   * API pública para M05 Pagos: datos de la inscripción que se paga, validando DNI + código.
   * No aplica límite de uso: lo aplica el caso de uso de pagos que la llama.
   */
  async paymentContext(documentNumber: string, applicantCode: string): Promise<PaymentContext> {
    const row = await this.d.db.application.findUnique({ where: { applicantCode } });
    if (!row || row.documentNumber !== documentNumber.trim().toUpperCase()) {
      throw notFound('No encontramos una inscripción con ese documento y código. Revisa los datos.');
    }
    const [, province = 'Huamanga', department = 'Ayacucho'] = (districtLabel(row.residenceUbigeo) ?? '').split(', ');
    return {
      applicantCode: row.applicantCode,
      callCode: row.callCode,
      status: row.status,
      amount: Number(row.feeTotal.toString()).toFixed(2),
      firstNames: row.firstNames,
      surnames: `${row.paternalSurname} ${row.maternalSurname}`.trim(),
      email: row.email,
      mobile: row.mobile,
      address: row.address,
      city: province,
      state: department,
      documentType: row.documentType as 'DNI' | 'CE',
      documentNumber: row.documentNumber,
    };
  }

  /**
   * API pública para M10 Asistente: el estado del proceso sin datos de identidad (ni DNI, ni nombres, ni correo),
   * para un código ya verificado con DNI por el pase del asistente (ADR-017).
   */
  async processSnapshot(applicantCode: string) {
    const row = await this.d.db.application.findUnique({ where: { applicantCode } });
    if (!row) return null;
    const call = await this.d.convocatorias.getCurrentCall();
    const [option, categories] = await Promise.all([
      this.d.convocatorias.getOption(row.callCode, row.optionCode),
      this.d.convocatorias.listQuotaCategories(row.callCode),
    ]);
    const exam = call.stages.find((s) => s.kind === 'EXAM' && s.scope === row.modality);
    return {
      estadoInscripcion: STATUS_LABEL[row.status],
      codigoEstado: row.status,
      modalidad: MODALITIES[row.modality as keyof typeof MODALITIES] ?? row.modality,
      tipo: categories.find((c) => c.code === row.quotaCategory)?.name ?? row.quotaCategory,
      programa: option.displayName,
      sinDerechoAVacante: row.noVacancyRight,
      montoInscripcion: Number(row.feeTotal.toString()).toFixed(2),
      identidadVerificada: row.identityStatus === 'VERIFIED',
      fotografiaRecibida: Boolean(row.photoKey),
      fechaExamen: exam ? longDate(new Date(exam.startsAt)) : null,
      fechaExamenIso: exam?.startsAt ?? null,
      registradaEl: longDate(row.createdAt),
    };
  }

  /** Panel (spec 008): inscripciones con búsqueda y filtros, paginadas. Muestra datos completos al personal autorizado. */
  async adminList(filter: { q?: string | undefined; status?: string | undefined; modality?: string | undefined; page: number }) {
    const q = filter.q?.trim().toUpperCase();
    const where = {
      ...(filter.status ? { status: filter.status as InscriptionStatus } : {}),
      ...(filter.modality ? { modality: filter.modality } : {}),
      ...(q ? { OR: [{ applicantCode: { contains: q } }, { documentNumber: { contains: q } }, { paternalSurname: { contains: q } }, { firstNames: { contains: q } }] } : {}),
    };
    const pageSize = 25;
    const [total, rows] = await Promise.all([
      this.d.db.application.count({ where }),
      this.d.db.application.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (filter.page - 1) * pageSize, take: pageSize }),
    ]);
    return {
      total, page: filter.page, pageSize,
      items: rows.map((r) => ({
        applicantCode: r.applicantCode, documentType: r.documentType, documentNumber: r.documentNumber,
        fullName: `${r.paternalSurname} ${r.maternalSurname}, ${r.firstNames}`, email: r.email, mobile: r.mobile,
        modality: r.modality, quotaCategory: r.quotaCategory, optionCode: r.optionCode, status: r.status, statusLabel: STATUS_LABEL[r.status],
        fee: Number(r.feeTotal.toString()).toFixed(2), createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  /** Relación pública de observados: solo código y modalidad, sin nombres ni documento (Art. 17). */
  async observedList() {
    const callCode = await this.callCode();
    const rows = await this.d.db.application.findMany({
      where: { callCode, status: 'OBSERVADA' }, orderBy: { applicantCode: 'asc' }, select: { applicantCode: true, modality: true, updatedAt: true },
    });
    return { callCode, rows: rows.map((r) => ({ applicantCode: r.applicantCode, modality: r.modality, since: r.updatedAt.toISOString() })) };
  }

  /** Panel: anular con motivo (y resolución si la hay), auditado. */
  async annul(applicantCode: string, reason: string, actor: string, meta: RequestMeta) {
    const row = await this.d.db.application.findUnique({ where: { applicantCode } });
    if (!row) throw notFound('Inscripción no encontrada.');
    if (row.status === 'ANULADA') throw conflict('ALREADY_ANNULLED', 'La inscripción ya está anulada.');
    await this.d.db.$transaction(async (tx) => {
      await tx.application.update({ where: { applicantCode }, data: { status: 'ANULADA' } });
      await this.d.audit.record({ actorUserId: actor, action: 'inscription.annulled', resourceType: 'application', resourceId: applicantCode, before: { status: row.status }, after: { status: 'ANULADA', reason }, ...meta }, tx);
      await this.d.outbox.publish(tx, 'InscripcionAnulada', { applicantCode, email: row.email, firstNames: row.firstNames, reason }, meta.requestId);
    });
  }

  /** Spec 008, Historia 5: al inhabilitar a una persona se anulan sus inscripciones con la resolución. */
  async annulByDocument(documentType: string, documentNumber: string, resolution: string, actor: string, meta: RequestMeta): Promise<string[]> {
    const rows = await this.d.db.application.findMany({ where: { documentType, documentNumber: documentNumber.toUpperCase(), status: { not: 'ANULADA' } } });
    for (const r of rows) await this.annul(r.applicantCode, `Inhabilitación: ${resolution}`, actor, meta);
    return rows.map((r) => r.applicantCode);
  }

  /**
   * API pública para M06 Expedientes: inscripción de exonerado validada con DNI + código (o por su código
   * cuando quien consulta es personal autorizado), con la submodalidad de su categoría.
   */
  async dossierContext(applicantCode: string, documentNumber?: string) {
    const row = await this.d.db.application.findUnique({ where: { applicantCode } });
    if (!row || (documentNumber !== undefined && row.documentNumber !== documentNumber.trim().toUpperCase())) {
      throw notFound('No encontramos una inscripción con ese documento y código.');
    }
    const [categories, option] = await Promise.all([
      this.d.convocatorias.listQuotaCategories(row.callCode),
      this.d.convocatorias.getOption(row.callCode, row.optionCode),
    ]);
    const category = categories.find((c) => c.code === row.quotaCategory);
    return {
      applicantCode: row.applicantCode, callCode: row.callCode, modality: row.modality, status: row.status,
      submodality: category?.submodality ?? null, categoryName: category?.name ?? row.quotaCategory, program: option.displayName,
      fullName: `${row.paternalSurname} ${row.maternalSurname}, ${row.firstNames}`, firstNames: row.firstNames, email: row.email,
      documentType: row.documentType, documentNumber: row.documentNumber,
    };
  }

  /**
   * Relación de aptos para un examen (M07, RF-07.05): inscripción Apta = pago confirmado y, en exonerados,
   * expediente autorizado. Incluye lo que necesitan la distribución, la ficha de examen y la lista de asistencia.
   */
  async eligibleFor(callCode: string, modalities: string[]) {
    const [rows, options] = await Promise.all([
      this.d.db.application.findMany({ where: { callCode, status: 'APTA', modality: { in: modalities } }, orderBy: { applicantCode: 'asc' } }),
      this.d.convocatorias.searchOptions(callCode, {}),
    ]);
    const option = new Map(options.data.map((o) => [o.internalCode, o]));
    return rows.map((r) => this.examPerson(r, option.get(r.optionCode)));
  }

  /** Datos de examen de una inscripción; con `documentNumber` exige que coincida (consulta pública con DNI + código). */
  async examContext(applicantCode: string, documentNumber?: string) {
    const row = await this.d.db.application.findUnique({ where: { applicantCode } });
    if (!row || (documentNumber !== undefined && row.documentNumber !== documentNumber.trim().toUpperCase())) return null;
    const options = await this.d.convocatorias.searchOptions(row.callCode, {});
    return { ...this.examPerson(row, options.data.find((o) => o.internalCode === row.optionCode)), callCode: row.callCode, status: row.status, statusLabel: STATUS_LABEL[row.status] };
  }

  /** M11: destinatarios de un comunicado segmentado por modalidad, programa y estado (RF-11.08). */
  async segment(filter: { modality?: string | undefined; optionCode?: string | undefined; status?: string | undefined }) {
    const call = await this.d.convocatorias.getCurrentCall();
    const rows = await this.d.db.application.findMany({
      where: {
        callCode: call.code, ...(filter.modality ? { modality: filter.modality } : {}), ...(filter.optionCode ? { optionCode: filter.optionCode } : {}),
        ...(filter.status ? { status: filter.status as InscriptionStatus } : { status: { not: 'ANULADA' } }),
      },
      select: { applicantCode: true, email: true, firstNames: true },
    });
    return rows;
  }

  /** M11, recordatorio de pago: pendientes cuya inscripción regular cierra dentro de `withinHours`. */
  async pendingPayments(withinHours: number) {
    const call = await this.d.convocatorias.getCurrentCall();
    const now = this.d.clock.now().getTime();
    const closing = call.stages.filter((s) => s.kind === 'REGULAR' && new Date(s.endsAt).getTime() > now && new Date(s.endsAt).getTime() - now <= withinHours * 3600_000);
    const out = [];
    for (const st of closing) {
      const rows = await this.d.db.application.findMany({ where: { callCode: call.code, status: 'PENDIENTE_PAGO', modality: st.scope }, select: { applicantCode: true, email: true, firstNames: true, feeTotal: true } });
      out.push(...rows.map((r) => ({ applicantCode: r.applicantCode, email: r.email, firstNames: r.firstNames, amount: Number(r.feeTotal).toFixed(2), closesAt: new Date(st.endsAt), stage: st.code })));
    }
    return out;
  }

  private examPerson(r: { applicantCode: string; paternalSurname: string; maternalSurname: string; firstNames: string; documentType: string; documentNumber: string; modality: string; optionCode: string; quotaCategory: string; photoKey: string; email: string; noVacancyRight: boolean }, option?: { displayName: string; area: string }) {
    return {
      applicantCode: r.applicantCode, surname: `${r.paternalSurname} ${r.maternalSurname}`.trim(), firstNames: r.firstNames,
      fullName: `${r.paternalSurname} ${r.maternalSurname}, ${r.firstNames}`, document: `${r.documentType} ${r.documentNumber}`,
      modality: r.modality, program: option?.displayName ?? r.optionCode, area: option?.area ?? '-', photoKey: r.photoKey, email: r.email,
      noVacancyRight: r.noVacancyRight, optionCode: r.optionCode, quotaCategory: r.quotaCategory,
    };
  }

  /**
   * RF-13.10: al vencer el plazo de retención se borran los datos personales de las inscripciones de convocatorias
   * anteriores (nunca de la vigente). Se conservan el código, la modalidad, el programa y el estado para las
   * estadísticas; la foto y los documentos adjuntos se eliminan del almacenamiento.
   */
  async anonymizeExpired(years: number, actor: string | null, meta?: RequestMeta) {
    const current = await this.callCode();
    const limit = new Date(this.d.clock.now().getTime() - years * 365.25 * 86_400_000);
    const rows = await this.d.db.application.findMany({ where: { callCode: { not: current }, createdAt: { lt: limit }, anonymizedAt: null }, take: 500 });
    for (const r of rows) {
      const docs = await this.d.db.applicationDocument.findMany({ where: { applicantCode: r.applicantCode } });
      await this.d.storage.delete(r.photoKey).catch(() => undefined);
      for (const d of docs) await this.d.storage.delete(d.fileKey).catch(() => undefined);
      await this.d.db.$transaction(async (tx) => {
        await tx.applicationDocument.deleteMany({ where: { applicantCode: r.applicantCode } });
        await tx.application.update({
          where: { id: r.id },
          data: {
            documentNumber: `X${r.applicantCode}`, paternalSurname: 'ANONIMIZADO', maternalSurname: '', firstNames: 'ANONIMIZADO',
            address: '', phone: null, mobile: '000000000', email: `${r.applicantCode}@anonimizado.invalid`, photoKey: '',
            birthDate: new Date('1900-01-01'), schoolName: '', anonymizedAt: this.d.clock.now(),
          },
        });
        await this.d.audit.record({ actorUserId: actor, action: 'inscription.anonymized', resourceType: 'application', resourceId: r.applicantCode, after: { years, callCode: r.callCode }, ...(meta ?? {}) }, tx);
      });
    }
    return { anonymized: rows.length, before: limit.toISOString() };
  }

  /** Reacción al dictamen del expediente (M06): el estado de la inscripción sigue al expediente (RN-24). */
  async applyDossierDecision(applicantCode: string, decision: 'AUTORIZADO' | 'OBSERVADO' | 'EN_REVISION' | 'RECHAZADO' | 'NO_SUBSANADO') {
    const target = { AUTORIZADO: 'PENDIENTE_PAGO', OBSERVADO: 'OBSERVADA', EN_REVISION: 'PENDIENTE_VALIDACION', RECHAZADO: 'ANULADA', NO_SUBSANADO: 'ANULADA' }[decision] as InscriptionStatus;
    return this.d.db.$transaction(async (tx) => {
      const row = await tx.application.findUnique({ where: { applicantCode } });
      if (!row || row.status === target || row.status === 'APTA') return row ? { email: row.email, firstNames: row.firstNames, changed: false } : null;
      await tx.application.update({ where: { applicantCode }, data: { status: target } });
      await this.d.audit.record({
        actorUserId: null, action: 'inscription.dossier_decision', resourceType: 'application', resourceId: applicantCode,
        before: { status: row.status }, after: { status: target, decision },
      }, tx);
      return { email: row.email, firstNames: row.firstNames, changed: true };
    });
  }

  /** Reacción al evento PagoConfirmado: la inscripción pendiente de pago queda Apta (spec 005 SC-001). */
  async markPaid(applicantCode: string, operationNumber: string): Promise<{ changed: boolean; email: string; firstNames: string } | null> {
    return this.d.db.$transaction(async (tx) => {
      const updated = await tx.application.updateMany({ where: { applicantCode, status: 'PENDIENTE_PAGO' }, data: { status: 'APTA' } });
      if (updated.count === 1) {
        await this.d.audit.record({
          actorUserId: null, action: 'inscription.paid', resourceType: 'application', resourceId: applicantCode,
          before: { status: 'PENDIENTE_PAGO' }, after: { status: 'APTA', operationNumber },
        }, tx);
      }
      const row = await tx.application.findUnique({ where: { applicantCode }, select: { email: true, firstNames: true } });
      return row ? { changed: updated.count === 1, ...row } : null;
    });
  }

  private decodePhoto(dataUrl: string): Buffer {
    const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    const buf = match ? Buffer.from(match[1]!, 'base64') : null;
    const size = buf ? jpegSize(buf) : null;
    if (!buf || !size) throw validationError('La fotografía debe ser una imagen JPG.', [{ field: 'photo', issue: 'no es JPEG' }]);
    if (buf.length > PHOTO.maxBytes) throw validationError('La fotografía no debe superar 2 MB.', [{ field: 'photo', issue: 'muy pesada' }]);
    if (size.width !== PHOTO.width || size.height !== PHOTO.height) {
      throw validationError('La fotografía debe medir 240 × 320 píxeles.', [{ field: 'photo', issue: `${size.width}×${size.height}` }]);
    }
    return buf;
  }

  private summary(
    row: { applicantCode: string; paternalSurname: string; maternalSurname: string; firstNames: string; documentNumber: string; email: string; modality: string; status: InscriptionStatus; noVacancyRight: boolean; feeTotal: { toString(): string }; feeLines: unknown; createdAt: Date },
    program: string,
    categoryName: string,
    examDate: string,
  ): InscriptionSummary {
    return {
      applicantCode: row.applicantCode,
      fullName: `${row.firstNames} ${row.paternalSurname} ${row.maternalSurname}`.trim(),
      maskedDocument: maskDocument(row.documentNumber),
      maskedEmail: maskEmail(row.email),
      modality: MODALITIES[row.modality as keyof typeof MODALITIES] ?? row.modality,
      modalityCode: row.modality as 'ORD' | 'EXO' | 'CEPRE',
      quotaCategoryName: categoryName,
      program,
      status: row.status,
      statusLabel: STATUS_LABEL[row.status],
      noVacancyRight: row.noVacancyRight,
      fee: { total: Number(row.feeTotal.toString()).toFixed(2), lines: row.feeLines as InscriptionSummary['fee']['lines'] },
      paymentEntities: PAYMENT_ENTITIES,
      fichaAvailable: row.status === 'APTA',
      examDate,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
