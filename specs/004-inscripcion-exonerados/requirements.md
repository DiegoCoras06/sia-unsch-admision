# Requisitos — Inscripción en la modalidad Exonerados y expediente digital

> **SDD (Spec-Driven Development) · artefacto 1 de 3: requisitos** (qué y por qué).
> Siguiente: [design.md](design.md) (cómo) · [tasks.md](tasks.md) (tareas). Principios: [constitución](../../.specify/memory/constitution.md).

**Rama:** `004-inscripcion-exonerados`
**Creada:** 25/10/2026
**Estado:** En revisión
**Módulos de arquitectura:** M04 Inscripción exonerados, M06 Expedientes
**Entrada:** "Hoy el exonerado lleva sus papeles a Jr. Arequipa 175 antes de poder inscribirse. Quiero que suba su expediente en línea, que un evaluador lo revise y le observe por documento, y que pueda subsanar sin viajar."

## Escenarios de usuario y pruebas

### Historia 1 — Elegir mi submodalidad y ver exactamente qué documentos necesito (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** que la inscripción de exonerados está en curso (07/09–30/10 regular, 31/10–09/11 extemporánea), **cuando** elijo "Exonerados", **entonces** veo las submodalidades del Reglamento: Discapacidad, 1.º/2.º puesto (urbano/rural), COAR, Deportista, Graduados/titulados, Traslado interno, Traslado externo nacional e internacional, Víctimas del terrorismo/violencia (urbano/rural), Pueblos indígenas (andino/amazónico).
2. **Dado** que elijo "1.º/2.º puesto — Rural", **cuando** continúo, **entonces** veo la lista de documentos: los 4 de la base común (Art. 36) más la resolución o acta de adjudicación (Art. 38), cada uno con descripción y formato permitido.
3. **Dado** que elijo "Graduados y/o titulados", **cuando** continúo, **entonces** la lista NO incluye la base común sino los 3 documentos del Art. 42.
4. **Dado** que elijo un programa con 0 vacantes en mi submodalidad, **cuando** intento seleccionarlo, **entonces** aparece deshabilitado con el texto "Sin vacantes en esta submodalidad".

---

### Historia 2 — Subir mi expediente digital (Prioridad: P1)

Como exonerado, quiero subir cada documento escaneado y enviarlo a revisión (MEJ-05).

**Escenarios de aceptación:**

1. **Dado** la lista de documentos de mi submodalidad, **cuando** subo un PDF o JPG de hasta 5 MB por documento, **entonces** queda marcado "Cargado" con vista previa.
2. **Dado** que falta algún documento obligatorio, **cuando** intento enviar a revisión, **entonces** el sistema indica cuáles faltan y no envía.
3. **Dado** que subo un archivo dañado, protegido con contraseña o de tipo no permitido, **cuando** se valida, **entonces** se rechaza con el motivo. *(RF-04.05)*
4. **Dado** todos los documentos cargados, **cuando** envío a revisión, **entonces** el expediente pasa a **En revisión**, ya no puedo modificarlo y recibo un correo de confirmación.

---

### Historia 3 — Revisar expedientes como evaluador (Prioridad: P1)

Como evaluador documental, quiero una bandeja de expedientes asignados donde revise cada documento y lo apruebe u observe con motivo.

**Escenarios de aceptación:**

1. **Dado** expedientes en revisión, **cuando** abro mi bandeja, **entonces** veo solo los asignados a mí, ordenados por fecha de envío, con filtros por submodalidad y estado.
2. **Dado** un expediente abierto, **cuando** reviso un documento, **entonces** puedo marcarlo **Conforme** u **Observado** con un motivo obligatorio (p. ej. "Certificado sin visado de UGEL").
3. **Dado** que todos los documentos están conformes, **cuando** apruebo el expediente, **entonces** pasa a **Autorizado** y el postulante es notificado para continuar con la inscripción y el pago.
4. **Dado** al menos un documento observado, **cuando** finalizo la revisión, **entonces** el expediente pasa a **Observado** con fecha límite de subsanación dentro de la etapa vigente.
5. **Dado** que el postulante no cumple la condición (p. ej. COAR con menos de 24 puntos), **cuando** rechazo el expediente, **entonces** debo registrar el motivo y el sistema le sugiere la alternativa reglamentaria (postular por 1.º/2.º puesto u Ordinario, RN-14).

---

### Historia 4 — Subsanar observaciones en línea (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** un expediente observado, **cuando** abro mi panel, **entonces** veo cada documento observado con el motivo y la fecha límite. Solo esos documentos se pueden reemplazar. *(RF-04.08)*
2. **Dado** que reemplazo los documentos observados, **cuando** reenvío, **entonces** el expediente vuelve a **En revisión** y se conserva la versión anterior en el historial. *(RF-06.06)*
3. **Dado** que vence la fecha límite sin subsanar, **cuando** el plazo cierra, **entonces** el expediente pasa a **No subsanado** y no puede inscribirse.

