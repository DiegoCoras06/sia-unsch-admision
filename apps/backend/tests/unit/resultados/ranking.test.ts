import { describe, expect, it } from 'vitest';
import { computeScore, rank, uncovered, type Contender, type Scoring } from '../../../src/modules/resultados/domain/ranking.js';
import { parseScoreFile } from '../../../src/modules/resultados/domain/score-file.js';

const S: Scoring = { puntosConocimientos: 9, puntosTest: 5, factorArea: 1, puntajeMinimo: 450 };
const who = (n: number, knowledge: number, extra: Partial<Contender> = {}): Contender => ({
  applicantCode: String(27000000 + n), optionCode: 'P01', quotaCategory: 'ORD', area: 'I', noVacancyRight: false,
  answers: { knowledge, vocational: 0, attitude: 0, unreadable: false }, ...extra,
});
const seats = (n: number) => new Map([['P01|ORD', n]]);

describe('Puntaje (spec 007, Historia 2)', () => {
  it('todas correctas: 1000 puntos (900 + 50 + 50) (H2-1)', () => {
    expect(computeScore({ knowledge: 100, vocational: 10, attitude: 10, unreadable: false }, S, 'I')).toBe(1000);
  });
  it('las incorrectas no restan y el factor por área se aplica (RN-33, RN-34)', () => {
    expect(computeScore({ knowledge: 50, vocational: 4, attitude: 6, unreadable: false }, S, 'I')).toBe(500);
    expect(computeScore({ knowledge: 50, vocational: 0, attitude: 0, unreadable: false }, { ...S, factorArea: { I: 1.1 } }, 'I')).toBe(495);
  });
});

describe('Orden de mérito y condición', () => {
  it('admite a los primeros con al menos 450 dentro de las vacantes (H2-4)', () => {
    const r = rank([who(1, 90), who(2, 80), who(3, 70), who(4, 40)], seats(2), S);
    const by = new Map(r.map((x) => [x.applicantCode, x]));
    expect(by.get('27000001')!.condition).toBe('ADMITIDO');
    expect(by.get('27000002')!.condition).toBe('ADMITIDO');
    expect(by.get('27000003')!.condition).toBe('NO_ADMITIDO');
    expect(by.get('27000003')!.rank).toBe(3);
  });
  it('empate en el último puesto: todos los empatados son admitidos (H2-5, RN-51)', () => {
    const r = rank([who(1, 90), who(2, 80), who(3, 80), who(4, 70)], seats(2), S);
    expect(r.filter((x) => x.condition === 'ADMITIDO').map((x) => x.applicantCode).sort()).toEqual(['27000001', '27000002', '27000003']);
    expect(r.find((x) => x.applicantCode === '27000003')!.rank).toBe(2);
  });
  it('sin el mínimo no hay ingreso aunque sobren vacantes, y las sobrantes no se trasladan (H2-6, RN-04)', () => {
    const r = rank([who(1, 60), who(2, 40), who(3, 30)], seats(20), S);
    expect(r.filter((x) => x.condition === 'ADMITIDO')).toHaveLength(1);
    expect(uncovered(r, seats(20)).get('P01|ORD')).toBe(19);
  });
  it('ausente, ficha mal llenada y sin derecho a vacante (H2-8, RN-13, RN-41)', () => {
    const r = rank([
      who(1, 0, { answers: null }), who(2, 90, { answers: { knowledge: 0, vocational: 0, attitude: 0, unreadable: true } }),
      who(3, 99, { noVacancyRight: true }), who(4, 60),
    ], seats(1), S);
    const c = Object.fromEntries(r.map((x) => [x.applicantCode, x.condition]));
    expect(c).toEqual({ 27000001: 'AUSENTE', 27000002: 'NO_CALIFICABLE', 27000003: 'SIN_DERECHO_VACANTE', 27000004: 'ADMITIDO' });
    expect(r.find((x) => x.applicantCode === '27000003')!.score).toBe(891);
  });
});

describe('Archivo de calificaciones (Historia 1)', () => {
  const assigned = new Map<string, 'PENDIENTE' | 'PRESENTE' | 'AUSENTE'>([['27000001', 'PRESENTE'], ['27000002', 'PRESENTE'], ['27000003', 'AUSENTE'], ['27000004', 'PRESENTE']]);
  const max = { conocimientos: 100, aptitudVocacional: 10, actitudPersonal: 10 };
  it('acepta un archivo correcto y marca las fichas mal llenadas', () => {
    const r = parseScoreFile('codigo,conocimientos,aptitud,actitud,observacion\n27000001,80,8,9,\n27000002,0,0,0,MAL_LLENADA\n27000004,50,5,5\n', assigned, max);
    expect(r.issues).toEqual([]);
    expect(r.rows.find((x) => x.applicantCode === '27000002')!.unreadable).toBe(true);
  });
  it('lista inexistentes, duplicados, ausentes con nota, fuera de rango y presentes sin registro (H1-2)', () => {
    const r = parseScoreFile('codigo;conocimientos;aptitud;actitud\n27000001;80;8;9\n27000001;80;8;9\n99999999;1;1;1\n27000003;50;5;5\n27000002;101;1;1\n', assigned, max);
    expect(r.issues.map((i) => i.issue)).toEqual([
      'Código duplicado en el archivo', 'No figura en la relación de este examen', 'Figura como ausente en la asistencia',
      'Aciertos fuera de rango (máximo 100, 10 y 10)', 'Ingresó al examen pero no tiene registro en el archivo',
    ]);
  });
});
