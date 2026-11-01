# Requisitos — Resultados, admitidos y constancia de ingreso

> **SDD (Spec-Driven Development) · artefacto 1 de 3: requisitos** (qué y por qué).
> Siguiente: [design.md](design.md) (cómo) · [tasks.md](tasks.md) (tareas). Principios: [constitución](../../.specify/memory/constitution.md).

**Rama:** `007-resultados-ingreso`
**Creada:** 25/10/2026
**Estado:** En revisión
**Módulos de arquitectura:** M09 Resultados
**Entrada:** "Importar las calificaciones, calcular el orden de mérito por programa y modalidad con las reglas del Reglamento, que la Comisión apruebe antes de publicar, que cada postulante vea su puntaje y que los admitidos tramiten su constancia de ingreso."

## Escenarios de usuario y pruebas

### Historia 1 — Importar y validar calificaciones (Prioridad: P1)

Como operador de resultados, quiero importar el archivo de calificación y que el sistema detecte errores antes de procesar.

**Escenarios de aceptación:**

1. **Dado** un archivo con código de postulante, aciertos de conocimientos, aptitud vocacional y actitud personal, **cuando** lo importo, **entonces** el sistema muestra cuántos registros son válidos y cuáles tienen errores. *(RF-09.01, RF-09.02)*
2. **Dado** registros con códigos inexistentes, duplicados, de postulantes ausentes o con más aciertos de los posibles, **cuando** valido, **entonces** se listan como inconsistencias y no se procesan hasta resolverlas.
3. **Dado** fichas marcadas como mal llenadas, **cuando** se importan, **entonces** quedan como "No calificable" sin opción de reclamo (RN-41).

---

### Historia 2 — Calcular puntajes y orden de mérito (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** un postulante con todas las respuestas correctas, **cuando** se calcula, **entonces** obtiene 1000.00 puntos (900 + 50 + 50) (RN-31).
2. **Dado** respuestas incorrectas, **cuando** se calcula, **entonces** no restan puntos (RN-33).
3. **Dado** los puntajes, **cuando** se genera el orden de mérito, **entonces** se agrupa por programa/especialidad y por modalidad/submodalidad, de mayor a menor. *(RF-09.04)*
4. **Dado** un programa con 20 vacantes ordinarias, **cuando** se determina la condición, **entonces** son **Admitidos** los 20 primeros con al menos 450 puntos; el resto es **No admitido**; quienes no asistieron son **Ausentes** (RN-32, RN-50). *(RF-09.05)*
5. **Dado** un empate en el último puesto con vacante, **cuando** se determina la condición, **entonces** todos los empatados son admitidos (RN-51).
6. **Dado** que solo 15 postulantes superan 450 en un programa con 20 vacantes, **cuando** se determina la condición, **entonces** las 5 vacantes quedan sin cubrir y **no** se transfieren a otro programa (RN-04).
7. **Dado** vacantes de exonerados no cubiertas tras su examen, **cuando** se cierra ese proceso, **entonces** se suman a las vacantes ordinarias del mismo programa (RN-05).
8. **Dado** un postulante "sin derecho a vacante" (4.º de secundaria), **cuando** se calcula, **entonces** recibe puntaje pero no ocupa vacante (RN-13).

---

### Historia 3 — Revisar, aprobar y publicar resultados (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** resultados calculados, **cuando** el operador los envía a aprobación, **entonces** la Comisión puede revisarlos pero los postulantes aún no los ven. *(RF-09.06)*
2. **Dado** la aprobación de la Comisión, **cuando** se programa la publicación, **entonces** los resultados se hacen visibles exactamente en la fecha y hora autorizadas. *(RF-09.07)*
3. **Dado** que nadie aprobó, **cuando** se intenta publicar, **entonces** el sistema lo impide (RNF-09).
4. **Dado** una rectificación aprobada después de publicar, **cuando** se aplica, **entonces** se crea una nueva versión, se conserva la anterior y queda en auditoría quién la autorizó. *(RF-09.11)*

---

