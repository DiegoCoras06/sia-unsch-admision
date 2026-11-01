/**
 * Comprueba las llaves de Culqi (ADR-019) de apps/backend/.env.rds: formato y una consulta de solo lectura
 * a la API de cargos con la llave secreta. No cobra nada ni imprime claves.
 *   tsx scripts/culqi.ts
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(backendDir, process.argv[2] ?? '.env.rds');
if (!existsSync(envFile)) {
  console.error(`Falta ${path.relative(backendDir, envFile)}.`);
  process.exit(1);
}
config({ path: envFile, override: true, quiet: true });
const pk = process.env['CULQI_PUBLIC_KEY']?.trim() ?? '';
const sk = process.env['CULQI_SECRET_KEY']?.trim() ?? '';
if (!/^pk_(test|live)_/.test(pk) || !/^sk_(test|live)_/.test(sk)) {
  console.error(`Faltan o no tienen el formato correcto en ${path.basename(envFile)}: CULQI_PUBLIC_KEY (pk_test_…) y CULQI_SECRET_KEY (sk_test_…). CulqiPanel > Desarrollo > API Keys.`);
  process.exit(1);
}
if (pk.split('_')[1] !== sk.split('_')[1]) {
  console.error('Las llaves son de ambientes distintos (una test y otra live). Usa las dos del mismo ambiente.');
  process.exit(1);
}
const env = sk.startsWith('sk_live') ? 'producción' : 'pruebas';
const api = (process.env['CULQI_API_URL'] ?? 'https://api.culqi.com').replace(/\/$/, '');
const res = await fetch(`${api}/v2/charges?limit=1`, { headers: { Authorization: `Bearer ${sk}`, Accept: 'application/json' } });
if (res.ok) {
  console.log(`Culqi ${env}: llave secreta aceptada (${pk.slice(0, 8)}••• / ${sk.slice(0, 8)}•••). Yape quedará disponible al reiniciar la API.`);
} else {
  const body = (await res.json().catch(() => ({}))) as { merchant_message?: string; user_message?: string };
  console.error(`Culqi respondió ${res.status}: ${body.merchant_message ?? body.user_message ?? 'sin detalle'}. Revisa la llave secreta.`);
  process.exit(1);
}
