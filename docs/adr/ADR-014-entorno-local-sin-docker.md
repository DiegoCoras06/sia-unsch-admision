# ADR-014: Entorno de desarrollo local sin Docker

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** decisión del equipo del 25/10/2026 ("no voy a usar Docker"); equipos con Windows sin virtualización

## Contexto

Los planes iniciales usaban Docker Compose para PostgreSQL, almacenamiento compatible con S3, correo y observabilidad. El equipo no usará Docker. El sistema debe poder ejecutarse y probarse en Windows solo con Node.js y npm.

## Decisión

| Necesidad | Solución local sin Docker | En AWS (`demo`) |
|---|---|---|
| PostgreSQL 16 | **`embedded-postgres`** (binarios oficiales de PostgreSQL 16.14 instalados por npm), datos en `apps/backend/.pgdata/`, puerto 5433. Scripts `npm run db:start` / `db:stop` | RDS PostgreSQL 16 |
| Base de datos de pruebas | Otra instancia embebida efímera en el puerto 5434, creada y destruida por Vitest | — |
| Archivos (S3) | `LocalFileStorage` en `apps/backend/.dev-storage/` (mismo puerto `FileStorage`) | S3 |
| Correo | `FileEmailSender`: cada correo se guarda como `.html` en `apps/backend/.dev-mail/` y se resume en la consola | SES |
| Observabilidad | Consola con `pino-pretty`; OTLP opcional | Grafana Cloud (ADR-013) |
| Ejecución | `npm run dev` levanta base de datos, API y web | CDK |

Las carpetas `.pgdata`, `.dev-storage` y `.dev-mail` se excluyen de Git.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Docker Compose | Estándar, idéntico para todos | El equipo no lo usará | Decisión del equipo |
| PostgreSQL instalado con el instalador de Windows | Real y estable | Instalación manual, servicio permanente, distinta en cada equipo | Menos reproducible |
| PGlite (PostgreSQL en WebAssembly) | Muy liviano | Una sola conexión y compatibilidad parcial con extensiones y Prisma | Menos fiel a RDS |
| SQLite en local | Simple | Distinto de PostgreSQL (esquemas, tipos, `citext`) | Rompe la paridad con producción |

## Consecuencias

**Positivas:**
- `npm install` y `npm run dev` bastan para ejecutar todo el sistema.
- Misma versión mayor de PostgreSQL que RDS.

**Negativas / riesgos aceptados:**
- `embedded-postgres` se publica con etiqueta *beta*; se fija una versión exacta y, si fallara, el plan B es el instalador oficial de PostgreSQL 16.
- El primer `npm install` descarga los binarios de PostgreSQL (~decenas de MB).

**Cómo verificamos que se cumple:**
- El README de inicio funciona en un equipo Windows limpio con solo Node.js instalado.
