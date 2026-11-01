export type StageScope = 'ORD' | 'EXO' | 'CEPRE' | 'REINS' | 'ALL';
export type StageKind = 'REGULAR' | 'EXTEMPORANEOUS' | 'EXAM' | 'PUBLICATION' | 'DELIVERY' | 'OTHER';
export type StageStatus = 'UPCOMING' | 'IN_PROGRESS' | 'FINISHED';

export interface Stage {
  code: string;
  name: string;
  scope: StageScope;
  kind: StageKind;
  startsAt: Date;
  endsAt: Date;
  highlight: boolean;
  sortOrder: number;
}

/** Estado calculado, nunca guardado (research R-03): Próxima · En curso · Finalizada. */
export function stageStatus(stage: Pick<Stage, 'startsAt' | 'endsAt'>, now: Date): StageStatus {
  if (now.getTime() < stage.startsAt.getTime()) return 'UPCOMING';
  if (now.getTime() > stage.endsAt.getTime()) return 'FINISHED';
  return 'IN_PROGRESS';
}

export function stagesInProgress(stages: Stage[], now: Date): Stage[] {
  return stages.filter((s) => stageStatus(s, now) === 'IN_PROGRESS');
}

/** Siguiente hito: primera etapa destacada (exámenes) que aún no empieza. FR-003. */
export function nextMilestone(stages: Stage[], now: Date): { stage: Stage; secondsRemaining: number } | null {
  const upcoming = stages
    .filter((s) => s.highlight && s.startsAt.getTime() > now.getTime())
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const stage = upcoming[0];
  if (!stage) return null;
  return { stage, secondsRemaining: Math.floor((stage.startsAt.getTime() - now.getTime()) / 1000) };
}
