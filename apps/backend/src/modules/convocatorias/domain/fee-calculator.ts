import { businessRule } from '../../../shared/http/errors.js';
import { Money } from './money.js';
import { stagesInProgress, type Stage } from './stage.js';

export type Modality = 'ORD' | 'EXO' | 'CEPRE';
export type SchoolType = 'ESTATAL' | 'PARTICULAR';
export type MilitaryCondition = 'NONE' | 'ACTIVE' | 'DISCHARGED';

export interface FeeCriteria {
  modality: Modality;
  submodality?: string | undefined;
  schoolType?: SchoolType | undefined;
  militaryCondition: MilitaryCondition;
  familyLink: boolean;
}

export interface FeeInfo {
  code: string;
  concept: string;
  amount: Money;
  legalNote: string;
}

/** Regla de tasa base; un criterio nulo significa "cualquiera". `modalityCode = '*'` aplica a todas. */
export interface FeeRule {
  fee: FeeInfo;
  modalityCode: string;
  submodalityCode: string | null;
  schoolType: SchoolType | null;
  militaryCondition: MilitaryCondition | null;
  familyLink: boolean | null;
  priority: number;
}

export interface SurchargeRule {
  fee: FeeInfo;
  appliesToScope: Modality;
  priority: number;
}

export interface FeeQuote {
  total: Money;
  lines: FeeInfo[];
  warnings: string[];
}

function matches(rule: FeeRule, c: FeeCriteria): boolean {
  return (
    (rule.modalityCode === '*' || rule.modalityCode === c.modality) &&
    (rule.submodalityCode === null || rule.submodalityCode === c.submodality) &&
    (rule.schoolType === null || rule.schoolType === c.schoolType) &&
    (rule.militaryCondition === null || rule.militaryCondition === c.militaryCondition) &&
    (rule.familyLink === null || rule.familyLink === c.familyLink)
  );
}

const byPriority = <T extends { priority: number }>(a: T, b: T) => b.priority - a.priority;

/**
 * Calcula la tasa de inscripción (FR-006 de 001, RN-17):
 * 1. Tasa base = regla coincidente de mayor prioridad (vínculo familiar > descuento militar > general).
 * 2. Recargo si hay una etapa extemporánea en curso para la modalidad (S/ 65.00; CEPRE S/ 50.00).
 */
export function quoteFee(criteria: FeeCriteria, rules: FeeRule[], surcharges: SurchargeRule[], stages: Stage[], now: Date): FeeQuote {
  if (criteria.modality === 'EXO' && !criteria.submodality) {
    throw businessRule('SUBMODALITY_REQUIRED', 'Elige la submodalidad de exonerados para calcular la tasa.');
  }

  const base = rules.filter((r) => matches(r, criteria)).sort(byPriority)[0];
  if (!base) {
    const needsSchool = rules.some(
      (r) => r.modalityCode === criteria.modality && r.schoolType !== null && (r.submodalityCode === null || r.submodalityCode === criteria.submodality),
    );
    if (needsSchool && !criteria.schoolType) {
      throw businessRule('SCHOOL_TYPE_REQUIRED', 'Indica si terminaste la secundaria en un colegio estatal o particular.');
    }
    throw businessRule('NO_FEE_RULE', 'No hay una tasa definida para esa combinación. Consulta a la Dirección de Admisión.');
  }

  const lines: FeeInfo[] = [base.fee];
  const warnings: string[] = [];

  const extemporaneous = stagesInProgress(stages, now).some((s) => s.kind === 'EXTEMPORANEOUS' && s.scope === criteria.modality);
  if (extemporaneous) {
    const surcharge = surcharges.filter((s) => s.appliesToScope === criteria.modality).sort(byPriority)[0];
    if (surcharge) {
      lines.push(surcharge.fee);
      warnings.push('Estás en el periodo de inscripción extemporánea: se suma el recargo.');
    }
  }

  if (base.familyLink === true) {
    warnings.push('El beneficio por vínculo familiar con servidores de la UNSCH se usa por única vez y para primera profesión (Art. 15).');
  }
  if (criteria.militaryCondition !== 'NONE' && base.militaryCondition === criteria.militaryCondition) {
    warnings.push('Deberás acreditar tu condición de personal o licenciado del servicio militar acuartelado.');
  }

  const total = lines.reduce((sum, line) => sum.add(line.amount), Money.zero());
  return { total, lines, warnings };
}
