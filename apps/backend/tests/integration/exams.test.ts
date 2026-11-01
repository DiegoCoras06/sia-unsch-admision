import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SecretBox, totpService } from '../../src/modules/seguridad/index.js';
import { Argon2Hasher } from '../../src/modules/usuarios/infrastructure/argon2-hasher.js';
import { movableClock, testApp } from '../helpers.js';

const clock = movableClock('2026-10-25T10:00:00-05:00');
const t = testApp(clock);
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

const PASSWORD = 'Coordinador-Seguro-2027';
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

function fakeJpeg(): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 320 >> 8, 320 & 255, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}
async function registerOrd(dni: string, optionCode: string): Promise<string> {
  const r = await t.request.post('/api/v1/inscriptions').send({
    documentType: 'DNI', documentNumber: dni, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'M',
    maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2007-04-04', address: 'Jr. Asamblea 10, Ayacucho', residenceUbigeo: '050101',
    economicDependency: 'PADRES', mobile: '987654321', email: `ord${dni}@example.com`, photo: fakeJpeg(), schoolUbigeo: '050101',
    schoolName: 'IE Mariscal Cáceres', schoolType: 'ESTATAL', graduationYear: 2025, inFourthOrBelow: false, preparation: 'COLEGIO', attempts: 1,
    modality: 'ORD', quotaCategory: 'ORD', campus: 'HUAMANGA', optionCode, militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
  }).expect(201);
  return r.body.data.applicantCode;
}
/** Salto de fecha: los tokens de acceso vencen, así que el personal vuelve a entrar. */
async function jump(iso: string) {
  clock.set(iso);
  coord = await tokenOf('coordinador.examen@unsch.test');
  aula = await tokenOf('responsable.aula@unsch.test');
}
async function drain() {
  for (let i = 0; i < 50 && (await t.outbox.dispatch()) > 0; i++);
}

const DNIS = ['99900021', '99900022', '99900023', '99900024'];
const codes: string[] = [];
let pendingCode = '';
let coord = '';
let aula = '';
let examId = '';
const q = (i: number) => ({ documentNumber: DNIS[i], applicantCode: codes[i] });

beforeAll(async () => {
  await staff('coordinador.examen@unsch.test', 'COORDINADOR_EXAMEN');
  await staff('responsable.aula@unsch.test', 'RESPONSABLE_AULA');
  coord = await tokenOf('coordinador.examen@unsch.test');
  aula = await tokenOf('responsable.aula@unsch.test');
  for (const [i, opt] of ['P01', 'P34', 'P20', 'P10'].entries()) codes.push(await registerOrd(DNIS[i]!, opt));
  // Pago confirmado: la inscripción queda Apta (el flujo de pago se prueba en payments.test.ts).
  await t.db.application.updateMany({ where: { applicantCode: { in: codes } }, data: { status: 'APTA' } });
  pendingCode = await registerOrd('99900025', 'P02');
  examId = (await t.db.exam.findFirstOrThrow({ where: { code: 'ORD' } })).id;
});

