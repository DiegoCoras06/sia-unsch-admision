import { GetParametersByPathCommand, SSMClient } from '@aws-sdk/client-ssm';

const ALLOWED_PARAMETER_NAMES = new Set([
  'DATABASE_URL',
  'JWT_SECRET',
  'IDENTITY_TOKEN_SECRET',
  'HMAC_SECRET',
  'STAFF_SECRET_KEY',
  'APIPERU_TOKEN',
  'CULQI_PUBLIC_KEY',
  'CULQI_SECRET_KEY',
  'OPENROUTER_API_KEY',
]);

interface ParameterClient {
  send(command: GetParametersByPathCommand): Promise<{
    Parameters?: { Name?: string; Value?: string }[];
    NextToken?: string;
  }>;
}

/** Lee secretos/configuración del prefijo SSM sin registrar sus valores. */
export async function loadAwsParameters(
  prefix: string,
  region: string,
  client: ParameterClient = new SSMClient({ region }),
): Promise<Record<string, string>> {
  if (!prefix.startsWith('/') || prefix.endsWith('/'))
    throw new Error('CONFIG_PARAMETER_PREFIX debe ser una ruta SSM sin / final');
  const values: Record<string, string> = {};
  let nextToken: string | undefined;
  do {
    const response = await client.send(
      new GetParametersByPathCommand({ Path: prefix, Recursive: false, WithDecryption: true, NextToken: nextToken }),
    );
    for (const parameter of response.Parameters ?? []) {
      const name = parameter.Name?.slice(prefix.length + 1);
      if (name && ALLOWED_PARAMETER_NAMES.has(name) && parameter.Value) values[name] = parameter.Value;
    }
    nextToken = response.NextToken;
  } while (nextToken);
  return values;
}
