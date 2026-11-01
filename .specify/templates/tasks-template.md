# Tareas: [NOMBRE]

**Entrada:** `requirements.md`, `design.md`, `contracts/`
**Formato:** `- [ ] T### [P] [H#] Descripción con ruta de archivo`
- `[P]` = puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- `[H#]` = historia de usuario a la que pertenece

> Las pruebas se escriben **antes** que la implementación y deben **fallar** primero.

## Fase 1 — Preparación

- [ ] T001 [Configuración inicial necesaria]

## Fase 2 — Base compartida (bloquea a todas las historias)

- [ ] T002 [Migración / entidad / puerto común]

## Fase 3 — Historia 1 (P1) 🎯 MVP

**Objetivo:** [qué entrega] · **Prueba independiente:** [cómo se demuestra]

### Pruebas

- [ ] T010 [P] [H1] Prueba de contrato en `apps/backend/tests/contract/...`
- [ ] T011 [P] [H1] Prueba E2E en `apps/frontend/e2e/...`

### Implementación

- [ ] T012 [H1] Entidad / regla de dominio en `.../domain/...`
- [ ] T013 [H1] Caso de uso en `.../application/use-cases/...`
- [ ] T014 [H1] Controlador y ruta en `.../presentation/...`
- [ ] T015 [H1] Pantalla en `apps/frontend/src/app/features/...`

**Punto de control:** la Historia 1 funciona y se demuestra sola.

## Fase 4 — Historia 2 (P2)

…

## Fase final — Pulido y transversales

- [ ] T0xx Auditoría, accesibilidad, documentación, `design.md` validado

## Dependencias y orden

- Fase 1 → Fase 2 → historias (en paralelo si hay equipo) → pulido
