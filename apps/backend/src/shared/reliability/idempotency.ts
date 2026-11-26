import { createHash } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Clock } from '../clock/clock.js';
import type { Db } from '../db/prisma.js';
import { AppError } from '../http/errors.js';
import type { ReliabilityMetrics } from './metrics.js';

const KEY = /^[A-Za-z0-9._:-]{8,100}$/;
const PROCESSING_TIMEOUT_MS = 2 * 60_000;
const TTL_MS = 24 * 60 * 60_000;

/** Solo operaciones de escritura cuyo resultado es seguro de conservar y repetir. */
const SCOPES = new Set(['POST /api/v1/inscriptions', 'POST /api/v1/payments/session', 'POST /api/v1/payments/charge']);

const digest = (value: unknown) =>
  createHash('sha256')
    .update(JSON.stringify(value ?? null))
    .digest('hex');

/**
 * Implementa `Idempotency-Key` sin guardar el cuerpo de la solicitud. La primera respuesta JSON queda persistida;
 * una repetición idéntica la recibe con `Idempotency-Replayed: true` y no vuelve a ejecutar el caso de uso.
 */
export function idempotency(db: Db, clock: Clock, metrics: ReliabilityMetrics): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const scope = `${req.method} ${req.path}`;
    const raw = req.get('Idempotency-Key');
    if (!SCOPES.has(scope) || !raw) return next();
    const key = raw.trim();
    if (!KEY.test(key))
      return next(
        new AppError(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key debe tener entre 8 y 100 caracteres seguros.'),
      );

    const requestHash = digest(req.body);
    const now = clock.now();
    const expiresAt = new Date(now.getTime() + TTL_MS);
    let acquired = false;
    try {
      await db.idempotencyRecord.create({
        data: { scope, key, requestHash, state: 'PROCESSING', lockedAt: now, expiresAt },
      });
      acquired = true;
    } catch (createError) {
      const current = await db.idempotencyRecord.findUnique({ where: { scope_key: { scope, key } } }).catch(() => null);
      if (!current) return next(createError);
      if (current.expiresAt <= now) {
        const claimed = await db.idempotencyRecord.updateMany({
          where: { id: current.id, expiresAt: { lte: now } },
          data: { requestHash, state: 'PROCESSING', statusCode: null, lockedAt: now, expiresAt },
        });
        acquired = claimed.count === 1;
      } else if (current.requestHash !== requestHash) {
        metrics.recordIdempotency('conflicts');
        return next(
          new AppError(409, 'IDEMPOTENCY_CONFLICT', 'La misma Idempotency-Key ya fue usada con otros datos.'),
        );
      } else if (current.state === 'COMPLETED' && current.statusCode && current.response !== null) {
        metrics.recordIdempotency('replayed');
        res.setHeader('Idempotency-Replayed', 'true');
        return res.status(current.statusCode).json(current.response);
      } else if (now.getTime() - current.lockedAt.getTime() >= PROCESSING_TIMEOUT_MS) {
        const claimed = await db.idempotencyRecord.updateMany({
          where: { id: current.id, state: 'PROCESSING', lockedAt: current.lockedAt },
          data: { lockedAt: now, expiresAt },
        });
        acquired = claimed.count === 1;
      }
    }

    if (!acquired) {
      metrics.recordIdempotency('inProgress');
      res.setHeader('Retry-After', '2');
      return next(
        new AppError(409, 'IDEMPOTENCY_IN_PROGRESS', 'La operación con esta Idempotency-Key todavía está en proceso.'),
      );
    }

    metrics.recordIdempotency('acquired');
    res.setHeader('Idempotency-Key', key);
    const originalJson = res.json.bind(res);
    let sent = false;
    res.json = ((body: unknown) => {
      if (sent) return res;
      sent = true;
      const persist =
        res.statusCode >= 500
          ? db.idempotencyRecord.deleteMany({ where: { scope, key } })
          : db.idempotencyRecord.updateMany({
              where: { scope, key, state: 'PROCESSING' },
              data: { state: 'COMPLETED', statusCode: res.statusCode, response: body as object, lockedAt: clock.now() },
            });
      void persist
        .catch((error: unknown) => req.log.warn({ err: error, scope }, 'no se pudo guardar la respuesta idempotente'))
        .finally(() => originalJson(body));
      return res;
    }) as Response['json'];
    return next();
  };
}
