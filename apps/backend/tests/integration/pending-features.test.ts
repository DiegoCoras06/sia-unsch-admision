import ExcelJS from 'exceljs';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { SecretBox, totpService } from '../../src/modules/seguridad/index.js';
import { Argon2Hasher } from '../../src/modules/usuarios/infrastructure/argon2-hasher.js';
import { movableClock, testApp } from '../helpers.js';

/** T232 reinscripción, T540 vacantes desde Excel, T542 evidencia de denuncias y T640 adjudicados CEPRE. */
const clock = movableClock('2026-10-25T10:00:00-05:00');
const t = testApp(clock);
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

const PASSWORD = 'Pendientes-Seguro-2027';
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- firma del parser de superagent
const binary = (res: any, cb: (err: Error | null, body: any) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};
/** Avanza el reloj hasta una fecha de Lima. */
const goTo = (iso: string) => clock.advance(Math.max(0, (new Date(iso).getTime() - clock.now().getTime()) / 1000));

function fakeJpeg(): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 320 >> 8, 320 & 255, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}
const inscription = (dni: string, extra: Record<string, unknown> = {}) => ({
  documentType: 'DNI', documentNumber: dni, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'F',
  maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-04-04', address: 'Jr. Bellido 400, Ayacucho', residenceUbigeo: '050101',
  economicDependency: 'PADRES', mobile: '987654321', email: `pend${dni}@example.com`, photo: fakeJpeg(), schoolUbigeo: '050101',
  schoolName: 'IE Mariscal Cáceres', schoolType: 'ESTATAL', graduationYear: 2025, inFourthOrBelow: false, preparation: 'CEPRE_UNSCH', attempts: 1,
  modality: 'ORD', quotaCategory: 'ORD', campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
  ...extra,
});

let admin = '';
const exo: Record<string, string> = {};

describe('Preparación', () => {
  it('personal de Admisión y exonerados aptos con resultado publicado (no admitidos)', async () => {
    await staff('pendientes-admin@sia-unsch.local', 'ADMIN');
    admin = await tokenOf('pendientes-admin@sia-unsch.local');
    // Exonerados aptos: discapacidad (puede reinscribirse) y traslado interno (no puede, Art. 21).
    for (const [dni, category] of [['99900073', 'DIS'], ['99900074', 'TI']] as const) {
      const code = (await t.request.post('/api/v1/inscriptions').send(inscription(dni)).expect(201)).body.data.applicantCode as string;
      await t.db.application.update({ where: { applicantCode: code }, data: { modality: 'EXO', quotaCategory: category, status: 'APTA' } });
      exo[dni] = code;
    }
    const version = await t.db.resultVersion.create({
      data: { examId: crypto.randomUUID(), callCode: '2027-I', version: 1, batchId: crypto.randomUUID(), status: 'PUBLICADA', createdBy: crypto.randomUUID(), vacancies: {} },
    });
    await t.db.examResult.createMany({
      data: Object.values(exo).map((applicantCode) => ({ versionId: version.id, applicantCode, optionCode: 'P34', quotaCategory: 'DIS', condition: 'NO_ADMITIDO' as const })),
    });
  });
});

describe('Evidencia en denuncias (T542)', () => {
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
  const complaint = (attachments?: { fileName: string; content: string }[]) =>
    t.request.post('/api/v1/support/complaint').send({ email: 'testigo@example.com', message: 'Vi que vendían las preguntas del examen en la puerta 2.', attachments });

  it('guarda la evidencia y el personal la descarga con auditoría', async () => {
    const res = await complaint([{ fileName: 'captura chat.pdf', content: `data:application/pdf;base64,${pdf.toString('base64')}` }]).expect(201);
    const caseNumber = res.body.data.caseNumber as string;
    const list = (await t.request.get('/api/v1/admin/cases').query({ type: 'COMPLAINT' }).set(as(admin)).expect(200)).body.data;
    const c = list.items.find((x: { caseNumber: string }) => x.caseNumber === caseNumber);
    expect(c.attachments).toEqual([expect.objectContaining({ fileName: 'captura chat.pdf', contentType: 'application/pdf', sizeBytes: pdf.length })]);
    const file = await t.request.get(`/api/v1/admin/cases/${caseNumber}/attachments/${c.attachments[0].id}`).set(as(admin)).buffer(true).parse(binary).expect(200);
    expect((file.body as Buffer).equals(pdf)).toBe(true);
    expect(await t.db.auditEvent.count({ where: { action: 'case.attachment_downloaded', resourceId: caseNumber } })).toBe(1);
  });

  it('rechaza archivos que no son PDF, JPG o PNG y más de 3 adjuntos, sin crear el caso', async () => {
    const before = await t.db.supportCase.count();
    const bad = await complaint([{ fileName: 'virus.pdf', content: Buffer.from('MZ esto no es un PDF').toString('base64') }]).expect(400);
    expect(bad.body.error.message).toContain('Formato no permitido');
    const four = Array.from({ length: 4 }, (_, i) => ({ fileName: `${i}.pdf`, content: pdf.toString('base64') }));
    await complaint(four).expect(400);
    expect(await t.db.supportCase.count()).toBe(before);
  });
});

