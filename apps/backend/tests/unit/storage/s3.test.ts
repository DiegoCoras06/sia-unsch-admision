import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';
import { S3FileStorage } from '../../../src/shared/storage/s3-file-storage.js';

// Credenciales inventadas: las firmas se calculan localmente, sin conectarse a AWS.
const client = new S3Client({ region: 'us-east-2', credentials: { accessKeyId: 'AKIAPRUEBA000000000', secretAccessKey: 'secreto-de-prueba' } });
const storage = new S3FileStorage({ bucket: 'sia-unsch-documentos', region: 'us-east-2', client });

describe('Almacenamiento en S3 (ADR-010)', () => {
  it('guarda con cifrado del servidor y lee el contenido', async () => {
    const send = vi.spyOn(client, 'send').mockImplementation(async (cmd: unknown) => {
      if (cmd instanceof GetObjectCommand) return { Body: { transformToByteArray: async () => new Uint8Array([37, 80, 68, 70]) } };
      return {};
    });
    await storage.put('expedientes/2027-I/12345678/BASE-DNI-v1.pdf', Buffer.from('%PDF'), 'application/pdf');
    const put = send.mock.calls[0]![0] as PutObjectCommand;
    expect(put.input).toMatchObject({ Bucket: 'sia-unsch-documentos', Key: 'expedientes/2027-I/12345678/BASE-DNI-v1.pdf', ContentType: 'application/pdf', ServerSideEncryption: 'AES256' });
    expect((await storage.get('x'))?.toString()).toBe('%PDF');
    send.mockRestore();
  });

  it('el formulario prefirmado limita tamaño y tipo, y vence en 5 minutos', async () => {
    const up = await storage.presignUpload('subidas/expedientes/12345678/abc', 'application/pdf', 5 * 1024 * 1024);
    expect(up.url).toContain('sia-unsch-documentos');
    expect(up.fields).toMatchObject({ key: 'subidas/expedientes/12345678/abc', 'Content-Type': 'application/pdf', 'x-amz-server-side-encryption': 'AES256' });
    const policy = JSON.parse(Buffer.from(up.fields['Policy']!, 'base64').toString()) as { expiration: string; conditions: unknown[] };
    expect(policy.conditions).toContainEqual(['content-length-range', 1, 5 * 1024 * 1024]);
    expect(policy.conditions).toContainEqual(['eq', '$Content-Type', 'application/pdf']);
    const minutes = (new Date(policy.expiration).getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(4);
    expect(minutes).toBeLessThanOrEqual(5);
  });

  it('el enlace de descarga es temporal (2 minutos) y conserva el nombre del archivo', async () => {
    const url = new URL(await storage.presignDownload('expedientes/x.pdf', 'Certificado de estudios.pdf', 'application/pdf'));
    expect(url.searchParams.get('X-Amz-Expires')).toBe('120');
    expect(decodeURIComponent(url.searchParams.get('response-content-disposition') ?? '')).toContain('Certificado de estudios.pdf');
  });
});
