import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db } from '../../../shared/db/prisma.js';
import { notFound, validationError } from '../../../shared/http/errors.js';
import type { FileStorage } from '../../../shared/storage/file-storage.js';

/** Imágenes de la portada que el personal puede reemplazar (RF-14.01). La original queda como respaldo. */
export const SITE_SLOTS = {
  'portada.fachada': { label: 'Portada: fachada (primera imagen)', fallback: 'img/campus-fachada.jpg' },
  'portada.ordinario': { label: 'Pasos: infografía de la inscripción ordinaria', fallback: 'img/pasos-ordinario.jpg' },
  'portada.exonerado': { label: 'Pasos: infografía de la inscripción de exonerados', fallback: 'img/pasos-exonerado.jpg' },
  'portada.rector': { label: 'Portada: retrato del rector', fallback: 'img/rector-ramirez-roca.jpg' },
} as const;
export type SiteSlot = keyof typeof SITE_SLOTS;

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 3 * 1024 * 1024;

export class SiteAssets {
  constructor(private readonly d: { db: Db; clock: Clock; audit: AuditLog; storage: FileStorage }) {}

  /** Para el portal: solo las imágenes reemplazadas (el resto usa la original). */
  async publicMap() {
    const rows = await this.d.db.siteAsset.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, { url: `/api/v1/site-assets/${r.key}?v=${r.updatedAt.getTime()}`, alt: r.alt }]));
  }

  async list() {
    const rows = new Map((await this.d.db.siteAsset.findMany()).map((r) => [r.key, r]));
    return Object.entries(SITE_SLOTS).map(([key, s]) => {
      const r = rows.get(key);
      return { key, label: s.label, fallback: s.fallback, custom: r ? { url: `/api/v1/site-assets/${key}?v=${r.updatedAt.getTime()}`, alt: r.alt, updatedAt: r.updatedAt.toISOString() } : null };
    });
  }

  async file(key: string): Promise<{ content: Buffer; mimeType: string } | { url: string }> {
    const row = await this.d.db.siteAsset.findUnique({ where: { key } });
    if (row && this.d.storage.presignDownload) return { url: await this.d.storage.presignDownload(row.fileKey, `${key}`, row.mimeType) };
    const content = row ? await this.d.storage.get(row.fileKey) : null;
    if (!row || !content) throw notFound('Imagen no encontrada.');
    return { content, mimeType: row.mimeType };
  }

  async upload(key: string, dataUrl: string, alt: string, actor: string, meta: RequestMeta) {
    if (!(key in SITE_SLOTS)) throw notFound('No existe ese espacio de imagen.');
    const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl);
    const ext = m ? TYPES[m[1]!] : undefined;
    if (!m || !ext) throw validationError('Sube una imagen JPG, PNG o WebP.', [{ field: 'image', issue: 'formato' }]);
    const content = Buffer.from(m[2]!, 'base64');
    if (content.length > MAX_BYTES) throw validationError('La imagen pesa más de 3 MB.', [{ field: 'image', issue: 'tamaño' }]);
    if (!sniff(content, m[1]!)) throw validationError('El archivo no es una imagen válida.', [{ field: 'image', issue: 'contenido' }]);
    const before = await this.d.db.siteAsset.findUnique({ where: { key } });
    const fileKey = `portal/${key}-${this.d.clock.now().getTime()}.${ext}`;
    await this.d.storage.put(fileKey, content, m[1]!);
    await this.d.db.$transaction(async (tx) => {
      await tx.siteAsset.upsert({ where: { key }, create: { key, fileKey, mimeType: m[1]!, alt, updatedBy: actor }, update: { fileKey, mimeType: m[1]!, alt, updatedBy: actor } });
      await this.d.audit.record({ actorUserId: actor, action: 'site.asset.updated', resourceType: 'site_asset', resourceId: key, before: before ? { fileKey: before.fileKey, alt: before.alt } : null, after: { fileKey, alt, bytes: content.length }, ...meta }, tx);
    });
    if (before) await this.d.storage.delete(before.fileKey).catch(() => undefined);
  }

  /** Vuelve a la imagen original del portal. */
  async reset(key: string, actor: string, meta: RequestMeta) {
    const before = await this.d.db.siteAsset.findUnique({ where: { key } });
    if (!before) return;
    await this.d.db.$transaction(async (tx) => {
      await tx.siteAsset.delete({ where: { key } });
      await this.d.audit.record({ actorUserId: actor, action: 'site.asset.reset', resourceType: 'site_asset', resourceId: key, before: { fileKey: before.fileKey, alt: before.alt }, after: null, ...meta }, tx);
    });
    await this.d.storage.delete(before.fileKey).catch(() => undefined);
  }
}

/** Comprueba la firma del archivo: no basta con el tipo declarado. */
function sniff(b: Buffer, mime: string): boolean {
  if (mime === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8;
  if (mime === 'image/png') return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP';
}
