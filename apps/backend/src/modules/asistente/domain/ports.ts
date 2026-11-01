/** Mensajes en el formato de chat con herramientas que usa OpenRouter (compatible con OpenAI). */
export type LlmMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: LlmToolCall[] }
  | { role: 'tool'; tool_call_id: string; name: string; content: string };

export interface LlmToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ToolSpec {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface LlmResponse {
  content: string | null;
  toolCalls: LlmToolCall[];
  usage: { tokensIn: number; tokensOut: number; costUsd: number };
  model: string;
}

/** Puerto del proveedor de IA (ADR-007, ADR-017): OpenRouter, reglas (modo básico) o guionado (pruebas). */
export interface LlmProvider {
  readonly mode: 'ia' | 'basico';
  complete(request: { messages: LlmMessage[]; tools: ToolSpec[] }): Promise<LlmResponse>;
}
