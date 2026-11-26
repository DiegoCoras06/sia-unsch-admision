/**
 * Genera la documentación OpenAPI 3.1 de toda la API (Sprint 2): `npm run openapi -w @sia/backend`.
 * Vive en apps/backend/swagger/ junto con el contrato (openapi.json) y la configuración de Swagger UI (swagger.ts).
 *
 * 1. Toma tal cual los contratos detallados de specs/<nn>/contracts/openapi.yaml (fuente de verdad del SDD).
 * 2. Lee las rutas reales del código (presentation/*.ts de cada módulo y admin-routes.ts) y documenta las que
 *    no están en esos contratos: módulo, descripción (del comentario que acompaña a la ruta), parámetros,
 *    autenticación, permiso del panel y respuestas comunes.
 * 3. Escribe swagger/openapi.json, que la API sirve en /api/docs (Swagger UI) y /api/openapi.json.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

type Json = Record<string, unknown>;
type Operation = Json & { tags?: string[]; summary?: string };

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(backend, '../..');
const src = path.join(backend, 'src');

const MODULOS: Record<string, string> = {
  convocatorias: 'Convocatorias', configuracion: 'Configuración', inscripciones: 'Inscripciones', pagos: 'Pagos',
  usuarios: 'Usuarios', seguridad: 'Seguridad', expedientes: 'Expedientes', examenes: 'Exámenes',
  resultados: 'Resultados', notificaciones: 'Notificaciones', asistente: 'Asistente', reportes: 'Reportes',
};
const DESCRIPCION_MODULO: Record<string, string> = {
  Sistema: 'Salud de la API y de la base de datos.',
  Convocatorias: 'Convocatoria vigente, etapas, programas, vacantes, tasas, requisitos y temario (portal público y panel).',
  Configuración: 'Contenidos del portal: portada, comunicados, imágenes y funciones por etapa.',
  Inscripciones: 'Inscripción ordinaria, exonerados, CEPRE, reinscripción, ficha, orden de pago y encuesta SUS.',
  Pagos: 'Pago en línea con Culqi (tarjeta y Yape), tesorería, conciliación y anulaciones.',
  Usuarios: 'Cuentas de postulantes, ingreso del personal con doble factor, usuarios y roles.',
  Seguridad: 'Denuncias, contacto, casos de atención, auditoría, inhabilitados y estado del sistema.',
  Expedientes: 'Expediente documental de exonerados y su evaluación.',
  Exámenes: 'Exámenes, sedes, aulas, distribución de postulantes y asistencia.',
  Resultados: 'Calificación, resultados, ingresantes y constancias.',
  Notificaciones: 'Bandeja del postulante, envíos, plantillas y campañas.',
  Asistente: 'Asistente virtual con IA y base de conocimiento.',
  Reportes: 'Indicadores del panel, reportes en Excel y PDF, y encuesta SUS.',
};

/** Rutas del panel (admin-routes.ts) agrupadas por módulo según su prefijo. */
const PANEL: [RegExp, string][] = [
  [/^\/admin\/(calls|catalog)/, 'Convocatorias'],
  [/^\/admin\/(inscriptions|cepre-awardees)/, 'Inscripciones'],
  [/^\/admin\/payments/, 'Pagos'],
  [/^\/admin\/(announcements|content-blocks|site-assets|features|reliability)/, 'Configuración'],
  [/^\/admin\/(knowledge|assistant)/, 'Asistente'],
  [/^\/admin\/(dashboard|reports|usability)/, 'Reportes'],
  [/^\/admin\/(audit|cases|system|disqualified|failures|security|integrations)/, 'Seguridad'],
  [/^\/support\/cases/, 'Seguridad'],
];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const full = path.join(dir, f);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
  });

// ── 1. Contratos detallados del SDD ────────────────────────────────────
const specs = readdirSync(path.join(root, 'specs'))
  .map((d) => path.join(root, 'specs', d, 'contracts', 'openapi.yaml'))
  .filter((f) => { try { return statSync(f).isFile(); } catch { return false; } });

const paths: Record<string, Record<string, Operation>> = {};
const components: Record<string, Json> = { schemas: {}, parameters: {}, responses: {}, securitySchemes: {} };
const fromSpec = new Set<string>();