describe('Programación y sedes (Historias 1 y 2)', () => {
  it('lista los exámenes del cronograma con aptos, aulas y capacidad', async () => {
    const list = (await t.request.get('/api/v1/admin/exams').set(as(coord)).expect(200)).body.data;
    const ord = list.find((e: { code: string }) => e.code === 'ORD');
    expect(ord.eligible).toBeGreaterThanOrEqual(4);
    expect(ord.rooms).toBe(90);
    expect(ord.capacity).toBe(3600);
    const venues = (await t.request.get('/api/v1/admin/venues').set(as(coord)).expect(200)).body.data;
    expect(venues[0].capacity).toBeGreaterThanOrEqual(3600);
  });

  it('impide dos exámenes para la misma modalidad y los cruces de horario en las mismas aulas (RF-07.06, RF-07.07)', async () => {
    const base = { name: 'Otro ordinario', modalities: ['ORD'], entryOpensAt: '2026-11-29T06:30:00-05:00', entryClosesAt: '2026-11-29T08:30:00-05:00', durationMinutes: 180, place: 'Ciudad Universitaria' };
    await t.request.post('/api/v1/admin/exams').set(as(coord)).send({ code: 'ORD2', ...base }).expect(409);
    const exo = await t.db.exam.findFirstOrThrow({ where: { code: 'EXO' } });
    const r = await t.request.put(`/api/v1/admin/exams/${exo.id}`).set(as(coord)).send({
      code: 'EXO', name: exo.name, modalities: ['EXO'], entryOpensAt: '2026-11-22T07:00:00-05:00', entryClosesAt: '2026-11-22T08:30:00-05:00', durationMinutes: 180, place: exo.place,
    }).expect(409);
    expect(r.body.error.code).toBe('SCHEDULE_CONFLICT');
  });

  it('reparte las preguntas de conocimientos entre los cursos del temario; la suma debe cuadrar (RF-07.03)', async () => {
    const courses = (await t.request.get('/api/v1/admin/exams/syllabus-courses').set(as(coord)).expect(200)).body.data as { name: string }[];
    expect(courses.length).toBeGreaterThan(3);
    const exo = await t.db.exam.findFirstOrThrow({ where: { code: 'EXO' } });
    const body = (cursos: { name: string; questions: number }[]) => ({
      code: 'EXO', name: exo.name, modalities: ['EXO'], entryOpensAt: exo.entryOpensAt.toISOString(), entryClosesAt: exo.entryClosesAt.toISOString(),
      durationMinutes: exo.durationMinutes, place: exo.place, publishAt: exo.publishAt.toISOString(),
      structure: { conocimientos: 100, aptitudVocacional: 10, actitudPersonal: 10, cursos },
    });
    const bad = await t.request.put(`/api/v1/admin/exams/${exo.id}`).set(as(coord)).send(body([{ name: courses[0]!.name, questions: 60 }])).expect(400);
    expect(bad.body.error.message).toContain('suman 60');
    await t.request.put(`/api/v1/admin/exams/${exo.id}`).set(as(coord))
      .send(body([{ name: courses[0]!.name, questions: 60 }, { name: courses[1]!.name, questions: 40 }])).expect(200);
    const saved = await t.db.exam.findUniqueOrThrow({ where: { id: exo.id } });
    expect((saved.structure as { cursos: unknown[] }).cursos).toHaveLength(2);
  });

  it('el responsable de aula no programa exámenes', async () => {
    await t.request.get('/api/v1/admin/exams').set(as(aula)).expect(403);
  });
});

