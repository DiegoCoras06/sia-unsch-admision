// E2E del pago en línea (spec 005, T330) por la interfaz, con la pasarela que tenga configurada la API.
// Registra una inscripción por la API, la busca en «Mi inscripción», paga y verifica «Pago confirmado» y estado Apta.
// Con la pasarela simulada paga con tarjeta en el recuadro simulado; con Culqi se detiene al abrir su formulario (pago manual).
// Uso: node scripts/e2e-pago.mjs [DNI sintético 99900020-99900040] [carpeta-capturas]
import { mkdirSync, readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { chromium } from 'playwright-core';

const dni = process.argv[2] ?? '99900025';
const out = process.argv[3] ?? '.screens/pago';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:4200';
mkdirSync(out, { recursive: true });
const step = (m) => console.log(`✔ ${m}`);

function fakeJpeg(width, height) {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const res = await fetch(`${base}/api/v1/inscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentType: 'DNI', documentNumber: dni, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'F',
      maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-05-20', address: 'Jr. 28 de Julio 150, Ayacucho',
      residenceUbigeo: '050101', economicDependency: 'PADRES', mobile: '966123456', email: `e2e.pago.${dni}@example.com`,
      photo: fakeJpeg(240, 320), schoolUbigeo: '050101', schoolName: 'IE Luis Carranza', schoolType: 'ESTATAL',
      graduationYear: 2025, inFourthOrBelow: false, preparation: 'CEPRE_UNSCH', attempts: 1, modality: 'ORD', quotaCategory: 'ORD',
      campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
    }),
  });
  const body = await res.json();
  if (res.status !== 201) throw new Error(`No se registró la inscripción: ${res.status} ${JSON.stringify(body.error)}`);
  const code = body.data.applicantCode;
  step(`Inscripción ${code} registrada (S/ ${body.data.fee.total}, ${body.data.statusLabel})`);

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/mi-inscripcion`, { waitUntil: 'load' });
  await page.fill('#m-doc', dni);
  await page.fill('#m-code', code);
  await page.click('button:has-text("Ver mi inscripción")');
  const payButton = page.locator('app-online-payment button.btn--gold');
  await payButton.waitFor({ timeout: 20000 });
  step(`«Mi inscripción» muestra el botón «${(await payButton.innerText()).trim()}»`);
  await page.screenshot({ path: `${out}/1-antes-de-pagar.png`, fullPage: true });

  await payButton.click();
  const mock = page.locator('.pay__mock');
  const culqiFrame = page.locator('iframe[src*="culqi"]');
  await Promise.race([mock.waitFor({ timeout: 30000 }), culqiFrame.first().waitFor({ timeout: 30000 })]);
  if (!(await mock.isVisible())) {
    await page.screenshot({ path: `${out}/2-formulario-culqi.png`, fullPage: true });
    step('Se abrió el formulario de Culqi (pruebas): completa el pago con la tarjeta o el Yape de prueba');
    process.exit(0);
  }
  step('Se abrió la pasarela simulada');
  await page.click('button:has-text("Pagar con tarjeta")');
  await page.locator('.pay__ok').waitFor({ timeout: 20000 });
  step(`Constancia: ${(await page.locator('.pay__ok dl').innerText()).replace(/\s+/g, ' ').slice(0, 140)}`);
  await page.locator('.receipt__status:not(.is-wait)').waitFor({ timeout: 15000 });
  step(`Estado de la inscripción: ${(await page.locator('.receipt__status').innerText()).trim()}`);
  await page.screenshot({ path: `${out}/3-pago-confirmado.png`, fullPage: true });

  // Ficha de inscripción con QR (spec 003, Historia 5): se descarga y su QR verifica.
  const fichaBtn = page.locator('button:has-text("Descargar ficha (PDF)")');
  await fichaBtn.waitFor({ timeout: 20000 });
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), fichaBtn.click()]);
  const fichaPath = `${out}/${download.suggestedFilename()}`;
  await download.saveAs(fichaPath);
  const pdf = readFileSync(fichaPath);
  if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('La ficha descargada no es un PDF');
  // El enlace de verificación está en el texto del PDF (flujos comprimidos con zlib).
  let verifyUrl = null;
  for (const m of pdf.toString('latin1').matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    try {
      const txt = inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1');
      const hit = /verificar\/(\d{8}\.[A-Za-z0-9_-]{16})/.exec(txt.replace(/[^\x20-\x7e]/g, '')) ?? /verificar\/(\d{8}\.[A-Za-z0-9_-]{16})/.exec(hexText(txt));
      if (hit) { verifyUrl = `${base}/verificar/${hit[1]}`; break; }
    } catch { /* flujo no comprimido */ }
  }
  step(`Ficha descargada: ${download.suggestedFilename()}${verifyUrl ? '' : ' (enlace del QR no legible en el texto; se omite la verificación)'}`);
  if (verifyUrl) {
    await page.goto(verifyUrl, { waitUntil: 'load' });
    await page.locator('.badge', { hasText: 'Ficha válida' }).waitFor({ timeout: 20000 });
    step('El QR de la ficha abre «Ficha válida»');
    await page.screenshot({ path: `${out}/4-verificacion.png`, fullPage: true });
  }
  await page.goto(`${base}/verificar/${code}.AAAAAAAAAAAAAAAA`, { waitUntil: 'load' });
  await page.locator('.badge', { hasText: 'Ficha no válida' }).waitFor({ timeout: 20000 });
  step('Un QR alterado muestra «Ficha no válida»');

  // Segundo intento sobre la orden pagada: la API lo impide.
  const again = await fetch(`${base}/api/v1/payments/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentNumber: dni, applicantCode: code }),
  });
  if (again.status !== 409) throw new Error(`Se esperaba 409 al volver a pagar y llegó ${again.status}`);
  step('Una orden pagada no se puede volver a pagar (409)');
  if (errors.length) throw new Error(`Errores en la página: ${errors.join(' | ')}`);
  console.log('E2E pago: OK');
} catch (error) {
  console.error(`E2E pago FALLÓ: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}

/** PDFKit escribe el texto como cadenas hexadecimales `<…> Tj`: las convierte a texto para buscar el enlace. */
function hexText(content) {
  return [...content.matchAll(/<([0-9a-fA-F]+)>/g)].map((m) => Buffer.from(m[1], 'hex').toString('latin1')).join('');
}
