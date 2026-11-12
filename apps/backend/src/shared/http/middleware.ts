import { createHmac, randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import type { Logger } from 'pino';
import type { ApiErrorBody } from '@sia/contracts';
import { AppError } from './errors.js';
import { DB_RETRY_AFTER_SECONDS, isDatabaseUnreachable } from '../db/unreachable.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      log: Logger;
      /** IP con HMAC: sirve para límites de uso y auditoría sin guardar la IP (RNF-03). */
      ipHash: string;
    }
  }
}

export function requestContext(logger: Logger, hmacSecret: string): RequestHandler {
  return (req, res, next) => {
    req.requestId = randomUUID().replace(/-/g, '').slice(0, 16);
    req.ipHash = createHmac('sha256', hmacSecret).update(req.ip ?? 'desconocida').digest('hex');
    req.log = logger.child({ requestId: req.requestId });
    res.setHeader('X-Request-Id', req.requestId);
    const started = performance.now();
    res.on('finish', () => {
      req.log.info(
        { method: req.method, path: req.originalUrl.split('?')[0], status: res.statusCode, ms: Math.round(performance.now() - started) },
        'solicitud',
      );
    });
    next();
  };
}

/** Envuelve controladores async para que los errores lleguen al manejador central. */
export const handle =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/**
 * Caché de respuestas públicas (ADR-020). El navegador guarda poco tiempo, para que los cambios del panel se vean pronto;
 * CloudFront guarda `seconds` y, al vencer, sigue sirviendo la copia anterior mientras una sola petición la renueva
 * (`stale-while-revalidate`), así un pico de visitas no llega en bloque a la base de datos.
 */
export function publicCache(seconds: number, browserSeconds = Math.min(seconds, 60)): RequestHandler {
  return (_req, res, next) => {
    res.setHeader('Cache-Control', `public, max-age=${browserSeconds}, s-maxage=${seconds}, stale-while-revalidate=${seconds}`);
    next();
  };
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `No existe la ruta ${req.method} ${req.path}.`));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    if (err.status === 429 && typeof err.extra['retryAfter'] === 'number') {
      res.setHeader('Retry-After', String(err.extra['retryAfter']));
    }
    const { retryAfter: _omit, ...extra } = err.extra;
    res.status(err.status).json({ error: { code: err.code, message: err.message, requestId: req.requestId, ...extra } } satisfies ApiErrorBody);
    return;
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'El cuerpo no es JSON válido.', requestId: req.requestId } } satisfies ApiErrorBody);
    return;
  }
  if (isDatabaseUnreachable(err)) {
    // La base de datos no responde: no es un error del programa. Aviso breve en el registro, sin la traza completa.
    req.log?.warn({ path: req.path }, 'base de datos no disponible');
    res.setHeader('Retry-After', String(DB_RETRY_AFTER_SECONDS));
    res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'El servicio no está disponible por un momento. Inténtalo de nuevo en unos segundos.', requestId: req.requestId } } satisfies ApiErrorBody);
    return;
  }
  req.log?.error({ err }, 'error no controlado');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado. Inténtalo más tarde.', requestId: req.requestId } } satisfies ApiErrorBody);
};
