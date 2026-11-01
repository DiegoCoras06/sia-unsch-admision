import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { totpService } from '../../src/modules/seguridad/index.js';
import { movableClock, testApp } from '../helpers.js';

const clock = movableClock('2026-10-25T10:00:00-05:00');
const t = testApp(clock);
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

const STRONG = 'Huamanga-Admision-2027';
const secrets = new Map<string, string>();

/** Ingreso completo del personal: contraseña → (cambio) → (activar TOTP) → código → sesión. */
async function staffLogin(email: string, password: string): Promise<{ token: string; cookie: string }> {
  clock.advance(31); // un código TOTP nuevo en cada ingreso (no se acepta reutilizar el mismo paso)
  let step = (await t.request.post('/api/v1/admin/auth/login').send({ email, password }).expect(200)).body.data;
  if (step.step === 'CHANGE_PASSWORD') {
    step = (await t.request.post('/api/v1/admin/auth/password').send({ challenge: step.challenge, newPassword: STRONG }).expect(200)).body.data;
  }
  if (step.step === 'SETUP_MFA') {
    expect(step.mfaSetup.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(step.mfaSetup.otpauthUri).toContain('otpauth://totp/');
    secrets.set(email, step.mfaSetup.secret);
  }
  const code = totpService.code(secrets.get(email)!, clock.now());
  const res = await t.request.post('/api/v1/admin/auth/mfa').send({ challenge: step.challenge, code }).expect(200);
  return { token: res.body.data.accessToken, cookie: String(res.headers['set-cookie']?.[0] ?? '').split(';')[0]! };
}

const as = (token: string) => ({ Authorization: `Bearer ${token}` });
const initialAdminPassword = () =>
  /Contraseña temporal: (\S+)/.exec(readFileSync(path.join(os.tmpdir(), 'sia-admin-inicial-test.txt'), 'utf8'))![1]!;

let admin = '';
let adminPassword = '';

describe('Ingreso del personal con segundo factor (ADR-018)', () => {
  it('primer ingreso: cambio de contraseña obligatorio, TOTP con QR y sesión con permisos', async () => {
    const temp = initialAdminPassword();
    const first = (await t.request.post('/api/v1/admin/auth/login').send({ email: 'admin@sia-unsch.local', password: temp }).expect(200)).body.data;
    expect(first.step).toBe('CHANGE_PASSWORD');
    await t.request.post('/api/v1/admin/auth/password').send({ challenge: first.challenge, newPassword: '1234567890' }).expect(400);

    const setup = (await t.request.post('/api/v1/admin/auth/password').send({ challenge: first.challenge, newPassword: STRONG }).expect(200)).body.data;
    expect(setup.step).toBe('SETUP_MFA');
    secrets.set('admin@sia-unsch.local', setup.mfaSetup.secret);
    await t.request.post('/api/v1/admin/auth/mfa').send({ challenge: setup.challenge, code: '000000' }).expect(401);
    const ok = await t.request.post('/api/v1/admin/auth/mfa')
      .send({ challenge: setup.challenge, code: totpService.code(setup.mfaSetup.secret, clock.now()) }).expect(200);
    admin = ok.body.data.accessToken;
    adminPassword = STRONG;

    const me = (await t.request.get('/api/v1/admin/me').set(as(admin)).expect(200)).body.data;
    expect(me.roles).toEqual(['ADMIN']);
    expect(me.permissions).toContain('usuarios.gestionar');
    const profile = await t.db.staffProfile.findFirstOrThrow({ where: { user: { email: 'admin@sia-unsch.local' } } });
    expect(profile.mfaSecretEnc).not.toContain(setup.mfaSetup.secret);
  });

  it('el personal no puede entrar por el ingreso de postulantes (sin segundo factor)', async () => {
    await t.request.post('/api/v1/auth/login').send({ identifier: 'admin@sia-unsch.local', password: adminPassword }).expect(401);
  });

  it('un mismo código TOTP no se acepta dos veces', async () => {
    clock.advance(31);
    const c1 = (await t.request.post('/api/v1/admin/auth/login').send({ email: 'admin@sia-unsch.local', password: adminPassword }).expect(200)).body.data;
    const code = totpService.code(secrets.get('admin@sia-unsch.local')!, clock.now());
    await t.request.post('/api/v1/admin/auth/mfa').send({ challenge: c1.challenge, code }).expect(200);
    const c2 = (await t.request.post('/api/v1/admin/auth/login').send({ email: 'admin@sia-unsch.local', password: adminPassword }).expect(200)).body.data;
    await t.request.post('/api/v1/admin/auth/mfa').send({ challenge: c2.challenge, code }).expect(401);
  });
});

describe('Usuarios internos y permisos (Historia 3)', () => {
  it('Tesorería ve pagos pero no la convocatoria; el intento queda auditado (SC-003)', async () => {
    const created = (await t.request.post('/api/v1/admin/users').set(as(admin))
      .send({ email: 'tesoreria@sia-unsch.local', fullName: 'Ana Tesorería', roles: ['TESORERIA'] }).expect(201)).body.data;
    expect(created.temporaryPassword).toHaveLength(14);
    const { token } = await staffLogin('tesoreria@sia-unsch.local', created.temporaryPassword);
    await t.request.get('/api/v1/admin/payments').set(as(token)).expect(200);
    await t.request.get('/api/v1/admin/calls').set(as(token)).expect(403);
    await t.request.get('/api/v1/admin/users').set(as(token)).expect(403);
    const denied = await t.db.auditEvent.findFirst({ where: { action: 'access.denied', actorUserId: created.id }, orderBy: { occurredAt: 'desc' } });
    expect(denied?.resourceId).toContain('/admin/users');
    const dash = (await t.request.get('/api/v1/admin/dashboard').set(as(token)).expect(200)).body.data;
    expect(dash.pagos).not.toBeNull();
    expect(dash.inscripciones).toBeNull();
  });

  it('suspender cierra todas las sesiones al instante (RF-13.08)', async () => {
    const created = (await t.request.post('/api/v1/admin/users').set(as(admin))
      .send({ email: 'soporte@sia-unsch.local', fullName: 'Luis Soporte', roles: ['SOPORTE'] }).expect(201)).body.data;
    const { cookie } = await staffLogin('soporte@sia-unsch.local', created.temporaryPassword);
    await t.request.post(`/api/v1/admin/users/${created.id}/status`).set(as(admin)).send({ status: 'SUSPENDED' }).expect(204);
    await t.request.post('/api/v1/auth/refresh').set('Cookie', cookie).set('X-SIA-Client', 'web').expect(401);
    expect(await t.db.session.count({ where: { userId: created.id, revokedAt: null } })).toBe(0);
    await t.request.post('/api/v1/admin/auth/login').send({ email: 'soporte@sia-unsch.local', password: STRONG }).expect(403);
  });

  it('el último administrador no puede quitarse el rol', async () => {
    const me = (await t.request.get('/api/v1/admin/me').set(as(admin)).expect(200)).body.data;
    const res = await t.request.put(`/api/v1/admin/users/${me.id}/roles`).set(as(admin)).send({ roles: ['AUDITOR'] }).expect(422);
    expect(res.body.error.code).toBe('LAST_ADMIN');
  });
});

describe('Convocatoria (Historia 1)', () => {
  it('fechas validadas y auditadas con antes y después', async () => {
    const call = (await t.request.get('/api/v1/admin/calls/2027-I').set(as(admin)).expect(200)).body.data;
    const stage = call.stages.find((s: { code: string }) => s.code === 'ORD_REGULAR');
    await t.request.put('/api/v1/admin/calls/2027-I/stages/ORD_REGULAR').set(as(admin))
      .send({ startsAt: stage.endsAt, endsAt: stage.startsAt }).expect(400);
    const newEnd = new Date(new Date(stage.endsAt).getTime() + 86_400_000).toISOString();
    await t.request.put('/api/v1/admin/calls/2027-I/stages/ORD_REGULAR').set(as(admin)).send({ startsAt: stage.startsAt, endsAt: newEnd }).expect(200);
    const ev = await t.db.auditEvent.findFirstOrThrow({ where: { action: 'call.stage_updated' }, orderBy: { occurredAt: 'desc' } });
    expect(ev.before).toMatchObject({ endsAt: new Date(stage.endsAt).toISOString() });
    expect(ev.after).toMatchObject({ endsAt: newEnd });
    await t.request.put('/api/v1/admin/calls/2027-I/stages/ORD_REGULAR').set(as(admin)).send({ startsAt: stage.startsAt, endsAt: stage.endsAt }).expect(200);
  });

  it('tasa en 0 exige confirmación; vacantes publicadas exigen resolución (RN-03)', async () => {
    const call = (await t.request.get('/api/v1/admin/calls/2027-I').set(as(admin)).expect(200)).body.data;
    const fee = call.fees[0];
    const zero = await t.request.put(`/api/v1/admin/calls/2027-I/fees/${fee.code}`).set(as(admin)).send({ amount: 0 }).expect(422);
    expect(zero.body.error.code).toBe('ZERO_FEE_CONFIRM');
    const noRes = await t.request.put('/api/v1/admin/calls/2027-I/vacancies').set(as(admin)).send({ optionCode: 'P34', category: 'ORD', quantity: 30 }).expect(422);
    expect(noRes.body.error.code).toBe('RESOLUTION_REQUIRED');
    const before = call.vacancies.options.find((o: { code: string }) => o.code === 'P34').byCategory.ORD;
    await t.request.put('/api/v1/admin/calls/2027-I/vacancies').set(as(admin))
      .send({ optionCode: 'P34', category: 'ORD', quantity: before + 1, resolution: 'R.R. N.° 999-2026-UNSCH-R', reason: 'Empate en el último puesto' }).expect(204);
    const ev = await t.db.auditEvent.findFirstOrThrow({ where: { action: 'call.vacancy_updated' }, orderBy: { occurredAt: 'desc' } });
    expect(ev.after).toMatchObject({ quantity: before + 1, resolution: 'R.R. N.° 999-2026-UNSCH-R' });
    await t.request.put('/api/v1/admin/calls/2027-I/vacancies').set(as(admin))
      .send({ optionCode: 'P34', category: 'ORD', quantity: before, resolution: 'R.R. N.° 999-2026-UNSCH-R', reason: 'Reversión de prueba' }).expect(204);
  });

  it('copiar 2027-I a 2027-II duplica etapas, tasas, vacantes y requisitos en borrador', async () => {
    const res = await t.request.post('/api/v1/admin/calls/2027-I/copy').set(as(admin))
      .send({ code: '2027-II', name: 'Concurso de Admisión 2027-II', year: 2027, period: 'II', monthsOffset: 6 }).expect(201);
    expect(res.body.data).toEqual({ code: '2027-II', status: 'DRAFT' });
    const [a, b] = await Promise.all([
      t.request.get('/api/v1/admin/calls/2027-I').set(as(admin)),
      t.request.get('/api/v1/admin/calls/2027-II').set(as(admin)),
    ]);
    expect(b.body.data.stages).toHaveLength(a.body.data.stages.length);
    expect(b.body.data.fees).toHaveLength(a.body.data.fees.length);
    expect(b.body.data.vacancies.total).toBe(a.body.data.vacancies.total);
    // La convocatoria vigente del portal sigue siendo la publicada.
    expect((await t.request.get('/api/v1/calls/current').expect(200)).body.data.code).toBe('2027-I');
  });
});

describe('Reportes, inhabilitados, contenido, asistente y casos', () => {
  it('indicadores y exportación a Excel y PDF (RF-12.08)', async () => {
    const dash = (await t.request.get('/api/v1/admin/dashboard').set(as(admin)).expect(200)).body.data;
    expect(dash.inscripciones).toHaveProperty('total');
    const xlsx = await t.request.get('/api/v1/admin/reports/inscripciones.xlsx').set(as(admin)).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    expect((xlsx.body as Buffer).subarray(0, 2).toString()).toBe('PK');
    const pdf = await t.request.get('/api/v1/admin/reports/pagos.pdf').set(as(admin)).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('inhabilitar a una persona anula su inscripción con la resolución (Historia 5)', async () => {
    const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 1, 64, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
    const photo = `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
    const reg = await t.request.post('/api/v1/inscriptions').send({
      documentType: 'DNI', documentNumber: '99900016', paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'M',
      maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-02-02', address: 'Jr. Callao 300, Ayacucho', residenceUbigeo: '050101',
      economicDependency: 'PADRES', mobile: '987654321', email: 'inhabilitar@example.com', photo, schoolUbigeo: '050101',
      schoolName: 'IE Guamán Poma', schoolType: 'ESTATAL', graduationYear: 2025, inFourthOrBelow: false, preparation: 'ACADEMIA', attempts: 1,
      modality: 'ORD', quotaCategory: 'ORD', campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
    }).expect(201);
    const app = { documentType: 'DNI', documentNumber: '99900016', applicantCode: reg.body.data.applicantCode as string };
    const res = await t.request.post('/api/v1/admin/disqualified').set(as(admin))
      .send({ documentType: app.documentType, documentNumber: app.documentNumber, reason: 'Suplantación comprobada', resolution: 'R.D. N.° 001-2026-DA' }).expect(201);
    expect(res.body.data.annulled).toContain(app.applicantCode);
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: app.applicantCode } })).status).toBe('ANULADA');
    // RF-11.03: el postulante recibe el aviso con el motivo.
    for (let i = 0; i < 50 && (await t.outbox.dispatch()) > 0; i++);
    const mail = t.email.sent.find((m) => m.to === 'inhabilitar@example.com' && m.subject.startsWith('Inscripción anulada'));
    expect(mail?.text).toContain('Inhabilitación: R.D. N.° 001-2026-DA');
  });

  it('comunicado publicado aparece en el portal; función desactivada se apaga (Historias 6 y 8)', async () => {
    await t.request.post('/api/v1/admin/announcements').set(as(admin))
      .send({ type: 'COMUNICADO', title: 'Ampliación de atención en ventanilla', bodyMd: 'La Dirección de Admisión atenderá también los sábados.' }).expect(201);
    const pub = (await t.request.get('/api/v1/announcements').expect(200)).body.data;
    expect(pub.some((a: { title: string }) => a.title === 'Ampliación de atención en ventanilla')).toBe(true);
    await t.request.put('/api/v1/admin/features/REINSCRIPCION').set(as(admin)).send({ enabled: false }).expect(204);
    const home = (await t.request.get('/api/v1/content/home').expect(200)).body.data;
    expect(home.quickAccess.find((q: { key: string }) => q.key === 'REINSCRIPCION').enabled).toBe(false);
    await t.request.put('/api/v1/admin/features/REINSCRIPCION').set(as(admin)).send({ enabled: true }).expect(204);
  });

  it('nueva entrada de conocimiento: el asistente la usa al instante (RF-10.12)', async () => {
    await t.request.post('/api/v1/admin/knowledge').set(as(admin)).send({
      topic: 'pagos', question: '¿Puedo pagar con transferencia interbancaria?', answer: 'No. Paga en línea con Izipay o en las ventanillas autorizadas.',
      source: 'Dirección de Admisión - prueba', extraKeywords: 'transferencia interbancaria cci',
    }).expect(201);
    const r = (await t.request.post('/api/v1/assistant/messages').send({ message: '¿acepta transferencia interbancaria?' }).expect(200)).body.data;
    expect(r.reply).toContain('Paga en línea con Izipay');
  });

  it('un caso cambia de estado y el ciudadano lo ve con su número (Historia 7)', async () => {
    const caseNumber = (await t.request.post('/api/v1/support/contact')
      .send({ name: 'Rosa Pérez', email: 'rosa@example.com', message: 'No me llega el código de verificación al correo.' }).expect(201)).body.data.caseNumber;
    await t.request.post(`/api/v1/admin/cases/${caseNumber}/status`).set(as(admin)).send({ status: 'IN_PROGRESS', note: 'Revisando' }).expect(204);
    const pub = (await t.request.get(`/api/v1/support/cases/${caseNumber}`).expect(200)).body.data;
    expect(pub).toMatchObject({ caseNumber, status: 'En atención' });
  });

  it('retención: las inscripciones de convocatorias antiguas se anonimizan y la vigente no se toca (RF-13.10)', async () => {
    const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 1, 64, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
    const photo = `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
    const body = (dni: string) => ({
      documentType: 'DNI', documentNumber: dni, paternalSurname: 'Quispe', maternalSurname: 'Huamán', firstNames: 'Rosa', sex: 'F',
      maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-02-02', address: 'Jr. Lima 120, Ayacucho', residenceUbigeo: '050101',
      economicDependency: 'PADRES', mobile: '987654321', email: `ret.${dni}@example.com`, photo, schoolUbigeo: '050101',
      schoolName: 'IE Mariscal Cáceres', schoolType: 'ESTATAL', graduationYear: 2025, inFourthOrBelow: false, preparation: 'ACADEMIA', attempts: 1,
      modality: 'ORD', quotaCategory: 'ORD', campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
    });
    const old = (await t.request.post('/api/v1/inscriptions').send(body('71000017')).expect(201)).body.data.applicantCode as string;
    const kept = (await t.request.post('/api/v1/inscriptions').send(body('71000018')).expect(201)).body.data.applicantCode as string;
    await t.db.application.update({ where: { applicantCode: old }, data: { callCode: '2020-I', createdAt: new Date('2020-03-01T10:00:00-05:00') } });

    const res = await t.request.post('/api/v1/admin/retention/run').set(as(admin)).expect(200);
    expect(res.body.data.inscripcionesAnonimizadas).toBe(1);
    const a = await t.db.application.findUniqueOrThrow({ where: { applicantCode: old } });
    expect(a).toMatchObject({ firstNames: 'ANONIMIZADO', documentNumber: `X${old}`, photoKey: '', modality: 'ORD', optionCode: 'P34' });
    expect(a.anonymizedAt).not.toBeNull();
    const current = await t.db.application.findUniqueOrThrow({ where: { applicantCode: kept } });
    expect(current).toMatchObject({ documentNumber: '71000018', anonymizedAt: null });
    const audit = (await t.request.get('/api/v1/admin/audit').query({ action: 'inscription.anonymized' }).set(as(admin)).expect(200)).body.data;
    expect(audit.items[0]).toMatchObject({ resourceId: old });
  });

  it('documentos adicionales de la inscripción: el postulante los sube y el personal los ve (RF-03.05)', async () => {
    const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 1, 64, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
    const photo = `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
    const code = (await t.request.post('/api/v1/inscriptions').send({
      documentType: 'DNI', documentNumber: '71000019', paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'M',
      maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-02-02', address: 'Jr. Asamblea 210, Ayacucho', residenceUbigeo: '050101',
      economicDependency: 'PADRES', mobile: '987654321', email: 'docs@example.com', photo, schoolUbigeo: '050101',
      schoolName: 'IE Luis Carranza', schoolType: 'ESTATAL', graduationYear: 2025, inFourthOrBelow: false, preparation: 'ACADEMIA', attempts: 1,
      modality: 'ORD', quotaCategory: 'ORD', campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
    }).expect(201)).body.data.applicantCode as string;
    const who = { documentNumber: '71000019', applicantCode: code };
    const list = (await t.request.get('/api/v1/inscriptions/documents').query(who).expect(200)).body.data;
    expect(list.map((d: { kind: string }) => d.kind)).toEqual(['DNI', 'ESTUDIOS']);
    const pdf = `data:application/pdf;base64,${Buffer.from('%PDF-1.4 %%EOF').toString('base64')}`;
    await t.request.post('/api/v1/inscriptions/documents').send({ ...who, kind: 'MILITAR', fileName: 'x.pdf', content: pdf }).expect(400);
    await t.request.post('/api/v1/inscriptions/documents').send({ ...who, kind: 'DNI', fileName: 'dni.pdf', content: 'data:application/pdf;base64,AAAA' }).expect(400);
    const up = (await t.request.post('/api/v1/inscriptions/documents').send({ ...who, kind: 'DNI', fileName: 'dni.pdf', content: pdf }).expect(200)).body.data;
    expect(up[0].uploaded.fileName).toBe('dni.pdf');
    const staff = (await t.request.get(`/api/v1/admin/inscriptions/${code}/documents`).set(as(admin)).expect(200)).body.data;
    expect(staff[0].uploaded).not.toBeNull();
    const file = await t.request.get(`/api/v1/admin/inscriptions/${code}/documents/DNI`).set(as(admin)).expect(200);
    expect(file.headers['content-type']).toContain('application/pdf');
  });

  it('catálogo: criterios, requisitos por submodalidad y facultades editables y auditados', async () => {
    const cat = (await t.request.get('/api/v1/admin/calls/2027-I/catalog').set(as(admin)).expect(200)).body.data;
    const psp = cat.modalities.find((m: { code: string }) => m.code === 'EXO').submodalities.find((s: { code: string }) => s.code === 'EXO-PSP');
    await t.request.put('/api/v1/admin/catalog/submodalities/EXO-PSP').set(as(admin))
      .send({ name: psp.name, legalBasis: psp.legalBasis, usesBaseDocuments: true, evaluationCriteria: 'El certificado indica el puesto y lo firma el director.' }).expect(204);
    const pub = (await t.request.get('/api/v1/calls/2027-I/submodalities').expect(200)).body.data;
    expect(pub.find((s: { code: string }) => s.code === 'EXO-PSP').evaluationCriteria).toContain('firma el director');

    const own = cat.requirements.filter((r: { isBase: boolean }) => !r.isBase);
    await t.request.put('/api/v1/admin/calls/2027-I/submodalities/EXO-PSP/requirements').set(as(admin))
      .send({ items: [{ requirementId: own[0].id, mandatory: false }] }).expect(204);
    const reqs = (await t.request.get('/api/v1/calls/2027-I/requirements').query({ submodality: 'EXO-PSP' }).expect(200)).body.data;
    expect(reqs.filter((r: { isBase: boolean }) => !r.isBase).map((r: { code: string; mandatory: boolean }) => [r.code, r.mandatory])).toEqual([[own[0].code, false]]);
    // Se restauran los documentos originales: otros archivos de prueba usan EXO-PSP.
    await t.request.put('/api/v1/admin/calls/2027-I/submodalities/EXO-PSP/requirements').set(as(admin)).send({ items: psp.requirements }).expect(204);

    await t.request.post('/api/v1/admin/catalog/faculties').set(as(admin)).send({ name: 'Facultad de Ciencias del Mar' }).expect(200);
    await t.request.post('/api/v1/admin/catalog/faculties').set(as(admin)).send({ name: 'Facultad de Ciencias del Mar' }).expect(409);
    const audit = (await t.request.get('/api/v1/admin/audit').query({ action: 'catalog.submodality.updated' }).set(as(admin)).expect(200)).body.data;
    expect(audit.items[0]).toMatchObject({ resourceId: 'EXO-PSP' });
  });

  it('imágenes del portal: se reemplazan con descripción, se sirven y se restaura la original (RF-14.01)', async () => {
    const png = `data:image/png;base64,${Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString('base64')}`;
    await t.request.put('/api/v1/admin/site-assets/portada.fachada').set(as(admin)).send({ image: 'data:image/png;base64,AAAA', alt: 'Fachada nueva de la universidad' }).expect(400);
    await t.request.put('/api/v1/admin/site-assets/portada.fachada').set(as(admin)).send({ image: png, alt: 'Fachada nueva de la universidad' }).expect(204);
    const map = (await t.request.get('/api/v1/site-assets').expect(200)).body.data;
    expect(map['portada.fachada'].alt).toBe('Fachada nueva de la universidad');
    const file = await t.request.get(map['portada.fachada'].url).expect(200);
    expect(file.headers['content-type']).toContain('image/png');
    await t.request.delete('/api/v1/admin/site-assets/portada.fachada').set(as(admin)).expect(204);
    expect((await t.request.get('/api/v1/site-assets').expect(200)).body.data['portada.fachada']).toBeUndefined();
  });

  it('denuncia reservada: sin nombre queda como caso «Denuncia» en el panel; la relación de observados es pública', async () => {
    const r = await t.request.post('/api/v1/support/complaint').send({ email: 'denuncia@example.com', message: 'Me pidieron dinero para asegurar una vacante.' }).expect(201);
    const c = await t.db.supportCase.findUniqueOrThrow({ where: { caseNumber: r.body.data.caseNumber } });
    expect(c).toMatchObject({ type: 'COMPLAINT', name: 'Reservado' });
    const obs = (await t.request.get('/api/v1/inscriptions/observed').expect(200)).body.data;
    expect(obs.callCode).toBe('2027-I');
    expect(Array.isArray(obs.rows)).toBe(true);
  });

  it('configuración: integraciones sin secretos y parámetros de retención auditados', async () => {
    const sys = (await t.request.get('/api/v1/admin/system').set(as(admin)).expect(200)).body.data;
    expect(sys.integrations.ia.value).toMatch(/Modo básico|clave/);
    await t.request.put('/api/v1/admin/parameters/retencion.conversaciones_dias').set(as(admin)).send({ value: '60' }).expect(204);
    await t.request.put('/api/v1/admin/parameters/retencion.auditoria').set(as(admin)).send({ value: '1' }).expect(400);
    const audit = (await t.request.get('/api/v1/admin/audit').query({ action: 'parameter.updated' }).set(as(admin)).expect(200)).body.data;
    expect(audit.items[0]).toMatchObject({ action: 'parameter.updated', resourceId: 'retencion.conversaciones_dias', actor: 'admin@sia-unsch.local' });
  });
});
