import type { RequestHandler } from 'express';
import { forbidden, unauthorized } from '../../../shared/http/errors.js';
import type { JoseTokenService } from '../infrastructure/token-service.js';

export interface Principal {
  userId: string;
  sessionId: string;
  type: 'APPLICANT' | 'STAFF';
  roles: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      principal?: Principal;
    }
  }
}

/** 401 si no hay token de acceso válido (plan 002: middlewares disponibles para 003–010). */
export function authenticate(tokens: JoseTokenService): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return next(unauthorized());
    tokens
      .verifyAccess(token)
      .then((claims) => {
        if (!claims) return next(unauthorized('TOKEN_INVALID', 'Tu sesión expiró. Vuelve a iniciar sesión.'));
        req.principal = { userId: claims.sub, sessionId: claims.sid, type: claims.typ, roles: claims.roles };
        next();
      })
      .catch(next);
  };
}

/** 403 si el usuario no tiene ninguno de los roles indicados. */
export function authorize(...roles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.principal) return next(unauthorized());
    if (!roles.some((r) => req.principal!.roles.includes(r))) return next(forbidden());
    next();
  };
}
