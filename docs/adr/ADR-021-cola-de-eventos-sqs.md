# ADR-021 — Transactional Outbox con Amazon SQS y Lambda Worker

- **Estado:** aceptada e implementada; despliegue pendiente del Sprint 3.
- **Región:** `us-east-2`.
- **Colas existentes:** `sia-unsch-events` y `sia-unsch-events-dlq` (Standard, SSE-SQS).

## Decisión

Los cambios críticos de inscripción y pago, y la creación de su evento, permanecen dentro de una única transacción PostgreSQL. La cola solo transporta `{ "eventId": "uuid" }`; correos, notificaciones y otros efectos secundarios se procesan después.

1. `Outbox.publish` inserta el evento usando el mismo cliente transaccional de la operación de negocio.
2. El relay reserva filas con `relay_claimed_at`, envía lotes de hasta 10 y asigna `queued_at` únicamente a IDs confirmados por SQS. Un fallo parcial libera solo los IDs rechazados.
3. SQS ofrece entrega al menos una vez. `Outbox.processEvent` reserva la fila y `processed_at` vuelve idempotentes los mensajes duplicados.
4. El Lambda Worker responde con `ReportBatchItemFailures`: solo se reintentan mensajes fallidos o mal formados.
5. Cada fallo registra error y retroceso exponencial. En el quinto fallo queda evidencia en la DLQ lógica PostgreSQL y el mensaje continúa fallando para que SQS lo mueva a `sia-unsch-events-dlq` tras cinco recepciones.
6. Sin `SQS_QUEUE_URL`, el modo local conserva el procesamiento dentro del proceso.

## Seguridad y operación

- No hay credenciales AWS en el repositorio; el SDK usa la cadena estándar de credenciales/rol IAM.
- El worker obtiene `DATABASE_URL`, JWT y demás secretos desde Parameter Store bajo `CONFIG_PARAMETER_PREFIX` y solo admite nombres explícitos.
- El rol puede consumir exclusivamente la cola principal y leer exclusivamente su prefijo SSM; `kms:Decrypt` es opcional y se limita a una clave configurada.
- `EMAIL_PROVIDER=console` es el valor inicial: registra destinatario enmascarado y no contacta usuarios reales.
- Timeout Lambda: 30 s; visibilidad SQS: 180 s; lote: 10; concurrencia máxima y reservada: 2; conexiones RDS por instancia: 1.
- La IaC importa las dos colas por nombre y sus pruebas exigen cero recursos `AWS::SQS::Queue`.

## Recuperación

En AWS, primero se corrige la causa, luego se restablece la fila PostgreSQL y finalmente se redirige el mensaje desde la DLQ SQS. La redirección no debe hacerse antes del reset porque la idempotencia lo volvería a rechazar.

## Consecuencias

La API no espera por correo ni reportes y un error de SQS no revierte una inscripción/pago confirmado. Existe consistencia eventual para efectos secundarios. CloudWatch, alarmas y la prueba activa de redrive se completarán al desplegar en Sprint 3.
