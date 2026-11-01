export type DocumentType = 'DNI' | 'CE' | 'PASAPORTE';

export type IdentityLookupResult =
  | { kind: 'MATCHED'; firstNames: string; paternalSurname: string; maternalSurname: string; birthDate: string }
  | { kind: 'NOT_MATCHED' }
  | { kind: 'EXPIRED' }
  | { kind: 'UNAVAILABLE' };

/** Puerto del proveedor de identidad (ADR-007). La implementación de esta versión es simulada. */
export interface IdentityProvider {
  readonly simulated: boolean;
  readonly name: 'MOCK' | 'RENIEC';
  /** Sin `checkDigit` no se exige el dígito verificador (inscripción pública, ADR-015). */
  lookupDni(dni: string, checkDigit?: string): Promise<IdentityLookupResult>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}
