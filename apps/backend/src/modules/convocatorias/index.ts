// API pública del módulo M01 Convocatorias. Otros módulos solo importan desde aquí (ADR-002).
import { VacancyImport } from './application/vacancy-import.js';
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import { ConvocatoriasQueries } from './application/convocatorias-queries.js';
import type { AuditLog } from '../../shared/audit/audit.js';
import { CallAdmin } from './application/call-admin.js';
import { CatalogAdmin } from './application/catalog-admin.js';
import type { EnrollmentStatsProvider } from './domain/ports.js';
import { PrismaConvocatoriasRepository, pendingEnrollmentStats } from './infrastructure/prisma-convocatorias-repository.js';
import { convocatoriasRoutes } from './presentation/routes.js';

export type { Stage, StageStatus } from './domain/stage.js';
export { stageStatus } from './domain/stage.js';
export type { ConvocatoriasQueries } from './application/convocatorias-queries.js';

export function createConvocatoriasModule(db: Db, clock: Clock, audit: AuditLog, stats: EnrollmentStatsProvider = pendingEnrollmentStats) {
  const queries = new ConvocatoriasQueries(new PrismaConvocatoriasRepository(db), stats, clock);
  /** Gestión desde el panel (spec 008, Historia 1). */
  const admin = new CallAdmin({ db, clock, audit });
  const catalog = new CatalogAdmin({ db, audit });
  const vacancyImport = new VacancyImport({ db, audit });
  return { queries, admin, catalog, vacancyImport, router: convocatoriasRoutes(queries) };
}

export type { CallAdmin } from './application/call-admin.js';
export type { CatalogAdmin } from './application/catalog-admin.js';
export type { VacancyImport } from './application/vacancy-import.js';
