/**
 * AC01 Rendimiento: caché en la memoria del proceso para lecturas públicas que cambian poco.
 *
 * - Cada dato vale `ttlMs` milisegundos. Al vencer, se sigue entregando el valor anterior mientras **una sola**
 *   consulta lo renueva en segundo plano (stale-while-revalidate): ningún visitante espera la renovación.
 * - Si varias peticiones piden lo mismo y aún no hay valor, comparten una sola consulta.
 * - Los errores no se guardan: la siguiente petición vuelve a consultar.
 * - `invalidate()` lo borra todo (se llama después de cada cambio desde el panel).
 * - Con `ttlMs <= 0` no guarda nada (entorno de pruebas).
 */
export class MemoryCache {
  private readonly entries = new Map<string, { expires: number; value: Promise<unknown>; refreshing?: boolean }>();

  constructor(private readonly ttlMs: number, private readonly now: () => number = Date.now) {}

  get<T>(key: string, load: () => Promise<T>): Promise<T> {
    if (this.ttlMs <= 0) return load();
    const hit = this.entries.get(key);
    if (!hit) return this.store(key, load());
    if (hit.expires <= this.now() && !hit.refreshing) {
      hit.refreshing = true;
      const fresh = load();
      // El valor nuevo reemplaza al anterior solo cuando llega bien; si falla, se intenta en la siguiente petición.
      fresh.then(
        () => { if (this.entries.get(key) === hit) this.entries.set(key, { expires: this.now() + this.ttlMs, value: fresh }); },
        () => { hit.refreshing = false; },
      );
    }
    return hit.value as Promise<T>;
  }

  invalidate(): void {
    this.entries.clear();
  }

  private store<T>(key: string, value: Promise<T>): Promise<T> {
    const entry = { expires: this.now() + this.ttlMs, value };
    this.entries.set(key, entry);
    value.catch(() => {
      if (this.entries.get(key) === entry) this.entries.delete(key);
    });
    return value;
  }
}

/** Envuelve un servicio del panel: después de cada operación, borra la caché relacionada. */
export function invalidatesOnUse<T extends object>(service: T, invalidate: () => void): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => {
        const result = value.apply(target, args);
        if (result instanceof Promise) return result.finally(invalidate);
        invalidate();
        return result;
      };
    },
  });
}
