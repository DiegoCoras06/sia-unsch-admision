import { createHash } from 'node:crypto';

/** Formatos aceptados en el expediente (spec 004, FR-003) y su firma real. */
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export interface CheckedFile { mimeType: 'application/pdf' | 'image/jpeg' | 'image/png'; extension: 'pdf' | 'jpg' | 'png'; sha256: string; sizeBytes: number }

/**
 * Valida el archivo por su contenido, no por su nombre (RF-04.05): firma (magic bytes), tamaño,
 * PDF completo (`%%EOF`) y sin cifrado, JPG/PNG completos. Devuelve el motivo del rechazo o los datos.
 */
export function checkDocument(buf: Buffer, accepted: string[]): { ok: true; file: CheckedFile } | { ok: false; reason: string } {
  if (!buf.length) return { ok: false, reason: 'El archivo está vacío.' };
  if (buf.length > MAX_DOCUMENT_BYTES) return { ok: false, reason: 'El archivo supera los 5 MB.' };
  const sha256 = createHash('sha256').update(buf).digest('hex');
  const head = buf.subarray(0, 8);
  const allow = new Set(accepted.map((a) => a.toUpperCase()));

  if (head.subarray(0, 5).toString('latin1') === '%PDF-') {
    if (!allow.has('PDF')) return { ok: false, reason: 'Este documento no acepta PDF.' };
    const tail = buf.subarray(Math.max(0, buf.length - 1024)).toString('latin1');
    if (!tail.includes('%%EOF')) return { ok: false, reason: 'El PDF está incompleto o dañado.' };
    if (/\/Encrypt\b/.test(buf.toString('latin1'))) return { ok: false, reason: 'El PDF está protegido con contraseña. Súbelo sin protección.' };
    return { ok: true, file: { mimeType: 'application/pdf', extension: 'pdf', sha256, sizeBytes: buf.length } };
  }
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    if (!allow.has('JPG') && !allow.has('JPEG')) return { ok: false, reason: 'Este documento no acepta JPG.' };
    if (!(buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9)) return { ok: false, reason: 'La imagen JPG está incompleta o dañada.' };
    return { ok: true, file: { mimeType: 'image/jpeg', extension: 'jpg', sha256, sizeBytes: buf.length } };
  }
  if (head.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    if (!allow.has('PNG')) return { ok: false, reason: 'Este documento no acepta PNG.' };
    if (!buf.subarray(Math.max(0, buf.length - 16)).includes(Buffer.from('IEND'))) return { ok: false, reason: 'La imagen PNG está incompleta o dañada.' };
    return { ok: true, file: { mimeType: 'image/png', extension: 'png', sha256, sizeBytes: buf.length } };
  }
  return { ok: false, reason: 'Formato no permitido. Sube un PDF, JPG o PNG.' };
}
