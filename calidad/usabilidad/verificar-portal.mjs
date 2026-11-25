// T082 / AC07: valida desbordamiento responsive y WCAG 2.2 AA en las rutas publicas.
// Requiere que el portal este en ejecucion. Uso: node calidad/usabilidad/verificar-portal.mjs
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const base = (process.env.BASE_URL ?? 'http://127.0.0.1:4200').replace(/\/$/, '');
const routes = [
  '/', '/cronograma', '/programas', '/programas/P34', '/tasas', '/requisitos', '/temario', '/comunicados',
  '/pasos', '/denuncias', '/observados', '/carta-aval', '/contacto', '/documentos/reglamento', '/inscripcion',
  '/mi-inscripcion', '/buscar-aula', '/resultados', '/reinscripcion', '/crear-cuenta', '/ingresar', '/admin/ingreso',
];
const viewports = [
  { name: 'movil', width: 360, height: 800 },
  { name: 'escritorio', width: 1440, height: 900 },
];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const rows = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    for (const route of routes) {
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.locator('app-root').waitFor({ state: 'visible' });
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
      await page.addScriptTag({ path: axePath });
      const axe = await page.evaluate(async () =>
        globalThis.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        }),
      );
      rows.push({
        route,
        viewport: viewport.name,
        status: response?.status() ?? 0,
        overflow,
        violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
        pageErrors,
      });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const failures = rows.filter((r) => r.status >= 400 || r.overflow > 1 || r.violations.length || r.pageErrors.length);
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const output = path.resolve(`calidad/resultados/${date}-accesibilidad-responsive.md`);
const table = rows
  .map((r) => `| ${r.route} | ${r.viewport} | ${r.status} | ${Math.max(0, r.overflow)} px | ${r.violations.length} | ${r.pageErrors.length} |`)
  .join('\n');
await writeFile(
  output,
  `# Accesibilidad y responsive: ${date}\n\n` +
    `Base: ${base}\n\nRutas: ${routes.length}; combinaciones ruta/viewport: ${rows.length}.\n\n` +
    `| Ruta | Vista | HTTP | Desborde | Violaciones axe | Errores JS |\n|---|---|---:|---:|---:|---:|\n${table}\n\n` +
    `Resultado: **${failures.length ? `NO CUMPLE (${failures.length} combinaciones)` : 'CUMPLE'}**.\n`,
  'utf8',
);

console.log(`T082: ${rows.length} verificaciones; ${failures.length} con problemas. Evidencia: ${output}`);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
