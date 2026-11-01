// E2E del expediente de exonerados (spec 004, T630) por la interfaz, SOLO contra la base local:
// el postulante sube sus documentos y envía el expediente; el administrador lo revisa en el panel,
// marca todo conforme y lo autoriza; el postulante ve entonces el botón de pago.
// Necesita apps/backend/.admin-local.txt con la clave TOTP (lo deja listo scripts/e2e-panel.mjs).
// Uso: node scripts/e2e-expediente.mjs [DNI sintético válido 99900001-99900040 aún no inscrito] [carpeta-capturas]
import { createHmac } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const dni = process.argv[2] ?? '99900037';
const out = process.argv[3] ?? '.screens/expediente';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:4200';
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
function totp(secret) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const mac = createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const o = mac[mac.length - 1] & 15;
  return String((((mac[o] & 127) << 24) | (mac[o + 1] << 16) | (mac[o + 2] << 8) | mac[o + 3]) % 1e6).padStart(6, '0');
}
function fakeJpeg(width, height) {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]);
}
const pdf = (title) => Buffer.from(`%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n% ${title}\ntrailer<</Root 1 0 R>>\n%%EOF\n`);

const admin = readFileSync(file, 'utf8');
const email = /Correo: (\S+)/.exec(admin)[1];
const password = /Contraseña (?:temporal|actual): (\S+)/.exec(admin)[1];
const secret = /Clave TOTP: (\S+)/.exec(admin)?.[1];
if (!secret) throw new Error(`Falta la clave TOTP en ${file}: corre antes scripts/e2e-panel.mjs contra la base local.`);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const res = await fetch(`${base}/api/v1/inscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentType: 'DNI', documentNumber: dni, paternalSurname: 'Quispe', maternalSurname: 'Huamán', firstNames: 'Rosa', sex: 'F',
      maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2007-03-11', address: 'Jr. Lima 120, Ayacucho',
      residenceUbigeo: '050101', economicDependency: 'PADRES', mobile: '966123456', email: `e2e.exo.${dni}@example.com`,
      photo: `data:image/jpeg;base64,${fakeJpeg(240, 320).toString('base64')}`, schoolUbigeo: '050101', schoolName: 'IE Mariscal Cáceres', schoolType: 'ESTATAL',
      graduationYear: 2025, inFourthOrBelow: false, preparation: 'CEPRE_UNSCH', attempts: 1, modality: 'EXO', quotaCategory: 'PS-U',
      campus: 'HUAMANGA', optionCode: 'P01', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
    }),
  });
  const body = await res.json();
  if (res.status !== 201) throw new Error(`No se registró la inscripción: ${res.status} ${JSON.stringify(body.error)}`);
  const code = body.data.applicantCode;
  step(`Inscripción de exonerado ${code} registrada (${body.data.statusLabel})`);

  // ── Postulante: arma y envía el expediente ─────────────────────────
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const openReceipt = async () => {
    await page.goto(`${base}/mi-inscripcion`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.fill('#m-doc', dni);
    await page.fill('#m-code', code);
    await page.click('button:has-text("Ver mi inscripción")');
    await page.locator('app-dossier-panel .dos').waitFor({ timeout: 20000 });
  };
  await openReceipt();
  if (await page.locator('app-online-payment button.btn--gold').count()) throw new Error('El pago no debería estar disponible antes de autorizar el expediente');
  step('Expediente visible en «Mi inscripción»; el pago aún no está disponible');

  const inputs = page.locator('app-dossier-panel input[type=file]');
  const n = await inputs.count();
  for (let i = 0; i < n; i++) {
    const before = await page.locator('app-dossier-panel .dos__file').count();
    await page.locator('app-dossier-panel input[type=file]').nth(i).setInputFiles({ name: `requisito-${i + 1}.pdf`, mimeType: 'application/pdf', buffer: pdf(`Requisito ${i + 1}`) });
    await page.waitForFunction((b) => document.querySelectorAll('app-dossier-panel .dos__file').length > b, before, { timeout: 20000 });
  }
  step(`${n} documentos cargados`);
  for (const field of await page.locator('app-dossier-panel .dos__comp input').all()) await field.fill((await field.getAttribute('type')) === 'number' ? '1' : 'Dato de prueba');
  await page.screenshot({ path: `${out}/1-expediente-armado.png`, fullPage: true });
  await page.click('button:has-text("Enviar expediente a revisión")');
  await page.locator('.dos__state', { hasText: 'En revisión' }).waitFor({ timeout: 20000 });
  step('Expediente enviado: «En revisión»');

  // ── Administrador: revisa y autoriza en el panel ───────────────────
  const staff = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  staff.on('pageerror', (e) => errors.push(e.message));
  await staff.goto(`${base}/admin/ingreso`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await staff.fill('#lg-mail', email);
  await staff.fill('#lg-pass', password);
  await staff.click('button[type=submit]');
  await staff.waitForSelector('#lg-code2', { timeout: 20000 });
  await staff.fill('#lg-code2', totp(secret));
  await staff.click('button[type=submit]');
  await staff.waitForURL(/\/admin$/, { timeout: 20000 });
  await staff.click('.adm-side nav a[href="/admin/expedientes"]');
  const row = staff.locator('.adm-table tbody tr', { hasText: code });
  await row.waitFor({ timeout: 20000 });
  step('El expediente aparece en la bandeja del evaluador');
  await row.locator('button:has-text("Revisar")').click();
  await staff.locator('h2', { hasText: 'Documentos' }).waitFor({ timeout: 20000 });
  for (let i = 0; i < n; i++) {
    const pending = staff.locator('.dx-act button:has-text("Conforme")').first();
    const left = await staff.locator('.adm-tag', { hasText: 'Por revisar' }).count();
    await pending.click();
    await staff.waitForFunction((l) => [...document.querySelectorAll('.adm-tag')].filter((t) => t.textContent.trim() === 'Por revisar').length < l, left, { timeout: 20000 });
  }
  step('Todos los documentos marcados conformes');
  await staff.screenshot({ path: `${out}/2-revision-evaluador.png`, fullPage: true });
  await staff.fill('#dx-note', 'Requisitos completos y conformes.');
  await staff.click('button:has-text("Autorizar")');
  await staff.locator('.adm-msg', { hasText: 'autorizado' }).waitFor({ timeout: 20000 });
  step('Expediente autorizado en el panel');

  // ── Postulante: ya puede pagar ─────────────────────────────────────
  await openReceipt();
  await page.locator('.dos__state', { hasText: 'Autorizado' }).waitFor({ timeout: 20000 });
  await page.locator('app-online-payment button.btn--gold').waitFor({ timeout: 20000 });
  step('El postulante ve su expediente «Autorizado» y el botón de pago');
  await page.screenshot({ path: `${out}/3-autorizado-pago.png`, fullPage: true });

  if (errors.length) throw new Error(`Errores en la página: ${errors.join(' | ')}`);
  step('Sin errores de JavaScript');
} finally {
  await browser.close();
}
