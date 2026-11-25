// API pública del módulo M14 Configuración (contenido del portal).
import type { Clock } from '../../shared/clock/clock.js';
import type { Db } from '../../shared/db/prisma.js';
import type { ConvocatoriasQueries } from '../convocatorias/index.js';
import { ConfiguracionQueries } from './application/configuracion-queries.js';
import type { AuditLog } from '../../shared/audit/audit.js';
import type { Outbox } from '../../shared/events/outbox.js';
import { ContentAdmin } from './application/content-admin.js';
import { SiteAssets } from './application/site-assets.js';
import type { FileStorage } from '../../shared/storage/file-storage.js';
import { configuracionRoutes } from './presentation/routes.js';
import { MemoryCache, invalidatesOnUse } from '../../shared/cache/memory-cache.js';

export function createConfiguracionModule(db: Db, convocatorias: ConvocatoriasQueries, clock: Clock, audit: AuditLog, outbox: Outbox, storage: FileStorage, cacheTtlMs = 60_000) {
  // AC01: comunicados, portada e imágenes del portal en memoria; se renuevan cada minuto sin hacer esperar a nadie.
  const cache = new MemoryCache(cacheTtlMs);
  const queries = new ConfiguracionQueries(db, convocatorias, clock, cache);
  const assets = new SiteAssets({ persistence: db, clock, audit, storage, cache });
  /** Carga de antemano lo que pide la portada, para que ningún visitante espere la primera consulta. */
  const warmUp = async () => {
    if (cacheTtlMs <= 0) return;
    await Promise.all([queries.home(), queries.listAnnouncements({ page: 1 }), assets.publicMap()]);
  };
  const invalidate = () => {
    cache.invalidate();
    void warmUp().catch(() => undefined);
  };
  /** Gestión desde el panel (spec 008, Historias 6 y 8); cada cambio borra la caché de contenidos. */
  const admin = invalidatesOnUse(new ContentAdmin({ persistence: db, clock, audit, outbox }), invalidate);
  /** RF-14.01: imágenes del portal reemplazables desde el panel (el portal usa `assets`, el panel la versión que invalida). */
  const assetsAdmin = invalidatesOnUse(assets, invalidate);
  return { queries, admin, assets: assetsAdmin, warmUp, router: configuracionRoutes(queries, assets) };
}

export type { ContentAdmin } from './application/content-admin.js';
export type { SiteAssets } from './application/site-assets.js';
