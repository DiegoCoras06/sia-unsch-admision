# Requisitos — Portal público de admisión

> **SDD (Spec-Driven Development) · artefacto 1 de 3: requisitos** (qué y por qué).
> Siguiente: [design.md](design.md) (cómo) · [tasks.md](tasks.md) (tareas). Principios: [constitución](../../.specify/memory/constitution.md).

**Rama:** `001-portal-publico`
**Creada:** 25/10/2026
**Estado:** En revisión
**Módulos de arquitectura:** M01 Convocatorias, M14 Configuración (contenido)
**Entrada:** "Quiero un portal como admision.unsch.edu.pe pero mejor: que el postulante encuentre rápido la convocatoria, fechas, vacantes, cuánto debe pagar y los requisitos, sin tener que abrir PDFs."

## Escenarios de usuario y pruebas

### Historia 1 — Conocer la convocatoria vigente y su cronograma (Prioridad: P1)

Como visitante, quiero ver en la página de inicio la convocatoria vigente, la etapa en curso y cuántos días faltan para el próximo hito, para no perder ningún plazo.

**Por qué esta prioridad:** es la primera pregunta de todo postulante y hoy está escondida en un PDF y un carrusel.

**Prueba independiente:** con la convocatoria 2027-I cargada, abrir el inicio en una fecha simulada y comprobar la etapa resaltada y la cuenta regresiva.

**Escenarios de aceptación:**

1. **Dado** que hoy es 25/10/2026, **cuando** abro el inicio, **entonces** veo "Admisión 2027-I", la etapa "Inscripción regular — Ordinario (hasta el 06/11)" marcada como en curso y la cuenta regresiva al examen de exonerados del 15/11/2026.
2. **Dado** que hoy es 08/11/2026, **cuando** abro el cronograma, **entonces** la inscripción regular ordinaria aparece como "Cerrada", la extemporánea como "En curso" y se advierte el recargo de S/ 65.00.
3. **Dado** que una etapa ya terminó, **cuando** veo el cronograma, **entonces** aparece atenuada y marcada como finalizada.
4. **Dado** que no hay convocatoria publicada, **cuando** abro el inicio, **entonces** veo un aviso "Próximamente" y la opción de suscribirme para recibir avisos.

---

### Historia 2 — Explorar programas y vacantes (Prioridad: P1)

Como postulante, quiero buscar un programa y ver cuántas vacantes tiene en mi modalidad, para decidir dónde postular.

**Por qué esta prioridad:** reemplaza la tabla de vacantes en PDF de 17 columnas, ilegible en celular.

**Prueba independiente:** buscar "Sistemas" y filtrar por la submodalidad "Pueblos indígenas — Andino".

**Escenarios de aceptación:**

1. **Dado** el catálogo 2027-I, **cuando** escribo "sistemas", **entonces** veo "Ingeniería de Sistemas — Área I Ciencias" con 20 vacantes ordinario y 50 en total.
2. **Dado** que filtro por Área III Biomédicas, **cuando** se aplica el filtro, **entonces** veo exactamente las 9 opciones de esa área.
3. **Dado** que elijo la submodalidad "Graduados y/o titulados", **cuando** se muestra la lista, **entonces** los programas con 0 vacantes en esa submodalidad aparecen como "Sin vacantes en esta modalidad".
4. **Dado** que abro la ficha de un programa, **cuando** se carga, **entonces** veo facultad, área, duración, grado, título, perfil de ingreso y el desglose de vacantes por modalidad.

---

### Historia 3 — Calcular cuánto debo pagar (Prioridad: P1)

Como postulante, quiero responder unas pocas preguntas y saber el monto exacto de mi inscripción, para no equivocarme al pagar.

**Por qué esta prioridad:** la tabla de tasas tiene 24 conceptos y descuentos que hoy el postulante calcula a mano (MEJ-07).

**Prueba independiente:** simular las combinaciones de la Tabla N.° 3 y comparar con los montos oficiales.

**Escenarios de aceptación:**

1. **Dado** que elijo Ordinario y colegio estatal, **cuando** pido el cálculo durante la inscripción regular, **entonces** veo S/ 250.00.
2. **Dado** que elijo Ordinario, colegio particular y "licenciado del servicio militar", **cuando** pido el cálculo, **entonces** veo S/ 225.00 con la nota "25 % de descuento — Art. 61, Ley 29248".
3. **Dado** que elijo Ordinario y colegio estatal en periodo extemporáneo (07–14/11), **cuando** pido el cálculo, **entonces** veo S/ 250.00 + S/ 65.00 = S/ 315.00.
4. **Dado** que elijo Exonerados → Graduados y/o titulados, **cuando** pido el cálculo, **entonces** veo S/ 485.00.
5. **Dado** que marco "hijo/cónyuge de servidor UNSCH, primera vez", **cuando** pido el cálculo, **entonces** veo S/ 30.00 y la advertencia de que el beneficio es por única vez.

---

### Historia 4 — Consultar requisitos, temario y reglamento sin abrir PDFs (Prioridad: P2)

