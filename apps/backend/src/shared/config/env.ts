import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_ENV: z.enum(['dev', 'test', 'demo']).default('dev'),
    API_HOST: z.string().default('127.0.0.1'),
    API_PORT: z.coerce.number().int().positive().default(3000),
    FRONTEND_ORIGIN: z.url().default('http://127.0.0.1:4200'),
    DATABASE_URL: z.string().startsWith('postgresql://'),
    DB_MAX_CONNECTIONS: z.coerce.number().int().positive().optional(),
    JWT_SECRET: z.string().min(32),
    IDENTITY_TOKEN_SECRET: z.string().min(32),
    HMAC_SECRET: z.string().min(32),
    // Consulta de DNI (RENIEC): 'mock' (identidades sintéticas) o 'apiperu' (apiperu.dev, con token).
    IDENTITY_PROVIDER: z.enum(['mock', 'apiperu']).default('mock'),
    APIPERU_TOKEN: z.string().min(8).optional(),
    APIPERU_URL: z.url().optional(),
    /** Ruta al certificado raíz de RDS (global-bundle.pem) para verificar SSL. */
    DB_SSL_CA: z.string().optional(),
    /** Pasarela de pagos (ADR-016): simulada o Izipay. */
    // Archivos privados (ADR-010): 'local' en desarrollo (apps/backend/.dev-storage) o 's3' (bucket privado).
    FILE_STORAGE: z.enum(['local', 's3']).default('local'),
    S3_BUCKET: z.string().min(3).max(63).optional(),
    S3_REGION: z.string().default('us-east-2'),
    PAYMENTS_PROVIDER: z.enum(['mock', 'izipay', 'micuentaweb']).default('mock'),
    // Izipay «micuentaweb» (API REST V4 + formulario Krypton): Back Office > Configuración > Tienda > Claves de API REST.
    MICUENTAWEB_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
    MICUENTAWEB_API_URL: z.url().optional(),
    MICUENTAWEB_SHOP_ID: z.string().optional(),
    MICUENTAWEB_PASSWORD: z.string().optional(),
    MICUENTAWEB_PUBLIC_KEY: z.string().optional(),
    MICUENTAWEB_HMAC_KEY: z.string().optional(),
    IZIPAY_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
    IZIPAY_API_URL: z.url().optional(),
    IZIPAY_MERCHANT_CODE: z.string().optional(),
    IZIPAY_API_KEY: z.string().optional(),
    IZIPAY_HASH_KEY: z.string().optional(),
    IZIPAY_PUBLIC_KEY: z.string().optional(),
    // Yape con Culqi (ADR-019): CulqiPanel > Desarrollo > API Keys. Sin las dos llaves, Yape no se ofrece.
    CULQI_PUBLIC_KEY: z.string().regex(/^pk_(test|live)_/, 'CULQI_PUBLIC_KEY empieza con pk_test_ o pk_live_').optional().or(z.literal('').transform(() => undefined)),
    CULQI_SECRET_KEY: z.string().regex(/^sk_(test|live)_/, 'CULQI_SECRET_KEY empieza con sk_test_ o sk_live_').optional().or(z.literal('').transform(() => undefined)),
    CULQI_API_URL: z.url().optional(),
    /** URL pública de la API para la notificación IPN (https; en local no se envía). */
    PUBLIC_API_URL: z.url().optional(),
    /** Clave para cifrar el segundo factor del personal (ADR-018); si falta se deriva de HMAC_SECRET. */
    STAFF_SECRET_KEY: z.string().min(32).optional(),
    /** Asistente virtual (ADR-017): sin clave funciona en modo básico por reglas. */
    OPENROUTER_API_KEY: z.string().min(10).optional(),
    OPENROUTER_MODEL: z.string().default('anthropic/claude-haiku-5.5'),
    CHAT_DAILY_BUDGET_USD: z.coerce.number().nonnegative().default(1),
    CHAT_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
    EMAIL_PROVIDER: z.enum(['file', 'console', 'ses']).default('file'),
    EMAIL_FROM: z.string().default('Admisión UNSCH (proyecto académico) <no-reply@sia-unsch.local>'),
    // Amazon SES: región de la identidad verificada y, opcional, el conjunto de configuración para eventos de entrega/rebote.
    SES_REGION: z.string().default('us-east-2'),
    SES_CONFIGURATION_SET: z.string().optional(),
    /** ADR-021: cola de eventos en Amazon SQS. Vacía o sin definir: la bandeja de eventos se procesa en el mismo proceso. */
    SQS_QUEUE_URL: z.url().optional().or(z.literal('').transform(() => undefined)),
    APP_FIXED_NOW: z.iso.datetime({ offset: true }).optional(),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
  })
  .refine((e) => e.FILE_STORAGE !== 's3' || e.S3_BUCKET, {
    message: 'FILE_STORAGE=s3 requiere S3_BUCKET (y credenciales de AWS: el rol de la Lambda o AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY en local)',
    path: ['FILE_STORAGE'],
  })
  .refine((e) => e.EMAIL_PROVIDER !== 'ses' || !/\.local>?\s*$/.test(e.EMAIL_FROM), {
    message: 'EMAIL_PROVIDER=ses requiere EMAIL_FROM con una dirección verificada en SES, p. ej. "Admisión UNSCH <tu-correo@dominio>" (y credenciales de AWS con permiso ses:SendEmail)',
    path: ['EMAIL_FROM'],
  })
  .refine((e) => e.IDENTITY_PROVIDER !== 'apiperu' || e.APIPERU_TOKEN, {
    message: 'IDENTITY_PROVIDER=apiperu requiere APIPERU_TOKEN (token de apiperu.dev, sección «Api Tokens»)',
    path: ['IDENTITY_PROVIDER'],
  })
  .refine((e) => e.PAYMENTS_PROVIDER !== 'micuentaweb' || (e.MICUENTAWEB_SHOP_ID && e.MICUENTAWEB_PASSWORD && e.MICUENTAWEB_PUBLIC_KEY && e.MICUENTAWEB_HMAC_KEY), {
    message: 'PAYMENTS_PROVIDER=micuentaweb requiere MICUENTAWEB_SHOP_ID, MICUENTAWEB_PASSWORD, MICUENTAWEB_PUBLIC_KEY y MICUENTAWEB_HMAC_KEY (Back Office > Claves de API REST)',
    path: ['PAYMENTS_PROVIDER'],
  })
  .refine((e) => e.PAYMENTS_PROVIDER !== 'izipay' || (e.IZIPAY_MERCHANT_CODE && e.IZIPAY_API_KEY && e.IZIPAY_HASH_KEY), {
    message: 'PAYMENTS_PROVIDER=izipay requiere IZIPAY_MERCHANT_CODE, IZIPAY_API_KEY e IZIPAY_HASH_KEY (Panel de comercio > Desarrolladores > Claves)',
    path: ['PAYMENTS_PROVIDER'],
  })
  .refine((e) => !(e.APP_ENV === 'demo' && e.APP_FIXED_NOW), {
    message: 'APP_FIXED_NOW está prohibida en el entorno demo (research R-03)',
    path: ['APP_FIXED_NOW'],
  });

export type Env = z.infer<typeof schema> & {
  /** La cookie de sesión exige HTTPS fuera del entorno local. */
  cookieSecure: boolean;
  dbMaxConnections: number;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  // Una variable vacía en .env (p. ej. `PUBLIC_API_URL=`) cuenta como no definida.
  const parsed = schema.safeParse(Object.fromEntries(Object.entries(source).filter(([, v]) => v !== '')));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuración inválida:\n${issues}`);
  }
  const env = parsed.data;
  return {
    ...env,
    cookieSecure: env.APP_ENV === 'demo',
    dbMaxConnections: env.DB_MAX_CONNECTIONS ?? (env.APP_ENV === 'demo' ? 1 : 10),
  };
}