for (const file of specs) {
  const doc = parseYaml(readFileSync(file, 'utf8')) as { paths?: Record<string, Record<string, Operation>>; components?: Record<string, Json>; info?: { title?: string } };
  const spec = path.relative(root, file).split(path.sep).join('/');
  for (const [p, ops] of Object.entries(doc.paths ?? {})) {
    for (const [method, op] of Object.entries(ops)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
      paths[p] ??= {};
      paths[p][method] = { ...op, description: [op.description, `Contrato detallado: \`${spec}\`.`].filter(Boolean).join('\n\n') };
      fromSpec.add(`${method} ${p}`);
    }
  }
  for (const [kind, items] of Object.entries(doc.components ?? {})) {
    components[kind] ??= {};
    for (const [name, value] of Object.entries(items as Json)) (components[kind] as Json)[name] ??= value;
  }
}

// ── 2. Rutas reales del código ─────────────────────────────────────────
const ROUTE = /(?:router|r|api)\.(get|post|put|patch|delete)\(\s*'([^']+)'([^\n]*)/g;
const files = [...walk(path.join(src, 'modules')).filter((f) => f.includes(`${path.sep}presentation${path.sep}`)), path.join(src, 'admin-routes.ts'), path.join(src, 'app.ts')];

let documentadas = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = path.relative(src, file).split(path.sep).join('/');
  const moduleTag = rel.startsWith('modules/') ? MODULOS[rel.split('/')[1]!] : undefined;
  const matches = [...text.matchAll(ROUTE)];
  matches.forEach((m, i) => {
    const [, method, route, rest] = m as unknown as [string, string, string, string];
    if (rel === 'app.ts' && !route.startsWith('/health')) return;
    const start = m.index!;
    const block = text.slice(start, i + 1 < matches.length ? matches[i + 1]!.index : undefined);
    // Comentario inmediatamente anterior a la ruta (// … o /** … */).
    const before = text.slice(Math.max(0, start - 600), start).split('\n').slice(0, -1);
    const comment: string[] = [];
    for (let k = before.length - 1; k >= 0; k--) {
      const line = before[k]!.trim();
      if (line.startsWith('//')) comment.unshift(line.replace(/^\/\/\s?/, ''));
      else if (line.startsWith('*') || line.startsWith('/**')) comment.unshift(line.replace(/^\/?\*+\/?\s?/, '').replace(/\*\/$/, ''));
      else break;
    }
    const oas = route.replace(/:([A-Za-z]+)/g, '{$1}').replace(/\.(\{type\}|\{format\})$/, '.$1');
    const tag = moduleTag && !route.startsWith('/admin') ? moduleTag : PANEL.find(([re]) => re.test(route))?.[1] ?? moduleTag ?? (route.startsWith('/health') ? 'Sistema' : 'Seguridad');
    if (fromSpec.has(`${method} ${oas}`)) {
      paths[oas]![method]!.tags = [tag]; // un grupo por módulo en Swagger
      return;
    }
    const perm = /g\('([a-z._]+)'\)/.exec(rest)?.[1] ?? /guard\('([a-z._]+)'\)/.exec(rest)?.[1];
    const needsStaff = route.startsWith('/admin') && !route.startsWith('/admin/auth');
    const needsAccount = /^\/me(\/|$)/.test(route) || route === '/auth/logout' || route === '/auth/logout-all';
    const params = [...oas.matchAll(/\{([A-Za-z]+)\}/g)].map(([, name]) => ({ name, in: 'path', required: true, schema: { type: 'string' } }));
    const binary = /\.(pdf|xlsx)$|\{(type|format)\}$/.test(route);
    const created = /res\.status\(201\)/.test(block);
    const summary = (comment.join(' ').trim() || `${method.toUpperCase()} ${route}`).replace(/\s+/g, ' ');
    const op: Operation = {
      tags: [tag],
      summary: summary.length > 140 ? `${summary.slice(0, 137)}…` : summary,
      ...(comment.length ? { description: comment.join(' ') } : {}),
      ...(params.length ? { parameters: params } : {}),
      ...(/req\.query/.test(block) ? { 'x-query': 'Recibe parámetros por query string (ver el esquema de validación del código).' } : {}),
      ...(/req\.body/.test(block) && method !== 'get'
        ? { requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', description: 'Cuerpo validado con Zod en el servidor; ver el código de la ruta.' } } } } }
        : {}),
      ...(needsStaff || needsAccount ? { security: [{ bearerAuth: [] }] } : {}),
      ...(perm ? { 'x-permiso': perm } : {}),
      responses: {
        [created ? '201' : '200']: binary
          ? { description: 'Archivo', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } }
          : { description: 'Correcto', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' } } } },
        ...(/req\.(body|query|params)/.test(block) ? { '400': { $ref: '#/components/responses/ErrorGeneral' } } : {}),
        ...(needsStaff || needsAccount ? { '401': { $ref: '#/components/responses/ErrorGeneral' } } : {}),
        ...(perm ? { '403': { $ref: '#/components/responses/ErrorGeneral' } } : {}),
        '503': { $ref: '#/components/responses/ErrorGeneral' },
      },
    };
    paths[oas] ??= {};
    paths[oas][method] = op;
    documentadas++;
  });
}

