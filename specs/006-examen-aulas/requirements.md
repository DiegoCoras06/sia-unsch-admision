# Requisitos — Programación del examen, aulas y asistencia

> **SDD (Spec-Driven Development) · artefacto 1 de 3: requisitos** (qué y por qué).
> Siguiente: [design.md](design.md) (cómo) · [tasks.md](tasks.md) (tareas). Principios: [constitución](../../.specify/memory/constitution.md).

**Rama:** `006-examen-aulas`
**Creada:** 25/10/2026
**Estado:** En revisión
**Módulos de arquitectura:** M07 Exámenes, M08 Sedes y aulas
**Entrada:** "Que el coordinador programe los dos exámenes, el sistema distribuya a los aptos en pabellones y aulas sin pasarse de la capacidad, se publique 24 horas antes y el postulante vea su aula. El día del examen, controlar la asistencia."

## Escenarios de usuario y pruebas

### Historia 1 — Programar las sesiones de examen (Prioridad: P1)

Como coordinador de examen, quiero registrar cada examen con fecha, horario de ingreso, duración e indicaciones.

**Escenarios de aceptación:**

1. **Dado** la convocatoria 2027-I, **cuando** creo el examen de Exonerados para el domingo 15/11/2026 con ingreso de 7:00 a 8:30 a.m., **entonces** queda programado y visible para los exonerados aptos (RN-36).
2. **Dado** el examen Ordinario del 22/11/2026, **cuando** registro ingreso de 6:30 a 8:30 a.m., **entonces** queda programado para ordinarios y reinscritos.
3. **Dado** que intento programar dos sesiones que usan las mismas aulas en horarios superpuestos, **cuando** guardo, **entonces** el sistema rechaza el conflicto. *(RF-07.07)*
4. **Dado** un examen, **cuando** registro su estructura (100 preguntas de conocimientos, 10 de aptitud vocacional, 10 de actitud personal), **entonces** queda como base para la calificación (RN-30, RN-31).

---

### Historia 2 — Registrar sedes, pabellones y aulas (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** la Ciudad Universitaria, **cuando** registro pabellones, pisos y aulas con su capacidad, **entonces** el sistema muestra la capacidad total disponible. *(RF-08.01, RF-08.02)*
2. **Dado** un aula marcada como accesible (primer piso, rampa), **cuando** se distribuye, **entonces** se usa primero para postulantes con discapacidad física que solicitaron adecuación.

---

### Historia 3 — Distribuir automáticamente a los postulantes aptos (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** 934 aptos de Ordinario y aulas con capacidad total de 1 000, **cuando** ejecuto la distribución, **entonces** cada apto recibe exactamente un aula y ningún aula supera su capacidad. *(RF-08.03, RF-08.04)*
2. **Dado** que la capacidad es insuficiente, **cuando** ejecuto la distribución, **entonces** el sistema no asigna a nadie y reporta cuántos asientos faltan.
3. **Dado** una distribución generada, **cuando** la reviso, **entonces** puedo ver ocupación por aula y confirmarla o regenerarla antes de publicar.
4. **Dado** que la distribución ya fue publicada, **cuando** alguien intenta regenerarla, **entonces** se exige justificación y se notifica a los afectados.

---

### Historia 4 — Consultar mi aula (Prioridad: P1)

Como postulante, quiero saber dónde rindo el examen, desde mi panel o con DNI + código (como el "Buscar Aula" actual).

**Escenarios de aceptación:**

