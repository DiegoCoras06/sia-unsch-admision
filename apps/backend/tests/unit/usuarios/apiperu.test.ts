import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ApiPeruIdentityProvider } from '../../../src/modules/usuarios/infrastructure/apiperu-identity-provider.js';

const fetchOriginal = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOriginal;
});
const reply = (status: number, body: unknown) =>
  jest.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe('RENIEC con apiperu.dev', () => {
  it('consulta POST /dni con el token y autocompleta nombres y apellidos', async () => {
    const fetchMock = reply(200, {
      success: true,
      code: 'found',
      data: {
        numero: '44556677',
        nombres: 'ROSA MARIA',
        apellido_paterno: 'QUISPE',
        apellido_materno: 'HUAMAN',
        codigo_verificacion: 3,
      },
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const r = await new ApiPeruIdentityProvider('token-de-prueba').lookupDni('44556677');
    expect(r).toEqual({
      kind: 'MATCHED',
      firstNames: 'ROSA MARIA',
      paternalSurname: 'QUISPE',
      maternalSurname: 'HUAMAN',
      birthDate: '',
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.apiperu.dev/dni');
    expect(init).toMatchObject({ method: 'POST', body: JSON.stringify({ dni: '44556677' }) });
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer token-de-prueba' });
  });

  it('DNI no encontrado → el postulante escribe sus nombres; servicio caído o token rechazado → no bloquea', async () => {
    globalThis.fetch = reply(404, {
      success: false,
      code: 'document_not_found',
      message: 'No encontrado',
    }) as unknown as typeof fetch;
    expect((await new ApiPeruIdentityProvider('t-12345678').lookupDni('12345678')).kind).toBe('NOT_MATCHED');
    globalThis.fetch = reply(503, {
      success: false,
      code: 'upstream_unavailable',
      retryable: true,
    }) as unknown as typeof fetch;
    expect((await new ApiPeruIdentityProvider('t-12345678').lookupDni('12345678')).kind).toBe('UNAVAILABLE');
    globalThis.fetch = reply(401, { message: 'Unauthenticated.' }) as unknown as typeof fetch;
    expect((await new ApiPeruIdentityProvider('t-12345678').lookupDni('12345678')).kind).toBe('UNAVAILABLE');
  });
});
