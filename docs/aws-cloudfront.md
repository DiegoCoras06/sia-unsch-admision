# Preparación de Amazon CloudFront con AWS CDK

**Estado al 26/11/2026:** infraestructura como código preparada y validada localmente; ningún recurso fue desplegado ni
aprovisionado. El despliegue pertenece exclusivamente al Sprint 3.

## 1. Decisión reutilizada

Se implementó AWS CDK v2 con TypeScript en `infra/`, tal como establece ADR-009. No se introdujo Terraform, SAM ni una
segunda tecnología de infraestructura. La primera pila es `WebStack`; las pilas `Network`, `Data` y `Api` continúan
pendientes para Sprint 3.

```text
Navegador
   │ HTTPS
   ▼
CloudFront
   ├── /*                 → S3 privado + OAC → Angular
   ├── /api/v1/...público → API Gateway      → caché dirigida por el backend
   └── /api/*             → API Gateway      → caché desactivada
```

La pila web recibe `ApiOriginDomainName` como parámetro de CloudFormation. De este modo puede sintetizarse y probarse
sin crear API Gateway ni duplicar la futura pila `Api`.

## 2. S3 y publicación de Angular

- bloqueo completo de acceso público;
- cifrado SSE-S3;
- propiedad de objetos `BucketOwnerEnforced`, sin ACL;
- acceso HTTPS obligatorio al bucket;
- OAC con firma SigV4 y permiso exclusivo `s3:GetObject` condicionado al ARN de la distribución;
- publicación desde `apps/frontend/dist/frontend/browser` e invalidación `/*` mediante `BucketDeployment`;
- eliminación automática solo porque ADR-009 exige que los entornos académicos `dev` y `demo` sean destruibles.

El bucket no utiliza website hosting público. CloudFront accede al endpoint regional de S3 por OAC.

## 3. Comportamientos de CloudFront

| Patrón                                                 | Métodos                | Caché               | Justificación                                      |
| ------------------------------------------------------ | ---------------------- | ------------------- | -------------------------------------------------- |
| comportamiento predeterminado                          | GET, HEAD              | 1 min; máximo 5 min | HTML y navegación Angular                          |
| recursos `*.js`, `*.css`, imágenes, documentos y datos | GET, HEAD              | 1 h; máximo 1 día   | archivos estáticos y versionados                   |
| `/api/v1/announcements`                                | GET, HEAD, OPTIONS     | origen, máximo 1 h  | `publicCache(300)`                                 |
| `/api/v1/content/home`                                 | GET, HEAD, OPTIONS     | origen, máximo 1 h  | `publicCache(300)`                                 |
| `/api/v1/site-assets` y descendientes                  | GET, HEAD, OPTIONS     | origen, máximo 1 h  | contenido público versionado                       |
| `/api/v1/calls/*`                                      | GET, HEAD, OPTIONS     | origen, máximo 1 h  | catálogo público; TTL de 60 a 3600 s               |
| `/api/v1/results/admitted`                             | GET, HEAD, OPTIONS     | origen, máximo 1 h  | lista pública sin DNI; TTL de 60 s                 |
| `/api/*` restante                                      | todos los métodos REST | desactivada         | protege cuentas, DNI, pagos, inscripciones y panel |

La política pública usa TTL mínimo y predeterminado cero. CloudFront solo conserva `GET` y `HEAD` cuando el backend
envía `Cache-Control: public` y `s-maxage`; `OPTIONS` se permite pero no se almacena. Por tanto, `private`, `no-store` y
`s-maxage=0` siguen desactivando la caché. Todas las cadenas de consulta forman parte de la clave para no mezclar
filtros, programas, modalidades o páginas.

## 4. HTTPS y seguridad

- redirección HTTP a HTTPS en todos los comportamientos;
- HTTP/2 y HTTP/3;
- cabeceras HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY` y `Referrer-Policy`;
- API Gateway recibe las cabeceras del visitante excepto `Host`, que debe corresponder al origen;
- CloudFront Function reescribe las rutas de Angular a `/index.html`, pero excluye `/api/*` para no convertir errores
  REST en HTML;
- no se definen respuestas de error globales 403/404, porque también afectarían a la API.

El dominio predeterminado `*.cloudfront.net` ya proporciona HTTPS, pero AWS fija la política TLS de su certificado. Para
exigir `TLSv1.2_2021` se preparó la asociación opcional de un dominio propio con certificado ACM de `us-east-1`, requisito
de CloudFront.

`PriceClass_100` mantiene el costo bajo del entorno académico. Antes de producción debe compararse con
`PriceClass_All`, porque esta última permite utilizar todas las ubicaciones de borde disponibles para usuarios de Perú.

## 5. Validación local

```powershell
npm run infra:typecheck
npm run infra:test
npm run infra:synth
```

Las pruebas de plantilla verifican que:

1. S3 permanece privado y cifrado;
2. existe un OAC y el permiso de CloudFront está limitado por `AWS:SourceArn`;
3. `/api/*` utiliza la política administrada `CachingDisabled`;
4. solo las rutas públicas de ADR-020 usan la política con TTL del origen;
5. no existen errores 403/404 globales que oculten respuestas REST;
6. HTTPS, cabeceras, reescritura SPA y publicación Angular están presentes;
7. un dominio propio exige un certificado ACM de `us-east-1` y TLS 1.2.

La síntesis genera CloudFormation en `infra/cdk.out/`, ignorado por Git. No ejecuta `cdk deploy`.

## 6. Pendiente exclusivo de Sprint 3

1. Preparar las pilas `Network`, `Data` y `Api`, y obtener el dominio real de API Gateway.
2. Confirmar presupuesto, cuenta, región y nombres definitivos.
3. Ejecutar `cdk bootstrap` en la cuenta autorizada.
4. Crear o validar el certificado ACM en `us-east-1` si se usará dominio propio.
5. Revisar `cdk diff`, políticas IAM y costos antes de aprobar el despliegue.
6. Desplegar pasando `ApiOriginDomainName` y, si corresponde, `apiOriginPath`.
7. Crear DNS en Route 53 o en el proveedor institucional.
8. Verificar que la URL directa de S3 sea rechazada y que CloudFront sirva Angular y `/api/*`.
9. Validar cabeceras, TTL, invalidaciones, health checks y observabilidad.
10. Repetir k6 contra CloudFront y adjuntar URL, capturas y resultados finales.

No se debe ejecutar ningún punto de esta sección durante Sprint 2.