1. **Dado** que la distribución se publicó (24 h antes del examen), **cuando** consulto con DNI y código de postulante, **entonces** veo puerta de ingreso, pabellón, piso, aula, fecha, hora límite de ingreso y la lista de lo que debo llevar y lo prohibido. *(RF-08.05, RN-35, RN-37, RN-38)*
2. **Dado** que aún no se publica, **cuando** consulto, **entonces** veo la fecha y hora exactas en que se publicará.
3. **Dado** que no figuro como apto, **cuando** consulto, **entonces** veo "No figuras en la relación de aptos" y el motivo general (p. ej. pago no confirmado), con indicación de contactar a Admisión.
4. **Dado** que estoy asignado, **cuando** descargo la ficha de examen, **entonces** incluye aula, horario y QR. *(RF-08.06)*
5. **Dado** que consulto con un DNI y un código que no corresponden, **cuando** envío, **entonces** el sistema responde "Datos no encontrados" sin revelar cuál de los dos falló, y limita los intentos.

---

### Historia 5 — Controlar la asistencia el día del examen (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** un aula, **cuando** el responsable descarga la lista de asistencia, **entonces** obtiene un PDF con foto, nombre y código de cada postulante asignado. *(RF-08.07)*
2. **Dado** la lista en un celular o tableta, **cuando** el responsable escanea el QR de la ficha o busca el código, **entonces** registra **Presente** y ve la foto para comparar con la persona. *(RF-08.08)*
3. **Dado** que son las 8:31 a.m., **cuando** se intenta registrar un nuevo ingreso, **entonces** el sistema lo marca como fuera de hora (RN-36).
4. **Dado** un incidente (p. ej. celular encontrado), **cuando** lo registro, **entonces** queda con tipo, descripción, hora, aula y responsable, y se notifica a la Comisión (RN-60).

---

### Historia 6 — Cambiar a un postulante de aula y reprogramar (Prioridad: P3)

**Escenarios de aceptación:**

1. **Dado** un aula inhabilitada, **cuando** reubico a sus postulantes, **entonces** se conserva el historial del cambio y se notifica a cada uno. *(RF-08.09, RF-07.09)*

### Casos límite

- Postulante con discapacidad que pidió adecuación con menos de 72 h → se registra, pero se marca fuera de plazo para decisión de la Comisión (RN-39).
- Un apto pasa a no apto después de la distribución (inscripción anulada) → se libera el asiento y no se reasigna automáticamente.
- Sin conexión el día del examen → la lista de asistencia funciona sin conexión y sincroniza después.

## Requisitos

### Requisitos funcionales

- **FR-001**: El sistema DEBE permitir crear exámenes por convocatoria y modalidad con fecha, horario de ingreso, duración, lugar y estructura de preguntas. *(RF-07.01, RF-07.02, RF-07.06)*
- **FR-002**: El sistema DEBE registrar áreas curriculares y reglas de calificación del examen. *(RF-07.03, RF-07.04)*
- **FR-003**: El sistema DEBE generar la relación de postulantes aptos (pago confirmado, expediente autorizado si aplica, sin observaciones). *(RF-07.05)*
- **FR-004**: El sistema DEBE evitar conflictos de programación de aulas. *(RF-07.07)*
- **FR-005**: El sistema DEBE publicar indicaciones, materiales permitidos y prohibidos, y horarios. *(RF-07.08)*
- **FR-006**: El sistema DEBE registrar sedes, pabellones, pisos, aulas, capacidad y accesibilidad. *(RF-08.01, RF-08.02)*
- **FR-007**: El sistema DEBE distribuir automáticamente a los aptos sin exceder capacidades y sin duplicar asignaciones. *(RF-08.03, RF-08.04)*
- **FR-008**: El sistema DEBE publicar la distribución en la fecha y hora configuradas (24 h antes). *(RN-35)*
- **FR-009**: El sistema DEBE permitir consultar el aula con DNI + código, con límite de intentos, o desde el panel. *(RF-08.05)*
- **FR-010**: El sistema DEBE generar ficha de examen con QR y listas de asistencia por aula. *(RF-08.06, RF-08.07)*
- **FR-011**: El sistema DEBE registrar asistencia, inasistencia e incidencias. *(RF-08.08)*
- **FR-012**: El sistema DEBE registrar cambios de aula y reprogramaciones con trazabilidad y notificación. *(RF-07.09, RF-08.09)*
- **FR-013**: El sistema DEBE registrar solicitudes de adecuación de postulantes con discapacidad. *(RN-39)*

