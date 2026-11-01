// API pública del módulo M10 Asistente virtual (spec 009, ADR-017).
import type { Logger } from 'pino';
import type { AuditLog } from '../../shared/audit/audit.js';
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter.js';
import type { ConvocatoriasQueries } from '../convocatorias/index.js';
import { AssistantService } from './application/assistant-service.js';
import { AssistantTools, type ToolDeps } from './application/tools.js';
import { KnowledgeAdmin } from './application/knowledge-admin.js';
import type { LlmProvider } from './domain/ports.js';
import { OpenRouterProvider } from './infrastructure/openrouter-provider.js';
import { RuleBasedProvider } from './infrastructure/rule-based-provider.js';
import { asistenteRoutes } from './presentation/routes.js';

export function createAsistenteModule(deps: {
  db: Db;
  clock: Clock;
  limiter: RateLimiter;
  audit: AuditLog;
  logger: Logger;
  convocatorias: ConvocatoriasQueries;
  inscriptions: ToolDeps['inscriptions'] & { paymentContext(documentNumber: string, applicantCode: string): Promise<{ applicantCode: string; firstNames: string }> };
  payments: ToolDeps['payments'];
  progress?: ToolDeps['progress'];
  support: { createCase(input: { name: string; email: string; message: string }, ipHash: string): Promise<string> };
  openRouter: { apiKey?: string | undefined; model: string; referer: string };
  /** Solo pruebas: reemplaza a OpenRouter por un proveedor guionado. */
  aiOverride?: LlmProvider | null;
  passSecret: string;
  dailyBudgetUsd: number;
  retentionDays: () => Promise<number>;
}) {
  const tools = new AssistantTools({ db: deps.db, convocatorias: deps.convocatorias, inscriptions: deps.inscriptions, payments: deps.payments, ...(deps.progress ? { progress: deps.progress } : {}) });
  const ai = deps.aiOverride !== undefined
    ? deps.aiOverride
    : deps.openRouter.apiKey
      ? new OpenRouterProvider({ apiKey: deps.openRouter.apiKey, model: deps.openRouter.model, referer: deps.openRouter.referer })
      : null;
  const service = new AssistantService({
    db: deps.db, clock: deps.clock, limiter: deps.limiter, audit: deps.audit, logger: deps.logger,
    tools, ai, basic: new RuleBasedProvider(),
    passSecret: deps.passSecret, dailyBudgetUsd: deps.dailyBudgetUsd, retentionDays: deps.retentionDays,
    inscriptions: deps.inscriptions, support: deps.support,
  });
  const knowledge = new KnowledgeAdmin({ db: deps.db, audit: deps.audit });
  return { service, knowledge, router: asistenteRoutes(service) };
}

export type { KnowledgeAdmin } from './application/knowledge-admin.js';
export type { AssistantService } from './application/assistant-service.js';

export type { LlmProvider, LlmResponse, LlmMessage } from './domain/ports.js';
