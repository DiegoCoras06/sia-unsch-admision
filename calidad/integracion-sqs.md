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

Intento del 26/11/2026: **no ejecutado contra AWS** porque la cadena de credenciales no encontró un perfil o rol. No se presenta como prueba aprobada y no se modificó ningún recurso.

## Pendiente para Sprint 3

1. Ejecutar `npm run sqs:check` con credenciales temporales de solo lectura.
2. Crear SecureString bajo `/sia-unsch/demo`: `DATABASE_URL`, `JWT_SECRET`, `IDENTITY_TOKEN_SECRET` y `HMAC_SECRET`.
3. Aplicar la migración `20261126210000_outbox_sqs_delivery_confirmed` mediante el flujo controlado de RDS.
4. Desplegar el worker y su event source mapping; no crear las colas nuevamente.
5. Probar éxito y duplicado con evento sintético `@example.com` y `EMAIL_PROVIDER=console`.
6. Forzar un fallo sintético, observar cinco recepciones y comprobar la DLQ real; limpiar únicamente esos datos de prueba.
7. Guardar IDs, timestamps y métricas de CloudWatch sin secretos ni datos personales.

## Comandos reproducibles

```powershell
npm run sqs:check
npm run typecheck -w @sia/backend
npm run test -w @sia/backend -- --runInBand tests/unit/event-queue.test.ts tests/unit/sqs-batch.test.ts tests/unit/aws-parameters.test.ts
npm run test -w @sia/backend -- --runInBand tests/integration/event-queue.test.ts tests/integration/reliability.test.ts
npm run test -w @sia/infra
npm run synth -w @sia/infra
```
