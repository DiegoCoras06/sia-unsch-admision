import { createHmac } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { testApp } from '../helpers.js';

const t = testApp('2026-10-25T10:00:00-05:00');
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

/** Misma firma que app.ts (`ficha-qr:${HMAC_SECRET}`) para construir el token del QR. */
const token = (code: string) =>
  `${code}.${createHmac('sha256', 'ficha-qr:test-hmac-secret-test-hmac-secret-test-hmac').update(`ficha:${code}`).digest('base64url').slice(0, 16)}`;

function fakeJpeg(): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 320 >> 8, 320 & 255, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- firma del parser de superagent
const binary = (res: any, cb: (err: Error | null, body: any) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};

describe('Ficha de inscripción con QR (spec 003, Historia 5)', () => {
  let code = '';

  it('antes del pago no hay ficha; después del pago se descarga un PDF', async () => {
    const reg = await t.request.post('/api/v1/inscriptions').send({
      documentType: 'DNI', documentNumber: '99900017', paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'F',
      maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-04-04', address: 'Jr. Bellido 400, Ayacucho', residenceUbigeo: '050101',
      economicDependency: 'PADRES', mobile: '987654321', email: 'ficha@example.com', photo: fakeJpeg(), schoolUbigeo: '050101',
      schoolName: 'IE Mariscal Cáceres', schoolType: 'ESTATAL', graduationYear: 2025, inFourthOrBelow: false, preparation: 'ACADEMIA', attempts: 1,
      modality: 'ORD', quotaCategory: 'ORD', campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
    }).expect(201);
    code = reg.body.data.applicantCode;
    expect(reg.body.data.fichaAvailable).toBe(false);

    // La orden de pago se descarga desde el registro: un PDF de una sola hoja; con otro DNI, 404.
    const orden = await t.request.get('/api/v1/inscriptions/orden-pago.pdf').query({ documentNumber: '99900017', applicantCode: code }).buffer(true).parse(binary).expect(200);
    expect(orden.headers['content-type']).toBe('application/pdf');
    expect(orden.headers['content-disposition']).toContain(`orden-de-pago-${code}.pdf`);
    expect((orden.body as Buffer).toString('latin1').match(/\/Type\s*\/Page[^s]/g)).toHaveLength(1);
    await t.request.get('/api/v1/inscriptions/orden-pago.pdf').query({ documentNumber: '12345678', applicantCode: code }).expect(404);
    const early = await t.request.get('/api/v1/inscriptions/ficha.pdf').query({ documentNumber: '99900017', applicantCode: code }).expect(422);
    expect(early.body.error.code).toBe('FICHA_NOT_AVAILABLE');

    // Pago con la pasarela simulada → evento → Apta.
    const s = (await t.request.post('/api/v1/payments/session').send({ documentNumber: '99900017', applicantCode: code }).expect(201)).body.data;
    await t.request.post('/api/v1/payments/charge').send({ documentNumber: '99900017', applicantCode: code, transactionId: s.transactionId, token: 'mock_tarjeta_aprobada' }).expect(200);
    // La outbox es compartida por todos los archivos de prueba: se vacía en bucle.
    for (let i = 0; i < 50 && (await t.outbox.dispatch()) > 0; i++);

    const status = (await t.request.get('/api/v1/inscriptions/status').query({ documentNumber: '99900017', applicantCode: code }).expect(200)).body.data;
    expect(status.fichaAvailable).toBe(true);
    const pdf = await t.request.get('/api/v1/inscriptions/ficha.pdf').query({ documentNumber: '99900017', applicantCode: code }).buffer(true).parse(binary).expect(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
    writeFileSync(path.join(os.tmpdir(), 'sia-ficha-prueba.pdf'), pdf.body as Buffer);

    // Con otro DNI no se entrega.
    await t.request.get('/api/v1/inscriptions/ficha.pdf').query({ documentNumber: '12345678', applicantCode: code }).expect(404);
  });

  it('el QR verifica la ficha sin mostrar el DNI completo; un QR alterado no es válido', async () => {
    const ok = (await t.request.get(`/api/v1/inscriptions/verify/${token(code)}`).expect(200)).body.data;
    expect(ok).toMatchObject({ valid: true, applicantCode: code, program: 'Ingeniería de Sistemas', document: '9990••17' });
    expect(JSON.stringify(ok)).not.toContain('99900017');
    expect(ok.photo).toMatch(/^data:image\/jpeg;base64,/);

    const forged = `${code}.AAAAAAAAAAAAAAAA`;
    expect((await t.request.get(`/api/v1/inscriptions/verify/${forged}`).expect(200)).body.data.valid).toBe(false);
  });

  it('una inscripción anulada deja su ficha sin validez (escenario 3)', async () => {
    await t.db.application.update({ where: { applicantCode: code }, data: { status: 'ANULADA' } });
    const r = (await t.request.get(`/api/v1/inscriptions/verify/${token(code)}`).expect(200)).body.data;
    expect(r).toMatchObject({ valid: false });
    expect(r.reason).toMatch(/anulada/);
  });
});