### Historia 4 — Consultar mi puntaje y condición (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** resultados publicados, **cuando** consulto en mi panel o con DNI + código, **entonces** veo puntaje total, desglose por componente, puesto en mi programa y condición. *(RF-09.08)*
2. **Dado** que soy admitido, **cuando** abro mi panel, **entonces** veo felicitaciones, el día que me corresponde entregar documentos según mi programa (24/11–02/12) y la lista exacta de documentos de mi submodalidad.
3. **Dado** la lista pública de admitidos, **cuando** se publica, **entonces** muestra código de postulante, nombres, programa, puntaje y puesto, pero no DNI.

---

### Historia 5 — Tramitar mi constancia de ingreso (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** que soy admitido, **cuando** pago la constancia de ingreso (S/ 15.00) y Admisión registra la entrega de mis documentos originales, **entonces** paso a **Ingresante** y puedo descargar la constancia con QR. *(RF-09.10, RN-54)*
2. **Dado** que entrego documentos el 03/12, **cuando** se registra, **entonces** se exige el recargo extemporáneo de S/ 65.00.
3. **Dado** que vence el plazo sin entregar documentos, **cuando** cierra la etapa, **entonces** paso automáticamente a **Admisión perdida**, sin notificación previa obligatoria, y la vacante no se cubre (RN-55, RN-56).

---

### Historia 6 — Reportes de resultados (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** resultados publicados, **cuando** Admisión genera reportes, **entonces** obtiene ingresantes, no admitidos, ausentes, cobertura de vacantes por programa y modalidad, en PDF y Excel. *(RF-09.09, RF-12.07)*
2. **Dado** el cierre de constancias, **cuando** se genera el reporte para Consejo Universitario, **entonces** lista ingresantes desagregados por programa y modalidad (Art. 35, 50.2).

---

### Historia 7 — Registrar solicitudes de revisión (Prioridad: P3)

**Escenarios de aceptación:**

1. **Dado** que el Reglamento declara inimpugnables los resultados (RN-57), **cuando** un postulante presenta una solicitud, **entonces** se registra con número de caso solo para errores materiales (p. ej. código mal leído) y se responde por escrito. *(RF-09.12)*

### Casos límite

- Postulante admitido en Exonerados que también estaba inscrito en Ordinario → no puede ocupar dos vacantes; se aplica la regla de la Comisión.
- Postulante sancionado durante el examen (RN-61) → su resultado se anula y su puesto lo ocupa el siguiente en mérito antes de publicar.
- Factor de ponderación por área (Tabla 5) → valores provisionales uniformes (ver *Aclaraciones*); cuando se cargue la Tabla 5 oficial, se recalcula sin cambiar código.

## Aclaraciones

### Sesión 25/10/2026

- P: La Tabla 5 (factor de ponderación por área) no está en los documentos recibidos. ¿Cómo se calcula el valor de cada pregunta? → R: **Provisional uniforme**: 9 puntos por pregunta de conocimientos (100 × 9 = 900) y 5 puntos por pregunta de test (20 × 5 = 100). Los factores por área y curso se guardan como configuración del examen (inicialmente 1.0) y se reemplazarán por la Tabla 5 oficial cuando se obtenga.

## Requisitos

### Requisitos funcionales

