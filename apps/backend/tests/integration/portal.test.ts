import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testApp } from '../helpers.js';

const t = testApp('2026-10-25T10:00:00-05:00');
afterAll(() => t.db.$disconnect());

describe('Semilla 2027-I (T030, SC-003 de 001)', () => {
  it('40 opciones, 18/13/9 por área, 926 ordinario y 1803 en total', async () => {
    const options = await t.request.get('/api/v1/calls/2027-I/options').expect(200);
    expect(options.body.meta).toEqual({ totalOptions: 40, totalVacancies: 1803 });
    const ord = options.body.data.reduce((s: number, o: { ordinaryVacancies: number }) => s + o.ordinaryVacancies, 0);
    expect(ord).toBe(926);

    const areas = await t.request.get('/api/v1/calls/2027-I/areas').expect(200);
    expect(areas.body.data.map((a: { optionCount: number }) => a.optionCount)).toEqual([18, 13, 9]);
  });

  it('cada fila del cuadro suma su total y hay 34 programas', async () => {
    expect(await t.db.program.count()).toBe(34);
    // Solo la 2027-I: otras pruebas pueden copiar la convocatoria (panel, Historia 1).
    expect(await t.db.vacancy.count({ where: { call: { code: '2027-I' } } })).toBe(640);
  });
});

describe('Historia 1 - convocatoria y cronograma', () => {
  it('H1-E1: etapa en curso y siguiente hito', async () => {
    const res = await t.request.get('/api/v1/calls/current').expect(200);
    expect(res.headers['cache-control']).toBe('public, max-age=60, s-maxage=300, stale-while-revalidate=300');
    const inProgress = res.body.data.stages.filter((s: { status: string }) => s.status === 'IN_PROGRESS').map((s: { code: string }) => s.code);
    expect(inProgress).toContain('ORD_REGULAR');
    expect(res.body.data.nextMilestone).toMatchObject({ code: 'EXAM_EXO', secondsRemaining: 1_803_600 });
  });

  it('H1-E4: sin convocatoria publicada responde 404 "Próximamente"', async () => {
    await t.db.admissionCall.updateMany({ where: { code: '2027-I' }, data: { status: 'DRAFT' } });
    try {
      const res = await t.request.get('/api/v1/calls/current').expect(404);
      expect(res.body.error.message).toContain('Próximamente');
    } finally {
      await t.db.admissionCall.updateMany({ where: { code: '2027-I' }, data: { status: 'PUBLISHED' } });
    }
  });
});

describe('Historia 2 - programas y vacantes', () => {
  it('H2-E1: "sistemas" encuentra Ingeniería de Sistemas (20 ORD, 50 en total)', async () => {
    const res = await t.request.get('/api/v1/calls/2027-I/options').query({ q: 'sistemas' }).expect(200);
    expect(res.body.data).toEqual([expect.objectContaining({ internalCode: 'P34', area: 'I', ordinaryVacancies: 20, totalVacancies: 50 })]);
  });

  it('búsqueda sin tildes: "biologia" encuentra las 3 especialidades', async () => {
    const res = await t.request.get('/api/v1/calls/2027-I/options').query({ q: 'biologia' }).expect(200);
    expect(res.body.data).toHaveLength(3);
  });

  it('H2-E3: graduados - 8 opciones sin vacantes en esa categoría', async () => {
    const res = await t.request.get('/api/v1/calls/2027-I/options').query({ category: 'GRA' }).expect(200);
    expect(res.body.data.filter((o: { categoryVacancies: number }) => o.categoryVacancies === 0)).toHaveLength(8);
  });

  it('H2-E4: ficha con facultad, duración, grado, título y 16 categorías', async () => {
    const res = await t.request.get('/api/v1/calls/2027-I/options/P27').expect(200);
    expect(res.body.data).toMatchObject({ displayName: 'Ingeniería Agrícola', faculty: 'Facultad de Ciencias Agrarias', durationYears: 5, professionalTitle: 'Ingeniero(a) Agrícola' });
    expect(res.body.data.vacanciesByCategory).toHaveLength(16);
  });

  it('opción inexistente → 404; código mal formado → 400', async () => {
    await t.request.get('/api/v1/calls/2027-I/options/P99').expect(404);
    await t.request.get('/api/v1/calls/2027-I/options/abc').expect(400);
  });
});

