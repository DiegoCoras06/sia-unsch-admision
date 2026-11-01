import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { MemoryFileStorage } from '../../src/shared/storage/file-storage.js';
import { testApp } from '../helpers.js';

const t = testApp('2026-10-25T10:00:00-05:00');
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

/** JPEG mínimo con cabecera SOF0 de las dimensiones pedidas (suficiente para la validación del servidor). */
function fakeJpeg(width: number, height: number): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  const buf = Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof, Buffer.from([0xff, 0xd9])]);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

const base = {
  documentType: 'DNI',
  paternalSurname: 'ESCRITO',
  maternalSurname: 'A MANO',
  firstNames: 'POSTULANTE',
  sex: 'F',
  maritalStatus: 'SOLTERO',
  birthUbigeo: '050101',
  birthDate: '2008-03-14',
  address: 'Jr. Lima 123, Ayacucho',
  residenceUbigeo: '050101',
  economicDependency: 'PADRES',
  mobile: '987654321',
  email: 'postulante@example.com',
  photo: fakeJpeg(240, 320),
  schoolUbigeo: '050101',
  schoolName: 'IE Mariscal Cáceres',
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
  declarationAccepted: true, consentVersion: '2026-10-v1',
} as const;

const post = (over: Record<string, unknown>) => t.request.post('/api/v1/inscriptions').send({ ...base, ...over });

describe('Autocompletar por DNI (ADR-015)', () => {
  it('un DNI conocido devuelve apellidos y nombres sin dígito verificador', async () => {
    const res = await t.request.post('/api/v1/identity/lookup').send({ documentType: 'DNI', documentNumber: '99900030' }).expect(200);
    expect(res.body.data).toMatchObject({ found: true, simulated: true, alreadyRegistered: false });
    expect(res.body.data.paternalSurname).toBeTruthy();
  });

  it('carné de extranjería → se escribe a mano', async () => {
    const res = await t.request.post('/api/v1/identity/lookup').send({ documentType: 'CE', documentNumber: '001234567' }).expect(200);
    expect(res.body.data.found).toBe(false);
  });

  it('DNI vencido → 422', async () => {
    await t.request.post('/api/v1/identity/lookup').send({ documentType: 'DNI', documentNumber: '99900044' }).expect(422);
  });
});

describe('Registrar inscripción (spec 003, H1–H3)', () => {
  it('ordinario, colegio estatal: registra con nombres del proveedor, tasa S/ 250.00 y código Luhn', async () => {
    const res = await post({ documentNumber: '99900030' }).expect(201);
    expect(res.body.data).toMatchObject({
      status: 'PENDIENTE_PAGO',
      program: 'Ingeniería de Sistemas',
      fee: { total: '250.00' },
      maskedDocument: '9990••30',
    });
    expect(res.body.data.applicantCode).toMatch(/^\d{8}$/);
    expect(res.body.data.fullName).not.toContain('ESCRITO');
    const row = await t.db.application.findUniqueOrThrow({ where: { applicantCode: res.body.data.applicantCode } });
    expect(row.identityStatus).toBe('VERIFIED');

    await t.outbox.dispatch();
    expect(t.email.sent.some((m) => m.to === 'postulante@example.com' && m.text.includes(res.body.data.applicantCode))).toBe(true);
  });

  it('RN-06: el mismo DNI no se inscribe dos veces en la convocatoria → 409', async () => {
    expect((await post({ documentNumber: '99900030' }).expect(409)).body.error.code).toBe('ALREADY_REGISTERED');
  });

  it('RN-09: padrón de inhabilitados → 422', async () => {
    expect((await post({ documentNumber: '99900045' }).expect(422)).body.error.code).toBe('REGISTRATION_NOT_ALLOWED');
  });

  it('CEPRE antes del 11/11 → 422 STAGE_CLOSED con la fecha de apertura', async () => {
    const res = await post({ documentNumber: '99900031', modality: 'CEPRE', quotaCategory: 'CE-I' }).expect(422);
    expect(res.body.error.code).toBe('STAGE_CLOSED');
    expect(res.body.error.message).toContain('11 de noviembre');
  });

  it('programa sin vacantes en la categoría → 422 NO_VACANCIES', async () => {
    const res = await post({ documentNumber: '99900032', modality: 'EXO', quotaCategory: 'GRA', optionCode: 'P37' }).expect(422);
    expect(res.body.error.code).toBe('NO_VACANCIES');
  });

  it('exonerado queda pendiente de validación de requisitos (RN-24) con su tasa', async () => {
    const res = await post({ documentNumber: '99900033', modality: 'EXO', quotaCategory: 'TEN', optionCode: 'P34', email: 'exo@example.com' }).expect(201);
    expect(res.body.data).toMatchObject({ status: 'PENDIENTE_VALIDACION', fee: { total: '380.00' } });
  });

  it('4.º de secundaria → sin derecho a vacante (RN-13)', async () => {
    const res = await post({ documentNumber: '99900034', inFourthOrBelow: true, email: 'cuarto@example.com' }).expect(201);
    expect(res.body.data.noVacancyRight).toBe(true);
  });

  it('foto de otro tamaño → 400; sin declaración jurada → 400; ubigeo falso → 422', async () => {
    expect((await post({ documentNumber: '99900035', photo: fakeJpeg(300, 400) }).expect(400)).body.error.message).toContain('240 × 320');
    await post({ documentNumber: '99900035', declarationAccepted: false }).expect(400);
    expect((await post({ documentNumber: '99900035', birthUbigeo: '999999' }).expect(422)).body.error.code).toBe('INVALID_UBIGEO');
  });

  it('carné de extranjería se registra con los nombres escritos e identidad pendiente', async () => {
    const res = await post({ documentType: 'CE', documentNumber: '001234567', email: 'ce@example.com' }).expect(201);
    expect(res.body.data.fullName).toBe('POSTULANTE ESCRITO A MANO');
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: res.body.data.applicantCode } })).identityStatus).toBe('PENDING');
  });
});

