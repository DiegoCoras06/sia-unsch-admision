import { Duration, CfnOutput, CfnParameter, RemovalPolicy, Stack, Tags, type StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  AccessLevel,
  AllowedMethods,
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CachePolicy,
  CacheQueryStringBehavior,
  CachedMethods,
  Distribution,
  Function as CloudFrontFunction,
  FunctionCode,
  FunctionEventType,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  HttpVersion,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  PriceClass,
  ResponseHeadersPolicy,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
  type BehaviorOptions,
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket, BucketEncryption, ObjectOwnership, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import type { Construct } from 'constructs';

export const PUBLIC_API_CACHE_PATHS = [
  '/api/v1/announcements',
  '/api/v1/content/home',
  '/api/v1/site-assets',
  '/api/v1/site-assets/*',
  '/api/v1/calls/*',
  '/api/v1/results/admitted',
] as const;

const STATIC_ASSET_PATHS = ['*.js', '*.css', '*.ico', '*.webmanifest', '/img/*', '/docs/*', '/data/*'] as const;

export interface WebStackProps extends StackProps {
  readonly environmentName: 'dev' | 'demo' | string;
  readonly frontendAssetPath: string;
  /** Host sin protocolo, por ejemplo abc123.execute-api.us-east-2.amazonaws.com. */
  readonly apiOriginDomainName?: string;
  /** Stage opcional de API Gateway, por ejemplo /demo. */
  readonly apiOriginPath?: string;
  /** Dominio propio opcional. Sin este valor se usa HTTPS de *.cloudfront.net. */
  readonly domainName?: string;
  /** Certificado ACM de us-east-1 requerido únicamente cuando se configura domainName. */
  readonly certificateArn?: string;
}

export class WebStack extends Stack {
  readonly webBucket: Bucket;
  readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    this.validateProps(props);
    Tags.of(this).add('Project', 'sia-unsch-admision');
    Tags.of(this).add('Environment', props.environmentName);
    Tags.of(this).add('ManagedBy', 'aws-cdk');

    this.webBucket = new Bucket(this, 'WebBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const securityHeaders = new ResponseHeadersPolicy(this, 'SecurityHeaders', {
      comment: 'Cabeceras defensivas comunes para Angular y la API (ADR-009).',
      securityHeadersBehavior: {
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365),
          includeSubdomains: true,
          preload: true,
          override: true,
        },
        xssProtection: { protection: false, override: true },
      },
    });

    const webShellCache = new CachePolicy(this, 'WebShellCache', {
      comment: 'HTML y navegación SPA con actualización rápida.',
      minTtl: Duration.seconds(0),
      defaultTtl: Duration.minutes(1),
      maxTtl: Duration.minutes(5),
      cookieBehavior: CacheCookieBehavior.none(),
      headerBehavior: CacheHeaderBehavior.none(),
      queryStringBehavior: CacheQueryStringBehavior.none(),
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
    });

    const staticAssetsCache = new CachePolicy(this, 'StaticAssetsCache', {
      comment: 'Recursos Angular versionados y documentos públicos.',
      minTtl: Duration.seconds(0),
      defaultTtl: Duration.hours(1),
      maxTtl: Duration.days(1),
      cookieBehavior: CacheCookieBehavior.none(),
      headerBehavior: CacheHeaderBehavior.none(),
      queryStringBehavior: CacheQueryStringBehavior.none(),
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
    });

    const publicApiCache = new CachePolicy(this, 'PublicApiCache', {
      comment: 'TTL dirigido por Cache-Control/s-maxage del backend; mínimo cero para respetar no-store.',
      minTtl: Duration.seconds(0),
      defaultTtl: Duration.seconds(0),
      maxTtl: Duration.hours(1),
      cookieBehavior: CacheCookieBehavior.none(),
      headerBehavior: CacheHeaderBehavior.none(),
      queryStringBehavior: CacheQueryStringBehavior.all(),
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
    });

    const spaRewrite = new CloudFrontFunction(this, 'SpaRewrite', {
      comment: 'Resuelve rutas de Angular sin convertir errores /api en index.html.',
      code: FunctionCode.fromInline(`function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.indexOf('/api/') === 0 || uri.indexOf('.') !== -1 || uri === '/') return request;
  request.uri = '/index.html';
  return request;
}`),
    });

    const apiOriginParameter = props.apiOriginDomainName
      ? undefined
      : new CfnParameter(this, 'ApiOriginDomainName', {
          type: 'String',
          description: 'Host de API Gateway sin https:// ni ruta de stage.',
          allowedPattern: '^[A-Za-z0-9.-]+$',
          constraintDescription: 'Usa solo el host, por ejemplo abc123.execute-api.us-east-2.amazonaws.com.',
        });
    const apiDomain = props.apiOriginDomainName ?? apiOriginParameter!.valueAsString;
    const apiOrigin = new HttpOrigin(apiDomain, {
      protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
      ...(props.apiOriginPath ? { originPath: props.apiOriginPath } : {}),
    });
    const s3Origin = S3BucketOrigin.withOriginAccessControl(this.webBucket, {
      originAccessLevels: [AccessLevel.READ],
    });

    const certificate =
      props.domainName && props.certificateArn
        ? Certificate.fromCertificateArn(this, 'WebCertificate', props.certificateArn)
        : undefined;

    this.distribution = new Distribution(this, 'Distribution', {
      comment: `SIA UNSCH ${props.environmentName}: Angular + API bajo el mismo origen`,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: s3Origin,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: CachedMethods.CACHE_GET_HEAD,
        cachePolicy: webShellCache,
        compress: true,
        responseHeadersPolicy: securityHeaders,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [{ function: spaRewrite, eventType: FunctionEventType.VIEWER_REQUEST }],
      },
      additionalBehaviors: {
        ...Object.fromEntries(
          STATIC_ASSET_PATHS.map((pathPattern) => [
            pathPattern,
            {
              origin: s3Origin,
              allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
              cachedMethods: CachedMethods.CACHE_GET_HEAD,
              cachePolicy: staticAssetsCache,
              compress: true,
              responseHeadersPolicy: securityHeaders,
              viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            } satisfies BehaviorOptions,
          ]),
        ),
        ...Object.fromEntries(
          PUBLIC_API_CACHE_PATHS.map((pathPattern) => [
            pathPattern,
            {
              origin: apiOrigin,
              allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
              cachedMethods: CachedMethods.CACHE_GET_HEAD,
              cachePolicy: publicApiCache,
              originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
              compress: true,
              responseHeadersPolicy: securityHeaders,
              viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            } satisfies BehaviorOptions,
          ]),
        ),
        '/api/*': {
          origin: apiOrigin,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          cachedMethods: CachedMethods.CACHE_GET_HEAD,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          compress: true,
          responseHeadersPolicy: securityHeaders,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      enableIpv6: true,
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_100,
      ...(certificate && props.domainName
        ? {
            certificate,
            domainNames: [props.domainName],
            minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
          }
        : {}),
    });

    new BucketDeployment(this, 'DeployAngular', {
      sources: [Source.asset(props.frontendAssetPath)],
      destinationBucket: this.webBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      prune: true,
    });

    new CfnOutput(this, 'WebBucketName', { value: this.webBucket.bucketName });
    new CfnOutput(this, 'DistributionId', { value: this.distribution.distributionId });
    new CfnOutput(this, 'DistributionDomainName', { value: this.distribution.distributionDomainName });
    new CfnOutput(this, 'PortalUrl', {
      value: props.domainName ? `https://${props.domainName}` : `https://${this.distribution.distributionDomainName}`,
    });
  }

  private validateProps(props: WebStackProps): void {
    if (Boolean(props.domainName) !== Boolean(props.certificateArn)) {
      throw new Error('domainName y certificateArn deben configurarse juntos.');
    }
    if (props.certificateArn && !props.certificateArn.includes(':us-east-1:')) {
      throw new Error('El certificado ACM de CloudFront debe pertenecer a us-east-1.');
    }
    if (props.apiOriginDomainName?.includes('://') || props.apiOriginDomainName?.includes('/')) {
      throw new Error('apiOriginDomainName debe ser un host sin protocolo ni ruta.');
    }
    if (props.apiOriginPath && !props.apiOriginPath.startsWith('/')) {
      throw new Error('apiOriginPath debe comenzar con /.');
    }
  }
}
