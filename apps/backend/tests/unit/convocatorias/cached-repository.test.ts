import { describe, expect, it, jest } from '@jest/globals';
import type { ConvocatoriasRepository } from '../../../src/modules/convocatorias/domain/ports.js';
import { CachedConvocatoriasRepository } from '../../../src/modules/convocatorias/infrastructure/cached-convocatorias-repository.js';

/** Repositorio falso que cuenta cuántas veces se consulta la base. */
function fakeRepo() {
  const calls = { options: 0, current: 0 };
  const repo = {
    findCurrentCall: jest.fn(async () => {
      calls.current++;
      return { id: 'c1', code: '2027-I', name: 'Concurso', status: 'PUBLISHED' as const };
    }),
    options: jest.fn(async (callId: string) => {
      calls.options++;
      return [{ internalCode: `P-${callId}` }];
    }),
  } as unknown as ConvocatoriasRepository;
  return { repo, calls };
}

describe('Caché del catálogo (AC01)', () => {
  it('consulta la base una sola vez mientras el dato no vence', async () => {
    const { repo, calls } = fakeRepo();
    let t = 0;
    const cache = new CachedConvocatoriasRepository(repo, 1000, () => t);
    await cache.options('c1');
    await cache.options('c1');
    await Promise.all([cache.options('c1'), cache.options('c1')]);
    expect(calls.options).toBe(1);
    // Otra convocatoria es otro dato.
    await cache.options('c2');
    expect(calls.options).toBe(2);
    // Al vencer, vuelve a consultar.
    t = 1001;
    await cache.options('c1');
    expect(calls.options).toBe(3);
  });

  it('peticiones simultáneas comparten una sola consulta', async () => {
    const { repo, calls } = fakeRepo();
    const cache = new CachedConvocatoriasRepository(repo, 60_000);
    await Promise.all([cache.findCurrentCall(), cache.findCurrentCall(), cache.findCurrentCall()]);
    expect(calls.current).toBe(1);
  });

  it('invalidate() borra todo y la siguiente lectura va a la base', async () => {
    const { repo, calls } = fakeRepo();
    const cache = new CachedConvocatoriasRepository(repo, 60_000);
    await cache.options('c1');
    cache.invalidate();
    await cache.options('c1');
    expect(calls.options).toBe(2);
  });

  it('un error no queda guardado', async () => {
    let fail = true;
    const repo = {
      options: jest.fn(async () => {
        if (fail) throw new Error('sin conexión');
        return [];
      }),
    } as unknown as ConvocatoriasRepository;
    const cache = new CachedConvocatoriasRepository(repo, 60_000);
    await expect(cache.options('c1')).rejects.toThrow('sin conexión');
    fail = false;
    await expect(cache.options('c1')).resolves.toEqual([]);
  });

  it('con vencimiento 0 no guarda datos, pero agrupa consultas simultáneas', async () => {
    const { repo, calls } = fakeRepo();
    const cache = new CachedConvocatoriasRepository(repo, 0);
    await Promise.all([cache.options('c1'), cache.options('c1')]);
    expect(calls.options).toBe(1);
    await cache.options('c1');
    expect(calls.options).toBe(2);
  });
});