// Las operaciones críticas pueden repetirse de forma segura tras un corte de red.
for (const route of ['/inscriptions', '/payments/session', '/payments/charge']) {
  const operation = paths[route]?.post;
  if (!operation) continue;
  const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];
  operation.parameters = [...parameters, { $ref: '#/components/parameters/IdempotencyKey' }];
  operation.description = [
    operation.description,
    'Admite `Idempotency-Key`: al repetir la misma solicitud devuelve la respuesta almacenada y evita efectos duplicados.',
  ].filter(Boolean).join('\n\n');
  const responses = operation.responses as Json | undefined;
  if (responses) responses['409'] ??= { $ref: '#/components/responses/ErrorGeneral' };
}

(components.schemas as Json).Envelope ??= {
  type: 'object', description: 'Sobre de las respuestas correctas.', properties: { data: { description: 'Resultado de la operación' }, meta: { type: 'object' } },
};
(components.schemas as Json).ErrorEnvelope ??= {
  type: 'object', properties: { error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' }, requestId: { type: 'string' }, details: { type: 'array', items: { type: 'object' } } } } },
};
(components.responses as Json).ErrorGeneral ??= {
  description: 'Error con código y mensaje en español (400 datos inválidos, 401 sin sesión, 403 sin permiso, 404 no existe, 409 conflicto, 429 demasiados intentos, 503 base de datos no disponible).',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
};
(components.parameters as Json).IdempotencyKey ??= {
  name: 'Idempotency-Key',
  in: 'header',
  required: false,
  description: 'Clave única de 8 a 100 caracteres. Debe conservarse al reintentar exactamente la misma operación durante 24 horas.',
  schema: { type: 'string', minLength: 8, maxLength: 100, pattern: '^[A-Za-z0-9._:-]+$' },
};
(components.securitySchemes as Json).bearerAuth ??= { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' };

const ordenadas = Object.fromEntries(Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)));
const usados = new Set(Object.values(ordenadas).flatMap((ops) => Object.values(ops).flatMap((o) => o.tags ?? [])));
const doc = {
  openapi: '3.1.0',
  info: {
    title: 'SIA-UNSCH: API del Sistema Integral de Admisión',
    version: '2027.1.0',
    description:
      'API REST del Concurso de Admisión 2027-I de la UNSCH (monolito modular, 12 módulos). Respuestas con el sobre `{ data }` o `{ error }`. ' +
      'Las rutas del panel necesitan el token del personal (`Authorization: Bearer …`), que se obtiene con `/admin/auth/login` y `/admin/auth/mfa`. ' +
      'Las rutas con contrato detallado provienen de `specs/<nn>/contracts/openapi.yaml`; las demás se generan del código con `npm run openapi`.',
  },
  servers: [{ url: '/api/v1', description: 'Esta API' }],
  tags: Object.keys(DESCRIPCION_MODULO).filter((t) => usados.has(t)).map((name) => ({ name, description: DESCRIPCION_MODULO[name] })),
  paths: ordenadas,
  components,
};

const out = path.join(backend, 'swagger', 'openapi.json');
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
const ops = Object.values(ordenadas).reduce((n, o) => n + Object.keys(o).length, 0);
console.log(`openapi.json: ${ops} operaciones en ${Object.keys(ordenadas).length} rutas (${fromSpec.size} de contratos detallados, ${documentadas} generadas del código).`);
