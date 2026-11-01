import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SecretBox, totpService } from '../../src/modules/seguridad/index.js';
import { Argon2Hasher } from '../../src/modules/usuarios/infrastructure/argon2-hasher.js';
import { movableClock, testApp } from '../helpers.js';

const clock = movableClock('2026-10-25T10:00:00-05:00');
const t = testApp(clock);
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

const PASSWORD = 'Resultados-Seguro-2027';
const box = new SecretBox('staff:test-hmac-secret-test-hmac-secret-test-hmac');
const secrets = new Map<string, string>();
async function staff(email: string, role: string) {
  const secret = totpService.newSecret();
  secrets.set(email, secret);
  const user = await t.db.user.create({ data: { email, passwordHash: await new Argon2Hasher().hash(PASSWORD), type: 'STAFF', status: 'ACTIVE' } });
  await t.db.staffProfile.create({ data: { userId: user.id, fullName: email.split('@')[0]!, mustChangePassword: false, mfaSecretEnc: box.seal(secret), mfaEnabledAt: new Date() } });
  const r = await t.db.role.findUniqueOrThrow({ where: { code: role } });
  await t.db.userRole.create({ data: { userId: user.id, roleId: r.id } });
}
async function tokenOf(email: string): Promise<string> {
  clock.advance(31);
  const c = (await t.request.post('/api/v1/admin/auth/login').send({ email, password: PASSWORD }).expect(200)).body.data;
  return (await t.request.post('/api/v1/admin/auth/mfa').send({ challenge: c.challenge, code: totpService.code(secrets.get(email)!, clock.now()) }).expect(200)).body.data.accessToken;
}
const as = (token: string) => ({ Authorization: `Bearer ${token}` });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const binary = (res: any, cb: any) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};

function fakeJpeg(): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 320 >> 8, 320 & 255, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}
async function registerExo(dni: string, optionCode: string): Promise<string> {
  const r = await t.request.post('/api/v1/inscriptions').send({
    documentType: 'DNI', documentNumber: dni, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'F',
    maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-02-02', address: 'Jr. Callao 12, Ayacucho', residenceUbigeo: '050101',
    economicDependency: 'PADRES', mobile: '987654321', email: `res${dni}@example.com`, photo: fakeJpeg(), schoolUbigeo: '050101',
    schoolName: 'IE Gonzales Vigil', schoolType: 'ESTATAL', graduationYear: 2025, inFourthOrBelow: false, preparation: 'COLEGIO', attempts: 1,
    modality: 'EXO', quotaCategory: 'PS-U', campus: 'HUAMANGA', optionCode, militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
  }).expect(201);
  return r.body.data.applicantCode;
}
async function drain() {
  for (let i = 0; i < 50 && (await t.outbox.dispatch()) > 0; i++);
}

const DNIS = ['99900026', '99900027', '99900028', '99900029'];
const codes: string[] = [];
let op = '';
let com = '';
let examId = '';
let versionId = '';
const who = (i: number) => ({ documentNumber: DNIS[i], applicantCode: codes[i] });
async function jump(iso: string) {
  clock.set(iso);
  op = await tokenOf('operador.resultados@unsch.test');
  com = await tokenOf('comision.admision@unsch.test');
}

beforeAll(async () => {
  await staff('operador.resultados@unsch.test', 'OPERADOR_RESULTADOS');
  await staff('comision.admision@unsch.test', 'ADMISION');
  op = await tokenOf('operador.resultados@unsch.test');
  com = await tokenOf('comision.admision@unsch.test');
  for (const [i, opt] of ['P01', 'P01', 'P01', 'P02'].entries()) codes.push(await registerExo(DNIS[i]!, opt));
  // Expediente autorizado y pago confirmado (probados en dossier.test.ts y payments.test.ts).
  await t.db.application.updateMany({ where: { applicantCode: { in: codes } }, data: { status: 'APTA' } });
  examId = (await t.db.exam.findFirstOrThrow({ where: { code: 'EXO' } })).id;
  await t.request.post(`/api/v1/admin/exams/${examId}/distribute`).set(as(com)).send({}).expect(200);
  await t.request.post(`/api/v1/admin/exams/${examId}/confirm`).set(as(com)).expect(200);
  await jump('2026-11-15T07:30:00-05:00');
  for (const c of codes.slice(0, 3)) await t.request.post(`/api/v1/admin/attendance/${examId}/check-in`).set(as(com)).send({ scan: c }).expect(200);
  await jump('2026-11-15T11:00:00-05:00');
  await t.request.post(`/api/v1/admin/exams/${examId}/close-attendance`).set(as(com)).expect(200);
});

