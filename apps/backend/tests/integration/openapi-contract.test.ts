import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { FormatsPlugin } from 'ajv-formats';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { parse } from 'yaml';
import { testApp } from '../helpers.js';

type Json = Record<string, any>;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const addFormats = createRequire(import.meta.url)('ajv-formats') as FormatsPlugin;
const contract = parse(
  readFileSync(path.join(root, 'specs/001-portal-publico/contracts/openapi.yaml'), 'utf8'),
) as Json;
const t = testApp('2026-10-25T10:00:00-05:00');
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

afterAll(() => t.db.$disconnect());
beforeAll(() => t.db.rateLimitCounter.deleteMany({ where: { key: { startsWith: 'contact:' } } }));

const pointer = (ref: string): Json =>
  ref
    .slice(2)
    .split('/')
    .reduce((value: Json, key: string) => value[key.replaceAll('~1', '/').replaceAll('~0', '~')], contract);

function responseSchema(route: string, method: string, status: number) {
  const operation = contract.paths[route]?.[method];
  expect(operation).toBeDefined();
  let response = operation.responses?.[String(status)] ?? operation.responses?.default;
  if (response?.$ref) response = pointer(response.$ref);
  expect(response).toBeDefined();
  const schema = response.content?.['application/json']?.schema;
  expect(schema).toBeDefined();
  return schema;
}

function matchesContract(route: string, method: string, status: number, body: unknown) {
  const schema = responseSchema(route, method, status);
  const validate = ajv.compile({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    components: contract.components,
    response: schema,
    $ref: '#/response',
  });
  const valid = validate(body);
  if (!valid) throw new Error(`La respuesta no cumple OpenAPI:\n${JSON.stringify(validate.errors, null, 2)}`);
}

const reads = [
  ['/health', '/api/v1/health'],
  ['/calls/current', '/api/v1/calls/current'],
  ['/calls/{callCode}/areas', '/api/v1/calls/2027-I/areas'],
  ['/calls/{callCode}/quota-categories', '/api/v1/calls/2027-I/quota-categories'],
  ['/calls/{callCode}/submodalities', '/api/v1/calls/2027-I/submodalities'],
  ['/calls/{callCode}/options', '/api/v1/calls/2027-I/options'],
  ['/calls/{callCode}/options/{internalCode}', '/api/v1/calls/2027-I/options/P34'],
  ['/calls/{callCode}/fees', '/api/v1/calls/2027-I/fees'],
  ['/calls/{callCode}/fee-quote', '/api/v1/calls/2027-I/fee-quote?modality=ORD&schoolType=ESTATAL'],
  ['/calls/{callCode}/requirements', '/api/v1/calls/2027-I/requirements?submodality=EXO-DEP'],
  ['/calls/{callCode}/syllabus', '/api/v1/calls/2027-I/syllabus'],
  ['/calls/{callCode}/documents', '/api/v1/calls/2027-I/documents'],
  ['/calls/{callCode}/stats', '/api/v1/calls/2027-I/stats'],
  ['/announcements', '/api/v1/announcements'],
  ['/content/home', '/api/v1/content/home'],
] as const;

describe('T081 - respuestas reales contra contracts/openapi.yaml', () => {
  it.each(reads)('GET %s cumple estado, contenido y esquema', async (contractPath, url) => {
    const response = await t.request.get(url).expect(200).expect('Content-Type', /json/);
    expect(response.body.data).toBeDefined();
    matchesContract(contractPath, 'get', 200, response.body);
  });

  it('valida tambien respuestas de error documentadas', async () => {
    const response = await t.request.get('/api/v1/calls/2027-I/options/abc').expect(400).expect('Content-Type', /json/);
    expect(response.body.error).toBeDefined();
    matchesContract('/calls/{callCode}/options', 'get', 400, response.body);
  });

  it('POST /support/contact cumple el contrato 201', async () => {
    const response = await t.request
      .post('/api/v1/support/contact')
      .send({ name: 'Contrato OpenAPI', email: 'contrato@example.com', message: 'Consulta contractual de prueba.' })
      .expect(201)
      .expect('Content-Type', /json/);
    expect(response.body.data).toBeDefined();
    matchesContract('/support/contact', 'post', 201, response.body);
  });
});
