import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WorkerStack } from '../lib/worker-stack.js';

let artifact: string;
before(() => {
  artifact = mkdtempSync(path.join(tmpdir(), 'sia-worker-'));
  writeFileSync(path.join(artifact, 'lambda-worker.js'), 'export const handler = async () => ({});');
});
after(() => rmSync(artifact, { recursive: true, force: true }));

const synth = () =>
  Template.fromStack(
    new WorkerStack(new App(), 'WorkerTest', {
      env: { account: '123456789012', region: 'us-east-2' },
      environmentName: 'demo',
      workerAssetPath: artifact,
      queueName: 'sia-unsch-events',
      deadLetterQueueName: 'sia-unsch-events-dlq',
      configParameterPrefix: '/sia-unsch/demo',
    }),
  );

describe('WorkerStack SQS', () => {
  it('importa las colas existentes y nunca crea otra cola', () => {
    const template = synth();
    template.resourceCountIs('AWS::SQS::Queue', 0);
    assert.match(JSON.stringify(template.toJSON()), /sia-unsch-events/);
    assert.match(JSON.stringify(template.toJSON()), /sia-unsch-events-dlq/);
  });

  it('activa fallos parciales, concurrencia controlada y timeout compatible con visibilidad 180 s', () => {
    const template = synth();
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Timeout: 30,
      MemorySize: 1024,
      ReservedConcurrentExecutions: 2,
      Environment: { Variables: { EMAIL_PROVIDER: 'console', DB_MAX_CONNECTIONS: '1' } },
    });
    template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      BatchSize: 10,
      FunctionResponseTypes: ['ReportBatchItemFailures'],
      ScalingConfig: { MaximumConcurrency: 2 },
    });
  });

  it('limita IAM a consumir la cola principal y leer el prefijo SSM', () => {
    const serialized = JSON.stringify(synth().findResources('AWS::IAM::Policy'));
    assert.match(serialized, /sqs:ReceiveMessage/);
    assert.match(serialized, /ssm:GetParametersByPath/);
    assert.doesNotMatch(serialized, /sqs:\*/);
    assert.doesNotMatch(serialized, /Resource":"\*"/);
    synth().hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: { Statement: [{ Action: 'sqs:SendMessage', Effect: 'Allow' }] },
    });
  });
});
