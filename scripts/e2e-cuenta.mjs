// E2E de la cuenta opcional (spec 002, enmienda de ADR-015) por la interfaz, contra la base LOCAL:
// crear cuenta con DNI + dígito verificador → código del correo (de .dev-mail) → ingresar → «Mi cuenta» muestra la
// inscripción del mismo DNI con su ficha → editar el celular.
// Uso: node scripts/e2e-cuenta.mjs [DNI de una inscripción local pagada] [carpeta-capturas]
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [dni = '99900028', out = '.screens/cuenta'] = process.argv.slice(2);
const base = process.env.BASE_URL ?? 'http://127.0.0.1:4200';
const mailDir = 'apps/backend/.dev-mail';
mkdirSync(out, { recursive: true });
const step = (m) => console.log(`✔ ${m}`);
const checkDigit = (d) => String((11 - ([...d].reduce((a, x, i) => a + Number(x) * [3, 2, 7, 6, 5, 4, 3, 2][i], 0) % 11)) % 10);
const email = `cuenta.${dni}.${Date.now() % 100000}@example.com`;
const PASSWORD = 'Huamanga-Cuenta-2027';

async function codeFor(address, since) {
  for (let i = 0; i < 40; i++) {
    const files = readdirSync(mailDir).filter((f) => f.includes('codigo')).map((f) => path.join(mailDir, f)).sort();
    for (const f of files.reverse()) {
      const html = readFileSync(f, 'utf8');
      if (html.includes(address) && Number(f.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/)?.[1].replace(/\D/g, '') ?? 0) >= since) {
        const m = /(\d{6})/.exec(html.replace(/<[^>]+>/g, ' ').split('código').slice(1).join(' ')) ?? /\b(\d{6})\b/.exec(html);
        if (m) return m[1];
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('No llegó el código al buzón local');
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/crear-cuenta`, { waitUntil: 'load' });
  await page.fill('#ca-dni', dni);
  await page.fill('#ca-dv', checkDigit(dni));
  await page.click('button:has-text("Verificar mi identidad")');
  await page.locator('.acc__names').waitFor({ timeout: 20000 });
  step(`DNI ${dni} verificado: ${(await page.locator('.acc__names').innerText()).trim()}`);
  const since = Number(new Date().toISOString().slice(0, 19).replace(/\D/g, ''));
  await page.fill('#ca-mail', email);
  await page.fill('#ca-cel', '966111222');
  await page.fill('#ca-pass', PASSWORD);
  await page.check('input[name=ok]');
  // El botón se habilita tras marcar el consentimiento.
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent?.includes('Crear cuenta') && !b.disabled));
  await page.click('button:has-text("Crear cuenta")');
  await page.locator('#ca-code').waitFor({ timeout: 20000 });
  await page.fill('#ca-code', await codeFor(email, since - 5));
  await page.click('button:has-text("Confirmar")');
  await page.locator('.acc__ok', { hasText: 'Tu cuenta está activa' }).waitFor({ timeout: 20000 });
  step('Cuenta creada y correo confirmado con el código');

  await page.goto(`${base}/ingresar`, { waitUntil: 'load' });
  await page.fill('#lo-id', dni);
  await page.fill('#lo-pass', PASSWORD);
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL(/\/mi-cuenta$/, { timeout: 20000 });
  await page.locator('app-inscription-receipt').first().waitFor({ timeout: 20000 });
  step(`«Mi cuenta» muestra ${await page.locator('app-inscription-receipt').count()} inscripción(es) del mismo DNI`);
  if (await page.locator('button:has-text("Descargar ficha (PDF)")').count()) step('La ficha se puede descargar desde la cuenta');
  await page.screenshot({ path: `${out}/mi-cuenta.png`, fullPage: true });

  await page.fill('#ma-cel', '955333444');
  await page.click('button:has-text("Guardar cambios")');
  await page.locator('.acc__ok', { hasText: 'Datos actualizados' }).waitFor({ timeout: 20000 });
  step('Celular actualizado desde «Mi cuenta»');

  if (errors.length) throw new Error(`Errores en la página: ${errors.join(' | ')}`);
  console.log('E2E cuenta: OK');
} catch (error) {
  console.error(`E2E cuenta FALLÓ: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