### Entidades clave

- **Examen**: convocatoria, modalidad, fecha, ventana de ingreso, estructura, estado.
- **Sede / Pabellón / Aula**: ubicación, piso, capacidad, accesibilidad.
- **Asignación**: inscripción, examen, aula, asiento, versión.
- **Asistencia**: asignación, estado, hora, responsable.
- **Incidencia**: tipo, descripción, aula, hora, responsable.

## Criterios de éxito

- **SC-001**: La distribución de 2 000 postulantes termina en menos de 30 segundos.
- **SC-002**: 0 aulas con sobrecupo y 0 postulantes con doble asignación en todas las pruebas.
- **SC-003**: Un postulante encuentra su aula en menos de 30 segundos.
- **SC-004**: El registro de ingreso por QR toma menos de 5 segundos por postulante.

## Supuestos

- La Comisión asigna local, pabellón y aula "según criterios convenientes" (Art. 23); el criterio por defecto es agrupar por área académica y orden alfabético.

## Fuera de alcance

- Elaboración, impresión y lectura óptica de la prueba.

## Estado de los requisitos (28/10/2026)

18 de 18 requisitos del catálogo citados en esta funcionalidad están implementados y probados. Fuente: [matriz de trazabilidad](../../docs/trazabilidad-requisitos.md).

| RF | Estado | Detalle |
|---|---|---|
| RF-07.01 | ✅ | Exámenes por convocatoria y modalidad (Exonerados y Ordinario sembrados del cronograma) |
| RF-07.02 | ✅ | Fecha, apertura y cierre del ingreso, duración y lugar editables en el panel |
| RF-07.03 | ✅ | Estructura por áreas y reparto de las preguntas de conocimientos por curso del temario (la suma se valida) |
| RF-07.04 | ✅ | Puntos por pregunta, factor por área, máximo y mínimo configurables (RN-31 a RN-34) |
| RF-07.05 | ✅ | Relación de aptos (pago confirmado y expediente autorizado) en el panel y en PDF |
| RF-07.06 | ✅ | Sesiones diferenciadas por modalidad; una modalidad no puede estar en dos exámenes |
| RF-07.07 | ✅ | Rechaza aulas compartidas por exámenes con horarios que se cruzan (SCHEDULE_CONFLICT) |
| RF-07.08 | ✅ | Indicaciones, lo que se lleva, lo prohibido y horario de ingreso en «Buscar aula» y en la ficha |
| RF-07.09 | ✅ | Reprogramación con motivo obligatorio y correo a cada postulante con aula publicada |
| RF-08.01 | ✅ | Sedes, pabellones, pisos y aulas en el panel (semilla ilustrativa de la Ciudad Universitaria) |
| RF-08.02 | ✅ | Capacidad máxima por aula; no baja de los asientos ya asignados |
| RF-08.03 | ✅ | Distribución automática: adecuaciones en aulas accesibles, luego por área y orden alfabético; todo o nada si falta capacidad |
| RF-08.04 | ✅ | Restricciones únicas en la base: un asiento por postulante y examen, y por aula y número |
| RF-08.05 | ✅ | «Buscar aula» con DNI + código, límite de intentos y respuesta genérica; visible desde 24 h antes |
| RF-08.06 | ✅ | Ficha de examen en PDF con puerta, pabellón, piso, aula, asiento, horario y QR firmado |
| RF-08.07 | ✅ | Lista de asistencia por aula en PDF con foto, código y firma |
| RF-08.08 | ✅ | Ingreso por QR con foto, fuera de hora, ausentes e incidencias; modo sin conexión con cola local y envío con la hora de lectura |
| RF-08.09 | ✅ | Cambio de aula con motivo, historial de versiones y correo al postulante |

✅ implementado y probado · 🟡 parcial (lo que falta depende de un servicio externo o está anotado) · ⏳ pendiente
