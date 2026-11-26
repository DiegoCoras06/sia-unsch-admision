/**
 * Suite E2E reproducible para local y CI.
 * Usa PostgreSQL embebido aislado (puerto 5435), API (3100) y Angular (4300).
 * Nunca utiliza DATABASE_URL del entorno ni la base RDS.
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const backend = path.join(root, 'apps', 'backend');
const artifacts = path.join(root, '.e2e-artifacts');
const adminFile = path.join(artifacts, 'admin-e2e.txt');
const databaseUrl = 'postgresql://sia_e2e:sia_e2e_only@127.0.0.1:5435/sia_e2e';
const apiUrl = 'http://127.0.0.1:3100';
const webUrl = 'http://127.0.0.1:4300';
const bin = (name) => path.join(root, 'node_modules', '.bin', `${name}${process.platform === 'win32' ? '.cmd' : ''}`);
const needsShell = (command) => process.platform === 'win32' && command.toLowerCase().endsWith('.cmd');
const children = [];
const startedAt = new Date();
mkdirSync(artifacts, { recursive: true });

const serviceEnv = {
  ...process.env,
  NODE_ENV: 'test',
  APP_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3100',
  FRONTEND_ORIGIN: webUrl,
  DATABASE_URL: databaseUrl,
  DB_MAX_CONNECTIONS: '10',
  PGDATA_DIR: '.pgdata-e2e',
  ADMIN_INITIAL_FILE: adminFile,
  ADMIN_FILE: adminFile,
  JWT_SECRET: 'e2e-only-jwt-secret-0123456789-0123456789',
  IDENTITY_TOKEN_SECRET: 'e2e-only-identity-secret-01234567890123456789',
  HMAC_SECRET: 'e2e-only-hmac-secret-012345678901234567890',
  IDENTITY_PROVIDER: 'mock',
  EMAIL_PROVIDER: 'file',
  PAYMENTS_PROVIDER: 'mock',
  FILE_STORAGE: 'local',
  APP_FIXED_NOW: '2026-10-25T10:00:00-05:00',
  LOG_LEVEL: 'warn',
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    env: options.env ?? serviceEnv,
    encoding: 'utf8',
    shell: needsShell(command),
  });
  if (result.status !== 0) {
    throw new Error(
      [`Falló: ${command} ${args.join(' ')}`, result.error?.message, result.stdout, result.stderr]
        .filter(Boolean)
        .join('\n'),
    );
  }
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

function start(name, command, args, cwd = root) {
  const child = spawn(command, args, {
    cwd,
    env: serviceEnv,
    shell: needsShell(command),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const logs = [];
  child.stdout.on('data', (chunk) => logs.push(chunk.toString()));
  child.stderr.on('data', (chunk) => logs.push(chunk.toString()));
  child.on('exit', (code) => {
    if (code && !child.stopping) console.error(`${name} terminó con código ${code}:\n${logs.slice(-20).join('')}`);
  });
  children.push({ name, child, logs });
  return child;
}

async function waitFor(url, label, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // El servicio todavía está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`${label} no respondió en ${url} después de ${timeoutMs / 1000} s`);
}

async function stopTree(child) {
  if (!child.pid || child.exitCode !== null) return;
  child.stopping = true;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', shell: false });
  } else {
    child.kill('SIGTERM');
  }
}

function writeReport(status, output, error) {
  const endedAt = new Date();
  const cleanOutput = output.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '').trim();
  const report = [
    '# Resultado de pruebas End to End',
    '',
    `- Estado: **${status}**`,
    `- Inicio: ${startedAt.toISOString()}`,
    `- Fin: ${endedAt.toISOString()}`,
    `- Duración: ${Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)} s`,
    '- Entorno: PostgreSQL 16 embebido aislado + API Express + frontend Angular + navegador headless',
    '- Flujo: DNI → autocompletado → formulario por pasos → foto → programa y tasa → registro → consulta → rechazo de duplicado',
    '',
    '## Salida',
    '',
    '```text',
    cleanOutput || '(sin salida)',
    '```',
    ...(error ? ['', '## Error', '', '```text', String(error.stack ?? error), '```'] : []),
    '',
  ].join('\n');
  writeFileSync(path.join(artifacts, 'resultado-e2e.md'), report, 'utf8');
}

let e2eOutput = '';
let failure;
try {
  console.log('Preparando PostgreSQL E2E aislado…');
  run(bin('tsx'), ['scripts/db.ts', 'reset'], { cwd: backend });
  start('PostgreSQL', bin('tsx'), ['scripts/db.ts', 'start'], backend);
  await waitFor(`${apiUrl}/api/v1/health/live`, 'API', 2_000).catch(() => {});

  start('API', bin('tsx'), ['src/server.ts'], backend);
  await waitFor(`${apiUrl}/api/v1/health/ready`, 'API');

  const proxy = path.join(artifacts, 'proxy.e2e.json');
  writeFileSync(proxy, JSON.stringify({ '/api': { target: apiUrl, secure: false, changeOrigin: false } }), 'utf8');
  start(
    'Angular',
    bin('ng'),
    ['serve', '--host', '127.0.0.1', '--port', '4300', '--proxy-config', proxy],
    path.join(root, 'apps', 'frontend'),
  );
  await waitFor(webUrl, 'Frontend');

  console.log('Ejecutando flujo E2E de inscripción…');
  e2eOutput = run(process.execPath, ['scripts/e2e-inscripcion.mjs', '99900021', '.e2e-artifacts/inscripcion', '1440'], {
    env: { ...serviceEnv, BASE_URL: webUrl },
  });
  process.stdout.write(e2eOutput);
  writeReport('APROBADO', e2eOutput);
} catch (error) {
  failure = error;
  console.error(error instanceof Error ? error.message : error);
  writeReport('FALLIDO', e2eOutput, error);
  process.exitCode = 1;
} finally {
  for (const { child } of children.reverse()) await stopTree(child);
  console.log(`Reporte: ${path.relative(root, path.join(artifacts, 'resultado-e2e.md'))}`);
}

if (failure) process.exitCode = 1;
