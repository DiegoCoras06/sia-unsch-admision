/**
 * Comprueba Amazon SES con la configuración de apps/backend/.env.rds: cuenta (sandbox o producción),
 * identidad del remitente (EMAIL_FROM) verificada y, opcionalmente, envía un correo de prueba.
 *   tsx scripts/ses.ts                       → solo comprueba
 *   tsx scripts/ses.ts tu-correo@dominio     → además envía un correo de prueba a esa dirección
 * No imprime claves.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GetAccountCommand, GetEmailIdentityCommand, SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { config } from 'dotenv';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(backendDir, '.env.rds');
if (!existsSync(envFile)) {
  console.error('Falta apps/backend/.env.rds.');
  process.exit(1);
}
config({ path: envFile, override: true, quiet: true });

const from = process.env['EMAIL_FROM']?.trim() ?? '';
const address = /<([^>]+)>/.exec(from)?.[1] ?? from;
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address) || address.endsWith('.local')) {
  console.error('Escribe en .env.rds EMAIL_FROM con tu remitente verificado, p. ej. EMAIL_FROM="Admisión UNSCH <tu-correo@dominio>".');
  process.exit(1);
}
const region = process.env['SES_REGION'] || 'us-east-2';
const ses = new SESv2Client({ region });

try {
  const account = await ses.send(new GetAccountCommand({}));
  const quota = account.SendQuota;
  console.log(`SES ${region}: ${account.ProductionAccessEnabled ? 'producción' : 'sandbox (solo entrega a direcciones verificadas)'} · envío ${account.SendingEnabled ? 'habilitado' : 'DESHABILITADO'} · ${quota?.SentLast24Hours ?? 0}/${quota?.Max24HourSend ?? '?'} correos en 24 h`);

  // La identidad puede ser la dirección exacta o su dominio.
  const domain = address.split('@')[1]!;
  let verified: string | undefined;
  for (const id of [address, domain]) {
    try {
      const r = await ses.send(new GetEmailIdentityCommand({ EmailIdentity: id }));
      if (r.VerifiedForSendingStatus) { verified = id; break; }
      console.log(`  ${id}: registrada pero aún no verificada (revisa tu bandeja y haz clic en el enlace de AWS).`);
    } catch (e) {
      if ((e as { name?: string }).name !== 'NotFoundException') throw e;
    }
  }
  if (!verified) {
    console.error(`El remitente ${address} no está verificado en SES ${region}. Consola de SES > Identidades > Crear identidad > Dirección de correo.`);
    process.exit(1);
  }
  console.log(`  Remitente verificado: ${verified}`);

  const to = process.argv[2];
  if (to) {
    const out = await ses.send(new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: [to] },
      Content: { Simple: { Subject: { Data: 'Prueba de correo · Admisión UNSCH', Charset: 'UTF-8' }, Body: { Text: { Data: 'Si recibes este correo, Amazon SES está bien configurado para el sistema de admisión (proyecto académico).', Charset: 'UTF-8' } } } },
    }));
    console.log(`  Correo de prueba enviado a ${to} (MessageId ${out.MessageId}).`);
  }
  console.log('Listo: cambia EMAIL_PROVIDER=ses en .env.rds y reinicia la API (npm run dev:rds).');
} catch (e) {
  const err = e as { name?: string; message?: string };
  const hint = err.name === 'MessageRejected' ? ' En sandbox, el destinatario también debe estar verificado.'
    : err.name === 'AccessDeniedException' ? ' Al usuario IAM le falta permiso de SES (ver docs/aws-ses.md).'
    : err.name === 'CredentialsProviderError' ? ' Faltan AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY en .env.rds.' : '';
  console.error(`SES respondió ${err.name}: ${err.message}.${hint}`);
  process.exit(1);
}
