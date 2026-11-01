# Requisitos — Panel administrativo, seguridad y reportes

> **SDD (Spec-Driven Development) · artefacto 1 de 3: requisitos** (qué y por qué).
> Siguiente: [design.md](design.md) (cómo) · [tasks.md](tasks.md) (tareas). Principios: [constitución](../../.specify/memory/constitution.md).

**Rama:** `008-panel-administrativo`
**Creada:** 25/10/2026
**Estado:** En revisión
**Módulos de arquitectura:** M01 Convocatorias (gestión), M12 Reportes, M13 Seguridad, M14 Configuración
**Entrada:** "La Dirección de Admisión debe configurar cada convocatoria sin tocar código, ver indicadores en tiempo real, gestionar usuarios internos con roles, auditar todo lo crítico y atender denuncias."

## Escenarios de usuario y pruebas

### Historia 1 — Configurar una convocatoria completa (Prioridad: P1)

Como personal de la Oficina de Admisión, quiero crear la convocatoria con su cronograma, tasas, vacantes y requisitos, para que el sistema funcione en cada periodo (Constitución II.2).

**Escenarios de aceptación:**

1. **Dado** una convocatoria nueva "2027-II", **cuando** copio la configuración de "2027-I", **entonces** se duplican etapas, tasas, submodalidades, requisitos y programas, y solo ajusto fechas y montos. *(RF-01.01, RF-01.02)*
2. **Dado** el cuadro de vacantes, **cuando** lo importo desde Excel, **entonces** el sistema valida que las filas suman su total y muestra diferencias antes de guardar. *(RF-01.05)*
3. **Dado** una convocatoria publicada, **cuando** intento modificar vacantes, **entonces** el sistema exige una resolución y motivo (RN-03) y lo registra en auditoría.
4. **Dado** fechas del cronograma, **cuando** las guardo, **entonces** el sistema valida que no haya etapas con fin antes del inicio y advierte superposiciones. *(RF-01.03)*

---

### Historia 2 — Ver indicadores del proceso en tiempo real (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** el panel de inicio, **cuando** lo abro, **entonces** veo cuentas creadas, inscripciones por estado, inscritos por modalidad y programa, recaudación, expedientes por estado y ocupación de aulas. *(RF-12.01 a RF-12.05, MEJ-15)*
2. **Dado** cualquier indicador, **cuando** filtro por convocatoria, modalidad, programa o rango de fechas, **entonces** todos los gráficos se actualizan. *(RF-12.09)*
3. **Dado** un reporte, **cuando** lo exporto, **entonces** obtengo PDF o Excel con los filtros aplicados. *(RF-12.08)*
4. **Dado** mi rol (p. ej. Tesorería), **cuando** abro el panel, **entonces** solo veo los indicadores que me corresponden.

---

### Historia 3 — Gestionar usuarios internos y roles (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** que soy administrador general, **cuando** creo un usuario interno, **entonces** le asigno uno o más roles: Oficina de Admisión, Evaluador documental, Tesorería, Coordinador de examen, Operador de resultados, Soporte, Auditor. *(RF-13.01, RF-13.02)*
2. **Dado** un usuario interno nuevo, **cuando** inicia sesión por primera vez, **entonces** debe cambiar su contraseña y activar el segundo factor de autenticación. *(RF-13.06)*
3. **Dado** que un evaluador intenta abrir la conciliación de pagos, **cuando** accede a la dirección directamente, **entonces** recibe "Sin permiso" y el intento queda registrado. *(RF-13.07)*
4. **Dado** una cuenta comprometida, **cuando** el administrador la suspende, **entonces** todas sus sesiones se cierran de inmediato. *(RF-13.03, RF-13.08)*

---

### Historia 4 — Consultar la auditoría (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** que soy auditor, **cuando** busco por postulante, usuario, módulo o fecha, **entonces** veo quién hizo qué, cuándo, desde dónde y el valor anterior y nuevo. *(RF-13.04, RF-13.05)*
2. **Dado** cualquier usuario, incluido el administrador, **cuando** intenta modificar o borrar un registro de auditoría, **entonces** no existe opción para hacerlo (RNF-10).

---

### Historia 5 — Gestionar el registro de inhabilitados (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** una resolución de inhabilitación, **cuando** registro el documento de la persona, motivo y resolución, **entonces** esa persona no puede crear cuenta ni inscribirse (RN-09, RN-61).
2. **Dado** una persona que ya tenía inscripción, **cuando** se la inhabilita, **entonces** su inscripción se anula con referencia a la resolución.

