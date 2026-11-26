# Infraestructura web con AWS CDK

Preparación local de la pila `Web` definida por ADR-009. Esta carpeta **no despliega recursos** durante Sprint 2.

## Recursos sintetizados

- bucket S3 privado, cifrado, sin ACL y con bloqueo público completo;
- Origin Access Control (OAC) con acceso de solo lectura desde CloudFront;
- distribución CloudFront con HTTPS obligatorio, HTTP/2 y HTTP/3;
- portal Angular como origen predeterminado;
- `/api/*` hacia API Gateway, sin caché por defecto y con todos los métodos REST;
- caché únicamente para las rutas públicas aprobadas en ADR-020, respetando `Cache-Control` y `s-maxage` del backend;
- cabeceras de seguridad e invalidación después de publicar Angular;
- reescritura de rutas de la SPA mediante CloudFront Function, excluyendo `/api/*`.

El dominio de API Gateway se recibe como parámetro de CloudFormation para no duplicar la futura pila `Api`:

```text
ApiOriginDomainName=abc123.execute-api.us-east-2.amazonaws.com
```

## Validación local sin AWS

```powershell
npm run infra:typecheck
npm run infra:test
npm run infra:synth
```

`infra:synth` compila Angular y genera `infra/cdk.out/`; no ejecuta `cdk deploy` ni usa credenciales para crear recursos.

## HTTPS y dominio

Sin configuración adicional, CloudFront usa HTTPS con su dominio y certificado administrado `*.cloudfront.net`. AWS
fija la política TLS de ese certificado y no permite modificarla desde la distribución. Para exigir TLS 1.2 (política
`TLSv1.2_2021`) con un dominio propio, el Sprint 3 debe crear o validar un certificado ACM en `us-east-1` y sintetizar
con ambos contextos:

```powershell
npm run synth -w @sia/infra -- -c domainName=admision.example.edu.pe -c certificateArn=arn:aws:acm:us-east-1:CUENTA:certificate/ID
```

La creación del registro DNS, API Gateway, Lambda, RDS y demás pilas permanece pendiente para Sprint 3.
