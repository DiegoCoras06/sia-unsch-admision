import type {
  AreaDto, CurrentCallDto, FeeDto, FeeQuoteDto, OfficialDocumentDto, OptionDetailDto, OptionSummaryDto, OptionsMeta,
  QuotaCategoryDto, RequirementDto, StatsDto, SyllabusNodeDto,
} from '@sia/contracts';
import type { Clock } from '../../../shared/clock/clock.js';
import { toLimaIso } from '../../../shared/clock/clock.js';
import { notFound } from '../../../shared/http/errors.js';
import { normalizeForSearch } from '../../../shared/text/normalize.js';
import { quoteFee, type FeeCriteria } from '../domain/fee-calculator.js';
import type { CallSummary, ConvocatoriasRepository, EnrollmentStatsProvider, OptionRecord, SubmodalityRecord } from '../domain/ports.js';
import { nextMilestone, stageStatus, stagesInProgress, type Stage } from '../domain/stage.js';

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Casos de uso de lectura del portal público (spec 001, Historias 1–4 y 6). */
export class ConvocatoriasQueries {
  constructor(
    private readonly repo: ConvocatoriasRepository,
    private readonly stats: EnrollmentStatsProvider,
    private readonly clock: Clock,
  ) {}

  private async requireCall(code: string): Promise<CallSummary> {
    const call = await this.repo.findCall(code);
    if (!call) throw notFound(`No existe la convocatoria ${code}.`);
    return call;
  }

  /** H1 - FR-001, FR-002, FR-003. */
  async getCurrentCall(): Promise<CurrentCallDto> {
    const call = await this.repo.findCurrentCall();
    if (!call) throw notFound('Próximamente: aún no hay una convocatoria publicada.');
    const stages = await this.repo.stages(call.id);
    const now = this.clock.now();
    const milestone = nextMilestone(stages, now);
    return {
      code: call.code,
      name: call.name,
      status: call.status === 'CLOSED' ? 'CLOSED' : 'PUBLISHED',
      now: toLimaIso(now),
      stages: stages.map((s) => ({
        code: s.code,
        name: s.name,
        scope: s.scope,
        kind: s.kind,
        startsAt: toLimaIso(s.startsAt),
        endsAt: toLimaIso(s.endsAt),
        status: stageStatus(s, now),
        highlight: s.highlight,
      })),
      nextMilestone: milestone
        ? { code: milestone.stage.code, name: milestone.stage.name, startsAt: toLimaIso(milestone.stage.startsAt), secondsRemaining: milestone.secondsRemaining }
        : null,
    };
  }

  /** Etapas en curso de una convocatoria; API pública del módulo para otras funcionalidades. */
  async stagesInProgress(callCode: string): Promise<Stage[]> {
    const call = await this.requireCall(callCode);
    return stagesInProgress(await this.repo.stages(call.id), this.clock.now());
  }

  async listAreas(callCode: string): Promise<AreaDto[]> {
    const call = await this.requireCall(callCode);
    const [areas, options] = await Promise.all([this.repo.areas(), this.repo.options(call.id)]);
    return areas.map((a) => ({ ...a, optionCount: options.filter((o) => o.area === a.code).length }));
  }

  async listQuotaCategories(callCode: string): Promise<QuotaCategoryDto[]> {
    await this.requireCall(callCode);
    return this.repo.quotaCategories();
  }

  async listSubmodalities(callCode: string): Promise<SubmodalityRecord[]> {
    await this.requireCall(callCode);
    return this.repo.submodalities();
  }

  /** H2 - FR-004. Búsqueda insensible a tildes; `category` agrega la cantidad de esa categoría. */
  async searchOptions(
    callCode: string,
    filter: { q?: string | undefined; area?: 'I' | 'II' | 'III' | undefined; category?: string | undefined },
  ): Promise<{ data: OptionSummaryDto[]; meta: OptionsMeta }> {
    const call = await this.requireCall(callCode);
    const all = await this.repo.options(call.id);
    const terms = filter.q ? normalizeForSearch(filter.q).split(' ').filter(Boolean) : [];
    const matches = all.filter(
      (o) => (!filter.area || o.area === filter.area) && terms.every((t) => o.searchText.includes(t)),
    );
    return {
      data: matches.map((o) => this.summary(o, filter.category)),
      meta: { totalOptions: all.length, totalVacancies: sum(all.map((o) => sum(Object.values(o.vacancies)))) },
    };
  }

