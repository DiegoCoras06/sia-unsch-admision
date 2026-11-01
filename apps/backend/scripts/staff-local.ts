/**
 * Crea (o reinicia) un usuario del personal con TOTP activo, SOLO en la base local, para los E2E que exigen
 * dos personas distintas (p. ej. procesar y aprobar resultados). Guarda las credenciales en un archivo ignorado por git.
 * Uso: npx tsx --env-file=.env scripts/staff-local.ts ROL correo archivo
 */
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { SecretBox, totpService } from '../src/modules/seguridad/index.js';
import { Argon2Hasher } from '../src/modules/usuarios/infrastructure/argon2-hasher.js';
import { createPrismaClient } from '../src/shared/db/prisma.js';

const [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'] = process.argv.slice(2);
const url = process.env['DATABASE_URL'] ?? '';
if (!/@(127\.0\.0\.1|localhost):/.test(url)) throw new Error('Este script solo se ejecuta contra la base LOCAL.');
const key = process.env['STAFF_SECRET_KEY'] ?? `staff:${process.env['HMAC_SECRET']}`;

const db = createPrismaClient(url, 2);
try {
  const password = `Local-${randomBytes(9).toString('base64url')}`;
  const secret = totpService.newSecret();
  const hash = await new Argon2Hasher().hash(password);
  const user = await db.user.upsert({ where: { email }, create: { email, passwordHash: hash, type: 'STAFF', status: 'ACTIVE' }, update: { passwordHash: hash, status: 'ACTIVE' } });
  const profile = { fullName: `Comisión local (${role})`, mustChangePassword: false, mfaSecretEnc: new SecretBox(key).seal(secret), mfaEnabledAt: new Date() };
  await db.staffProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...profile }, update: profile });
  const r = await db.role.findUniqueOrThrow({ where: { code: role } });
  await db.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: r.id } }, create: { userId: user.id, roleId: r.id }, update: {} });
  writeFileSync(file, `Personal LOCAL de pruebas (${role})\nCorreo: ${email}\nContraseña actual: ${password}\nClave TOTP: ${secret}\n`);
  console.log(`✔ ${email} (${role}) listo; credenciales en ${file}`);
} finally {
  await db.$disconnect();
}
