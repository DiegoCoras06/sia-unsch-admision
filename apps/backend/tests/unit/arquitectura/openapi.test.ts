import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// La documentación OpenAPI (swagger/openapi.json) debe cubrir todas las rutas reales de la API.
// Si falla, corre `npm run openapi -w @sia/backend` y vuelve a confirmar el archivo.
const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const src = path.join(backend, 'src');
const doc = JSON.parse(readFileSync(path.join(backend, 'swagger', 'openapi.json'), 'utf8')) as {
  openapi: string;
  tags: { name: string }[];
  paths: Record<string, Record<string, { tags?: string[]; responses?: object }>>;
};

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const full = path.join(dir, f);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
  });

describe('Documentación OpenAPI (Sprint 2)', () => {
  it('es OpenAPI 3.1 y agrupa las operaciones por los 12 módulos', () => {
    expect(doc.openapi).toBe('3.1.0');
    const tags = doc.tags.map((t) => t.name);
    for (const m of ['Convocatorias', 'Configuración', 'Inscripciones', 'Pagos', 'Usuarios', 'Seguridad', 'Expedientes', 'Exámenes', 'Resultados', 'Notificaciones', 'Asistente', 'Reportes']) {
      expect(tags).toContain(m);
    }
    for (const ops of Object.values(doc.paths)) {
      for (const op of Object.values(ops)) {
        expect(op.tags?.length).toBe(1);
        expect(tags).toContain(op.tags![0]);
        expect(op.responses).toBeDefined();
      }
    }
  });

  it('documenta cada ruta declarada en el código', () => {
    const files = [...walk(path.join(src, 'modules')).filter((f) => f.includes(`${path.sep}presentation${path.sep}`)), path.join(src, 'admin-routes.ts')];
    const faltan: string[] = [];
    for (const file of files) {
      for (const [, method, route] of readFileSync(file, 'utf8').matchAll(/(?:router|r|api)\.(get|post|put|patch|delete)\(\s*'([^']+)'/g)) {
        const oas = route!.replace(/:([A-Za-z]+)/g, '{$1}');
        if (!doc.paths[oas]?.[method!]) faltan.push(`${method!.toUpperCase()} ${route}`);
      }
    }
    expect(faltan).toEqual([]);
  });
});
