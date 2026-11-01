import type { LlmMessage, LlmProvider, LlmResponse, ToolSpec } from '../domain/ports.js';

/**
 * Adaptador de OpenRouter (ADR-017): chat con herramientas, en el servidor.
 * La clave nunca sale del servidor (RF-10.13); OpenRouter informa el costo de cada llamada (RF-10.15).
 */
export class OpenRouterProvider implements LlmProvider {
  readonly mode = 'ia' as const;

  constructor(
    private readonly cfg: { apiKey: string; model: string; referer: string },
    private readonly timeoutMs = 25_000,
  ) {}

  async complete(request: { messages: LlmMessage[]; tools: ToolSpec[] }): Promise<LlmResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.cfg.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.cfg.referer,
          'X-Title': 'SIA-UNSCH Admision',
        },
        body: JSON.stringify({
          model: this.cfg.model,
          messages: request.messages,
          tools: request.tools,
          tool_choice: 'auto',
          temperature: 0.2,
          max_tokens: 700,
          usage: { include: true },
        }),
        signal: controller.signal,
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        model?: string;
        choices?: { message?: { content?: string | null; tool_calls?: LlmResponse['toolCalls'] } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
      };
      if (!res.ok || !body.choices?.length) throw new Error(`OpenRouter ${res.status}: ${body.error?.message ?? 'sin respuesta'}`);
      const msg = body.choices[0]?.message ?? {};
      return {
        content: msg.content ?? null,
        toolCalls: msg.tool_calls ?? [],
        usage: { tokensIn: body.usage?.prompt_tokens ?? 0, tokensOut: body.usage?.completion_tokens ?? 0, costUsd: body.usage?.cost ?? 0 },
        model: body.model ?? this.cfg.model,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
