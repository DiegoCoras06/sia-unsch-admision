/**
 * Comprueba las credenciales de Izipay micuentaweb (API REST V4) de apps/backend/.env.rds pidiendo un
 * formToken de prueba. No cobra nada ni imprime claves.
 *   tsx scripts/micuentaweb.ts [.env.rds | .env]
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { MiCuentaWebGateway, parseKrAnswer, signKrAnswer } from '../src/modules/pagos/infrastructure/micuentaweb-gateway.js';
import { newTransactionId } from '../src/modules/pagos/domain/payment-rules.js';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(backendDir, process.argv[2] ?? '.env.rds');
if (!existsSync(envFile)) {
  console.error(`Falta ${path.relative(backendDir, envFile)}.`);
  process.exit(1);
}
config({ path: envFile, override: true, quiet: true });
const e = process.env;
const keys = ['MICUENTAWEB_SHOP_ID', 'MICUENTAWEB_PASSWORD', 'MICUENTAWEB_PUBLIC_KEY', 'MICUENTAWEB_HMAC_KEY'];
const missing = keys.filter((k) => !e[k]?.trim());
if (missing.length) {
  console.error(`Faltan en ${path.basename(envFile)}: ${missing.join(', ')} (Back Office > Configuración > Tienda > Claves de API REST).`);
  process.exit(1);
}
const shopId = e['MICUENTAWEB_SHOP_ID']!.trim();
const password = e['MICUENTAWEB_PASSWORD']!.trim();
const publicKey = e['MICUENTAWEB_PUBLIC_KEY']!.trim();
const hmacKey = e['MICUENTAWEB_HMAC_KEY']!.trim();
const environment = e['MICUENTAWEB_ENV'] === 'production' ? 'production' : 'sandbox';
const ok = (m: string) => console.log(`✔ ${m}`);
const bad = (m: string) => { console.error(`✘ ${m}`); process.exitCode = 1; };

// Coherencia de las claves (sin mostrarlas).
if (!publicKey.startsWith(`${shopId}:`)) bad('La clave pública no empieza con el identificador de la tienda seguido de «:».');
if (environment === 'sandbox' && !password.startsWith('testpassword_')) bad('En pruebas, la contraseña debe ser la «Contraseña de test» (empieza con testpassword_).');
if (environment === 'sandbox' && !publicKey.includes(':testpublickey_')) bad('En pruebas, la clave pública debe ser la «Clave pública de test».');

const gw = new MiCuentaWebGateway({ environment, shopId, password, publicKey, hmacKey, apiUrl: e['MICUENTAWEB_API_URL'] });
try {
  const s = await gw.createCheckout({
    transactionId: newTransactionId(new Date()), orderNumber: `CHK${String(Date.now()).slice(-9)}`, amount: '1.00', currency: 'PEN', createdAt: new Date(),
    buyer: { applicantCode: '00000000', firstNames: 'Prueba', surnames: 'Conexión', email: 'prueba@example.com', mobile: '999999999', address: 'Jr. Arequipa 175', city: 'Ayacucho', state: 'Ayacucho', documentType: 'DNI', documentNumber: '00000000' },
  });
  ok(`Tienda ${shopId.slice(0, 3)}••• (${environment}): la API REST aceptó la contraseña y devolvió un formToken de ${s.authorization.length} caracteres.`);
} catch (err) {
  bad(`La API REST rechazó la solicitud: ${(err as Error).message}`);
}
// La clave HMAC solo se puede probar con una respuesta real; aquí se comprueba que firme y verifique en ida y vuelta.
const sample = JSON.stringify({ orderStatus: 'PAID', orderDetails: { orderId: 'X', orderTotalAmount: 100, orderCurrency: 'PEN' }, transactions: [{ metadata: { transactionId: 'T' } }] });
const verified = gw.verify({ transactionId: 'T', payloadHttp: sample, signature: signKrAnswer(sample, hmacKey), code: 'sha256_hmac' });
if (verified && parseKrAnswer(JSON.parse(sample), 'T').approved) ok('Firma HMAC-SHA-256 de la respuesta: verificación local correcta.');
else bad('No se pudo verificar la firma HMAC de ejemplo.');
