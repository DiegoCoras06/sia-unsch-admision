# Tareas: Exonerados y expediente digital (iteración 1)

> **SDD (Spec-Driven Development) · artefacto 3 de 3: tareas** (pasos de implementación verificables).
> Anterior: [requirements.md](requirements.md) · [design.md](design.md).

**Entrada:** [design.md](design.md), [requirements.md](requirements.md)
**Formato:** `- [ ] T### [P] [H#] Descripción — ruta`

## Fase 1 — Base

- [x] T601 Esquema `expedientes` (expediente, versiones de documento, historial) y migración — `prisma/schema.prisma`
- [x] T602 [P] Validación de archivos: firma real PDF/JPG/PNG, PDF íntegro y sin contraseña, 5 MB, SHA-256 — `expedientes/domain/file-check.ts`
- [x] T603 [P] Datos complementarios por submodalidad (FR-014) — `expedientes/domain/dossier-rules.ts`

## Fase 2 — Postulante (H1, H2, H4)

- [x] T610 [H1] Requisitos por submodalidad desde M01 — `expedientes/application/dossier-service.ts`
- [x] T611 [H2] Subir, reemplazar y descargar documentos con DNI + código — idem
- [x] T612 [H2] Enviar a revisión con faltantes y asignación equitativa — idem
- [x] T613 [H4] Subsanar solo lo observado dentro del plazo; «No subsanado» al vencer — idem

## Fase 3 — Evaluador (H3, H7, FR-015)

- [x] T620 [H3] Bandeja por evaluador, detalle, descarga auditada — `expedientes/application/dossier-service.ts`
- [x] T621 [H3] Conforme/Observado por documento; Autorizar/Observar/Rechazar con justificación — idem
- [x] T622 [H7] Verificación presencial y asignación manual; evaluación especial — idem
- [x] T623 Estado de la inscripción por evento y correo (RF-06.05); pago bloqueado hasta autorizar (RN-24) — `inscripciones/`, `pagos/`

## Fase 4 — Pruebas e interfaz

- [x] T630 Pruebas de integración del expediente — `tests/integration/dossier.test.ts`
- [x] T631 Expediente del postulante en «Imprimir documentos» y «Mi cuenta» — `features/expediente/`
- [x] T632 Bandeja del evaluador en el panel — `features/admin/pages/dossiers.ts`
- [x] T633 Expedientes por estado en el panel de indicadores (RF-12.04) — `reportes/`
- [x] T634 E2E: subir → enviar → revisar → autorizar → pagar (la subsanación se cubre en T630) — `scripts/e2e-expediente.mjs`

## Siguiente iteración

- [ ] T640 Adjudicados CEPRE: lista cargada por Admisión y ventana propia (Historia 6)

## Tareas agregadas (27 y 28/10/2026)

- [x] T641 Puerto `FileStorage` con adaptador S3 (ADR-010)
- [x] T642 Subida directa del expediente con formulario prefirmado
- [x] T643 Descarga con enlace temporal
- [x] T644 Criterios de evaluación por submodalidad (RF-04.11)
- [x] T645 Copia de los archivos locales al bucket (`scripts/s3-copy-local.ts`)
