# ADR-008: Comunicación entre módulos con API pública síncrona y eventos de dominio con outbox

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** ADR-001, RNF-07, RNF-09, spec 010

## Contexto

Cuando se confirma un pago deben ocurrir varias cosas: la inscripción pasa a Apta, se habilita la ficha y se envía un correo. Si Pagos llamara directamente a Inscripción y a Notificaciones, quedarían acoplados, y una falla del correo podría deshacer un pago válido.

## Decisión

Dos mecanismos:

1. **Consultas y órdenes síncronas** a través del `index.ts` del otro módulo cuando el resultado se necesita de inmediato (p. ej. Inscripción pide a Convocatorias la tasa vigente).
2. **Eventos de dominio** para reacciones, con el patrón **Transactional Outbox**:
   - El módulo guarda el evento en la tabla `shared.outbox` **en la misma transacción** que su cambio de estado.
   - El Lambda *worker* (ADR-012) lee eventos pendientes cada minuto y además se dispara al final de la petición cuando hay eventos nuevos.
   - Cada suscriptor registra el `eventId` procesado: entrega **al menos una vez** + suscriptores **idempotentes**.

Eventos iniciales: `CuentaCreada`, `InscripcionConfirmada`, `PagoConfirmado`, `PagoRechazado`, `ExpedienteObservado`, `ExpedienteAutorizado`, `DistribucionPublicada`, `ResultadosPublicados`, `AdmisionPerdida`.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Llamadas directas entre módulos | Simple | Acoplamiento y fallas encadenadas | Incumple RNF-07 |
| EventEmitter en memoria | Simple | En Lambda se pierde el evento si la ejecución termina o falla | No confiable |
| Amazon SQS / EventBridge como bus | Administrado | Costo y complejidad extra; aun así haría falta la outbox para no perder eventos | Se reevalúa si el volumen lo justifica |

## Consecuencias

**Positivas:**
- Ningún evento se pierde ni se publica sin que el cambio se haya guardado.
- Agregar un suscriptor no modifica al emisor.

**Negativas / riesgos aceptados:**
- Consistencia eventual: el correo llega segundos después, no en la misma petición.
- Mayor complejidad de depuración → cada evento lleva `correlationId`.

**Cómo verificamos que se cumple:**
- Prueba: si el suscriptor de correo falla, el pago sigue confirmado y el evento se reintenta.
- Prueba: procesar dos veces el mismo evento no duplica efectos.
