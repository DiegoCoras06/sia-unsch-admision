/**
 * Composición del monolito modular (ADR-001, ADR-002): aquí, y solo aquí, se decide qué
 * adaptador implementa cada puerto. Los módulos no se conocen entre sí salvo por su index.ts.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express, { Router, type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { AuditLog } from './shared/audit/audit.js';
import { shiftedClock, systemClock, type Clock } from './shared/clock/clock.js';
import type { Env } from './shared/config/env.js';
import { createPrismaClient, type Db } from './shared/db/prisma.js';
import { FileEmailSender, type EmailSender } from './shared/email/email-sender.js';
import { Outbox } from './shared/events/outbox.js';
import { errorHandler, handle, notFoundHandler, requestContext } from './shared/http/middleware.js';
import { RateLimiter } from './shared/rate-limit/rate-limiter.js';
import { createLogger } from './shared/telemetry/logger.js';
import { createConfiguracionModule } from './modules/configuracion/index.js';
import { createConvocatoriasModule } from './modules/convocatorias/index.js';
import { createSeguridadModule } from './modules/seguridad/index.js';
import { createIdentityProvider, createUsuariosModule } from './modules/usuarios/index.js';
import { createInscripcionesModule } from './modules/inscripciones/index.js';
import { createPagosModule, createPaymentGateway, createTesoreria, createYapeGateway, type PaymentGateway, type YapeGateway } from './modules/pagos/index.js';
import { createAsistenteModule, type LlmProvider } from './modules/asistente/index.js';
import { LocalFileStorage, type FileStorage } from './shared/storage/file-storage.js';
import { S3FileStorage } from './shared/storage/s3-file-storage.js';
import { adminRoutes } from './admin-routes.js';
import { createReportesModule } from './modules/reportes/index.js';
import { SecurityAdmin, hasPermission } from './modules/seguridad/index.js';
import { createExpedientesModule } from './modules/expedientes/index.js';
import { createExamenesModule } from './modules/examenes/index.js';
import { createNotificacionesModule, RecordingEmailSender } from './modules/notificaciones/index.js';
import { createResultadosModule } from './modules/resultados/index.js';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export interface AppOverrides {
  clock?: Clock;
  db?: Db;
  email?: EmailSender;
  logger?: Logger;
  storage?: FileStorage;
  paymentGateway?: PaymentGateway;
  /** Yape (ADR-019) en pruebas; `null` lo desactiva. */
  yapeGateway?: YapeGateway | null;
  /** Proveedor de IA del asistente (pruebas); `null` fuerza el modo básico. */
  assistantAi?: LlmProvider | null;
}

export interface Application {
  app: Express;
  db: Db;
  outbox: Outbox;
  limiter: RateLimiter;
  clock: Clock;
  logger: Logger;
  /** Para tareas programadas (retención del asistente) y pruebas. */
  assistant: { purgeExpired(): Promise<number> };
  /** Ciclos periódicos de M11 (avisos y cola de correo) y M09 (publicación y ingreso). */
  notifications: { tick(): Promise<{ queued: number; sent: number }> };
  results: { tick(): Promise<{ queued: number; lost: number }> };
  /** RF-13.10: anonimiza las inscripciones que superan `retencion.inscripciones_anios`. */
  retention: { inscriptions(): Promise<number> };
}

