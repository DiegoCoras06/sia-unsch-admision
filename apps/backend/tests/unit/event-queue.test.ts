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
});
