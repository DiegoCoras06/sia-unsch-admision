# Tareas: Resultados e ingreso

> **SDD (Spec-Driven Development) · artefacto 3 de 3: tareas** (pasos de implementación verificables).
> Anterior: [requirements.md](requirements.md) · [design.md](design.md).

**Spec:** [requirements.md](requirements.md) · **Plan:** [design.md](design.md)

- [x] T801 Esquema `resultados` (lote, versión, resultado, ingreso) y migración
- [x] T802 [P] Cálculo de puntaje y condición: mínimo, vacantes, empates, sin derecho a vacante, traslado de exonerados — `resultados/domain/ranking.ts` con pruebas unitarias
- [x] T803 [P] Lector y validador del CSV de calificaciones — `resultados/domain/score-file.ts`
- [x] T810 [H1] Importar lote, listar inconsistencias, No calificable
- [x] T811 [H2] Procesar: versión borrador con orden de mérito y condición
- [x] T812 [H3] Enviar a aprobación, aprobar con fecha y hora, rectificar con motivo (versiones)
- [x] T813 [H4] Consulta con DNI + código y lista pública de admitidos sin DNI
- [x] T814 [H5] Entrega de documentos y constancia de ingreso con QR; Admisión perdida al vencer el plazo
- [x] T815 [H6] Excel de resultados y de cobertura de vacantes
- [x] T816 [H7] Solicitud de revisión por error material como caso de atención
- [x] T820 Pruebas de integración — `tests/integration/results.test.ts`
- [x] T821 «Ver puntaje» en el portal y verificación de la constancia
- [x] T822 Panel: resultados (importar, procesar, aprobar, publicar, reportes) e ingreso
- [x] T823 E2E — `scripts/e2e-resultados.mjs`

## Tareas agregadas (27 y 28/10/2026)

- [x] T824 El asistente informa el resultado publicado (RF-10.08)
- [x] T825 Resultado con la condición como foco y regla de puntaje (skill interface-design)
