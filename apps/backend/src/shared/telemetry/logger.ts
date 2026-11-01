import pino, { type Logger } from 'pino';

/**
 * Campos que nunca deben salir en los registros ni en la telemetría (ADR-013, RNF-03).
 * pino los reemplaza por "[REDACTADO]" en cualquier nivel del objeto registrado.
 */
export const REDACTED_PATHS = [
  'password', 'newPassword', 'passwordHash', 'token', 'accessToken', 'identityToken', 'refreshToken', 'code',
  'dni', 'documentNumber', 'email', 'phone', 'firstNames', 'paternalSurname', 'maternalSurname', 'name', 'message',
  '*.password', '*.newPassword', '*.passwordHash', '*.token', '*.accessToken', '*.identityToken', '*.refreshToken', '*.code',
  '*.dni', '*.documentNumber', '*.email', '*.phone', '*.firstNames', '*.paternalSurname', '*.maternalSurname',
  'req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]',
];

export function createLogger(level: string, pretty: boolean): Logger {
  return pino({
    level,
    base: { service: 'sia-api' },
    redact: { paths: REDACTED_PATHS, censor: '[REDACTADO]' },
    ...(pretty
      ? { transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,service' } } }
      : {}),
  });
}

/** Correo enmascarado para mensajes y registros: d•••••@u•••.edu.pe */
export function maskEmail(email: string): string {
  const [user = '', domain = ''] = email.split('@');
  const [host = '', ...rest] = domain.split('.');
  const mask = (s: string) => (s.length <= 1 ? s : `${s[0]}${'•'.repeat(Math.min(5, s.length - 1))}`);
  return `${mask(user)}@${mask(host)}${rest.length ? '.' + rest.join('.') : ''}`;
}
