import type { IdentityLookupResult, IdentityProvider } from '../domain/ports.js';

/**
 * Consulta de DNI (RENIEC) con apiperu.dev (ADR-007, ADR-015):
 *   POST https://api.apiperu.dev/dni   { "dni": "12345678" }   con   Authorization: Bearer <token>
 *   200 → { success: true, code: "found", data: { nombres, apellido_paterno, apellido_materno, … } }
 *   404 → documento no encontrado · 503 → servicio no disponible (se puede reintentar)
 * Configuración: IDENTITY_PROVIDER=apiperu y APIPERU_TOKEN (solo en el servidor; APIPERU_URL es opcional).
 * Consultar DNI de terceros exige base legal (Ley N.° 29733): en el proyecto, solo el titular o con su autorización.
 */
export class ApiPeruIdentityProvider implements IdentityProvider {
  readonly simulated = false;
  readonly name = 'RENIEC' as const;

  constructor(private readonly token: string, private readonly url = 'https://api.apiperu.dev/dni', private readonly timeoutMs = 10_000) {}

  async lookupDni(dni: string): Promise<IdentityLookupResult> {
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (res.status === 404 || res.status === 422) return { kind: 'NOT_MATCHED' };
      if (!res.ok) return { kind: 'UNAVAILABLE' };
      const body = (await res.json()) as { success?: boolean; data?: Record<string, unknown> };
      const d = body.data ?? {};
      const text = (k: string) => (typeof d[k] === 'string' ? (d[k] as string).trim() : '');
      if (body.success === false || !text('nombres') || !text('apellido_paterno')) return { kind: 'NOT_MATCHED' };
      return { kind: 'MATCHED', firstNames: text('nombres'), paternalSurname: text('apellido_paterno'), maternalSurname: text('apellido_materno'), birthDate: '' };
    } catch {
      return { kind: 'UNAVAILABLE' };
    }
  }
}
