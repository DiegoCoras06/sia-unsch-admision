// Punto de entrada local: API + despachador de la outbox cada 5 s (en AWS lo hace el Lambda worker).
import { createApplication } from './app.js';
import { loadEnv } from './shared/config/env.js';
import { startTelemetry } from './shared/telemetry/otel.js';
import { isDatabaseUnreachable } from './shared/db/unreachable.js';
import { tasks } from './worker/tasks.js';

const env = loadEnv();
const application = createApplication(env);
await startTelemetry(env.OTEL_EXPORTER_OTLP_ENDPOINT, (m) => application.logger.info(m));

const server = application.app.listen(env.API_PORT, env.API_HOST, () => {
  application.logger.info(`API escuchando en http://${env.API_HOST}:${env.API_PORT}/api/v1`);
});

/** Si la base de datos no responde, se avisa una vez al caer y otra al volver, no en cada ciclo. */
let dbDown = false;
const background = (name: keyof typeof tasks, label: string) => () =>
  tasks[name](application)
    .then(() => {
      if (dbDown) application.logger.info('base de datos disponible de nuevo');
      dbDown = false;
    })
    .catch((err: unknown) => {
      if (!isDatabaseUnreachable(err)) return application.logger.error({ err }, label);
      if (!dbDown) application.logger.warn('base de datos no disponible: las tareas en segundo plano esperan a que vuelva');
      dbDown = true;
    });

const timer = setInterval(background('outbox.dispatch', 'worker local'), 5_000);

// Avisos automáticos, publicación de resultados y cola de correo (M09, M11) cada minuto.
const ticker = setInterval(background('notifications.tick', 'ciclo de avisos'), 60_000);

const shutdown = () => {
  clearInterval(timer);
  clearInterval(ticker);
  server.close(() => void application.db.$disconnect().then(() => process.exit(0)));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
