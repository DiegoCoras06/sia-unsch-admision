import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { checkDigit, testApp } from '../helpers.js';

const t = testApp('2026-10-25T10:00:00-05:00');
afterAll(() => t.db.$disconnect());
beforeEach(() => t.db.rateLimitCounter.deleteMany());

function fakeJpeg(): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 320 >> 8, 320 & 255, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}

describe('Cuenta opcional vinculada por DNI (enmienda de ADR-015)', () => {
  it('quien se inscribió sin cuenta la ve en «Mi cuenta» al crear su cuenta con el mismo DNI', async () => {
    const dni = '99900018';
    const reg = await t.request.post('/api/v1/inscriptions').send({
      documentType: 'DNI', documentNumber: dni, paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'M',
      maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-06-06', address: 'Jr. 9 de Diciembre 120, Ayacucho', residenceUbigeo: '050101',
      economicDependency: 'PADRES', mobile: '987654321', email: 'vinculo@example.com', photo: fakeJpeg(), schoolUbigeo: '050101',
      schoolName: 'IE San Juan Bosco', schoolType: 'PARTICULAR', graduationYear: 2025, inFourthOrBelow: false, preparation: 'COLEGIO', attempts: 1,
      modality: 'ORD', quotaCategory: 'ORD', campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
    }).expect(201);
    const code = reg.body.data.applicantCode;

    // Cuenta: DNI con dígito verificador → registro → código del correo → ingreso.
    const id = await t.request.post('/api/v1/auth/identity/lookup').send({ documentType: 'DNI', documentNumber: dni, checkDigit: checkDigit(dni) }).expect(200);
    const consent = await t.request.get('/api/v1/legal/consent/current').expect(200);
    await t.request.post('/api/v1/auth/register').send({
      identityToken: id.body.data.identityToken, email: 'cuenta.vinculo@example.com', phone: '987654321', password: 'Huamanga-Ayacucho-2026', consentVersion: consent.body.data.version,
    }).expect(201);
    await t.outbox.dispatch();
    const mail = [...t.email.sent].reverse().find((m) => m.to === 'cuenta.vinculo@example.com' && m.subject.startsWith('Código'));
    await t.request.post('/api/v1/auth/email/verify').send({ email: 'cuenta.vinculo@example.com', code: /(\d{6})/.exec(mail!.text)![1] }).expect(200);
    const token = (await t.request.post('/api/v1/auth/login').send({ identifier: dni, password: 'Huamanga-Ayacucho-2026' }).expect(200)).body.data.accessToken;

    const mine = (await t.request.get('/api/v1/me/inscriptions').set('Authorization', `Bearer ${token}`).expect(200)).body.data;
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ applicantCode: code, program: 'Ingeniería de Sistemas', status: 'PENDIENTE_PAGO', fichaAvailable: false });

    // Sin sesión no hay acceso.
    await t.request.get('/api/v1/me/inscriptions').expect(401);
  });
});
