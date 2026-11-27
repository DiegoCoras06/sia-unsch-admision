import { describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import { fixedClock } from '../../src/shared/clock/clock.js';
import type { Db } from '../../src/shared/db/prisma.js';
import { idempotency } from '../../src/shared/reliability/idempotency.js';
import { ReliabilityMetrics } from '../../src/shared/reliability/metrics.js';

const now = new Date('2026-10-25T15:00:00.000Z');

function database(overrides: Record<string, unknown> = {}) {
  const record = {
    create: jest.fn<(input: unknown) => Promise<unknown>>(async () => ({})),
    findUnique: jest.fn<(input: unknown) => Promise<unknown>>(async () => null),
    updateMany: jest.fn<(input: unknown) => Promise<{ count: number }>>(async () => ({ count: 0 })),
    deleteMany: jest.fn<(input: unknown) => Promise<{ count: number }>>(async () => ({ count: 1 })),
    ...overrides,
  };
  return { db: { idempotencyRecord: record } as unknown as Db, record };
}

function context(input: { method?: string; path?: string; key?: string; body?: unknown } = {}) {
  const warn = jest.fn<(fields: unknown, message: string) => void>();
  const req = {
    method: input.method ?? 'POST',
    path: input.path ?? '/api/v1/inscriptions',
    body: input.body ?? { documentNumber: '99900021' },
    get: jest.fn((name: string) => (name === 'Idempotency-Key' ? input.key : undefined)),
    log: { warn },
  } as unknown as Request;
  const headers = new Map<string, string>();
  const originalJson = jest.fn<(body: unknown) => unknown>();
  const response = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return this;
    },
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json: originalJson,
  };
  const res = response as unknown as Response;
  const next = jest.fn<(error?: unknown) => void>() as unknown as NextFunction;
  return { req, res, next, headers, originalJson, warn };
}

async function execute(db: Db, ctx: ReturnType<typeof context>, metrics = new ReliabilityMetrics()) {
  const middleware = idempotency(db, fixedClock(now), metrics);
  await Promise.resolve(middleware(ctx.req, ctx.res, ctx.next));
  return metrics;
}

const stored = (changes: Record<string, unknown> = {}) => ({
  id: 'record-1',
  requestHash: 'different-hash',
  state: 'PROCESSING',
  statusCode: null,
  response: null,
  lockedAt: new Date(now.getTime() - 30_000),
  expiresAt: new Date(now.getTime() + 60_000),
  ...changes,
});

