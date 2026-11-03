import { SendMessageBatchCommand, SQSClient } from '@aws-sdk/client-sqs';
import type { Logger } from 'pino';

/**
 * Cola de eventos (ADR-021). La bandeja de eventos (outbox) solo envía el ID: el contenido sigue en PostgreSQL,
 * así la cola no transporta datos personales y un mensaje repetido no duplica nada (`Outbox.processEvent`).
 */
export interface EventQueue {
  send(eventIds: string[]): Promise<void>;
}

/** Mensaje que recibe el worker desde SQS. */
export interface QueuedEvent {
  eventId: string;
}

/** Amazon SQS. La región se toma de la URL de la cola (https://sqs.<región>.amazonaws.com/<cuenta>/<cola>). */
export class SqsEventQueue implements EventQueue {
  private readonly client: SQSClient;

  constructor(private readonly queueUrl: string, private readonly logger: Logger, client?: SQSClient) {
    const region = /sqs\.([a-z0-9-]+)\.amazonaws\.com/.exec(queueUrl)?.[1];
    this.client = client ?? new SQSClient(region ? { region } : {});
  }

  async send(eventIds: string[]): Promise<void> {
    // SendMessageBatch admite hasta 10 mensajes por llamada.
    for (let i = 0; i < eventIds.length; i += 10) {
      const chunk = eventIds.slice(i, i + 10);
      const result = await this.client.send(new SendMessageBatchCommand({
        QueueUrl: this.queueUrl,
        Entries: chunk.map((eventId, n) => ({ Id: String(n), MessageBody: JSON.stringify({ eventId } satisfies QueuedEvent) })),
      }));
      if (result.Failed?.length) {
        // No se lanza: el evento sigue pendiente en la outbox y la tarea programada lo vuelve a enviar.
        this.logger.warn({ failed: result.Failed.length }, 'SQS rechazó algunos eventos; se reenviarán');
      }
    }
  }
}
