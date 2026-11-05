import type { EmailSender } from '../../../shared/email/email-sender.js';
import { renderEmail } from '../../../shared/email/email-sender.js';
import type { Outbox } from '../../../shared/events/outbox.js';

const limaTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' });

/**
 * Correos de la cuenta (provisionales hasta la spec 010 de notificaciones).
 * Ningún asunto contiene datos personales (RNF-03).
 */
export function subscribeAccountNotifications(outbox: Outbox, email: EmailSender, frontendOrigin: string): void {
  outbox.subscribe('InicioSesionNuevo', async (e) => {
    const when = new Date(e.at).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'long', timeStyle: 'short' });
    const { html, text } = renderEmail('Nuevo inicio de sesión en tu cuenta', [
      'Alguien entró a tu cuenta desde un dispositivo que no habías usado antes.',
      'Si fuiste tú, no necesitas hacer nada. Si no reconoces este ingreso, cierra esa sesión y cambia tu contraseña.',
    ], {
      facts: [['Dispositivo', e.device], ['Fecha y hora', when]],
      action: { label: 'Revisar mis sesiones', url: `${frontendOrigin}${e.staff ? '/admin/seguridad' : '/mi-cuenta'}` },
    });
    await email.send({ to: e.email, subject: 'Nuevo inicio de sesión - Admisión UNSCH', html, text });
  });

  outbox.subscribe('CodigoVerificacionSolicitado', async (e) => {
    const { html, text } = renderEmail('Tu código de verificación', [
      `Hola ${e.firstNames || 'postulante'}:`,
      `Tu código para verificar tu correo es <strong style="font-size:22px;letter-spacing:4px">${e.code}</strong>.`,
      'Vence en 15 minutos. Si no solicitaste este código, ignora este mensaje.',
    ]);
    await email.send({ to: e.email, subject: 'Código de verificación - Admisión UNSCH', html, text });
  });

  outbox.subscribe('CuentaCreada', async (e) => {
    const { html, text } = renderEmail('¡Tu cuenta está activa!', [
      `Hola ${e.firstNames}:`,
      `Tu código de postulante es <strong>${e.applicantCode}</strong>. Lo necesitarás para pagar y consultar tu proceso.`,
      `Ingresa a <a href="${frontendOrigin}/ingresar">${frontendOrigin}/ingresar</a> para continuar.`,
    ]);
    await email.send({ to: e.email, subject: 'Cuenta creada - Admisión UNSCH', html, text });
  });

  outbox.subscribe('CuentaBloqueada', async (e) => {
    const { html, text } = renderEmail('Bloqueamos tu cuenta temporalmente', [
      `Detectamos 5 intentos fallidos de inicio de sesión. Podrás volver a intentarlo a partir de las ${limaTime(e.lockedUntil)} (hora de Lima).`,
      `Si no fuiste tú, cambia tu contraseña en <a href="${frontendOrigin}/recuperar">${frontendOrigin}/recuperar</a>.`,
    ]);
    await email.send({ to: e.email, subject: 'Aviso de seguridad - Admisión UNSCH', html, text });
  });

  outbox.subscribe('RecuperacionSolicitada', async (e) => {
    const { html, text } = renderEmail('Restablece tu contraseña', [
      'Recibimos una solicitud para restablecer tu contraseña.',
      `<a href="${e.resetUrl}" style="display:inline-block;background:#7a1c22;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Crear nueva contraseña</a>`,
      'El enlace vence en 30 minutos y solo funciona una vez. Si no lo solicitaste, ignora este mensaje.',
    ]);
    await email.send({ to: e.email, subject: 'Recuperación de contraseña - Admisión UNSCH', html, text });
  });

  outbox.subscribe('ContrasenaCambiada', async (e) => {
    const { html, text } = renderEmail('Cambiaste tu contraseña', [
      'Tu contraseña se cambió correctamente y cerramos todas tus sesiones abiertas.',
      'Si no fuiste tú, comunícate de inmediato con la Dirección de Admisión.',
    ]);
    await email.send({ to: e.email, subject: 'Contraseña actualizada - Admisión UNSCH', html, text });
  });

  outbox.subscribe('CasoContactoCreado', async (e) => {
    const { html, text } = renderEmail('Recibimos tu mensaje', [
      `Hola ${e.name}:`,
      `Registramos tu consulta con el número de caso <strong>${e.caseNumber}</strong>. Te responderemos por este medio.`,
    ]);
    await email.send({ to: e.email, subject: `Caso ${e.caseNumber} - Admisión UNSCH`, html, text });
  });
}
