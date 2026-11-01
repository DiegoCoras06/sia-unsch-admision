import type { Db } from '../../../shared/db/prisma.js';
import { Money } from '../domain/money.js';
import type { FeeInfo } from '../domain/fee-calculator.js';
import type { ConvocatoriasRepository, EnrollmentStatsProvider, OptionRecord } from '../domain/ports.js';

const toFee = (f: { code: string; concept: string; amount: { toString(): string }; legalNote: string }): FeeInfo => ({
  code: f.code,
  concept: f.concept,
  amount: Money.of(f.amount.toString()),
  legalNote: f.legalNote,
});

export class PrismaConvocatoriasRepository implements ConvocatoriasRepository {
  constructor(private readonly db: Db) {}

  findCurrentCall() {
    return this.db.admissionCall.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: { id: true, code: true, name: true, status: true },
    });
  }

  findCall(code: string) {
    return this.db.admissionCall.findFirst({
      where: { code, status: { in: ['PUBLISHED', 'CLOSED'] } },
      select: { id: true, code: true, name: true, status: true },
    });
  }

  stages(callId: string) {
    return this.db.scheduleStage.findMany({
      where: { callId },
      orderBy: { sortOrder: 'asc' },
      select: { code: true, name: true, scope: true, kind: true, startsAt: true, endsAt: true, highlight: true, sortOrder: true },
    });
  }

  async areas() {
    const rows = await this.db.academicArea.findMany({ orderBy: { code: 'asc' } });
    return rows.map((a) => ({ code: a.code as 'I' | 'II' | 'III', name: a.name }));
  }

  async quotaCategories() {
    const rows = await this.db.quotaCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { modality: true, submodality: true },
    });
    return rows.map((q) => ({
      code: q.code,
      name: q.name,
      modality: q.modality.code as 'ORD' | 'EXO' | 'CEPRE',
      submodality: q.submodality?.code ?? null,
      variant: q.variant,
    }));
  }

  async submodalities() {
    const rows = await this.db.submodality.findMany({ orderBy: { sortOrder: 'asc' }, include: { modality: true } });
    return rows.map((s) => ({ code: s.code, name: s.name, modality: s.modality.code as 'ORD' | 'EXO' | 'CEPRE', legalBasis: s.legalBasis, evaluationCriteria: s.evaluationCriteria }));
  }

  async options(callId: string): Promise<OptionRecord[]> {
    const rows = await this.db.applicationOption.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        program: { include: { area: true, faculty: true } },
        vacancies: { where: { callId }, include: { quotaCategory: true } },
      },
    });
    return rows.map((o) => ({
      internalCode: o.internalCode,
      displayName: o.displayName,
      program: o.program.name,
      specialty: o.specialty,
      area: o.program.area.code as 'I' | 'II' | 'III',
      faculty: o.program.faculty.name,
      durationYears: o.durationYears,
      degree: o.degree,
      professionalTitle: o.professionalTitle,
      profilePage: o.profilePage,
      searchText: o.searchText,
      sortOrder: o.sortOrder,
      vacancies: Object.fromEntries(o.vacancies.map((v) => [v.quotaCategory.code, v.quantity])),
    }));
  }

  async fees(callId: string) {
    const rows = await this.db.fee.findMany({ where: { callId }, orderBy: { sortOrder: 'asc' } });
    return rows.map((f) => ({ ...toFee(f), kind: f.kind }));
  }

  async feeRules(callId: string) {
    const [rules, surcharges] = await Promise.all([
      this.db.feeRule.findMany({ where: { callId }, include: { fee: true } }),
      this.db.surchargeRule.findMany({ where: { callId }, include: { fee: true } }),
    ]);
    return {
      rules: rules.map((r) => ({
        fee: toFee(r.fee),
        modalityCode: r.modalityCode,
        submodalityCode: r.submodalityCode,
        schoolType: r.schoolType,
        militaryCondition: r.militaryCondition,
        familyLink: r.familyLink,
        priority: r.priority,
      })),
      surcharges: surcharges
        .filter((s) => s.appliesToScope === 'ORD' || s.appliesToScope === 'EXO' || s.appliesToScope === 'CEPRE')
        .map((s) => ({ fee: toFee(s.fee), appliesToScope: s.appliesToScope as 'ORD' | 'EXO' | 'CEPRE', priority: s.priority })),
    };
  }

  async requirements(callId: string, submodality: string | null) {
    if (!submodality) {
      const rows = await this.db.requirementDocument.findMany({ where: { callId, isBase: true }, orderBy: { code: 'asc' } });
      return rows.map((r) => ({ ...r, mandatory: true }));
    }
    const sub = await this.db.submodality.findUnique({
      where: { code: submodality },
      include: { requirements: { where: { requirement: { callId } }, include: { requirement: true }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!sub) return [];
    const own = sub.requirements.map((link) => ({ ...link.requirement, mandatory: link.mandatory }));
    if (!sub.usesBaseDocuments) return own;
    const base = await this.db.requirementDocument.findMany({ where: { callId, isBase: true }, orderBy: { code: 'asc' } });
    return [...base.map((r) => ({ ...r, mandatory: true })), ...own];
  }

  syllabus(callId: string) {
    return this.db.syllabusNode.findMany({
      where: { callId },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, parentId: true, level: true, title: true, searchText: true, sortOrder: true },
    });
  }

  documents(callId: string) {
    return this.db.officialDocument.findMany({
      where: { callId },
      orderBy: { title: 'asc' },
      select: { type: true, title: true, publicUrl: true, publishedAt: true, sizeBytes: true },
    });
  }
}

/** Adaptador provisional hasta implementar la spec 003 (research R-09). */
export const pendingEnrollmentStats: EnrollmentStatsProvider = {
  countByModality: async () => ({ ordinary: 0, exempted: 0, source: 'pending' }),
};
