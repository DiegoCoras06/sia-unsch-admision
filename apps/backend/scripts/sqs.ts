import { GetQueueAttributesCommand, GetQueueUrlCommand, SQSClient, type QueueAttributeName } from '@aws-sdk/client-sqs';

const region = process.env['SQS_REGION'] ?? 'us-east-2';
const queueName = process.env['SQS_QUEUE_NAME'] ?? 'sia-unsch-events';
const dlqName = process.env['SQS_DLQ_NAME'] ?? 'sia-unsch-events-dlq';
const client = new SQSClient({ region });

async function queueUrl(name: string): Promise<string> {
  const response = await client.send(new GetQueueUrlCommand({ QueueName: name }));
  if (!response.QueueUrl) throw new Error(`AWS no devolvió URL para ${name}`);
  return response.QueueUrl;
}

async function attributes(url: string) {
  return (
    (
      await client.send(
        new GetQueueAttributesCommand({
          QueueUrl: url,
          AttributeNames: [
            'QueueArn',
            'VisibilityTimeout',
            'RedrivePolicy',
            'SqsManagedSseEnabled',
          ] as QueueAttributeName[],
        }),
      )
    ).Attributes ?? {}
  );
}

if (process.argv[2] !== 'check') throw new Error('Uso: npm run sqs:check');

const [mainUrl, deadUrl] = await Promise.all([queueUrl(queueName), queueUrl(dlqName)]);
const [main, dead] = await Promise.all([attributes(mainUrl), attributes(deadUrl)]);
const redrive = JSON.parse(main.RedrivePolicy ?? '{}') as { deadLetterTargetArn?: string; maxReceiveCount?: string };
const checks = {
  region,
  mainQueueFound: Boolean(main.QueueArn),
  deadLetterQueueFound: Boolean(dead.QueueArn),
  visibilityTimeoutSeconds: Number(main.VisibilityTimeout),
  maxReceiveCount: Number(redrive.maxReceiveCount),
  deadLetterTargetMatches: redrive.deadLetterTargetArn === dead.QueueArn,
  sseSqsEnabled: main.SqsManagedSseEnabled === 'true' && dead.SqsManagedSseEnabled === 'true',
};
console.log(JSON.stringify(checks, null, 2));
if (
  !checks.mainQueueFound ||
  !checks.deadLetterQueueFound ||
  checks.visibilityTimeoutSeconds !== 180 ||
  checks.maxReceiveCount !== 5 ||
  !checks.deadLetterTargetMatches ||
  !checks.sseSqsEnabled
) {
  process.exitCode = 1;
}
