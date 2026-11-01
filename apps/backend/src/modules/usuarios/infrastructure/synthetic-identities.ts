// 50 identidades SINTÉTICAS para MockIdentityProvider (research R-02 de 002). Rango reservado 99900001–99900050.
// No corresponden a personas reales. El dígito verificador es propio de la simulación.

export interface SyntheticIdentity {
  dni: string;
  checkDigit: string;
  firstNames: string;
  paternalSurname: string;
  maternalSurname: string;
  birthDate: string; // AAAA-MM-DD
  expiresOn: string; // vigencia del DNI
  scenario: 'VALID' | 'MINOR' | 'EXPIRED' | 'DISQUALIFIED' | 'PROVIDER_TIMEOUT' | 'E2E';
}

const FIRST = ['MARÍA ELENA', 'JOSÉ LUIS', 'ROSA', 'CARLOS ALBERTO', 'LUZ MARINA', 'JUAN CARLOS', 'ANA LUCÍA', 'PEDRO', 'CARMEN ROSA', 'MIGUEL ÁNGEL'];
const SURNAMES = ['QUISPE', 'HUAMÁN', 'MAMANI', 'CCORAHUA', 'PALOMINO', 'GUTIÉRREZ', 'RAMOS', 'CHÁVEZ', 'MENDOZA', 'ALLCCA', 'SULCA', 'BAUTISTA', 'TINEO', 'CONDORI', 'PARIONA'];

/** Dígito verificador de la simulación: suma ponderada módulo 11 (no es el algoritmo oficial de RENIEC). */
export function syntheticCheckDigit(dni: string): string {
  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  const sum = [...dni].reduce((acc, d, i) => acc + Number(d) * (weights[i] ?? 0), 0);
  return String((11 - (sum % 11)) % 10);
}

function scenarioFor(n: number): SyntheticIdentity['scenario'] {
  if (n <= 40) return 'VALID';
  if (n <= 43) return 'MINOR';
  if (n === 44) return 'EXPIRED';
  if (n === 45) return 'DISQUALIFIED';
  if (n === 46) return 'PROVIDER_TIMEOUT';
  return 'E2E';
}

export const syntheticIdentities: SyntheticIdentity[] = Array.from({ length: 50 }, (_, i) => {
  const n = i + 1;
  const dni = String(99900000 + n);
  const scenario = scenarioFor(n);
  const birthYear = scenario === 'MINOR' ? 2009 + (n % 2) : 1998 + (n % 10);
  return {
    dni,
    checkDigit: syntheticCheckDigit(dni),
    firstNames: FIRST[i % FIRST.length]!,
    paternalSurname: SURNAMES[i % SURNAMES.length]!,
    maternalSurname: SURNAMES[(i * 7 + 3) % SURNAMES.length]!,
    birthDate: `${birthYear}-${String((n % 12) + 1).padStart(2, '0')}-${String((n % 27) + 1).padStart(2, '0')}`,
    expiresOn: scenario === 'EXPIRED' ? '2025-06-30' : '2031-12-31',
    scenario,
  };
});