- **FR-001**: El sistema DEBE importar calificaciones desde archivos estructurados y validar integridad antes de procesar. *(RF-09.01, RF-09.02)*
- **FR-002**: El sistema DEBE calcular puntajes con valores y factores configurables por área, máximo 1000, sin descuento por error; los valores iniciales son 9 puntos por pregunta de conocimientos y 5 por pregunta de test, con factor 1.0. *(RF-09.03, RN-31, RN-33, RN-34)*
- **FR-003**: El sistema DEBE generar el orden de mérito por programa y modalidad/submodalidad. *(RF-09.04)*
- **FR-004**: El sistema DEBE determinar la condición (Admitido, No admitido, Ausente, No calificable, Sin derecho a vacante) aplicando mínimo de 450, vacantes, empates y traslado de vacantes de exonerados a ordinario. *(RF-09.05, RN-04, RN-05, RN-32, RN-51)*
- **FR-005**: El sistema DEBE exigir aprobación antes de publicar y publicar en fecha y hora programadas. *(RF-09.06, RF-09.07)*
- **FR-006**: El sistema DEBE permitir a cada postulante consultar su puntaje de forma segura. *(RF-09.08)*
- **FR-007**: El sistema DEBE gestionar la entrega de documentos de admitidos según el calendario por programa y emitir constancia de ingreso con QR. *(RF-09.10, RN-54)*
- **FR-008**: El sistema DEBE retirar automáticamente la condición de admitido al vencer el plazo sin entrega. *(RN-55)*
- **FR-009**: El sistema DEBE versionar resultados y auditar rectificaciones. *(RF-09.11, RNF-10)*
- **FR-010**: El sistema DEBE generar reportes de ingresantes, no admitidos, ausentes y cobertura. *(RF-09.09)*
- **FR-011**: El sistema DEBE registrar solicitudes de revisión por error material. *(RF-09.12)*

### Entidades clave

- **Lote de calificación**: archivo, examen, estado de validación, inconsistencias.
- **Puntaje**: inscripción, componentes, total.
- **Publicación de resultados**: examen, versión, estado (Borrador, En aprobación, Aprobada, Publicada), aprobador, fecha programada.
- **Resultado**: inscripción, puntaje, puesto, condición, versión.
- **Constancia de ingreso**: resultado, documentos recibidos, pago, código de verificación.

## Criterios de éxito

- **SC-001**: El cálculo y orden de mérito de 2 000 postulantes termina en menos de 1 minuto.
- **SC-002**: El 100 % de los casos de prueba de reglas (empates, mínimo, vacantes sobrantes) da el resultado esperado.
- **SC-003**: Ningún resultado es visible para postulantes antes de la hora autorizada.
- **SC-004**: El sistema soporta 2 000 consultas simultáneas de resultados con respuesta menor a 3 segundos.

## Supuestos

- El sistema de lectura óptica entrega un archivo CSV con aciertos por componente.

## Fuera de alcance

- Lectura de fichas ópticas.

## Estado de los requisitos (28/10/2026)

13 de 13 requisitos del catálogo citados en esta funcionalidad están implementados y probados. Fuente: [matriz de trazabilidad](../../docs/trazabilidad-requisitos.md).

| RF | Estado | Detalle |
|---|---|---|
| RF-09.01 | ✅ | Importación del CSV de la lectora óptica desde el panel |
| RF-09.02 | ✅ | Validación completa antes de procesar: inexistentes, duplicados, ausentes con nota, fuera de rango y presentes sin registro |
| RF-09.03 | ✅ | Puntaje con puntos y factor configurables por examen, sin descuento por error (RN-31 a RN-34) |
| RF-09.04 | ✅ | Orden de mérito por programa y categoría (modalidad o submodalidad) |
| RF-09.05 | ✅ | Admitido con mínimo 450 y vacante, empatados del último puesto admitidos, sin traslado entre programas y con vacantes de exonerados al ordinario |
| RF-09.06 | ✅ | Borrador → aprobación de la Comisión (otra persona) → publicación |
| RF-09.07 | ✅ | Visibles desde la fecha y hora aprobadas; aviso por correo al publicarse |
| RF-09.08 | ✅ | «Ver puntaje» con DNI + código: puntaje, desglose, puesto y condición |
| RF-09.09 | ✅ | Excel y PDF de resultados por condición y de cobertura de vacantes |
| RF-09.10 | ✅ | Entrega de documentos y recibo de la constancia (S/ 15.00 o con recargo); constancia de ingreso con QR verificable |
| RF-09.11 | ✅ | Versiones: una rectificación exige motivo, reemplaza la publicada y queda en auditoría |
| RF-09.12 | ✅ | Solicitud de revisión por error material como caso de atención (resultados inimpugnables, RN-57) |
| RF-12.07 | ✅ | Resultados por condición e ingresantes en el panel; Excel y PDF de resultados y cobertura |

✅ implementado y probado · 🟡 parcial (lo que falta depende de un servicio externo o está anotado) · ⏳ pendiente
