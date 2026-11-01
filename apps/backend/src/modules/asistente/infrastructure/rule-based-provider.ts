import { normalizeForSearch } from '../../../shared/text/normalize.js';
import { NO_INFO_REPLY } from '../domain/assistant-rules.js';
import type { LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec } from '../domain/ports.js';

const call = (name: string, args: Record<string, unknown> = {}): LlmToolCall => ({
  id: `basic-${name}`,
  type: 'function',
  function: { name, arguments: JSON.stringify(args) },
});
const reply = (content: string, toolCalls: LlmToolCall[] = []): LlmResponse => ({
  content, toolCalls, usage: { tokensIn: 0, tokensOut: 0, costUsd: 0 }, model: 'reglas',
});

/**
 * Modo básico (ADR-017 §5): sin IA, elige la herramienta por palabras clave y redacta con plantillas
 * solo lo que la herramienta devolvió. Se usa sin clave, con el proveedor caído o sin presupuesto.
 */
export class RuleBasedProvider implements LlmProvider {
  readonly mode = 'basico' as const;

  async complete(request: { messages: LlmMessage[]; tools: ToolSpec[] }): Promise<LlmResponse> {
    const last = request.messages.at(-1);
    if (last?.role === 'tool') return reply(this.compose(request.messages));
    const text = last?.role === 'user' ? last.content : '';
    return this.route(text);
  }

  private route(raw: string): LlmResponse {
    const t = normalizeForSearch(raw);
    if (/^(hola|buen[oa]s|saludos|hey)\b/.test(t) && t.length < 25) {
      return reply('¡Hola! Soy el asistente de Admisión UNSCH. Pregúntame por fechas, tasas, vacantes, requisitos o el examen, o pulsa «Consultar mi proceso» para ver tu inscripción.');
    }
    if (/\b(mi|mis)\b.*\b(inscripcion|pago|estado|aula|resultado|puntaje|documento|ficha|proceso|expediente)\b|\bcomo va\b|\bmi estado\b/.test(t)) {
      return reply('', [call('estado_de_mi_proceso')]);
    }
    if (/\bvacantes?\b/.test(t)) {
      const program = t.replace(/.*\bvacantes?\b\s*(tiene|hay|de|para|en)?\s*/, '').replace(/[¿?]/g, '').trim();
      return program ? reply('', [call('consultar_vacantes', { programa: program })]) : reply('', [call('buscar_conocimiento', { consulta: raw })]);
    }
    if (/\b(cuanto|costo|cuesta|tasa|tasas|precio|monto)\b/.test(t)) return reply('', [call('consultar_tasas')]);
    if (/\b(cronograma|fecha|fechas|plazo|hasta cuando|cuando (empieza|termina|cierra|vence)|cierre)\b/.test(t)) return reply('', [call('consultar_cronograma')]);
    if (/\brequisitos?\b/.test(t) && !/\bfoto/.test(t)) return reply('', [call('consultar_requisitos')]);
    return reply('', [call('buscar_conocimiento', { consulta: raw })]);
  }

  private compose(messages: LlmMessage[]): string {
    const tool = [...messages].reverse().find((m): m is Extract<LlmMessage, { role: 'tool' }> => m.role === 'tool');
    if (!tool) return NO_INFO_REPLY;
    const data = JSON.parse(tool.content) as Record<string, any>;
    const fuente = (data['_fuente'] as string | undefined) ?? '';
    const end = fuente ? `\n\nFuente: ${fuente}` : '';
    switch (tool.name) {
      case 'buscar_conocimiento': {
        const r = data['resultados']?.[0];
        return r ? `${r.respuesta}${end}` : NO_INFO_REPLY;
      }
      case 'consultar_tasas': {
        const base = (data['tasas'] as any[]).filter((x) => x.tipo === 'BASE').slice(0, 8);
        return `Montos del derecho de inscripción:\n${base.map((x) => `• ${x.concepto}: ${x.monto}`).join('\n')}${end}`;
      }
      case 'consultar_cronograma': {
        const etapas = (data['etapas'] as any[]).filter((e) => e.estado !== 'finalizada').slice(0, 6);
        return `Próximas etapas de la ${data['convocatoria']}:\n${etapas.map((e) => `• ${e.etapa}: del ${e.desde} al ${e.hasta} (${e.estado})`).join('\n')}${end}`;
      }
      case 'consultar_vacantes': {
        const ps = data['programas'] as any[];
        if (!ps?.length) return 'No encontré un programa con ese nombre. Escribe el nombre de la carrera, por ejemplo «Ingeniería de Sistemas».';
        return `${ps.map((p) => `• ${p.programa}: ${p.vacantesOrdinario} vacantes en Ordinario (${p.vacantesTotales} en total)`).join('\n')}${end}`;
      }
      case 'consultar_requisitos': {
        const g = (data['requisitosGenerales'] as any[]).map((r) => `• ${r.requisito}`).join('\n');
        return `Requisitos generales:\n${g}\n\n${data['detalle']}${end}`;
      }
      case 'estado_de_mi_proceso': {
        if (data['error'] === 'NO_IDENTIFICADO') return 'Para ver tu proceso, pulsa «Consultar mi proceso» y escribe tu DNI y tu código de postulante en ese formulario (no en el chat).';
        if (data['error']) return NO_INFO_REPLY;
        const i = data['inscripcion'];
        const p = data['pago'];
        return [
          `Tu inscripción en ${i.modalidad} (${i.programa}) está: ${i.estadoInscripcion}.`,
          `Pago: ${p.estadoPago}${p.monto ? ` (S/ ${p.monto})` : ''}.`,
          `Documentos: fotografía ${String(data['documentos'].fotografia).toLowerCase()}. ${data['documentos'].observaciones}`,
          data['expediente'] ? `Expediente: ${data['expediente'].estado}${data['expediente'].plazoSubsanacion ? `; tienes hasta el ${data['expediente'].plazoSubsanacion} para subsanar` : ''}.` : '',
          data['aula'].publicada ? `Aula: ${data['aula'].detalle}` : `Aula: aún no publicada. ${data['aula'].detalle}`,
          data['resultado'].publicado && data['resultado'].condicion
            ? `Resultado: ${data['resultado'].puntaje ?? '-'} puntos, puesto ${data['resultado'].puesto ?? '-'}, condición ${data['resultado'].condicion}.${data['resultado'].ingreso ? ` Ahora ${data['resultado'].ingreso}.` : ''}`
            : `Resultado: ${data['resultado'].publicado ? '' : 'aún no publicado. '}${data['resultado'].detalle ?? ''}`,
        ].filter(Boolean).join('\n') + end;
      }
      default:
        return NO_INFO_REPLY;
    }
  }
}
