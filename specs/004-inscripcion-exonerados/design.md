# Diseño — Inscripción en la modalidad Exonerados y expediente digital

> **SDD (Spec-Driven Development) · artefacto 2 de 3: diseño** (cómo se construye).
> Anterior: [requirements.md](requirements.md) · Siguiente: [tasks.md](tasks.md). Arquitectura general: [docs/arquitectura.md](../../docs/arquitectura.md) y [ADR](../../docs/adr/README.md).


## 1. Plan técnico

**Spec:** [requirements.md](requirements.md) · **Tareas:** [tasks.md](./tasks.md) · **Decisiones:** ADR-010 (documentos privados), ADR-015 (sin cuenta obligatoria), ADR-018 (permisos del panel)

### Ajuste al flujo de la spec

La spec pide primero el expediente y luego la inscripción. En el portal el exonerado **ya llena el formulario completo** (submodalidad, programa con vacantes en su submodalidad, foto) y queda **Pendiente de validación**. Se conserva ese orden y el expediente se adjunta a esa inscripción:

```
Inscripción EXO ─► Expediente (subir documentos + datos complementarios) ─► Enviar
   ─► Evaluador: Conforme / Observado por documento ─► Autorizar · Observar (plazo) · Rechazar
   ─► Autorizado: inscripción a «Pendiente de pago» ─► pago ─► Apta ─► ficha con QR (Examen de exonerados)
```

Mientras el expediente no esté autorizado **no se puede pagar** (RN-24, FR-008). Rechazado o vencido sin subsanar → inscripción anulada.

### Alcance de la iteración 1

| Historia | Incluido | Queda |
|---|---|---|
| H1 Documentos por submodalidad | Lista de M01 (base común + propios; graduados sin base común) | — |
| H2 Expediente digital | PDF/JPG/PNG ≤ 5 MB; tipo real por firma del archivo, PDF íntegro (`%%EOF`) y sin contraseña, JPG/PNG completos; SHA-256; envío a revisión con faltantes | — |
| H3 Evaluación | Bandeja por evaluador, Conforme/Observado con motivo, Autorizar/Observar/Rechazar con justificación, asignación equitativa automática o manual | — |
| H4 Subsanación | Solo documentos observados, plazo dentro de la etapa, versiones conservadas, «No subsanado» al vencer | — |
| H5 Inscripción autorizada | Pago y ficha solo con expediente autorizado | — |
| H6 Adjudicados CEPRE | — | Lista de adjudicados y ventana propia (siguiente iteración) |
| H7 Presencial | Verificación presencial con responsable | — |
| FR-014 / FR-015 | Datos complementarios por submodalidad; evaluación especial programada por el evaluador | — |

### Diseño

**Módulo M06 Expedientes** (`src/modules/expedientes`), esquema `expedientes`:

| Tabla | Contenido |
|---|---|
| `dossiers` | una por inscripción EXO: estado, evaluador asignado, plazo de subsanación, decisión y motivo, verificación presencial, datos complementarios, evaluación especial |
| `dossier_documents` | cada versión de cada documento: archivo, tipo, tamaño, SHA-256, estado (Cargado, Conforme, Observado, Reemplazado) y motivo |
| `dossier_events` | historial: envío, revisión, observación, decisión, asignación (RF-06.06) |

- M06 lee los requisitos de M01 y el contexto de la inscripción de M03 por sus API públicas; publica `ExpedienteDictaminado` en la outbox y **M03 cambia el estado de la inscripción** (autorizado → Pendiente de pago; observado → Observada; rechazado o no subsanado → Anulada) y envía el correo (RF-06.05).
- M05 rechaza iniciar un pago con la inscripción Pendiente de validación u Observada.
- Archivos privados en el almacenamiento (`expedientes/{convocatoria}/{código}/…`); se descargan solo con DNI + código o con el permiso del panel, y cada descarga del personal queda en la auditoría (RF-06.02). En AWS se usará S3 con URL prefirmadas (ADR-010); en local, disco.
- Permisos nuevos: `expedientes.evaluar` (Evaluador, Oficina de Admisión, Administrador) y `expedientes.asignar` (Oficina de Admisión, Administrador). El evaluador ve solo lo asignado a él.

### Verificación

Pruebas de integración: requisitos por submodalidad, archivo falso/protegido/grande rechazado, envío con faltantes, asignación equitativa, evaluador ajeno sin acceso, autorizar exige todo conforme, observar → subsanar solo lo observado con versión anterior conservada, plazo vencido → No subsanado, pago bloqueado hasta autorizar, autorizado → pago → ficha. E2E por la interfaz: postulante sube y envía; evaluador observa; postulante subsana; evaluador autoriza.

## 2. Actualizaciones de diseño (27 y 28/10/2026)

- **Almacenamiento en Amazon S3** (ADR-010): bucket privado `admision-unsch-documentos-2027` (us-east-2), cifrado SSE-S3, CORS solo para el origen de la web. Puerto `FileStorage` con `S3FileStorage` (`apps/backend/src/shared/storage/s3-file-storage.ts`) y `LocalFileStorage` para desarrollo; se elige con `FILE_STORAGE`.
- **Subida directa del expediente:** `POST /dossier/documents/upload-url` entrega un formulario POST prefirmado (5 minutos, tamaño máximo 5 MB, tipo fijo); el navegador sube a `subidas/expedientes/<código>/<uuid>`; `POST /dossier/documents` con `uploadKey` valida el archivo real (firma, tamaño, SHA-256), lo guarda en su ruta definitiva y borra la subida temporal. Motivo: Lambda acepta cuerpos de hasta 6 MB y un PDF de 5 MB en base64 los supera.
- **Descarga:** enlace prefirmado de 2 minutos (`{ data: { url } }`) en lugar de pasar el archivo por la Lambda.
- **Criterios de evaluación por submodalidad** (RF-04.11): editables en el panel; se muestran en «Requisitos» y a la Comisión en el expediente.
- Guía de configuración: `docs/aws-s3.md`.
