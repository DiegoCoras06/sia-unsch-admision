import argon2 from 'argon2';
import type { PasswordHasher } from '../domain/ports.js';

/** Argon2id con los parámetros mínimos recomendados por OWASP (research R-04 de 002). */
export class Argon2Hasher implements PasswordHasher {
  private static readonly options = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

  hash(password: string): Promise<string> {
    return argon2.hash(password, Argon2Hasher.options);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
