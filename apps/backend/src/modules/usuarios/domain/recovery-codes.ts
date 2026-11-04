import { randomInt } from 'node:crypto';

/** Sin 0/O, 1/I/L ni U: se copian a mano desde un papel sin confundirse. */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
export const RECOVERY_CODE_COUNT = 10;

const group = () => Array.from({ length: 5 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

/** Códigos de un solo uso, por si el personal pierde el celular (ADR-022). Formato `XXXXX-XXXXX`, unos 49 bits. */
export function newRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, () => `${group()}-${group()}`);
}

/** Acepta el código en minúsculas, con espacios o sin el guion. `null` si no tiene el formato. */
export function normalizeRecoveryCode(input: string): string | null {
  const plain = input.toUpperCase().replace(/[\s-]/g, '');
  if (plain.length !== 10 || [...plain].some((c) => !ALPHABET.includes(c))) return null;
  return `${plain.slice(0, 5)}-${plain.slice(5)}`;
}
