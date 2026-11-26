import { describe, expect, it } from '@jest/globals';
import { loadAwsParameters } from '../../src/shared/config/aws-parameters.js';

describe('Configuración segura del worker en SSM', () => {
  it('pagina, descifra y acepta únicamente nombres permitidos', async () => {
    const client = {
      send: async (command: { input: { NextToken?: string } }) =>
        command.input.NextToken
          ? { Parameters: [{ Name: '/sia-unsch/demo/JWT_SECRET', Value: 'jwt-secreto' }] }
          : {
              Parameters: [
                { Name: '/sia-unsch/demo/DATABASE_URL', Value: 'postgresql://privado' },
                { Name: '/sia-unsch/demo/NO_PERMITIDO', Value: 'ignorado' },
              ],
              NextToken: 'page-2',
            },
    };
    await expect(loadAwsParameters('/sia-unsch/demo', 'us-east-2', client as never)).resolves.toEqual({
      DATABASE_URL: 'postgresql://privado',
      JWT_SECRET: 'jwt-secreto',
    });
  });

  it('rechaza un prefijo ambiguo', async () => {
    await expect(loadAwsParameters('sin-barra', 'us-east-2', {} as never)).rejects.toThrow('CONFIG_PARAMETER_PREFIX');
  });
});