export function createApplication(env: Env, overrides: AppOverrides = {}): Application {
  const logger = overrides.logger ?? createLogger(env.LOG_LEVEL, env.APP_ENV === 'dev');
  const clock = overrides.clock ?? (env.APP_FIXED_NOW ? shiftedClock(new Date(env.APP_FIXED_NOW)) : systemClock);
  const db = overrides.db ?? createPrismaClient(env.DATABASE_URL, env.dbMaxConnections, env.DB_SSL_CA ? path.resolve(backendDir, env.DB_SSL_CA) : undefined);
  const transport = overrides.email ?? new FileEmailSender(path.join(backendDir, '.dev-mail'), logger);
  // M11: cada correo que envía cualquier módulo queda registrado con su estado (RF-11.09).
  const email = new RecordingEmailSender(db, transport, clock);
  const outbox = new Outbox(db, clock, logger);
  const limiter = new RateLimiter(db, clock);
  const audit = new AuditLog(db);

  if (env.PAYMENTS_PROVIDER === 'izipay') logger.info({ environment: env.IZIPAY_ENV }, 'Pasarela de pagos: Izipay');
  if (env.PAYMENTS_PROVIDER === 'micuentaweb') logger.info({ environment: env.MICUENTAWEB_ENV }, 'Pasarela de pagos: Izipay micuentaweb');
  if (env.APP_FIXED_NOW) logger.warn({ now: clock.now().toISOString() }, 'Reloj simulado activo (APP_FIXED_NOW)');

  // ── Módulos ──────────────────────────────────────────────────────────
  const storage = overrides.storage
    ?? (env.FILE_STORAGE === 's3' && env.S3_BUCKET
      ? new S3FileStorage({ bucket: env.S3_BUCKET, region: env.S3_REGION })
      : new LocalFileStorage(path.join(backendDir, '.dev-storage')));
  logger.info({ storage: env.FILE_STORAGE, bucket: env.FILE_STORAGE === 's3' ? env.S3_BUCKET : undefined }, 'Almacenamiento de archivos');
  const convocatorias = createConvocatoriasModule(db, clock, audit);
  const configuracion = createConfiguracionModule(db, convocatorias.queries, clock, audit, outbox, storage);
  const seguridad = createSeguridadModule({
    db, clock, outbox, limiter,
    jwtSecret: env.JWT_SECRET,
    identityTokenSecret: env.IDENTITY_TOKEN_SECRET,
    currentCallCode: async () => (await convocatorias.queries.getCurrentCall()).code,
    audit,
  });
  const identity = createIdentityProvider(
    { provider: env.IDENTITY_PROVIDER, url: env.APIPERU_URL, token: env.APIPERU_TOKEN },
    () => clock.now(),
  );
  const inscripciones = createInscripcionesModule({
    db, clock, outbox, audit, limiter, storage, identity, email,
    convocatorias: convocatorias.queries,
    access: seguridad.access,
    frontendOrigin: env.FRONTEND_ORIGIN,
    fichaSecret: `ficha-qr:${env.HMAC_SECRET}`,
    // M02 se crea más abajo; la política vigente se consulta en cada inscripción.
    currentConsent: () => usuarios.auth.currentConsent(),
  });
  const paymentGateway = overrides.paymentGateway ?? createPaymentGateway({
    provider: env.PAYMENTS_PROVIDER,
    mockHashKey: `mock-gateway:${env.HMAC_SECRET}`,
    izipay: {
      environment: env.IZIPAY_ENV,
      apiUrl: env.IZIPAY_API_URL,
      merchantCode: env.IZIPAY_MERCHANT_CODE,
      apiKey: env.IZIPAY_API_KEY,
      hashKey: env.IZIPAY_HASH_KEY,
      rsaPublicKey: env.IZIPAY_PUBLIC_KEY,
      // Izipay solo puede notificar a una URL pública con HTTPS (en local se confirma con la respuesta del SDK).
      ipnUrl: env.PUBLIC_API_URL?.startsWith('https://') ? `${env.PUBLIC_API_URL.replace(/\/$/, '')}/api/v1/payments/izipay/notify` : undefined,
    },
    micuentaweb: {
      environment: env.MICUENTAWEB_ENV,
      apiUrl: env.MICUENTAWEB_API_URL,
      shopId: env.MICUENTAWEB_SHOP_ID,
      password: env.MICUENTAWEB_PASSWORD,
      publicKey: env.MICUENTAWEB_PUBLIC_KEY,
      hmacKey: env.MICUENTAWEB_HMAC_KEY,
      ipnUrl: env.PUBLIC_API_URL?.startsWith('https://') ? `${env.PUBLIC_API_URL.replace(/\/$/, '')}/api/v1/payments/micuentaweb/notify` : undefined,
    },
  });
  const yapeGateway = overrides.yapeGateway !== undefined
    ? overrides.yapeGateway
    : createYapeGateway({ publicKey: env.CULQI_PUBLIC_KEY, secretKey: env.CULQI_SECRET_KEY, apiUrl: env.CULQI_API_URL });
  const pagos = createPagosModule({
    db, clock, outbox, audit, limiter, logger,
    gateway: paymentGateway,
    yape: yapeGateway,
    inscriptions: inscripciones.service,
  });
  const asistente = createAsistenteModule({
    db, clock, limiter, audit, logger,
    convocatorias: convocatorias.queries,
    inscriptions: inscripciones.service,
    payments: pagos.service,
    support: seguridad.support,
    // Módulos creados más abajo: se resuelven al momento de cada consulta.
    progress: {
      dossier: (code) => expedientes.service.summaryFor(code),
      room: (code) => examenes.exams.roomFor(code),
      result: (code) => resultados.service.summaryFor(code),
    },
    openRouter: { apiKey: env.OPENROUTER_API_KEY, model: env.OPENROUTER_MODEL, referer: env.FRONTEND_ORIGIN },
    ...(overrides.assistantAi !== undefined ? { aiOverride: overrides.assistantAi } : {}),
    passSecret: `assistant-pass:${env.HMAC_SECRET}`,
    dailyBudgetUsd: env.CHAT_DAILY_BUDGET_USD,
    // Parámetro editable en el panel (RF-13.10); CHAT_RETENTION_DAYS queda como respaldo.
    retentionDays: async () => Number(await configuracion.admin.parameter('retencion.conversaciones_dias')) || env.CHAT_RETENTION_DAYS,
  });
  // Retención de conversaciones (RF-10.11): se aplica al arrancar; el worker la repetirá a diario (ADR-012).
  setImmediate(() => asistente.service.purgeExpired().catch((error: unknown) => logger.warn({ err: error }, 'no se pudo aplicar la retención del asistente')));
  logger.info({ model: env.OPENROUTER_API_KEY ? env.OPENROUTER_MODEL : null }, env.OPENROUTER_API_KEY ? 'Asistente: OpenRouter' : 'Asistente: modo básico (sin OPENROUTER_API_KEY)');
  const usuarios = createUsuariosModule({
    identityProvider: identity,
    db, clock, outbox, audit, limiter, email,
    tokens: seguridad.tokens,
    sessions: seguridad.sessions,
    access: seguridad.access,
    authenticate: seguridad.authenticate,
    hmacSecret: env.HMAC_SECRET,
    frontendOrigin: env.FRONTEND_ORIGIN,
    cookieSecure: env.cookieSecure,
    guard: seguridad.guard,
    staffSecretKey: env.STAFF_SECRET_KEY ?? `staff:${env.HMAC_SECRET}`,
    inscriptionsOf: (type, number) => inscripciones.service.byDocument(type, number),
  });

  const expedientes = createExpedientesModule({
    db, clock, outbox, audit, limiter, storage, email,
    convocatorias: convocatorias.queries,
    inscriptions: inscripciones.service,
    // Evaluadores activos para el reparto equitativo (RF-06.03).
    evaluators: async () => (await usuarios.staffAdmin.list()).filter((u) => u.status === 'ACTIVE' && u.roles.includes('EVALUADOR')).map((u) => ({ id: u.id, name: u.fullName })),
    authenticate: seguridad.authenticate,
    guard: seguridad.guard,
    seesAll: (roles) => hasPermission(roles, 'expedientes.asignar'),
    frontendOrigin: env.FRONTEND_ORIGIN,
  });
  const examenes = createExamenesModule({
    db, clock, outbox, audit, limiter, storage, email,
    convocatorias: convocatorias.queries,
    inscriptions: inscripciones.service,
    // RN-60: las incidencias van a la Comisión (personal activo de Admisión y administración).
    commission: async () => (await usuarios.staffAdmin.list()).filter((u) => u.status === 'ACTIVE' && (u.roles.includes('ADMISION') || u.roles.includes('ADMIN'))).map((u) => u.email),
    authenticate: seguridad.authenticate,
    guard: seguridad.guard,
    secret: `examen-qr:${env.HMAC_SECRET}`,
    frontendOrigin: env.FRONTEND_ORIGIN,
  });
  const reportes = createReportesModule(db);
  const notificaciones = createNotificacionesModule({
    db, clock, audit, limiter, transport,
    sources: {
      segment: (f) => inscripciones.service.segment(f),
      pendingPayments: (h) => inscripciones.service.pendingPayments(h),
      contact: async (doc, code) => inscripciones.service.examContext(code, doc),
      roomNotices: () => examenes.exams.roomNotices(),
      markRoomsNotified: (id) => examenes.exams.markRoomsNotified(id),
      examsSoon: (h) => examenes.exams.examsSoon(h),
    },
    authenticate: seguridad.authenticate,
    guard: seguridad.guard,
    frontendOrigin: env.FRONTEND_ORIGIN,
  });
  const resultados = createResultadosModule({
    db, clock, audit, limiter, storage,
    convocatorias: convocatorias.queries,
    ports: {
      exams: examenes.exams,
      inscriptions: inscripciones.service,
      notify: { render: (k, v) => notificaciones.service.render(k, v), enqueue: (items) => notificaciones.service.enqueue(items) },
      support: seguridad.support,
    },
    authenticate: seguridad.authenticate,
    guard: seguridad.guard,
    toExcel: reportes.toExcel,
    toPdf: reportes.toPdf,
    secret: `ingreso-qr:${env.HMAC_SECRET}`,
    frontendOrigin: env.FRONTEND_ORIGIN,
  });
  const tesoreria = createTesoreria({ db, audit, authenticate: seguridad.authenticate, guard: seguridad.guard });

  // ── HTTP ─────────────────────────────────────────────────────────────
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.APP_ENV === 'demo' ? true : 'loopback');
  app.use(helmet());
  // La inscripción trae la foto en base64 (≤ 2 MB); el resto de la API acepta cuerpos pequeños.
  const smallJson = express.json({ limit: '100kb' });
  const photoJson = express.json({ limit: '3mb' });
  // Documentos del expediente: hasta 5 MB por archivo, en base64 (en AWS se suben a S3 con URL prefirmada, ADR-010).
  const dossierJson = express.json({ limit: '8mb' });
  // Archivos CSV de la lectora óptica (M09) y de conciliación (M05), enviados como texto.
  const csvJson = express.json({ limit: '4mb' });
  // Notificación instantánea de micuentaweb: campos kr-answer y kr-hash en un formulario.
  const ipnForm = express.urlencoded({ extended: false, limit: '200kb' });
  app.use((req, res, next) => {
    if (req.method === 'POST' && (/^\/api\/v1\/admin\/results\/exams\/[^/]+\/batches$/.test(req.path) || req.path === '/api/v1/admin/reconciliations')) return csvJson(req, res, next);
    if (req.method === 'POST' && req.path === '/api/v1/inscriptions') return photoJson(req, res, next);
    if (req.method === 'POST' && req.path === '/api/v1/payments/micuentaweb/notify') return ipnForm(req, res, next);
    if (req.method === 'POST' && req.path === '/api/v1/dossier/documents') return dossierJson(req, res, next);
    // Imágenes del portal (≤ 3 MB) y documentos adicionales de la inscripción (≤ 5 MB), en base64.
    if (req.method === 'PUT' && req.path.startsWith('/api/v1/admin/site-assets/')) return dossierJson(req, res, next);
    if (req.method === 'POST' && req.path === '/api/v1/inscriptions/documents') return dossierJson(req, res, next);
    return smallJson(req, res, next);
  });
  app.use(cookieParser());
  app.use(requestContext(logger, env.HMAC_SECRET));

  const api = Router();
  api.get('/health', handle(async (_req, res) => {
    const database = await db.$queryRaw`SELECT 1`.then(() => 'ok' as const).catch(() => 'degraded' as const);
    res.status(database === 'ok' ? 200 : 503).json({ data: { status: 'ok', database, time: clock.now().toISOString() } });
  }));
  api.use(convocatorias.router);
  api.use(configuracion.router);
  api.use(seguridad.router);
  api.use(usuarios.router);
  api.use(inscripciones.router);
  api.use(pagos.router);
  api.use(asistente.router);
  api.use(expedientes.router);
  api.use(examenes.router);
  api.use(notificaciones.router);
  api.use(resultados.router);
  api.use(tesoreria.router);
  api.use(adminRoutes({
    authenticate: seguridad.authenticate,
    guard: seguridad.guard,
    calls: convocatorias.admin,
    catalog: convocatorias.catalog,
    content: configuracion.admin,
    siteAssets: configuracion.assets,
    security: new SecurityAdmin({ db, clock, audit, inscriptions: inscripciones.service }),
    inscriptions: inscripciones.service,
    inscriptionDocuments: inscripciones.documents,
    reports: reportes.queries,
    exporters: reportes,
    knowledge: asistente.knowledge,
    assistant: asistente.service,
    integrations: () => integrationStatus(env),
  }));

  app.use('/api/v1', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const retention = {
    inscriptions: async () => {
      const years = Number(await configuracion.admin.parameter('retencion.inscripciones_anios')) || 5;
      return (await inscripciones.service.anonymizeExpired(years, null)).anonymized;
    },
  };
  return { app, db, outbox, limiter, clock, logger, assistant: asistente.service, notifications: notificaciones.service, results: resultados.service, retention };
}

