import type { ContactRequestDto } from '@sia/contracts';
import { nextCounterValue } from '../../../shared/db/counters.js';
import type { Db } from '../../../shared/db/prisma.js';
import type { Outbox } from '../../../shared/events/outbox.js';
import { validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import type { FileStorage } from '../../../shared/storage/file-storage.js';
import { checkDocument, type CheckedFile } from '../../expedientes/domain/file-check.js';

/** Evidencia de una denuncia: hasta 3 archivos PDF, JPG o PNG que juntos no superen 5 MB (MEJ-14). */
export const EVIDENCE = { maxFiles: 3, maxTotalBytes: 5 * 1024 * 1024 } as const;
export interface EvidenceInput { fileName: string; content: string }

/** Casos de atención con número (spec 001, Historia 6; research R-08). */
export class SupportCases {
  constructor(
    private readonly db: Db,
    private readonly outbox: Outbox,
    private readonly limiter: RateLimiter,
    private readonly storage?: FileStorage,
  ) {}

  /** Devuelve el número de caso, o null si el campo trampa vino lleno (se responde igual que un éxito). */
  async createContact(input: ContactRequestDto, ipHash: string, callCode: string): Promise<string | null> {
    if (input.website) return null;
    return this.create('CONTACT', input, ipHash, callCode);
  }

  /** Denuncia o irregularidad del proceso, atendida con reserva (página «Denuncias»). */
  async createComplaint(
    input: { name?: string | undefined; email: string; phone?: string | undefined; message: string; website?: string | undefined; attachments?: EvidenceInput[] | undefined },
    ipHash: string, callCode: string,
  ): Promise<string | null> {
    if (input.website) return null;
    // La evidencia se valida antes de crear el caso: un archivo inválido rechaza todo el envío.
    const files = this.checkEvidence(input.attachments ?? []);
    const caseNumber = await this.create('COMPLAINT', { ...input, name: input.name?.trim() || 'Reservado' }, ipHash, callCode);
    if (files.length && this.storage) {
      const c = await this.db.supportCase.findUniqueOrThrow({ where: { caseNumber }, select: { id: true } });
      for (const [i, f] of files.entries()) {
        const storageKey = `denuncias/${caseNumber}/${i + 1}.${f.check.extension}`;
        await this.storage.put(storageKey, f.buf, f.check.mimeType);
        await this.db.supportCaseAttachment.create({
          data: { caseId: c.id, fileName: f.fileName, contentType: f.check.mimeType, sizeBytes: f.check.sizeBytes, sha256: f.check.sha256, storageKey },
        });
      }
    }
    return caseNumber;
  }

  private checkEvidence(items: EvidenceInput[]): { fileName: string; buf: Buffer; check: CheckedFile }[] {
    if (items.length > EVIDENCE.maxFiles) throw validationError(`Adjunta como máximo ${EVIDENCE.maxFiles} archivos.`, [{ field: 'attachments', issue: 'demasiados' }]);
    let total = 0;
    return items.map((it, i) => {
      const buf = Buffer.from(it.content.replace(/^data:[^,]*,/, ''), 'base64');
      total += buf.length;
      if (total > EVIDENCE.maxTotalBytes) throw validationError('Los archivos adjuntos superan 5 MB en total.', [{ field: 'attachments', issue: 'tamaño' }]);
      const r = checkDocument(buf, ['PDF', 'JPG', 'PNG']);
      if (!r.ok) throw validationError(`${it.fileName}: ${r.reason}`, [{ field: `attachments.${i}`, issue: r.reason }]);
      return { fileName: it.fileName.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 200), buf, check: r.file };
    });
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
