# ADR-004: Backend Node.js + Express + TypeScript con validación Zod

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** Constitución IV, ADR-009 (Lambda), equipo con experiencia en TypeScript

## Contexto

El backend debe ejecutarse en local y en AWS Lambda con el mismo código, usar el mismo lenguaje que el frontend y validar con rigor toda entrada.

## Decisión

- **Node.js 22 LTS + TypeScript en modo `strict`**.
- **Express** como framework HTTP, adaptado a Lambda con `@codegenie/serverless-express` (o equivalente vigente).
- **Zod** para validar cuerpo, parámetros y consulta, y para generar el contrato **OpenAPI** (`zod-to-openapi`).
- Paquete compartido `packages/contracts` con los esquemas Zod/DTO usados por backend y frontend.
- Un único *bundle* (esbuild) con dos puntos de entrada: `lambda-api.ts` y `lambda-worker.ts`; en local, `server.ts`.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| NestJS | Módulos e inyección incorporados | Más pesado en arranque en frío; impone su propia estructura sobre Clean Architecture | Se prefiere control explícito |
| Fastify | Más rápido | Menor familiaridad del equipo | Diferencia de rendimiento irrelevante con Lambda |
| Una Lambda por endpoint | Escalado fino | Decenas de funciones; contradice ADR-001 | Sobrecarga operativa |

## Consecuencias

**Positivas:**
- Mismo código en local y en la nube.
- Contratos de API generados de la misma fuente que valida.

**Negativas / riesgos aceptados:**
- Arranque en frío de Lambda con un *bundle* único (~1 s) → mitigado con *bundle* minimizado y, si hace falta en días pico, concurrencia aprovisionada temporal.

**Cómo verificamos que se cumple:**
- Prueba de contrato: cada ruta tiene esquema y aparece en el OpenAPI generado.