describe('Idempotency-Key', () => {
  it('omite lecturas, rutas no protegidas y escrituras sin clave', async () => {
    for (const input of [
      { method: 'GET', path: '/api/v1/inscriptions', key: 'valid-key' },
      { method: 'POST', path: '/api/v1/other', key: 'valid-key' },
      { method: 'POST', path: '/api/v1/inscriptions' },
    ]) {
      const { db, record } = database();
      const ctx = context(input);
      await execute(db, ctx);
      expect(ctx.next).toHaveBeenCalledWith();
      expect(record.create).not.toHaveBeenCalled();
    }
  });

  it('rechaza claves inseguras antes de tocar la base', async () => {
    const { db, record } = database();
    const ctx = context({ key: 'corta' });
    await execute(db, ctx);
    expect(record.create).not.toHaveBeenCalled();
    expect(ctx.next).toHaveBeenCalledWith(expect.objectContaining({ status: 400, code: 'INVALID_IDEMPOTENCY_KEY' }));
  });

  it('adquiere una clave nueva y conserva una sola respuesta exitosa', async () => {
    const { db, record } = database();
    const ctx = context({ key: 'inscription:new-1' });
    const metrics = await execute(db, ctx);
    expect(ctx.headers.get('Idempotency-Key')).toBe('inscription:new-1');
    expect(ctx.next).toHaveBeenCalledWith();

    ctx.res.status(201).json({ data: { applicantCode: '27000001' } });
    ctx.res.json({ data: { applicantCode: 'duplicado' } });
    await new Promise((resolve) => setImmediate(resolve));

    expect(record.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { scope: 'POST /api/v1/inscriptions', key: 'inscription:new-1', state: 'PROCESSING' },
        data: expect.objectContaining({ state: 'COMPLETED', statusCode: 201 }),
      }),
    );
    expect(ctx.originalJson).toHaveBeenCalledTimes(1);
    expect(metrics.snapshot().idempotency.acquired).toBe(1);
  });

  it('libera la clave si la operación responde 5xx y registra sin interrumpir un fallo de persistencia', async () => {
    const persistError = new Error('base temporalmente no disponible');
    const { db, record } = database({ deleteMany: jest.fn(async () => Promise.reject(persistError)) });
    const ctx = context({ key: 'payment:error-1', path: '/api/v1/payments/charge' });
    await execute(db, ctx);
    ctx.res.status(503).json({ error: 'indisponible' });
    await new Promise((resolve) => setImmediate(resolve));

    expect(record.deleteMany).toHaveBeenCalledWith({
      where: { scope: 'POST /api/v1/payments/charge', key: 'payment:error-1' },
    });
    expect(ctx.warn).toHaveBeenCalledWith(
      expect.objectContaining({ err: persistError, scope: 'POST /api/v1/payments/charge' }),
      'no se pudo guardar la respuesta idempotente',
    );
    expect(ctx.originalJson).toHaveBeenCalledWith({ error: 'indisponible' });
  });

  it('propaga el error de creación cuando no puede consultar un registro existente', async () => {
    const createError = new Error('conexión perdida');
    const { db } = database({
      create: jest.fn(async () => Promise.reject(createError)),
      findUnique: jest.fn(async () => Promise.reject(new Error('consulta fallida'))),
    });
    const ctx = context({ key: 'inscription:db-1' });
    await execute(db, ctx);
    expect(ctx.next).toHaveBeenCalledWith(createError);
  });

  it('rechaza reutilizar la clave con datos distintos', async () => {
    const { db } = database({
      create: jest.fn(async () => Promise.reject(new Error('duplicada'))),
      findUnique: jest.fn(async () => stored()),
    });
    const ctx = context({ key: 'inscription:conflict-1' });
    const metrics = await execute(db, ctx);
    expect(ctx.next).toHaveBeenCalledWith(expect.objectContaining({ status: 409, code: 'IDEMPOTENCY_CONFLICT' }));
    expect(metrics.snapshot().idempotency.conflicts).toBe(1);
  });

  it('reproduce una respuesta completada con la misma solicitud', async () => {
    const firstDb = database();
    const first = context({ key: 'inscription:replay-1' });
    await execute(firstDb.db, first);
    const requestHash = (firstDb.record.create.mock.calls[0]![0] as { data: { requestHash: string } }).data.requestHash;

    const { db } = database({
      create: jest.fn(async () => Promise.reject(new Error('duplicada'))),
      findUnique: jest.fn(async () =>
        stored({ requestHash, state: 'COMPLETED', statusCode: 201, response: { data: { applicantCode: '27000001' } } }),
      ),
    });
    const replay = context({ key: 'inscription:replay-1' });
    const metrics = await execute(db, replay);
    expect(replay.headers.get('Idempotency-Replayed')).toBe('true');
    expect(replay.res.statusCode).toBe(201);
    expect(replay.originalJson).toHaveBeenCalledWith({ data: { applicantCode: '27000001' } });
    expect(metrics.snapshot().idempotency.replayed).toBe(1);
  });

  it('reclama registros expirados y operaciones abandonadas por timeout', async () => {
    const seed = database();
    const seedContext = context({ key: 'inscription:claim-1' });
    await execute(seed.db, seedContext);
    const requestHash = (seed.record.create.mock.calls[0]![0] as { data: { requestHash: string } }).data.requestHash;

    for (const current of [
      stored({ requestHash, expiresAt: new Date(now.getTime() - 1) }),
      stored({ requestHash, lockedAt: new Date(now.getTime() - 121_000) }),
    ]) {
      const { db, record } = database({
        create: jest.fn(async () => Promise.reject(new Error('duplicada'))),
        findUnique: jest.fn(async () => current),
        updateMany: jest.fn(async () => ({ count: 1 })),
      });
      const ctx = context({ key: 'inscription:claim-1' });
      const metrics = await execute(db, ctx);
      expect(record.updateMany).toHaveBeenCalled();
      expect(ctx.next).toHaveBeenCalledWith();
      expect(metrics.snapshot().idempotency.acquired).toBe(1);
    }
  });

  it('indica Retry-After cuando otra solicitud conserva el bloqueo o gana la reclamación', async () => {
    const seed = database();
    const seedContext = context({ key: 'inscription:busy-1' });
    await execute(seed.db, seedContext);
    const requestHash = (seed.record.create.mock.calls[0]![0] as { data: { requestHash: string } }).data.requestHash;
    const { db } = database({
      create: jest.fn(async () => Promise.reject(new Error('duplicada'))),
      findUnique: jest.fn(async () => stored({ requestHash })),
    });
    const ctx = context({ key: 'inscription:busy-1' });
    const metrics = await execute(db, ctx);
    expect(ctx.headers.get('Retry-After')).toBe('2');
    expect(ctx.next).toHaveBeenCalledWith(expect.objectContaining({ status: 409, code: 'IDEMPOTENCY_IN_PROGRESS' }));
    expect(metrics.snapshot().idempotency.inProgress).toBe(1);
  });
});
