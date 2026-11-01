/**
 * Restablece la contraseña de una cuenta del personal: genera una temporal al azar, obliga a cambiarla en el
 * próximo ingreso y pone en cero los intentos fallidos. Conserva el segundo factor (TOTP). La contraseña se
 * guarda en un archivo ignorado por git y no se imprime.
 *   npx tsx --env-file=.env.rds scripts/staff-reset.ts correo [archivo]
 */
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { Argon2Hasher } from '../src/modules/usuarios/infrastructure/argon2-hasher.js';
import { createPrismaClient } from '../src/shared/db/prisma.js';

const [email, file = '.admin-inicial.txt'] = process.argv.slice(2);
if (!email) throw new Error('Indica el correo de la cuenta del personal.');
const ca = process.env['DB_SSL_CA'];
const db = createPrismaClient(process.env['DATABASE_URL'] ?? '', 2, ca ? path.resolve(ca) : undefined);
try {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() }, include: { staff: true } });
  if (!user?.staff) throw new Error(`No existe una cuenta del personal con el correo ${email}.`);
  const password = `Temp-${randomBytes(9).toString('base64url')}`;
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: await new Argon2Hasher().hash(password), failedLoginCount: 0, failedLoginSince: null, lockedUntil: null, status: 'ACTIVE', version: { increment: 1 } } }),
    db.staffProfile.update({ where: { userId: user.id }, data: { mustChangePassword: true } }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);
  writeFileSync(file, `Cuenta del personal: ${user.email}\nCorreo: ${user.email}\nContraseña temporal: ${password}\n(Al ingresar se pide una contraseña nueva. El código TOTP es el mismo de tu app autenticadora.)\nBorra este archivo después de ingresar.\n`);
  console.log(`✔ Contraseña temporal de ${user.email} guardada en ${file}. Intentos fallidos en cero; el TOTP no cambió.`);
} finally {
  await db.$disconnect();
}
