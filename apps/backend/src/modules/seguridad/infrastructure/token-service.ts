import { SignJWT, errors, jwtVerify } from 'jose';

export interface AccessClaims {
  sub: string;
  sid: string;
  typ: 'APPLICANT' | 'STAFF';
  roles: string[];
}

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/** JWT HS256 de acceso (15 min) y de identidad (10 min) con claves distintas (research R-01 y R-05 de 002). */
export class JoseTokenService {
  private readonly accessKey: Uint8Array;
  private readonly identityKey: Uint8Array;

  constructor(accessSecret: string, identitySecret: string, private readonly now: () => Date) {
    this.accessKey = new TextEncoder().encode(accessSecret);
    this.identityKey = new TextEncoder().encode(identitySecret);
  }

  signAccess(claims: AccessClaims): Promise<string> {
    const iat = Math.floor(this.now().getTime() / 1000);
    return new SignJWT({ sid: claims.sid, typ: claims.typ, roles: claims.roles })
      .setProtectedHeader({ alg: 'HS256', kid: 'access-v1' })
      .setSubject(claims.sub)
      .setIssuedAt(iat)
      .setExpirationTime(iat + ACCESS_TOKEN_TTL_SECONDS)
      .setIssuer('sia-unsch')
      .setAudience('sia-api')
      .sign(this.accessKey);
  }

  async verifyAccess(token: string): Promise<AccessClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.accessKey, { issuer: 'sia-unsch', audience: 'sia-api', currentDate: this.now() });
      return { sub: String(payload.sub), sid: String(payload['sid']), typ: payload['typ'] as AccessClaims['typ'], roles: (payload['roles'] as string[]) ?? [] };
    } catch {
      return null;
    }
  }

  signIdentity(payload: Record<string, unknown>, ttlSeconds = 600): Promise<string> {
    const iat = Math.floor(this.now().getTime() / 1000);
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', kid: 'identity-v1' })
      .setIssuedAt(iat)
      .setExpirationTime(iat + ttlSeconds)
      .setIssuer('sia-unsch')
      .setAudience('sia-registration')
      .sign(this.identityKey);
  }

  /** Devuelve null si el token es inválido; 'expired' si venció. */
  async verifyIdentity<T>(token: string): Promise<T | null | 'expired'> {
    try {
      const { payload } = await jwtVerify(token, this.identityKey, { issuer: 'sia-unsch', audience: 'sia-registration', currentDate: this.now() });
      return payload as T;
    } catch (error) {
      return error instanceof errors.JWTExpired ? 'expired' : null;
    }
  }
}
