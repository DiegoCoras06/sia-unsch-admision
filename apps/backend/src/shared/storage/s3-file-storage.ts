import { DeleteObjectCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { FileStorage, PresignedUpload } from './file-storage.js';

/**
 * Almacenamiento en Amazon S3 (ADR-010): bucket privado, cifrado del lado del servidor y acceso solo con
 * credenciales del servidor (rol de la Lambda en AWS; claves de un usuario IAM en desarrollo).
 * - Subidas grandes: POST prefirmado de 5 minutos con tamaño máximo y tipo fijos.
 * - Descargas: URL prefirmada de 2 minutos con el nombre original del archivo.
 */
export class S3FileStorage implements FileStorage {
  private readonly s3: S3Client;

  constructor(private readonly cfg: { bucket: string; region: string; client?: S3Client }) {
    this.s3 = cfg.client ?? new S3Client({ region: cfg.region });
  }

  async put(key: string, content: Buffer, contentType: string): Promise<void> {
    await this.s3.send(new PutObjectCommand({ Bucket: this.cfg.bucket, Key: key, Body: content, ContentType: contentType, ServerSideEncryption: 'AES256' }));
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const out = await this.s3.send(new GetObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
      return out.Body ? Buffer.from(await out.Body.transformToByteArray()) : null;
    } catch (error) {
      if (error instanceof NoSuchKey || (error as { name?: string }).name === 'NoSuchKey') return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
  }

  async presignUpload(key: string, contentType: string, maxBytes: number): Promise<PresignedUpload> {
    const { url, fields } = await createPresignedPost(this.s3, {
      Bucket: this.cfg.bucket,
      Key: key,
      Conditions: [['content-length-range', 1, maxBytes], ['eq', '$Content-Type', contentType]],
      Fields: { 'Content-Type': contentType, 'x-amz-server-side-encryption': 'AES256' },
      Expires: 300,
    });
    return { url, fields };
  }

  async presignDownload(key: string, fileName: string, contentType: string): Promise<string> {
    const safe = fileName.replace(/["\r\n]/g, '').slice(0, 150) || 'documento';
    return getSignedUrl(this.s3, new GetObjectCommand({
      Bucket: this.cfg.bucket, Key: key,
      ResponseContentType: contentType,
      ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(safe)}`,
    }), { expiresIn: 120 });
  }
}
