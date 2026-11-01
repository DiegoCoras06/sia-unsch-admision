// Lambda invocado por EventBridge Scheduler con { "task": "outbox.dispatch" } (ADR-012).
import { createApplication } from './app.js';
import { loadEnv } from './shared/config/env.js';
import { tasks, type TaskName } from './worker/tasks.js';

const application = createApplication(loadEnv());

export async function handler(event: { task?: string }) {
  const name = (event.task ?? 'outbox.dispatch') as TaskName;
  const task = tasks[name];
  if (!task) throw new Error(`Tarea desconocida: ${name}`);
  const result = await task(application);
  application.logger.info({ task: name, ...result }, 'tarea completada');
  return result;
}
