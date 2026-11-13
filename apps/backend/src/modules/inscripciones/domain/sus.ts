/**
 * System Usability Scale (Brooke, 1996): 10 afirmaciones que se responden de 1 a 5.
 * Las impares son positivas (aporta respuesta − 1) y las pares negativas (aporta 5 − respuesta);
 * la suma por 2.5 da un puntaje de 0 a 100. El promedio de referencia es 68 (Sauro, 2011).
 */
export const SUS_STATEMENTS = [
  'Creo que me gustaría usar este portal con frecuencia.',
  'Encontré el portal innecesariamente complicado.',
  'Pensé que el portal era fácil de usar.',
  'Creo que necesitaría ayuda de una persona con conocimientos técnicos para usar este portal.',
  'Encontré que las funciones del portal estaban bien integradas.',
  'Pensé que había demasiada inconsistencia en el portal.',
  'Imagino que la mayoría de las personas aprendería a usar este portal muy rápidamente.',
  'Encontré el portal muy difícil de usar.',
  'Me sentí muy seguro al usar el portal.',
  'Necesité aprender muchas cosas antes de poder usar el portal.',
] as const;

/** Meta de EQ-07: puntaje promedio igual o mayor al promedio de referencia. */
export const SUS_TARGET = 68;

export function isValidSusAnswers(answers: readonly number[]): boolean {
  return answers.length === 10 && answers.every((a) => Number.isInteger(a) && a >= 1 && a <= 5);
}

export function susScore(answers: readonly number[]): number {
  if (!isValidSusAnswers(answers)) throw new Error('La encuesta SUS necesita 10 respuestas de 1 a 5.');
  const sum = answers.reduce((acc, a, i) => acc + (i % 2 === 0 ? a - 1 : 5 - a), 0);
  return sum * 2.5;
}

/** Escala de calificación de Sauro y Lewis (curva de percentiles) y adjetivo de Bangor, Kortum y Miller. */
export function susGrade(score: number): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; adjective: string } {
  if (score >= 80.3) return { grade: 'A', adjective: 'Excelente' };
  if (score >= 74) return { grade: 'B', adjective: 'Bueno' };
  if (score >= 68) return { grade: 'C', adjective: 'Aceptable' };
  if (score >= 51) return { grade: 'D', adjective: 'Regular' };
  return { grade: 'F', adjective: 'Deficiente' };
}