describe('Importación y cálculo (Historias 1 y 2)', () => {
  it('un lote con inconsistencias no se procesa (H1-2)', async () => {
    const content = `codigo,conocimientos,aptitud,actitud,observacion\n${codes[0]},95,10,10,\n${codes[3]},50,5,5,\n`;
    const b = (await t.request.post(`/api/v1/admin/results/exams/${examId}/batches`).set(as(op)).send({ fileName: 'lectora.csv', content }).expect(201)).body.data;
    expect(b.status).toBe('CON_ERRORES');
    const issues = b.issues.map((i: { issue: string }) => i.issue);
    expect(issues).toContain('Figura como ausente en la asistencia');
    expect(issues).toContain('Ingresó al examen pero no tiene registro en el archivo');
    const r = await t.request.post(`/api/v1/admin/results/batches/${b.id}/process`).set(as(op)).send({}).expect(422);
    expect(r.body.error.code).toBe('BATCH_HAS_ERRORS');
  });

  it('procesa un lote válido: puntaje, puesto y condición, con ausente y no calificable (H2)', async () => {
    const content = `codigo,conocimientos,aptitud,actitud,observacion\n${codes[0]},95,10,10,\n${codes[1]},60,5,5,\n${codes[2]},0,0,0,MAL_LLENADA\n`;
    const b = (await t.request.post(`/api/v1/admin/results/exams/${examId}/batches`).set(as(op)).send({ fileName: 'lectora.csv', content }).expect(201)).body.data;
    expect(b.status).toBe('VALIDO');
    expect(b.unreadable).toBe(1);
    const v = (await t.request.post(`/api/v1/admin/results/batches/${b.id}/process`).set(as(op)).send({}).expect(200)).body.data;
    versionId = v.id;
    expect(v.status).toBe('BORRADOR');
    const row = (c: string) => v.rows.find((r: { applicantCode: string }) => r.applicantCode === c);
    expect(row(codes[0]!).score).toBe('955.00');
    expect(row(codes[0]!).rank).toBe(1);
    expect(row(codes[0]!).condition).toBe('ADMITIDO');
    expect(row(codes[1]!).score).toBe('590.00');
    expect(row(codes[2]!).condition).toBe('NO_CALIFICABLE');
    expect(row(codes[3]!).condition).toBe('AUSENTE');
    const seats = v.coverage.find((c: { optionCode: string; quotaCategory: string }) => c.optionCode === 'P01' && c.quotaCategory === 'PS-U').vacancies;
    expect(row(codes[1]!).condition).toBe(seats >= 2 ? 'ADMITIDO' : 'NO_ADMITIDO');
  });
});

