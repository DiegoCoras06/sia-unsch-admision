/**
 * Subidas directas a S3 y apertura de documentos privados (ADR-010).
 * Con S3, la API entrega un formulario prefirmado y el archivo va del navegador al bucket sin pasar por
 * la Lambda; sin S3 (desarrollo local) la API pide el archivo en base64 como siempre.
 */
export type UploadTicket = { mode: 'inline' } | { mode: 's3'; uploadKey: string; url: string; fields: Record<string, string> };

const BY_EXTENSION: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

/** Tipo del archivo; algunos navegadores no lo informan y se deduce por la extensión. */
export function fileType(file: File): string {
  return file.type || BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''] || 'application/octet-stream';
}

/** Envía el archivo al formulario prefirmado de S3 (los campos van antes que el archivo). */
export async function postToS3(ticket: Extract<UploadTicket, { mode: 's3' }>, file: File): Promise<void> {
  const form = new FormData();
  for (const [k, v] of Object.entries(ticket.fields)) form.append(k, v);
  form.append('file', file);
  const res = await fetch(ticket.url, { method: 'POST', body: form }).catch(() => null);
  if (!res?.ok) throw new Error('No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.');
}

export function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Abre un documento: si la API devolvió un enlace temporal (S3) lo abre; si devolvió el archivo, lo muestra. */
export async function openDocument(blob: Blob): Promise<void> {
  if (blob.type.includes('application/json')) {
    const body = JSON.parse(await blob.text()) as { data?: { url?: string } };
    if (!body.data?.url) throw new Error('No se pudo abrir el documento.');
    window.open(body.data.url, '_blank', 'noopener');
    return;
  }
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
