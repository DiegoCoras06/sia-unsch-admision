import type { Application } from '../app.js';

/** Tareas del procesador asíncrono (ADR-012). Todas son idempotentes. */
export const tasks = {
  /** Cada minuto: entrega eventos pendientes de la outbox (ADR-008). */
  'outbox.dispatch': async (a: Application) => ({ processed: await a.outbox.dispatch(50) }),
  /** Cada minuto: publicación de resultados, admisión perdida (M09), avisos automáticos y cola de correo (M11). */
  'notifications.tick': async (a: Application) => ({ results: await a.results.tick(), notifications: await a.notifications.tick() }),
  /** Diaria: borra contadores de límite de uso de más de 1 día. */
  'rate-limit.purge': async (a: Application) => ({ deleted: await a.limiter.purgeOlderThan(24) }),
  /** Diaria (RF-13.10): conversaciones del asistente vencidas e inscripciones de convocatorias antiguas. */
  'retention.apply': async (a: Application) => ({ conversations: await a.assistant.purgeExpired(), inscriptions: await a.retention.inscriptions() }),
} as const;

export type TaskName = keyof typeof tasks;