describe('Historia 3 - simulador por API', () => {
  it('H3-E3: extemporáneo suma S/ 65.00 → S/ 315.00', async () => {
    const res = await t.request
      .get('/api/v1/calls/2027-I/fee-quote')
      .query({ modality: 'ORD', schoolType: 'ESTATAL', at: '2026-11-08T10:00:00-05:00' })
      .expect(200);
    expect(res.body.data.total).toBe('315.00');
    expect(res.body.data.lines.map((l: { code: string }) => l.code)).toEqual(['T-1.1E', 'T-4']);
  });

  it('modalidad inválida → 400 con detalle', async () => {
    const res = await t.request.get('/api/v1/calls/2027-I/fee-quote').query({ modality: 'XYZ' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.requestId).toBeTruthy();
  });
});

describe('Historias 4 y 5 - contenido', () => {
  it('H4-E1: deportista = 4 documentos base + 3 del Art. 40', async () => {
    const res = await t.request.get('/api/v1/calls/2027-I/requirements').query({ submodality: 'EXO-DEP' }).expect(200);
    expect(res.body.data.filter((r: { isBase: boolean }) => r.isBase)).toHaveLength(4);
    expect(res.body.data.filter((r: { article: string }) => r.article === 'Art. 40')).toHaveLength(3);
  });

  it('graduados no usan la base común (Art. 42)', async () => {
    const res = await t.request.get('/api/v1/calls/2027-I/requirements').query({ submodality: 'EXO-GRA' }).expect(200);
    expect(res.body.data.every((r: { isBase: boolean }) => !r.isBase)).toBe(true);
  });

  it('H4-E2: "trigonometria" lleva a II. Matemática → Trigonometría', async () => {
    const res = await t.request.get('/api/v1/calls/2027-I/syllabus').query({ q: 'trigonometria' }).expect(200);
    expect(res.body.data[0].children[0].path).toEqual(['II. Matemática', 'Trigonometría']);
  });

  it('H5-E1/E2: una fe de erratas sobre tasas aparece primero y filtrable por sección', async () => {
    await t.db.announcement.create({
      data: { callCode: '2027-I', type: 'FE_ERRATAS', title: 'Fe de erratas (prueba)', bodyMd: 'Texto de prueba', affectsSection: 'TASAS', publishedAt: new Date('2026-10-20T09:00:00-05:00') },
    });
    const all = await t.request.get('/api/v1/announcements').expect(200);
    expect(all.body.data[0].type).toBe('FE_ERRATAS');
    const fees = await t.request.get('/api/v1/announcements').query({ section: 'TASAS' }).expect(200);
    expect(fees.body.data).toHaveLength(1);
    await t.db.announcement.deleteMany({ where: { title: 'Fe de erratas (prueba)' } });
  });
});

describe('Historia 6 - inicio y contacto', () => {
  beforeAll(() => t.db.rateLimitCounter.deleteMany({ where: { key: { startsWith: 'contact:' } } }));

  it('accesos rápidos según etapa: inscripción abierta, reinscripción desde el 16/11', async () => {
    const res = await t.request.get('/api/v1/content/home').expect(200);
    const byKey = Object.fromEntries(res.body.data.quickAccess.map((q: { key: string }) => [q.key, q]));
    expect(byKey['INSCRIPCION'].enabled).toBe(true);
    expect(byKey['REINSCRIPCION']).toMatchObject({ enabled: false, reason: 'Disponible desde el 16/11' });
  });

  it('H6-E2/E3: contacto crea caso numerado, envía copia y limita a 5 por hora', async () => {
    const body = { name: 'Persona de Prueba', email: 'contacto@example.com', message: 'Consulta sobre requisitos de traslado.' };
    const first = await t.request.post('/api/v1/support/contact').send(body).expect(201);
    expect(first.body.data.caseNumber).toMatch(/^C-2027I-\d{6}$/);
    await t.outbox.dispatch();
    expect(t.email.sent.some((m) => m.subject.includes(first.body.data.caseNumber))).toBe(true);

    for (let i = 0; i < 4; i++) await t.request.post('/api/v1/support/contact').send(body).expect(201);
    const sixth = await t.request.post('/api/v1/support/contact').send(body).expect(429);
    expect(sixth.headers['retry-after']).toBeTruthy();
  });

  it('el campo trampa responde 201 sin crear caso', async () => {
    const before = await t.db.supportCase.count({ where: { email: 'bot@example.com' } });
    await t.request.post('/api/v1/support/contact').send({ name: 'Bot', email: 'bot@example.com', message: 'mensaje automático', website: 'http://spam' }).expect(201);
    expect(await t.db.supportCase.count({ where: { email: 'bot@example.com' } })).toBe(before);
  });
});
