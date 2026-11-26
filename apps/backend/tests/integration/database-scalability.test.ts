import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { testApp } from '../helpers.js';

const t = testApp('2026-10-25T10:00:00-05:00');
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

function fakeJpeg(): string {
  const sof = Buffer.from([0xff, 0xc0, 0, 17, 8, 1, 64, 0, 240, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}

function inscription(documentNumber: string) {
  return {
    documentType: 'CE',
    documentNumber,
    paternalSurname: 'PRUEBA',
    maternalSurname: 'CONCURRENCIA',
    firstNames: 'BASE DATOS',
    sex: 'F',
    maritalStatus: 'SOLTERO',
    birthUbigeo: '050101',
    birthDate: '2008-03-14',
    address: 'Jr. Lima 123, Ayacucho',
    residenceUbigeo: '050101',
    economicDependency: 'PADRES',
    mobile: '987654321',
    email: `${documentNumber.toLowerCase()}@example.com`,
    photo: fakeJpeg(),
    schoolUbigeo: '050101',
    schoolName: 'IE Prueba de concurrencia',
    schoolType: 'ESTATAL',
    graduationYear: 2025,
    inFourthOrBelow: false,
    preparation: 'ACADEMIA',
    attempts: 1,
    modality: 'ORD',
    quotaCategory: 'ORD',
    campus: 'HUAMANGA',
    optionCode: 'P34',
    militaryCondition: 'NONE',
    familyLink: false,
    declarationAccepted: true,
    consentVersion: '2026-10-v1',
  };
}

describe('Escalabilidad de PostgreSQL y del pool de conexiones', () => {
  it('atiende 100 lecturas concurrentes mediante un pool acotado', async () => {
    const started = performance.now();
    const responses = await Promise.all(
      Array.from({ length: 100 }, (_, index) =>
        index % 2 === 0
          ? t.request.get('/api/v1/calls/current')
          : t.request.get('/api/v1/calls/2027-I/options').query({ q: 'sistemas' }),
      ),
    );
    const elapsedMs = performance.now() - started;

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(elapsedMs).toBeLessThan(10_000);
    console.info(`[DB-SCALE] lecturas=100 duración_ms=${Math.round(elapsedMs)} errores=0`);
  });

  it('registra 12 inscripciones simultáneas sin colisiones de código ni agotar el pool', async () => {
    const run = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
    const documents = Array.from({ length: 12 }, (_, index) => `SC${run}${String(index).padStart(2, '0')}`);
    const started = performance.now();
    const responses = await Promise.all(
      documents.map((documentNumber, index) =>
        t.request
          .post('/api/v1/inscriptions')
          .set('X-Forwarded-For', `10.20.0.${index + 1}`)
          .send(inscription(documentNumber)),
      ),
    );
    const elapsedMs = performance.now() - started;
    const codes = responses.map((response) => response.body.data?.applicantCode);

    expect(responses.map((response) => response.status)).toEqual(Array(12).fill(201));
    expect(new Set(codes).size).toBe(12);
    expect(await t.db.application.count({ where: { documentNumber: { in: documents } } })).toBe(12);
    expect(elapsedMs).toBeLessThan(15_000);
    console.info(`[DB-SCALE] escrituras=12 duración_ms=${Math.round(elapsedMs)} códigos_únicos=12 errores=0`);
  });

  it('una carrera de ocho solicitudes para el mismo documento conserva una sola inscripción', async () => {
    const documentNumber = `RC${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        t.request
          .post('/api/v1/inscriptions')
          .set('X-Forwarded-For', `10.30.0.${index + 1}`)
          .send(inscription(documentNumber)),
      ),
    );
    const statuses = responses.map((response) => response.status);

    expect(statuses.filter((status) => status === 201)).toHaveLength(1);
    expect(statuses.every((status) => status === 201 || status === 409)).toBe(true);
    expect(await t.db.application.count({ where: { documentNumber } })).toBe(1);
    console.info('[DB-SCALE] carrera_mismo_documento=8 creadas=1 conflictos_controlados=7 duplicados=0');
  });
});