Como postulante, quiero leer los requisitos de mi submodalidad, el temario y el reglamento en la página, con opción de descargar el PDF oficial.

**Por qué esta prioridad:** el contenido existe en PDF; pasarlo a HTML mejora el acceso desde celular y la accesibilidad (MEJ-10).

**Escenarios de aceptación:**

1. **Dado** que elijo la submodalidad "Deportista calificado", **cuando** abro requisitos, **entonces** veo los 4 documentos base (Art. 36) más los 3 específicos del Art. 40.
2. **Dado** que abro el temario, **cuando** busco "trigonometría", **entonces** el sistema me lleva a ese curso dentro del Área II Matemática.
3. **Dado** cualquier página de contenido oficial, **cuando** la abro, **entonces** veo un botón "Descargar PDF oficial" y la fecha de publicación.

---

### Historia 5 — Enterarme de comunicados y fe de erratas (Prioridad: P2)

Como postulante, quiero ver los comunicados oficiales ordenados por fecha y saber si alguno cambia algo que ya leí.

**Escenarios de aceptación:**

1. **Dado** que Admisión publica una fe de erratas sobre tasas, **cuando** abro la página de tasas, **entonces** veo un aviso destacado enlazado a esa fe de erratas.
2. **Dado** la lista de comunicados, **cuando** la abro, **entonces** aparecen del más reciente al más antiguo, con etiqueta (Comunicado / Fe de erratas / Resultado).

---

### Historia 6 — Conocer la institución y contactar a Admisión (Prioridad: P3)

Como visitante, quiero ver el mensaje de las autoridades, la misión, las estadísticas de inscritos y un canal de contacto con número de caso.

**Escenarios de aceptación:**

1. **Dado** el inicio, **cuando** bajo, **entonces** veo inscritos por modalidad actualizados al menos cada hora.
2. **Dado** el formulario de contacto, **cuando** lo envío con datos válidos, **entonces** recibo un número de caso y una copia en mi correo.
3. **Dado** que envío más de 5 mensajes en una hora desde el mismo origen, **cuando** intento uno más, **entonces** el sistema lo rechaza con un mensaje amable.

### Casos límite

- Dos etapas del cronograma vigentes el mismo día (p. ej. 11/11: adjudicación CEPRE e inscripción CEPRE) → se muestran ambas como "En curso".
- Cambio de día a medianoche en hora de Perú (UTC−5) → las etapas se abren y cierran según hora de Lima, no del servidor.
- Programa con especialidades (Biología, Educación Secundaria, Arqueología e Historia) → se muestran agrupadas bajo el programa padre.
- Contenido sin PDF oficial asociado → no se muestra el botón de descarga.

## Aclaraciones

### Sesión 25/10/2026

- P: El cuadro de vacantes repite el código 26 y omite el 25. ¿Cómo se identifican los programas? → R: **Código interno único** para cada una de las 40 opciones de postulación (`P01`–`P40`) y el **código oficial** del cuadro guardado como atributo informativo, junto con una tabla de equivalencias con la numeración del cronograma (1–34).

- P: ¿Cómo se muestran los PDF de `docs/fuentes`? → R: **Como en el portal oficial**: una página por documento con su título, el botón «Ver documento completo» y el PDF incrustado, más el menú lateral de documentos (FR-014). El contenido en HTML se mantiene como complemento accesible.
- P: ¿El portal sigue promoviendo "Crear cuenta"? → R: **No** (ADR-015). Los botones principales son **Inscripción** y **Reinscripción**.

## Requisitos

### Requisitos funcionales

