# Tareas: Programación del examen, aulas y asistencia

> **SDD (Spec-Driven Development) · artefacto 3 de 3: tareas** (pasos de implementación verificables).
> Anterior: [requirements.md](requirements.md) · [design.md](design.md).

**Spec:** [requirements.md](requirements.md) · **Plan:** [design.md](design.md) · `[P]` = paralelizable · `[Hn]` = historia de usuario

## Fase 1 — Base

- [x] T701 Esquema `examenes` (examen, sede, aula, aula por examen, asignación, cambios, incidencia, adecuación) y migración — `prisma/schema.prisma`
- [x] T702 [P] Algoritmo de distribución puro con pruebas unitarias (capacidad, duplicados, accesibles primero) — `examenes/domain/distribution.ts`
- [x] T703 [P] Reglas: ventanas de ingreso, cruces de horario, indicaciones por defecto — `examenes/domain/exam-rules.ts`
- [x] T704 Semilla: Ciudad Universitaria con pabellones y aulas; exámenes Exonerados y Ordinario desde el cronograma — `prisma/seed/`

## Fase 2 — Programación y sedes (H1, H2)

- [x] T710 [H1] Crear y editar exámenes con estructura, calificación e indicaciones; reprogramar con motivo y aviso — `application/exam-service.ts`
- [x] T711 [H2] Sedes, pabellones, pisos y aulas con capacidad, puerta y accesibilidad — idem
- [x] T712 [H1] Aulas habilitadas por examen sin cruces de horario (RF-07.07) — idem

## Fase 3 — Distribución y consulta (H3, H4)

- [x] T720 [H3] Relación de aptos, distribución, ocupación por aula, confirmación y regeneración con justificación — idem
- [x] T721 [H4] «Buscar aula» con DNI + código, límite de intentos y fecha de publicación — idem
- [x] T722 [H4] Ficha de examen en PDF con QR — `application/exam-pdf.ts`
- [x] T723 Adecuación por discapacidad con control de 72 h (RN-39) — `application/exam-service.ts`

## Fase 4 — Día del examen (H5, H6)

- [x] T730 [H5] Lista de asistencia PDF por aula con foto — `application/exam-pdf.ts`
- [x] T731 [H5] Ingreso por QR o código, fuera de hora, ausentes al cerrar — `application/attendance-service.ts`
- [x] T732 [H5] Incidencias con aviso a la Comisión (RN-60) — idem
- [x] T733 [H6] Cambio de aula individual con historial y correo — `application/exam-service.ts`

## Fase 5 — Interfaz y verificación

- [x] T740 Pruebas de integración — `tests/integration/exams.test.ts`
- [x] T741 «Buscar aula» en el portal y enlace desde la constancia — `features/aula/`
- [x] T742 Panel: exámenes y distribución, sedes y aulas, asistencia — `features/admin/pages/`
- [x] T743 E2E: programar → distribuir → publicar → buscar aula → ficha → asistencia — `scripts/e2e-examen.mjs`

## Próxima iteración

- [x] T750 Lista de asistencia sin conexión con sincronización posterior (caso límite de la spec)

## Tareas agregadas (27 y 28/10/2026)

- [x] T751 Temario por curso en la estructura del examen (RF-07.03)
- [x] T752 Ficha de examen tipo boleto en «Buscar aula» (skill interface-design)
- [x] T753 Portal instalable y boleto guardado por el postulante para verlo sin internet (ADR-023)
