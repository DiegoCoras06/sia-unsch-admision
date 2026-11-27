import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { OpenRouterProvider } from '../../src/modules/asistente/infrastructure/openrouter-provider.js';

const request = {
  messages: [{ role: 'user' as const, content: '¿Cuánto cuesta la inscripción?' }],
  tools: [
    {
      type: 'function' as const,
      function: { name: 'consultar_tasas', description: 'Consulta tasas', parameters: { type: 'object' } },
    },
  ],
};

const provider = () =>
  new OpenRouterProvider({ apiKey: 'test-key', model: 'test/model', referer: 'https://admision.test' }, 1_000);

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Adaptador OpenRouter', () => {
  it('envía la solicitud con la clave solo en el servidor y devuelve contenido, herramientas, uso y modelo', async () => {
    const toolCall = {
      id: 'call-1',
      type: 'function' as const,
      function: { name: 'consultar_tasas', arguments: '{"modalidad":"ORD"}' },
    };
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          model: 'resolved/model',
          choices: [{ message: { content: 'La tasa es S/ 250.', tool_calls: [toolCall] } }],
          usage: { prompt_tokens: 12, completion_tokens: 8, cost: 0.0004 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(provider().complete(request)).resolves.toEqual({
      content: 'La tasa es S/ 250.',
      toolCalls: [toolCall],
      usage: { tokensIn: 12, tokensOut: 8, costUsd: 0.0004 },
      model: 'resolved/model',
    });

    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(options).toMatchObject({
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-key',
        'HTTP-Referer': 'https://admision.test',
        'X-Title': 'SIA-UNSCH Admision',
      },
    });
    expect(JSON.parse(String(options?.body))).toMatchObject({
      model: 'test/model',
      messages: request.messages,
      tools: request.tools,
      tool_choice: 'auto',
      usage: { include: true },
    });
  });

  it('aplica valores seguros cuando OpenRouter omite contenido, herramientas, uso y modelo', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: {} }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(provider().complete(request)).resolves.toEqual({
      content: null,
      toolCalls: [],
      usage: { tokensIn: 0, tokensOut: 0, costUsd: 0 },
      model: 'test/model',
    });
  });

  it('propaga un error descriptivo del proveedor y maneja respuestas no JSON', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'límite agotado' } }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await expect(provider().complete(request)).rejects.toThrow('OpenRouter 429: límite agotado');

    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('no-json', { status: 503 }));
    await expect(provider().complete(request)).rejects.toThrow('OpenRouter 503: sin respuesta');
  });
});
