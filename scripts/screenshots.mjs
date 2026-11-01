// Capturas de página completa a 1440, 768 y 390 px con Microsoft Edge (playwright-core, sin descargar navegadores).
// Uso: node scripts/screenshots.mjs <carpeta-salida> <ruta1> [ruta2 ...]   (ej.: / /programas /tasas)
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [out = '.screens', ...routes] = process.argv.slice(2);
const base = process.env.BASE_URL ?? 'http://127.0.0.1:4200';
const widths = (process.env.WIDTHS ?? '1440,768,390').split(',').map(Number);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = [];
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (const route of routes.length ? routes : ['/']) {
    // El dev server mantiene una conexión de recarga en caliente: no se puede esperar "networkidle".
    await page.goto(base + route, { waitUntil: 'load' });
    await page.waitForSelector('h1', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    // Muestra todo el contenido con entrada animada antes de capturar.
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in')));
    // Recorre la página para que carguen las imágenes con loading="lazy" y vuelve arriba.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      window.scrollTo(0, 0);
    });
    await page.evaluate(() => Promise.race([
      Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))),
      new Promise((r) => setTimeout(r, 6000)),
    ]));
    await page.waitForTimeout(900);
    const metrics = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const lh = h1 ? parseFloat(getComputedStyle(h1).lineHeight) : 0;
      const headings = [...document.querySelectorAll('h1, h2, h3')].map((h) => {
        const l = parseFloat(getComputedStyle(h).lineHeight) || 1;
        return { text: h.textContent.trim().slice(0, 40), lines: Math.round(h.getBoundingClientRect().height / l) };
      }).filter((h) => h.lines > 2);
      return {
        h1Lines: h1 && lh ? Math.round(h1.getBoundingClientRect().height / lh) : null,
        overflowX: document.documentElement.scrollWidth > window.innerWidth,
        tallHeadings: headings,
      };
    });
    const name = `${(route.replace(/\//g, '_') || '_').replace(/^_$/, 'inicio').replace(/^_/, '')}-${width}.png`;
    await page.screenshot({ path: path.join(out, name), fullPage: process.env.FULLPAGE !== '0' });
    report.push({ route, width, ...metrics, errors: errors.splice(0) });
  }
  await page.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
