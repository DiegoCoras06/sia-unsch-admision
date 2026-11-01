# Requisitos — Inscripción en la modalidad Ordinario

> **SDD (Spec-Driven Development) · artefacto 1 de 3: requisitos** (qué y por qué).
> Siguiente: [design.md](design.md) (cómo) · [tasks.md](tasks.md) (tareas). Principios: [constitución](../../.specify/memory/constitution.md).

**Rama:** `003-inscripcion-ordinaria`
**Creada:** 25/10/2026
**Estado:** En revisión
**Módulos de arquitectura:** M03 Inscripción ordinaria, M05 Pagos (orden), M06 Expedientes (foto)
**Entrada:** "Que el postulante se inscriba en línea por pasos, suba su foto, vea cuánto paga, y tenga su ficha con QR apenas se confirme el pago. También la reinscripción de exonerados no admitidos."

## Aclaraciones

### Sesión 25/10/2026 (ADR-015)

- P: ¿El postulante necesita una cuenta para inscribirse? → R: **No.** La inscripción es un **formulario público** en `/inscripcion`; el seguimiento es con **DNI + código de postulante** en `/mi-inscripcion`. Donde esta especificación dice "con cuenta activa" o "abro mi panel", se lee "en el formulario público" y "en Mi inscripción".
- P: ¿Qué campos tiene el formulario? → R: Los del formulario oficial, en tres secciones:
  - **Información básica:** tipo de documento (DNI o carné de extranjería), número (**el DNI autocompleta apellido paterno, apellido materno y nombres**), sexo, estado civil, lugar de nacimiento (departamento, provincia, distrito), dirección actual, lugar de residencia (departamento, provincia, distrito), fecha de nacimiento, dependencia económica, teléfono, celular, correo electrónico y fotografía con sus indicaciones.
  - **Información académica:** lugar del colegio de egreso (departamento, provincia, distrito), nombre del colegio y su gestión (estatal o particular), año en que culminó o culminará, si cursa 4.º de secundaria o inferior, tipo de preparación y número de veces que postula.
  - **Información de postulante:** modalidad, tipo (submodalidad), sede, área y programa de estudio.
- P: ¿Qué mejoras propias se agregan? → R: Tasa calculada en vivo con su concepto legal, vacantes del programa en la modalidad elegida, recorte automático de la foto a 240 × 320 px con guía, condición de pago especial (servicio militar, vínculo familiar) y declaración jurada antes de guardar.
- P: ¿Qué se entrega en esta iteración? → R: Historias 1 a 4 (formulario, foto, confirmación con orden de pago y seguimiento con DNI + código). El pago en línea (005) y la ficha PDF con QR (Historia 5) siguen pendientes; mientras tanto el estado queda en **Pendiente de pago**.

## Escenarios de usuario y pruebas

### Historia 1 — Inscribirme por pasos con guardado automático (Prioridad: P1)

Como postulante con cuenta activa, quiero completar mi inscripción en un asistente por pasos que guarde mi avance, para terminarla aunque se corte la conexión (MEJ-03).

**Pasos del asistente:** 1) Modalidad → 2) Datos personales y de contacto → 3) Datos académicos → 4) Programa de estudios → 5) Fotografía → 6) Resumen y declaración jurada.

**Por qué esta prioridad:** es el núcleo del sistema.

**Prueba independiente:** completar el asistente con un postulante de prueba y obtener la orden de pago.

**Escenarios de aceptación:**

1. **Dado** que la inscripción ordinaria está en curso, **cuando** elijo "Ordinario", **entonces** veo el asistente con el paso 1 completado y mis datos de identidad precargados de mi cuenta.
2. **Dado** que completo hasta el paso 3 y cierro el navegador, **cuando** vuelvo a entrar, **entonces** retomo en el paso 4 con mis datos guardados.
3. **Dado** que en datos académicos indico colegio particular, **cuando** avanzo, **entonces** el monto calculado es S/ 300.00 (o S/ 365.00 en periodo extemporáneo).
4. **Dado** que indico "cursando 5.º de secundaria", **cuando** avanzo, **entonces** veo el aviso de que debo presentar el certificado completo hasta el 15/01/2027 (RN-13).
5. **Dado** que indico "cursando 4.º de secundaria o menos", **cuando** avanzo, **entonces** se me informa que puedo rendir el examen **sin derecho a vacante** y debo confirmarlo expresamente.
6. **Dado** que la inscripción ordinaria (regular y extemporánea) está cerrada, **cuando** intento iniciar, **entonces** el sistema me informa las fechas y no permite continuar.

