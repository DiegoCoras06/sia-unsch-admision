import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { testApp } from '../helpers.js';

/** AC07 (EQ-07): encuesta SUS al terminar la inscripción. */
const t = testApp('2026-10-25T10:00:00-05:00');
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

function fakeJpeg(width: number, height: number): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}

async function register(dni: string): Promise<{ dni: string; code: string }> {
  const res = await t.request.post('/api/v1/inscriptions').send({
    documentType: 'DNI', documentNumber: dni, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'F',
    maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-01-10', address: 'Jr. Asamblea 100, Ayacucho',
    residenceUbigeo: '050101', economicDependency: 'PADRES', mobile: '987654321', email: `sus${dni}@example.com`,
    photo: fakeJpeg(240, 320), schoolUbigeo: '050101', schoolName: 'IE Nuestra Señora de Fátima', schoolType: 'ESTATAL',
    graduationYear: 2025, inFourthOrBelow: false, preparation: 'ACADEMIA', attempts: 1, modality: 'ORD', quotaCategory: 'ORD',
    campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
  }).expect(201);
  return { dni, code: res.body.data.applicantCode };
}

const answer = (a: { dni: string; code: string }, answers: number[], extra: Record<string, unknown> = {}) =>
  t.request.post('/api/v1/inscriptions/survey').send({ documentNumber: a.dni, applicantCode: a.code, answers, ...extra });

describe('Encuesta SUS al terminar la inscripción', () => {
  it('guarda la respuesta con su puntaje, una sola vez por inscripción y sin datos personales', async () => {
    const a = await register('99900081');
    const res = (await answer(a, [4, 2, 4, 2, 4, 2, 4, 2, 4, 2], { comment: '  Muy claro el paso a paso  ', durationSeconds: 420, device: 'celular' }).expect(201)).body.data;
    expect(res).toEqual({ score: 75 });

    const row = await t.db.usabilitySurvey.findUniqueOrThrow({ where: { applicantCode: a.code } });
    expect(row).toMatchObject({ answers: [4, 2, 4, 2, 4, 2, 4, 2, 4, 2], comment: 'Muy claro el paso a paso', durationSeconds: 420, device: 'celular' });
    expect(Number(row.score)).toBe(75);

    const again = await answer(a, [5, 1, 5, 1, 5, 1, 5, 1, 5, 1]).expect(409);
    expect(again.body.error.code).toBe('SURVEY_ALREADY_ANSWERED');
  });

  it('rechaza respuestas incompletas o fuera de escala y un DNI que no corresponde al código', async () => {
    const a = await register('99900082');
    await answer(a, [4, 2, 4]).expect(400);
    await answer(a, [6, 2, 4, 2, 4, 2, 4, 2, 4, 2]).expect(400);
    await answer({ dni: '99900099', code: a.code }, [4, 2, 4, 2, 4, 2, 4, 2, 4, 2]).expect(404);
  });

  it('resume las respuestas para el panel: promedio, calificación y promedio por afirmación', async () => {
    const b = await register('99900083');
    await answer(b, [5, 1, 5, 1, 5, 1, 5, 1, 5, 1], { device: 'computadora' }).expect(201);
    const s = await t.usability.summary();
    expect(s.responses).toBeGreaterThanOrEqual(2);
    expect(s.mean).not.toBeNull();
    expect(s.statements).toHaveLength(10);
    expect(s.distribution.reduce((acc, d) => acc + d.count, 0)).toBe(s.responses);
    expect(s.comments.some((c) => c.text === 'Muy claro el paso a paso')).toBe(true);
    // Sin datos personales en el resumen.
    expect(JSON.stringify(s)).not.toMatch(/99900081|sus99900081|applicantCode/);
  });
});
