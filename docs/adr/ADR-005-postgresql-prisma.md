# ADR-005: PostgreSQL con Prisma; un esquema por módulo

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** RNF-09 (integridad), RNF-10 (auditoría), ADR-001, ADR-009

## Contexto

Los datos son fuertemente relacionales (convocatoria → programa → vacante → inscripción → pago → asignación → resultado) y exigen transacciones, restricciones únicas (una inscripción por postulante y convocatoria, un evento de pago por `eventId`) y consultas de reporte.

## Decisión

- **PostgreSQL 16** (RDS en AWS; `embedded-postgres` en local y en pruebas, ADR-014).
- **Prisma** como ORM y herramienta de **migraciones** versionadas.
- **Un esquema de PostgreSQL por módulo** (`convocatorias`, `usuarios`, `pagos`, …) mediante el soporte multiesquema de Prisma; si no estuviera disponible en la versión usada, prefijo de tabla por módulo.
- Ningún módulo hace *joins* sobre tablas de otro; para reportes se crean **vistas** de solo lectura en el esquema `reportes`.
- Claves primarias **UUID** (evitan enumeración de IDs).
- Columnas comunes: `created_at`, `updated_at`, `version` (bloqueo optimista) en entidades editables.
- Restricciones en la base, no solo en el código: únicas, foráneas, `CHECK` de montos y capacidades.
- Tabla `audit_events` solo de inserción, con un rol de base de datos sin permisos de `UPDATE`/`DELETE`.
- En Lambda: `connection_limit=1` por instancia y concurrencia máxima reservada para no agotar conexiones de `db.t4g.micro`.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| DynamoDB | Serverless puro, sin conexiones | Modelo relacional complejo, reportes difíciles, transacciones limitadas | Mal ajuste al dominio |
| TypeORM / Sequelize | Maduros | Tipado menos estricto, migraciones menos confiables | Prisma ofrece mejor experiencia tipada |
| Una base de datos por módulo | Aislamiento total | Transacciones distribuidas | Contradice ADR-001 |
| RDS Proxy | Agrupa conexiones | Costo fijo adicional | Innecesario con la concurrencia esperada; se reevalúa tras pruebas de carga |

## Consecuencias

**Positivas:**
- Integridad garantizada por la base además del código.
- Migraciones reproducibles en todos los entornos.

**Negativas / riesgos aceptados:**
- Prisma en Lambda requiere empaquetar el motor de consultas para ARM64.
- Límite de conexiones de una instancia pequeña → se mide en la prueba de carga (RNF-04).

**Cómo verificamos que se cumple:**
- Prueba de integración: dos inscripciones simultáneas del mismo postulante → una falla por restricción única.
