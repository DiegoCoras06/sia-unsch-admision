# ADR-013: Observabilidad con OpenTelemetry y Grafana Cloud, sin Amazon CloudWatch

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** RNF-12, guía maestra §11.12, decisión del equipo del 25/10/2026: **no usar Amazon CloudWatch**

## Contexto

RNF-12 exige monitoreo, alertas y capacidad de diagnóstico. El equipo decidió no usar CloudWatch. Hay que tener en cuenta que, por defecto, AWS Lambda escribe sus registros en CloudWatch Logs si su rol tiene permiso para hacerlo, y que publica automáticamente métricas básicas (invocaciones, errores, duración).

## Decisión

### 1. Instrumentar la aplicación con OpenTelemetry (estándar abierto)

- **Trazas:** OpenTelemetry Node SDK con instrumentación de HTTP, Express, Prisma y llamadas salientes. Cada solicitud genera una traza con `requestId`, módulo y caso de uso.
- **Métricas propias:** solicitudes por ruta y código, latencia p50/p95/p99, inscripciones confirmadas, pagos por estado, eventos pendientes en la outbox, errores de integración.
- **Registros:** JSON estructurado con `pino`, correlacionado con la traza (`traceId`), enviado por OTLP.
- **Redacción obligatoria** antes de exportar: `dni`, `email`, `phone`, `password`, `token`, `authorization`, nombres. La telemetría nunca contiene datos personales (RNF-03).

### 2. Enviar todo a Grafana Cloud

- Exportación **OTLP/HTTP** a Grafana Cloud: **Loki** (registros), **Tempo** (trazas) y **Mimir/Prometheus** (métricas).
- En Lambda se usa la **extensión de recolector de OpenTelemetry** (capa de Lambda del proyecto `opentelemetry-lambda`), que envía los datos **después** de responder al usuario, sin añadir latencia a la solicitud.
- La salida a internet va por la instancia NAT existente (ADR-009).
- Clave de envío en SSM Parameter Store.

### 3. No escribir en CloudWatch

- El rol de las funciones Lambda se crea con una política propia que incluye **solo** los permisos de red de la VPC (interfaces de red), **sin** `logs:CreateLogGroup`, `logs:CreateLogStream` ni `logs:PutLogEvents`. Así Lambda no puede escribir en CloudWatch Logs.
- Las métricas básicas que AWS publica automáticamente para Lambda no se usan ni se consultan; no tienen costo en su nivel estándar.

### 4. Alertas y disponibilidad

| Alerta | Condición | Canal |
|---|---|---|
| Errores del servidor | Más del 2 % de respuestas 5xx en 5 minutos | Correo del equipo |
| Latencia | p95 > 3 s durante 10 minutos (RNF-05) | Correo |
| Outbox atascada | Más de 100 eventos pendientes o el más antiguo con más de 10 minutos | Correo |
| Integración caída | Más de 5 fallas seguidas de un proveedor | Correo |
| Disponibilidad | La comprobación sintética de `/api/v1/health` y de la página de inicio falla 2 veces seguidas | Correo |

La comprobación sintética la hace **Grafana Synthetic Monitoring** desde fuera de AWS cada 5 minutos.

### 5. Paneles

- **Técnico:** tráfico, errores, latencia por ruta, arranques en frío, conexiones a la base, outbox.
- **Del proceso (día pico):** inscripciones por hora, pagos confirmados, consultas de aula y de resultados.

### 6. Desarrollo local

Sin Docker (ADR-014): la exportación OTLP está **desactivada por defecto** y los registros se muestran en la consola con formato legible (`pino-pretty`), ya redactados. Si se define `OTEL_EXPORTER_OTLP_ENDPOINT`, la misma instrumentación envía a Grafana Cloud también desde local.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Amazon CloudWatch | Integrado, sin configuración | — | Excluido por decisión del equipo |
| Sentry | Excelente para errores y rendimiento | Registros y métricas limitados; sería una herramienta más | Puede añadirse después solo para errores del frontend |
| Datadog / New Relic | Muy completos | Costo alto después del periodo de prueba | Presupuesto |
| Grafana + Loki + Tempo propios en EC2 | Control total, datos dentro de AWS | Costo fijo de la instancia y mantenimiento | Más caro y laborioso que el plan gratuito administrado |
| Solo registros en PostgreSQL | Sin servicios externos | Sobrecarga la base en picos; no hay alertas ni trazas | No cumple RNF-12 |

## Consecuencias

**Positivas:**
- Se cumple la decisión de no usar CloudWatch.
- OpenTelemetry es un estándar: se puede cambiar de proveedor modificando solo el destino de exportación.
- Trazas de punta a punta, que facilitan el diagnóstico de los flujos de pago.
- El mismo entorno de observabilidad en local y en AWS.

**Negativas / riesgos aceptados:**
- **Si falla la extensión o Grafana Cloud no está disponible, se pierde telemetría**, porque no hay respaldo en CloudWatch. Mitigación: la auditoría de negocio y la outbox siguen en PostgreSQL.
- **Errores muy tempranos de Lambda** (por ejemplo, fallas al iniciar o tiempo de espera agotado antes de exportar) pueden no quedar registrados. Mitigación: la comprobación sintética y la alerta de 5xx los detectan desde fuera.
- La telemetría se almacena fuera del Perú y de AWS. Por eso la redacción de datos personales es obligatoria y se prueba.
- Los límites del plan gratuito de Grafana Cloud deben revisarse antes de desplegar; con la retención predeterminada son suficientes para la demostración.
- Dependencia de un proveedor externo adicional, con su clave de envío.

**Cómo verificamos que se cumple:**
- Prueba automática: un registro que contiene un DNI o un correo sale redactado.
- `cdk synth` revisado: ninguna política de Lambda incluye permisos `logs:*`.
- Ensayo previo a la presentación: se provoca un error 500 y se confirma que llega la alerta por correo.
