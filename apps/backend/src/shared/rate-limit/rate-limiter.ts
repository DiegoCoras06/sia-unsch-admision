import type { Db } from '../db/prisma.js';
import type { Clock } from '../clock/clock.js';
import { tooManyRequests } from '../http/errors.js';

/**
 * Límite de uso con ventana fija y contador en PostgreSQL (research R-08 de 001): sin Redis
 * y compartido entre instancias de Lambda.
 */
export class RateLimiter {
  constructor(private readonly db: Db, private readonly clock: Clock) {}

  /** Cuenta un intento; si supera el límite lanza 429 con Retry-After. */
  async consume(key: string, limit: number, windowSeconds: number): Promise<void> {
    const count = await this.hit(key, windowSeconds);
    if (count > limit) throw tooManyRequests(this.secondsToWindowEnd(windowSeconds));
  }

  /** Cuenta sin lanzar; devuelve el total de la ventana. */
  async hit(key: string, windowSeconds: number): Promise<number> {
    const windowStart = this.windowStart(windowSeconds);
    const rows = await this.db.$queryRaw<{ count: number }[]>`
      INSERT INTO "shared"."rate_limit_counters" ("key", "window_start", "count")
      VALUES (${key}, ${windowStart}, 1)
      ON CONFLICT ("key", "window_start") DO UPDATE SET "count" = "rate_limit_counters"."count" + 1
      RETURNING "count"`;
    return Number(rows[0]?.count ?? 1);
  }

  async peek(key: string, windowSeconds: number): Promise<number> {
    const row = await this.db.rateLimitCounter.findUnique({
      where: { key_windowStart: { key, windowStart: this.windowStart(windowSeconds) } },
    });
    return row?.count ?? 0;
  }

  async purgeOlderThan(hours: number): Promise<number> {
    const { count } = await this.db.rateLimitCounter.deleteMany({
      where: { windowStart: { lt: new Date(this.clock.now().getTime() - hours * 3_600_000) } },
    });
    return count;
  }

  private windowStart(windowSeconds: number): Date {
    const ms = windowSeconds * 1000;
    return new Date(Math.floor(this.clock.now().getTime() / ms) * ms);
  }

  private secondsToWindowEnd(windowSeconds: number): number {
    const ms = windowSeconds * 1000;
    const now = this.clock.now().getTime();
    return Math.max(1, Math.ceil((Math.floor(now / ms) * ms + ms - now) / 1000));
  }
}
