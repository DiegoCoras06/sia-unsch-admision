import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from '@jest/globals';
import { movableClock, testApp } from '../helpers.js';

const clock = movableClock('2026-10-25T10:00:00-05:00');
const t = testApp(clock);
afterAll(() => t.db.$disconnect());

function fakeJpeg(): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 1, 64, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}

const inscription = (documentNumber: string) => ({
  documentType: 'CE', documentNumber, paternalSurname: 'PRUEBA', maternalSurname: 'CONFIABILIDAD', firstNames: 'SPRINT DOS', sex: 'F',
  maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-03-14', address: 'Jr. Lima 123, Ayacucho',
  residenceUbigeo: '050101', economicDependency: 'PADRES', mobile: '987654321', email: `${documentNumber.toLowerCase()}@example.com`,
  photo: fakeJpeg(), schoolUbigeo: '050101', schoolName: 'IE Prueba', schoolType: 'ESTATAL', graduationYear: 2025,
  inFourthOrBelow: false, preparation: 'ACADEMIA', attempts: 1, modality: 'ORD', quotaCategory: 'ORD', campus: 'HUAMANGA',
  optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
});

describe('Confiabilidad transversal del Sprint 2', () => {
  it('separa liveness, readiness, dependencias y métricas sin datos personales', async () => {
    expect((await t.request.get('/api/v1/health/live').expect(200)).body.data.status).toBe('alive');
    expect((await t.request.get('/api/v1/health/ready').expect(200)).body.data).toMatchObject({ status: 'ready', database: 'ok' });
    const dependencies = (await t.request.get('/api/v1/health/dependencies').expect(200)).body.data;
    expect(dependencies).toHaveProperty('circuits');
    expect(JSON.stringify(dependencies)).not.toMatch(/secret|password/i);
    const metrics = (await t.request.get('/api/v1/health/metrics').expect(200)).body.data;
    expect(metrics).toMatchObject({ idempotency: expect.any(Object), outbox: expect.any(Object) });
    expect(metrics.http['GET:2xx'].count).toBeGreaterThanOrEqual(3);
  });

  it('repite una respuesta con Idempotency-Key sin crear otra inscripción y rechaza cambiar los datos', async () => {
    const suffix = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
    const documentNumber = `CE${suffix}`;
    const key = `inscription:${suffix}`;
    const body = inscription(documentNumber);
    const first = await t.request.post('/api/v1/inscriptions').set('Idempotency-Key', key).send(body).expect(201);
    const replay = await t.request.post('/api/v1/inscriptions').set('Idempotency-Key', key).send(body).expect(201);
    expect(replay.headers['idempotency-replayed']).toBe('true');
    expect(replay.body).toEqual(first.body);
    expect(await t.db.application.count({ where: { documentNumber } })).toBe(1);

    const conflict = await t.request.post('/api/v1/inscriptions').set('Idempotency-Key', key).send({ ...body, mobile: '999999999' }).expect(409);
    expect(conflict.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('envía a DLQ tras cinco fallos espaciados y permite reintentar manualmente', async () => {
    const email = `dlq-${randomUUID()}@example.com`;
    let failing = true;
    t.outbox.subscribe('ContrasenaCambiada', async (payload) => {
      if (payload.email === email && failing) throw new Error('fallo persistente simulado');
    });
    await t.db.$transaction((tx) => t.outbox.publish(tx, 'ContrasenaCambiada', { userId: randomUUID(), email }));
    const event = await t.db.outboxEvent.findFirstOrThrow({ where: { payload: { path: ['email'], equals: email } } });

    for (let attempt = 1; attempt <= 5; attempt++) {
      expect(await t.outbox.processEvent(event.id)).toBe(attempt === 5);
      clock.advance(6 * 60);
    }
    const dead = await t.db.outboxEvent.findUniqueOrThrow({ where: { id: event.id } });
    expect(dead).toMatchObject({ attempts: 5, lastError: 'fallo persistente simulado' });
    expect(dead.deadLetteredAt).not.toBeNull();
    expect((await t.outbox.stats()).dead).toBeGreaterThanOrEqual(1);

    failing = false;
    expect(await t.outbox.retryDead(event.id)).toBe(true);
    await t.outbox.dispatch(100);
    expect((await t.db.outboxEvent.findUniqueOrThrow({ where: { id: event.id } })).processedAt).not.toBeNull();
  });
});
