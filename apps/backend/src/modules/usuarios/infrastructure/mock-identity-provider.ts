import type { IdentityLookupResult, IdentityProvider } from '../domain/ports.js';
import { syntheticIdentities } from './synthetic-identities.js';

/**
 * Proveedor de identidad SIMULADO (ADR-007, research R-02 de 002): responde solo para los
 * 50 DNI sintéticos 99900001–99900050. La interfaz muestra "Verificación de identidad simulada".
 */
export class MockIdentityProvider implements IdentityProvider {
  readonly simulated = true;
  readonly name = 'MOCK' as const;
  private readonly byDni = new Map(syntheticIdentities.map((i) => [i.dni, i]));

  constructor(private readonly timeoutMs = 10_000, private readonly today: () => Date = () => new Date()) {}

  async lookupDni(dni: string, checkDigit?: string): Promise<IdentityLookupResult> {
    const identity = this.byDni.get(dni);
    if (!identity || (checkDigit !== undefined && identity.checkDigit !== checkDigit.toUpperCase())) return { kind: 'NOT_MATCHED' };
    if (identity.scenario === 'PROVIDER_TIMEOUT') {
      // Simula un proveedor que no responde dentro del tiempo de espera (RNF-08).
      await new Promise((resolve) => setTimeout(resolve, Math.min(this.timeoutMs, 10_000)));
      return { kind: 'UNAVAILABLE' };
    }
    if (new Date(`${identity.expiresOn}T23:59:59-05:00`).getTime() < this.today().getTime()) return { kind: 'EXPIRED' };
    return {
      kind: 'MATCHED',
      firstNames: identity.firstNames,
      paternalSurname: identity.paternalSurname,
      maternalSurname: identity.maternalSurname,
      birthDate: identity.birthDate,
    };
  }
}
