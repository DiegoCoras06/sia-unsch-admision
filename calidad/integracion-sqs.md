# Validación de confiabilidad — Amazon SQS

Fecha de ejecución local: **26 de noviembre de 2026**. Región preparada: `us-east-2`.

## Alcance implementado

| Riesgo                         | Control                                                             | Evidencia automatizada                              |
| ------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------- |
| Pérdida entre PostgreSQL y SQS | Transactional Outbox; `queued_at` solo tras confirmación individual | integración `event-queue.test.ts`                   |
| Rechazo parcial de un lote     | resultado por ID y liberación selectiva de la reserva               | unit e integración de event queue                   |
| Entrega duplicada              | claim atómico + `processed_at`                                      | integración: mensaje repetido y carrera concurrente |
| Poison message                 | cinco intentos, DLQ lógica y fallo persistente para redrive SQS     | integración `reliability.test.ts`                   |
| Fallo parcial Lambda           | `batchItemFailures` con el `messageId` exacto                       | unit `sqs-batch.test.ts`                            |
| Secretos                       | lectura runtime de SSM y lista permitida                            | unit `aws-parameters.test.ts`                       |
| Sobrecarga de RDS              | concurrencia Lambda 2 y una conexión por instancia                  | prueba CDK `worker-stack.test.ts`                   |
| Envíos reales                  | transporte `console` por defecto                                    | plantilla CDK + `ConsoleEmailSender`                |

## Resultados obtenidos

- TypeScript backend e infraestructura: **aprobado**.
- Jest específico SQS/SSM: **3 suites, 6 pruebas unitarias aprobadas** y **2 suites, 10 pruebas de integración aprobadas**.
- Regresión completa del backend: **43 suites, 315 pruebas aprobadas**.
- CDK: **2 suites, 7 pruebas aprobadas**; incluye cero colas creadas y `ReportBatchItemFailures` activo.
- Bundle worker: **generado (14.8 MB)**; importación del handler: **aprobada**.
- `cdk synth`: **aprobado**, sin despliegue.

Son pruebas locales automatizadas con dobles controlados. No equivalen a una ejecución real en AWS.

## Comprobación AWS de solo lectura

`npm run sqs:check` consulta ambas colas sin enviar, recibir ni borrar mensajes. Comprueba visibilidad de 180 segundos, `maxReceiveCount=5`, destino DLQ y SSE-SQS.

Validación real del 26/11/2026 con el perfil `sia-unsch`:

- identidad autenticada en la cuenta esperada;
- cola principal accesible y cifrada con SSE-SQS;
- visibilidad real de **180 segundos**;
- redrive configurado hacia `sia-unsch-events-dlq` con **5 recepciones**;
- publicación sintética sin datos personales: **aceptada por SQS**;
- migración de Outbox aplicada en RDS con SSL verificado y columna `relay_claimed_at`: **confirmada**;
- DLQ accesible, cifrada con SSE-SQS y vinculada correctamente: **confirmada**;
- Lambda event source mapping: no verificable porque el usuario no tiene `lambda:ListEventSourceMappings`;
- limpieza del probe: **completada** tras verificar el `eventId` sintético `00000000-0000-4000-8000-000000000001`;
- estado final: cola principal y DLQ con **0 mensajes visibles y 0 en proceso**.

No se crearon colas, funciones ni otros recursos AWS.

## Pendiente para Sprint 3

1. Crear SecureString bajo `/sia-unsch/demo`: `DATABASE_URL`, `JWT_SECRET`, `IDENTITY_TOKEN_SECRET` y `HMAC_SECRET`.
2. Desplegar el worker y su event source mapping; no crear las colas nuevamente.
3. Probar éxito y duplicado con evento sintético `@example.com` y `EMAIL_PROVIDER=console`.
4. Forzar un fallo sintético, observar cinco recepciones y comprobar la DLQ real; limpiar únicamente esos datos de prueba.
5. Guardar IDs, timestamps y métricas de CloudWatch sin secretos ni datos personales.

## Comandos reproducibles

```powershell
npm run sqs:check
npm run rds:status
npm run typecheck -w @sia/backend
npm run test -w @sia/backend -- --runInBand tests/unit/event-queue.test.ts tests/unit/sqs-batch.test.ts tests/unit/aws-parameters.test.ts
npm run test -w @sia/backend -- --runInBand tests/integration/event-queue.test.ts tests/integration/reliability.test.ts
npm run test -w @sia/infra
npm run synth -w @sia/infra
```
