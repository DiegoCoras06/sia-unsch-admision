// API pública del módulo M01 Convocatorias. Otros módulos solo importan desde aquí (ADR-002).
import { VacancyImport } from './application/vacancy-import.js';
import { invalidatesOnUse } from '../../shared/cache/memory-cache.js';
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import { ConvocatoriasQueries } from './application/convocatorias-queries.js';
import type { AuditLog } from '../../shared/audit/audit.js';
import { CallAdmin } from './application/call-admin.js';
import { CatalogAdmin } from './application/catalog-admin.js';
import type { EnrollmentStatsProvider } from './domain/ports.js';
import { PrismaConvocatoriasRepository, pendingEnrollmentStats } from './infrastructure/prisma-convocatorias-repository.js';
import { CachedConvocatoriasRepository } from './infrastructure/cached-convocatorias-repository.js';
import { convocatoriasRoutes } from './presentation/routes.js';

export type { Stage, StageStatus } from './domain/stage.js';
export { stageStatus } from './domain/stage.js';
export type { ConvocatoriasQueries } from './application/convocatorias-queries.js';

export function createConvocatoriasModule(db: Db, clock: Clock, audit: AuditLog, stats: EnrollmentStatsProvider = pendingEnrollmentStats, cacheTtlMs = 5 * 60_000) {
  // AC01: el catálogo se lee una vez y se guarda en memoria (ver CachedConvocatoriasRepository).
  const repo = new CachedConvocatoriasRepository(new PrismaConvocatoriasRepository(db), cacheTtlMs);
  const queries = new ConvocatoriasQueries(repo, stats, clock);
  /** Carga de antemano lo que piden casi todas las pantallas, para que ningún visitante espere la primera consulta. */
  const warmUp = async () => {
    if (cacheTtlMs <= 0) return;
    const { code } = await queries.getCurrentCall();
    await Promise.all([
      queries.searchOptions(code, {}), queries.listSubmodalities(code), queries.listQuotaCategories(code), queries.listFees(code),
      queries.listAreas(code), queries.listRequirements(code), queries.getSyllabus(code), queries.listDocuments(code),
    ]);
  };
  const invalidate = () => {
    repo.invalidate();
    void warmUp().catch(() => undefined);
  };
  /** Gestión desde el panel (spec 008, Historia 1); cada cambio borra la caché del catálogo. */
  const admin = invalidatesOnUse(new CallAdmin({ db, clock, audit }), invalidate);
  const catalog = invalidatesOnUse(new CatalogAdmin({ db, audit }), invalidate);
  const vacancyImport = invalidatesOnUse(new VacancyImport({ db, audit }), invalidate);
  return { queries, admin, catalog, vacancyImport, warmUp, router: convocatoriasRoutes(queries) };
}

export type { CallAdmin } from './application/call-admin.js';
export type { CatalogAdmin } from './application/catalog-admin.js';
export type { VacancyImport } from './application/vacancy-import.js';
