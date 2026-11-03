/**
 * PostgreSQL 16 embebido para desarrollo local sin Docker (ADR-014).
 *
 *   tsx scripts/db.ts start   → inicia (y crea si no existe) y queda en primer plano hasta Ctrl+C
 *   tsx scripts/db.ts stop    → detiene una instancia iniciada desde otra terminal
 *   tsx scripts/db.ts setup   → inicia, aplica migraciones, carga semillas y se detiene
 *   tsx scripts/db.ts reset   → borra la base "sia", la recrea, migra y siembra
 */
import 'dotenv/config';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = new URL(process.env['DATABASE_URL'] ?? 'postgresql://sia:sia_local_dev@127.0.0.1:5433/sia');
const port = Number(url.port || 5433);
const database = url.pathname.replace(/^\//, '') || 'sia';
const dataDir = path.join(backendDir, process.env['PGDATA_DIR'] ?? '.pgdata');

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  port,
  user: decodeURIComponent(url.username || 'sia'),
  password: decodeURIComponent(url.password || 'sia_local_dev'),
  authMethod: 'scram-sha-256',
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: () => {},
  onError: (e) => console.error('[postgres]', e),
});

function isPortOpen(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.end(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}

async function ensureStarted(): Promise<boolean> {
  if (await isPortOpen()) {
    console.log(`PostgreSQL ya está escuchando en el puerto ${port}.`);
    return false;
  }
  if (!existsSync(path.join(dataDir, 'PG_VERSION'))) {
    console.log(`Inicializando clúster en ${dataDir} …`);
    await pg.initialise();
  }
  await pg.start();
  console.log(`PostgreSQL 16 embebido escuchando en 127.0.0.1:${port}`);
  return true;
}

async function ensureDatabase(): Promise<void> {
  const client = pg.getPgClient('postgres', '127.0.0.1');
  await client.connect();
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
  await client.end();
  if (!rowCount) {
    await pg.createDatabase(database);
    console.log(`Base de datos "${database}" creada.`);
  }
}

function npx(args: string[]): void {
  const result = spawnSync('npx', args, { cwd: backendDir, stdio: 'inherit', shell: true, env: process.env });
  if (result.status !== 0) throw new Error(`Falló: npx ${args.join(' ')}`);
}

function migrateAndSeed(): void {
  npx(['prisma', 'migrate', 'deploy']);
  npx(['tsx', 'prisma/seed/index.ts']);
}

async function stopExternal(): Promise<void> {
  if (!existsSync(path.join(dataDir, 'postmaster.pid'))) {
    console.log('No hay una instancia en ejecución.');
    return;
  }
  // Binario de la plataforma actual (windows-x64, linux-x64, darwin-arm64…); con nombre fijo, TypeScript fallaba en Linux (CI).
  const binaries = `@embedded-postgres/${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch}`;
  const { pg_ctl } = (await import(binaries).catch(async () => {
    throw new Error('pg_ctl no disponible para esta plataforma; detén el proceso con Ctrl+C.');
  })) as { pg_ctl: string };
  execFileSync(pg_ctl, ['stop', '-D', dataDir, '-m', 'fast'], { stdio: 'inherit' });
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'start';
  switch (command) {
    case 'start': {
      const ownsProcess = await ensureStarted();
      await ensureDatabase();
      if (!ownsProcess) return;
      const shutdown = async () => {
        console.log('\nDeteniendo PostgreSQL …');
        await pg.stop();
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
      setInterval(() => {}, 1 << 30);
      return;
    }
    case 'stop':
      await stopExternal();
      return;
    case 'setup':
    case 'reset': {
      const ownsProcess = await ensureStarted();
      if (command === 'reset') {
        await pg.dropDatabase(database).catch(() => {});
        console.log(`Base de datos "${database}" eliminada.`);
      }
      await ensureDatabase();
      try {
        migrateAndSeed();
      } finally {
        if (ownsProcess) await pg.stop();
      }
      console.log('Listo: esquema migrado y semillas cargadas.');
      return;
    }
    default:
      console.error(`Comando desconocido: ${command}`);
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
