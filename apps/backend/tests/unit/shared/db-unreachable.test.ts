import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { isDatabaseUnreachable } from '../../../src/shared/db/unreachable.js';
import { errorHandler } from '../../../src/shared/http/middleware.js';

// Forma del error que entrega Prisma cuando no llega a RDS (copiada del registro, sin datos del servidor).
const unreachable = { name: 'PrismaClientKnownRequestError', meta: { driverAdapterError: { cause: { kind: 'DatabaseNotReachable' } } } };

describe('base de datos no disponible', () => {
  it('reconoce la caída de conexión por el tipo del adaptador o por el código de Prisma', () => {
    expect(isDatabaseUnreachable(unreachable)).toBe(true);
    expect(isDatabaseUnreachable({ code: 'P1001' })).toBe(true);
    expect(isDatabaseUnreachable({ code: 'P2024' })).toBe(true);
    expect(isDatabaseUnreachable({ code: 'P2002' })).toBe(false);
    expect(isDatabaseUnreachable(new Error('otra cosa'))).toBe(false);
    expect(isDatabaseUnreachable(null)).toBe(false);
  });

  it('responde 503 con Retry-After en lugar de 500', async () => {
    const app = express();
    app.get('/x', (_req, _res, next) => next(unreachable));
    app.get('/y', (_req, _res, next) => next(new Error('fallo del programa')));
    app.use(errorHandler);

    const down = await request(app).get('/x');
    expect(down.status).toBe(503);
    expect(down.headers['retry-after']).toBe('10');
    expect(down.body.error.code).toBe('SERVICE_UNAVAILABLE');

    const bug = await request(app).get('/y');
    expect(bug.status).toBe(500);
    expect(bug.body.error.code).toBe('INTERNAL_ERROR');
  });
});
