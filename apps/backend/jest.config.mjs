// Pruebas automáticas del backend con Jest (Sprint 2). Se corre con `npm test -w @sia/backend`.
// El proyecto usa módulos ES y TypeScript: SWC traduce cada archivo .ts y Jest lo carga como módulo ES
// (por eso los scripts usan `node --experimental-vm-modules`).

/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      { jsc: { parser: { syntax: 'typescript' }, target: 'es2022' }, module: { type: 'es6' } },
    ],
  },
  // El código importa sus archivos .ts con la extensión .js (regla de los módulos ES de Node).
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  // PostgreSQL embebido efímero en el puerto 5434 para las pruebas de integración (ADR-014). Nunca RDS.
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',
  // Un archivo a la vez: las pruebas de integración comparten la base temporal.
  maxWorkers: 1,
  testTimeout: 120_000,
  // Reporte de cobertura: npm run test:coverage. Se mide el código propio, sin el cliente generado de Prisma.
  coverageProvider: 'v8',
  collectCoverageFrom: ['src/**/*.ts', '!src/generated/**', '!src/**/*.d.ts'],
  coverageReporters: ['text-summary', 'text', 'html', 'json-summary', 'lcov'],
  coverageDirectory: 'coverage',
};
