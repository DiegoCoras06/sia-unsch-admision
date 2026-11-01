/**
 * Cambia la raya «—» por el guion «-» en los textos guardados en la base (cronograma, categorías, contenidos,
 * asistente…). Sin `--aplicar` solo cuenta. No toca registros históricos (auditoría, outbox, consentimientos,
 * correos enviados, conversaciones).
 *   npx tsx --env-file=.env.rds scripts/sin-rayas.ts            (cuenta)
 *   npx tsx --env-file=.env.rds scripts/sin-rayas.ts --aplicar  (cambia)
 */
import path from 'node:path';
import { createPrismaClient } from '../src/shared/db/prisma.js';

const apply = process.argv.includes('--aplicar');
// Históricos que no se reescriben: auditoría, eventos, texto de consentimiento aceptado (tiene huella), correos enviados y conversaciones.
const SKIP = /audit|outbox|rate_limit|_prisma_migrations|consent_documents|^notifications$|^messages$/i;
const ca = process.env['DB_SSL_CA'];
const db = createPrismaClient(process.env['DATABASE_URL'] ?? '', 2, ca ? path.resolve(ca) : undefined);
const q = (id: string) => `"${id.replace(/"/g, '""')}"`;

try {
  const cols = await db.$queryRaw<{ table_schema: string; table_name: string; column_name: string; data_type: string }[]>`
    SELECT c.table_schema, c.table_name, c.column_name, c.data_type
    FROM information_schema.columns c
    JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
    WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
      AND c.data_type IN ('text', 'character varying', 'jsonb', 'json')`;
  let total = 0;
  for (const c of cols) {
    if (SKIP.test(c.table_name)) continue;
    const table = `${q(c.table_schema)}.${q(c.table_name)}`;
    const col = q(c.column_name);
    const asText = c.data_type.startsWith('json') ? `${col}::text` : col;
    const [row] = await db.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*) AS n FROM ${table} WHERE ${asText} LIKE '%—%'`);
    const n = row?.n ?? 0n;
    if (!Number(n)) continue;
    total += Number(n);
    console.log(`${c.table_schema}.${c.table_name}.${c.column_name}: ${n} fila(s)`);
    if (apply) {
      const value = c.data_type.startsWith('json')
        ? `replace(replace(${col}::text, ' — ', ' - '), '—', '-')::${c.data_type}`
        : `replace(replace(${col}, ' — ', ' - '), '—', '-')`;
      await db.$executeRawUnsafe(`UPDATE ${table} SET ${col} = ${value} WHERE ${asText} LIKE '%—%'`);
    }
  }
  console.log(apply ? `Listo: ${total} fila(s) actualizadas.` : `Encontradas ${total} fila(s). Ejecuta con --aplicar para cambiarlas.`);
} finally {
  await db.$disconnect();
}
