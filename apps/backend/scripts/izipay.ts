/**
 * Comprueba las credenciales de Izipay (ADR-016) de apps/backend/.env.rds pidiendo un token de sesión
 * de prueba al ambiente configurado. No cobra nada ni imprime claves.
 *   tsx scripts/izipay.ts
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { IzipayPaymentGateway } from '../src/modules/pagos/infrastructure/izipay-gateway.js';
import { newTransactionId } from '../src/modules/pagos/domain/payment-rules.js';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(backendDir, process.argv[2] ?? '.env.rds');
if (!existsSync(envFile)) {
  console.error(`Falta ${path.relative(backendDir, envFile)}.`);
  process.exit(1);
}
config({ path: envFile, override: true, quiet: true });
const e = process.env;
const missing = ['IZIPAY_MERCHANT_CODE', 'IZIPAY_API_KEY', 'IZIPAY_HASH_KEY'].filter((k) => !e[k]?.trim());
if (missing.length) {
  console.error(`Faltan en ${path.basename(envFile)}: ${missing.join(', ')} (Panel de comercio > Desarrolladores > Claves). Guarda el archivo y vuelve a ejecutar.`);
  process.exit(1);
}
const environment = e['IZIPAY_ENV'] === 'production' ? 'production' : 'sandbox';
console.log(`Izipay ${environment}: comercio ${e['IZIPAY_MERCHANT_CODE']!.slice(0, 3)}•••, clave pública RSA ${e['IZIPAY_PUBLIC_KEY']?.trim() ? 'presente' : 'ausente (se usará "RSA")'}`);

const gw = new IzipayPaymentGateway({
  environment,
  apiUrl: e['IZIPAY_API_URL'],
  merchantCode: e['IZIPAY_MERCHANT_CODE']!.trim(),
  apiKey: e['IZIPAY_API_KEY']!.trim(),
  hashKey: e['IZIPAY_HASH_KEY']!.trim(),
  rsaPublicKey: e['IZIPAY_PUBLIC_KEY'],
});
try {
  const s = await gw.createCheckout({
    transactionId: newTransactionId(new Date()),
    orderNumber: `CHK${String(Date.now()).slice(-9)}`,
    amount: '1.00',
    currency: 'PEN',
    createdAt: new Date(),
    buyer: {
      applicantCode: '00000000', firstNames: 'PRUEBA', surnames: 'CONEXION', email: 'prueba@example.com', mobile: '999999999',
      address: 'Jr. Arequipa 175', city: 'Huamanga', state: 'Ayacucho', documentType: 'DNI', documentNumber: '00000000',
    },
  });
  console.log(`✔ Token de sesión generado (${s.authorization.length} caracteres). Credenciales correctas.`);
  console.log(`  Activa la pasarela con PAYMENTS_PROVIDER=izipay en ${path.basename(envFile)} y reinicia la API.`);
} catch (error) {
  console.error(`✘ ${(error as Error).message}`);
  console.error('  Revisa el código de comercio y la clave de API del nuevo botón de pagos, y que correspondan al ambiente (sandbox / producción).');
  process.exitCode = 1;
}