---

### Historia 2 — Subir una fotografía válida (Prioridad: P1)

Como postulante, quiero saber al instante si mi foto cumple las reglas, para que mi inscripción no sea observada (hoy hay listas públicas de "fotografía incorrecta").

**Escenarios de aceptación:**

1. **Dado** una foto JPG de 240 × 320 px y fondo claro, **cuando** la subo, **entonces** se acepta y veo cómo aparecerá en la ficha.
2. **Dado** una foto PNG, de otro tamaño o mayor a 2 MB, **cuando** la subo, **entonces** se rechaza indicando el motivo exacto, y se ofrece recortarla a 240 × 320.
3. **Dado** cualquier foto aceptada, **cuando** avanzo, **entonces** veo la lista de verificación del Art. 17.3 (fondo blanco, sin lentes, sin gorra, vestimenta formal, sin filtros) y debo marcar que la cumple.

---

### Historia 3 — Confirmar con declaración jurada y obtener mi orden de pago (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** el resumen completo, **cuando** lo abro, **entonces** veo todos mis datos, programa, modalidad, foto y monto, con la advertencia: "Después de confirmar no podrás cambiar programa ni modalidad, y los pagos no se devuelven" (RN-06, RN-08).
2. **Dado** que marco la declaración jurada y confirmo, **cuando** el sistema registra la inscripción, **entonces** queda en estado **Pendiente de pago** y se genera una orden con mi código de postulante, monto, concepto y fecha de vencimiento.
3. **Dado** que ya tengo una inscripción confirmada en esta convocatoria, **cuando** intento crear otra, **entonces** el sistema lo impide (RN-06).

---

### Historia 4 — Seguir el estado de mi inscripción (Prioridad: P1)

Como postulante, quiero ver una línea de tiempo con el estado de mi proceso y qué debo hacer a continuación (MEJ-02).

**Etapas de la línea de tiempo:** Inscripción registrada → Pago confirmado → Apto (ficha disponible) → Aula asignada → Examen rendido → Resultado publicado → Constancia de ingreso.

**Escenarios de aceptación:**

1. **Dado** una inscripción pendiente de pago, **cuando** abro mi panel, **entonces** la etapa actual es "Pago" con el botón "Pagar ahora" y el monto.
2. **Dado** que mi pago fue confirmado, **cuando** abro mi panel, **entonces** la etapa actual es "Apto" y puedo descargar mi ficha.
3. **Dado** que mi inscripción fue observada por la foto, **cuando** abro mi panel, **entonces** veo el motivo y las instrucciones de corrección (MEJ-06).

---

### Historia 5 — Descargar mi ficha de inscripción con QR (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** pago confirmado, **cuando** descargo la ficha, **entonces** obtengo un PDF con escudo, convocatoria, código de postulante, nombres, DNI, foto, modalidad, programa, fecha del examen y un código QR.
2. **Dado** el QR de una ficha, **cuando** cualquier persona lo escanea, **entonces** ve una página pública que confirma "Ficha válida", con nombre abreviado, programa y foto, sin DNI completo (MEJ-11).
3. **Dado** una ficha anulada, **cuando** se escanea su QR, **entonces** la página muestra "Ficha no válida".
4. **Dado** que no tengo sesión, **cuando** uso "Imprimir documentos" con DNI y código de postulante, **entonces** también puedo descargar la ficha (compatibilidad con el portal actual).

---

### Historia 6 — Reinscribirme al Ordinario si no ingresé por Exonerados (Prioridad: P2)

