import { describe, expect, it } from 'vitest';
import { nextMilestone, stageStatus, type Stage } from '../../../src/modules/convocatorias/domain/stage.js';
import { stages as seedStages } from '../../../prisma/seed/call-2027-I.js';

const stages: Stage[] = seedStages.map((s, i) => ({
  ...s, startsAt: new Date(s.startsAt), endsAt: new Date(s.endsAt), highlight: s.highlight ?? false, sortOrder: i + 1,
}));
const byCode = (code: string) => stages.find((s) => s.code === code)!;
const at = (iso: string) => new Date(iso);

describe('Estado de etapa (spec 001, H1; research R-03)', () => {
  it('H1-E1: el 25/10/2026 la inscripción regular ordinaria está en curso', () => {
    expect(stageStatus(byCode('ORD_REGULAR'), at('2026-10-25T10:00:00-05:00'))).toBe('IN_PROGRESS');
  });

  it('H1-E2: el 08/11/2026 la regular finalizó y la extemporánea está en curso', () => {
    const now = at('2026-11-08T10:00:00-05:00');
    expect(stageStatus(byCode('ORD_REGULAR'), now)).toBe('FINISHED');
    expect(stageStatus(byCode('ORD_EXTEMP'), now)).toBe('IN_PROGRESS');
  });

  it('cambia de día a medianoche en hora de Lima, no en UTC', () => {
    // 06/11 23:59 en Lima = 07/11 04:59 UTC: aún es regular.
    expect(stageStatus(byCode('ORD_REGULAR'), at('2026-11-06T23:59:00-05:00'))).toBe('IN_PROGRESS');
    expect(stageStatus(byCode('ORD_EXTEMP'), at('2026-11-06T23:59:00-05:00'))).toBe('UPCOMING');
    expect(stageStatus(byCode('ORD_EXTEMP'), at('2026-11-07T00:00:00-05:00'))).toBe('IN_PROGRESS');
  });

  it('caso límite: dos etapas en curso el mismo día (11/11: adjudicación e inscripción CEPRE)', () => {
    const now = at('2026-11-11T12:00:00-05:00');
    expect(stageStatus(byCode('CEPRE_ADJ'), now)).toBe('IN_PROGRESS');
    expect(stageStatus(byCode('CEPRE_REGULAR'), now)).toBe('IN_PROGRESS');
  });
});

describe('Siguiente hito (FR-003)', () => {
  it('desde el 25/10 10:00 es el examen de exonerados, en 1 803 600 s', () => {
    const m = nextMilestone(stages, at('2026-10-25T10:00:00-05:00'));
    expect(m?.stage.code).toBe('EXAM_EXO');
    expect(m?.secondsRemaining).toBe(1_803_600);
  });

  it('después del examen de exonerados pasa al ordinario', () => {
    expect(nextMilestone(stages, at('2026-11-16T08:00:00-05:00'))?.stage.code).toBe('EXAM_ORD');
  });

  it('sin hitos futuros devuelve null', () => {
    expect(nextMilestone(stages, at('2026-12-31T00:00:00-05:00'))).toBeNull();
  });
});