---

### Historia 5 — Completar mi inscripción una vez autorizado (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** un expediente autorizado, **cuando** continúo, **entonces** el asistente me pide programa (solo con vacantes en mi submodalidad), foto y declaración jurada, igual que en Ordinario.
2. **Dado** la submodalidad, **cuando** se calcula el monto, **entonces** corresponde a la Tabla N.° 3 (p. ej. Traslado externo internacional S/ 425.00; Víctimas S/ 30.00).
3. **Dado** que mi expediente NO está autorizado, **cuando** intento pagar o elegir programa, **entonces** el sistema no lo permite (RN-24).
4. **Dado** pago confirmado, **cuando** descargo la ficha, **entonces** indica "Examen de exonerados — Domingo 15/11/2026".

---

### Historia 6 — Inscripción de adjudicados del CEPRE (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** que Admisión cargó la lista de adjudicados CEPRE el 11/11/2026, **cuando** un adjudicado inicia sesión el 11 o 12/11, **entonces** ve su programa adjudicado precargado y la tasa S/ 335.00.
2. **Dado** que el adjudicado se inscribe el 13/11, **cuando** se calcula el monto, **entonces** se aplica el recargo extemporáneo CEPRE de S/ 50.00 (total S/ 385.00).
3. **Dado** que un DNI no figura en la lista, **cuando** intenta la submodalidad CEPRE, **entonces** no puede seleccionarla.

---

### Historia 7 — Validación presencial como alternativa (Prioridad: P3)

**Escenarios de aceptación:**

1. **Dado** un postulante que entregó sus documentos en físico en Jr. Arequipa 175, **cuando** el evaluador registra la verificación presencial, **entonces** el expediente queda autorizado con la marca "Verificado presencialmente" y quién lo verificó.

### Casos límite

- Evaluador sale de licencia con expedientes asignados → Admisión los reasigna; el historial conserva ambos evaluadores.
- Postulante envía a revisión el último día a las 23:50 → la revisión puede ocurrir después; si la observación llega con la etapa cerrada, el plazo de subsanación es el que defina Admisión.
- Dos evaluadores abren el mismo expediente → solo el asignado puede dictaminar; el otro lo ve en modo lectura.
- Vacantes de la submodalidad agotadas por inscritos → no se bloquea (las vacantes se cubren por mérito, no por orden de llegada).

## Aclaraciones

### Sesión 25/10/2026

- P: El recargo de adjudicados CEPRE extemporáneos es S/ 50 (cronograma, ítem 6.3) o S/ 65 (Tabla 3, ítem 4)? → R: **S/ 50.00**. La regla específica del cronograma prevalece sobre la general; se guarda como parámetro editable `recargo_cepre_extemporaneo`.

## Requisitos

### Requisitos funcionales

- **FR-001**: El sistema DEBE ofrecer las submodalidades del Art. 8 con sus variantes (urbano/rural, andino/amazónico, ciclo I/II). *(RF-04.01)*
- **FR-002**: El sistema DEBE mostrar los documentos requeridos según la submodalidad, configurables por convocatoria. *(RF-04.02, RF-06.01, RF-14.03)*
- **FR-003**: El sistema DEBE permitir cargar documentos PDF/JPG/PNG de hasta 5 MB, validando tipo real, integridad y tamaño. *(RF-04.04, RF-04.05)*
- **FR-004**: El sistema DEBE asignar expedientes a evaluadores de forma equitativa o manual. *(RF-06.03)*
- **FR-005**: El sistema DEBE permitir dictaminar cada documento (Conforme/Observado con motivo) y el expediente (Autorizado/Observado/Rechazado con justificación). *(RF-04.06, RF-04.07, RF-06.04, RF-06.07)*
- **FR-006**: El sistema DEBE notificar al postulante cada cambio de estado del expediente. *(RF-06.05)*
- **FR-007**: El sistema DEBE permitir subsanar solo los documentos observados dentro del plazo y conservar todas las versiones. *(RF-04.08, RF-06.06)*
- **FR-008**: El sistema DEBE impedir elegir programa, pagar o generar ficha si el expediente no está autorizado. *(RN-24, RF-04.09, RF-06.08)*
- **FR-009**: El sistema DEBE permitir elegir solo programas con vacantes en la submodalidad. *(RF-04.11)*
- **FR-010**: El sistema DEBE generar la ficha de exonerados con QR verificable. *(RF-04.10)*
- **FR-011**: El sistema DEBE gestionar la lista de adjudicados CEPRE y su ventana de inscripción. *(Cronograma ítems 5–6)*
- **FR-012**: El sistema DEBE permitir registrar verificaciones presenciales con responsable. *(Art. 9)*
- **FR-013**: Los documentos del expediente DEBEN ser privados: solo el titular, su evaluador y roles autorizados pueden verlos y descargarlos. *(RF-06.02, RNF-03, Constitución V.1)*
- **FR-014**: El sistema DEBE registrar los datos personales, académicos y complementarios propios de cada submodalidad (p. ej. universidad de origen y créditos aprobados en traslados, disciplina deportiva, comunidad indígena, tipo de discapacidad y adecuaciones). *(RF-04.03)*
- **FR-015**: El sistema DEBE permitir programar evaluaciones especiales por submodalidad cuando la Comisión lo disponga (p. ej. adecuaciones para personas con discapacidad). *(RF-04.12, RN-39)*

