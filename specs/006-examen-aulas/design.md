# Diseño — Programación del examen, aulas y asistencia

> **SDD (Spec-Driven Development) · artefacto 2 de 3: diseño** (cómo se construye).
> Anterior: [requirements.md](requirements.md) · Siguiente: [tasks.md](tasks.md). Arquitectura general: [docs/arquitectura.md](../../docs/arquitectura.md) y [ADR](../../docs/adr/README.md).


## 1. Plan técnico

**Rama:** `006-examen-aulas` · **Fecha:** 26/10/2026 · **Spec:** [requirements.md](requirements.md) · **Módulos:** M07 Exámenes, M08 Sedes y aulas

### Resumen

Un módulo nuevo `examenes` (esquema PostgreSQL `examenes`) con Clean Architecture, igual que los demás:

- **M07 Exámenes**: examen por convocatoria y modalidad, ventana de ingreso (RN-36), duración, estructura y reglas de calificación (RN-30 a RN-34), indicaciones (RN-37, RN-38), hora de publicación de aulas (24 h antes, RN-35) y reprogramación con motivo y aviso.
- **M08 Sedes y aulas**: sedes, pabellones, pisos y aulas con capacidad, puerta de ingreso y accesibilidad; aulas habilitadas por examen con control de cruces de horario (RF-07.07).
- **Distribución**: aptos de la modalidad (inscripción **Apta** = pago confirmado y, en exonerados, expediente autorizado) → primero quienes pidieron adecuación a aulas accesibles, luego por área académica y orden alfabético (supuesto de la spec, Art. 23), llenando aulas en orden de puerta, pabellón, piso y código. Si falta capacidad no asigna a nadie y dice cuántos asientos faltan.
- **Publicación**: la distribución se confirma en el panel y el postulante la ve desde la hora de publicación. Regenerar una distribución ya visible exige justificación, guarda el historial y avisa por correo a quienes cambian de aula.
- **Consulta del aula** con DNI + código (límite de intentos, respuesta genérica), **ficha de examen en PDF** con aula, horario, indicaciones y QR.
- **Asistencia**: lista PDF por aula con foto; registro de ingreso escaneando el QR (o escribiendo el código) con foto para comparar, «fuera de hora» después del cierre; ausentes al cerrar; incidencias con aviso a la Comisión.
- **Cambio de aula** individual con motivo, historial y correo.
- **Adecuación** (RN-39): el postulante la solicita en «Buscar aula»; con menos de 72 h queda marcada fuera de plazo.

### Decisiones

| Tema | Decisión |
|---|---|
| Fuente de aptos | `inscripciones` expone `eligibleFor(callCode, modalities)`; el módulo no lee tablas ajenas (ADR-001). |
| Asignación única | `exam_assignments` con `UNIQUE(exam_id, applicant_code)` y `UNIQUE(exam_id, room_id, seat)`: la base impide duplicados y sobrecupo (SC-002). |
| Historial | `assignment_changes` guarda cada movimiento (versión, aula anterior y nueva, motivo, responsable). |
| QR de la ficha de examen | `código.firma` (HMAC `examen:`) dentro de un enlace a `/admin/asistencia`: el responsable lo escanea con la cámara del panel o con un lector que escribe como teclado. |
| Permisos | `examenes.gestionar` (coordinador) y `asistencia.registrar` (nuevo rol «Responsable de aula»). |
| Eventos | `AulaCambiada`, `ExamenReprogramado`, `IncidenciaRegistrada` por la outbox → correos (M11 completo en el Paso 10). |
| Sin conexión | La lista de asistencia funciona en línea; el modo sin conexión queda para el despliegue (🟡). |

### Estructura

```
apps/backend/src/modules/examenes/
  domain/distribution.ts        # algoritmo puro de distribución (probado sin base)
  domain/exam-rules.ts          # ventanas, cruces, etiquetas, indicaciones por defecto
  application/exam-service.ts   # programación, sedes/aulas, distribución, publicación
  application/attendance-service.ts  # ingreso, ausentes, incidencias, listas PDF
  application/exam-pdf.ts       # ficha de examen y lista de asistencia (pdfkit)
  presentation/routes.ts
  index.ts
apps/frontend/src/app/features/aula/find-room.ts          # «Buscar aula»
apps/frontend/src/app/features/admin/pages/{exams,venues,attendance}.ts
```

## 2. Actualizaciones de diseño (27 y 28/10/2026)

- **Temario por curso** (RF-07.03): `structure.cursos` reparte las preguntas de conocimientos entre los cursos del temario (`GET /admin/exams/syllabus-courses`); la suma debe coincidir con conocimientos.
- **Asistencia sin conexión** (RF-08.08): las lecturas se guardan en el navegador con su hora y se envían al volver la red (`scannedAt` validado en el servidor para «fuera de hora»).
- El asistente informa aula, asiento y puerta cuando están publicados (RF-10.07).

## Ficha de examen tipo boleto (30/10/2026, skill interface-design)

- En «Buscar aula» (`features/aula/find-room.ts`), con el aula asignada, la ficha se muestra como un **boleto**: encabezado con el examen, la fecha y el código; talón con **aula y asiento** en grande (el foco); ruta puerta, pabellón y piso; franja dorada «Ingreso de 6:30 a. m. a 8:30 a. m., después no hay ingreso»; local y marca de aula accesible. Con el boleto a la vista, la fecha y la hora no se repiten en la lista de datos. Sin aula asignada, la página queda como antes (aviso y datos del examen).
- Verificado en escritorio (1400 px) y celular (375 px, sin desborde) con una respuesta simulada en el navegador, porque las aulas se publican el 14 y el 21 de noviembre.
