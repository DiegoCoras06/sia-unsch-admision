# Sistema de diseño: Admisión UNSCH 2027-I

Fuente de los valores: `apps/frontend/src/styles.scss` (tokens en `:root`). Este archivo guarda las decisiones para que cada pantalla nueva siga igual.

## Dirección

**Personalidad:** institucional y confiable. Una oficina pública de 1677 que atiende trámites hoy: formal, clara y sin adornos.

**Mundo de color:** guinda del escudo y de los oficios, dorado del escudo, piedra de Huamanga (gris cálido) y tinta oscura sobre papel blanco.

**Base:** cálida.

**Profundidad:** bordes finos y cambios de superficie. Las sombras solo para lo que se eleva: diálogos (ventana de pago) y tarjetas de ingreso.

**Cabecera:** copia el portal oficial de la UNSCH (botones verde y celeste). Contactos y Denuncias también copian el portal oficial: no se rediseñan.

## Tokens

### Color
```
--ground: #ffffff        superficie principal (papel)
--stone: #f3efea         piedra de Huamanga: segunda superficie
--stone-deep: #e7e0d8    divisores y bordes suaves
--field-line: #857a72    borde de campos (≥ 3:1)
--ink: #1d1415           texto principal
--ink-soft: #5b4f50      notas y datos secundarios
--accent: #7a1c22        guinda: acción principal y campos de identidad
--accent-press: #5e1419  guinda al presionar y paneles internos
--gold: #d9b44a          dorado: solo sobre guinda o para «lo que sigue»
--gold-hover: #e6c35e
--ok: #1f6b3a  --warn: #8a5a00  --danger: #a01b1b
--focus: #d9b44a         anillo de foco (dorado + línea interior tinta)
```
Yape (solo en su pestaña de pago): `#742284`. Izipay (solo en la ventana de tarjeta): `#00807b`.

### Tipografía
Fuente: Archivo (una sola familia).
Tamaños: `--size-display` clamp(2.75rem → 7.25rem), `--size-title` clamp(1.875rem → 3.25rem), `--size-body` 1.125rem, `--size-note` 0.9375rem.
Pesos: 400 texto, 600 etiquetas y botones, 700–800 títulos. Títulos grandes con tracking negativo (−0.02 a −0.035em).
Números que cambian (montos, códigos, fechas, contadores): `font-variant-numeric: tabular-nums`.

### Radio
`--radius` 6px (botones, campos, fotos pequeñas) · `--radius-lg` 10px (paneles, tarjetas, avisos). Círculos solo para puntos de estado.

### Espacio
Base 4px en componentes (0.25rem). Márgenes de página `--margin` clamp(1rem → 2.5rem), separación entre secciones `--section`.

### Movimiento
`--fast` 160ms y `--ease` cubic-bezier(0.2, 0.7, 0.2, 1) para respuestas a una acción. Sin entradas animadas por sección. Respeta `prefers-reduced-motion`.

## Patrones

### Botón principal (`.btn`)
- Alto mínimo 3rem (48px), relleno 0.7rem 1.6rem, radio 6px.
- Texto 1rem, peso 600.
- Guinda con borde `--accent-press`; dorado (`.btn--gold`) sobre fondos guinda; blanco (`.btn--light`) solo en la portada guinda.
- Secundario (`.btn--quiet`): contorno fino `--field-line`, sin relleno.
- Con puntero: sube 1px con sombra suave. Al presionar: baja 1px, sin sombra y sin escala. En pantallas táctiles no se levanta.
- En proceso: `[attr.aria-busy]` muestra un indicador giratorio junto al texto («Enviando…»).

### Enlace de acción (`.link-arrow`)
- Peso 600, subrayado de 1px al 45 % y una línea de 2px que crece de izquierda a derecha con el puntero. Sin flecha.

### Campo (`.input`, `.select`)
- Alto mínimo 3.25rem, fondo blanco, borde 1px `--field-line`, radio 6px.
- Foco: borde guinda (dorado sobre guinda) + anillo global de dos tonos.
- Error: borde y anillo interior `--danger`, mensaje con ícono y `aria-describedby`.
- Contraseña: botón «Mostrar/Ocultar» dentro del campo (2.5rem de alto, `aria-pressed`) y aviso de mayúsculas activadas.

### Panel / tarjeta
- Radio 10px, borde 1px `--stone-deep` sobre blanco, o fondo `--stone` sin borde.
- Tarjeta elevada (ingreso): sombra en capas `0 0 0 1px rgb(29 20 21/.06), 0 1px 2px -1px rgb(29 20 21/.08), 0 12px 32px -12px rgb(29 20 21/.18)`.

### Pantalla de ingreso (personal y postulante)
- Dividida: carátula guinda (escudo, nombre de la oficina, datos reales del proceso en dorado) + formulario sobre blanco.
- Encabezado del formulario con el paso actual («Paso 1 de 2: …»).
- En el celular la carátula se reduce (personal) o va después del formulario (postulante).