describe('Adecuación, distribución y consulta del aula (Historias 3 y 4)', () => {
  it('registra la adecuación con 72 h de anticipación (RN-39)', async () => {
    const r = (await t.request.post('/api/v1/exam/accommodation').send({ ...q(3), needs: 'Uso silla de ruedas; necesito aula sin escaleras.' }).expect(200)).body.data;
    expect(r.accommodation.late).toBe(false);
    expect(r.state).toBe('NOT_PUBLISHED');
  });

  it('con capacidad insuficiente no asigna a nadie y dice cuántos asientos faltan (H3-2)', async () => {
    const venue = await t.db.venue.findFirstOrThrow({ where: { code: 'CU' } });
    const tiny = (await t.request.post('/api/v1/admin/rooms').set(as(coord)).send({ venueId: venue.id, building: 'Pabellón Z', floor: 1, code: 'Z-101', capacity: 1, gate: 'Puerta 1', accessible: true }).expect(201)).body.data;
    const tinyId = tiny[0].rooms.find((r: { code: string }) => r.code === 'Z-101').id;
    const all = (await t.db.examRoom.findMany({ where: { examId } })).map((r) => r.roomId);
    await t.request.put(`/api/v1/admin/exams/${examId}/rooms`).set(as(coord)).send({ roomIds: [tinyId] }).expect(200);
    const r = await t.request.post(`/api/v1/admin/exams/${examId}/distribute`).set(as(coord)).send({}).expect(422);
    expect(r.body.error.code).toBe('INSUFFICIENT_CAPACITY');
    expect(r.body.error.missing).toBeGreaterThanOrEqual(3);
    expect(await t.db.examAssignment.count({ where: { examId } })).toBe(0);
    await t.request.put(`/api/v1/admin/exams/${examId}/rooms`).set(as(coord)).send({ roomIds: all }).expect(200);
  });

  it('distribuye a cada apto en un aula, sin sobrecupo ni duplicados, con la adecuación en aula accesible (H3-1)', async () => {
    const d = (await t.request.post(`/api/v1/admin/exams/${examId}/distribute`).set(as(coord)).send({}).expect(200)).body.data;
    expect(d.status).toBe('DISTRIBUIDO');
    const rows = await t.db.examAssignment.findMany({ where: { examId }, include: { room: true } });
    for (const c of codes) expect(rows.filter((a) => a.applicantCode === c)).toHaveLength(1);
    expect(rows.find((a) => a.applicantCode === pendingCode)).toBeUndefined();
    expect(rows.find((a) => a.applicantCode === codes[3])!.room.accessible).toBe(true);
    for (const room of d.rooms) expect(room.used).toBeLessThanOrEqual(room.capacity);
  });

  it('antes de publicar, el postulante ve la fecha de publicación; sin ser apto, el motivo (H4-2, H4-3)', async () => {
    await t.request.post(`/api/v1/admin/exams/${examId}/confirm`).set(as(coord)).expect(200);
    const before = (await t.request.get('/api/v1/exam/room').query(q(0)).expect(200)).body.data;
    expect(before.state).toBe('NOT_PUBLISHED');
    expect(before.message).toMatch(/se publica el/);
    const pending = (await t.request.get('/api/v1/exam/room').query({ documentNumber: '99900025', applicantCode: pendingCode }).expect(200)).body.data;
    expect(pending.state).toBe('NOT_ELIGIBLE');
    expect(pending.message).toMatch(/pago/);
  });

  it('publicada (24 h antes), muestra aula, puerta e indicaciones y entrega la ficha de examen (H4-1, H4-4)', async () => {
    await jump('2026-11-21T07:00:00-05:00');
    const r = (await t.request.get('/api/v1/exam/room').query(q(0)).expect(200)).body.data;
    expect(r.state).toBe('ASSIGNED');
    expect(r.room.gate).toMatch(/Puerta/);
    expect(r.room.seat).toBeGreaterThan(0);
    expect(r.exam.instructions.prohibido.length).toBeGreaterThan(0);
    // RF-10.07: el asistente da la misma aula al postulante identificado.
    const pass = (await t.request.post('/api/v1/assistant/identify').send(q(0)).expect(200)).body.data;
    const said = (await t.request.post('/api/v1/assistant/messages').send({ message: '¿Dónde está mi aula?', accessToken: pass.accessToken }).expect(200)).body.data.reply;
    expect(said).toContain(`aula ${r.room.code}, asiento ${r.room.seat}`);
    const pdf = await t.request.get('/api/v1/exam/slip.pdf').query(q(0)).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('DNI y código que no corresponden: «Datos no encontrados» sin decir cuál falló (H4-5)', async () => {
    const r = await t.request.get('/api/v1/exam/room').query({ documentNumber: DNIS[1], applicantCode: codes[0] }).expect(404);
    expect(r.body.error.message).toMatch(/Datos no encontrados/);
  });

  it('regenerar una distribución publicada exige justificación (H3-4)', async () => {
    await t.request.post(`/api/v1/admin/exams/${examId}/distribute`).set(as(coord)).send({}).expect(400);
    await t.request.post(`/api/v1/admin/exams/${examId}/distribute`).set(as(coord)).send({ reason: 'Se habilitaron aulas adicionales del pabellón F' }).expect(200);
  });

  it('cambio de aula con motivo: queda el historial y se avisa al postulante (Historia 6)', async () => {
    const a = await t.db.examAssignment.findFirstOrThrow({ where: { examId, applicantCode: codes[1] } });
    const other = await t.db.room.findFirstOrThrow({ where: { code: 'F-305' } });
    const d = (await t.request.post(`/api/v1/admin/exams/${examId}/assignments/${codes[1]}/move`).set(as(coord)).send({ roomId: other.id, reason: 'Aula original inhabilitada por filtración' }).expect(200)).body.data;
    expect(d.changes.some((c: { applicantCode: string }) => c.applicantCode === codes[1])).toBe(true);
    const moved = await t.db.examAssignment.findUniqueOrThrow({ where: { id: a.id } });
    expect(moved.roomId).toBe(other.id);
    const ev = await t.db.outboxEvent.findMany({ where: { eventType: 'AulaCambiada' } });
    expect(ev.some((e) => (e.payload as { applicantCode: string }).applicantCode === codes[1])).toBe(true);
  });
});

describe('Día del examen (Historia 5)', () => {
  it('registra el ingreso con el código y devuelve la foto; un QR falsificado se rechaza', async () => {
    await jump('2026-11-22T07:00:00-05:00');
    const board = (await t.request.get('/api/v1/admin/attendance').set(as(aula)).expect(200)).body.data;
    expect(board.some((e: { id: string }) => e.id === examId)).toBe(true);
    const r = (await t.request.post(`/api/v1/admin/attendance/${examId}/check-in`).set(as(aula)).send({ scan: codes[0] }).expect(200)).body.data;
    expect(r.late).toBe(false);
    expect(r.already).toBe(false);
    expect(r.photo).toMatch(/^data:image\/jpeg;base64,/);
    const again = (await t.request.post(`/api/v1/admin/attendance/${examId}/check-in`).set(as(aula)).send({ scan: codes[0] }).expect(200)).body.data;
    expect(again.already).toBe(true);
    const bad = await t.request.post(`/api/v1/admin/attendance/${examId}/check-in`).set(as(aula)).send({ scan: `https://x/admin/asistencia?c=${codes[2]}.falsificado123` }).expect(422);
    expect(bad.body.error.code).toBe('QR_INVALID');
  });

  it('después de las 8:30 el ingreso queda «fuera de hora» (H5-3)', async () => {
    await jump('2026-11-22T08:31:00-05:00');
    const r = (await t.request.post(`/api/v1/admin/attendance/${examId}/check-in`).set(as(aula)).send({ scan: codes[1] }).expect(200)).body.data;
    expect(r.late).toBe(true);
  });

  it('una lectura sin conexión se envía después con su hora: leída a las 8:20 no queda fuera de hora (RF-08.08)', async () => {
    const future = await t.request.post(`/api/v1/admin/attendance/${examId}/check-in`).set(as(aula)).send({ scan: codes[2], scannedAt: '2026-11-22T09:30:00-05:00' }).expect(400);
    expect(future.body.error.message).toContain('sin conexión');
    const r = (await t.request.post(`/api/v1/admin/attendance/${examId}/check-in`).set(as(aula)).send({ scan: codes[2], scannedAt: '2026-11-22T08:20:00-05:00' }).expect(200)).body.data;
    expect(r.late).toBe(false);
    const a = await t.db.examAssignment.findFirstOrThrow({ where: { examId, applicantCode: codes[2] } });
    expect(a.checkedInAt?.toISOString()).toBe('2026-11-22T13:20:00.000Z');
    // Se deja como estaba: la prueba del cierre espera que siga sin ingresar.
    await t.db.examAssignment.update({ where: { id: a.id }, data: { attendance: 'PENDIENTE', checkedInAt: null, late: false, checkedBy: null } });
  });

  it('lista PDF por aula e incidencia con aviso a la Comisión (H5-1, H5-4)', async () => {
    const a = await t.db.examAssignment.findFirstOrThrow({ where: { examId, applicantCode: codes[0] } });
    const pdf = await t.request.get(`/api/v1/admin/attendance/${examId}/rooms/${a.roomId}/list.pdf`).set(as(aula)).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
    const list = (await t.request.post(`/api/v1/admin/attendance/${examId}/incidents`).set(as(aula)).send({
      roomId: a.roomId, applicantCode: codes[0], type: 'DISPOSITIVO', description: 'Celular encontrado en el bolsillo durante la prueba.',
    }).expect(201)).body.data;
    expect(list[0].typeLabel).toBe('Dispositivo electrónico');
    const ev = await t.db.outboxEvent.findMany({ where: { eventType: 'IncidenciaRegistrada' } });
    expect(ev.length).toBeGreaterThan(0);
    await drain();
  });

  it('al cerrar la asistencia, quien no ingresó queda Ausente', async () => {
    const r = (await t.request.post(`/api/v1/admin/exams/${examId}/close-attendance`).set(as(coord)).expect(200)).body.data;
    expect(r.absent).toBeGreaterThanOrEqual(2);
    const absent = await t.db.examAssignment.findFirstOrThrow({ where: { examId, applicantCode: codes[2] } });
    expect(absent.attendance).toBe('AUSENTE');
    await t.request.post(`/api/v1/admin/attendance/${examId}/check-in`).set(as(aula)).send({ scan: codes[3] }).expect(422);
  });
});
