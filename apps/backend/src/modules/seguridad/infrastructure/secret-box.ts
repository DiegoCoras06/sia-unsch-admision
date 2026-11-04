import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';

/** Cifra secretos en reposo (secreto TOTP del personal) con AES-256-GCM; formato `v1.iv.tag.datos` en base64url. */
export class SecretBox {
  private readonly key: Buffer;

  constructor(keyMaterial: string) {
    this.key = createHash('sha256').update(`secret-box:${keyMaterial}`).digest();
  }

  /** Huella con clave de un valor que solo hay que comparar (códigos de respaldo); sin la clave no se puede probar por fuerza bruta. */
  fingerprint(value: string): string {
    return createHmac('sha256', this.key).update(value).digest('hex');
  }

  seal(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
  }

  open(sealed: string): string {
    const [v, iv, tag, data] = sealed.split('.');
    if (v !== 'v1' || !iv || !tag || !data) throw new Error('Secreto cifrado con formato desconocido');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  }
}
