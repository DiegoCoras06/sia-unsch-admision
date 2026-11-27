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
npm run rds:status
```

`sqs:check` es solo lectura. No publica, recibe ni elimina mensajes.

Para una validación completa, el perfil debe poder ejecutar `sqs:GetQueueAttributes` tanto en la cola principal como en la DLQ. El perfil de desarrollo no necesita permisos de consumo permanentes; la recepción y eliminación pertenecen al rol del Worker.

### Permisos pendientes del perfil local

La validación del 26/11/2026 confirmó `SendMessage` y lectura de la cola principal. Falta conceder temporalmente:

```json
{
  "Effect": "Allow",
  "Action": ["sqs:GetQueueAttributes"],
  "Resource": "arn:aws:sqs:us-east-2:601068118284:sia-unsch-events-dlq"
}
```

Para eliminar el probe documentado se requieren temporalmente `sqs:ReceiveMessage` y `sqs:DeleteMessage` sobre la cola principal. Después de limpiarlo, esos permisos deben retirarse del perfil productor; no se debe usar `PurgeQueue`.

## Sprint 3

1. Crear los SecureString requeridos bajo `/sia-unsch/demo` usando una sesión administrativa temporal; no copiar valores al repositorio.
2. Verificar con `npm run rds:status` la migración de la outbox, aplicada el 26/11/2026.
3. Sintetizar y revisar `SiaUnsch-demo-Worker`.
4. Adjuntar la política de publicación al rol de la API.
5. Desplegar exclusivamente con autorización expresa.
6. Validar primero con `EMAIL_PROVIDER=console` y direcciones `@example.com`.
7. Verificar un duplicado y un poison message hasta la DLQ; registrar evidencia de CloudWatch sin PII.

La configuración activa de SES y el redrive de DLQ solo se realizan después de aprobar esas pruebas.
