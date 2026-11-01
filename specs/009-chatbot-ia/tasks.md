# Tareas: Asistente virtual de admisión

> **SDD (Spec-Driven Development) · artefacto 3 de 3: tareas** (pasos de implementación verificables).
> Anterior: [requirements.md](requirements.md) · [design.md](design.md).

**Entrada:** [design.md](design.md), [requirements.md](requirements.md), ADR-017
**Formato:** `- [ ] T### [P] [H#] Descripción — ruta`

## Fase 1 — Base

- [x] T401 Esquema `asistente` y semilla de la base de conocimientos con fuentes — `prisma/schema.prisma`, `prisma/seed/knowledge.ts`
- [x] T402 [P] Variables `OPENROUTER_*` y `CHAT_*` validadas — `shared/config/env.ts`
- [x] T403 [P] Enmascaramiento de DNI, celular y correo — `asistente/domain/assistant-rules.ts`

## Fase 2 — Historias 1 y 2: orientar y hacer seguimiento

- [x] T410 [P] [H1] Pruebas de integración con proveedor guionado — `tests/integration/assistant.test.ts`
- [x] T411 [H1] Herramientas sobre M01/M03/M05/M14 — `asistente/application/tools.ts`
- [x] T412 [H1] Proveedor OpenRouter (herramientas, uso y costo) y modo básico por reglas — `asistente/infrastructure/`
- [x] T413 [H2] Pase firmado con DNI + código y herramienta `estado_de_mi_proceso` — `asistente/application/`
- [x] T414 [H1] Rutas del asistente — `asistente/presentation/routes.ts`

## Fase 3 — Historias 3 y 5: derivar y controlar uso

- [x] T420 [H3] Derivación a un caso de atención con la conversación — M13
- [x] T421 [H5] Uso diario (consultas, tokens, costo, errores) y presupuesto; retención de conversaciones

## Fase 4 — Interfaz

- [x] T430 Panel del asistente en todas las páginas — `shared/assistant.ts`
- [x] T431 E2E del asistente por la interfaz — `scripts/e2e-asistente.mjs`

## Pendiente para la spec 008 (panel)

- [x] T440 [H4] Editar la base de conocimientos desde el panel administrativo (RF-10.12)
- [x] T441 [H5] Indicadores del asistente en el panel (RF-12.10)

## Tareas agregadas (27 y 28/10/2026)

- [x] T442 Asistente con expediente, aula y resultado (RF-10.06 a RF-10.08)