### Entidades clave

- **Submodalidad**: código, nombre, variantes, base legal, tasa, si usa la base común de documentos.
- **Requisito documental**: nombre, descripción, artículo, formatos, obligatoriedad, submodalidad.
- **Expediente**: inscripción, estado (Borrador, En revisión, Observado, Autorizado, Rechazado, No subsanado), evaluador, fechas.
- **Documento del expediente**: requisito, archivo, versión, estado (Cargado, Conforme, Observado).
- **Revisión**: evaluador, dictamen, motivo, fecha.
- **Adjudicado CEPRE**: documento, ciclo, programa adjudicado.

## Criterios de éxito

- **SC-001**: Un exonerado completa su expediente sin acudir presencialmente a la Dirección de Admisión.
- **SC-002**: Un evaluador dictamina un expediente típico en menos de 5 minutos.
- **SC-003**: El 100 % de las observaciones tiene motivo registrado y es visible para el postulante.
- **SC-004**: Ningún postulante con expediente no autorizado llega a tener ficha (verificado en pruebas).

## Supuestos

- La Universidad acepta documentos digitalizados para la validación previa; los originales se entregan al obtener la constancia de ingreso (Art. 36–49).
- Los formatos anexos (carta aval, carta de compromiso) se publican como descargables.

## Fuera de alcance

- Verificación automática contra SUNEDU, SISDENA o CONADIS (posible integración futura).

## Estado de los requisitos (28/10/2026)

21 de 21 requisitos del catálogo citados en esta funcionalidad están implementados y probados. Fuente: [matriz de trazabilidad](../../docs/trazabilidad-requisitos.md).

| RF | Estado | Detalle |
|---|---|---|
| RF-04.01 | ✅ | Modalidad Exonerados y submodalidad (categoría) en el formulario de inscripción |
| RF-04.02 | ✅ | Requisitos de la submodalidad listados en el expediente, con artículo y formatos |
| RF-04.03 | ✅ | Datos complementarios por submodalidad (p. ej. puesto, ámbito, logro deportivo) |
| RF-04.04 | ✅ | Carga de cada documento sustentatorio en línea (PDF, JPG o PNG) |
| RF-04.05 | ✅ | Firma del archivo, 5 MB, PDF íntegro y sin cifrar, imagen completa y SHA-256 |
| RF-04.06 | ✅ | Bandeja del evaluador en el panel (permiso expedientes.evaluar) |
| RF-04.07 | ✅ | Autorizar, observar o rechazar con motivo; auditado |
| RF-04.08 | ✅ | Subsanación en 72 horas; vencido el plazo pasa a «No subsanado» |
| RF-04.09 | ✅ | El pago queda bloqueado hasta autorizar el expediente (DOSSIER_NOT_AUTHORIZED) |
| RF-04.10 | ✅ | Autorizado y pagado: la inscripción pasa a Apta y se habilita la ficha con QR |
| RF-04.11 | ✅ | Criterios de evaluación por submodalidad editables; se muestran en «Requisitos» y a la Comisión en el expediente |
| RF-04.12 | ✅ | Evaluación especial programada desde el panel y visible para el postulante |
| RF-06.01 | ✅ | Documentos por submodalidad (obligatorios u opcionales) editables en el panel |
| RF-06.02 | ✅ | Visualizar y descargar cada documento desde el panel (descarga auditada) |
| RF-06.03 | ✅ | Reparto equitativo entre evaluadores activos y reasignación manual |
| RF-06.04 | ✅ | Observación por documento con nota obligatoria |
| RF-06.05 | ✅ | Correo al enviar y al dictaminar, con los documentos observados y el plazo |
| RF-06.06 | ✅ | Versiones de cada documento (la anterior queda «Reemplazado») e historial del expediente |
| RF-06.07 | ✅ | Dictamen de autorización o rechazo con justificación |
| RF-06.08 | ✅ | Autorizar exige todos los documentos obligatorios conformes |
| RF-14.03 | ✅ | Documentos exigidos de la convocatoria editables (nombre, contenido, artículo y formatos) |

✅ implementado y probado · 🟡 parcial (lo que falta depende de un servicio externo o está anotado) · ⏳ pendiente
