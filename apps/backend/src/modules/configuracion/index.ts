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

export function createConfiguracionModule(db: Db, convocatorias: ConvocatoriasQueries, clock: Clock, audit: AuditLog, outbox: Outbox, storage: FileStorage) {
  const queries = new ConfiguracionQueries(db, convocatorias, clock);
  /** Gestión desde el panel (spec 008, Historias 6 y 8). */
  const admin = new ContentAdmin({ db, clock, audit, outbox });
  /** RF-14.01: imágenes del portal reemplazables desde el panel. */
  const assets = new SiteAssets({ db, clock, audit, storage });
  return { queries, admin, assets, router: configuracionRoutes(queries, assets) };
}

export type { ContentAdmin } from './application/content-admin.js';
export type { SiteAssets } from './application/site-assets.js';
