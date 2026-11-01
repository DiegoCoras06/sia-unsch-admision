import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../../../src/shared/config/env.js';
import { SesEmailSender } from '../../../src/shared/email/ses-email-sender.js';

// Credenciales inventadas: no se conecta a AWS, `send` está simulado.
const client = new SESv2Client({ region: 'us-east-2', credentials: { accessKeyId: 'AKIAPRUEBA000000000', secretAccessKey: 'secreto-de-prueba' } });
const sender = new SesEmailSender({ from: 'Admisión UNSCH <admision@ejemplo.pe>', region: 'us-east-2', configurationSet: 'sia-eventos', client }, pino({ level: 'silent' }));

const baseEnv = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32), IDENTITY_TOKEN_SECRET: 'y'.repeat(32), HMAC_SECRET: 'z'.repeat(32),
};

describe('Correo con Amazon SES', () => {
  it('envía HTML y texto en UTF-8 desde el remitente verificado, con el conjunto de configuración y la etiqueta del aviso', async () => {
    const send = vi.spyOn(client, 'send').mockImplementation(async () => ({ MessageId: 'msg-1' }));
    await sender.send({ to: 'postulante@correo.pe', subject: 'Código de verificación', html: '<p>Hola</p>', text: 'Hola', event: 'CUENTA.CODIGO' });
    const cmd = send.mock.calls[0]![0] as SendEmailCommand;
    expect(cmd).toBeInstanceOf(SendEmailCommand);
    expect(cmd.input).toMatchObject({
      FromEmailAddress: 'Admisión UNSCH <admision@ejemplo.pe>',
      Destination: { ToAddresses: ['postulante@correo.pe'] },
      Content: { Simple: { Subject: { Data: 'Código de verificación', Charset: 'UTF-8' }, Body: { Html: { Data: '<p>Hola</p>' }, Text: { Data: 'Hola' } } } },
      ConfigurationSetName: 'sia-eventos',
      EmailTags: [{ Name: 'evento', Value: 'CUENTA_CODIGO' }],
    });
    send.mockRestore();
  });

  it('propaga el rechazo de SES para que la notificación quede FALLIDA', async () => {
    const send = vi.spyOn(client, 'send').mockRejectedValue(Object.assign(new Error('Email address is not verified'), { name: 'MessageRejected' }));
    await expect(sender.send({ to: 'otro@correo.pe', subject: 'x', html: 'x', text: 'x' })).rejects.toThrow('not verified');
    send.mockRestore();
  });

  it('EMAIL_PROVIDER=ses exige un remitente real en EMAIL_FROM', () => {
    expect(() => loadEnv({ ...baseEnv, EMAIL_PROVIDER: 'ses' })).toThrow(/EMAIL_FROM/);
    expect(loadEnv({ ...baseEnv, EMAIL_PROVIDER: 'ses', EMAIL_FROM: 'Admisión UNSCH <admision@ejemplo.pe>' }).SES_REGION).toBe('us-east-2');
  });
});
