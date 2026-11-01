import type { ContactRequestDto } from '@sia/contracts';
import { nextCounterValue } from '../../../shared/db/counters.js';
import type { Db } from '../../../shared/db/prisma.js';
import type { Outbox } from '../../../shared/events/outbox.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';

/** Casos de atención con número (spec 001, Historia 6; research R-08). */
export class SupportCases {
  constructor(
    private readonly db: Db,
    private readonly outbox: Outbox,
    private readonly limiter: RateLimiter,
  ) {}

  /** Devuelve el número de caso, o null si el campo trampa vino lleno (se responde igual que un éxito). */
  async createContact(input: ContactRequestDto, ipHash: string, callCode: string): Promise<string | null> {
    if (input.website) return null;
    return this.create('CONTACT', input, ipHash, callCode);
  }

  /** Denuncia o irregularidad del proceso, atendida con reserva (página «Denuncias»). */
  async createComplaint(input: { name?: string | undefined; email: string; phone?: string | undefined; message: string; website?: string | undefined }, ipHash: string, callCode: string): Promise<string | null> {
    if (input.website) return null;
    return this.create('COMPLAINT', { ...input, name: input.name?.trim() || 'Reservado' }, ipHash, callCode);
  }

  /** Derivación desde el asistente virtual (spec 009, Historia 3; RF-10.10). */
  async createEscalation(input: { name: string; email: string; message: string }, ipHash: string, callCode: string): Promise<string> {
    return this.create('CHATBOT_ESCALATION', input, ipHash, callCode);
  }

  /** Solicitud de revisión de resultados por error material (spec 007, Historia 7; RF-09.12). */
  async createResultReview(input: { name: string; email: string; message: string }, ipHash: string, callCode: string): Promise<string> {
    return this.create('RESULT_REVIEW', input, ipHash, callCode);
  }

  private async create(type: 'CONTACT' | 'COMPLAINT' | 'CHATBOT_ESCALATION' | 'RESULT_REVIEW', input: { name: string; email: string; phone?: string | undefined; message: string }, ipHash: string, callCode: string): Promise<string> {
    await this.limiter.consume(`contact:${ipHash}`, 5, 3600);

    const prefix = `C-${callCode.replace('-', '')}`;
    const caseNumber = await this.db.$transaction(async (tx) => {
      const seq = await nextCounterValue(tx, `case:${prefix}`, 1);
      const number = `${prefix}-${String(seq).padStart(6, '0')}`;
      await tx.supportCase.create({
        data: { caseNumber: number, type, name: input.name, email: input.email.toLowerCase(), phone: input.phone ?? null, message: input.message },
      });
      await this.outbox.publish(tx, 'CasoContactoCreado', { caseNumber: number, name: input.name, email: input.email });
      return number;
    });
    this.outbox.kick();
    return caseNumber;
  }
}