describe('Vacantes desde Excel (T540)', () => {
  async function workbook(edit: (ws: ExcelJS.Worksheet) => void): Promise<string> {
    const tpl = await t.request.get('/api/v1/admin/calls/2027-I/vacancies/template.xlsx').set(as(admin)).buffer(true).parse(binary).expect(200);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(tpl.body as unknown as ArrayBuffer);
    edit(wb.worksheets[0]!);
    return Buffer.from(await wb.xlsx.writeBuffer()).toString('base64');
  }
  const col = (ws: ExcelJS.Worksheet, name: string) => (ws.getRow(1).values as string[]).indexOf(name);
  const p01 = (ws: ExcelJS.Worksheet) => { let n = 0; ws.eachRow((r, i) => { if (r.getCell(1).value === 'P01') n = i; }); return ws.getRow(n); };

  it('la vista previa marca las filas que no suman su total y no guarda nada', async () => {
    const file = await workbook((ws) => { const r = p01(ws); r.getCell(col(ws, 'ORD')).value = Number(r.getCell(col(ws, 'ORD')).value) + 5; });
    const p = (await t.request.post('/api/v1/admin/calls/2027-I/vacancies/import/preview').set(as(admin)).send({ file }).expect(200)).body.data;
    expect(p.valid).toBe(false);
    expect(p.rows.find((r: { optionCode: string }) => r.optionCode === 'P01').errors[0]).toMatch(/suma .* pero su TOTAL/);
    await t.request.post('/api/v1/admin/calls/2027-I/vacancies/import').set(as(admin)).send({ file, resolution: 'R-1', reason: 'x' }).expect(422);
  });

  it('un archivo válido muestra las diferencias y se guarda con resolución', async () => {
    const before = (await t.db.vacancy.findFirstOrThrow({ where: { call: { code: '2027-I' }, option: { internalCode: 'P01' }, quotaCategory: { code: 'ORD' } } })).quantity;
    const file = await workbook((ws) => {
      const r = p01(ws);
      r.getCell(col(ws, 'ORD')).value = before + 1;
      r.getCell(col(ws, 'TOTAL')).value = Number(r.getCell(col(ws, 'TOTAL')).value) + 1;
    });
    const p = (await t.request.post('/api/v1/admin/calls/2027-I/vacancies/import/preview').set(as(admin)).send({ file }).expect(200)).body.data;
    expect(p.valid).toBe(true);
    expect(p.totals.changedCells).toBe(1);
    expect(p.rows.find((r: { optionCode: string }) => r.optionCode === 'P01').changes).toEqual([{ category: 'ORD', from: before, to: before + 1 }]);
    const call = await t.db.admissionCall.findUniqueOrThrow({ where: { code: '2027-I' } });
    if (call.status === 'PUBLISHED') await t.request.post('/api/v1/admin/calls/2027-I/vacancies/import').set(as(admin)).send({ file }).expect(422);
    const done = (await t.request.post('/api/v1/admin/calls/2027-I/vacancies/import').set(as(admin)).send({ file, resolution: 'R.D. 015-2026', reason: 'Ajuste de vacantes' }).expect(200)).body.data;
    expect(done.changedCells).toBe(1);
    const where = { call: { code: '2027-I' }, option: { internalCode: 'P01' }, quotaCategory: { code: 'ORD' } };
    expect((await t.db.vacancy.findFirstOrThrow({ where })).quantity).toBe(before + 1);
    // Deja la semilla como estaba: otras pruebas comprueban el total oficial de 1803 vacantes.
    await t.db.vacancy.updateMany({ where, data: { quantity: before } });
  });
});

