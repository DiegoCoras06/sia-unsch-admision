import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Logger } from 'pino';
import { maskEmail } from '../telemetry/logger.js';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Tipo de aviso para el registro de notificaciones (M11); opcional. */
  event?: string;
}

/** Puerto de envío de correo (ADR-007). */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

/** Desarrollo local sin Docker (ADR-014): cada correo se guarda como .html en `.dev-mail/`. */
export class FileEmailSender implements EmailSender {
  constructor(private readonly dir: string, private readonly logger: Logger) {}

  async send(message: EmailMessage): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const slug = message.subject.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    const file = path.join(this.dir, `${stamp}-${slug}.html`);
    const header = `<!-- Para: ${message.to} -->\n<!-- Asunto: ${message.subject} -->\n`;
    await writeFile(file, header + message.html, 'utf8');
    this.logger.info({ to: maskEmail(message.to), file: path.basename(file) }, `correo guardado: ${message.subject}`);
  }
}

/** Sustituto en pruebas: guarda los correos en memoria. */
export class MemoryEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];
  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }
}

/** Plantilla HTML simple con identidad UNSCH y pie académico. */
export function renderEmail(title: string, paragraphs: string[]): { html: string; text: string } {
  const body = paragraphs.map((p) => `<p style="margin:0 0 12px">${p}</p>`).join('');
  const html = `<!doctype html><html lang="es"><body style="font-family:Arial,sans-serif;background:#f6f1ee;padding:24px">
<div style="max-width:560px;margin:auto;background:#fff;border-top:6px solid #7a1c22;padding:24px;border-radius:8px">
<h1 style="font-size:20px;color:#7a1c22;margin:0 0 16px">${title}</h1>${body}
<p style="font-size:12px;color:#777;margin-top:24px">Admisión UNSCH - proyecto académico, no es el portal oficial de la universidad.</p>
</div></body></html>`;
  const text = `${title}\n\n${paragraphs.map((p) => p.replace(/<[^>]+>/g, '')).join('\n\n')}`;
  return { html, text };
}