---

### Historia 6 — Publicar comunicados y editar contenido (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** el editor de contenido, **cuando** publico un comunicado o fe de erratas, **entonces** aparece en el portal y puedo enviarlo a un segmento (modalidad, programa, estado). *(RF-01.08, RF-11.08)*
2. **Dado** los mensajes de autoridades, carrusel y textos institucionales, **cuando** los edito, **entonces** se actualiza el portal sin intervención técnica (MEJ-17). *(RF-14.01)*

---

### Historia 7 — Atender denuncias y consultas con número de caso (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** una denuncia recibida desde el portal (puede ser anónima), **cuando** el personal de soporte la abre, **entonces** ve número de caso, categoría, fecha y evidencia adjunta, y puede derivarla a la Comisión. (MEJ-14)
2. **Dado** que cambio el estado de un caso, **cuando** lo guardo, **entonces** el denunciante puede ver el avance con su número de caso.

---

### Historia 8 — Activar funciones por etapa y configurar integraciones (Prioridad: P3)

**Escenarios de aceptación:**

1. **Dado** los interruptores de funciones, **cuando** desactivo "Reinscripción", **entonces** el botón desaparece del portal aunque la fecha esté vigente. *(RF-14.08)*
2. **Dado** la sección de integraciones, **cuando** cambio el proveedor de identidad de "simulado" a "real", **entonces** las credenciales se piden y se guardan cifradas; nunca se muestran completas después. *(RF-14.04 a RF-14.07)*
3. **Dado** una falla de integración, **cuando** la consulto, **entonces** veo el error, reintentos y puedo reintentar manualmente. *(RF-14.09)*
4. **Dado** el panel de respaldos, **cuando** lo abro, **entonces** veo la fecha del último respaldo y de la última prueba de restauración. *(RF-14.10, RNF-06)*

### Casos límite

- Se configura una tasa en 0 por error → el sistema exige confirmación explícita.
- El último administrador intenta quitarse el rol → el sistema lo impide.
- Un usuario interno también es postulante (Disp. Final 2.ª: no puede postular) → el sistema lo detecta por documento y bloquea la inscripción.

## Requisitos

### Requisitos funcionales

- **FR-001**: El sistema DEBE permitir crear, copiar y editar convocatorias con cronograma, modalidades, submodalidades, programas, vacantes, tasas y requisitos. *(RF-01.01 a RF-01.05, RF-14.02, RF-14.03)*
- **FR-002**: El sistema DEBE importar el cuadro de vacantes desde Excel validando totales. *(RF-01.05)*
- **FR-003**: El sistema DEBE bloquear cambios a vacantes publicadas salvo con resolución registrada. *(RN-03)*
- **FR-004**: El sistema DEBE mostrar un panel con indicadores filtrables y exportables a PDF y Excel. *(RF-12.01 a RF-12.10)*
- **FR-005**: El sistema DEBE gestionar usuarios internos, roles y permisos, con activar, suspender y desactivar. *(RF-13.01 a RF-13.03)*
- **FR-006**: El sistema DEBE exigir segundo factor para todo usuario interno. *(RF-13.06)*
- **FR-007**: El sistema DEBE verificar permisos en el servidor para cada operación. *(RF-13.07)*
- **FR-008**: El sistema DEBE registrar auditoría inmutable de operaciones críticas y permitir su consulta. *(RF-13.04, RF-13.05)*
- **FR-009**: El sistema DEBE gestionar el registro de inhabilitados. *(RN-09)*
- **FR-010**: El sistema DEBE permitir publicar comunicados segmentados y editar contenido institucional. *(RF-01.08, RF-14.01)*
- **FR-011**: El sistema DEBE gestionar denuncias y consultas con número de caso y estados. *(MEJ-14)*
- **FR-012**: El sistema DEBE permitir activar o desactivar funciones por etapa. *(RF-14.08)*
- **FR-013**: El sistema DEBE gestionar parámetros de integraciones con secretos cifrados y registro de fallas con reintento. *(RF-14.04 a RF-14.07, RF-14.09)*
- **FR-014**: El sistema DEBE gestionar políticas de retención y eliminación de datos personales. *(RF-13.10)*
- **FR-015**: El sistema DEBE mostrar y configurar los respaldos (copias automáticas de RDS con retención de 7 días, instantánea manual antes de publicar resultados) y documentar el procedimiento de restauración con su objetivo de recuperación. *(RF-14.10)*

