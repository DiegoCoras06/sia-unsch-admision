// E2E del asistente virtual (spec 009, T431) por la interfaz: preguntas sugeridas, respuesta con fuente,
// «Consultar mi proceso» con DNI + código y respuesta con el estado real.
// Uso: node scripts/e2e-asistente.mjs [DNI] [código] [carpeta-capturas]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const [dni = '99900025', code = '27000025', out = '.screens/asistente'] = process.argv.slice(2);
const base = process.env.BASE_URL ?? 'http://127.0.0.1:4200';
mkdirSync(out, { recursive: true });
const step = (m) => console.log(`✔ ${m}`);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: 'load' });
  await page.click('button.launcher');
  await page.locator('.chips button').first().waitFor({ timeout: 20000 });
  step(`Panel abierto con ${await page.locator('.chips button').count()} preguntas sugeridas`);

  const lastReply = () => page.locator('.msg:not(.msg--me)').last();
  const ask = async (q) => {
    const before = await page.locator('.msg:not(.msg--me)').count();
    await page.fill('#as-q', q);
    await page.click('.ask button[type=submit]');
    await page.waitForFunction((n) => document.querySelectorAll('.msg:not(.msg--me)').length > n, before, { timeout: 30000 });
    return (await lastReply().innerText()).replace(/\s+/g, ' ');
  };

  const fees = await ask('¿Cuánto pago si vengo de colegio estatal?');
  if (!/S\/ 250\.00/.test(fees) || !/Fuente:/.test(fees)) throw new Error(`Tasas sin monto o fuente: ${fees}`);
  step(`Tasas: «${fees.slice(0, 90)}…»`);

  const exam = await ask('¿Qué debo llevar al examen?');
  if (!/lápiz 2B/.test(exam)) throw new Error(`Examen: ${exam}`);
  step('Examen: responde lápiz 2B y cita el Art. 26');

  const vac = await ask('¿Cuántas vacantes tiene Medicina Humana?');
  if (!/vacantes en Ordinario/.test(vac)) throw new Error(`Vacantes: ${vac}`);
  step(`Vacantes: «${vac.slice(0, 80)}…»`);

  const anon = await ask('¿Cómo va mi inscripción?');
  if (!/Consultar mi proceso/.test(anon)) throw new Error(`Sin identificarse debería pedir «Consultar mi proceso»: ${anon}`);
  step('Sin identificarse: pide usar «Consultar mi proceso»');
  await page.screenshot({ path: `${out}/1-preguntas.png` });

  // Se cuenta antes de abrir el formulario: mientras está abierto, la conversación no se muestra.
  const before = await page.locator('.msg:not(.msg--me)').count();
  await page.click('.actions button:first-child');
  await page.fill('#as-doc', dni);
  await page.fill('#as-code', code);
  await page.click('.side button[type=submit]');
  await page.waitForFunction((n) => document.querySelectorAll('.msg:not(.msg--me)').length > n, before, { timeout: 30000 });
  const mine = (await lastReply().innerText()).replace(/\s+/g, ' ');
  if (!/Tu inscripción en/.test(mine) || mine.includes(dni)) throw new Error(`Estado: ${mine}`);
  step(`Con DNI + código: «${mine.slice(0, 120)}…»`);
  await page.screenshot({ path: `${out}/2-mi-proceso.png` });

  if (errors.length) throw new Error(`Errores en la página: ${errors.join(' | ')}`);
  console.log('E2E asistente: OK');
} catch (error) {
  console.error(`E2E asistente FALLÓ: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
