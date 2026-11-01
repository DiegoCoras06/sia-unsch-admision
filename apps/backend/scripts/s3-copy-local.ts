/**
 * Copia al bucket de S3 los archivos guardados en local (apps/backend/.dev-storage) con las mismas rutas,
 * para que se sigan viendo al usar FILE_STORAGE=s3. No borra los originales. Comprueba cada copia.
 *   npx tsx --env-file=.env.rds scripts/s3-copy-local.ts
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { S3FileStorage } from '../src/shared/storage/s3-file-storage.js';

const TYPES: Record<string, string> = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const root = path.resolve('.dev-storage');
const bucket = process.env['S3_BUCKET'];
if (!bucket) throw new Error('Falta S3_BUCKET en el archivo .env.');
const s3 = new S3FileStorage({ bucket, region: process.env['S3_REGION'] ?? 'us-east-2' });

const files = (await readdir(root, { recursive: true, withFileTypes: true })).filter((f) => f.isFile());
let ok = 0;
for (const f of files) {
  const full = path.join(f.parentPath, f.name);
  const key = path.relative(root, full).split(path.sep).join('/');
  const content = await readFile(full);
  await s3.put(key, content, TYPES[path.extname(f.name).toLowerCase()] ?? 'application/octet-stream');
  const back = await s3.get(key);
  if (!back?.equals(content)) throw new Error(`La copia de ${key} no coincide.`);
  ok++;
}
console.log(`✔ ${ok} de ${files.length} archivos copiados y verificados en ${bucket}.`);