describe('Consultar inscripción con DNI + código (H4)', () => {
  it('con los datos correctos devuelve el estado; con otro código, 404 sin revelar cuál falló', async () => {
    const row = await t.db.application.findFirstOrThrow({ where: { documentNumber: '99900030' } });
    const ok = await t.request.get('/api/v1/inscriptions/status').query({ documentNumber: '99900030', applicantCode: row.applicantCode }).expect(200);
    expect(ok.body.data).toMatchObject({ applicantCode: row.applicantCode, maskedEmail: 'p•••••@e•••••.com', examDate: expect.stringContaining('22 de noviembre') });
    const bad = await t.request.get('/api/v1/inscriptions/status').query({ documentNumber: '99900031', applicantCode: row.applicantCode }).expect(404);
    expect(bad.body.error.message).not.toContain('99900030');
  });
});

describe('¿No encuentras tu código? (quinta crítica)', () => {
  it('reenvía el código solo al correo registrado y responde igual si el documento no existe', async () => {
    const row = await t.db.application.findFirstOrThrow({ where: { documentNumber: '99900030' } });
    const before = t.email.sent.length;
    const ok = await t.request.post('/api/v1/inscriptions/code-reminder').send({ documentNumber: '99900030' }).expect(202);
    const none = await t.request.post('/api/v1/inscriptions/code-reminder').send({ documentNumber: '11111111' }).expect(202);
    expect(none.body).toEqual(ok.body);
    for (let i = 0; i < 20 && (await t.outbox.dispatch()) > 0; i++);
    const mails = t.email.sent.slice(before).filter((m) => m.subject.startsWith('Tu código de postulante'));
    expect(mails).toHaveLength(1);
    expect(mails[0]!.to).toBe(row.email);
    expect(mails[0]!.html).toContain(row.applicantCode);
    expect(ok.body.data.message).not.toContain(row.applicantCode);
  });

  it('limita los reenvíos por IP', async () => {
    for (let i = 0; i < 5; i++) await t.request.post('/api/v1/inscriptions/code-reminder').send({ documentNumber: '22222222' }).expect(202);
    await t.request.post('/api/v1/inscriptions/code-reminder').send({ documentNumber: '22222222' }).expect(429);
  });
});

describe('Almacenamiento de la foto', () => {
  it('la foto se guarda con la clave de la inscripción', async () => {
    const row = await t.db.application.findFirstOrThrow({ where: { documentNumber: '99900030' } });
    expect(row.photoKey).toBe(`inscripciones/2027-I/${row.applicantCode}.jpg`);
    expect((t.storage as MemoryFileStorage).files.has(row.photoKey)).toBe(true);
  });
});
