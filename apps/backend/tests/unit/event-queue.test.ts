import { describe, expect, it } from '@jest/globals';
import pino from 'pino';
import { SqsEventQueue } from '../../src/shared/events/event-queue.js';

describe('Adaptador Amazon SQS', () => {
  it('correlaciona éxitos y fallos parciales sin incluir datos del evento', async () => {
    const commands: unknown[] = [];
    const client = {
      send: async (command: unknown) => {
        commands.push(command);
        return { Successful: [{ Id: '0', MessageId: 'aws-1' }], Failed: [{ Id: '1', Code: 'InternalError' }] };
      },
    };
    const queue = new SqsEventQueue(
      'https://sqs.us-east-2.amazonaws.com/123/sia-unsch-events',
      pino({ level: 'silent' }),
      client as never,
    );
    const result = await queue.send(['event-a', 'event-b']);
    expect(result).toEqual({
      sent: ['event-a'],
      failed: [{ eventId: 'event-b', code: 'InternalError', message: undefined }],
    });
    const input = (commands[0] as { input: { Entries: { MessageBody: string }[] } }).input;
    expect(input.Entries.map((entry) => JSON.parse(entry.MessageBody))).toEqual([
      { eventId: 'event-a' },
      { eventId: 'event-b' },
    ]);
  });

  it('divide en lotes de diez y reporta una caída de red por cada ID', async () => {
    let calls = 0;
    const client = {
      send: async () => {
        calls++;
        throw new Error('red no disponible');
      },
    };
    const queue = new SqsEventQueue(
      'https://sqs.us-east-2.amazonaws.com/123/sia-unsch-events',
      pino({ level: 'silent' }),
      client as never,
    );
    const ids = Array.from({ length: 11 }, (_, index) => `event-${index}`);
    const result = await queue.send(ids);
    expect(calls).toBe(2);
    expect(result.sent).toEqual([]);
    expect(result.failed).toHaveLength(11);
  });

  it('marca como no confirmados los eventos omitidos por la respuesta de SQS', async () => {
    let calls = 0;
    const client = {
      send: async () => {
        calls++;
        return {};
      },
    };
    const queue = new SqsEventQueue('queue-url', pino({ level: 'silent' }), client as never);

    await expect(queue.send(['event-a', 'event-b'])).resolves.toEqual({
      sent: [],
      failed: [
        { eventId: 'event-a', code: 'SQS_UNCONFIRMED' },
        { eventId: 'event-b', code: 'SQS_UNCONFIRMED' },
      ],
    });
    expect(calls).toBe(1);
  });

  it('ignora índices inválidos y asigna un código genérico si SQS omite el código', async () => {
    const client = {
      send: async () => ({
        Successful: [{ Id: '9' }],
        Failed: [{ Id: '0' }],
      }),
    };
    const queue = new SqsEventQueue('queue-url', pino({ level: 'silent' }), client as never);

    await expect(queue.send(['event-a', 'event-b'])).resolves.toEqual({
      sent: [],
      failed: [
        { eventId: 'event-a', code: 'SQS_REJECTED', message: undefined },
        { eventId: 'event-b', code: 'SQS_UNCONFIRMED' },
      ],
    });
  });

  it('convierte un rechazo que no es Error en un fallo descriptivo', async () => {
    const client = {
      send: async () => Promise.reject('credenciales inválidas'),
    };
    const queue = new SqsEventQueue('queue-url', pino({ level: 'silent' }), client as never);

    await expect(queue.send(['event-a'])).resolves.toEqual({
      sent: [],
      failed: [{ eventId: 'event-a', code: 'SQS_REQUEST_FAILED', message: 'credenciales inválidas' }],
    });
  });

  it('no envía solicitudes cuando no hay eventos', async () => {
    let calls = 0;
    const client = {
      send: async () => {
        calls++;
        return {};
      },
    };
    const queue = new SqsEventQueue('queue-url', pino({ level: 'silent' }), client as never);

    await expect(queue.send([])).resolves.toEqual({ sent: [], failed: [] });
    expect(calls).toBe(0);
  });

  it('acepta región inferida de la URL, región explícita y configuración AWS por defecto', async () => {
    const logger = pino({ level: 'silent' });
    const queues = [
      new SqsEventQueue('https://sqs.us-east-2.amazonaws.com/123/events', logger),
      new SqsEventQueue('queue-url', logger, undefined, 'us-west-2'),
      new SqsEventQueue('queue-url', logger),
    ];

    for (const queue of queues) await expect(queue.send([])).resolves.toEqual({ sent: [], failed: [] });
  });
});
