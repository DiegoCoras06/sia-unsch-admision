# Verificación del sprint 1 (02/11/2026)

Comparación entre lo comprometido en `docs/01` a `docs/04` y el código implementado hasta el Paso 10.2 de la hoja de ruta.

## Lo que se cumple

| Documento | Resultado |
|---|---|
| Actores (13) | ✅ 12 implementados; SMS opcional no implementado |
| Historias de usuario (24) | ✅ Todas |
| Requisitos funcionales (35) | ✅ Todos; del catálogo detallado de 143 RF, 136 completos y 7 parciales que dependen de AWS o de claves de producción |
| Restricciones (20) | ✅ 17; parciales RC05 (HTTPS) y RC16 (SMS); pendiente RC18 (despliegue) |
| Escenarios de calidad (15) | ✅ 6 con evidencia, 🟡 5 parciales, ⏳ 3 dependen del despliegue, 1 sin evidencia (prueba de carga) |

## Diferencias corregidas en la documentación

| Tema | Antes | Ahora |
|---|---|---|
| Caché | Redis (ElastiCache) | No se usa; previsto solo si la prueba de carga lo exige |
| Mensajería | Amazon SQS o EventBridge, sin definir | Bandeja de eventos (outbox) en PostgreSQL + Amazon SQS (código listo, ADR-021) |
| Módulos | 14 | 12: Inscripciones une Ordinaria y Exonerados; Exámenes une Sedes y Aulas |
| Monitoreo | Amazon CloudWatch | OpenTelemetry + Grafana Cloud |
| Secretos y conexiones | Secrets Manager y RDS Proxy | SSM Parameter Store y `connection_limit=1` |
| Patrones | Decorador y Fachada con archivos inexistentes | Adaptador, Fábrica, Inyección de dependencias, Fachada (`index.ts`) y Observador implementados |
| C4 Nivel 4 | Clases que no existían | Clases reales: `InscriptionService`, `PaymentService`, `PaymentGateway` y adaptadores |
| Decisiones | Archivo `07-Desiciones…` cortado en ADR-020 | `07-decisiones-arquitectonicas.md` completo, con estado por decisión |

## Pendientes

1. **Repositorios:** 29 de 30 servicios usan Prisma directamente; extraer `InscripcionRepository` y `PagoRepository` primero.
2. **Pruebas de calidad:** carga con 200 usuarios (EQ-01), accesibilidad automática con axe (EQ-13) y reglas de dependencia automáticas (EQ-15).
3. **Despliegue en AWS (Paso 11):** Lambda, API Gateway, CloudFront, respaldos, Grafana Cloud y URL pública para la IPN de pagos.
