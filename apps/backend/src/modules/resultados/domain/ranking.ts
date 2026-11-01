/** Reglas de calificación y de ingreso del reglamento (RN-04, RN-13, RN-31 a RN-34, RN-41, RN-50, RN-51). */

export type Condition = 'ADMITIDO' | 'NO_ADMITIDO' | 'AUSENTE' | 'NO_CALIFICABLE' | 'SIN_DERECHO_VACANTE';

export const CONDITION_LABEL: Record<Condition, string> = {
  ADMITIDO: 'Admitido',
  NO_ADMITIDO: 'No admitido',
  AUSENTE: 'Ausente',
  NO_CALIFICABLE: 'No calificable',
  SIN_DERECHO_VACANTE: 'Sin derecho a vacante',
};

export interface Scoring {
  puntosConocimientos: number;
  puntosTest: number;
  /** Factor por área (Tabla 5); provisionalmente uniforme. Puede ser un número o un mapa por área. */
  factorArea: number | Record<string, number>;
  puntajeMinimo: number;
}

export interface Answers { knowledge: number; vocational: number; attitude: number; unreadable: boolean }

export interface Contender {
  applicantCode: string;
  optionCode: string;
  quotaCategory: string;
  area: string;
  noVacancyRight: boolean;
  /** Sin respuestas: no rindió el examen. */
  answers: Answers | null;
}

export interface Ranked extends Contender {
  score: number | null;
  rank: number | null;
  condition: Condition;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** RN-31, RN-33, RN-34: aciertos × puntos × factor; las respuestas incorrectas no restan. */
export function computeScore(a: Answers, s: Scoring, area: string): number {
  const factor = typeof s.factorArea === 'number' ? s.factorArea : (s.factorArea[area] ?? 1);
  return round2(a.knowledge * s.puntosConocimientos * factor + (a.vocational + a.attitude) * s.puntosTest);
}

export const groupKey = (optionCode: string, quotaCategory: string) => `${optionCode}|${quotaCategory}`;

/**
 * Orden de mérito por programa y categoría (RN-50) y condición de cada postulante.
 * El puesto es de competición (1, 2, 2, 4): quienes empatan comparten puesto, así que «puesto ≤ vacantes»
 * admite a todos los empatados en el último lugar (RN-51). Solo compiten quienes tienen derecho a vacante;
 * sin el mínimo no se admite aunque sobren vacantes, y las sobrantes no pasan a otro programa (RN-04).
 */
export function rank(people: Contender[], vacancies: Map<string, number>, s: Scoring): Ranked[] {
  const out: Ranked[] = [];
  const groups = new Map<string, Ranked[]>();
  for (const p of people) {
    if (!p.answers) {
      out.push({ ...p, score: null, rank: null, condition: 'AUSENTE' });
      continue;
    }
    if (p.answers.unreadable) {
      out.push({ ...p, score: null, rank: null, condition: 'NO_CALIFICABLE' });
      continue;
    }
    const score = computeScore(p.answers, s, p.area);
    if (p.noVacancyRight) {
      out.push({ ...p, score, rank: null, condition: 'SIN_DERECHO_VACANTE' });
      continue;
    }
    const r: Ranked = { ...p, score, rank: null, condition: 'NO_ADMITIDO' };
    const k = groupKey(p.optionCode, p.quotaCategory);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
    out.push(r);
  }
  for (const [k, list] of groups) {
    list.sort((a, b) => b.score! - a.score! || a.applicantCode.localeCompare(b.applicantCode));
    const seats = vacancies.get(k) ?? 0;
    list.forEach((r, i) => {
      r.rank = i > 0 && list[i - 1]!.score === r.score ? list[i - 1]!.rank : i + 1;
      if (r.score! >= s.puntajeMinimo && r.rank! <= seats) r.condition = 'ADMITIDO';
    });
  }
  return out;
}

/** Vacantes por grupo que quedaron sin cubrir (para trasladar las de exonerados al ordinario, RN-05). */
export function uncovered(results: { optionCode: string; quotaCategory: string; condition: Condition }[], vacancies: Map<string, number>): Map<string, number> {
  const admitted = new Map<string, number>();
  for (const r of results) if (r.condition === 'ADMITIDO') admitted.set(groupKey(r.optionCode, r.quotaCategory), (admitted.get(groupKey(r.optionCode, r.quotaCategory)) ?? 0) + 1);
  const out = new Map<string, number>();
  for (const [k, v] of vacancies) out.set(k, Math.max(0, v - (admitted.get(k) ?? 0)));
  return out;
}