/** Estado de las integraciones para el panel (RF-14.04 a RF-14.07): nunca muestra secretos completos. */
function integrationStatus(env: Env): Record<string, { label: string; value: string; ok: boolean }> {
  const mask = (v: string | undefined) => (v ? `configurada (…${v.slice(-4)})` : 'sin configurar');
  return {
    identidad: {
      label: 'Consulta de identidad (RENIEC)',
      value: env.IDENTITY_PROVIDER === 'apiperu' ? `apiperu.dev · token ${mask(env.APIPERU_TOKEN)}` : 'Simulado con DNI de prueba',
      ok: env.IDENTITY_PROVIDER === 'apiperu',
    },
    pagos: {
      label: 'Pasarela de pagos',
      value: env.PAYMENTS_PROVIDER === 'micuentaweb'
        ? `Izipay micuentaweb ${env.MICUENTAWEB_ENV} · tienda ${mask(env.MICUENTAWEB_SHOP_ID)}`
        : env.PAYMENTS_PROVIDER === 'izipay'
        ? `Izipay ${env.IZIPAY_ENV} · comercio ${mask(env.IZIPAY_MERCHANT_CODE)}`
        : `Simulada · Izipay: clave de API ${mask(env.IZIPAY_API_KEY)}, comercio ${mask(env.IZIPAY_MERCHANT_CODE)}, clave hash ${mask(env.IZIPAY_HASH_KEY)}`,
      ok: env.PAYMENTS_PROVIDER === 'izipay' || env.PAYMENTS_PROVIDER === 'micuentaweb',
    },
    ia: {
      label: 'Asistente con IA (OpenRouter)',
      value: env.OPENROUTER_API_KEY ? `${env.OPENROUTER_MODEL} · clave ${mask(env.OPENROUTER_API_KEY)} · tope US$ ${env.CHAT_DAILY_BUDGET_USD}/día` : 'Modo básico (sin clave)',
      ok: Boolean(env.OPENROUTER_API_KEY),
    },
    correo: { label: 'Correo', value: env.EMAIL_PROVIDER === 'ses' ? 'Amazon SES' : 'Archivos locales (.dev-mail)', ok: env.EMAIL_PROVIDER === 'ses' },
    baseDatos: { label: 'Base de datos', value: env.DB_SSL_CA ? 'PostgreSQL en Amazon RDS con SSL verificado' : 'PostgreSQL local (embebido)', ok: true },
  };
}
