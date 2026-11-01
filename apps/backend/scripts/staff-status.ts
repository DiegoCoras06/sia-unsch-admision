/**
 * Estado de las cuentas del personal (solo lectura, sin contraseñas ni claves): bloqueo, intentos fallidos,
 * cambio de contraseña pendiente y segundo factor.
 *   npx tsx --env-file=.env.rds scripts/staff-status.ts
 */
import path from 'node:path';
import { createPrismaClient } from '../src/shared/db/prisma.js';

const ca = process.env['DB_SSL_CA'];
const db = createPrismaClient(process.env['DATABASE_URL'] ?? '', 2, ca ? path.resolve(ca) : undefined);
try {
  const rows = await db.user.findMany({ where: { type: 'STAFF' }, include: { staff: true }, orderBy: { createdAt: 'asc' } });
  const now = Date.now();
  for (const u of rows) {
    console.log([
      u.email, `estado ${u.status}`, `intentos fallidos ${u.failedLoginCount}`,
      u.lockedUntil && u.lockedUntil.getTime() > now ? `BLOQUEADA hasta ${u.lockedUntil.toISOString()}` : 'sin bloqueo',
      u.staff?.mustChangePassword ? 'debe cambiar contraseña' : 'contraseña ya cambiada',
      u.staff?.mfaEnabledAt ? 'TOTP activo' : 'TOTP sin activar',
      `último ingreso ${u.lastLoginAt?.toISOString() ?? 'nunca'}`,
    ].join(' · '));
  }
} finally {
  await db.$disconnect();
}
