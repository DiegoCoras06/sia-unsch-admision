import type { Db } from '../../../shared/db/prisma.js';
import { SurveyAlreadyAnsweredError, type SurveyRepository } from '../application/usability-survey.js';

/** Respuestas de la encuesta SUS en PostgreSQL (Prisma). */
export class PrismaSurveyRepository implements SurveyRepository {
  constructor(private readonly db: Db) {}

  async save(data: { callCode: string; applicantCode: string; answers: number[]; score: number; comment: string | null; durationSeconds: number | null; device: string | null }) {
    try {
      await this.db.usabilitySurvey.create({ data: { ...data, score: data.score.toFixed(2) } });
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') throw new SurveyAlreadyAnsweredError();
      throw e;
    }
  }

  async list(callCode: string) {
    const rows = await this.db.usabilitySurvey.findMany({ where: { callCode }, orderBy: { createdAt: 'desc' } });
    return rows.map((r) => ({
      answers: r.answers, score: Number(r.score), comment: r.comment, durationSeconds: r.durationSeconds, device: r.device, createdAt: r.createdAt,
    }));
  }
}
