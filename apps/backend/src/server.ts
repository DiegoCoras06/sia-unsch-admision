// Punto de entrada local: API + despachador de la outbox cada 5 s (en AWS lo hace el Lambda worker).
import { createApplication } from './app.js';
import { loadEnv } from './shared/config/env.js';
import { startTelemetry } from './shared/telemetry/otel.js';
import { tasks } from './worker/tasks.js';

const env = loadEnv();
const application = createApplication(env);
await startTelemetry(env.OTEL_EXPORTER_OTLP_ENDPOINT, (m) => application.logger.info(m));

const server = application.app.listen(env.API_PORT, env.API_HOST, () => {
  application.logger.info(`API escuchando en http://${env.API_HOST}:${env.API_PORT}/api/v1`);
});

const timer = setInterval(() => {
  tasks['outbox.dispatch'](application).catch((err: unknown) => application.logger.error({ err }, 'worker local'));
}, 5_000);

// Avisos automáticos, publicación de resultados y cola de correo (M09, M11) cada minuto.
const ticker = setInterval(() => {
  tasks['notifications.tick'](application).catch((err: unknown) => application.logger.error({ err }, 'ciclo de avisos'));
}, 60_000);

const shutdown = () => {
  clearInterval(timer);
  clearInterval(ticker);
  server.close(() => void application.db.$disconnect().then(() => process.exit(0)));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