describe('Aprobación y publicación (Historia 3)', () => {
  it('nadie la ve antes de aprobar; el operador no puede aprobar (H3-1, H3-3)', async () => {
    expect((await t.request.get('/api/v1/results/me').query(who(0)).expect(200)).body.data.state).toBe('NOT_PUBLISHED');
    await t.request.post(`/api/v1/admin/results/versions/${versionId}/submit`).set(as(op)).expect(200);
    await t.request.post(`/api/v1/admin/results/versions/${versionId}/approve`).set(as(op)).send({ publishAt: '2026-11-15T18:00:00-05:00' }).expect(403);
  });

  it('la Comisión aprueba y se publica exactamente a la hora autorizada (H3-2)', async () => {
    const v = (await t.request.post(`/api/v1/admin/results/versions/${versionId}/approve`).set(as(com)).send({ publishAt: '2026-11-15T18:00:00-05:00' }).expect(200)).body.data;
    expect(v.status).toBe('PUBLICADA');
    expect((await t.request.get('/api/v1/results/me').query(who(0)).expect(200)).body.data.state).toBe('NOT_PUBLISHED');
    await jump('2026-11-15T18:01:00-05:00');
    const me = (await t.request.get('/api/v1/results/me').query(who(0)).expect(200)).body.data;
    expect(me.state).toBe('PUBLISHED');
    expect(me.score).toBe('955.00');
    expect(me.breakdown.map((b: { points: string }) => b.points)).toEqual(['855.00', '50.00', '50.00']);
    expect(me.condition).toBe('ADMITIDO');
    expect(me.admission.status).toBe('PENDIENTE');
    const list = (await t.request.get('/api/v1/results/admitted').query({ exam: 'EXO' }).expect(200)).body.data;
    const mine = list.rows.find((r: { applicantCode: string }) => r.applicantCode === codes[0]);
    expect(mine.score).toBe('955.00');
    expect(JSON.stringify(list)).not.toContain(DNIS[0]);
  });

  it('el asistente informa el puntaje y la condición del postulante identificado (RF-10.08)', async () => {
    const pass = (await t.request.post('/api/v1/assistant/identify').send(who(0)).expect(200)).body.data;
    const reply = (await t.request.post('/api/v1/assistant/messages').send({ message: '¿Cuál es mi resultado?', accessToken: pass.accessToken }).expect(200)).body.data;
    expect(reply.reply).toContain('955.00 puntos');
    expect(reply.reply).toContain('Admitido');
  });

  it('avisa por correo que hay resultados, sin el puntaje, una sola vez (RF-11.07)', async () => {
    await t.results.tick();
    await t.results.tick();
    const n = await t.db.notification.findMany({ where: { dedupeKey: `resultados:${examId}:${codes[0]}` } });
    expect(n).toHaveLength(1);
    expect(n[0]!.text).not.toContain('955');
  });

  it('una rectificación exige motivo, crea otra versión y conserva la anterior (H3-4)', async () => {
    const content = `codigo,conocimientos,aptitud,actitud,observacion\n${codes[0]},95,10,10,\n${codes[1]},62,5,5,\n${codes[2]},0,0,0,MAL_LLENADA\n`;
    const b = (await t.request.post(`/api/v1/admin/results/exams/${examId}/batches`).set(as(op)).send({ fileName: 'lectora-corregida.csv', content }).expect(201)).body.data;
    await t.request.post(`/api/v1/admin/results/batches/${b.id}/process`).set(as(op)).send({}).expect(400);
    const v2 = (await t.request.post(`/api/v1/admin/results/batches/${b.id}/process`).set(as(op)).send({ reason: 'Error material: ficha de la lectora mal leída' }).expect(200)).body.data;
    expect(v2.version).toBe(2);
    await t.request.post(`/api/v1/admin/results/versions/${v2.id}/submit`).set(as(op)).expect(200);
    await t.request.post(`/api/v1/admin/results/versions/${v2.id}/approve`).set(as(com)).send({ publishAt: '2026-11-15T18:30:00-05:00' }).expect(200);
    expect((await t.db.resultVersion.findUniqueOrThrow({ where: { id: versionId } })).status).toBe('REEMPLAZADA');
    const audit = await t.db.auditEvent.findFirst({ where: { action: 'results.rectified', resourceId: v2.id } });
    expect(audit).not.toBeNull();
    versionId = v2.id;
  });

  it('exporta expedientes y asistencia a Excel (RF-12.04, RF-12.06)', async () => {
    for (const kind of ['expedientes', 'asistencia']) {
      const x = await t.request.get(`/api/v1/admin/reports/${kind}.xlsx`).set(as(com)).buffer(true).parse(binary).expect(200);
      expect((x.body as Buffer).subarray(0, 2).toString()).toBe('PK');
    }
  });

  it('exporta resultados y cobertura de vacantes (H6)', async () => {
    const x = await t.request.get(`/api/v1/admin/results/versions/${versionId}/report.xlsx`).query({ kind: 'cobertura' }).set(as(op)).buffer(true).parse(binary).expect(200);
    expect((x.body as Buffer).subarray(0, 2).toString()).toBe('PK');
    const p = await t.request.get(`/api/v1/admin/results/versions/${versionId}/report.pdf`).set(as(op)).buffer(true).parse(binary).expect(200);
    expect((p.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  });
});

describe('Ingreso y revisión (Historias 5 y 7)', () => {
  it('con entrega de documentos y pago pasa a Ingresante y obtiene su constancia (H5-1)', async () => {
    await t.request.post(`/api/v1/admin/admissions/${codes[0]}/deliver`).set(as(com)).send({ receiptNumber: 'R-000123' }).expect(422);
    await jump('2026-11-25T10:00:00-05:00');
    const r = (await t.request.post(`/api/v1/admin/admissions/${codes[0]}/deliver`).set(as(com)).send({ receiptNumber: 'R-000123' }).expect(200)).body.data;
    const a = r.rows.find((x: { applicantCode: string }) => x.applicantCode === codes[0]);
    expect(a.status).toBe('INGRESANTE');
    expect(a.amountPaid).toBe('15.00');
    const pdf = await t.request.get('/api/v1/results/certificate.pdf').query(who(0)).buffer(true).parse(binary).expect(200);
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
    expect((await t.request.get('/api/v1/results/verify/27000000.falsificado1234').expect(200)).body.data.valid).toBe(false);
  });

  it('vencido el plazo, el admitido sin entrega pierde la admisión (H5-3, RN-55)', async () => {
    await t.db.admission.upsert({ where: { applicantCode: codes[1]! }, create: { applicantCode: codes[1]!, callCode: '2027-I' }, update: { status: 'PENDIENTE' } });
    await jump('2026-12-04T09:00:00-05:00');
    await t.results.tick();
    expect((await t.db.admission.findUniqueOrThrow({ where: { applicantCode: codes[1]! } })).status).toBe('PERDIDA');
    expect((await t.db.admission.findUniqueOrThrow({ where: { applicantCode: codes[0]! } })).status).toBe('INGRESANTE');
  });

  it('la solicitud de revisión queda como caso de atención (H7)', async () => {
    const r = (await t.request.post('/api/v1/results/review').send({ ...who(2), description: 'Mi ficha óptica figura como mal llenada, pero la llené correctamente con lápiz 2B.' }).expect(201)).body.data;
    expect(r.caseNumber).toMatch(/^C-/);
    const c = await t.db.supportCase.findUniqueOrThrow({ where: { caseNumber: r.caseNumber } });
    expect(c.type).toBe('RESULT_REVIEW');
    await drain();
  });
});
