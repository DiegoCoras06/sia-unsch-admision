import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import type { Logger } from 'pino';
import { maskEmail } from '../telemetry/logger.js';
import type { EmailMessage, EmailSender } from './email-sender.js';

/**
 * Correo con Amazon SES (API v2). Credenciales del servidor: rol de la Lambda en AWS;
 * AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY en local (permiso `ses:SendEmail` sobre la identidad del remitente).
 * En modo sandbox SES solo entrega a direcciones verificadas; si rechaza, el error sube y M11 marca la notificación FALLIDA.
 */
export class SesEmailSender implements EmailSender {
  private readonly ses: SESv2Client;

  constructor(
    private readonly cfg: { from: string; region: string; configurationSet?: string; client?: SESv2Client },
    private readonly logger: Logger,
  ) {
    this.ses = cfg.client ?? new SESv2Client({ region: cfg.region });
  }

  async send(message: EmailMessage): Promise<void> {
    const out = await this.ses.send(new SendEmailCommand({
      FromEmailAddress: this.cfg.from,
      Destination: { ToAddresses: [message.to] },
      Content: {
        Simple: {
          Subject: { Data: message.subject, Charset: 'UTF-8' },
          Body: { Html: { Data: message.html, Charset: 'UTF-8' }, Text: { Data: message.text, Charset: 'UTF-8' } },
        },
      },
      ConfigurationSetName: this.cfg.configurationSet,
      // Etiqueta para identificar el tipo de aviso en los eventos de entrega y rebote.
      EmailTags: message.event ? [{ Name: 'evento', Value: message.event.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 256) }] : undefined,
    }));
    this.logger.info({ to: maskEmail(message.to), messageId: out.MessageId }, `correo enviado por SES: ${message.subject}`);
  }
}
