# Trazabilidad de requerimientos funcionales

Los **143 requerimientos** de los **14 módulos** (fuente: [guía maestra](fuentes/guia-maestra-arquitectura-implementacion-unsch.md)) enlazados con la spec y el requisito FR que los cubre, y su estado en el código.
Esta matriz conserva la numeración del catálogo original. El sistema trabaja con 12 módulos: la equivalencia está en el [diseño interno](03-diseño-de-software/diseño-interno-modulos.md).

Generado con `node scripts/trazabilidad.mjs`; el estado se actualiza al cerrar cada paso.

✅ implementado y probado · 🟡 parcial (lo que falta está anotado) · ⏳ especificado, pendiente de implementar

## Resumen por módulo

| Módulo | RF | ✅ | 🟡 | ⏳ | Specs |
|---|--:|--:|--:|--:|---|
| M01. Gestión de convocatorias y procesos de admisión | 8 | 8 | 0 | 0 | 001, 003, 008 |
| M02. Registro de usuarios y validación de identidad | 8 | 8 | 0 | 0 | 002, 003 |
| M03. Inscripción de postulantes – Modalidad Ordinaria | 10 | 10 | 0 | 0 | 003 |
| M04. Inscripción de postulantes – Modalidad Exonerados | 12 | 12 | 0 | 0 | 004 |
| M05. Gestión de pagos y pasarela de pagos | 12 | 12 | 0 | 0 | 001, 003, 005 |
| M06. Gestión y validación de expedientes | 8 | 8 | 0 | 0 | 004 |
| M07. Programación y gestión de exámenes de admisión | 9 | 9 | 0 | 0 | 006 |
| M08. Gestión de sedes, aulas y distribución de postulantes | 9 | 9 | 0 | 0 | 006 |
| M09. Procesamiento, publicación y consulta de resultados | 12 | 12 | 0 | 0 | 007 |
| M10. Chatbot inteligente de orientación y seguimiento – OpenRouter API | 16 | 15 | 1 | 0 | 009 |
| M11. Notificaciones y comunicaciones | 9 | 8 | 1 | 0 | 010 |
| M12. Reportes, estadísticas y panel de control | 10 | 10 | 0 | 0 | 001, 008 |
| M13. Administración, roles y seguridad | 10 | 10 | 0 | 0 | 002, 008 |
| M14. Configuración general e integraciones | 10 | 6 | 4 | 0 | 001, 004, 008 |
| **Total** | **143** | **137** | **6** | **0** | |

## M01. Gestión de convocatorias y procesos de admisión

