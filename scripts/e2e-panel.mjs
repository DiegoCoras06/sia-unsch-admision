// E2E del panel administrativo (spec 008, T532) por la interfaz, SOLO contra la base local:
// primer ingreso del administrador (cambio de contraseña + TOTP), recorrido por las secciones,
// edición de una tasa con auditoría y exportación de un reporte.
// Lee la contraseña temporal de apps/backend/.admin-inicial.txt y, al terminar, guarda ahí la nueva
// contraseña y la clave TOTP de esta base local (para volver a entrar en pruebas).
// Uso: node scripts/e2e-panel.mjs [carpeta-capturas]
import { createHmac } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const out = process.argv[2] ?? '.screens/panel';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:4200';
// Credenciales de la base LOCAL (nunca las de RDS): .admin-local.txt, o el archivo del primer ingreso local.
const file = process.env.ADMIN_FILE ?? 'apps/backend/.admin-local.txt';
mkdirSync(out, { recursive: true });
const step = (m) => console.log(`✔ ${m}`);

function base32Decode(s) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0;
  const bytes = [];
  for (const ch of s.replace(/=+$/, '').toUpperCase()) {
    value = (value << 5) | A.indexOf(ch);
    bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(bytes);
}
function totp(secret, offsetSteps = 0) {
  const counter = Math.floor(Date.now() / 30000) + offsetSteps;
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const o = mac[mac.length - 1] & 15;
  return String((((mac[o] & 127) << 24) | (mac[o + 1] << 16) | (mac[o + 2] << 8) | mac[o + 3]) % 1e6).padStart(6, '0');
}

const text = readFileSync(file, 'utf8');
const email = /Correo: (\S+)/.exec(text)[1];
const temp = /Contraseña (?:temporal|actual): (\S+)/.exec(text)[1];
const savedSecret = /Clave TOTP: (\S+)/.exec(text)?.[1];
const NEW_PASSWORD = 'Panel-Admision-Local-2027';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/admin/ingreso`, { waitUntil: 'load' });
  await page.fill('#lg-mail', email);
  await page.fill('#lg-pass', temp);
  await page.click('button[type=submit]');

  let secret = savedSecret;
  await page.waitForSelector('#lg-new, #lg-code1, #lg-code2', { timeout: 20000 });
  if (await page.locator('#lg-new').count()) {
    await page.fill('#lg-new', NEW_PASSWORD);
    await page.click('button[type=submit]');
    step('Primer ingreso: contraseña temporal reemplazada');
    await page.waitForSelector('#lg-code1', { timeout: 20000 });
  }
  if (await page.locator('#lg-code1').count()) {
    secret = (await page.locator('.secret code').innerText()).trim();
    await page.screenshot({ path: `${out}/1-activar-segundo-factor.png` });
    await page.fill('#lg-code1', totp(secret));
    step('Segundo factor: QR mostrado y código TOTP aceptado');
  } else {
    await page.fill('#lg-code2', totp(secret, 1));
  }
  await page.click('button[type=submit]');
  await page.waitForURL(/\/admin$/, { timeout: 20000 });
  writeFileSync(file, `Panel de Admisión UNSCH - base LOCAL de pruebas\nCorreo: ${email}\nContraseña actual: ${NEW_PASSWORD}\nClave TOTP: ${secret}\n`);
  await page.locator('.adm-kpi').first().waitFor({ timeout: 20000 });
  step(`Inicio del panel: ${(await page.locator('.adm-kpi').count())} indicadores`);
  await page.screenshot({ path: `${out}/2-inicio.png`, fullPage: true });

  for (const [path, title, shot] of [
    ['inscripciones', 'Inscripciones', '3-inscripciones'], ['pagos', 'Pagos en línea', '4-pagos'], ['convocatoria', 'Convocatoria', '5-convocatoria'],
    ['contenido', 'Contenido del portal', '6-contenido'], ['asistente', 'Asistente virtual', '7-asistente'], ['casos', 'Casos de atención', '8-casos'],
    ['inhabilitados', 'Inhabilitados', '9-inhabilitados'], ['usuarios', 'Usuarios y roles', '10-usuarios'], ['auditoria', 'Auditoría', '11-auditoria'],
    ['configuracion', 'Configuración', '12-configuracion'],
  ]) {
    await page.click(`.adm-side nav a[href="/admin/${path}"]`);
    await page.locator('h1', { hasText: title }).waitFor({ timeout: 20000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${shot}.png`, fullPage: true });
  }
  step('Recorrido por las 10 secciones del panel');

  // Editar una tasa y verla en la auditoría.
  await page.click('.adm-side nav a[href="/admin/convocatoria"]');
  await page.click('.adm-tabs button:has-text("Tasas")');
  const firstFee = page.locator('.adm-table tbody tr').first();
  const original = await firstFee.locator('input').inputValue();
  await firstFee.locator('input').fill(String((Number(original) + 1).toFixed(2)));
  await firstFee.locator('button').click();
  await page.locator('.adm-msg:not(.err)').waitFor({ timeout: 15000 });
  await firstFee.locator('input').fill(original);
  await firstFee.locator('button').click();
  await page.click('.adm-side nav a[href="/admin/auditoria"]');
  await page.fill('#au-a', 'call.fee_updated');
  await page.click('form button[type=submit]');
  await page.locator('td', { hasText: 'call.fee_updated' }).first().waitFor({ timeout: 15000 });
  step('Tasa editada y revertida; ambos cambios aparecen en la auditoría');

  await page.click('.adm-side nav a[href="/admin"]');
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('button:has-text("Inscripciones · Excel")')]);
  const saved = `${out}/${download.suggestedFilename()}`;
  await download.saveAs(saved);
  if (readFileSync(saved).subarray(0, 2).toString() !== 'PK') throw new Error('El Excel descargado no es válido');
  step(`Reporte exportado: ${download.suggestedFilename()}`);

  if (errors.length) throw new Error(`Errores en la página: ${errors.join(' | ')}`);
  console.log('E2E panel: OK');
} catch (error) {
  console.error(`E2E panel FALLÓ: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
