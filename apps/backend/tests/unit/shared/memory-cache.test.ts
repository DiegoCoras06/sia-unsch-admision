import { describe, expect, it, jest } from '@jest/globals';
import { MemoryCache, invalidatesOnUse } from '../../../src/shared/cache/memory-cache.js';

describe('MemoryCache (AC01, caché de contenidos públicos)', () => {
  it('guarda el valor y comparte una sola consulta entre peticiones simultáneas', async () => {
    const cache = new MemoryCache(60_000);
    const load = jest.fn(async () => 'comunicados');
    const [a, b] = await Promise.all([cache.get('k', load), cache.get('k', load)]);
    expect([a, b]).toEqual(['comunicados', 'comunicados']);
    expect(await cache.get('k', load)).toBe('comunicados');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('al vencer entrega el valor anterior y lo renueva una sola vez en segundo plano', async () => {
    let t = 0;
    const cache = new MemoryCache(1000, () => t);
    let version = 1;
    const load = jest.fn(async () => `v${version}`);
    expect(await cache.get('k', load)).toBe('v1');
    t = 2000;
    version = 2;
    // Vencido: nadie espera, se sigue viendo v1 mientras se renueva (una sola consulta).
    expect(await Promise.all([cache.get('k', load), cache.get('k', load)])).toEqual(['v1', 'v1']);
    expect(load).toHaveBeenCalledTimes(2);
    await Promise.resolve();
    expect(await cache.get('k', load)).toBe('v2');
  });

  it('no guarda errores: la siguiente petición vuelve a consultar', async () => {
    const cache = new MemoryCache(60_000);
    const load = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('base caída'))
      .mockResolvedValueOnce('ok');
    await expect(cache.get('k', load)).rejects.toThrow('base caída');
    expect(await cache.get('k', load)).toBe('ok');
  });

  it('con TTL 0 no guarda contenidos, pero agrupa consultas simultáneas', async () => {
    const cache = new MemoryCache(0);
    const load = jest.fn(async () => 1);
    expect(await Promise.all([cache.get('k', load), cache.get('k', load)])).toEqual([1, 1]);
    expect(load).toHaveBeenCalledTimes(1);
    await cache.get('k', load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('puede exigir un valor nuevo al vencer para lecturas administrativas', async () => {
    let t = 0;
    const cache = new MemoryCache(1000, () => t, false);
    let version = 1;
    const load = jest.fn(async () => `v${version}`);
    expect(await cache.get('k', load)).toBe('v1');
    t = 2000;
    version = 2;
    expect(await cache.get('k', load)).toBe('v2');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('un cambio desde el panel borra la caché', async () => {
    const cache = new MemoryCache(60_000);
    const load = jest.fn(async () => 'x');
    await cache.get('k', load);
    const admin = invalidatesOnUse({ guardar: async () => 'guardado' }, () => cache.invalidate());
    expect(await admin.guardar()).toBe('guardado');
    await cache.get('k', load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
