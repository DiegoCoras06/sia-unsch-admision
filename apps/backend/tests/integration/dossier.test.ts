import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SecretBox, totpService } from '../../src/modules/seguridad/index.js';
import { Argon2Hasher } from '../../src/modules/usuarios/infrastructure/argon2-hasher.js';
import { movableClock, testApp } from '../helpers.js';

const clock = movableClock('2026-10-25T10:00:00-05:00');
const t = testApp(clock);
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

const PASSWORD = 'Evaluador-Seguro-2027';
const box = new SecretBox('staff:test-hmac-secret-test-hmac-secret-test-hmac');
const secrets = new Map<string, string>();

/** Personal listo para entrar (contraseña propia y TOTP activo), creado directo en la base de pruebas. */
async function staff(email: string, role: string): Promise<string> {
  const secret = totpService.newSecret();
  secrets.set(email, secret);
  const user = await t.db.user.create({ data: { email, passwordHash: await new Argon2Hasher().hash(PASSWORD), type: 'STAFF', status: 'ACTIVE' } });
  await t.db.staffProfile.create({ data: { userId: user.id, fullName: email.split('@')[0]!, mustChangePassword: false, mfaSecretEnc: box.seal(secret), mfaEnabledAt: new Date() } });
  const r = await t.db.role.findUniqueOrThrow({ where: { code: role } });
  await t.db.userRole.create({ data: { userId: user.id, roleId: r.id } });
  return user.id;
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
const pdf = (text = 'documento') => Buffer.from(`%PDF-1.4\n% ${text}\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n`).toString('base64');

/** Vacía la outbox: otras pruebas en paralelo comparten la base y llenan los lotes de 20. */
async function drain() {
  for (let i = 0; i < 50 && (await t.outbox.dispatch()) > 0; i++);
}

async function registerExo(dni: string, optionCode: string): Promise<string> {
  const r = await t.request.post('/api/v1/inscriptions').send({
    documentType: 'DNI', documentNumber: dni, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'F',
    maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-07-07', address: 'Jr. Grau 50, Ayacucho', residenceUbigeo: '050101',
    economicDependency: 'PADRES', mobile: '987654321', email: `exo${dni}@example.com`, photo: fakeJpeg(), schoolUbigeo: '050101',
    schoolName: 'IE Abraham Valdelomar', schoolType: 'ESTATAL', graduationYear: 2025, inFourthOrBelow: false, preparation: 'COLEGIO', attempts: 1,
    modality: 'EXO', quotaCategory: 'PS-U', campus: 'HUAMANGA', optionCode, militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
  }).expect(201);
  expect(r.body.data.status).toBe('PENDIENTE_VALIDACION');
  return r.body.data.applicantCode;
}

const DNI = '99900019';
let code = '';
let e1 = '';
let e2 = '';
let admision = '';
const who = () => ({ documentNumber: DNI, applicantCode: code });
const upload = (requirementCode: string, contentBase64: string, fileName = `${requirementCode}.pdf`) =>
  t.request.post('/api/v1/dossier/documents').send({ ...who(), requirementCode, fileName, contentBase64 });

beforeAll(async () => {
  e1 = await staff('eval1@sia-unsch.local', 'EVALUADOR');
  e2 = await staff('eval2@sia-unsch.local', 'EVALUADOR');
  await staff('admision@sia-unsch.local', 'ADMISION');
  admision = await tokenOf('admision@sia-unsch.local');
  code = await registerExo(DNI, 'P01');
});

describe('Expediente del postulante (Historias 1, 2 y 4)', () => {
  it('muestra los documentos de su submodalidad y los datos complementarios', async () => {
    const d = (await t.request.get('/api/v1/dossier').query(who()).expect(200)).body.data;
    expect(d).toMatchObject({ status: 'BORRADOR', editable: true, submodality: 'EXO-PSP' });
    expect(d.requirements.map((r: { code: string }) => r.code)).toEqual(expect.arrayContaining(['BASE-DNI', 'BASE-CERT-SEC', 'PSP-RESOL']));
    expect(d.complementaryFields.map((f: { key: string }) => f.key)).toEqual(['puesto', 'ambito']);
  });

  it('rechaza archivos falsos, dañados, protegidos o grandes (RF-04.05)', async () => {
    const bad = async (content: string, reason: RegExp) => expect((await upload('BASE-DNI', content).expect(400)).body.error.message).toMatch(reason);
    await bad(Buffer.from('hola, esto es texto').toString('base64'), /Formato no permitido/);
    await bad(Buffer.from('%PDF-1.4\nsin final').toString('base64'), /incompleto o dañado/);
    await bad(Buffer.from('%PDF-1.4\n<< /Encrypt 5 0 R >>\n%%EOF').toString('base64'), /contraseña/);
    await bad(Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(5 * 1024 * 1024 + 10, 32), Buffer.from('%%EOF')]).toString('base64'), /5 MB/);
  });

  it('con S3: sube directo al bucket con formulario prefirmado, se valida y se abre con enlace temporal (ADR-010)', async () => {
    // Se simula S3 sobre el almacenamiento en memoria: formulario prefirmado y enlace temporal.
    t.storage.presignUpload = async (key) => ({ url: 'https://bucket.s3.test/', fields: { key } });
    t.storage.presignDownload = async (key) => `https://bucket.s3.test/${key}?firma=temporal`;
    try {
      // Sin S3 la API responde «inline»; con S3, el formulario y la clave temporal del postulante.
      const tk = (await t.request.post('/api/v1/dossier/documents/upload-url').send({ ...who(), requirementCode: 'BASE-CERT-SEC', contentType: 'application/pdf', size: 2048 }).expect(200)).body.data;
      expect(tk).toMatchObject({ mode: 's3', url: 'https://bucket.s3.test/' });
      expect(tk.uploadKey).toMatch(new RegExp(`^subidas/expedientes/${code}/[0-9a-f-]{36}$`));
      await t.request.post('/api/v1/dossier/documents/upload-url').send({ ...who(), requirementCode: 'BASE-CERT-SEC', contentType: 'application/zip', size: 2048 }).expect(400);
      await t.request.post('/api/v1/dossier/documents/upload-url').send({ ...who(), requirementCode: 'BASE-CERT-SEC', contentType: 'application/pdf', size: 6 * 1024 * 1024 }).expect(400);

      // El navegador sube a S3 (aquí, directo al almacenamiento) y confirma con la clave.
      await t.storage.put(tk.uploadKey, Buffer.from(pdf('certificado'), 'base64'), 'application/pdf');
      const d = (await t.request.post('/api/v1/dossier/documents').send({ ...who(), requirementCode: 'BASE-CERT-SEC', fileName: 'certificado.pdf', uploadKey: tk.uploadKey }).expect(201)).body.data;
      const doc = d.requirements.find((r: { code: string }) => r.code === 'BASE-CERT-SEC').current;
      expect(doc).toMatchObject({ fileName: 'certificado.pdf', mimeType: 'application/pdf' });
      expect(t.storage.files.has(tk.uploadKey)).toBe(false);

      // Una clave de otro postulante no se acepta; un archivo falso subido a S3 se rechaza y se borra.
      await t.request.post('/api/v1/dossier/documents').send({ ...who(), requirementCode: 'BASE-CERT-SEC', fileName: 'x.pdf', uploadKey: 'subidas/expedientes/00000000/00000000-0000-4000-8000-000000000000' }).expect(400);
      const fake = (await t.request.post('/api/v1/dossier/documents/upload-url').send({ ...who(), requirementCode: 'BASE-CERT-SEC', contentType: 'application/pdf', size: 20 }).expect(200)).body.data;
      await t.storage.put(fake.uploadKey, Buffer.from('esto no es un PDF'), 'application/pdf');
      await t.request.post('/api/v1/dossier/documents').send({ ...who(), requirementCode: 'BASE-CERT-SEC', fileName: 'falso.pdf', uploadKey: fake.uploadKey }).expect(400);
      expect(t.storage.files.has(fake.uploadKey)).toBe(false);

      // Abrir el documento: enlace temporal en lugar del archivo.
      const open = await t.request.get(`/api/v1/dossier/documents/${doc.id}`).query(who()).expect(200);
      expect(open.body.data.url).toMatch(/^https:\/\/bucket\.s3\.test\/expedientes\/.+\?firma=temporal$/);
    } finally {
      delete t.storage.presignUpload;
      delete t.storage.presignDownload;
    }
  });

  it('no envía con faltantes; enviado queda «En revisión», asignado y sin poder pagar (RN-24)', async () => {
    await upload('BASE-DNI', pdf('dni')).expect(201);
    const miss = await t.request.post('/api/v1/dossier/submit').send(who()).expect(422);
    expect(miss.body.error.code).toBe('DOSSIER_INCOMPLETE');
    expect(miss.body.error.missing).toEqual(expect.arrayContaining(['PSP-RESOL']));

    const d0 = (await t.request.get('/api/v1/dossier').query(who()).expect(200)).body.data;
    for (const r of d0.requirements.filter((x: { mandatory: boolean; current: unknown }) => x.mandatory && !x.current)) await upload(r.code, pdf(r.code)).expect(201);
    await t.request.post('/api/v1/dossier/submit').send(who()).expect(422); // faltan datos complementarios
    await t.request.put('/api/v1/dossier/complementary').send({ ...who(), values: { puesto: '1', ambito: 'urbano' } }).expect(200);
    const sent = (await t.request.post('/api/v1/dossier/submit').send(who()).expect(200)).body.data;
    expect(sent).toMatchObject({ status: 'EN_REVISION', editable: false });
    await upload('BASE-DNI', pdf('otra')).expect(422);

    const row = await t.db.dossier.findUniqueOrThrow({ where: { applicantCode: code } });
    expect([e1, e2]).toContain(row.evaluatorId);
    const pay = await t.request.post('/api/v1/payments/session').send(who()).expect(422);
    expect(pay.body.error.code).toBe('DOSSIER_NOT_AUTHORIZED');
  });
});

