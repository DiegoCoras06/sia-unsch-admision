# Amazon SQS — guía de preparación y despliegue

La integración está preparada, pero **no se despliega en el Sprint 2**. Las colas `sia-unsch-events` y `sia-unsch-events-dlq` ya existen en `us-east-2`; CDK las importa y nunca crea otras.

## Variables del backend

| Variable                  | Uso                                        | Valor preparado                         |
| ------------------------- | ------------------------------------------ | --------------------------------------- |
| `SQS_QUEUE_URL`           | URL de la cola principal                   | La resuelve CDK desde la cola importada |
| `SQS_REGION`              | Región del SDK                             | `us-east-2`                             |
| `CONFIG_PARAMETER_PREFIX` | Prefijo de configuración segura del worker | `/sia-unsch/demo`                       |
| `DB_MAX_CONNECTIONS`      | Conexiones por instancia Lambda            | `1`                                     |
| `DB_SSL_CA`               | CA para verificar TLS de RDS               | `/var/task/certs/global-bundle.pem`     |
| `EMAIL_PROVIDER`          | Evitar envíos reales en validación         | `console`                               |

El rol Lambda obtiene de SSM únicamente los nombres permitidos: `DATABASE_URL`, `JWT_SECRET`, `IDENTITY_TOKEN_SECRET`, `HMAC_SECRET` y secretos opcionales ya reconocidos por el backend. No se guardan credenciales AWS ni secretos de aplicación en GitHub.

## IAM de mínimo privilegio

- Worker: permisos de consumo generados por `SqsEventSource` solo sobre `sia-unsch-events`, lectura `ssm:GetParametersByPath` solo bajo el prefijo y logs básicos de Lambda.
- API: CDK prepara `EventsPublisherPolicy` con únicamente `sqs:SendMessage` sobre la cola principal. En Sprint 3 debe adjuntarse al rol de ejecución de la API.
- DLQ: el worker no recibe permisos para consumirla ni vaciarla automáticamente.
- Si los SecureString usan una clave KMS administrada por el cliente, se proporciona `configKmsKeyArn`; `kms:Decrypt` queda limitado a esa ARN.

## Preparación local

```powershell
npm run build -w @sia/backend
npm run test -w @sia/infra
npm run synth -w @sia/infra
npm run sqs:check
```

`sqs:check` es solo lectura. No publica, recibe ni elimina mensajes.

## Sprint 3

1. Crear los SecureString requeridos bajo `/sia-unsch/demo` usando una sesión administrativa temporal; no copiar valores al repositorio.
2. Ejecutar la migración pendiente de la outbox sobre RDS.
3. Sintetizar y revisar `SiaUnsch-demo-Worker`.
4. Adjuntar la política de publicación al rol de la API.
5. Desplegar exclusivamente con autorización expresa.
6. Validar primero con `EMAIL_PROVIDER=console` y direcciones `@example.com`.
7. Verificar un duplicado y un poison message hasta la DLQ; registrar evidencia de CloudWatch sin PII.

La configuración activa de SES y el redrive de DLQ solo se realizan después de aprobar esas pruebas.