Como exonerado no admitido, quiero reinscribirme al examen ordinario con mi DNI, sin volver a llenar todo (RN-16).

**Escenarios de aceptación:**

1. **Dado** que no alcancé vacante en el examen de exonerados y no soy traslado ni graduado, **cuando** ingreso entre el 16 y el 17/11/2026, **entonces** veo "Reinscribirme al Ordinario" con mis datos precargados y monto S/ 180.00.
2. **Dado** que mi submodalidad fue traslado o graduado/titulado, **cuando** intento reinscribirme, **entonces** el sistema lo impide citando el Art. 21.
3. **Dado** que estoy reinscrito, **cuando** elijo el programa, **entonces** puedo elegir cualquier programa con vacantes ordinarias.

---

### Historia 7 — Solicitar anulación de mi inscripción (Prioridad: P3)

**Escenarios de aceptación:**

1. **Dado** una inscripción confirmada, **cuando** solicito anularla, **entonces** el sistema advierte que el pago no se devuelve y que podré inscribirme de nuevo pagando la tasa completa (Art. 17.5).

### Casos límite

- El postulante inicia en periodo regular y confirma en periodo extemporáneo → el monto se recalcula al confirmar y se le avisa del recargo.
- La orden de pago vence sin pago → la inscripción vuelve a "Borrador confirmable" y puede generar una nueva orden si la etapa sigue abierta.
- Dos pestañas abiertas editando el mismo borrador → prevalece el último guardado y se avisa en la otra pestaña.
- El postulante es menor de edad → se solicita nombre del apoderado (dato opcional) para contacto.
- El colegio no figura en el buscador → se permite ingresar el nombre manualmente indicando región y tipo de gestión.

## Requisitos

### Requisitos funcionales

- **FR-001**: El sistema DEBE habilitar la inscripción ordinaria solo durante las etapas regular y extemporánea del cronograma. *(RF-01.07)*
- **FR-002**: El sistema DEBE presentar un asistente de 6 pasos con datos personales, de contacto, académicos (colegio, gestión, región, año de egreso, grado actual), programa y foto. *(RF-03.01, RF-03.02, RF-03.03)*
- **FR-003**: El sistema DEBE guardar automáticamente el borrador en cada paso: sin cuenta, en el dispositivo; con la cuenta opcional, en el servidor (enmienda de ADR-015). *(RF-03.06)*
- **FR-004**: El sistema DEBE validar la fotografía: JPG, 240 × 320 px, máximo 2 MB, con lista de verificación del Art. 17.3. *(RN-22, RF-03.05)*
- **FR-005**: El sistema DEBE calcular el monto según la regla de tasas, incluyendo descuentos militares, vínculo familiar y recargo extemporáneo. *(RF-03.07, RF-05.01)*
- **FR-006**: El sistema DEBE exigir aceptación de declaración jurada antes de confirmar y bloquear luego cambios de programa y modalidad. *(RN-06, RN-20)*
- **FR-007**: El sistema DEBE impedir más de una inscripción activa por postulante y convocatoria. *(RF-02.03, RN-06)*
- **FR-008**: El sistema DEBE generar una orden de pago única por inscripción. *(RF-05.02)*
- **FR-009**: El sistema DEBE cambiar la inscripción a **Apta** solo cuando el pago esté confirmado por el servidor y no haya observaciones pendientes. *(RF-03.08)*
- **FR-010**: El sistema DEBE generar la ficha de inscripción en PDF con QR verificable públicamente. *(RF-03.09, MEJ-11)*
- **FR-011**: El sistema DEBE mostrar al postulante la línea de tiempo de su proceso y la siguiente acción. *(RF-03.10, MEJ-02)*
- **FR-012**: El sistema DEBE permitir descargar la ficha con DNI + código de postulante sin sesión. *(compatibilidad portal actual)*
- **FR-013**: El sistema DEBE permitir la reinscripción de exonerados no admitidos, excepto traslados y graduados, solo en su etapa, con tasa S/ 180.00. *(RN-16)*
- **FR-014**: El sistema DEBE registrar la condición "rinde sin derecho a vacante" para estudiantes de 4.º de secundaria o menos. *(RN-13)*
- **FR-015**: El sistema DEBE permitir solicitar la anulación de la inscripción con advertencia de no devolución. *(Art. 17.5, RN-08)*
- **FR-016**: El sistema DEBE validar los requisitos de inscripción de la convocatoria antes de confirmar: DNI vigente, no inhabilitado, no ser personal del proceso, no ser graduado de universidad pública (RN-11) y, si ingresó antes a la UNSCH, adjuntar la resolución de renuncia (RN-10). *(RF-03.04, RN-09)*

