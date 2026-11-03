import pino from 'pino';
import supertest from 'supertest';
import { createApplication, type AppOverrides } from '../src/app.js';
import { fixedClock, type Clock } from '../src/shared/clock/clock.js';
import { loadEnv } from '../src/shared/config/env.js';
import { MemoryEmailSender } from '../src/shared/email/email-sender.js';
import { MemoryFileStorage } from '../src/shared/storage/file-storage.js';
import { syntheticCheckDigit } from '../src/modules/usuarios/infrastructure/synthetic-identities.js';

export const TEST_URL = 'postgresql://sia_test:sia_test_only@127.0.0.1:5434/sia_test';

/** Aplicación real contra la base de pruebas, con reloj controlable y correo en memoria. */
export function testApp(now: string | Clock = '2026-10-25T10:00:00-05:00', extra: Pick<AppOverrides, 'assistantAi' | 'yapeGateway' | 'paymentGateway' | 'eventQueue'> = {}) {
  const env = loadEnv({
    NODE_ENV: 'test',
    APP_ENV: 'test',
    DATABASE_URL: TEST_URL,
    JWT_SECRET: 'test-jwt-secret-test-jwt-secret-test-jwt',
    IDENTITY_TOKEN_SECRET: 'test-identity-secret-test-identity-secret',
    HMAC_SECRET: 'test-hmac-secret-test-hmac-secret-test-hmac',
    LOG_LEVEL: 'silent',
  });
  const email = new MemoryEmailSender();
  const storage = new MemoryFileStorage();
  const clock = typeof now === 'string' ? fixedClock(now) : now;
  const application = createApplication(env, { clock, email, storage, logger: pino({ level: 'silent' }), assistantAi: null, ...extra });
  return { ...application, email, storage, request: supertest(application.app) };
}

/** Reloj mutable para simular el paso del tiempo en una prueba. */
export function movableClock(start: string) {
  let current = new Date(start).getTime();
  return {
    now: () => new Date(current),
    advance(seconds: number) {
      current += seconds * 1000;
    },
    set(iso: string) {
      current = new Date(iso).getTime();
    },
  };
}

export const checkDigit = syntheticCheckDigit;
