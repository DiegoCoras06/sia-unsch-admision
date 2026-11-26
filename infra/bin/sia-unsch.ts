#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { App } from 'aws-cdk-lib';
import { WebStack } from '../lib/web-stack.js';
import { WorkerStack } from '../lib/worker-stack.js';

const app = new App();
const environmentName = String(app.node.tryGetContext('environment') ?? 'demo');
const region = String(app.node.tryGetContext('region') ?? process.env['CDK_DEFAULT_REGION'] ?? 'us-east-2');
const frontendAssetPath = path.resolve(import.meta.dirname, '../../apps/frontend/dist/frontend/browser');
const workerAssetPath = path.resolve(import.meta.dirname, '../../apps/backend/dist/worker');

if (!['dev', 'demo'].includes(environmentName)) {
  throw new Error('El contexto environment debe ser dev o demo (ADR-009).');
}
if (!existsSync(path.join(frontendAssetPath, 'index.html'))) {
  throw new Error('Falta el build Angular. Ejecuta npm run build -w @sia/frontend antes de sintetizar CDK.');
}
if (!existsSync(path.join(workerAssetPath, 'lambda-worker.js'))) {
  throw new Error('Falta el build del worker. Ejecuta npm run build -w @sia/backend antes de sintetizar CDK.');
}

const domainName = app.node.tryGetContext('domainName') as string | undefined;
const certificateArn = app.node.tryGetContext('certificateArn') as string | undefined;
const apiOriginDomainName = app.node.tryGetContext('apiOriginDomainName') as string | undefined;
const apiOriginPath = app.node.tryGetContext('apiOriginPath') as string | undefined;

new WebStack(app, `SiaUnsch-${environmentName}-Web`, {
  env: {
    ...(process.env['CDK_DEFAULT_ACCOUNT'] ? { account: process.env['CDK_DEFAULT_ACCOUNT'] } : {}),
    region,
  },
  description: 'Portal Angular privado en S3, distribuido por CloudFront con API Gateway como segundo origen.',
  environmentName,
  frontendAssetPath,
  ...(apiOriginDomainName ? { apiOriginDomainName } : {}),
  ...(apiOriginPath ? { apiOriginPath } : {}),
  ...(domainName ? { domainName } : {}),
  ...(certificateArn ? { certificateArn } : {}),
});

new WorkerStack(app, `SiaUnsch-${environmentName}-Worker`, {
  env: {
    ...(process.env['CDK_DEFAULT_ACCOUNT'] ? { account: process.env['CDK_DEFAULT_ACCOUNT'] } : {}),
    region,
  },
  description: 'Lambda Worker de SIA-UNSCH; consume la cola SQS existente y usa configuración cifrada en SSM.',
  environmentName,
  workerAssetPath,
  queueName: String(app.node.tryGetContext('eventsQueueName') ?? 'sia-unsch-events'),
  deadLetterQueueName: String(app.node.tryGetContext('eventsDlqName') ?? 'sia-unsch-events-dlq'),
  configParameterPrefix: String(app.node.tryGetContext('configParameterPrefix') ?? `/sia-unsch/${environmentName}`),
  ...(app.node.tryGetContext('configKmsKeyArn')
    ? { kmsKeyArn: String(app.node.tryGetContext('configKmsKeyArn')) }
    : {}),
});