### Entidades clave

- **Inscripción**: postulante, convocatoria, modalidad, programa, estado, monto, condición especial (sin derecho a vacante, reinscripción), fecha de confirmación.
- **Borrador de inscripción**: datos parciales y último paso completado.
- **Datos académicos**: colegio, gestión (estatal/particular), ubicación, año de egreso, grado actual.
- **Fotografía**: archivo privado, estado de validación.
- **Ficha de inscripción**: documento generado, código de verificación, estado (válida/anulada).

## Criterios de éxito

- **SC-001**: El 90 % de los postulantes de prueba completa la inscripción en menos de 10 minutos.
- **SC-002**: Las observaciones por fotografía incorrecta se reducen al menos 70 % frente al proceso manual (medido en piloto).
- **SC-003**: La ficha está disponible en menos de 1 minuto tras la confirmación del pago (hoy: 24 horas).
- **SC-004**: 0 inscripciones duplicadas en pruebas de concurrencia.

## Supuestos

- El catálogo de colegios se carga desde una lista pública del MINEDU (ESCALE) o se permite ingreso manual.
- La validación de "fondo blanco" es asistida por el postulante; la revisión final la hace Admisión.

## Fuera de alcance

- Cobro y confirmación del pago (ver `005-pagos`).
- Asignación de aula (ver `006-examen-aulas`).

## Estado de los requisitos (28/10/2026)

14 de 14 requisitos del catálogo citados en esta funcionalidad están implementados y probados. Fuente: [matriz de trazabilidad](../../docs/trazabilidad-requisitos.md).

| RF | Estado | Detalle |
|---|---|---|
| RF-01.07 | ✅ | La inscripción se abre y cierra según la etapa (STAGE_CLOSED) |
| RF-02.03 | ✅ | Una inscripción por DNI y convocatoria; registro de inhabilitados |
| RF-03.01 | ✅ | Formulario con modalidad Ordinario |
| RF-03.02 | ✅ | Formulario oficial: información básica, académica y de postulante |
| RF-03.03 | ✅ | Selección de programa con vacantes en vivo |
| RF-03.04 | ✅ | Valida etapa, inhabilitados, vacantes, ubigeo, fechas y 4.º grado en el servidor |
| RF-03.05 | ✅ | Foto 240 × 320 y documentos adicionales (DNI, estudios, servicio militar, vínculo UNSCH) en «Imprimir documentos»; visibles en el panel |
| RF-03.06 | ✅ | Borrador automático en el dispositivo (sin foto); «Continuar donde me quedé» |
| RF-03.07 | ✅ | Tasa calculada en el servidor según la Tabla 3 |
| RF-03.08 | ✅ | La inscripción queda Apta solo con el pago confirmado por el servidor |
| RF-03.09 | ✅ | Ficha PDF con foto, código y QR firmado; verificación pública sin DNI completo |
| RF-03.10 | ✅ | Estado de la inscripción y descarga de la ficha en «Imprimir documentos» y «Mi cuenta» |
| RF-05.01 | ✅ | Simulador y cálculo de tasa en el servidor |
| RF-05.02 | ✅ | Orden única por inscripción, con número de pedido por intento |

✅ implementado y probado · 🟡 parcial (lo que falta depende de un servicio externo o está anotado) · ⏳ pendiente
