/**
 * Swagger UI de la API (Sprint 2).
 *
 * - `/api/docs`: la página interactiva para ver y probar cada operación (botón «Authorize» para el token del panel).
 * - `/api/openapi.json`: el contrato OpenAPI 3.1 completo, para importarlo en Postman u otras herramientas.
 *
 * El contrato (`openapi.json`, en esta misma carpeta) se regenera con `npm run openapi -w @sia/backend`.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const contrato = path.join(path.dirname(fileURLToPath(import.meta.url)), 'openapi.json');

export function montarSwagger(app: Express): void {
  if (!existsSync(contrato)) return;
  const openapi = JSON.parse(readFileSync(contrato, 'utf8')) as Record<string, unknown>;
  app.get('/api/openapi.json', (_req, res) => {
    res.json(openapi);
  });
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openapi, {
      customSiteTitle: 'SIA-UNSCH: documentación de la API',
      swaggerOptions: { docExpansion: 'none', filter: true, persistAuthorization: true, tagsSorter: 'alpha' },
    }),
  );
}
