import path from 'node:path';
import { CfnOutput, Duration, Stack, Tags, type StackProps } from 'aws-cdk-lib';
import { ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import type { Construct } from 'constructs';

export interface WorkerStackProps extends StackProps {
  readonly environmentName: string;
  readonly workerAssetPath: string;
  readonly queueName: string;
  readonly deadLetterQueueName: string;
  readonly configParameterPrefix: string;
  readonly kmsKeyArn?: string;
}

/** Worker SQS. Importa las colas existentes: esta pila nunca crea ni modifica una cola. */
export class WorkerStack extends Stack {
  readonly worker: Function;

  constructor(scope: Construct, id: string, props: WorkerStackProps) {
    super(scope, id, props);
    if (!props.configParameterPrefix.startsWith('/') || props.configParameterPrefix.endsWith('/')) {
      throw new Error('configParameterPrefix debe ser una ruta SSM sin / final.');
    }

    Tags.of(this).add('Project', 'sia-unsch-admision');
    Tags.of(this).add('Environment', props.environmentName);
    Tags.of(this).add('ManagedBy', 'aws-cdk');

    const queueArn = this.formatArn({ service: 'sqs', resource: props.queueName });
    const dlqArn = this.formatArn({ service: 'sqs', resource: props.deadLetterQueueName });
    const queue = Queue.fromQueueArn(this, 'ExistingEventsQueue', queueArn);
    const deadLetterQueue = Queue.fromQueueArn(this, 'ExistingEventsDlq', dlqArn);
    const publisherPolicy = new ManagedPolicy(this, 'EventsPublisherPolicy', {
      description: 'Adjuntar al rol de la API SIA-UNSCH para publicar IDs en la cola existente.',
      statements: [new PolicyStatement({ actions: ['sqs:SendMessage'], resources: [queueArn] })],
    });

    this.worker = new Function(this, 'EventsWorker', {
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      code: Code.fromAsset(props.workerAssetPath),
      handler: 'lambda-worker.handler',
      description: 'Procesa efectos secundarios de la outbox de SIA-UNSCH desde Amazon SQS.',
      timeout: Duration.seconds(30),
      memorySize: 1024,
      reservedConcurrentExecutions: 2,
      environment: {
        NODE_ENV: 'production',
        APP_ENV: props.environmentName,
        CONFIG_PARAMETER_PREFIX: props.configParameterPrefix,
        SQS_QUEUE_URL: queue.queueUrl,
        SQS_REGION: this.region,
        DB_MAX_CONNECTIONS: '1',
        DB_SSL_CA: '/var/task/certs/global-bundle.pem',
        APP_ASSETS_DIR: '/var/task/assets',
        EMAIL_PROVIDER: 'console',
        IDENTITY_PROVIDER: 'mock',
        PAYMENTS_PROVIDER: 'mock',
        FILE_STORAGE: 'local',
        LOG_LEVEL: 'info',
        FRONTEND_ORIGIN: 'https://placeholder.invalid',
      },
    });

    this.worker.addEventSource(
      new SqsEventSource(queue, {
        batchSize: 10,
        maxConcurrency: 2,
        reportBatchItemFailures: true,
      }),
    );
    this.worker.addToRolePolicy(
      new PolicyStatement({
        actions: ['ssm:GetParametersByPath'],
        resources: [this.formatArn({ service: 'ssm', resource: `parameter${props.configParameterPrefix}/*` })],
      }),
    );
    if (props.kmsKeyArn) {
      this.worker.addToRolePolicy(new PolicyStatement({ actions: ['kms:Decrypt'], resources: [props.kmsKeyArn] }));
    }

    new CfnOutput(this, 'ImportedQueueName', { value: queue.queueName });
    new CfnOutput(this, 'ImportedDeadLetterQueueName', { value: deadLetterQueue.queueName });
    new CfnOutput(this, 'WorkerFunctionName', { value: this.worker.functionName });
    new CfnOutput(this, 'PublisherPolicyArn', { value: publisherPolicy.managedPolicyArn });
    new CfnOutput(this, 'WorkerArtifact', { value: path.basename(props.workerAssetPath) });
  }
}
