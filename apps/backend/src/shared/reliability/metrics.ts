export type ExternalOutcome = 'success' | 'failure' | 'rejected';

interface Aggregate {
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
}

/** Métricas en memoria, sin etiquetas con datos personales y aptas para cada proceso/Lambda. */
export class ReliabilityMetrics {
  private readonly startedAt = new Date();
  private readonly http = new Map<string, Aggregate>();
  private readonly external = new Map<string, Aggregate>();
  private readonly idempotency = { acquired: 0, replayed: 0, conflicts: 0, inProgress: 0 };

  recordHttp(method: string, status: number, ms: number): void {
    this.add(this.http, `${method}:${Math.floor(status / 100)}xx`, status >= 500, ms);
  }

  recordExternal(name: string, outcome: ExternalOutcome, ms: number): void {
    this.add(this.external, name, outcome !== 'success', ms);
  }

  recordIdempotency(kind: keyof typeof this.idempotency): void {
    this.idempotency[kind] += 1;
  }

  snapshot() {
    const serialize = (source: Map<string, Aggregate>) => Object.fromEntries(
      [...source.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, {
        count: value.count,
        errors: value.errors,
        averageMs: value.count ? Math.round(value.totalMs / value.count) : 0,
        maxMs: Math.round(value.maxMs),
      }]),
    );
    return {
      startedAt: this.startedAt.toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      http: serialize(this.http),
      external: serialize(this.external),
      idempotency: { ...this.idempotency },
    };
  }

  private add(target: Map<string, Aggregate>, key: string, failed: boolean, ms: number): void {
    const current = target.get(key) ?? { count: 0, errors: 0, totalMs: 0, maxMs: 0 };
    current.count += 1;
    current.errors += failed ? 1 : 0;
    current.totalMs += ms;
    current.maxMs = Math.max(current.maxMs, ms);
    target.set(key, current);
  }
}
