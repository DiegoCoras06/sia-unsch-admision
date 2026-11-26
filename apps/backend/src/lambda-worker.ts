// Lambda del procesador asíncrono (ADR-012 y ADR-021).
import { createApplication, type Application } from './app.js';
import { loadAwsParameters } from './shared/config/aws-parameters.js';
import { loadEnv } from './shared/config/env.js';
import { processSqsBatch, type SqsBatchEvent } from './shared/events/sqs-batch.js';
import { tasks, type TaskName } from './worker/tasks.js';

let applicationPromise: Promise<Application> | undefined;

async function getApplication(): Promise<Application> {
  applicationPromise ??= (async () => {
    const prefix = process.env['CONFIG_PARAMETER_PREFIX'];
    if (prefix) {
      const region = process.env['AWS_REGION'] ?? process.env['SQS_REGION'] ?? 'us-east-2';
      Object.assign(process.env, await loadAwsParameters(prefix, region));
    }
    return createApplication(loadEnv());
  })();
  return applicationPromise;
}

export async function handler(event: { task?: string } | SqsBatchEvent) {
  const application = await getApplication();
  if ('Records' in event)
    return processSqsBatch(event, (eventId) => application.outbox.processEvent(eventId), application.logger);

  const name = (event.task ?? 'outbox.dispatch') as TaskName;
  const task = tasks[name];
  if (!task) throw new Error(`Tarea desconocida: ${name}`);
  const result = await task(application);
  application.logger.info({ task: name, ...result }, 'tarea completada');
  return result;
}