describe('Adjudicados CEPRE (T640)', () => {
  it('una lista con errores no se guarda; una válida reemplaza a la anterior', async () => {
    const bad = await t.request.post('/api/v1/admin/cepre-awardees').set(as(admin)).send({ csv: 'dni;programa;ciclo;nombres\n123;P34;I;ANA\n99900071;P99;III;' }).expect(400);
    expect(bad.body.error.details.length).toBeGreaterThanOrEqual(2);
    const ok = (await t.request.post('/api/v1/admin/cepre-awardees').set(as(admin))
      .send({ csv: 'dni;programa;ciclo;apellidos y nombres\n99900071;P34;I;QUISPE ROJAS, ANA\n99900072;p01;II;HUAMAN SOTO, LUIS\n' }).expect(200)).body.data;
    expect(ok).toMatchObject({ total: 2, registered: 0 });
    expect((await t.request.get('/api/v1/inscriptions/cepre-awardee').query({ documentNumber: '99900071' }).expect(200)).body.data)
      .toMatchObject({ optionCode: 'P34', quotaCategory: 'CE-I', cycle: 'Ciclo I' });
    await t.request.get('/api/v1/inscriptions/cepre-awardee').query({ documentNumber: '99900079' }).expect(404);
  });

  it('el adjudicado se inscribe con su programa y ciclo (S/ 335.00); quien no figura, no', async () => {
    goTo('2026-11-11T10:00:00-05:00');
    const r = (await t.request.post('/api/v1/inscriptions').send(inscription('99900071', { modality: 'CEPRE', quotaCategory: 'CE-II', optionCode: 'P01' })).expect(201)).body.data;
    expect(r.fee.total).toBe('335.00');
    const row = await t.db.application.findUniqueOrThrow({ where: { applicantCode: r.applicantCode } });
    expect(row).toMatchObject({ modality: 'CEPRE', optionCode: 'P34', quotaCategory: 'CE-I' });
    const denied = await t.request.post('/api/v1/inscriptions').send(inscription('99900079', { modality: 'CEPRE', quotaCategory: 'CE-I' })).expect(422);
    expect(denied.body.error.code).toBe('NOT_CEPRE_AWARDEE');
  });

  it('el 13/11 se aplica el recargo extemporáneo CEPRE de S/ 50.00 (total S/ 385.00)', async () => {
    goTo('2026-11-13T10:00:00-05:00');
    const r = (await t.request.post('/api/v1/inscriptions').send(inscription('99900072', { modality: 'CEPRE', quotaCategory: 'CE-II' })).expect(201)).body.data;
    expect(r.fee.total).toBe('385.00');
  });
});

describe('Reinscripción de exonerados no admitidos (T232)', () => {
  it('antes del 16/11 todavía no se puede', async () => {
    const c = (await t.request.get('/api/v1/inscriptions/reinscription').query({ documentNumber: '99900073', applicantCode: exo['99900073'] }).expect(200)).body.data;
    expect(c).toMatchObject({ eligible: false, amount: '180.00' });
    expect(c.reason).toContain('se abre el');
  });

  it('en la etapa de reinscripción: nueva inscripción al Ordinario por S/ 180.00, una sola vez', async () => {
    goTo('2026-11-16T10:00:00-05:00');
    const q = { documentNumber: '99900073', applicantCode: exo['99900073'] };
    expect((await t.request.get('/api/v1/inscriptions/reinscription').query(q).expect(200)).body.data).toMatchObject({ eligible: true, reason: null });
    const r = (await t.request.post('/api/v1/inscriptions/reinscription').send({ ...q, optionCode: 'P34' }).expect(201)).body.data;
    expect(r).toMatchObject({ status: 'PENDIENTE_PAGO', modalityCode: 'ORD', fee: { total: '180.00' } });
    expect(r.applicantCode).not.toBe(exo['99900073']);
    const row = await t.db.application.findUniqueOrThrow({ where: { applicantCode: r.applicantCode } });
    expect(row).toMatchObject({ reinscriptionOf: exo['99900073'], documentNumber: '99900073', quotaCategory: 'ORD' });
    const again = await t.request.post('/api/v1/inscriptions/reinscription').send({ ...q, optionCode: 'P34' }).expect(422);
    expect(again.body.error.message).toContain('Ya tienes una inscripción en el Ordinario');
  });

  it('traslados y graduados no pueden reinscribirse (Art. 21)', async () => {
    const q = { documentNumber: '99900074', applicantCode: exo['99900074'] };
    const c = (await t.request.get('/api/v1/inscriptions/reinscription').query(q).expect(200)).body.data;
    expect(c.eligible).toBe(false);
    expect(c.reason).toContain('Art. 21');
    await t.request.post('/api/v1/inscriptions/reinscription').send({ ...q, optionCode: 'P34' }).expect(422);
  });
});
