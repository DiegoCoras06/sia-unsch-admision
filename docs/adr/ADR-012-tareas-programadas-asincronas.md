# ADR-012: Tareas programadas y asíncronas con EventBridge Scheduler y un Lambda worker

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** ADR-008, specs 006 (publicar aulas 24 h antes), 007 (publicar resultados a la hora autorizada, perder admisión al vencer el plazo), 010 (recordatorios)

## Contexto

Varias acciones no las dispara un usuario sino el reloj o un evento: despachar la outbox, publicar distribución y resultados a una hora exacta, vencer órdenes de pago, aplicar la pérdida de admisión y enviar recordatorios.

## Decisión

- Un **Lambda worker** (mismo código del monolito, otro punto de entrada) con tareas registradas por nombre.
- **EventBridge Scheduler**:
  - Programación **cada minuto** → `outbox.dispatch` y `orders.expire`.
  - Programaciones **de una sola vez**, creadas por la API al programar una publicación (p. ej. `results.publish` el 22/11/2026 a la hora aprobada).
  - Programación **diaria** a las 07:00 de Lima → `reminders.send` y `admission.expireUnclaimed`.
- La apertura y el cierre de etapas **no** usa tareas: se calcula comparando la hora actual con el cronograma (ADR-011), así nunca hay desfase.
- Toda tarea es **idempotente** y registra su ejecución.
- En local, un proceso `npm run worker` con `node-cron` ejecuta las mismas tareas.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Cron dentro del Lambda de la API | Un solo Lambda | Lambda no corre en segundo plano | No funciona |
| SQS + consumidor | Bueno para alto volumen | Más piezas; la outbox ya garantiza entrega | Innecesario por ahora (se reevalúa) |
| Step Functions | Flujos complejos visuales | Excesivo para tareas simples | Sobrediseño |

## Consecuencias

**Positivas:**
- Publicaciones exactas sin intervención humana.
- Mismo comportamiento en local y en AWS.

**Negativas / riesgos aceptados:**
- Retraso de hasta 1 minuto en eventos de la outbox cuando no se dispara de inmediato.

**Cómo verificamos que se cumple:**
- Prueba con reloj simulado: los resultados no son visibles un segundo antes de la hora programada y sí un minuto después.