**Objetivo:** Administrar las convocatorias de admisión, modalidades, cronogramas, programas profesionales y vacantes.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-01.01 | El sistema debe permitir crear, modificar y administrar procesos de admisión por año y periodo académico. | [001](../specs/001-portal-publico/requirements.md) FR-001, [008](../specs/008-panel-administrativo/requirements.md) FR-001 | ✅ Crear (copiando una convocatoria), modificar y administrar desde el panel |
| RF-01.02 | El sistema debe permitir configurar las modalidades de admisión Ordinaria y Exonerados, incluyendo sus categorías o submodalidades autorizadas. | [008](../specs/008-panel-administrativo/requirements.md) FR-001 | ✅ Modalidades, submodalidades y tipos de vacante editables en «Catálogo del concurso», con auditoría |
| RF-01.03 | El sistema debe permitir registrar las fechas de inscripción, pago, subsanación, evaluación, examen y publicación de resultados. | [001](../specs/001-portal-publico/requirements.md) FR-002, [008](../specs/008-panel-administrativo/requirements.md) FR-001 | ✅ Fechas de cada etapa editables, validadas y auditadas |
| RF-01.04 | El sistema debe permitir administrar las escuelas profesionales, facultades y áreas académicas. | [001](../specs/001-portal-publico/requirements.md) FR-004, [008](../specs/008-panel-administrativo/requirements.md) FR-001 | ✅ Facultades, áreas y programas editables en «Catálogo del concurso», con auditoría |
| RF-01.05 | El sistema debe permitir configurar el número de vacantes por escuela profesional y modalidad. | [001](../specs/001-portal-publico/requirements.md) FR-004, [008](../specs/008-panel-administrativo/requirements.md) FR-001, [008](../specs/008-panel-administrativo/requirements.md) FR-002 | ✅ Vacantes editables por programa y categoría, con resolución si está publicada |
| RF-01.06 | El sistema debe publicar convocatorias, reglamentos, requisitos, temarios y cronogramas. | [001](../specs/001-portal-publico/requirements.md) FR-001, [001](../specs/001-portal-publico/requirements.md) FR-007 | ✅ Portal: convocatoria, reglamento y requisitos como PDF, temario y cronograma |
| RF-01.07 | El sistema debe controlar automáticamente la apertura y cierre de las inscripciones según las fechas establecidas. | [001](../specs/001-portal-publico/requirements.md) FR-002, [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-001 | ✅ La inscripción se abre y cierra según la etapa (STAGE_CLOSED) |
| RF-01.08 | El sistema debe permitir publicar comunicados, modificaciones y fe de erratas. | [001](../specs/001-portal-publico/requirements.md) FR-008, [008](../specs/008-panel-administrativo/requirements.md) FR-010 | ✅ Comunicados y fe de erratas publicados desde el panel |

## M02. Registro de usuarios y validación de identidad

**Objetivo:** Garantizar el registro seguro y la identificación de los postulantes.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-02.01 | El sistema debe permitir el registro de postulantes mediante DNI, correo electrónico y número de celular. | [002](../specs/002-cuentas-identidad/requirements.md) FR-001 | ✅ Inscripción y cuenta opcional con DNI, correo y celular |
| RF-02.02 | El sistema debe validar los datos de identidad mediante integración autorizada con RENIEC. | [002](../specs/002-cuentas-identidad/requirements.md) FR-002 | ✅ Consulta de DNI con apiperu.dev (token solo en el servidor): autocompleta nombres y apellidos; si no responde, el postulante los escribe |
| RF-02.03 | El sistema debe verificar que el postulante no tenga una inscripción incompatible o duplicada dentro del mismo proceso. | [002](../specs/002-cuentas-identidad/requirements.md) FR-003, [002](../specs/002-cuentas-identidad/requirements.md) FR-004, [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-007 | ✅ Una inscripción por DNI y convocatoria; registro de inhabilitados |
| RF-02.04 | El sistema debe permitir crear una cuenta con credenciales seguras. | [002](../specs/002-cuentas-identidad/requirements.md) FR-005 | ✅ Cuenta opcional con contraseña segura (argon2, mínimo 10 caracteres, lista de comunes) |
| RF-02.05 | El sistema debe permitir iniciar sesión, cerrar sesión y recuperar contraseñas. | [002](../specs/002-cuentas-identidad/requirements.md) FR-007 | ✅ Ingresar, cerrar sesión (también en todos los dispositivos) y recuperar la contraseña por correo |
| RF-02.06 | El sistema debe verificar el correo electrónico mediante un código de confirmación. | [002](../specs/002-cuentas-identidad/requirements.md) FR-006 | ✅ Código de 6 dígitos por correo al crear la cuenta y al cambiar de correo |
| RF-02.07 | El sistema debe permitir actualizar datos de contacto, dirección y otros datos editables. | [002](../specs/002-cuentas-identidad/requirements.md) FR-011 | ✅ «Mi cuenta»: correo, celular, dirección y apoderado |
| RF-02.08 | El sistema debe generar un identificador único de postulante y registrar sus actividades principales. | [002](../specs/002-cuentas-identidad/requirements.md) FR-010, [002](../specs/002-cuentas-identidad/requirements.md) FR-012 | ✅ Código de postulante con dígito Luhn y auditoría de actividades |

## M03. Inscripción de postulantes – Modalidad Ordinaria

**Objetivo:** Digitalizar la inscripción de postulantes que participan en el examen ordinario.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-03.01 | El sistema debe permitir seleccionar la modalidad de admisión Ordinaria. | [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-002 | ✅ Formulario con modalidad Ordinario |
| RF-03.02 | El sistema debe presentar un formulario de inscripción con datos personales, académicos y de contacto. | [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-002 | ✅ Formulario oficial: información básica, académica y de postulante |
| RF-03.03 | El sistema debe permitir seleccionar el programa de estudios al que desea postular. | [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-002 | ✅ Selección de programa con vacantes en vivo |
| RF-03.04 | El sistema debe validar los requisitos de inscripción definidos en la convocatoria. | [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-016 | ✅ Valida etapa, inhabilitados, vacantes, ubigeo, fechas y 4.º grado en el servidor |
| RF-03.05 | El sistema debe permitir adjuntar fotografía y documentos requeridos en formatos autorizados. | [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-004 | ✅ Foto 240 × 320 y documentos adicionales (DNI, estudios, servicio militar, vínculo UNSCH) en «Imprimir documentos»; visibles en el panel |
| RF-03.06 | El sistema debe guardar inscripciones incompletas como borrador para continuarlas posteriormente. | [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-003 | ✅ Borrador automático en el dispositivo (sin foto); «Continuar donde me quedé» |
| RF-03.07 | El sistema debe calcular el derecho de inscripción correspondiente según las reglas de la convocatoria. | [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-005 | ✅ Tasa calculada en el servidor según la Tabla 3 |
| RF-03.08 | El sistema debe permitir confirmar la inscripción una vez validado el pago y los requisitos aplicables. | [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-009 | ✅ La inscripción queda Apta solo con el pago confirmado por el servidor |
| RF-03.09 | El sistema debe generar una ficha de inscripción en formato PDF con código único y código QR verificable. | [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-010 | ✅ Ficha PDF con foto, código y QR firmado; verificación pública sin DNI completo |
| RF-03.10 | El sistema debe mostrar el estado de inscripción y permitir descargar la ficha cuando esté habilitada. | [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-011 | ✅ Estado de la inscripción y descarga de la ficha en «Imprimir documentos» y «Mi cuenta» |

## M04. Inscripción de postulantes – Modalidad Exonerados

**Objetivo:** Gestionar la inscripción y evaluación de postulantes que acceden mediante las submodalidades especiales autorizadas por la universidad.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-04.01 | El sistema debe permitir seleccionar la modalidad Exonerados y la submodalidad correspondiente. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-001 | ✅ Modalidad Exonerados y submodalidad (categoría) en el formulario de inscripción |
| RF-04.02 | El sistema debe mostrar los requisitos específicos según la submodalidad seleccionada. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-002 | ✅ Requisitos de la submodalidad listados en el expediente, con artículo y formatos |
| RF-04.03 | El sistema debe permitir registrar información personal, académica y datos complementarios. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-014 | ✅ Datos complementarios por submodalidad (p. ej. puesto, ámbito, logro deportivo) |
| RF-04.04 | El sistema debe permitir adjuntar certificados, constancias, resoluciones y otros documentos sustentatorios. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-003 | ✅ Carga de cada documento sustentatorio en línea (PDF, JPG o PNG) |
| RF-04.05 | El sistema debe validar la integridad y formato de los documentos cargados. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-003 | ✅ Firma del archivo, 5 MB, PDF íntegro y sin cifrar, imagen completa y SHA-256 |
| RF-04.06 | El sistema debe permitir que un evaluador autorizado revise los expedientes. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-005 | ✅ Bandeja del evaluador en el panel (permiso expedientes.evaluar) |
| RF-04.07 | El sistema debe permitir aprobar, observar o rechazar expedientes, registrando el motivo. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-005 | ✅ Autorizar, observar o rechazar con motivo; auditado |
| RF-04.08 | El sistema debe permitir subsanar observaciones dentro de los plazos establecidos. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-007 | ✅ Subsanación en 72 horas; vencido el plazo pasa a «No subsanado» |
| RF-04.09 | El sistema debe verificar el cumplimiento de los requisitos antes de habilitar las siguientes etapas. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-008 | ✅ El pago queda bloqueado hasta autorizar el expediente (DOSSIER_NOT_AUTHORIZED) |
| RF-04.10 | El sistema debe generar la ficha de inscripción de exonerados una vez cumplidas las condiciones. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-010 | ✅ Autorizado y pagado: la inscripción pasa a Apta y se habilita la ficha con QR |
| RF-04.11 | El sistema debe administrar las vacantes y criterios de evaluación específicos de cada submodalidad. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-009 | ✅ Criterios de evaluación por submodalidad editables; se muestran en «Requisitos» y a la Comisión en el expediente |
| RF-04.12 | El sistema debe permitir la programación de evaluaciones o exámenes especiales cuando corresponda. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-015 | ✅ Evaluación especial programada desde el panel y visible para el postulante |

## M05. Gestión de pagos y pasarela de pagos

**Objetivo:** Automatizar el cobro de derechos de inscripción y la confirmación de las transacciones.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-05.01 | El sistema debe calcular automáticamente el monto a pagar según modalidad, categoría y tasa vigente. | [001](../specs/001-portal-publico/requirements.md) FR-006, [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-005, [005](../specs/005-pagos/requirements.md) FR-001 | ✅ Simulador y cálculo de tasa en el servidor |
| RF-05.02 | El sistema debe generar una orden de pago única asociada al postulante y proceso. | [003](../specs/003-inscripcion-ordinaria/requirements.md) FR-008, [005](../specs/005-pagos/requirements.md) FR-002 | ✅ Orden única por inscripción, con número de pedido por intento |
| RF-05.03 | El sistema debe integrarse con una pasarela de pagos autorizada que admita los medios habilitados por la universidad. | [005](../specs/005-pagos/requirements.md) FR-003, [005](../specs/005-pagos/requirements.md) FR-013 | ✅ Culqi integrado (ADR-024): tarjeta y Yape en el mismo formulario; pasarela simulada para desarrollo y pruebas |
| RF-05.04 | El sistema debe redirigir al postulante a un entorno seguro de pago o utilizar un formulario de pago certificado. | [005](../specs/005-pagos/requirements.md) FR-003, [005](../specs/005-pagos/requirements.md) FR-013 | ✅ Formulario de Culqi Checkout; la tarjeta nunca pasa por el servidor, que solo recibe un token |
| RF-05.05 | El sistema debe recibir confirmaciones de pago mediante notificaciones seguras del proveedor, como webhooks. | [005](../specs/005-pagos/requirements.md) FR-004 | ✅ El servidor cobra el token en Culqi y su respuesta, servidor a servidor, confirma el pago; no depende del navegador |
| RF-05.06 | El sistema debe actualizar automáticamente el estado del pago después de verificar la transacción. | [005](../specs/005-pagos/requirements.md) FR-004, [005](../specs/005-pagos/requirements.md) FR-013 | ✅ Solo el cargo creado por el servidor con la llave secreta confirma el pago; monto y moneda se verifican contra la orden |
| RF-05.07 | El sistema debe registrar el identificador de operación, monto, fecha, medio y estado del pago. | [005](../specs/005-pagos/requirements.md) FR-006 | ✅ Intento con transacción, operación, autorización, medio, monto, fecha y estado |
| RF-05.08 | El sistema debe generar una constancia de pago y permitir su descarga, diferenciándola del comprobante tributario cuando corresponda. | [005](../specs/005-pagos/requirements.md) FR-008 | ✅ Constancia de pago en «Imprimir documentos» (no es comprobante SUNAT) |
| RF-05.09 | El sistema debe evitar pagos duplicados y gestionar operaciones pendientes, rechazadas o expiradas. | [005](../specs/005-pagos/requirements.md) FR-005, [005](../specs/005-pagos/requirements.md) FR-011 | ✅ Un intento se cobra una sola vez, intentos vencidos y pagos duplicados marcados |
| RF-05.10 | El sistema debe permitir consultar el historial de transacciones del postulante. | [005](../specs/005-pagos/requirements.md) FR-009 | ✅ Historial de intentos con DNI + código |
| RF-05.11 | El sistema debe permitir al personal autorizado conciliar los pagos registrados con los reportes del proveedor y tesorería. | [005](../specs/005-pagos/requirements.md) FR-007 | ✅ Conciliación con el reporte de Culqi, banco o Tesorería: conciliado, diferencias de monto o estado, solo en reporte o en sistema; resolución auditada |
| RF-05.12 | El sistema debe gestionar devoluciones o anulaciones conforme a las reglas institucionales y del proveedor. | [005](../specs/005-pagos/requirements.md) FR-010 | ✅ Anulación o devolución solo por error de cobro (RN-08), con resolución y aprobación de otra persona; el dinero lo mueve Tesorería |

## M06. Gestión y validación de expedientes

**Objetivo:** Centralizar la revisión documental de los postulantes de ambas modalidades.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-06.01 | El sistema debe permitir administrar los documentos obligatorios según la modalidad y convocatoria. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-002 | ✅ Documentos por submodalidad (obligatorios u opcionales) editables en el panel |
| RF-06.02 | El sistema debe permitir visualizar y descargar los expedientes de postulantes autorizados. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-013 | ✅ Visualizar y descargar cada documento desde el panel (descarga auditada) |
| RF-06.03 | El sistema debe asignar expedientes a evaluadores según criterios de distribución. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-004 | ✅ Reparto equitativo entre evaluadores activos y reasignación manual |
| RF-06.04 | El sistema debe permitir registrar observaciones específicas por documento. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-005 | ✅ Observación por documento con nota obligatoria |
| RF-06.05 | El sistema debe notificar al postulante cuando su expediente requiera subsanación. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-006 | ✅ Correo al enviar y al dictaminar, con los documentos observados y el plazo |
| RF-06.06 | El sistema debe mantener el historial de versiones y revisiones documentales. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-007 | ✅ Versiones de cada documento (la anterior queda «Reemplazado») e historial del expediente |
| RF-06.07 | El sistema debe permitir aprobar o rechazar el expediente con una justificación. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-005 | ✅ Dictamen de autorización o rechazo con justificación |
| RF-06.08 | El sistema debe impedir la habilitación para el examen cuando existan requisitos obligatorios pendientes. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-008 | ✅ Autorizar exige todos los documentos obligatorios conformes |

## M07. Programación y gestión de exámenes de admisión

**Objetivo:** Administrar las fechas, sesiones, características y condiciones de los exámenes.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-07.01 | El sistema debe permitir crear exámenes asociados a cada proceso y modalidad. | [006](../specs/006-examen-aulas/requirements.md) FR-001 | ✅ Exámenes por convocatoria y modalidad (Exonerados y Ordinario sembrados del cronograma) |
| RF-07.02 | El sistema debe permitir configurar fecha, hora de inicio, duración y lugar de evaluación. | [006](../specs/006-examen-aulas/requirements.md) FR-001 | ✅ Fecha, apertura y cierre del ingreso, duración y lugar editables en el panel |
| RF-07.03 | El sistema debe permitir definir las áreas académicas y reglas de evaluación. | [006](../specs/006-examen-aulas/requirements.md) FR-002 | ✅ Estructura por áreas y reparto de las preguntas de conocimientos por curso del temario (la suma se valida) |
| RF-07.04 | El sistema debe permitir configurar los criterios de calificación y puntajes conforme al reglamento. | [006](../specs/006-examen-aulas/requirements.md) FR-002 | ✅ Puntos por pregunta, factor por área, máximo y mínimo configurables (RN-31 a RN-34) |
| RF-07.05 | El sistema debe generar una relación de postulantes habilitados para rendir el examen. | [006](../specs/006-examen-aulas/requirements.md) FR-003 | ✅ Relación de aptos (pago confirmado y expediente autorizado) en el panel y en PDF |
| RF-07.06 | El sistema debe permitir programar sesiones diferenciadas para Ordinarios y Exonerados. | [006](../specs/006-examen-aulas/requirements.md) FR-001 | ✅ Sesiones diferenciadas por modalidad; una modalidad no puede estar en dos exámenes |
| RF-07.07 | El sistema debe controlar que las fechas y sesiones no presenten conflictos de programación. | [006](../specs/006-examen-aulas/requirements.md) FR-004 | ✅ Rechaza aulas compartidas por exámenes con horarios que se cruzan (SCHEDULE_CONFLICT) |
| RF-07.08 | El sistema debe publicar las indicaciones, materiales permitidos y horarios de ingreso al examen. | [006](../specs/006-examen-aulas/requirements.md) FR-005 | ✅ Indicaciones, lo que se lleva, lo prohibido y horario de ingreso en «Buscar aula» y en la ficha |
| RF-07.09 | El sistema debe permitir registrar reprogramaciones autorizadas y notificar a los afectados. | [006](../specs/006-examen-aulas/requirements.md) FR-012 | ✅ Reprogramación con motivo obligatorio y correo a cada postulante con aula publicada |

## M08. Gestión de sedes, aulas y distribución de postulantes

**Objetivo:** Organizar la asignación de postulantes a las sedes y aulas del examen.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-08.01 | El sistema debe permitir registrar sedes, pabellones, pisos y aulas de evaluación. | [006](../specs/006-examen-aulas/requirements.md) FR-006 | ✅ Sedes, pabellones, pisos y aulas en el panel (semilla ilustrativa de la Ciudad Universitaria) |
| RF-08.02 | El sistema debe permitir configurar la capacidad máxima de cada aula. | [006](../specs/006-examen-aulas/requirements.md) FR-006 | ✅ Capacidad máxima por aula; no baja de los asientos ya asignados |
| RF-08.03 | El sistema debe distribuir automáticamente a los postulantes habilitados según capacidad y reglas institucionales. | [006](../specs/006-examen-aulas/requirements.md) FR-007 | ✅ Distribución automática: adecuaciones en aulas accesibles, luego por área y orden alfabético; todo o nada si falta capacidad |
| RF-08.04 | El sistema debe impedir la asignación duplicada de postulantes a una misma sesión. | [006](../specs/006-examen-aulas/requirements.md) FR-007 | ✅ Restricciones únicas en la base: un asiento por postulante y examen, y por aula y número |
| RF-08.05 | El sistema debe permitir consultar el aula asignada mediante DNI o código de postulante, aplicando controles de privacidad. | [006](../specs/006-examen-aulas/requirements.md) FR-009 | ✅ «Buscar aula» con DNI + código, límite de intentos y respuesta genérica; visible desde 24 h antes |
| RF-08.06 | El sistema debe generar una ficha de examen con sede, aula, horario y código QR. | [006](../specs/006-examen-aulas/requirements.md) FR-010 | ✅ Ficha de examen en PDF con puerta, pabellón, piso, aula, asiento, horario y QR firmado |
| RF-08.07 | El sistema debe generar listas de asistencia por aula y sesión. | [006](../specs/006-examen-aulas/requirements.md) FR-010 | ✅ Lista de asistencia por aula en PDF con foto, código y firma |
| RF-08.08 | El sistema debe permitir registrar asistencia, inasistencia e incidencias durante el examen. | [006](../specs/006-examen-aulas/requirements.md) FR-011 | ✅ Ingreso por QR con foto, fuera de hora, ausentes e incidencias; modo sin conexión con cola local y envío con la hora de lectura |
| RF-08.09 | El sistema debe permitir gestionar cambios de aula autorizados y conservar su trazabilidad. | [006](../specs/006-examen-aulas/requirements.md) FR-012 | ✅ Cambio de aula con motivo, historial de versiones y correo al postulante |

## M09. Procesamiento, publicación y consulta de resultados

**Objetivo:** Gestionar las calificaciones y publicar los resultados oficiales de manera segura y transparente.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-09.01 | El sistema debe permitir importar las calificaciones desde archivos estructurados o sistemas de evaluación autorizados. | [007](../specs/007-resultados-ingreso/requirements.md) FR-001 | ✅ Importación del CSV de la lectora óptica desde el panel |
| RF-09.02 | El sistema debe validar la integridad de los registros y detectar inconsistencias antes del procesamiento. | [007](../specs/007-resultados-ingreso/requirements.md) FR-001 | ✅ Validación completa antes de procesar: inexistentes, duplicados, ausentes con nota, fuera de rango y presentes sin registro |
| RF-09.03 | El sistema debe calcular los puntajes finales conforme a los criterios de evaluación configurados. | [007](../specs/007-resultados-ingreso/requirements.md) FR-002 | ✅ Puntaje con puntos y factor configurables por examen, sin descuento por error (RN-31 a RN-34) |
| RF-09.04 | El sistema debe generar el orden de mérito por programa de estudios y modalidad. | [007](../specs/007-resultados-ingreso/requirements.md) FR-003 | ✅ Orden de mérito por programa y categoría (modalidad o submodalidad) |
| RF-09.05 | El sistema debe determinar la condición de ingreso según vacantes y reglas de desempate aprobadas. | [007](../specs/007-resultados-ingreso/requirements.md) FR-004 | ✅ Admitido con mínimo 450 y vacante, empatados del último puesto admitidos, sin traslado entre programas y con vacantes de exonerados al ordinario |
| RF-09.06 | El sistema debe permitir revisar, validar y aprobar los resultados antes de su publicación. | [007](../specs/007-resultados-ingreso/requirements.md) FR-005 | ✅ Borrador → aprobación de la Comisión (otra persona) → publicación |
| RF-09.07 | El sistema debe publicar los resultados oficiales en la fecha y hora autorizadas. | [007](../specs/007-resultados-ingreso/requirements.md) FR-005 | ✅ Visibles desde la fecha y hora aprobadas; aviso por correo al publicarse |
| RF-09.08 | El sistema debe permitir al postulante consultar su puntaje y condición mediante un mecanismo seguro. | [007](../specs/007-resultados-ingreso/requirements.md) FR-006 | ✅ «Ver puntaje» con DNI + código: puntaje, desglose, puesto y condición |
| RF-09.09 | El sistema debe permitir generar reportes de ingresantes, no ingresantes, ausentes y resultados por modalidad. | [007](../specs/007-resultados-ingreso/requirements.md) FR-010 | ✅ Excel y PDF de resultados por condición y de cobertura de vacantes |
| RF-09.10 | El sistema debe permitir descargar constancias de ingreso cuando hayan sido autorizadas. | [007](../specs/007-resultados-ingreso/requirements.md) FR-007 | ✅ Entrega de documentos y recibo de la constancia (S/ 15.00 o con recargo); constancia de ingreso con QR verificable |
| RF-09.11 | El sistema debe conservar versiones de resultados y registrar rectificaciones debidamente aprobadas. | [007](../specs/007-resultados-ingreso/requirements.md) FR-009 | ✅ Versiones: una rectificación exige motivo, reemplaza la publicada y queda en auditoría |
| RF-09.12 | El sistema debe permitir administrar solicitudes de revisión o reclamos dentro de los plazos establecidos. | [007](../specs/007-resultados-ingreso/requirements.md) FR-011 | ✅ Solicitud de revisión por error material como caso de atención (resultados inimpugnables, RN-57) |

## M10. Chatbot inteligente de orientación y seguimiento – OpenRouter API

**Objetivo:** Brindar asistencia automatizada a los postulantes durante todas las etapas del proceso de admisión mediante un chatbot integrado con modelos de inteligencia artificial accesibles a través de OpenRouter.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-10.01 | El sistema debe integrar un chatbot de inteligencia artificial mediante la API de OpenRouter. | [009](../specs/009-chatbot-ia/requirements.md) FR-001 | 🟡 Integrado con OpenRouter (ADR-017, probado con proveedor guionado); falta la clave para usar la IA en vivo; mientras, modo básico |
| RF-10.02 | El chatbot debe responder preguntas sobre convocatorias, modalidades, requisitos, costos, cronogramas y exámenes. | [009](../specs/009-chatbot-ia/requirements.md) FR-002 | ✅ Responde convocatoria, modalidades, requisitos, tasas, cronograma y examen |
| RF-10.03 | El chatbot debe consultar información institucional verificada para responder sobre el proceso de admisión vigente. | [009](../specs/009-chatbot-ia/requirements.md) FR-002 | ✅ Solo con herramientas sobre datos oficiales y base de conocimientos con fuente |
| RF-10.04 | El chatbot debe permitir al postulante autenticado consultar el estado de su inscripción. | [009](../specs/009-chatbot-ia/requirements.md) FR-003 | ✅ Estado de la inscripción con pase firmado (DNI + código) |
| RF-10.05 | El chatbot debe permitir consultar el estado del pago utilizando los servicios internos autorizados. | [009](../specs/009-chatbot-ia/requirements.md) FR-003 | ✅ Estado del pago desde M05 |
| RF-10.06 | El chatbot debe informar si existen documentos pendientes, observados o aprobados. | [009](../specs/009-chatbot-ia/requirements.md) FR-003 | ✅ Informa la fotografía y el estado del expediente con sus observaciones |
| RF-10.07 | El chatbot debe proporcionar información sobre sede, aula y horario asignados cuando estén publicados. | [009](../specs/009-chatbot-ia/requirements.md) FR-003 | ✅ Informa el aula, el asiento y la puerta cuando están publicados |
| RF-10.08 | El chatbot debe orientar sobre la consulta de resultados y mostrar únicamente información autorizada. | [009](../specs/009-chatbot-ia/requirements.md) FR-003 | ✅ Informa el puntaje, el puesto y la condición cuando se publican los resultados |
| RF-10.09 | El chatbot debe ofrecer instrucciones para solucionar incidencias frecuentes de inscripción y pagos. | [009](../specs/009-chatbot-ia/requirements.md) FR-011 | ✅ Incidencias frecuentes de inscripción y pagos en la base de conocimientos |
| RF-10.10 | El chatbot debe derivar consultas complejas o no resueltas a un responsable de soporte. | [009](../specs/009-chatbot-ia/requirements.md) FR-005 | ✅ Derivación a un caso de atención con la conversación |
| RF-10.11 | El sistema debe permitir registrar conversaciones conforme a las políticas de privacidad y retención. | [009](../specs/009-chatbot-ia/requirements.md) FR-006 | ✅ Conversaciones enmascaradas con retención de 90 días |
| RF-10.12 | El administrador debe poder actualizar la base de conocimientos utilizada por el chatbot. | [009](../specs/009-chatbot-ia/requirements.md) FR-007 | ✅ Base de conocimientos editable en el panel; el asistente la usa al instante |
| RF-10.13 | El sistema debe almacenar la API key de OpenRouter exclusivamente en el servidor y nunca exponerla al navegador. | [009](../specs/009-chatbot-ia/requirements.md) FR-008 | ✅ Clave solo en el servidor |
| RF-10.14 | El chatbot debe solicitar autenticación antes de acceder a información personal y limitar sus consultas según los permisos del usuario. | [009](../specs/009-chatbot-ia/requirements.md) FR-003 | ✅ Datos personales solo con pase; el DNI nunca va a la IA |
| RF-10.15 | El sistema debe controlar el consumo de tokens, costos, errores y límites de uso de la API. | [009](../specs/009-chatbot-ia/requirements.md) FR-009 | ✅ Límite por IP, presupuesto diario y registro de tokens, costo y errores |
| RF-10.16 | El chatbot debe indicar cuando no dispone de información verificada y evitar inventar pagos, estados, puntajes o fechas. | [009](../specs/009-chatbot-ia/requirements.md) FR-004 | ✅ Sin herramienta no hay dato: responde que no tiene información verificada |

## M11. Notificaciones y comunicaciones

**Objetivo:** Mantener informado al postulante sobre cada etapa de su proceso.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-11.01 | El sistema debe enviar notificaciones al crear una cuenta y confirmar el correo electrónico. | [010](../specs/010-notificaciones/requirements.md) FR-001 | ✅ Correos de código de verificación y de cuenta creada |
| RF-11.02 | El sistema debe notificar la generación de órdenes y confirmación de pagos. | [010](../specs/010-notificaciones/requirements.md) FR-001 | ✅ Correos de orden generada y pago confirmado, registrados en M11 |
| RF-11.03 | El sistema debe informar cuando una inscripción cambie de estado. | [010](../specs/010-notificaciones/requirements.md) FR-001 | ✅ Correos al pasar a Apta, en cada dictamen, en cambios de aula y al anular la inscripción (con el motivo) |
| RF-11.04 | El sistema debe notificar las observaciones documentales y fechas límite de subsanación. | [010](../specs/010-notificaciones/requirements.md) FR-001 | ✅ Correo con los documentos observados y el plazo de subsanación |
| RF-11.05 | El sistema debe enviar recordatorios de fechas importantes del proceso. | [010](../specs/010-notificaciones/requirements.md) FR-002 | ✅ Recordatorio de pago 2 días antes del cierre y recordatorio la víspera del examen, sin duplicados y con preferencia |
| RF-11.06 | El sistema debe informar cuando se publique la asignación de aulas. | [010](../specs/010-notificaciones/requirements.md) FR-001 | ✅ Aviso único por postulante cuando se publica su aula |
| RF-11.07 | El sistema debe informar cuando los resultados oficiales estén disponibles. | [010](../specs/010-notificaciones/requirements.md) FR-001 | ✅ Aviso de resultados disponibles, sin puntaje en el correo |
| RF-11.08 | El sistema debe permitir enviar comunicados segmentados por modalidad, programa o estado. | [010](../specs/010-notificaciones/requirements.md) FR-003 | ✅ Comunicados por modalidad, programa y estado con enviados, en cola y fallidos |
| RF-11.09 | El sistema debe registrar el estado de envío y entrega de las notificaciones. | [010](../specs/010-notificaciones/requirements.md) FR-004 | 🟡 Registro de cada correo con estado e intentos (hasta 3, sin duplicar); el estado «rebotado» llega con Amazon SES (Paso 11) |

## M12. Reportes, estadísticas y panel de control

**Objetivo:** Proporcionar información para supervisar el proceso de admisión y facilitar la toma de decisiones.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-12.01 | El sistema debe mostrar un panel de control con el número de postulantes registrados, inscritos y habilitados. | [001](../specs/001-portal-publico/requirements.md) FR-011, [008](../specs/008-panel-administrativo/requirements.md) FR-004 | ✅ Panel con inscritos, aptos, recaudación y pendientes |
| RF-12.02 | El sistema debe generar estadísticas de postulantes por modalidad y programa de estudios. | [008](../specs/008-panel-administrativo/requirements.md) FR-004 | ✅ Por modalidad y programa |
| RF-12.03 | El sistema debe mostrar los ingresos recaudados y las transacciones pendientes o rechazadas. | [008](../specs/008-panel-administrativo/requirements.md) FR-004 | ✅ Recaudación, órdenes pendientes, intentos rechazados, vencidos y duplicados |
| RF-12.04 | El sistema debe generar reportes de expedientes aprobados, observados y rechazados. | [008](../specs/008-panel-administrativo/requirements.md) FR-004 | ✅ Expedientes por estado en el panel y exportación a Excel/PDF |
| RF-12.05 | El sistema debe mostrar la ocupación de aulas y distribución de postulantes. | [008](../specs/008-panel-administrativo/requirements.md) FR-004 | ✅ Ocupación por aula en la distribución y por examen en el panel de indicadores |
| RF-12.06 | El sistema debe generar estadísticas de asistencia a exámenes. | [008](../specs/008-panel-administrativo/requirements.md) FR-004 | ✅ Presentes y ausentes por examen y por aula en el panel y exportación a Excel/PDF |
| RF-12.07 | El sistema debe generar reportes de puntajes, ingresantes y cobertura de vacantes. | [008](../specs/008-panel-administrativo/requirements.md) FR-004 | ✅ Resultados por condición e ingresantes en el panel; Excel y PDF de resultados y cobertura |
| RF-12.08 | El sistema debe permitir exportar reportes en formatos PDF y Excel. | [008](../specs/008-panel-administrativo/requirements.md) FR-004 | ✅ Exportación a Excel y PDF con los filtros aplicados |
| RF-12.09 | El sistema debe permitir filtrar reportes por convocatoria, modalidad, programa y fechas. | [008](../specs/008-panel-administrativo/requirements.md) FR-004 | ✅ Filtros por modalidad, programa y fechas |
| RF-12.10 | El sistema debe mostrar indicadores de atención y consultas del chatbot. | [008](../specs/008-panel-administrativo/requirements.md) FR-004 | ✅ Consultas, respuestas con IA, derivaciones, tokens y costo del asistente |

## M13. Administración, roles y seguridad

**Objetivo:** Controlar el acceso y proteger los datos personales y académicos.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-13.01 | El sistema debe permitir crear y administrar usuarios internos. | [008](../specs/008-panel-administrativo/requirements.md) FR-005 | ✅ Crear y administrar usuarios internos |
| RF-13.02 | El sistema debe implementar permisos diferenciados mediante roles. | [008](../specs/008-panel-administrativo/requirements.md) FR-005 | ✅ 9 roles con permisos verificados en el servidor |
| RF-13.03 | El sistema debe permitir activar, suspender y desactivar cuentas administrativas. | [008](../specs/008-panel-administrativo/requirements.md) FR-005 | ✅ Activar, suspender y desactivar con cierre de sesiones |
| RF-13.04 | El sistema debe registrar las operaciones críticas realizadas por los usuarios. | [008](../specs/008-panel-administrativo/requirements.md) FR-008 | ✅ Auditoría solo-inserción protegida con trigger |
| RF-13.05 | El sistema debe permitir consultar auditorías de cambios en pagos, expedientes y resultados. | [008](../specs/008-panel-administrativo/requirements.md) FR-008 | ✅ Consulta de auditoría por usuario, acción, recurso y fechas |
| RF-13.06 | El sistema debe implementar autenticación multifactor para usuarios administrativos. | [008](../specs/008-panel-administrativo/requirements.md) FR-006 | ✅ Segundo factor TOTP obligatorio para el personal |
| RF-13.07 | El sistema debe impedir el acceso a información o funcionalidades no autorizadas. | [002](../specs/002-cuentas-identidad/requirements.md) FR-008, [008](../specs/008-panel-administrativo/requirements.md) FR-007 | ✅ Permiso por ruta; cada acceso denegado queda auditado |
| RF-13.08 | El sistema debe permitir administrar sesiones y revocar accesos comprometidos. | [002](../specs/002-cuentas-identidad/requirements.md) FR-013 | ✅ Suspender, cambiar roles o restablecer cierra todas las sesiones |
| RF-13.09 | El sistema debe administrar el consentimiento y tratamiento de datos personales. | [002](../specs/002-cuentas-identidad/requirements.md) FR-009 | ✅ Consentimiento versionado al crear cuenta y al inscribirse (versión y huella del texto) |
| RF-13.10 | El sistema debe permitir configurar políticas de retención y eliminación de información. | [008](../specs/008-panel-administrativo/requirements.md) FR-014 | ✅ Plazos de retención editables; depuración diaria de conversaciones y anonimización de inscripciones de convocatorias anteriores (con sus archivos) |

## M14. Configuración general e integraciones

**Objetivo:** Centralizar la configuración de parámetros institucionales y conexiones externas.

| Código | Requerimiento funcional | Spec · FR | Estado |
|---|---|---|---|
| RF-14.01 | El sistema debe permitir configurar datos institucionales, logotipos y contenido del portal. | [001](../specs/001-portal-publico/requirements.md) FR-010, [008](../specs/008-panel-administrativo/requirements.md) FR-010 | ✅ Textos, comunicados e imágenes de la portada editables en el panel (con descripción y vuelta a la original) |
| RF-14.02 | El sistema debe permitir administrar las tasas de inscripción por convocatoria y modalidad. | [001](../specs/001-portal-publico/requirements.md) FR-006, [008](../specs/008-panel-administrativo/requirements.md) FR-001 | ✅ Tasas editables por convocatoria, con confirmación si es 0 |
| RF-14.03 | El sistema debe permitir configurar los requisitos documentales y reglas de validación. | [004](../specs/004-inscripcion-exonerados/requirements.md) FR-002, [008](../specs/008-panel-administrativo/requirements.md) FR-001 | ✅ Documentos exigidos de la convocatoria editables (nombre, contenido, artículo y formatos) |
| RF-14.04 | El sistema debe permitir administrar los parámetros de conexión con RENIEC, según las autorizaciones correspondientes. | [008](../specs/008-panel-administrativo/requirements.md) FR-013 | 🟡 Parámetros de RENIEC visibles y enmascarados en el panel; se configuran en el servidor |
| RF-14.05 | El sistema debe permitir configurar las credenciales de la pasarela de pagos mediante almacenamiento seguro. | [008](../specs/008-panel-administrativo/requirements.md) FR-013 | 🟡 Llaves de Culqi solo en el servidor y enmascaradas en el panel; SSM Parameter Store en el despliegue |
| RF-14.06 | El sistema debe permitir configurar la API key y el modelo de OpenRouter desde el servidor. | [008](../specs/008-panel-administrativo/requirements.md) FR-013 | ✅ OPENROUTER_API_KEY y OPENROUTER_MODEL en el servidor |
| RF-14.07 | El sistema debe permitir configurar los servicios de correo electrónico y mensajería. | [008](../specs/008-panel-administrativo/requirements.md) FR-013 | 🟡 Proveedor de correo visible en el panel; se configura en el servidor |
| RF-14.08 | El sistema debe permitir activar o desactivar funcionalidades según la etapa del proceso. | [001](../specs/001-portal-publico/requirements.md) FR-013, [008](../specs/008-panel-administrativo/requirements.md) FR-012 | ✅ Funciones activadas según la etapa del proceso |
| RF-14.09 | El sistema debe registrar fallas de integración y habilitar mecanismos de reintento controlado. | [008](../specs/008-panel-administrativo/requirements.md) FR-013 | ✅ Fallas de integración listadas con reintento controlado |
| RF-14.10 | El sistema debe permitir gestionar respaldos y parámetros operativos de recuperación. | [008](../specs/008-panel-administrativo/requirements.md) FR-015 | 🟡 Política de respaldo y procedimiento de restauración en el panel; las copias reales dependen del despliegue en AWS |

