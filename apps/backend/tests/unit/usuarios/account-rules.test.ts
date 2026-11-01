import { describe, expect, it } from 'vitest';
import {
  applicantCodeFromSequence, isMinor, isValidApplicantCode, luhnCheckDigit, passwordIssues, registerLoginFailure,
} from '../../../src/modules/usuarios/domain/account-rules.js';
import { maskEmail } from '../../../src/shared/telemetry/logger.js';

describe('Código de postulante con Luhn (research R-09 de 002)', () => {
  it('el primer código es 27000017', () => {
    expect(applicantCodeFromSequence(2_700_001)).toBe('27000017');
  });
  it('detecta un dígito mal dictado', () => {
    expect(isValidApplicantCode('27000017')).toBe(true);
    expect(isValidApplicantCode('27000018')).toBe(false);
    expect(isValidApplicantCode('27000071')).toBe(false);
  });
  it('coincide con el ejemplo clásico de Luhn', () => {
    expect(luhnCheckDigit('7992739871')).toBe(3);
  });
});

describe('Política de contraseñas (FR-005 de 002)', () => {
  it('acepta una frase larga', () => {
    expect(passwordIssues('Huamanga-Ayacucho-2026')).toEqual([]);
  });
  it.each([
    ['corta', 'Abc12345'],
    ['común', '1234567890'],
    ['repetida', 'aaaaaaaaaaaa'],
  ])('rechaza una contraseña %s', (_label, password) => {
    expect(passwordIssues(password).length).toBeGreaterThan(0);
  });
  it('rechaza contener el DNI o el usuario del correo', () => {
    expect(passwordIssues('Clave99900001x', { documentNumber: '99900001' })).toContain('No puede contener tu número de documento.');
    expect(passwordIssues('mariaprueba2026!', { email: 'mariaprueba@example.com' })).toContain('No puede contener tu correo.');
  });
});

describe('Bloqueo por intentos fallidos (research R-08 de 002)', () => {
  const t0 = new Date('2026-10-25T10:00:00-05:00');
  const after = (s: number) => new Date(t0.getTime() + s * 1000);

  it('bloquea 15 minutos al quinto fallo dentro de 15 minutos', () => {
    let state = { failedLoginCount: 0, failedLoginSince: null as Date | null };
    let result = registerLoginFailure(state, t0);
    for (let i = 1; i < 5; i++) {
      state = result;
      result = registerLoginFailure(state, after(i * 60));
    }
    expect(result.lockUntil?.toISOString()).toBe(after(4 * 60 + 15 * 60).toISOString());
  });

  it('reinicia la cuenta si pasaron más de 15 minutos', () => {
    const r = registerLoginFailure({ failedLoginCount: 4, failedLoginSince: t0 }, after(16 * 60));
    expect(r).toMatchObject({ failedLoginCount: 1, lockUntil: null });
  });
});

describe('Otros', () => {
  it('detecta menores de edad (RN-13)', () => {
    expect(isMinor(new Date('2009-05-01'), new Date('2026-10-25'))).toBe(true);
    expect(isMinor(new Date('2000-05-01'), new Date('2026-10-25'))).toBe(false);
  });
  it('enmascara el correo (SC-003 de 002)', () => {
    expect(maskEmail('diego@unsch.edu.pe')).toBe('d••••@u••••.edu.pe');
  });
});