  /** H2 - FR-005. */
  async getOption(callCode: string, internalCode: string): Promise<OptionDetailDto> {
    const call = await this.requireCall(callCode);
    const [options, categories] = await Promise.all([this.repo.options(call.id), this.repo.quotaCategories()]);
    const option = options.find((o) => o.internalCode === internalCode);
    if (!option) throw notFound(`No existe la opción ${internalCode}.`);
    return {
      ...this.summary(option),
      faculty: option.faculty,
      durationYears: option.durationYears,
      degree: option.degree,
      professionalTitle: option.professionalTitle,
      profileMarkdown: `El perfil de ingreso completo está en el documento oficial de programas de estudio (página ${option.profilePage}).`,
      vacanciesByCategory: categories.map((c) => ({ category: c.code, name: c.name, quantity: option.vacancies[c.code] ?? 0 })),
    };
  }

  private summary(o: OptionRecord, category?: string): OptionSummaryDto {
    return {
      internalCode: o.internalCode,
      displayName: o.displayName,
      program: o.program,
      specialty: o.specialty,
      area: o.area,
      ordinaryVacancies: o.vacancies['ORD'] ?? 0,
      totalVacancies: sum(Object.values(o.vacancies)),
      categoryVacancies: category ? (o.vacancies[category] ?? 0) : null,
    };
  }

  /** H3 - tabla de tasas. */
  async listFees(callCode: string): Promise<FeeDto[]> {
    const call = await this.requireCall(callCode);
    const fees = await this.repo.fees(call.id);
    return fees.map((f) => ({ code: f.code, concept: f.concept, amount: f.amount.toString(), kind: f.kind, legalNote: f.legalNote }));
  }

  /** H3 - FR-006. `at` simula otra fecha solo para mostrar el recargo. */
  async quoteFee(callCode: string, criteria: FeeCriteria, at?: Date): Promise<FeeQuoteDto> {
    const call = await this.requireCall(callCode);
    const [{ rules, surcharges }, stages] = await Promise.all([this.repo.feeRules(call.id), this.repo.stages(call.id)]);
    const quote = quoteFee(criteria, rules, surcharges, stages, at ?? this.clock.now());
    return {
      total: quote.total.toString(),
      currency: 'PEN',
      lines: quote.lines.map((l) => ({ code: l.code, concept: l.concept, amount: l.amount.toString(), legalNote: l.legalNote })),
      warnings: quote.warnings,
    };
  }

  /** H4 - FR-007. Sin submodalidad devuelve la base común (Art. 36). */
  async listRequirements(callCode: string, submodality?: string): Promise<RequirementDto[]> {
    const call = await this.requireCall(callCode);
    return this.repo.requirements(call.id, submodality ?? null);
  }

  /** H4 - temario en árbol; con `q`, solo las ramas que coinciden. */
  async getSyllabus(callCode: string, q?: string): Promise<SyllabusNodeDto[]> {
    const call = await this.requireCall(callCode);
    const nodes = await this.repo.syllabus(call.id);
    const term = q ? normalizeForSearch(q) : '';
    const build = (parentId: string | null, path: string[]): SyllabusNodeDto[] =>
      nodes
        .filter((n) => n.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((n) => {
          const nodePath = [...path, n.title];
          const children = build(n.id, nodePath);
          return { id: n.id, level: n.level, title: n.title, path: nodePath, children, hit: !term || n.searchText.includes(term) };
        })
        .filter((n) => n.hit || n.children.length > 0)
        .map(({ hit: _hit, ...n }) => n);
    return build(null, []);
  }

  async listDocuments(callCode: string): Promise<OfficialDocumentDto[]> {
    const call = await this.requireCall(callCode);
    const docs = await this.repo.documents(call.id);
    return docs.map((d) => ({ type: d.type, title: d.title, url: d.publicUrl, publishedAt: toLimaIso(d.publishedAt), sizeBytes: d.sizeBytes }));
  }

  /** H6 - FR-011, sin datos personales. */
  async getStats(callCode: string): Promise<StatsDto> {
    await this.requireCall(callCode);
    const counts = await this.stats.countByModality(callCode);
    return { ...counts, total: counts.ordinary + counts.exempted, updatedAt: toLimaIso(this.clock.now()) };
  }
}
