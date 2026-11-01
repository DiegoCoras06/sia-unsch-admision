/**
 * Base de datos de pruebas: PostgreSQL 16 embebido, efímero (se borra al terminar), puerto 5434.
 * Nunca usa la base de desarrollo ni RDS.
 */
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(backendDir, '.pgdata-test');
export const TEST_DATABASE_URL = 'postgresql://sia_test:sia_test_only@127.0.0.1:5434/sia_test';

export default async function setup() {
  rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir, port: 5434, user: 'sia_test', password: 'sia_test_only',
    persistent: false, initdbFlags: ['--encoding=UTF8', '--locale=C'], onLog: () => {}, onError: () => {},
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('sia_test');

  // ADMIN_INITIAL_FILE: la semilla de pruebas no debe pisar el archivo del primer administrador local.
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL, ADMIN_INITIAL_FILE: path.join(os.tmpdir(), 'sia-admin-inicial-test.txt') };
  for (const args of [['prisma', 'migrate', 'deploy'], ['tsx', 'prisma/seed/index.ts']]) {
    const r = spawnSync('npx', args, { cwd: backendDir, env, shell: true, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`Falló ${args.join(' ')}:\n${r.stdout}\n${r.stderr}`);
  }
  process.env['TEST_DATABASE_URL'] = TEST_DATABASE_URL;

  return async () => {
    // Con persistent:false, stop() también borra la carpeta; OneDrive puede bloquearla un momento.
    await pg.stop().catch(() => {});
    try {
      // OneDrive/antivirus pueden retener la carpeta unos segundos; si no se borra, se borra al iniciar la próxima corrida.
      rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    } catch {
      /* se limpia en el próximo setup */
    }
  };
}
