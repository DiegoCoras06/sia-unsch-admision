import type { Logger } from 'pino';
import type { QueuedEvent } from './event-queue.js';

export interface SqsRecord {
  messageId: string;
  body: string;
}

export interface SqsBatchEvent {
  Records: SqsRecord[];
}

export interface SqsBatchResponse {
  batchItemFailures: { itemIdentifier: string }[];
}

/** Procesador aislado del runtime Lambda para probar respuestas parciales y mensajes inválidos. */
export async function processSqsBatch(
  event: SqsBatchEvent,
  processEvent: (eventId: string) => Promise<boolean>,
  logger: Logger,
): Promise<SqsBatchResponse> {
  const batchItemFailures: { itemIdentifier: string }[] = [];
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body) as Partial<QueuedEvent>;
      if (typeof message.eventId !== 'string' || !message.eventId) throw new Error('eventId inválido');
      if (!(await processEvent(message.eventId))) batchItemFailures.push({ itemIdentifier: record.messageId });
    } catch (error) {
      logger.error({ err: error, messageId: record.messageId }, 'mensaje de la cola no procesado');
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }
  logger.info({ received: event.Records.length, failed: batchItemFailures.length }, 'lote de la cola procesado');
  return { batchItemFailures };
}
