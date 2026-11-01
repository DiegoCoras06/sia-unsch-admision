# Plan de implementación: [NOMBRE]

**Rama:** `[NNN-nombre-corto]` · **Fecha:** [FECHA] · **Especificación:** [requirements.md](./requirements.md)

> **Cómo** se construye lo que pide `requirements.md`. Se genera solo cuando la especificación está **Aprobada** y sin marcas `[NEEDS CLARIFICATION]`.

## Resumen

[Requisito principal + enfoque técnico en 3–5 líneas]

## Contexto técnico

| Aspecto | Valor |
|---|---|
| Lenguaje / versión | TypeScript 5.x, Node.js 22 LTS |
| Dependencias principales | Angular, Express, Prisma, Zod |
| Almacenamiento | PostgreSQL 16 |
| Pruebas | Vitest, Supertest, Playwright |
| Plataforma objetivo | Navegador web (móvil primero) + API REST |
| Metas de rendimiento | [de los criterios de éxito] |
| Restricciones | [de la constitución] |

## Verificación de la constitución

*Debe pasar antes de la investigación (Fase 0) y revisarse tras el diseño (Fase 1).*

| Artículo | ¿Cumple? | Nota |
|---|---|---|
| I — Especificación primero | ☐ | |
| II — Fidelidad institucional (datos como configuración, mocks etiquetados) | ☐ | |
| III — Monolito modular, Clean Architecture | ☐ | |
| IV — Stack aprobado | ☐ | |
| V — Seguridad y privacidad | ☐ | |
| VI — UX móvil y accesible | ☐ | |
| VII — Definición de terminado | ☐ | |

## Estructura del proyecto

### Documentación de esta funcionalidad

```text
specs/[NNN-nombre]/
├── requirements.md          # Qué y por qué (/specify)
├── design.md          # Este archivo (/plan)
├── design.md      # Fase 0: decisiones e investigación
├── design.md    # Fase 1: entidades, atributos, estados
├── contracts/       # Fase 1: contratos OpenAPI
├── design.md    # Fase 1: cómo probar la funcionalidad de punta a punta
├── checklists/      # Listas de verificación de calidad
└── tasks.md         # Fase 2: tareas (/tasks)
```

### Código fuente afectado

```text
apps/backend/src/modules/[modulo]/{domain,application,infrastructure,presentation}
apps/frontend/src/app/features/[area]/
```

## Fase 0 — Investigación

[Decisiones abiertas → sección «Decisiones técnicas» de este `design.md`: Decisión · Justificación · Alternativas descartadas]

## Fase 1 — Diseño

[Secciones «Modelo de datos» y «Guía de validación» de este `design.md`, más `contracts/`]

## Seguimiento de complejidad

| Desviación de la constitución | Por qué es necesaria | Alternativa más simple descartada porque |
|---|---|---|
