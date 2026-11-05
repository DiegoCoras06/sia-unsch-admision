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
export interface EmailExtras {
  /** Datos clave en una tarjeta: código, programa, monto. */
  facts?: [string, string][];
  /** Acción principal, como botón. */
  action?: { label: string; url: string };
}

const INK = '#1d1415';
const SOFT = '#5b4f50';
const FONT = "Archivo,'Segoe UI',Helvetica,Arial,sans-serif";

/** Plantilla común: tablas y estilos en línea, lo que respetan Gmail y Outlook. La versión de texto lleva lo mismo. */
export function renderEmail(title: string, paragraphs: string[], extras: EmailExtras = {}): { html: string; text: string } {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${INK}">${p}</p>`).join('');
  const facts = extras.facts?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px;background:#f7f2ee;border-radius:8px"><tr><td style="padding:8px 18px">${extras.facts
        .map(([k, v]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:8px 0;font-size:13px;color:${SOFT}">${k}</td><td align="right" style="padding:8px 0;font-size:15px;font-weight:700;color:${INK}">${v}</td></tr></table>`)
        .join('')}</td></tr></table>`
    : '';
  const action = extras.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px"><tr><td style="background:#7a1c22;border-radius:6px"><a href="${extras.action.url}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">${extras.action.label}</a></td></tr></table>`
    : '';
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f3efea;font-family:${FONT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efea"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:10px;overflow:hidden">
<tr><td style="background:#7a1c22;padding:22px 30px;border-bottom:3px solid #d9b44a">
<p style="margin:0;font-size:12px;line-height:1.4;color:#f1dcdd">Universidad Nacional de San Cristóbal de Huamanga</p>
<p style="margin:3px 0 0;font-size:17px;font-weight:700;color:#ffffff">Dirección de Admisión</p>
</td></tr>
<tr><td style="padding:30px 30px 14px">
<h1 style="margin:0 0 18px;font-size:23px;line-height:1.25;letter-spacing:-0.3px;color:#7a1c22">${title}</h1>${body}${facts}${action}
</td></tr>
<tr><td style="padding:16px 30px 24px;border-top:1px solid #e7e0d8">
<p style="margin:0;font-size:12px;line-height:1.5;color:${SOFT}">Admisión UNSCH: proyecto académico, no es el portal oficial de la universidad. Este correo se envió automáticamente, no lo respondas.</p>
</td></tr>
</table></td></tr></table></body></html>`;
  const lines = paragraphs.map((p) => p.replace(/<[^>]+>/g, ''));
  const factText = extras.facts?.map(([k, v]) => `${k}: ${v.replace(/<[^>]+>/g, '')}`).join('\n');
  const text = [title, ...lines, ...(factText ? [factText] : []), ...(extras.action ? [`${extras.action.label}: ${extras.action.url}`] : [])].join('\n\n');
  return { html, text };
}