### Línea del trámite (`app-inscription-track`)
- Pasos con fecha real del cronograma. Punto de 1.875rem: completado guinda con check; en curso dorado con halo de 4px; observación ámbar; pendiente con contorno `--stone-deep`.
- Siempre hay un foco: si todo está al día, se destaca lo que sigue.
- Horizontal en escritorio, vertical en el celular; `aria-current="step"`.

### Línea de tiempo del cronograma (`app-stage-track`)
- Etapas clave en columnas iguales, no proporcionales al tiempo: se solapan y una escala real las amontonaría. Ordenadas por inicio y, a igual inicio, por cierre.
- Mismo punto que la línea del trámite: guinda con check, dorado con halo, contorno. Etiqueta guinda «Hoy» en la última etapa en curso.
- Horizontal desde 900 px; debajo, vertical. El detalle de cada etapa vive en la lista de `/cronograma`.

### Cuenta hasta el cierre («Ahora en curso»)
- Días de calendario en Lima, no horas: «Cierra hoy», «Cierra mañana», «Faltan N días». Etiqueta blanca; guinda a tres días o menos.

### Ficha de examen tipo boleto (Buscar aula)
- Bloque guinda de radio 10px: encabezado (examen, fecha y código en dorado) → talón separado por línea punteada con muescas de 0.75rem → aula (2fr) y asiento (1fr) en 3–4.5rem, peso 800 → ruta puerta / pabellón / piso (1fr 2fr 1fr) → franja dorada con la hora de ingreso → local.
- Foco: aula y asiento. Al imprimir, sin muescas y con borde guinda.

