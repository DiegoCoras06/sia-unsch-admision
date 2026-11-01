/** Reglas puras de cuentas (spec 002). Sin Express, Prisma ni criptografía de infraestructura. */

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Contraseñas muy comunes o triviales (lista corta embebida; research R-04 de 002). */
const COMMON = new Set([
  '1234567890', '0123456789', '9876543210', '1111111111', '0000000000', '1234512345', 'qwertyuiop', 'asdfghjkla',
  'contrasena', 'contraseña', 'contrasena1', 'password12', 'password123', 'passw0rd123', 'iloveyou12', 'admin12345',
  'administrador', 'unsch12345', 'huamanga123', 'ayacucho123', 'peru123456', 'teamo12345', 'abc1234567', 'qwerty1234',
  '1q2w3e4r5t', 'zxcvbnm123', 'princesa12', 'superman12', 'futbol1234', 'alianza123', 'universitario', 'admision2027',
]);

export interface PasswordContext {
  documentNumber?: string | undefined;
  email?: string | undefined;
}

/** Devuelve la lista de problemas; vacía si la contraseña es aceptable. */
export function passwordIssues(password: string, ctx: PasswordContext = {}): string[] {
  const issues: string[] = [];
  const lower = password.toLowerCase();
  if (password.length < 10) issues.push('Debe tener al menos 10 caracteres.');
  if (password.length > 128) issues.push('No puede superar los 128 caracteres.');
  if (COMMON.has(lower)) issues.push('Es una contraseña muy común.');
  if (/^(.)\1+$/.test(password)) issues.push('No puede ser un solo carácter repetido.');
  if (/^(0123456789|1234567890|9876543210)+/.test(password) || /^(abcdefghij|qwertyuiop)/.test(lower)) {
    issues.push('No puede ser una secuencia simple.');
  }
  if (ctx.documentNumber && password.includes(ctx.documentNumber)) issues.push('No puede contener tu número de documento.');
  const emailUser = ctx.email ? normalizeEmail(ctx.email).split('@')[0] : '';
  if (emailUser && emailUser.length >= 4 && lower.includes(emailUser)) issues.push('No puede contener tu correo.');
  return issues;
}

/** Dígito de control Luhn para el código de postulante (research R-09 de 002). */
export function luhnCheckDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

/** Secuencia de 7 dígitos + Luhn → 8 dígitos. El primero es 27000017. */
export function applicantCodeFromSequence(sequence: number): string {
  const base = String(sequence).padStart(7, '0');
  if (base.length !== 7) throw new Error('Secuencia de código de postulante agotada');
  return `${base}${luhnCheckDigit(base)}`;
}

export function isValidApplicantCode(code: string): boolean {
  return /^\d{8}$/.test(code) && luhnCheckDigit(code.slice(0, 7)) === Number(code[7]);
}

export function isMinor(birthDate: Date, now: Date): boolean {
  const eighteen = new Date(birthDate);
  eighteen.setUTCFullYear(eighteen.getUTCFullYear() + 18);
  return now.getTime() < eighteen.getTime();
}

/** Campos que el postulante NO puede editar (RN-20, FR-011). */
export const IDENTITY_FIELDS = ['documentType', 'documentNumber', 'firstNames', 'paternalSurname', 'maternalSurname', 'birthDate', 'applicantCode'];
export const EDITABLE_FIELDS = ['email', 'phone', 'ubigeo', 'addressLine', 'guardianName'];

/** Ventana del bloqueo por intentos fallidos (research R-08 de 002). */
export const LOGIN_POLICY = { maxFailures: 5, windowSeconds: 15 * 60, lockSeconds: 15 * 60 } as const;

export interface LoginFailureState {
  failedLoginCount: number;
  failedLoginSince: Date | null;
}

/** Calcula el nuevo estado tras un fallo; `lockUntil` indica bloqueo. */
export function registerLoginFailure(state: LoginFailureState, now: Date): LoginFailureState & { lockUntil: Date | null } {
  const windowExpired = !state.failedLoginSince || now.getTime() - state.failedLoginSince.getTime() > LOGIN_POLICY.windowSeconds * 1000;
  const count = windowExpired ? 1 : state.failedLoginCount + 1;
  if (count >= LOGIN_POLICY.maxFailures) {
    return { failedLoginCount: 0, failedLoginSince: null, lockUntil: new Date(now.getTime() + LOGIN_POLICY.lockSeconds * 1000) };
  }
  return { failedLoginCount: count, failedLoginSince: windowExpired ? now : state.failedLoginSince, lockUntil: null };
}
