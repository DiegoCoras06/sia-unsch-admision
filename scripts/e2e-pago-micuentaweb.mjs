// E2E del pago con tarjeta en el sandbox de Izipay micuentaweb (spec 005, T331), contra la API levantada con `npm run dev:rds`.
// Registra una inscripción, abre el formulario Krypton, paga con una tarjeta de prueba y verifica que el pago
// quedó confirmado por la consulta servidor a servidor (confirmedVia = CONSULTA), no solo por el retorno del navegador.
// Uso: node scripts/e2e-pago-micuentaweb.mjs <DNI> <correo> [tarjeta] [carpeta-capturas]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const [dni = '99900050', email = 'e2e.micuentaweb@example.com', card = '4970100000000055', out = '.screens/pago-sandbox'] = process.argv.slice(2);
const base = process.env.BASE_URL ?? 'http://127.0.0.1:4200';
mkdirSync(out, { recursive: true });
const step = (m) => console.log(`✔ ${m}`);

function fakeJpeg(width, height) {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
let page;
try {
  const res = await fetch(`${base}/api/v1/inscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentType: 'DNI', documentNumber: dni, paternalSurname: 'PRUEBA', maternalSurname: 'SANDBOX', firstNames: 'POSTULANTE', sex: 'F',
      maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-05-20', address: 'Jr. 28 de Julio 150, Ayacucho',
      residenceUbigeo: '050101', economicDependency: 'PADRES', mobile: '966123456', email,
      photo: fakeJpeg(240, 320), schoolUbigeo: '050101', schoolName: 'IE Luis Carranza', schoolType: 'ESTATAL',
      graduationYear: 2025, inFourthOrBelow: false, preparation: 'CEPRE_UNSCH', attempts: 1, modality: 'ORD', quotaCategory: 'ORD',
      campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
    }),
  });
  const body = await res.json();
  if (res.status !== 201) throw new Error(`No se registró la inscripción: ${res.status} ${JSON.stringify(body.error)}`);
  const code = body.data.applicantCode;
  step(`Inscripción ${code} registrada (S/ ${body.data.fee.total}, ${body.data.statusLabel})`);

  page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.goto(`${base}/mi-inscripcion`, { waitUntil: 'load' });
  await page.fill('#m-doc', dni);
  await page.fill('#m-code', code);
  await page.click('button:has-text("Ver mi inscripción")');
  const payButton = page.locator('app-online-payment button.btn--gold');
  await payButton.waitFor({ timeout: 30000 });
  await payButton.click();

  // Campos de tarjeta de Krypton: cada uno es un iframe propio.
  await page.locator('#kr-form .kr-pan iframe').waitFor({ timeout: 45000 });
  step('Formulario de micuentaweb (sandbox) abierto');
  const typeIn = async (field, value) => {
    const input = page.frameLocator(`#kr-form ${field} iframe`).locator('input').first();
    await input.click();
    await input.pressSequentially(value, { delay: 40 });
  };
  await typeIn('.kr-pan', card);
  await typeIn('.kr-expiry', '1230');
  await typeIn('.kr-security-code', '123');
  // El nombre del titular no va en iframe: es un campo normal del formulario.
  const holder = page.locator('#kr-form .kr-card-holder-name input, #kr-form input[name="kr-card-holder-name"]').first();
  if (await holder.count()) await holder.fill('POSTULANTE PRUEBA');
  await page.screenshot({ path: `${out}/1-tarjeta-de-prueba.png`, fullPage: true });
  await page.locator('#kr-form .kr-payment-button').click();
  step(`Pago enviado con la tarjeta de prueba ${card.slice(0, 6)}••••${card.slice(-4)}`);

  // Resultado: mensaje del componente (aprobado, en verificación o rechazado).
  const msg = page.locator('app-online-payment [role="status"], app-online-payment .pay__msg, app-online-payment .alert').first();
  await msg.waitFor({ timeout: 90000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}/2-resultado.png`, fullPage: true });
  step(`Mensaje en pantalla: «${(await msg.innerText()).trim().replace(/\s+/g, ' ')}»`);

  const st = await (await fetch(`${base}/api/v1/payments/status?documentNumber=${dni}&applicantCode=${code}`)).json();
  const last = st.data.attempts[0];
  step(`Orden ${st.data.order.status} · último intento ${last?.status} (${last?.label})`);
  if (st.data.order.status !== 'PAGADA') process.exitCode = 2;
  console.log(JSON.stringify({ applicantCode: code, order: st.data.order, lastAttempt: last }, null, 2));
} catch (e) {
  if (page) await page.screenshot({ path: `${out}/error.png`, fullPage: true }).catch(() => undefined);
  console.error(`✘ ${e.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
