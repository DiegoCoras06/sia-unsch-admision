import type { Clock } from '../clock/clock.js';
import type { ReliabilityMetrics } from './metrics.js';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitOpenError extends Error {
  constructor(
    readonly circuit: string,
    readonly retryAfterSeconds: number,
  ) {
    super(`El circuito ${circuit} está abierto.`);
    this.name = 'CircuitOpenError';
  }
}

interface Circuit {
  state: CircuitState;
  failures: number;
  openedAt: Date | null;
  halfOpenRunning: boolean;
}

/** Circuit breaker por proveedor: falla rápido y permite una solicitud de prueba tras el enfriamiento. */
export class CircuitBreakerRegistry {
  private readonly circuits = new Map<string, Circuit>();

  constructor(
    private readonly clock: Clock,
    private readonly metrics: ReliabilityMetrics,
    private readonly failureThreshold = 5,
    private readonly resetAfterMs = 30_000,
  ) {}

  async execute<T>(
    name: string,
    operation: () => Promise<T>,
    isFailure: (value: T) => boolean = () => false,
  ): Promise<T> {
    const circuit = this.get(name);
    this.allow(name, circuit);
    const started = performance.now();
    try {
      const value = await operation();
      if (isFailure(value)) {
        this.failed(circuit);
        this.metrics.recordExternal(name, 'failure', performance.now() - started);
      } else {
        this.succeeded(circuit);
        this.metrics.recordExternal(name, 'success', performance.now() - started);
      }
      return value;
    } catch (error) {
      this.failed(circuit);
      this.metrics.recordExternal(name, 'failure', performance.now() - started);
      throw error;
    } finally {
      circuit.halfOpenRunning = false;
    }
  }

  snapshot(): Record<string, { state: CircuitState; failures: number; retryAfterSeconds: number }> {
    return Object.fromEntries(
      [...this.circuits.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, circuit]) => {
          this.refresh(circuit);
          return [
            name,
            { state: circuit.state, failures: circuit.failures, retryAfterSeconds: this.retryAfter(circuit) },
          ];
        }),
    );
  }

  private get(name: string): Circuit {
    const current = this.circuits.get(name) ?? {
      state: 'CLOSED' as const,
      failures: 0,
      openedAt: null,
      halfOpenRunning: false,
    };
    this.circuits.set(name, current);
    return current;
  }

  private allow(name: string, circuit: Circuit): void {
    this.refresh(circuit);
    if (circuit.state === 'OPEN' || (circuit.state === 'HALF_OPEN' && circuit.halfOpenRunning)) {
      this.metrics.recordExternal(name, 'rejected', 0);
      throw new CircuitOpenError(name, Math.max(1, this.retryAfter(circuit)));
    }
    if (circuit.state === 'HALF_OPEN') circuit.halfOpenRunning = true;
  }

  private refresh(circuit: Circuit): void {
    if (
      circuit.state === 'OPEN' &&
      circuit.openedAt &&
      this.clock.now().getTime() - circuit.openedAt.getTime() >= this.resetAfterMs
    ) {
      circuit.state = 'HALF_OPEN';
      circuit.halfOpenRunning = false;
    }
  }

  private failed(circuit: Circuit): void {
    circuit.failures += 1;
    if (circuit.state === 'HALF_OPEN' || circuit.failures >= this.failureThreshold) {
      circuit.state = 'OPEN';
      circuit.openedAt = this.clock.now();
    }
  }

  private succeeded(circuit: Circuit): void {
    circuit.state = 'CLOSED';
    circuit.failures = 0;
    circuit.openedAt = null;
  }

  private retryAfter(circuit: Circuit): number {
    if (circuit.state !== 'OPEN' || !circuit.openedAt) return 0;
    return Math.ceil(Math.max(0, this.resetAfterMs - (this.clock.now().getTime() - circuit.openedAt.getTime())) / 1000);
  }
}
