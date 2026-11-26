import type { PasswordHasher } from '../domain/ports.js';

/** Argon2id con los parámetros mínimos recomendados por OWASP (research R-04 de 002). */
export class Argon2Hasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const argon2 = (await import('argon2')).default;
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      const argon2 = (await import('argon2')).default;
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
