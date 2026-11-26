import { cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { build, type BuildOptions } from 'esbuild';

const root = path.resolve(import.meta.dirname, '..');
const outdir = path.join(root, 'dist');

await rm(outdir, { recursive: true, force: true });

const common = {
  bundle: true,
  external: ['argon2'],
  platform: 'node',
  target: 'node22',
  format: 'esm',
  minify: false,
  logLevel: 'info',
} satisfies BuildOptions;

await build({
  ...common,
  entryPoints: [path.join(root, 'src', 'lambda-api.ts')],
  outfile: path.join(outdir, 'lambda-api.js'),
  sourcemap: true,
});

const workerDir = path.join(outdir, 'worker');
await build({
  ...common,
  entryPoints: [path.join(root, 'src', 'lambda-worker.ts')],
  outfile: path.join(workerDir, 'lambda-worker.js'),
  sourcemap: false,
});

// El artefacto del worker no contiene el API ni source maps; sí sus assets y CA de RDS.
await cp(path.join(root, 'assets'), path.join(workerDir, 'assets'), { recursive: true });
await cp(path.join(root, 'certs'), path.join(workerDir, 'certs'), { recursive: true });