describe('Evaluación (Historia 3) y subsanación (Historia 4)', () => {
  it('el evaluador ajeno no lo ve; el asignado observa, el postulante subsana y luego se autoriza', async () => {
    const row = await t.db.dossier.findUniqueOrThrow({ where: { applicantCode: code } });
    const mine = row.evaluatorId === e1 ? 'eval1@sia-unsch.local' : 'eval2@sia-unsch.local';
    const other = row.evaluatorId === e1 ? 'eval2@sia-unsch.local' : 'eval1@sia-unsch.local';
    const tokOther = await tokenOf(other);
    await t.request.get(`/api/v1/admin/dossiers/${row.id}`).set(as(tokOther)).expect(403);
    expect((await t.request.get('/api/v1/admin/dossiers').set(as(tokOther)).expect(200)).body.data.some((x: { id: string }) => x.id === row.id)).toBe(false);

    const tok = await tokenOf(mine);
    let d = (await t.request.get(`/api/v1/admin/dossiers/${row.id}`).set(as(tok)).expect(200)).body.data;
    const docOf = (c: string) => d.requirements.find((r: { code: string }) => r.code === c).current;

    // Descarga auditada (RF-06.02).
    const dl = await t.request.get(`/api/v1/admin/dossiers/${row.id}/documents/${docOf('PSP-RESOL').id}`).set(as(tok)).expect(200);
    expect(dl.headers['content-type']).toBe('application/pdf');
    expect(await t.db.auditEvent.count({ where: { action: 'dossier.file_downloaded', resourceId: docOf('PSP-RESOL').id } })).toBe(1);

    // Autorizar exige todo conforme; observar exige motivo.
    expect((await t.request.post(`/api/v1/admin/dossiers/${row.id}/decision`).set(as(tok)).send({ decision: 'AUTORIZAR' }).expect(422)).body.error.code).toBe('NOT_ALL_CONFORMING');
    await t.request.post(`/api/v1/admin/dossiers/${row.id}/documents/${docOf('PSP-RESOL').id}/review`).set(as(tok)).send({ verdict: 'OBSERVADO' }).expect(400);
    for (const r of d.requirements.filter((x: { current: unknown }) => x.current)) {
      const verdict = r.code === 'PSP-RESOL' ? { verdict: 'OBSERVADO', note: 'La resolución no tiene el visado de la UGEL' } : { verdict: 'CONFORME' };
      d = (await t.request.post(`/api/v1/admin/dossiers/${row.id}/documents/${r.current.id}/review`).set(as(tok)).send(verdict).expect(200)).body.data;
    }
    d = (await t.request.post(`/api/v1/admin/dossiers/${row.id}/decision`).set(as(tok)).send({ decision: 'OBSERVAR' }).expect(200)).body.data;
    expect(d.status).toBe('OBSERVADO');
    expect(d.observeDeadline).toBeTruthy();
    await drain();
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: code } })).status).toBe('OBSERVADA');
    expect(t.email.sent.some((m) => m.to === `exo${DNI}@example.com` && m.html.includes('visado de la UGEL'))).toBe(true);

    // El postulante solo puede reemplazar lo observado; la versión anterior se conserva (RF-06.06).
    expect((await upload('BASE-DNI', pdf('x')).expect(422)).body.error.code).toBe('NOT_OBSERVED');
    await upload('PSP-RESOL', pdf('resolucion visada')).expect(201);
    await t.request.post('/api/v1/dossier/submit').send(who()).expect(200);
    await drain();
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: code } })).status).toBe('PENDIENTE_VALIDACION');
    const versions = await t.db.dossierDocument.findMany({ where: { dossierId: row.id, requirementCode: 'PSP-RESOL' }, orderBy: { version: 'asc' } });
    expect(versions.map((v) => [v.version, v.status])).toEqual([[1, 'REEMPLAZADO'], [2, 'CARGADO']]);

    d = (await t.request.get(`/api/v1/admin/dossiers/${row.id}`).set(as(tok)).expect(200)).body.data;
    await t.request.post(`/api/v1/admin/dossiers/${row.id}/documents/${docOf('PSP-RESOL').id}/review`).set(as(tok)).send({ verdict: 'CONFORME' }).expect(200);
    d = (await t.request.post(`/api/v1/admin/dossiers/${row.id}/decision`).set(as(tok)).send({ decision: 'AUTORIZAR', note: 'Requisitos completos' }).expect(200)).body.data;
    expect(d.status).toBe('AUTORIZADO');
    await drain();
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: code } })).status).toBe('PENDIENTE_PAGO');
    await t.request.post('/api/v1/payments/session').send(who()).expect(201);
  });

  it('Admisión ve todos, asigna a mano y registra una verificación presencial (Historia 7)', async () => {
    const dni2 = '99900020';
    const code2 = await registerExo(dni2, 'P02');
    await t.request.get('/api/v1/dossier').query({ documentNumber: dni2, applicantCode: code2 }).expect(200);
    const row = await t.db.dossier.findUniqueOrThrow({ where: { applicantCode: code2 } });
    await t.request.post(`/api/v1/admin/dossiers/${row.id}/assign`).set(as(admision)).send({ evaluatorId: e2 }).expect(200);
    const tokE1 = await tokenOf('eval1@sia-unsch.local');
    await t.request.post(`/api/v1/admin/dossiers/${row.id}/assign`).set(as(tokE1)).send({ evaluatorId: e1 }).expect(403);
    const d = (await t.request.post(`/api/v1/admin/dossiers/${row.id}/in-person`).set(as(admision)).send({ note: 'Documentos físicos verificados en Jr. Arequipa 175' }).expect(200)).body.data;
    expect(d).toMatchObject({ status: 'AUTORIZADO', verifiedInPerson: true });
    await drain();
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: code2 } })).status).toBe('PENDIENTE_PAGO');
  });

  it('vencido el plazo sin subsanar, el expediente queda «No subsanado» y la inscripción anulada (H4-3)', async () => {
    const dni3 = '99900012';
    const code3 = await registerExo(dni3, 'P03');
    const w = { documentNumber: dni3, applicantCode: code3 };
    const d0 = (await t.request.get('/api/v1/dossier').query(w).expect(200)).body.data;
    for (const r of d0.requirements.filter((x: { mandatory: boolean }) => x.mandatory)) {
      await t.request.post('/api/v1/dossier/documents').send({ ...w, requirementCode: r.code, fileName: 'x.pdf', contentBase64: pdf() }).expect(201);
    }
    await t.request.put('/api/v1/dossier/complementary').send({ ...w, values: { puesto: '2', ambito: 'urbano' } }).expect(200);
    await t.request.post('/api/v1/dossier/submit').send(w).expect(200);
    const row = await t.db.dossier.findUniqueOrThrow({ where: { applicantCode: code3 } });
    const d = (await t.request.get(`/api/v1/admin/dossiers/${row.id}`).set(as(admision)).expect(200)).body.data;
    const first = d.requirements.find((r: { current: unknown }) => r.current).current.id;
    await t.request.post(`/api/v1/admin/dossiers/${row.id}/documents/${first}/review`).set(as(admision)).send({ verdict: 'OBSERVADO', note: 'Ilegible' }).expect(200);
    await t.request.post(`/api/v1/admin/dossiers/${row.id}/decision`).set(as(admision)).send({ decision: 'OBSERVAR' }).expect(200);
    await t.request.post(`/api/v1/admin/dossiers/${row.id}/decision`).set(as(admision)).send({ decision: 'RECHAZAR' }).expect(422); // ya no está en revisión
    // RF-10.06: el asistente informa el expediente observado con su plazo.
    const pass = (await t.request.post('/api/v1/assistant/identify').send(w).expect(200)).body.data;
    const said = (await t.request.post('/api/v1/assistant/messages').send({ message: '¿Cómo va mi expediente?', accessToken: pass.accessToken }).expect(200)).body.data.reply;
    expect(said).toContain('Expediente: Observado');
    expect(said).toContain('Ilegible');

    clock.advance(4 * 24 * 3600);
    const late = (await t.request.get('/api/v1/dossier').query(w).expect(200)).body.data;
    expect(late.status).toBe('NO_SUBSANADO');
    await drain();
    expect((await t.db.application.findUniqueOrThrow({ where: { applicantCode: code3 } })).status).toBe('ANULADA');
  });

  it('una inscripción ordinaria no tiene expediente', async () => {
    const r = await t.request.get('/api/v1/dossier').query({ documentNumber: '12345678', applicantCode: '27000017' });
    expect([404, 422]).toContain(r.status);
  });
});
