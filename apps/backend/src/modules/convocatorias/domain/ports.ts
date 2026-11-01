import type { FeeInfo, FeeRule, SurchargeRule } from './fee-calculator.js';
import type { Stage } from './stage.js';

export interface CallSummary {
  id: string;
  code: string;
  name: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
}

export interface OptionRecord {
  internalCode: string;
  displayName: string;
  program: string;
  specialty: string | null;
  area: 'I' | 'II' | 'III';
  faculty: string;
  durationYears: number;
  degree: string;
  professionalTitle: string;
  profilePage: number;
  searchText: string;
  sortOrder: number;
  /** cantidad por código de categoría (ORD, DIS, …) */
  vacancies: Record<string, number>;
}

export interface QuotaCategoryRecord {
  code: string;
  name: string;
  modality: 'ORD' | 'EXO' | 'CEPRE';
  submodality: string | null;
  variant: string | null;
}

export interface SubmodalityRecord {
  code: string;
  name: string;
  modality: 'ORD' | 'EXO' | 'CEPRE';
  legalBasis: string;
  /** RF-04.11: criterios con los que la Comisión evalúa el expediente de esta submodalidad. */
  evaluationCriteria: string | null;
}

export interface RequirementRecord {
  code: string;
  name: string;
  description: string;
  article: string;
  isBase: boolean;
  mandatory: boolean;
  acceptedFormats: string[];
}

export interface SyllabusRecord {
  id: string;
  parentId: string | null;
  level: 'AREA' | 'COURSE' | 'SECTION' | 'TOPIC';
  title: string;
  searchText: string;
  sortOrder: number;
}

export interface DocumentRecord {
  type: string;
  title: string;
  publicUrl: string;
  publishedAt: Date;
  sizeBytes: number;
}

/** Puerto de lectura del módulo M01 (ADR-002); lo implementa infrastructure/. */
export interface ConvocatoriasRepository {
  findCurrentCall(): Promise<CallSummary | null>;
  findCall(code: string): Promise<CallSummary | null>;
  stages(callId: string): Promise<Stage[]>;
  areas(): Promise<{ code: 'I' | 'II' | 'III'; name: string }[]>;
  quotaCategories(): Promise<QuotaCategoryRecord[]>;
  submodalities(): Promise<SubmodalityRecord[]>;
  options(callId: string): Promise<OptionRecord[]>;
  fees(callId: string): Promise<(FeeInfo & { kind: 'BASE' | 'SURCHARGE' | 'OTHER' })[]>;
  feeRules(callId: string): Promise<{ rules: FeeRule[]; surcharges: SurchargeRule[] }>;
  requirements(callId: string, submodality: string | null): Promise<RequirementRecord[]>;
  syllabus(callId: string): Promise<SyllabusRecord[]>;
  documents(callId: string): Promise<DocumentRecord[]>;
}

/** Inscritos por modalidad; lo provee la spec 003 (research R-09). */
export interface EnrollmentStatsProvider {
  countByModality(callCode: string): Promise<{ ordinary: number; exempted: number; source: 'live' | 'pending' }>;
}
