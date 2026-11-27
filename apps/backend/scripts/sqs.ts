import { GetQueueAttributesCommand, GetQueueUrlCommand, SQSClient, type QueueAttributeName } from '@aws-sdk/client-sqs';

const region = process.env['SQS_REGION'] ?? 'us-east-2';
const queueName = process.env['SQS_QUEUE_NAME'] ?? 'sia-unsch-events';
const dlqName = process.env['SQS_DLQ_NAME'] ?? 'sia-unsch-events-dlq';
const client = new SQSClient({ region });

interface QueueAttributes {
  QueueArn?: string;
  VisibilityTimeout?: string;
  RedrivePolicy?: string;
  SqsManagedSseEnabled?: string;
}

function awsErrorCode(error: unknown): string {
  if (error && typeof error === 'object') {
    const candidate = error as { name?: string; Code?: string };
    return candidate.Code ?? candidate.name ?? 'AWS_ERROR';
  }
  return 'AWS_ERROR';
}

async function queueUrl(name: string): Promise<string> {
  const response = await client.send(new GetQueueUrlCommand({ QueueName: name }));
  if (!response.QueueUrl) throw new Error(`AWS no devolvió URL para ${name}`);
  return response.QueueUrl;
}

async function attributes(url: string): Promise<QueueAttributes> {
  const response = await client.send(
    new GetQueueAttributesCommand({
      QueueUrl: url,
      AttributeNames: [
        'QueueArn',
        'VisibilityTimeout',
        'RedrivePolicy',
        'SqsManagedSseEnabled',
      ] as QueueAttributeName[],
    }),
  );
  return response.Attributes ?? {};
}

if (process.argv[2] !== 'check') throw new Error('Uso: npm run sqs:check');

let main: QueueAttributes = {};
let dead: QueueAttributes = {};
let mainError: string | null = null;
let dlqError: string | null = null;

try {
  const mainUrl = process.env['SQS_QUEUE_URL'] ?? (await queueUrl(queueName));
  main = await attributes(mainUrl);
  const deadUrl = process.env['SQS_DLQ_URL'] ?? mainUrl.replace(/[^/]+$/, dlqName);
  try {
    dead = await attributes(deadUrl);
  } catch (error) {
    dlqError = awsErrorCode(error);
  }
} catch (error) {
  mainError = awsErrorCode(error);
}

const redrive = JSON.parse(main.RedrivePolicy ?? '{}') as { deadLetterTargetArn?: string; maxReceiveCount?: string };
const checks = {
  region,
  mainQueueAccessible: Boolean(main.QueueArn),
  deadLetterQueueAccessible: Boolean(dead.QueueArn),
  visibilityTimeoutSeconds: Number(main.VisibilityTimeout || 0),
  maxReceiveCount: Number(redrive.maxReceiveCount || 0),
  deadLetterTargetConfigured: redrive.deadLetterTargetArn?.endsWith(`:${dlqName}`) ?? false,
  mainQueueSseSqsEnabled: main.SqsManagedSseEnabled === 'true',
  deadLetterQueueSseSqsEnabled: dead.SqsManagedSseEnabled === 'true',
  errors: { main: mainError, dlq: dlqError },
};
console.log(JSON.stringify(checks, null, 2));

if (
  !checks.mainQueueAccessible ||
  !checks.deadLetterQueueAccessible ||
  checks.visibilityTimeoutSeconds !== 180 ||
  checks.maxReceiveCount !== 5 ||
  !checks.deadLetterTargetConfigured ||
  !checks.mainQueueSseSqsEnabled ||
  !checks.deadLetterQueueSseSqsEnabled
) {
  process.exitCode = 1;
}
