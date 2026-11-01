// E2E del examen y las aulas (spec 006, T743) por la interfaz, SOLO contra la base local y la pasarela simulada:
// inscripción ordinaria pagada → el coordinador adelanta la publicación, distribuye y confirma en el panel →
// el postulante ve su aula en «Buscar aula» y descarga la ficha de examen → el responsable registra su ingreso.
// Deja la publicación del examen Ordinario adelantada en la base local (se ajusta luego en el panel).
// Uso: node scripts/e2e-examen.mjs [DNI sintético válido 99900001-99900040 aún no inscrito] [carpeta-capturas]
import { createHmac } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const dni = process.argv[2] ?? '99900031';
const out = process.argv[3] ?? '.screens/examen';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:4200';
const file = process.env.ADMIN_FILE ?? 'apps/backend/.admin-local.txt';
mkdirSync(out, { recursive: true });
const step = (m) => console.log(`✔ ${m}`);
const api = async (path, body) => {
  const r = await fetch(`${base}/api/v1${path}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const j = await r.json();
  if (!r.ok) throw new Error(`${path}: ${r.status} ${JSON.stringify(j.error)}`);
  return j.data;
};

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
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}

const admin = readFileSync(file, 'utf8');
const email = /Correo: (\S+)/.exec(admin)[1];
const password = /Contraseña (?:temporal|actual): (\S+)/.exec(admin)[1];
const secret = /Clave TOTP: (\S+)/.exec(admin)?.[1];
if (!secret) throw new Error(`Falta la clave TOTP en ${file}: corre antes scripts/e2e-panel.mjs contra la base local.`);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  // ── Inscripción ordinaria pagada con la pasarela simulada ──────────
  const ins = await api('/inscriptions', {
    documentType: 'DNI', documentNumber: dni, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'M',
    maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2007-09-14', address: 'Jr. Bellido 330, Ayacucho',
    residenceUbigeo: '050101', economicDependency: 'PADRES', mobile: '966123456', email: `e2e.examen.${dni}@example.com`,
    photo: fakeJpeg(240, 320), schoolUbigeo: '050101', schoolName: 'IE Nuestra Señora de Fátima', schoolType: 'ESTATAL',
    graduationYear: 2025, inFourthOrBelow: false, preparation: 'CEPRE_UNSCH', attempts: 1, modality: 'ORD', quotaCategory: 'ORD',
    campus: 'HUAMANGA', optionCode: 'P20', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
  });
  const code = ins.applicantCode;
  const session = await api('/payments/session', { documentNumber: dni, applicantCode: code });
  if (session.provider !== 'mock') throw new Error('Este E2E usa la pasarela simulada (PAYMENTS_PROVIDER=mock).');
  await api('/payments/confirm', await api('/payments/mock/complete', { transactionId: session.transactionId, approve: true }));
  let status = '';
  for (let i = 0; i < 20 && status !== 'APTA'; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    status = (await api(`/inscriptions/status?documentNumber=${dni}&applicantCode=${code}`)).status;
  }
  if (status !== 'APTA') throw new Error(`La inscripción no quedó Apta (${status})`);
  step(`Inscripción ordinaria ${code} pagada y Apta`);

  // ── Coordinador: publicación, distribución y confirmación ──────────
  const staff = await browser.newPage({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  const errors = [];
  staff.on('pageerror', (e) => errors.push(e.message));
  await staff.goto(`${base}/admin/ingreso`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await staff.fill('#lg-mail', email);
  await staff.fill('#lg-pass', password);
  await staff.click('button[type=submit]');
  await staff.waitForSelector('#lg-code2', { timeout: 20000 });
  await staff.fill('#lg-code2', totp(secret));
  await staff.click('button[type=submit]');
  await staff.waitForURL(/\/admin$/, { timeout: 20000 });
  await staff.click('.adm-side nav a[href="/admin/examenes"]');
  const row = staff.locator('.adm-table tbody tr', { hasText: 'Examen Ordinario' });
  await row.waitFor({ timeout: 20000 });
  await staff.screenshot({ path: `${out}/1-examenes.png`, fullPage: true });
  await row.locator('button:has-text("Gestionar")').click();
  await staff.locator('.adm-tabs button', { hasText: 'Programación' }).click();
  const lima = (ms) => new Date(ms - 5 * 3600_000).toISOString().slice(0, 16);
  await staff.fill('#ex-pub', lima(Date.now() - 3600_000));
  await staff.click('button:has-text("Guardar cambios")');
  await staff.locator('.adm-msg', { hasText: 'Examen actualizado' }).waitFor({ timeout: 20000 });
  step('Publicación de aulas adelantada a hace una hora (para la prueba)');

  await staff.locator('.adm-tabs button', { hasText: 'Distribución' }).click();
  if (await staff.locator('#ds-reason').count()) await staff.fill('#ds-reason', 'Prueba E2E: nuevo apto después de la publicación');
  await staff.locator('button', { hasText: /Distribuir aptos|Volver a distribuir/ }).click();
  await staff.locator('.adm-msg', { hasText: 'Distribución generada' }).waitFor({ timeout: 60000 });
  const confirm = staff.locator('button:has-text("Confirmar y programar publicación")');
  if (await confirm.count()) {
    await confirm.click();
    await staff.locator('.adm-msg', { hasText: 'Distribución confirmada' }).waitFor({ timeout: 20000 });
  }
  step(`Distribución lista: ${(await staff.locator('.adm-kpi').nth(1).innerText()).replace(/\s+/g, ' ')}`);
  await staff.screenshot({ path: `${out}/2-distribucion.png`, fullPage: true });

  // ── Postulante: «Buscar aula» y ficha de examen ────────────────────
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/buscar-aula`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('#a-doc', dni);
  await page.fill('#a-code', code);
  await page.click('button:has-text("Buscar mi aula")');
  await page.locator('.room').waitFor({ timeout: 20000 });
  step(`«Buscar aula»: ${(await page.locator('.room').innerText()).replace(/\s+/g, ' ')}`);
  await page.screenshot({ path: `${out}/3-buscar-aula.png`, fullPage: true });
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('button:has-text("Descargar ficha de examen")')]);
  const pdfPath = `${out}/${download.suggestedFilename()}`;
  await download.saveAs(pdfPath);
  if (readFileSync(pdfPath).subarray(0, 5).toString() !== '%PDF-') throw new Error('La ficha de examen no es un PDF');
  step(`Ficha de examen descargada: ${pdfPath}`);

  // ── Responsable de aula: registro de ingreso ───────────────────────
  await staff.click('.adm-side nav a[href="/admin/asistencia"]');
  await staff.locator('h1', { hasText: 'Asistencia del examen' }).waitFor({ timeout: 20000 });
  await staff.selectOption('#at-exam', { label: 'Examen Ordinario' });
  await staff.fill('.at-scan', code);
  await staff.click('form button:has-text("Registrar")');
  await staff.locator('.at-card').waitFor({ timeout: 20000 });
  step(`Ingreso registrado: ${(await staff.locator('.at-card').innerText()).replace(/\s+/g, ' ').slice(0, 160)}`);
  await staff.screenshot({ path: `${out}/4-asistencia.png`, fullPage: true });

  if (errors.length) throw new Error(`Errores en la página: ${errors.join(' | ')}`);
  step('Sin errores de JavaScript');
} finally {
  await browser.close();
}