### Entidades clave

- **Usuario interno / Rol / Permiso**.
- **Evento de auditoría**: actor, acción, recurso, antes, después, fecha, origen.
- **Persona inhabilitada**: documento, motivo, resolución, vigencia.
- **Caso de atención**: tipo (consulta, denuncia), estado, responsable, historial.
- **Parámetro de sistema / Interruptor de función / Configuración de integración**.

## Criterios de éxito

- **SC-001**: Configurar la convocatoria 2027-II a partir de 2027-I toma menos de 30 minutos.
- **SC-002**: El panel muestra datos con menos de 1 minuto de retraso.
- **SC-003**: El 100 % de las pruebas de acceso no autorizado entre roles es rechazado.
- **SC-004**: El 100 % de las operaciones críticas de prueba aparece en la auditoría.

## Supuestos

- Los roles listados cubren la organización de la Dirección de Admisión; se pueden crear roles adicionales.

## Fuera de alcance

- Integración con el sistema de trámite documentario de la Universidad.

## Estado de los requisitos (28/10/2026)

25 de 28 requisitos del catálogo citados en esta funcionalidad están implementados y probados. Fuente: [matriz de trazabilidad](../../docs/trazabilidad-requisitos.md).

| RF | Estado | Detalle |
|---|---|---|
| RF-01.01 | ✅ | Crear (copiando una convocatoria), modificar y administrar desde el panel |
| RF-01.02 | ✅ | Modalidades, submodalidades y tipos de vacante editables en «Catálogo del concurso», con auditoría |
| RF-01.03 | ✅ | Fechas de cada etapa editables, validadas y auditadas |
| RF-01.05 | ✅ | Vacantes editables por programa y categoría, con resolución si está publicada |
| RF-01.08 | ✅ | Comunicados y fe de erratas publicados desde el panel |
| RF-11.08 | ✅ | Comunicados por modalidad, programa y estado con enviados, en cola y fallidos |
| RF-12.01 | ✅ | Panel con inscritos, aptos, recaudación y pendientes |
| RF-12.05 | ✅ | Ocupación por aula en la distribución y por examen en el panel de indicadores |
| RF-12.08 | ✅ | Exportación a Excel y PDF con los filtros aplicados |
| RF-12.09 | ✅ | Filtros por modalidad, programa y fechas |
| RF-12.10 | ✅ | Consultas, respuestas con IA, derivaciones, tokens y costo del asistente |
| RF-13.01 | ✅ | Crear y administrar usuarios internos |
| RF-13.02 | ✅ | 8 roles con permisos verificados en el servidor |
| RF-13.03 | ✅ | Activar, suspender y desactivar con cierre de sesiones |
| RF-13.04 | ✅ | Auditoría solo-inserción protegida con trigger |
| RF-13.05 | ✅ | Consulta de auditoría por usuario, acción, recurso y fechas |
| RF-13.06 | ✅ | Segundo factor TOTP obligatorio para el personal |
| RF-13.07 | ✅ | Permiso por ruta; cada acceso denegado queda auditado |
| RF-13.08 | ✅ | Suspender, cambiar roles o restablecer cierra todas las sesiones |
| RF-13.10 | ✅ | Plazos de retención editables; depuración diaria de conversaciones y anonimización de inscripciones de convocatorias anteriores (con sus archivos) |
| RF-14.01 | ✅ | Textos, comunicados e imágenes de la portada editables en el panel (con descripción y vuelta a la original) |
| RF-14.02 | ✅ | Tasas editables por convocatoria, con confirmación si es 0 |
| RF-14.03 | ✅ | Documentos exigidos de la convocatoria editables (nombre, contenido, artículo y formatos) |
| RF-14.04 | 🟡 | Parámetros de RENIEC visibles y enmascarados en el panel; se configuran en el servidor |
| RF-14.07 | 🟡 | Proveedor de correo visible en el panel; se configura en el servidor |
| RF-14.08 | ✅ | Funciones activadas según la etapa del proceso |
| RF-14.09 | ✅ | Fallas de integración listadas con reintento controlado |
| RF-14.10 | 🟡 | Política de respaldo y procedimiento de restauración en el panel; las copias reales dependen del despliegue en AWS |

✅ implementado y probado · 🟡 parcial (lo que falta depende de un servicio externo o está anotado) · ⏳ pendiente
