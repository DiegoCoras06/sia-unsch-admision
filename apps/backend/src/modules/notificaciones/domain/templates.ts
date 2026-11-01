import { renderEmail } from '../../../shared/email/email-sender.js';

/** Plantillas por defecto (FR-006). Admisión las edita en el panel; nunca llevan puntajes ni DNI (RNF-03). */
export const DEFAULT_TEMPLATES = {
  RECORDATORIO_PAGO: {
    name: 'Recordatorio de pago (2 días antes del cierre)',
    subject: 'Recuerda pagar tu inscripción - Admisión UNSCH',
    body: 'Hola {{nombre}}:\nTu inscripción {{codigo}} sigue pendiente de pago (S/ {{monto}}).\nLa inscripción regular cierra el {{fecha}}. Después solo queda la extemporánea, con recargo.\nPaga en línea en {{enlace}} con tu DNI y tu código.',
  },
  RECORDATORIO_EXAMEN: {
    name: 'Recordatorio la víspera del examen',
    subject: 'Mañana es tu examen de admisión',
    body: 'Hola {{nombre}}:\nMañana rindes el {{examen}}. El ingreso al local es de {{apertura}} a {{cierre}}; después no se permite el ingreso.\nLleva: {{llevar}}.\nRevisa tu aula y descarga tu ficha de examen en {{enlace}}.',
  },
  AULA_PUBLICADA: {
    name: 'Aula de examen publicada',
    subject: 'Tu aula de examen ya está publicada',
    body: 'Hola {{nombre}}:\nYa puedes ver tu aula para el {{examen}} y descargar tu ficha de examen.\nIngresa a {{enlace}} con tu DNI y tu código {{codigo}}.',
  },
  RESULTADOS_DISPONIBLES: {
    name: 'Resultados disponibles',
    subject: 'Los resultados del examen ya están disponibles',
    body: 'Hola {{nombre}}:\nYa se publicaron los resultados oficiales del {{examen}}.\nConsulta tu puntaje y tu condición en {{enlace}} con tu DNI y tu código {{codigo}}.',
  },
} as const;

export type TemplateKey = keyof typeof DEFAULT_TEMPLATES;

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Reemplaza {{variables}} (escapadas) y arma el correo con el diseño institucional. */
export function fill(subject: string, body: string, vars: Record<string, string>): { subject: string; html: string; text: string } {
  const put = (s: string, html: boolean) => s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    const v = vars[k] ?? '';
    return html ? (k === 'enlace' ? `<a href="${escape(v)}">${escape(v)}</a>` : escape(v)) : v;
  });
  const title = put(subject, false);
  const paragraphs = body.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const { html } = renderEmail(escape(title), paragraphs.map((p) => put(escape(p), true)));
  const text = `${title}\n\n${paragraphs.map((p) => put(p, false)).join('\n\n')}`;
  return { subject: title, html, text };
}
