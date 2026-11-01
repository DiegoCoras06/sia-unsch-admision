import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * URL para la CLI de Prisma (migraciones). Con DB_SSL_CA (RDS) se exige SSL y se verifica el certificado
 * del servidor: parámetros sslmode/sslcert/sslaccept del motor de esquemas de Prisma.
 * En Windows el motor usa SChannel, que solo toma el primer certificado de un bundle; por eso
 * DB_SSL_ROOT_CERT apunta a la raíz única de la región (p. ej. certs/rds-us-east-2-root.pem).
 */
function migrationUrl(): string {
  const url = process.env['DATABASE_URL'] ?? 'postgresql://sia:sia_local_dev@127.0.0.1:5433/sia';
  const ca = process.env['DB_SSL_ROOT_CERT'] ?? process.env['DB_SSL_CA'];
  if (!ca) return url;
  const u = new URL(url);
  u.searchParams.set('sslmode', 'require');
  u.searchParams.set('sslcert', path.resolve(import.meta.dirname, ca));
  u.searchParams.set('sslaccept', 'strict');
  return u.toString();
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/index.ts',
  },
  datasource: { url: migrationUrl() },
});
