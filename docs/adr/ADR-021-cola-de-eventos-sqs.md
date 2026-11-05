# ADR-021: Cola de eventos con Amazon SQS detrás de la bandeja de eventos

**Estado:** Aceptado
**Fecha:** 03/11/2026
**Modifica:** [ADR-008](ADR-008-eventos-dominio-outbox.md) (la entrega pasa por una cola) y [ADR-012](ADR-012-tareas-programadas-asincronas.md) (el worker también recibe mensajes de SQS)
**Impulsores:** pedido del docente del 03/11/2026 («sistema de colas importante»), DA11 Confiabilidad, EQ-09, ADR-009 del sprint 1 (Amazon SQS)

## Contexto

La bandeja de eventos (Transactional Outbox, ADR-008) guarda cada evento en PostgreSQL en la misma transacción que el cambio de estado, y hoy el mismo proceso que atiende la petición lo entrega (o la tarea de cada minuto). En un pico, los correos y avisos que generan los eventos compiten con las peticiones de los postulantes, y no hay un servicio de colas con reintentos ni cola de errores.

## Decisión

Usaremos **Amazon SQS** como cola entre la bandeja de eventos y el worker, sin abandonar la bandeja:

1. `publish` sigue guardando el evento en PostgreSQL en la misma transacción: si SQS falla, el evento no se pierde.
2. Con `SQS_QUEUE_URL` definida, `dispatch` solo **envía el ID** del evento a la cola (`SqsEventQueue`) y marca `queued_at` con un UPDATE atómico (`FOR UPDATE SKIP LOCKED`), para que dos peticiones no envíen el mismo evento. La cola no transporta datos personales.
3. El **Lambda worker** recibe lotes de SQS y llama a `Outbox.processEvent(id)`, que reserva el evento (`claimed_at`, con vencimiento de 2 minutos si el proceso muere) antes de procesarlo: un mensaje repetido o dos procesadores a la vez no duplican correos. Los que fallan se informan con `batchItemFailures` y SQS los reintenta; tras varios intentos van a una **cola de errores (DLQ)**.
4. La tarea programada `outbox.dispatch` reenvía los eventos enviados hace más de 5 minutos y aún no procesados (mensaje perdido).
5. Sin `SQS_QUEUE_URL` (local y pruebas) todo funciona como antes: el mismo proceso entrega los eventos.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Solo la outbox en PostgreSQL (estado anterior) | Simple, sin servicio extra | Sin reintentos ni DLQ administrados; la entrega compite con las peticiones | No cumple el requisito de un sistema de colas |
| Publicar en SQS directamente, sin outbox | Menos código | Si SQS falla después de guardar el cambio, el evento se pierde (doble escritura) | Rompe la confiabilidad (EQ-09) |
| Amazon EventBridge como bus | Enrutamiento por reglas | Más complejo para un solo consumidor | SQS basta para un worker |
| Redis o RabbitMQ | Conocidos | Servidor que administrar y pagar | SQS es administrado y tiene uso gratuito de 1 millón de mensajes al mes |

## Consecuencias

**Positivas:**
- La entrega de correos y avisos se separa de las peticiones de los postulantes y escala aparte.
- Reintentos y cola de errores administrados por AWS, sin perder la garantía de la outbox.

**Negativas / riesgos aceptados:**
- Entrega «al menos una vez»: los suscriptores deben seguir siendo idempotentes (ya lo exigía ADR-008).
- Una columna nueva (`shared.outbox.queued_at`): hay que aplicar la migración en RDS (`npm run rds:migrate`).

**Cómo verificamos que se cumple:**
- `tests/integration/event-queue.test.ts`: envío sin procesar, sin reenvíos duplicados, procesamiento único ante mensajes repetidos, reintento tras un fallo, reenvío de eventos atascados y recuperación si SQS no responde.
- En AWS (Paso 11): cola estándar con DLQ, el Lambda worker suscrito con `ReportBatchItemFailures`, y alarma sobre los mensajes en la DLQ.
