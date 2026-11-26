import { describe, expect, it, jest } from '@jest/globals';
import pino from 'pino';
import { processSqsBatch } from '../../src/shared/events/sqs-batch.js';

const logger = pino({ level: 'silent' });

describe('Lambda Worker: lote SQS', () => {
  it('devuelve únicamente los mensajes fallidos para ReportBatchItemFailures', async () => {
    const process = jest.fn(async (id: string) => id !== 'fail');
    const result = await processSqsBatch(
      {
        Records: [
          { messageId: 'm-ok', body: JSON.stringify({ eventId: 'ok' }) },
          { messageId: 'm-fail', body: JSON.stringify({ eventId: 'fail' }) },
        ],
      },
      process,
      logger,
    );
    expect(result).toEqual({ batchItemFailures: [{ itemIdentifier: 'm-fail' }] });
    expect(process).toHaveBeenCalledTimes(2);
  });

  it('rechaza mensajes inválidos sin detener el lote', async () => {
    const process = jest.fn(async (_id: string) => true);
    const result = await processSqsBatch(
      {
        Records: [
          { messageId: 'm-json', body: '{' },
          { messageId: 'm-empty', body: '{}' },
          { messageId: 'm-ok', body: JSON.stringify({ eventId: 'event-1' }) },
        ],
      },
      process,
      logger,
    );
    expect(result.batchItemFailures).toEqual([{ itemIdentifier: 'm-json' }, { itemIdentifier: 'm-empty' }]);
    expect(process).toHaveBeenCalledWith('event-1');
  });
});
