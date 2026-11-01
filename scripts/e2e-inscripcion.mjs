// E2E de la inscripción pública (spec 003, ADR-015) por la interfaz con Edge headless:
// DNI autocompleta nombres → datos básicos, foto (recortada en el navegador), académicos y postulación →
// guardar → constancia con código → consultar en «Mi inscripción».
// Uso: node scripts/e2e-inscripcion.mjs [DNI sintético 99900020-99900040] [carpeta-capturas] [ancho]
import path from 'node:path';
import { chromium } from 'playwright-core';

const dni = process.argv[2] ?? '99900021';
const out = process.argv[3] ?? '.screens';
const width = Number(process.argv[4] ?? 1440);
const base = process.env.BASE_URL ?? 'http://127.0.0.1:4200';
const photo = path.resolve('apps/frontend/public/img/escudo-unsch.jpg');
const step = (m) => console.log(`✔ ${m}`);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

async function ubigeo(id, dep, prov, dist) {
  await page.selectOption(`#${id}-dep`, { label: dep });
  await page.selectOption(`#${id}-prov`, { label: prov });
  await page.selectOption(`#${id}-dist`, { label: dist });
}

try {
  await page.goto(`${base}/inscripcion`);
  await page.getByRole('heading', { name: 'Inscripción 2027-I' }).waitFor();

  await page.fill('#f-doc', dni);
  await page.getByText(/Datos encontrados/).waitFor();
  const names = [await page.inputValue('#f-ap'), await page.inputValue('#f-am'), await page.inputValue('#f-nom')];
  if (names.some((n) => !n)) throw new Error('No se autocompletaron los nombres');
  step(`DNI ${dni} autocompletó: ${names.join(' ')}`);

  // La inscripción va por pasos: «Siguiente» valida cada uno antes de avanzar.
  const next = () => page.getByRole('button', { name: /^Siguiente:/ }).click();
  await page.check('input[formcontrolname="sex"][value="F"]');
  await page.selectOption('#f-civil', 'SOLTERO');
  await ubigeo('nac', 'Ayacucho', 'Huamanga', 'Ayacucho');
  await page.fill('#f-fnac', '2008-03-14');
  await page.selectOption('#f-dep', 'PADRES');
  await next();

  await page.fill('#f-dir', 'Jr. Lima 123, Ayacucho');
  await page.getByRole('button', { name: 'Es el mismo que mi lugar de nacimiento' }).click();
  await page.fill('#f-cel', '987654321');
  await page.fill('#f-mail', `e2e.${dni}@example.com`);
  await next();

  await page.setInputFiles('#foto-file', photo);
  await page.locator('img[alt^="Vista previa"]').waitFor();
  step('Foto recortada a 240 × 320 en el navegador');
  await next();

  await ubigeo('col', 'Ayacucho', 'Huamanga', 'Ayacucho');
  await page.fill('#f-col', 'IE Mariscal Cáceres');
  await page.check('input[formcontrolname="schoolType"][value="ESTATAL"]');
  await page.fill('#f-anio', '2025');
  await page.selectOption('#f-cuarto', 'NO');
  await page.selectOption('#f-prep', 'ACADEMIA');
  await next();

  await page.selectOption('#f-area', 'I');
  await page.selectOption('#f-prog', 'P34');
  await page.getByText('S/ 250.00').first().waitFor();
  step('Resumen en vivo: Ingeniería de Sistemas, S/ 250.00');
  await page.screenshot({ path: path.join(out, `inscripcion-form-${width}.png`), fullPage: true });
  await next();

  await page.check('input[formcontrolname="declarationAccepted"]');
  await page.check('input[formcontrolname="consentAccepted"]');
  await page.getByRole('button', { name: 'Guardar inscripción' }).click();
  await page.getByRole('heading', { name: 'Inscripción registrada' }).waitFor({ timeout: 20000 });
  const code = (await page.locator('.receipt__code-num').textContent())?.trim();
  step(`Inscripción registrada con código ${code}`);
  await page.screenshot({ path: path.join(out, `inscripcion-ok-${width}.png`), fullPage: true });

  await page.goto(`${base}/mi-inscripcion`);
  await page.fill('#m-doc', dni);
  await page.fill('#m-code', code);
  await page.getByRole('button', { name: 'Ver mi inscripción' }).click();
  await page.locator('.receipt__code-num').waitFor();
  step('Consulta con DNI + código muestra la orden de pago');

  await page.goto(`${base}/inscripcion`);
  await page.fill('#f-doc', dni);
  await page.getByText(/ya tiene una inscripción/).waitFor();
  step('El mismo DNI ya no puede volver a inscribirse');

  if (errors.length) throw new Error(`Errores de página: ${errors.join(' | ')}`);
  console.log('E2E inscripción: OK');
} catch (error) {
  console.error('E2E inscripción FALLÓ:', String(error.message).split('\n').slice(0, 6).join('\n'), '\nURL:', page.url());
  await page.screenshot({ path: path.join(out, 'e2e-inscripcion-error.png'), fullPage: true, timeout: 10_000 }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
