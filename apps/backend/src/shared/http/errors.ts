/**
 * Errores de aplicación. El dominio y los casos de uso lanzan estos errores;
 * el manejador HTTP los traduce al sobre `{ error }` (Constitución VIII).
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const validationError = (message: string, details: { field: string; issue: string }[] = []) =>
  new AppError(400, 'VALIDATION_ERROR', message, { details });
export const unauthorized = (code = 'UNAUTHENTICATED', message = 'Debes iniciar sesión.') => new AppError(401, code, message);
export const forbidden = (message = 'No tienes permiso para esta acción.') => new AppError(403, 'FORBIDDEN', message);
/** También se usa cuando un recurso existe pero no pertenece al usuario (ADR-006). */
export const notFound = (message = 'No encontrado.') => new AppError(404, 'NOT_FOUND', message);
export const conflict = (code: string, message: string, extra: Record<string, unknown> = {}) => new AppError(409, code, message, extra);
export const businessRule = (code: string, message: string, extra: Record<string, unknown> = {}) => new AppError(422, code, message, extra);
export const locked = (code: string, message: string, extra: Record<string, unknown> = {}) => new AppError(423, code, message, extra);
/** Un proveedor externo (pasarela, RENIEC) no respondió o respondió con error (ADR-007). */
export const gatewayUnavailable = (message: string) => new AppError(502, 'GATEWAY_UNAVAILABLE', message);
export const tooManyRequests = (retryAfterSeconds: number, message = 'Demasiados intentos. Espera un momento e inténtalo de nuevo.') =>
  new AppError(429, 'TOO_MANY_REQUESTS', message, { retryAfter: retryAfterSeconds });
