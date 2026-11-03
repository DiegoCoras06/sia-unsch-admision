// Lambda del procesador asíncrono (ADR-012):
// - EventBridge Scheduler lo invoca con { "task": "outbox.dispatch" } y las demás tareas programadas.
// - Amazon SQS lo invoca con lotes de eventos de la outbox (ADR-021); con ReportBatchItemFailures solo se reintentan los que fallaron.
import { createApplication } from './app.js';
import { loadEnv } from './shared/config/env.js';
import type { QueuedEvent } from './shared/events/event-queue.js';
import { tasks, type TaskName } from './worker/tasks.js';

const application = createApplication(loadEnv());

interface SqsEvent {
  Records: { messageId: string; body: string }[];
}

export async function handler(event: { task?: string } | SqsEvent) {
  if ('Records' in event) return processQueue(event);
  const name = (event.task ?? 'outbox.dispatch') as TaskName;
  const task = tasks[name];
  if (!task) throw new Error(`Tarea desconocida: ${name}`);
  const result = await task(application);
  application.logger.info({ task: name, ...result }, 'tarea completada');
  return result;
}

async function processQueue(event: SqsEvent) {
  const batchItemFailures: { itemIdentifier: string }[] = [];
  for (const record of event.Records) {
    try {
      const { eventId } = JSON.parse(record.body) as QueuedEvent;
      if (!(await application.outbox.processEvent(eventId))) batchItemFailures.push({ itemIdentifier: record.messageId });
    } catch (error) {
      application.logger.error({ err: error, messageId: record.messageId }, 'mensaje de la cola no procesado');
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }
  application.logger.info({ received: event.Records.length, failed: batchItemFailures.length }, 'lote de la cola procesado');
  return { batchItemFailures };
}
