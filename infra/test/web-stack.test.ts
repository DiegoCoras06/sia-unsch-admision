import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PUBLIC_API_CACHE_PATHS, WebStack } from '../lib/web-stack.js';

let assets: string;

before(() => {
  assets = mkdtempSync(path.join(tmpdir(), 'sia-web-assets-'));
  writeFileSync(path.join(assets, 'index.html'), '<!doctype html><title>SIA</title>');
});

after(() => rmSync(assets, { recursive: true, force: true }));

const synth = () => {
  const app = new App();
  const stack = new WebStack(app, 'WebTest', {
    environmentName: 'demo',
    frontendAssetPath: assets,
    apiOriginDomainName: 'abc123.execute-api.us-east-2.amazonaws.com',
  });
  return Template.fromStack(stack);
};

describe('WebStack CloudFront', () => {
  it('mantiene S3 privado, cifrado y accesible únicamente mediante OAC', () => {
    const template = synth();
    template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [{ ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }],
      },
      OwnershipControls: { Rules: [{ ObjectOwnership: 'BucketOwnerEnforced' }] },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });

    const policies = template.findResources('AWS::S3::BucketPolicy');
    const serialized = JSON.stringify(policies);
    assert.match(serialized, /cloudfront\.amazonaws\.com/);
    assert.match(serialized, /AWS:SourceArn/);
    const policy = Object.values(policies)[0] as {
      Properties: { PolicyDocument: { Statement: { Effect: string; Principal: { AWS?: unknown } }[] } };
    };
    const publicAllows = policy.Properties.PolicyDocument.Statement.filter(
      (statement) => statement.Effect === 'Allow' && statement.Principal.AWS === '*',
    );
    assert.equal(publicAllows.length, 0);
  });

  it('separa el portal, la API privada y únicamente las lecturas públicas cacheables', () => {
    const template = synth();
    const resources = template.findResources('AWS::CloudFront::Distribution');
    const distribution = Object.values(resources)[0] as {
      Properties: {
        DistributionConfig: {
          CacheBehaviors: {
            PathPattern: string;
            AllowedMethods: string[];
            CachedMethods: string[];
            CachePolicyId: unknown;
          }[];
        };
      };
    };
    const behaviors = distribution.Properties.DistributionConfig.CacheBehaviors;
    const patterns = behaviors.map((behavior) => behavior.PathPattern);

    assert(patterns.includes('/api/*'));
    for (const publicPath of PUBLIC_API_CACHE_PATHS) assert(patterns.includes(publicPath));
    const publicApi = behaviors.find((behavior) => behavior.PathPattern === PUBLIC_API_CACHE_PATHS[0]);
    assert.deepEqual(publicApi?.AllowedMethods, ['GET', 'HEAD', 'OPTIONS']);
    assert.deepEqual(publicApi?.CachedMethods, ['GET', 'HEAD']);
    const privateApi = behaviors.find((behavior) => behavior.PathPattern === '/api/*');
    assert.deepEqual(privateApi?.AllowedMethods, ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'POST', 'DELETE']);
    assert.equal(privateApi?.CachePolicyId, '4135ea2d-6df8-44a3-9df3-4b5a84be39ad');
    assert.doesNotMatch(JSON.stringify(template.toJSON()), /CustomErrorResponses/);
  });

  it('fuerza HTTPS moderno, añade cabeceras y publica el build Angular', () => {
    const template = synth();
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
        Enabled: true,
        HttpVersion: 'http2and3',
        IPV6Enabled: true,
      },
    });
    template.resourceCountIs('AWS::CloudFront::ResponseHeadersPolicy', 1);
    template.resourceCountIs('AWS::CloudFront::Function', 1);
    template.resourceCountIs('Custom::CDKBucketDeployment', 1);

    const app = new App();
    const customDomain = new WebStack(app, 'CustomDomain', {
      environmentName: 'demo',
      frontendAssetPath: assets,
      domainName: 'admision.example.edu.pe',
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test',
      apiOriginDomainName: 'abc123.execute-api.us-east-2.amazonaws.com',
    });
    Template.fromStack(customDomain).hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['admision.example.edu.pe'],
        ViewerCertificate: {
          AcmCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test',
          MinimumProtocolVersion: 'TLSv1.2_2021',
          SslSupportMethod: 'sni-only',
        },
      },
    });
  });

  it('exige certificado de us-east-1 cuando se prepara un dominio propio', () => {
    const app = new App();
    assert.throws(
      () =>
        new WebStack(app, 'InvalidCertificate', {
          environmentName: 'demo',
          frontendAssetPath: assets,
          domainName: 'admision.example.edu.pe',
          certificateArn: 'arn:aws:acm:us-east-2:123456789012:certificate/test',
          apiOriginDomainName: 'abc123.execute-api.us-east-2.amazonaws.com',
        }),
      /us-east-1/,
    );
  });
});
