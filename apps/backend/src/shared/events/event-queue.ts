import { SendMessageBatchCommand, SQSClient } from '@aws-sdk/client-sqs';
import type { Logger } from 'pino';

export interface QueueSendFailure {
  eventId: string;
  code: string;
  message?: string;
}

export interface QueueSendResult {
  sent: string[];
  failed: QueueSendFailure[];
}

/** Puerto de salida de la outbox. Solo una confirmación en `sent` equivale a entrega a la cola. */
export interface EventQueue {
  send(eventIds: string[]): Promise<QueueSendResult>;
}

/** Mensaje mínimo que recibe el worker: los datos personales permanecen en PostgreSQL. */
export interface QueuedEvent {
  eventId: string;
}

/** Adaptador Amazon SQS. Admite inyectar el cliente para pruebas unitarias. */
export class SqsEventQueue implements EventQueue {
  private readonly client: SQSClient;

  constructor(
    private readonly queueUrl: string,
    private readonly logger: Logger,
    client?: SQSClient,
    region?: string,
  ) {
    const urlRegion = /sqs\.([a-z0-9-]+)\.amazonaws\.com/.exec(queueUrl)?.[1];
    this.client = client ?? new SQSClient(region || urlRegion ? { region: region ?? urlRegion } : {});
  }

  async send(eventIds: string[]): Promise<QueueSendResult> {
    const sent: string[] = [];
    const failed: QueueSendFailure[] = [];

    for (let offset = 0; offset < eventIds.length; offset += 10) {
      const chunk = eventIds.slice(offset, offset + 10);
      try {
        const result = await this.client.send(
          new SendMessageBatchCommand({
            QueueUrl: this.queueUrl,
            Entries: chunk.map((eventId, index) => ({
              Id: String(index),
              MessageBody: JSON.stringify({ eventId } satisfies QueuedEvent),
            })),
          }),
        );
        const reported = new Set<string>();
        for (const entry of result.Successful ?? []) {
          const eventId = chunk[Number(entry.Id)];
          if (eventId) {
            sent.push(eventId);
            reported.add(eventId);
          }
        }
        for (const entry of result.Failed ?? []) {
          const eventId = chunk[Number(entry.Id)];
          if (eventId) {
            failed.push({ eventId, code: entry.Code ?? 'SQS_REJECTED', message: entry.Message });
            reported.add(eventId);
          }
        }
        for (const eventId of chunk) {
          if (!reported.has(eventId)) failed.push({ eventId, code: 'SQS_UNCONFIRMED' });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failed.push(...chunk.map((eventId) => ({ eventId, code: 'SQS_REQUEST_FAILED', message })));
      }
    }

    if (failed.length) this.logger.warn({ failed: failed.length }, 'SQS no confirmó algunos eventos; se reenviarán');
    return { sent, failed };
  }
}