- **FR-001**: El sistema DEBE mostrar la convocatoria vigente con nombre, periodo y estado. *(RF-01.01, RF-01.06)*
- **FR-002**: El sistema DEBE mostrar el cronograma con cada etapa marcada como Próxima, En curso o Finalizada según la hora de Lima. *(RF-01.03, RF-01.07, MEJ-09)*
- **FR-003**: El sistema DEBE mostrar una cuenta regresiva hacia el siguiente hito relevante. *(MEJ-09)*
- **FR-004**: El sistema DEBE listar las 40 opciones de postulación agrupadas por área y programa, con buscador y filtros por área, modalidad y submodalidad. *(RF-01.04, RF-01.05, MEJ-08)*
- **FR-005**: El sistema DEBE mostrar la ficha de cada programa: facultad, área, duración, grado, título, perfil de ingreso y vacantes por modalidad. *(MEJ-08)*
- **FR-006**: El sistema DEBE calcular la tasa según modalidad, submodalidad, tipo de colegio, condición militar, vínculo familiar y periodo (regular/extemporáneo), citando el concepto de la Tabla N.° 3. *(RF-05.01, RF-14.02, MEJ-07)*
- **FR-007**: El sistema DEBE publicar requisitos por submodalidad, temario y reglamento en HTML navegable, con descarga del PDF oficial. *(RF-01.06, MEJ-10)*
- **FR-008**: El sistema DEBE publicar comunicados y fe de erratas con fecha, tipo y vínculo a la sección afectada. *(RF-01.08)*
- **FR-009**: El sistema DEBE mostrar las infografías de pasos para Ordinario y Exonerados como pasos HTML accesibles. *(MEJ-10)*
- **FR-010**: El sistema DEBE mostrar contenido institucional editable (mensajes de autoridades, misión, principios, fines, carrusel). *(RF-14.01, MEJ-17)*
- **FR-011**: El sistema DEBE mostrar estadísticas agregadas de inscritos por modalidad, sin datos personales. *(RF-12.01)*
- **FR-012**: El sistema DEBE ofrecer un formulario de contacto que genere número de caso y limite el abuso. *(MEJ-14)*
- **FR-013**: El sistema DEBE ofrecer accesos directos visibles a Inscripción, Reinscripción, Buscar aula, Ver puntaje e Imprimir documentos, habilitados solo durante su etapa. *(RF-14.08)*
- **FR-014**: El sistema DEBE mostrar cada documento oficial (reglamento, cronograma, requisitos, tasas, vacantes, temario, programas) **como PDF dentro de la página**, con un botón para verlo completo en otra pestaña y un menú lateral de documentos, como el portal oficial. *(Aclaración 25/10/2026)*
- **FR-015**: El encabezado DEBE ofrecer los menús **Contenido** (todos los documentos y consultas) y **Pasos** (Ordinario, Exonerados), y los botones **Inscripción** y **Reinscripción**. *(Aclaración 25/10/2026)*

### Entidades clave

- **Convocatoria**: proceso de admisión de un periodo (2027-I); tiene etapas, tasas, vacantes y documentos oficiales.
- **Etapa del cronograma**: nombre, modalidad a la que aplica, fecha/hora de inicio y fin, tipo (regular/extemporánea).
- **Área académica**: I Ciencias, II Letras, III Biomédicas.
- **Programa de estudios**: carrera; puede tener especialidades. Pertenece a una facultad y un área.
- **Vacante**: cantidad por programa/especialidad, modalidad y submodalidad dentro de una convocatoria.
- **Tasa**: concepto, monto, condiciones de aplicación y recargos.
- **Contenido publicado**: comunicado, fe de erratas, página institucional o documento oficial.

## Criterios de éxito

- **SC-001**: Un visitante encuentra el monto que debe pagar en menos de 1 minuto y en no más de 4 interacciones.
- **SC-002**: El 100 % de los montos del simulador coincide con la Tabla N.° 3 en las pruebas de todas las combinaciones.
- **SC-003**: Los totales de vacantes mostrados coinciden con el cuadro oficial (926 ordinario, 1803 en total).
- **SC-004**: Todo el contenido oficial es legible en un celular de 360 px sin zoom ni desplazamiento horizontal.
- **SC-005**: La página de inicio carga en menos de 2.5 s en red 4G móvil.

## Supuestos

- Los datos de 2027-I de `docs/reglas-negocio.md` son la semilla inicial.
- Las fotos e imágenes institucionales se usan con fines académicos; se reemplazarán por imágenes autorizadas si el proyecto se presenta fuera del curso.
- La hora oficial del proceso es la de Lima (UTC−5).

## Fuera de alcance

- Edición del contenido (ver `008-panel-administrativo`).
- Chatbot (ver `009-chatbot-ia`).

## Estado de los requisitos (28/10/2026)

12 de 12 requisitos del catálogo citados en esta funcionalidad están implementados y probados. Fuente: [matriz de trazabilidad](../../docs/trazabilidad-requisitos.md).

| RF | Estado | Detalle |
|---|---|---|
| RF-01.01 | ✅ | Crear (copiando una convocatoria), modificar y administrar desde el panel |
| RF-01.03 | ✅ | Fechas de cada etapa editables, validadas y auditadas |
| RF-01.04 | ✅ | Facultades, áreas y programas editables en «Catálogo del concurso», con auditoría |
| RF-01.05 | ✅ | Vacantes editables por programa y categoría, con resolución si está publicada |
| RF-01.06 | ✅ | Portal: convocatoria, reglamento y requisitos como PDF, temario y cronograma |
| RF-01.07 | ✅ | La inscripción se abre y cierra según la etapa (STAGE_CLOSED) |
| RF-01.08 | ✅ | Comunicados y fe de erratas publicados desde el panel |
| RF-05.01 | ✅ | Simulador y cálculo de tasa en el servidor |
| RF-12.01 | ✅ | Panel con inscritos, aptos, recaudación y pendientes |
| RF-14.01 | ✅ | Textos, comunicados e imágenes de la portada editables en el panel (con descripción y vuelta a la original) |
| RF-14.02 | ✅ | Tasas editables por convocatoria, con confirmación si es 0 |
| RF-14.08 | ✅ | Funciones activadas según la etapa del proceso |

✅ implementado y probado · 🟡 parcial (lo que falta depende de un servicio externo o está anotado) · ⏳ pendiente
