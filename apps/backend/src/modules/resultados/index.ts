// API pública del módulo M09 Resultados (spec 007).
import type { RequestHandler } from 'express';
import type { AuditLog } from '../../shared/audit/audit.js';
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter.js';
import type { FileStorage } from '../../shared/storage/file-storage.js';
import type { ConvocatoriasQueries } from '../convocatorias/index.js';
import { ResultsService, type ResultsPorts } from './application/results-service.js';
import { resultadosRoutes } from './presentation/routes.js';

type Column = { key: string; header: string; width: number };

export function createResultadosModule(deps: {
  db: Db;
  clock: Clock;
  audit: AuditLog;
  limiter: RateLimiter;
  storage: FileStorage;
  convocatorias: ConvocatoriasQueries;
  ports: ResultsPorts;
  authenticate: RequestHandler;
  guard: (permission: 'resultados.gestionar' | 'resultados.aprobar' | 'ingreso.registrar') => RequestHandler;
  toExcel: (title: string, filters: string, columns: Column[], rows: Record<string, unknown>[]) => Promise<Buffer>;
  toPdf: (title: string, filters: string, columns: Column[], rows: Record<string, unknown>[]) => Promise<Buffer>;
  secret: string;
  frontendOrigin: string;
}) {
  const service = new ResultsService(deps);
  return { service, router: resultadosRoutes(service, deps) };
}

export type { ResultsService } from './application/results-service.js';
