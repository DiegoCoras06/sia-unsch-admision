import { describe, expect, it } from 'vitest';
import { isValidSusAnswers, susGrade, susScore } from '../../../src/modules/inscripciones/domain/sus.js';

describe('System Usability Scale (AC07, EQ-07)', () => {
  it('calcula el puntaje de 0 a 100 con la fórmula de Brooke', () => {
    expect(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100);
    expect(susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0);
    expect(susScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(50);
    // Ejemplo típico: 4,2,4,2,... → (3+3)*5*2.5 = 75
    expect(susScore([4, 2, 4, 2, 4, 2, 4, 2, 4, 2])).toBe(75);
  });

  it('exige 10 respuestas enteras de 1 a 5', () => {
    expect(isValidSusAnswers([1, 2, 3, 4, 5, 1, 2, 3, 4, 5])).toBe(true);
    expect(isValidSusAnswers([1, 2, 3])).toBe(false);
    expect(isValidSusAnswers([0, 2, 3, 4, 5, 1, 2, 3, 4, 5])).toBe(false);
    expect(isValidSusAnswers([1.5, 2, 3, 4, 5, 1, 2, 3, 4, 5])).toBe(false);
    expect(() => susScore([6, 2, 3, 4, 5, 1, 2, 3, 4, 5])).toThrow();
  });

  it('califica según la escala de Sauro y Lewis', () => {
    expect(susGrade(85)).toEqual({ grade: 'A', adjective: 'Excelente' });
    expect(susGrade(75)).toMatchObject({ grade: 'B' });
    expect(susGrade(68)).toMatchObject({ grade: 'C' });
    expect(susGrade(60)).toMatchObject({ grade: 'D' });
    expect(susGrade(40)).toMatchObject({ grade: 'F' });
  });
});
