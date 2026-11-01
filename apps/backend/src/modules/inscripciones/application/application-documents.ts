import { createHash } from 'node:crypto';
import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Db } from '../../../shared/db/prisma.js';
import { businessRule, notFound, validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import type { FileStorage } from '../../../shared/storage/file-storage.js';
import { presignApplicantUpload, readApplicantUpload } from '../../../shared/storage/uploads.js';

type AppRow = NonNullable<Awaited<ReturnType<Db['application']['findUnique']>>>;

/** RF-03.05: documentos que se adjuntan a la inscripción además de la fotografía. */
const KINDS: { kind: string; name: string; hint: string; applies: (a: AppRow) => boolean; required: (a: AppRow) => boolean }[] = [
  { kind: 'DNI', name: 'DNI por ambas caras', hint: 'Escaneado o foto nítida, en una sola hoja.', applies: () => true, required: () => false },
  { kind: 'ESTUDIOS', name: 'Certificado o constancia de estudios secundarios', hint: 'Si aún cursas 5.° año, la constancia de matrícula.', applies: () => true, required: () => false },
  { kind: 'MILITAR', name: 'Constancia de servicio militar', hint: 'Emitida por la unidad donde serviste o te licenciaste (Art. 15).', applies: (a) => a.militaryCondition !== 'NONE', required: (a) => a.militaryCondition !== 'NONE' },
  { kind: 'VINCULO', name: 'Constancia de vínculo con la UNSCH', hint: 'Constancia de la Oficina de Recursos Humanos y partida o acta que acredite el parentesco (Art. 15).', applies: (a) => a.familyLink, required: (a) => a.familyLink },
];
const TYPES: Record<string, (b: Buffer) => boolean> = {
  'application/pdf': (b) => b.subarray(0, 5).toString() === '%PDF-',
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
};
const MAX_BYTES = 5 * 1024 * 1024;

export class ApplicationDocuments {
  constructor(private readonly d: { db: Db; audit: AuditLog; storage: FileStorage; limiter: RateLimiter }) {}

  /** Postulante, con DNI + código: qué documentos le corresponden y cuáles ya subió. */
  async list(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    await this.d.limiter.consume(`inscription-docs:${meta.ipHash}`, 30, 3600);
    return this.view(await this.locate(documentNumber, applicantCode));
  }

  /** ADR-010: con S3, formulario prefirmado para subir el archivo directo al bucket (Lambda acepta hasta 6 MB). */
  async presignUpload(input: { documentNumber: string; applicantCode: string; kind: string; contentType: string; size: number }, meta: RequestMeta) {
    await this.d.limiter.consume(`inscription-docs:${meta.ipHash}`, 30, 3600);
    const app = await this.locate(input.documentNumber, input.applicantCode);
    this.kindFor(app, input.kind);
    return presignApplicantUpload(this.d.storage, 'inscripciones', app.applicantCode, input.contentType, input.size, MAX_BYTES);
  }

  /** El archivo llega en base64 (almacenamiento local) o ya subido a S3 (`uploadKey`); se valida su contenido real. */
  async upload(
    input: { documentNumber: string; applicantCode: string; kind: string; fileName: string; content?: string | undefined; uploadKey?: string | undefined },
    meta: RequestMeta,
  ) {
    await this.d.limiter.consume(`inscription-docs:${meta.ipHash}`, 30, 3600);
    const app = await this.locate(input.documentNumber, input.applicantCode);
    const def = this.kindFor(app, input.kind);
    let content: Buffer;
    let mime: string;
    if (input.uploadKey) {
      content = await readApplicantUpload(this.d.storage, 'inscripciones', app.applicantCode, input.uploadKey);
      mime = Object.keys(TYPES).find((t) => TYPES[t]!(content)) ?? '';
      if (!mime || content.length > MAX_BYTES) {
        await this.d.storage.delete(input.uploadKey).catch(() => undefined);
        throw validationError(mime ? 'El archivo pesa más de 5 MB.' : 'El archivo está dañado o no es un PDF, JPG o PNG.', [{ field: 'content', issue: 'contenido' }]);
      }
    } else {
      const m = /^data:([a-z]+\/[a-z]+);base64,(.+)$/.exec(input.content ?? '');
      const check = m ? TYPES[m[1]!] : undefined;
      if (!m || !check) throw validationError('Sube un PDF, JPG o PNG.', [{ field: 'content', issue: 'formato' }]);
      content = Buffer.from(m[2]!, 'base64');
      mime = m[1]!;
      if (content.length > MAX_BYTES) throw validationError('El archivo pesa más de 5 MB.', [{ field: 'content', issue: 'tamaño' }]);
      if (!check(content)) throw validationError('El archivo está dañado o no es del tipo que dice ser.', [{ field: 'content', issue: 'contenido' }]);
    }

    const sha256 = createHash('sha256').update(content).digest('hex');
    const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg';
    const fileKey = `inscripciones/${app.applicantCode}/${def.kind}-${sha256.slice(0, 12)}.${ext}`;
    const before = await this.d.db.applicationDocument.findUnique({ where: { applicantCode_kind: { applicantCode: app.applicantCode, kind: def.kind } } });
    await this.d.storage.put(fileKey, content, mime);
    if (input.uploadKey) await this.d.storage.delete(input.uploadKey).catch(() => undefined);
    const data = { fileKey, fileName: input.fileName.slice(0, 160), mimeType: mime, sizeBytes: content.length, sha256 };
    await this.d.db.$transaction(async (tx) => {
      await tx.applicationDocument.upsert({
        where: { applicantCode_kind: { applicantCode: app.applicantCode, kind: def.kind } },
        create: { applicantCode: app.applicantCode, kind: def.kind, ...data }, update: { ...data, uploadedAt: new Date() },
      });
      await this.d.audit.record({ actorUserId: null, action: 'inscription.document.uploaded', resourceType: 'application', resourceId: app.applicantCode, before: before ? { kind: def.kind, sha256: before.sha256 } : null, after: { kind: def.kind, sha256, sizeBytes: content.length }, ...meta }, tx);
    });
    if (before && before.fileKey !== fileKey) await this.d.storage.delete(before.fileKey).catch(() => undefined);
    return this.view(app);
  }

  /** Panel: documentos adjuntos de una inscripción. */
  async forStaff(applicantCode: string) {
    const app = await this.d.db.application.findUnique({ where: { applicantCode } });
    if (!app) throw notFound('No existe esa inscripción.');
    return this.view(app);
  }

  async file(applicantCode: string, kind: string): Promise<{ content: Buffer; mimeType: string; fileName: string } | { url: string }> {
    const row = await this.d.db.applicationDocument.findUnique({ where: { applicantCode_kind: { applicantCode, kind } } });
    // Con S3, un enlace temporal: el archivo no pasa por la Lambda (límite de 6 MB en la respuesta).
    if (row && this.d.storage.presignDownload) return { url: await this.d.storage.presignDownload(row.fileKey, row.fileName, row.mimeType) };
    const content = row ? await this.d.storage.get(row.fileKey) : null;
    if (!row || !content) throw notFound('Documento no encontrado.');
    return { content, mimeType: row.mimeType, fileName: row.fileName };
  }

  private kindFor(app: AppRow, kind: string) {
    if (app.status === 'ANULADA') throw businessRule('ANNULLED', 'La inscripción está anulada: ya no admite documentos.');
    const def = KINDS.find((k) => k.kind === kind && k.applies(app));
    if (!def) throw validationError('Ese documento no corresponde a tu inscripción.', [{ field: 'kind', issue: 'no aplica' }]);
    return def;
  }

  private async locate(documentNumber: string, applicantCode: string) {
    const app = await this.d.db.application.findUnique({ where: { applicantCode } });
    if (!app || app.documentNumber !== documentNumber.trim().toUpperCase()) throw notFound('No encontramos una inscripción con ese documento y código. Revisa los datos.');
    return app;
  }

  private async view(app: AppRow) {
    const rows = new Map((await this.d.db.applicationDocument.findMany({ where: { applicantCode: app.applicantCode } })).map((r) => [r.kind, r]));
    return KINDS.filter((k) => k.applies(app)).map((k) => {
      const r = rows.get(k.kind);
      return {
        kind: k.kind, name: k.name, hint: k.hint, required: k.required(app),
        uploaded: r ? { fileName: r.fileName, sizeBytes: r.sizeBytes, mimeType: r.mimeType, uploadedAt: r.uploadedAt.toISOString() } : null,
      };
    });
  }
}
