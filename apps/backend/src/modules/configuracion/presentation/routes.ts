import { Router } from 'express';
import { z } from 'zod';
import { handle, publicCache } from '../../../shared/http/middleware.js';
import { parse } from '../../../shared/http/validate.js';
import type { ConfiguracionQueries } from '../application/configuracion-queries.js';
import type { SiteAssets } from '../application/site-assets.js';

const announcementsQuery = z.object({
  callCode: z.string().max(10).optional(),
  type: z.enum(['COMUNICADO', 'FE_ERRATAS', 'RESULTADO']).optional(),
  section: z.string().max(30).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export function configuracionRoutes(queries: ConfiguracionQueries, assets: SiteAssets): Router {
  const router = Router();

  router.get('/announcements', publicCache(300), handle(async (req, res) => {
    res.json(await queries.listAnnouncements(parse(announcementsQuery, req.query)));
  }));

  router.get('/content/home', publicCache(300), handle(async (_req, res) => {
    res.json({ data: await queries.home() });
  }));

  router.get('/site-assets', publicCache(60), handle(async (_req, res) => {
    res.json({ data: await assets.publicMap() });
  }));
  router.get('/site-assets/:key', handle(async (req, res) => {
    const { key } = parse(z.object({ key: z.string().max(40) }), req.params);
    const f = await assets.file(key);
    // Con S3, redirección a un enlace temporal (la imagen no pasa por la Lambda).
    if ('url' in f) {
      res.set('Cache-Control', 'public, max-age=60').redirect(302, f.url);
      return;
    }
    // La URL lleva la versión (?v=), así que el archivo puede guardarse en caché.
    res.set('Cache-Control', 'public, max-age=31536000, immutable').type(f.mimeType).send(f.content);
  }));

  return router;
}
