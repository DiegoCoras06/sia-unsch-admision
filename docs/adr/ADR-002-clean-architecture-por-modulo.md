# ADR-002: Clean Architecture dentro de cada módulo y fronteras verificadas automáticamente

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** Constitución III.2–III.3, RNF-07, facilidad de prueba de las reglas RN

## Contexto

Las reglas del Reglamento (orden de mérito, empates, mínimo de 450, tasas y recargos, vacantes que pasan a ordinario) son el corazón del sistema y deben probarse sin base de datos ni HTTP. Además, varias integraciones serán simuladas al inicio y reales después.

## Decisión

Cada módulo tendrá cuatro capas:

```text
modules/<modulo>/
├── domain/          entidades, objetos de valor, reglas, eventos, puertos (interfaces)
├── application/     casos de uso, DTO, orquestación de transacciones
├── infrastructure/  repositorios Prisma, adaptadores externos (implementan puertos)
├── presentation/    rutas Express, controladores, esquemas Zod
└── index.ts         API pública del módulo
```

- Las dependencias solo apuntan hacia `domain`.
- `domain` no importa Express, Prisma, el SDK de AWS ni ningún otro módulo.
- La composición (qué adaptador implementa cada puerto) se hace en `app.ts`.
- Las fronteras se verifican con **`eslint-plugin-boundaries`** (o `dependency-cruiser`) en el pipeline.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Controladores que llaman directamente a Prisma | Menos archivos | Reglas mezcladas con HTTP y SQL; difícil de probar | Incumple Constitución III.2 |
| Hexagonal completa con bus de comandos | Muy desacoplado | Ceremonia excesiva para el equipo | Sobrediseño |
| Capas solo por convención, sin verificación | Simple | Se erosionan con el tiempo | Riesgo alto en equipo de estudiantes |

## Consecuencias

**Positivas:**
- Las reglas RN se prueban con pruebas unitarias rápidas (Vitest).
- Cambiar una simulación por una integración real no toca el dominio.

**Negativas / riesgos aceptados:**
- Más archivos y mapeo entre entidades de dominio y modelos de Prisma.

**Cómo verificamos que se cumple:**
- El pipeline falla si `domain/` importa algo prohibido o si un módulo importa archivos internos de otro.
