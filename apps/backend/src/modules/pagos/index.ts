// API pública del módulo M04 Pagos (spec 005, ADR-024).
import type { Logger } from 'pino';
import type { AuditLog } from '../../shared/audit/audit.js';
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import type { Outbox } from '../../shared/events/outbox.js';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter.js';
import type { PaymentContext } from '../inscripciones/index.js';
import { PaymentService } from './application/payment-service.js';
import { PrismaPaymentRepository } from './infrastructure/prisma-payment-repository.js';
import type { PaymentGateway } from './domain/ports.js';
import { CulqiGateway, type CulqiConfig } from './infrastructure/culqi-gateway.js';
import { MockPaymentGateway } from './infrastructure/mock-gateway.js';
import { pagosRoutes } from './presentation/routes.js';
import { TreasuryService } from './application/treasury-service.js';
import { treasuryRoutes } from './presentation/treasury-routes.js';
import type { RequestHandler } from 'express';

/** Elige el adaptador de la pasarela; solo app.ts lo llama (ADR-007). Culqi cobra tarjeta y Yape (ADR-024). */
export function createPaymentGateway(cfg: { provider: 'mock' | 'culqi'; culqi: Partial<CulqiConfig> }): PaymentGateway {
  if (cfg.provider === 'mock') return new MockPaymentGateway();
  const { publicKey, secretKey } = cfg.culqi;
  if (!publicKey || !secretKey) throw new Error('Faltan las llaves de Culqi');
  return new CulqiGateway({ ...cfg.culqi, publicKey, secretKey });
}

export function createPagosModule(deps: {
  db: Db;
  clock: Clock;
  outbox: Outbox;
  audit: AuditLog;
  limiter: RateLimiter;
  logger: Logger;
  gateway: PaymentGateway;
  inscriptions: { paymentContext(documentNumber: string, applicantCode: string): Promise<PaymentContext> };
}) {
  const service = new PaymentService({ ...deps, repo: new PrismaPaymentRepository(deps.db) });

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

export type { PaymentGateway } from './domain/ports.js';
