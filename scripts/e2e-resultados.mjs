// E2E de resultados (spec 007, T823) por la interfaz, SOLO contra la base local y con la API en fecha simulada
// del día del examen ordinario (APP_FIXED_NOW=2026-11-22T12:00:00-05:00). Requiere haber corrido e2e-examen.mjs
// (deja un postulante presente) y el usuario de la Comisión local (apps/backend/scripts/staff-local.ts).
// Flujo: cerrar asistencia → importar CSV → procesar → enviar → la Comisión aprueba → «Ver puntaje».
// Uso: node scripts/e2e-resultados.mjs [DNI] [código] [carpeta-capturas]
import { createHmac } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const dni = process.argv[2] ?? '99900031';
const code = process.argv[3] ?? '27000124';
const out = process.argv[4] ?? '.screens/resultados';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:4200';
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
// La API corre con reloj simulado: el código TOTP se calcula con la hora del servidor.
const health = await (await fetch(`${base}/api/v1/health`)).json();
const offset = new Date(health.data.time).getTime() - Date.now();
function totp(secret) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(Math.floor((Date.now() + offset) / 30000)));
  const mac = createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const o = mac[mac.length - 1] & 15;
  return String((((mac[o] & 127) << 24) | (mac[o + 1] << 16) | (mac[o + 2] << 8) | mac[o + 3]) % 1e6).padStart(6, '0');
}
const creds = (file) => {
  const t = readFileSync(file, 'utf8');
  return { email: /Correo: (\S+)/.exec(t)[1], password: /Contraseña (?:temporal|actual): (\S+)/.exec(t)[1], secret: /Clave TOTP: (\S+)/.exec(t)[1] };
};
const admin = creds('apps/backend/.admin-local.txt');
const comision = creds('apps/backend/.comision-local.txt');

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
async function login(who) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/admin/ingreso`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('#lg-mail', who.email);
  await page.fill('#lg-pass', who.password);
  await page.click('button[type=submit]');
  await page.waitForSelector('#lg-code2', { timeout: 20000 });
  await page.fill('#lg-code2', totp(who.secret));
  await page.click('button[type=submit]');
  await page.waitForURL(/\/admin$/, { timeout: 20000 });
  return page;
}

try {
  step(`Hora del servidor: ${health.data.time}`);
  const op = await login(admin);

  // ── Cerrar la asistencia del examen ordinario ──────────────────────
  await op.click('.adm-side nav a[href="/admin/examenes"]');
  await op.locator('.adm-table tbody tr', { hasText: 'Examen Ordinario' }).locator('button:has-text("Gestionar")').click();
  const close = op.locator('button:has-text("Cerrar asistencia")');
  await op.locator('h2', { hasText: 'Distribución automática' }).waitFor({ timeout: 20000 });
  if (await close.count()) {
    await close.click();
    await op.locator('.adm-msg', { hasText: 'Asistencia cerrada' }).waitFor({ timeout: 20000 });
    step((await op.locator('.adm-msg').innerText()).trim());
  } else step('La asistencia ya estaba cerrada');

  // ── Importar, procesar y enviar ────────────────────────────────────
  await op.click('.adm-side nav a[href="/admin/resultados"]');
  const section = op.locator('section.adm-panel', { hasText: 'Examen Ordinario' });
  await section.waitFor({ timeout: 20000 });
  const csv = `${out}/lectora-ordinario.csv`;
  writeFileSync(csv, `codigo,conocimientos,aptitud,actitud,observacion\n${code},88,9,8,\n`);
  await section.locator('input[type=file]').setInputFiles(csv);
  await section.locator('button:has-text("Importar y validar")').click();
  await op.locator('.adm-msg', { hasText: /registros válidos|inconsistencias/ }).waitFor({ timeout: 20000 });
  const v = (await op.locator('.adm-msg').first().innerText()).trim();
  if (/inconsistencias/.test(v)) throw new Error(`El lote tiene inconsistencias: ${v}`);
  step(`Lote: ${v}`);
  await op.screenshot({ path: `${out}/1-lote-valido.png`, fullPage: true });
  const reason = op.locator('input[placeholder^="Motivo de la rectificación"]');
  if (await reason.count()) await reason.fill('Prueba E2E: rectificación del lote de la lectora');
  await op.click('button:has-text("Procesar orden de mérito")');
  await op.locator('.adm-msg', { hasText: 'procesada en borrador' }).waitFor({ timeout: 60000 });
  await op.click('button:has-text("Enviar a aprobación de la Comisión")');
  await op.locator('.adm-msg', { hasText: 'Enviada a la Comisión' }).waitFor({ timeout: 20000 });
  step('Orden de mérito procesado y enviado a la Comisión');
  await op.screenshot({ path: `${out}/2-orden-de-merito.png`, fullPage: true });

  // ── La Comisión aprueba (otra persona) ─────────────────────────────
  const com = await login(comision);
  await com.click('.adm-side nav a[href="/admin/resultados"]');
  const sec = com.locator('section.adm-panel', { hasText: 'Examen Ordinario' });
  await sec.locator('tr', { hasText: 'En aprobación' }).locator('button:has-text("Revisar")').click();
  const now = new Date(Date.now() + offset - 5 * 3600_000 - 60_000).toISOString().slice(0, 16);
  await com.fill('#pub', now);
  await com.click('button:has-text("Aprobar y programar publicación")');
  await com.locator('.adm-msg', { hasText: 'Aprobada' }).waitFor({ timeout: 20000 });
  step('La Comisión aprobó y publicó los resultados');

  // ── Postulante: «Ver puntaje» ──────────────────────────────────────
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/resultados`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('#r-doc', dni);
  await page.fill('#r-code', code);
  await page.click('button:has-text("Ver mi puntaje")');
  await page.locator('.score').waitFor({ timeout: 20000 });
  step(`«Ver puntaje»: ${(await page.locator('.score').innerText()).replace(/\s+/g, ' ')}`);
  await page.screenshot({ path: `${out}/3-ver-puntaje.png`, fullPage: true });

  if (errors.length) throw new Error(`Errores en la página: ${errors.join(' | ')}`);
  step('Sin errores de JavaScript');
} finally {
  await browser.close();
}
