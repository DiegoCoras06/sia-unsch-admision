import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import { conflict, notFound, validationError } from '../../../shared/http/errors.js';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import { SUS_STATEMENTS, SUS_TARGET, isValidSusAnswers, susGrade, susScore } from '../domain/sus.js';
import type { InscriptionRepository } from './inscription-repository.js';

export interface SurveyRecord {
  answers: number[];
  score: number;
  comment: string | null;
  durationSeconds: number | null;
  device: string | null;
  createdAt: Date;
}

/** Repositorio de la encuesta SUS (la implementación con Prisma está en `infrastructure/`). */
export interface SurveyRepository {
  /** Lanza `SurveyAlreadyAnsweredError` si ese postulante ya respondió. */
  save(data: { callCode: string; applicantCode: string; answers: number[]; score: number; comment: string | null; durationSeconds: number | null; device: string | null }): Promise<void>;
  list(callCode: string): Promise<SurveyRecord[]>;
}

export class SurveyAlreadyAnsweredError extends Error {}

/** AC07 (EQ-07): encuesta SUS al terminar la inscripción y su resumen para el panel. */
export class UsabilitySurveyService {
  constructor(private readonly d: { surveys: SurveyRepository; inscriptions: InscriptionRepository; limiter: RateLimiter; currentCallCode: () => Promise<string> }) {}

  /** El postulante responde con DNI + código; una respuesta por inscripción. */
  async submit(
    input: { documentNumber: string; applicantCode: string; answers: number[]; comment?: string | undefined; durationSeconds?: number | undefined; device?: string | undefined },
    meta: RequestMeta,
  ): Promise<{ score: number }> {
    await this.d.limiter.consume(`survey:${meta.ipHash}`, 10, 3600);
    if (!isValidSusAnswers(input.answers)) throw validationError('Responde las 10 afirmaciones con un valor de 1 a 5.', [{ field: 'answers', issue: '10 respuestas de 1 a 5' }]);
    const row = await this.d.inscriptions.findByCode(input.applicantCode);
    if (!row || row.documentNumber !== input.documentNumber.trim().toUpperCase()) throw notFound('No encontramos esa inscripción.');
    const score = susScore(input.answers);
    try {
      await this.d.surveys.save({
        callCode: row.callCode, applicantCode: row.applicantCode, answers: input.answers, score,
        comment: input.comment?.trim() || null, durationSeconds: input.durationSeconds ?? null, device: input.device ?? null,
      });
    } catch (e) {
      if (e instanceof SurveyAlreadyAnsweredError) throw conflict('SURVEY_ALREADY_ANSWERED', 'Ya respondiste la encuesta. ¡Gracias!');
      throw e;
    }
    return { score };
  }

  /** Panel: puntaje promedio, mediana, calificación, promedio por afirmación y comentarios (sin datos personales). */
  async summary(code?: string) {
    const callCode = code ?? (await this.d.currentCallCode());
    const rows = await this.d.surveys.list(callCode);
    const scores = rows.map((r) => r.score).sort((a, b) => a - b);
    const n = scores.length;
    const mean = n ? scores.reduce((a, b) => a + b, 0) / n : null;
    const median = n ? (n % 2 ? scores[(n - 1) / 2]! : (scores[n / 2 - 1]! + scores[n / 2]!) / 2) : null;
    const round = (v: number) => Math.round(v * 10) / 10;
    const buckets = [
      { label: 'Menos de 51', from: 0, to: 51 }, { label: '51 a 67.5', from: 51, to: 68 }, { label: '68 a 73.5', from: 68, to: 74 },
      { label: '74 a 80', from: 74, to: 80.3 }, { label: '80.3 a 100', from: 80.3, to: 100.1 },
    ];
    return {
      callCode,
      responses: n,
      target: SUS_TARGET,
      mean: mean === null ? null : round(mean),
      median: median === null ? null : round(median),
      meetsTarget: mean !== null && mean >= SUS_TARGET,
      ...(mean === null ? { grade: null, adjective: null } : susGrade(mean)),
      distribution: buckets.map((b) => ({ label: b.label, count: scores.filter((s) => s >= b.from && s < b.to).length })),
      statements: SUS_STATEMENTS.map((text, i) => ({
        text,
        positive: i % 2 === 0,
        average: n ? round(rows.reduce((acc, r) => acc + r.answers[i]!, 0) / n) : null,
      })),
      medianSeconds: (() => {
        const t = rows.map((r) => r.durationSeconds).filter((v): v is number => v !== null).sort((a, b) => a - b);
        return t.length ? t[Math.floor(t.length / 2)]! : null;
      })(),
      devices: Object.entries(rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.device ?? 'otro']: (acc[r.device ?? 'otro'] ?? 0) + 1 }), {}))
        .map(([device, count]) => ({ device, count })),
      comments: rows.filter((r) => r.comment).slice(0, 20).map((r) => ({ text: r.comment!, score: r.score, at: r.createdAt.toISOString() })),
    };
  }
}