### Resultado (Ver puntaje)
- La condición es el foco: bloque de color sobrio según el caso (Ingresó `--ok`; No alcanzó vacante y sin derecho a vacante #4a3f40; Ausente o no calificable #5b4f50), título 2–3rem peso 800. Nunca rojo para un resultado.
- Puntaje en 2.25–3.25rem con regla de 0 a 1000 (alto 0.625rem, relleno del color de la condición) y marca negra del mínimo con su etiqueta.
- Puesto y vacantes en una franja `--stone` debajo.

### Buscador de opciones largas
- Para listas de más de ~15 opciones (programas): campo de búsqueda con lupa encima del `<select>` nativo, que filtra mientras se escribe, sin tildes ni mayúsculas, y conserva la opción ya elegida. Contador en vivo («10 programas coinciden», `aria-live`).
- Se prefiere a un combobox propio: el selector nativo ya es accesible con teclado y en el celular.

### Resumen de cuenta (Mi cuenta)
- Dos columnas: inscripciones (con su línea del trámite) a la izquierda; datos de contacto y actividad en una columna lateral de 22rem, fija al desplazar en escritorio.
- Identidad como insignia (verde verificada, ámbar pendiente) junto al documento enmascarado (`1234••78`).
- Botón «Guardar cambios» activo solo con cambios («Sin cambios» si no los hay).
- Actividad como línea de tiempo: punto guinda de 0.5rem, línea de 1px `--stone-deep`, fecha en `--ink-soft`.

### Pasos de formulario (inscripción)
- 6 botones de igual ancho; en el celular solo el número (el nombre va en el título y para el lector de pantalla).

### Panel del personal (menú e inicio)
- Menú lateral guinda agrupado por tarea; título de grupo en dorado de 0.8125rem, secciones con radio 6px y la activa en blanco. Un grupo sin secciones permitidas no se muestra.
- El inicio empieza por «Pendientes de hoy»: un bloque por tarea que espera acción (expedientes por revisar, pagos rechazados, duplicados por devolver, casos abiertos, ingresantes por entregar documentos), según el rol, enlazado a su sección. Con trabajo: número guinda y borde izquierdo dorado; al día: «Al día» en verde y borde neutro; lo que tiene trabajo va primero.
- Los indicadores van después, bajo «Resumen del proceso».
- Exportaciones en un solo menú «Descargar reporte» (details nativo; se cierra con Esc o al salir el foco), con el formato a la derecha y la nota «Con los filtros aplicados».

### Estados de las tablas del panel
- Reglas centralizadas en `admin.scss` y `AdminSession`, no por pantalla: `get()` cuenta las consultas en curso y el marco pone `.is-loading` y `aria-busy`.
- Cargando: barra dorada de 3 px arriba (aparece a los 200 ms para no parpadear) y filas de relleno en la tabla sin datos; sin animación con `prefers-reduced-motion`.
- Vacío: `tr.adm-none` con el mensaje propio de la pantalla; si no lo tiene, «Sin registros por ahora.». Nunca se muestra mientras carga.
- Error de conexión o del servidor (0 o 5xx): aviso general con «Reintentar» que reemplaza al error de la pantalla. Los 4xx los explica cada pantalla.
- Mensajes `.adm-msg` fijos al desplazar, para que la confirmación se vea aunque el formulario esté abajo.

### Documentos PDF (`shared/pdf/letterhead.ts`)
- Membrete sobre papel blanco, como un oficio: escudo, universidad, título guinda en Archivo y doble línea guinda y dorada. Sin bloques de color de lado a lado: gastan tóner y se imprimen mal en blanco y negro.
- Etiquetas en minúscula, sin «·» ni mayúsculas sostenidas. Un solo bloque guinda por documento, para el dato principal (total en la orden, aula en la ficha de examen).
- Constancia de ingreso: marco doble guinda y dorado con el escudo tenue de fondo.
- Pie con línea fina, datos de emisión y la nota de proyecto académico. Cada documento cabe en una hoja A4.

### Correos (`renderEmail`)
- Tablas y estilos en línea para Gmail y Outlook. Banda guinda con filete dorado, título guinda, tarjeta de datos sobre `#f7f2ee` y un solo botón de acción.
- Sin imágenes: muchos clientes las bloquean. La versión de texto lleva los mismos datos y el enlace.

### Gráficos del panel (`app-daily-chart`, `.adm-bars`)
- SVG propio, sin librerías. Serie única en guinda: línea de 2 px, área al 10 %, rejilla de 1 px, valor al final y texto siempre en tinta.
- Los días sin datos cuentan como 0, para no inventar una tendencia. Globo con puntero y flechas del teclado, y vista de tabla.
- Barras finas de 0.625rem con extremo redondeado y proporcionales al valor real. Nunca anchos fijos.
- Cifras únicas como indicador, no como gráfico.

### Acabado común del portal
- Transición entre páginas: fundido de 180 ms con `withViewTransitions`; cabecera y menú del panel quedan fijos. Sin animación con «reducir movimiento».
- Carga: `.skel` con filas o `.skel--cards`, nunca un texto «Cargando…» suelto.
- Escudo sobre guinda: sello blanco circular con filete dorado.
- Impresión: sin cabecera, pie, asistente ni botones; el contenido con entrada animada se imprime igual.

### Sesiones activas (`app-active-sessions`)
- Lista por dispositivo: «Chrome en Windows», con «Este dispositivo» o la última actividad, y botón «Cerrar» salvo en el actual. Se usa en Mi cuenta y en Mi seguridad.

### Acabado moderno, sin perder formalidad
- Cabecera blanca sólida con sombra suave. Se probó con vidrio (`backdrop-filter`) y se retiró: el texto de las páginas guinda se leía a través de ella.
- Tarjetas con enlace: suben 2px con sombra suave solo con puntero.
- Degradado fijo sobre la foto de la portada, que la funde con el campo guinda. Iconos de línea con `data-icon` solo en descargar, imprimir y buscar.
- Descartados: neomorfismo (falla el contraste), claymorfismo (poco serio), gradientes animados (distraen) y vidrio (texto difícil de leer).

### Resumen de errores
- Arriba del paso, recibe el foco (`role="alert"`, `tabindex="-1"`), una línea por subgrupo con enlace al primer campo pendiente.

## Decisiones

| Decisión | Motivo | Fecha |
|---|---|---|
| Identidad guinda y dorado, cabecera oficial | El cliente pidió mantener el aspecto del portal oficial; el rediseño libre fue rechazado | 26/10/2026 |
| Radio 6 / 10 px en lugar de esquinas rectas | Acabado más formal y moderno sin cambiar la identidad | 29/10/2026 |
| Sin animaciones de entrada por sección | Se leía como diseño genérico; el contenido debe estar a la vista | 29/10/2026 |
| Sin flechas «→», sin rayas «—», sin mayúsculas en etiquetas | Señales de diseño genérico hecho por IA | 29/10/2026 |
| Bordes de campo `--field-line` (≥ 3:1) | WCAG 1.4.11; antes el borde casi no se veía (1,14:1) | 29/10/2026 |
| Ingreso en pantalla dividida con datos reales del proceso | Que el personal y el postulante sepan dónde están y qué sigue | 30/10/2026 |
| Línea del trámite con un solo foco | El postulante ve de un vistazo en qué paso está | 30/10/2026 |
| Ficha de examen como boleto | Lo que se muestra en la puerta el día del examen debe leerse de un vistazo en el celular | 30/10/2026 |
| Panel agrupado por tarea y «Pendientes de hoy» primero | El personal entra a resolver algo; 19 secciones sueltas y 6 botones de exportación tapaban lo urgente | 02/11/2026 |
| Estados de tabla en un solo lugar | Eran 20 pantallas, solo 2 mostraban carga y varias quedaban en blanco; cualquier pantalla nueva los hereda | 03/11/2026 |
| PDF con membrete blanco y Archivo | El bloque guinda gastaba tóner, el escudo JPG quedaba con recuadro y Helvetica no se parecía al portal | 03/11/2026 |
| Resultado con la condición como foco y regla 0–1000 | El postulante quiere saber primero si ingresó; la regla muestra qué tan cerca quedó del mínimo | 30/10/2026 |
