import { randomUUID } from 'node:crypto';
import { validationError } from '../http/errors.js';
import type { FileStorage, PresignedUpload } from './file-storage.js';

/** Tipos que se pueden subir directo a S3 (el servidor vuelve a comprobar el contenido real después). */
export const UPLOAD_TYPES: Record<string, string> = { 'application/pdf': 'PDF', 'image/jpeg': 'JPG', 'image/png': 'PNG' };

/**
 * Subida directa desde el navegador (ADR-010). Con S3 devuelve un formulario prefirmado y la clave temporal
 * `subidas/<ámbito>/<código>/<uuid>`; sin S3 (desarrollo local) la web envía el archivo en base64 como antes.
 */
export async function presignApplicantUpload(
  storage: FileStorage, scope: string, applicantCode: string, contentType: string, size: number, maxBytes: number,
): Promise<{ mode: 'inline' } | ({ mode: 's3'; uploadKey: string } & PresignedUpload)> {
  if (!UPLOAD_TYPES[contentType]) throw validationError('Sube un PDF, JPG o PNG.', [{ field: 'contentType', issue: 'formato' }]);
  if (size < 1 || size > maxBytes) throw validationError(`El archivo debe pesar como máximo ${Math.round(maxBytes / 1024 / 1024)} MB.`, [{ field: 'size', issue: 'tamaño' }]);
  if (!storage.presignUpload) return { mode: 'inline' };
  const uploadKey = `subidas/${scope}/${applicantCode}/${randomUUID()}`;
  return { mode: 's3', uploadKey, ...(await storage.presignUpload(uploadKey, contentType, maxBytes)) };
}

/** Lee lo que el navegador subió a S3; la clave debe pertenecer a este postulante y ámbito. */
export async function readApplicantUpload(storage: FileStorage, scope: string, applicantCode: string, uploadKey: string): Promise<Buffer> {
  if (!/^subidas\/[a-z-]+\/\d{8}\/[0-9a-f-]{36}$/.test(uploadKey) || !uploadKey.startsWith(`subidas/${scope}/${applicantCode}/`)) {
    throw validationError('La subida no corresponde a tu inscripción.', [{ field: 'uploadKey', issue: 'inválida' }]);
  }
  const content = await storage.get(uploadKey);
  if (!content) throw validationError('No encontramos el archivo subido. Vuelve a intentarlo.', [{ field: 'uploadKey', issue: 'no existe' }]);
  return content;
}
