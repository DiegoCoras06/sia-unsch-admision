import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Formulario prefirmado para que el navegador suba un archivo directo al almacenamiento (S3). */
export interface PresignedUpload {
  url: string;
  fields: Record<string, string>;
}

/** Puerto de almacenamiento de archivos privados (ADR-010): local en desarrollo, S3 en AWS. */
export interface FileStorage {
  put(key: string, content: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  /** Borra el archivo si existe (retención de datos, RF-13.10). */
  delete(key: string): Promise<void>;
  /**
   * Subida directa desde el navegador (S3): Lambda acepta cuerpos de hasta 6 MB y un PDF de 5 MB en base64
   * los supera. Solo lo implementa S3; sin este método, la web envía el archivo en base64 a la API.
   */
  presignUpload?(key: string, contentType: string, maxBytes: number): Promise<PresignedUpload>;
  /** Enlace temporal para ver o descargar un archivo privado sin pasarlo por Lambda (S3). */
  presignDownload?(key: string, fileName: string, contentType: string): Promise<string>;
}

/** Desarrollo local sin Docker (ADR-014): archivos en `apps/backend/.dev-storage/`. */
export class LocalFileStorage implements FileStorage {
  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root))) throw new Error('Clave de archivo inválida');
    return full;
  }

  async put(key: string, content: Buffer): Promise<void> {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }

  async get(key: string): Promise<Buffer | null> {
    return readFile(this.resolve(key)).catch(() => null);
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}

/** Pruebas: en memoria; las pruebas pueden asignarle las capacidades de S3 para simular la subida directa. */
export class MemoryFileStorage implements FileStorage {
  readonly files = new Map<string, Buffer>();
  presignUpload?: FileStorage['presignUpload'];
  presignDownload?: FileStorage['presignDownload'];
  async put(key: string, content: Buffer, _contentType?: string): Promise<void> {
    this.files.set(key, content);
  }
  async get(key: string): Promise<Buffer | null> {
    return this.files.get(key) ?? null;
  }
  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }
}

/** Dimensiones de un JPEG leyendo su cabecera SOF (sin dependencias de imagen). */
export function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1]!;
    const length = buf.readUInt16BE(i + 2);
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    i += 2 + length;
  }
  return null;
}
