/**
 * Preparación de la base en Amazon RDS (ADR-009) usando apps/backend/.env.rds.
 *   tsx scripts/rds.ts check   → conecta con SSL verificado y muestra versión y bases
 *   tsx scripts/rds.ts setup   → crea la base si no existe, aplica migraciones y carga la semilla 2027-I
 *   tsx scripts/rds.ts migrate → solo aplica migraciones pendientes
 * Nunca imprime la contraseña.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import pg from 'pg';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(backendDir, '.env.rds');
if (!existsSync(envFile)) {
  console.error('Falta apps/backend/.env.rds - cópialo desde .env.rds.example y escribe tu contraseña.');
  process.exit(1);
}
const parsed = config({ path: envFile, override: true }).parsed ?? {};
const url = new URL(process.env['DATABASE_URL'] ?? '');
const caFile = path.resolve(backendDir, process.env['DB_SSL_CA'] ?? 'certs/global-bundle.pem');
if (url.password.includes('ESCRIBE_TU_CONTRASENA') || !url.password) {
  console.error('Escribe tu contraseña de RDS en DATABASE_URL dentro de apps/backend/.env.rds.');
  process.exit(1);
}
const database = url.pathname.replace(/^\//, '') || 'postgres';
const masked = `${url.username}:•••••@${url.hostname}:${url.port || 5432}/${database}`;

function client(db: string) {
  return new pg.Client({
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: db,
    ssl: { ca: readFileSync(caFile, 'utf8'), rejectUnauthorized: true, servername: url.hostname },
    connectionTimeoutMillis: 10_000,
  });
}

async function check(): Promise<void> {
  console.log(`Conectando a ${masked} con SSL verificado…`);
  const c = client('postgres');
  try {
    await c.connect();
    const v = await c.query<{ version: string }>('SELECT version()');
    const dbs = await c.query<{ datname: string }>("SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY 1");
    const ssl = await c.query<{ ssl: boolean }>('SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()');
    console.log(`✔ Conectado. ${v.rows[0]?.version.split(',')[0]}`);
    console.log(`✔ SSL activo: ${ssl.rows[0]?.ssl ? 'sí' : 'no'} (certificado verificado con ${path.basename(caFile)})`);
    console.log(`  Bases: ${dbs.rows.map((r) => r.datname).join(', ')}`);
  } catch (error) {
    const e = error as { code?: string; message?: string };
    console.error(`✘ No se pudo conectar: ${e.code ?? ''} ${e.message ?? error}`);
    if (e.code === 'ETIMEDOUT' || e.code === 'ECONNREFUSED' || /timeout/i.test(e.message ?? '')) {
      console.error('  Revisa en la consola de RDS: «Acceso público: Sí» y que el grupo de seguridad permita el puerto 5432 desde tu IP.');
    }
    if (e.code === '28P01') console.error('  Usuario o contraseña incorrectos.');
    process.exitCode = 1;
  } finally {
    await c.end().catch(() => {});
  }
}

async function setup(): Promise<void> {
  await check();
  if (process.exitCode) return;
  const c = client('postgres');
  await c.connect();
  const exists = await c.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
  if (!exists.rowCount) {
    await c.query(`CREATE DATABASE "${database.replace(/"/g, '')}"`);
    console.log(`✔ Base "${database}" creada.`);
  } else {
    console.log(`✔ Base "${database}" ya existe.`);
  }
  await c.end();

  const env = { ...process.env, ...parsed };
  for (const args of [['prisma', 'migrate', 'deploy'], ['tsx', 'prisma/seed/index.ts']]) {
    console.log(`→ npx ${args.join(' ')}`);
    const r = spawnSync('npx', args, { cwd: backendDir, env, stdio: 'inherit', shell: true });
    if (r.status !== 0) {
      console.error(`✘ Falló: npx ${args.join(' ')}`);
      process.exit(1);
    }
  }
  console.log('✔ RDS listo: esquema migrado y semilla 2027-I cargada.');
}

/** Solo aplica migraciones pendientes (sin volver a cargar la semilla). */
async function migrate(): Promise<void> {
  await check();
  if (process.exitCode) return;
  const r = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { cwd: backendDir, env: { ...process.env, ...parsed }, stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(1);
  console.log('✔ Migraciones aplicadas en RDS.');
}

const cmd = process.argv[2] ?? 'check';
await (cmd === 'setup' ? setup() : cmd === 'migrate' ? migrate() : check());
