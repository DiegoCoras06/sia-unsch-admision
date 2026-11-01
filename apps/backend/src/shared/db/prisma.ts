import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

export type Db = PrismaClient;
/** Cliente dentro de una transacción interactiva. */
export type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/**
 * Cliente único por proceso. En Lambda se limita a 1 conexión por instancia (ADR-005);
 * en local, un pool pequeño. Con `sslCaPath` (RDS) la conexión exige SSL y verifica
 * el certificado del servidor contra el bundle oficial de AWS (equivalente a sslmode=verify-full).
 */
export function createPrismaClient(databaseUrl: string, maxConnections: number, sslCaPath?: string): PrismaClient {
  if (!sslCaPath) {
    return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl, max: maxConnections }) });
  }
  const url = new URL(databaseUrl);
  const adapter = new PrismaPg({
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, '') || 'postgres',
    max: maxConnections,
    ssl: { ca: readFileSync(sslCaPath, 'utf8'), rejectUnauthorized: true, servername: url.hostname },
  });
  return new PrismaClient({ adapter });
}
