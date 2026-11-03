# Registro de decisiones de arquitectura (ADR)

Cada ADR documenta **una** decisión significativa: el contexto, lo que se decidió, las alternativas descartadas y sus consecuencias. Un ADR aceptado no se edita; si la decisión cambia, se escribe uno nuevo que lo **reemplaza**.

**Estados:** Propuesto · Aceptado · Reemplazado por ADR-nnn · Descartado

| ADR | Decisión | Estado | Fecha |
|---|---|---|---|
| [001](ADR-001-monolito-modular.md) | Monolito modular con 14 módulos, no microservicios | Aceptado | 25/10/2026 |
| [002](ADR-002-clean-architecture-por-modulo.md) | Clean Architecture dentro de cada módulo y fronteras verificadas automáticamente | Aceptado | 25/10/2026 |
| [003](ADR-003-frontend-angular-spa.md) | Frontend Angular SPA única con carga diferida por área | Aceptado | 25/10/2026 |
| [004](ADR-004-backend-node-express-typescript.md) | Backend Node.js + Express + TypeScript con validación Zod | Aceptado | 25/10/2026 |
| [005](ADR-005-postgresql-prisma.md) | PostgreSQL con Prisma; un esquema por módulo | Aceptado | 25/10/2026 |
| [006](ADR-006-autenticacion-autorizacion.md) | JWT de acceso corto + refresh en cookie HttpOnly; RBAC + propietario; MFA TOTP para personal | Aceptado | 25/10/2026 |
| [007](ADR-007-puertos-adaptadores-integraciones.md) | Integraciones externas mediante puertos y adaptadores, con simulaciones etiquetadas | Aceptado | 25/10/2026 |
| [008](ADR-008-eventos-dominio-outbox.md) | Comunicación entre módulos: API pública síncrona + eventos de dominio con outbox | Aceptado | 25/10/2026 |
| [009](ADR-009-despliegue-aws-serverless.md) | Despliegue en AWS: CloudFront + S3, API Gateway + Lambda, RDS, NAT instance, CDK | Aceptado | 25/10/2026 |
| [010](ADR-010-documentos-s3-urls-prefirmadas.md) | Documentos en S3 privado con URLs prefirmadas de corta duración | Aceptado | 25/10/2026 |
| [011](ADR-011-configuracion-convocatoria-como-datos.md) | Reglas variables de la convocatoria como datos versionados, no como código | Aceptado | 25/10/2026 |
| [012](ADR-012-tareas-programadas-asincronas.md) | Tareas programadas y asíncronas con EventBridge Scheduler + Lambda worker | Aceptado | 25/10/2026 |
| [013](ADR-013-observabilidad.md) | Observabilidad con OpenTelemetry + Grafana Cloud, sin CloudWatch | Aceptado | 25/10/2026 |
| [014](ADR-014-entorno-local-sin-docker.md) | Entorno local sin Docker: PostgreSQL embebido, archivos y correo en disco | Aceptado | 25/10/2026 |
| [015](ADR-015-inscripcion-sin-cuenta.md) | Inscripción pública sin cuenta; seguimiento con DNI + código de postulante (enmienda: cuenta opcional) | Aceptado | 25/10/2026 |
| [016](ADR-016-pasarela-izipay.md) | Izipay como pasarela de pagos (sandbox para la demo) | Aceptado | 25/10/2026 |
| [017](ADR-017-asistente-ia-herramientas.md) | Asistente con OpenRouter que responde solo con herramientas internas | Aceptado | 26/10/2026 |
| [018](ADR-018-panel-acceso-personal.md) | Panel administrativo: acceso del personal con segundo factor y permisos por rol | Aceptado | 26/10/2026 |
| [019](ADR-019-yape-con-culqi.md) | Yape con Culqi junto al checkout de Izipay | Aceptado | 29/10/2026 |
| [020](ADR-020-picos-de-demanda-cache-cloudfront.md) | Picos de demanda con caché en CloudFront antes que Redis | Aceptado | 03/11/2026 |
| [021](ADR-021-cola-de-eventos-sqs.md) | Cola de eventos con Amazon SQS detrás de la bandeja de eventos | Aceptado | 03/11/2026 |

Plantilla: [`plantilla.md`](plantilla.md)
