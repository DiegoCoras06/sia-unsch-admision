/** Detiene y borra la base temporal de pruebas creada por global-setup.ts. */
import { rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type EmbeddedPostgres from 'embedded-postgres';

const dataDir = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), '.pgdata-test');

export default async function teardown() {
  const pg = (globalThis as { __siaTestPg?: EmbeddedPostgres }).__siaTestPg;
  // Con persistent:false, stop() también borra la carpeta; OneDrive puede bloquearla un momento.
  await pg?.stop().catch(() => {});
  try {
    // OneDrive/antivirus pueden retener la carpeta unos segundos; si no se borra, se borra al iniciar la próxima corrida.
    rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  } catch {
    /* se limpia en el próximo setup */
  }
}
