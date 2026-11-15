import type { ConvocatoriasRepository } from '../domain/ports.js';

/**
 * AC01 Rendimiento (patrón Decorador): guarda en memoria lo que lee el repositorio de Convocatorias
 * (convocatoria, etapas, programas, vacantes, tasas, requisitos, temario y documentos).
 *
 * - Son datos que cambian poco y se piden en casi todas las pantallas; con la base en otra región, cada consulta
 *   evitada ahorra un viaje de ida y vuelta.
 * - Solo se guardan datos leídos de la base: el estado de cada etapa se sigue calculando con la hora actual.
 * - Cada dato vence a los `ttlMs` milisegundos, y `invalidate()` lo borra todo cuando el personal cambia algo desde el panel.
 * - Si varias peticiones piden lo mismo a la vez, comparten una sola consulta.
 */
export class CachedConvocatoriasRepository implements ConvocatoriasRepository {
  private readonly entries = new Map<string, { expires: number; value: Promise<unknown> }>();

  constructor(
    private readonly inner: ConvocatoriasRepository,
    private readonly ttlMs = 5 * 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  /** Borra todo lo guardado (se llama después de cada cambio desde el panel). */
  invalidate(): void {
    this.entries.clear();
  }

  private cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key);
    if (hit && hit.expires > this.now()) return hit.value as Promise<T>;
    const value = load();
    this.entries.set(key, { expires: this.now() + this.ttlMs, value });
    // Un error no se guarda: la siguiente petición vuelve a consultar.
    value.catch(() => {
      if (this.entries.get(key)?.value === value) this.entries.delete(key);
    });
    return value;
  }

  findCurrentCall() { return this.cached('currentCall', () => this.inner.findCurrentCall()); }
  findCall(code: string) { return this.cached(`call:${code}`, () => this.inner.findCall(code)); }
  stages(callId: string) { return this.cached(`stages:${callId}`, () => this.inner.stages(callId)); }
  areas() { return this.cached('areas', () => this.inner.areas()); }
  quotaCategories() { return this.cached('quotaCategories', () => this.inner.quotaCategories()); }
  submodalities() { return this.cached('submodalities', () => this.inner.submodalities()); }
  options(callId: string) { return this.cached(`options:${callId}`, () => this.inner.options(callId)); }
  fees(callId: string) { return this.cached(`fees:${callId}`, () => this.inner.fees(callId)); }
  feeRules(callId: string) { return this.cached(`feeRules:${callId}`, () => this.inner.feeRules(callId)); }
  requirements(callId: string, submodality: string | null) {
    return this.cached(`requirements:${callId}:${submodality ?? ''}`, () => this.inner.requirements(callId, submodality));
  }
  syllabus(callId: string) { return this.cached(`syllabus:${callId}`, () => this.inner.syllabus(callId)); }
  documents(callId: string) { return this.cached(`documents:${callId}`, () => this.inner.documents(callId)); }
}
