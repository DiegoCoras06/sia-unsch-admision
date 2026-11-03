// ADR-021: la bandeja de eventos envía los ID a una cola (Amazon SQS en AWS) y el worker los procesa una sola vez.
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import type { EventQueue } from '../../src/shared/events/event-queue.js';
import { movableClock, testApp } from '../helpers.js';

class FakeQueue implements EventQueue {
  sent: string[] = [];
  failing = false;
  async send(eventIds: string[]) {
    if (this.failing) throw new Error('SQS no disponible');
    this.sent.push(...eventIds);
  }
}

const clock = movableClock('2026-10-25T10:00:00-05:00');
const queue = new FakeQueue();
const t = testApp(clock, { eventQueue: queue });
afterAll(() => t.db.$disconnect());

// Suscriptor de prueba: cuenta cuántas veces se procesa cada evento y falla a pedido.
const handled = new Map<string, number>();
const failFor = new Set<string>();
t.outbox.subscribe('ContrasenaCambiada', async (payload) => {
  if (failFor.has(payload.email)) throw new Error('fallo simulado');
  handled.set(payload.email, (handled.get(payload.email) ?? 0) + 1);
});

async function publish(email: string): Promise<string> {
  await t.db.$transaction((tx) => t.outbox.publish(tx, 'ContrasenaCambiada', { userId: randomUUID(), email }));
  const row = await t.db.outboxEvent.findFirstOrThrow({ where: { payload: { path: ['email'], equals: email } } });
  return row.id;
}

describe('Bandeja de eventos con cola (ADR-021)', () => {
  it('envía el ID a la cola sin procesarlo y no lo vuelve a enviar', async () => {
    const id = await publish(`cola-${randomUUID()}@prueba.test`);
    await t.outbox.dispatch(500);
    expect(queue.sent).toContain(id);
    const row = await t.db.outboxEvent.findUniqueOrThrow({ where: { id } });
    expect(row.processedAt).toBeNull();
    expect(row.queuedAt).not.toBeNull();

    const before = queue.sent.filter((x) => x === id).length;
    await t.outbox.dispatch(500);
    expect(queue.sent.filter((x) => x === id).length).toBe(before);
  });

  it('procesa una sola vez aunque el mensaje llegue repetido', async () => {
    const email = `repetido-${randomUUID()}@prueba.test`;
    const id = await publish(email);
    expect(await t.outbox.processEvent(id)).toBe(true);
    expect(await t.outbox.processEvent(id)).toBe(true);
    expect(handled.get(email)).toBe(1);
    expect((await t.db.outboxEvent.findUniqueOrThrow({ where: { id } })).processedAt).not.toBeNull();
  });

  it('informa el fallo para que la cola reintente, y reenvía el evento atascado', async () => {
    const email = `falla-${randomUUID()}@prueba.test`;
    failFor.add(email);
    const id = await publish(email);
    await t.outbox.dispatch(500);
    expect(await t.outbox.processEvent(id)).toBe(false);
    expect((await t.db.outboxEvent.findUniqueOrThrow({ where: { id } })).lastError).toBe('fallo simulado');

    const sentBefore = queue.sent.filter((x) => x === id).length;
    clock.advance(6 * 60);
    await t.outbox.dispatch(500);
    expect(queue.sent.filter((x) => x === id).length).toBe(sentBefore + 1);

    failFor.delete(email);
    expect(await t.outbox.processEvent(id)).toBe(true);
    expect(handled.get(email)).toBe(1);
  });

  it('si la cola no responde, el evento queda pendiente para el próximo intento', async () => {
    const id = await publish(`sin-sqs-${randomUUID()}@prueba.test`);
    queue.failing = true;
    await t.outbox.dispatch(500);
    queue.failing = false;
    expect((await t.db.outboxEvent.findUniqueOrThrow({ where: { id } })).queuedAt).toBeNull();
    await t.outbox.dispatch(500);
    expect(queue.sent).toContain(id);
  });
});
