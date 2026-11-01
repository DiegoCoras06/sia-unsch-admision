// API pública del módulo M05 Pagos (spec 005, ADR-016).
import type { Logger } from 'pino';
import type { AuditLog } from '../../shared/audit/audit.js';
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import type { Outbox } from '../../shared/events/outbox.js';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter.js';
import type { PaymentContext } from '../inscripciones/index.js';
import { PaymentService } from './application/payment-service.js';
import type { PaymentGateway, YapeGateway } from './domain/ports.js';
import { CulqiYapeGateway, type CulqiConfig } from './infrastructure/culqi-gateway.js';
import { IzipayPaymentGateway, type IzipayConfig } from './infrastructure/izipay-gateway.js';
import { MiCuentaWebGateway, type MiCuentaWebConfig } from './infrastructure/micuentaweb-gateway.js';
import { MockPaymentGateway } from './infrastructure/mock-gateway.js';
import { pagosRoutes } from './presentation/routes.js';
import { TreasuryService } from './application/treasury-service.js';
import { treasuryRoutes } from './presentation/treasury-routes.js';
import type { RequestHandler } from 'express';

/** Elige el adaptador de la pasarela; solo app.ts lo llama (ADR-007). */
export function createPaymentGateway(cfg: { provider: 'mock' | 'izipay' | 'micuentaweb'; mockHashKey: string; izipay: Partial<IzipayConfig>; micuentaweb?: Partial<MiCuentaWebConfig> }): PaymentGateway {
  if (cfg.provider === 'mock') return new MockPaymentGateway(cfg.mockHashKey);
  if (cfg.provider === 'micuentaweb') {
    const { shopId, password, publicKey, hmacKey } = cfg.micuentaweb ?? {};
    if (!shopId || !password || !publicKey || !hmacKey) throw new Error('Faltan credenciales de micuentaweb');
    return new MiCuentaWebGateway({ ...cfg.micuentaweb, environment: cfg.micuentaweb?.environment ?? 'sandbox', shopId, password, publicKey, hmacKey });
  }
  const { merchantCode, apiKey, hashKey } = cfg.izipay;
  if (!merchantCode || !apiKey || !hashKey) throw new Error('Faltan credenciales de Izipay');
  return new IzipayPaymentGateway({ ...cfg.izipay, environment: cfg.izipay.environment ?? 'sandbox', merchantCode, apiKey, hashKey });
}

/** Yape con Culqi (ADR-019): solo si están las dos llaves; si no, Yape no se ofrece. */
export function createYapeGateway(cfg: Partial<CulqiConfig>): YapeGateway | null {
  const { publicKey, secretKey } = cfg;
  if (!publicKey || !secretKey) return null;
  return new CulqiYapeGateway({ ...cfg, publicKey, secretKey });
}

export function createPagosModule(deps: {
  db: Db;
  clock: Clock;
  outbox: Outbox;
  audit: AuditLog;
  limiter: RateLimiter;
  logger: Logger;
  gateway: PaymentGateway;
  yape?: YapeGateway | null;
  inscriptions: { paymentContext(documentNumber: string, applicantCode: string): Promise<PaymentContext> };
}) {
  const service = new PaymentService(deps);

  // Pago duplicado: queda registrado; Tesorería lo trata como anulación por cobro duplicado (RF-05.12).
  deps.outbox.subscribe('PagoDuplicado', async (e) => {
    deps.logger.warn({ applicantCode: e.applicantCode, transactionId: e.transactionId }, 'pago duplicado: Tesorería debe registrar la anulación');
  });

  return { service, router: pagosRoutes(service) };
}

/** Tesorería: conciliación y anulaciones (spec 005, Historias 4 y 5); app.ts lo monta con la seguridad ya creada. */
export function createTesoreria(deps: { db: Db; audit: AuditLog; authenticate: RequestHandler; guard: (p: 'pagos.conciliar' | 'pagos.anular') => RequestHandler }) {
  const service = new TreasuryService(deps);
  return { service, router: treasuryRoutes(service, deps) };
}

export type { PaymentGateway, YapeGateway } from './domain/ports.js';
