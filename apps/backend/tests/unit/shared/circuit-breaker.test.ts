import { describe, expect, it } from '@jest/globals';
import { CircuitBreakerRegistry, CircuitOpenError } from '../../../src/shared/reliability/circuit-breaker.js';
import { ReliabilityMetrics } from '../../../src/shared/reliability/metrics.js';
import { movableClock } from '../../helpers.js';

describe('Circuit breaker de proveedores externos (EQ-09)', () => {
  it('abre tras el umbral, falla rápido y se recupera mediante HALF_OPEN', async () => {
    const clock = movableClock('2026-11-25T10:00:00-05:00');
    const metrics = new ReliabilityMetrics();
    const circuits = new CircuitBreakerRegistry(clock, metrics, 3, 30_000);
    let calls = 0;
    const failure = async () => {
      calls += 1;
      throw new Error('proveedor caído');
    };

    for (let i = 0; i < 3; i++) await expect(circuits.execute('culqi', failure)).rejects.toThrow('proveedor caído');
    expect(circuits.snapshot().culqi).toMatchObject({ state: 'OPEN', failures: 3, retryAfterSeconds: 30 });
    await expect(circuits.execute('culqi', failure)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(calls).toBe(3);

    clock.advance(31);
    await expect(circuits.execute('culqi', async () => 'ok')).resolves.toBe('ok');
    expect(circuits.snapshot().culqi).toMatchObject({ state: 'CLOSED', failures: 0 });
    expect(metrics.snapshot().external.culqi!).toMatchObject({ count: 5, errors: 4 });
  });

  it('también cuenta una respuesta controlada como fallo cuando el adaptador así lo indica', async () => {
    const clock = movableClock('2026-11-25T10:00:00-05:00');
    const circuits = new CircuitBreakerRegistry(clock, new ReliabilityMetrics(), 1, 1_000);
    await circuits.execute(
      'reniec',
      async () => ({ kind: 'UNAVAILABLE' as const }),
      (result) => result.kind === 'UNAVAILABLE',
    );
    expect(circuits.snapshot().reniec!.state).toBe('OPEN');
  });
});
