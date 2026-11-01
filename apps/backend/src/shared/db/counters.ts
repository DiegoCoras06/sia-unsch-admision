import type { Db, Tx } from './prisma.js';

/** Secuencia atómica con nombre (`shared.counters`): número de caso, código de postulante, etc. */
export async function nextCounterValue(client: Db | Tx, key: string, firstValue: number): Promise<number> {
  const rows = await client.$queryRaw<{ value: number }[]>`
    INSERT INTO "shared"."counters" ("key", "value") VALUES (${key}, ${firstValue})
    ON CONFLICT ("key") DO UPDATE SET "value" = "counters"."value" + 1
    RETURNING "value"`;
  return Number(rows[0]!.value);
}
