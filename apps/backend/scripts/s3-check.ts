/**
 * Comprueba el acceso al bucket de documentos: escribe, lee y borra un archivo de prueba, y pide un
 * formulario prefirmado de subida. No imprime claves.
 *   npx tsx --env-file=.env.rds scripts/s3-check.ts
 */
import { S3FileStorage } from '../src/shared/storage/s3-file-storage.js';

const bucket = process.env['S3_BUCKET'];
const region = process.env['S3_REGION'] ?? 'us-east-2';
if (!bucket) throw new Error('Falta S3_BUCKET en el archivo .env.');
const s3 = new S3FileStorage({ bucket, region });
const key = `prueba-conexion/${Date.now()}.txt`;
const ok = (m: string) => console.log(`✔ ${m}`);
try {
  await s3.put(key, Buffer.from('prueba SIA-UNSCH'), 'text/plain');
  ok(`Escritura en ${bucket} (${region}).`);
  const back = await s3.get(key);
  if (back?.toString() !== 'prueba SIA-UNSCH') throw new Error('El archivo leído no coincide.');
  ok('Lectura del archivo de prueba.');
  await s3.delete(key);
  ok('Borrado del archivo de prueba.');
  const form = await s3.presignUpload(`subidas/prueba/00000000/${crypto.randomUUID()}`, 'application/pdf', 5 * 1024 * 1024);
  ok(`Formulario prefirmado de subida listo (${new URL(form.url).host}).`);
} catch (error) {
  const e = error as { name?: string; message?: string };
  console.error(`✘ ${e.name ?? 'Error'}: ${e.message ?? error}`);
  process.exitCode = 1;
}
