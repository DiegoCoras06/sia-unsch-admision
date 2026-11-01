/**
 * Comprueba el token de apiperu.dev (RENIEC) con un DNI que indiques (de preferencia el tuyo).
 * No imprime nombres completos: solo si hubo coincidencia y las iniciales.
 *   npx tsx --env-file=.env.rds scripts/apiperu.ts 12345678
 */
import { ApiPeruIdentityProvider } from '../src/modules/usuarios/infrastructure/apiperu-identity-provider.js';

const dni = process.argv[2] ?? '';
const token = process.env['APIPERU_TOKEN']?.trim();
if (!/^\d{8}$/.test(dni)) throw new Error('Indica un DNI de 8 dígitos: npx tsx --env-file=.env.rds scripts/apiperu.ts 12345678');
if (!token) throw new Error('Falta APIPERU_TOKEN en el archivo .env.');
const r = await new ApiPeruIdentityProvider(token, process.env['APIPERU_URL']).lookupDni(dni);
const ini = (s: string) => s.split(/\s+/).map((w) => `${w[0] ?? ''}.`).join(' ');
if (r.kind === 'MATCHED') console.log(`✔ apiperu.dev respondió: coincide (${ini(r.firstNames)} ${ini(r.paternalSurname)} ${ini(r.maternalSurname)}).`);
else if (r.kind === 'NOT_MATCHED') console.log('✘ El token funciona, pero ese DNI no tiene datos (o el token no tiene permiso para consultarlo).');
else { console.log('✘ apiperu.dev no respondió o rechazó el token. Revisa APIPERU_TOKEN.'); process.exitCode = 1; }
