// Capturas del panel administrativo, SOLO contra la base local: entra con el administrador local
// (apps/backend/.admin-local.txt, con TOTP) y fotografía las pantallas indicadas.
// Uso: node scripts/screenshots-panel.mjs <carpeta> [ruta1 ruta2 ...]   (rutas sin /admin: "", inscripciones, expedientes…)
import { createHmac } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const [out = '.screens/panel-ui', ...routes] = process.argv.slice(2);
const base = process.env.BASE_URL ?? 'http://127.0.0.1:4200';
const width = Number(process.env.WIDTH ?? 1440);
mkdirSync(out, { recursive: true });

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
const health = await (await fetch(`${base}/api/v1/health`)).json();
const offset = new Date(health.data.time).getTime() - Date.now();
function totp(secret) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(Math.floor((Date.now() + offset) / 30000)));
  const mac = createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const o = mac[mac.length - 1] & 15;
  return String((((mac[o] & 127) << 24) | (mac[o + 1] << 16) | (mac[o + 2] << 8) | mac[o + 3]) % 1e6).padStart(6, '0');
}
const t = readFileSync('apps/backend/.admin-local.txt', 'utf8');
const email = /Correo: (\S+)/.exec(t)[1];
const password = /Contraseña (?:temporal|actual): (\S+)/.exec(t)[1];
const secret = /Clave TOTP: (\S+)/.exec(t)[1];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/admin/ingreso`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('#lg-mail', email);
  await page.fill('#lg-pass', password);
  await page.click('button[type=submit]');
  await page.waitForSelector('#lg-code2', { timeout: 20000 });
  await page.fill('#lg-code2', totp(secret));
  await page.click('button[type=submit]');
  // El servidor de desarrollo mantiene una conexión abierta: basta con que cargue el inicio del panel.
  await page.waitForSelector('.adm-side nav', { timeout: 30000 }).catch(async (e) => {
    console.log('No entró al panel:', (await page.locator('main').innerText().catch(() => '')).slice(0, 300));
    throw e;
  });
  for (const r of routes.length ? routes : ['']) {
    if (r) await page.click(`.adm-side nav a[href="/admin/${r}"]`);
    await page.waitForTimeout(1800);
    const name = r || 'inicio';
    await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
    console.log(`✔ ${name}`);
  }
  if (errors.length) console.log('Errores:', errors.join(' | '));
} finally {
  await browser.close();
}
