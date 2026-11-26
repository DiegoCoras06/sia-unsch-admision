import { rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

const root = path.resolve(import.meta.dirname, '..');
const outdir = path.join(root, 'dist');

await rm(outdir, { recursive: true, force: true });

await build({
  entryPoints: {
    'lambda-api': path.join(root, 'src', 'lambda-api.ts'),
    'lambda-worker': path.join(root, 'src', 'lambda-worker.ts'),
  },
  outdir,
  bundle: true,
  packages: 'external',
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  minify: false,
  logLevel: 'info',
});
