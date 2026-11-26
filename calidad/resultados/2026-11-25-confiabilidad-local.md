# Evidencia de confiabilidad local — Sprint 2

Fecha: 25/11/2026

## Alcance

Esta validación cubre las tácticas de confiabilidad que se pueden comprobar antes del despliegue. No crea recursos
AWS ni toca la base RDS: Jest levanta una instancia PostgreSQL efímera y la elimina al terminar.

## Resultado

| Mecanismo | Implementación | Validación |
|---|---|---|
| Circuit breaker | Correo, identidad, pagos y OpenRouter; estados `CLOSED`, `OPEN` y `HALF_OPEN` | Apertura tras fallos, rechazo rápido y recuperación semiabierta |
| Dead-letter queue | Outbox persistente; 5 intentos, backoff exponencial, fecha de envío a DLQ y reintento manual auditado | Evento fallido llega a DLQ y vuelve a procesarse tras el reintento |
| Health checks | `/health/live`, `/health/ready`, `/health/dependencies` y compatibilidad con `/health` | Vida no depende de PostgreSQL; preparación sí verifica la base; dependencias no exponen secretos |
| Idempotencia | `Idempotency-Key` persistente en inscripción, sesión y cargo de pago | Una repetición devuelve la misma respuesta; una carga diferente con la misma clave devuelve conflicto |
| Métricas | `/health/metrics`: HTTP, proveedores, circuitos, idempotencia y outbox | Contadores y latencia acumulada visibles sin datos personales ni credenciales |
| Fallos automatizados | Jest unitario e integración con PostgreSQL temporal | 39 suites y 305 pruebas aprobadas; 0 fallidas |

## Cobertura

| Métrica | Resultado |
|---|---:|
| Líneas | 93,04 % (12 227/13 141) |
| Sentencias | 93,04 % (12 227/13 141) |
| Funciones | 90,13 % (758/841) |
| Ramas | 77,65 % (2906/3742) |

La carpeta nueva `src/shared/reliability` alcanza 93,49 % de líneas; el circuit breaker y las métricas alcanzan 100 %.

## Comandos reproducibles

```bash
npm test -w @sia/backend -- --runInBand
npm run test:coverage -w @sia/backend -- --runInBand
npm run lint
npm run typecheck
```

## Pendiente para el Sprint 3

Confirmar la retención de respaldos automáticos de RDS y ejecutar una restauración a una instancia temporal para medir
RTO y RPO. Esta prueba requiere infraestructura AWS y puede generar costo; no bloquea la validación local del Sprint 2.
