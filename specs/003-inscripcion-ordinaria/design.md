# Diseño — Inscripción en la modalidad Ordinario

> **SDD (Spec-Driven Development) · artefacto 2 de 3: diseño** (cómo se construye).
> Anterior: [requirements.md](requirements.md) · Siguiente: [tasks.md](tasks.md). Arquitectura general: [docs/arquitectura.md](../../docs/arquitectura.md) y [ADR](../../docs/adr/README.md).


## 1. Plan técnico

**Rama:** `003-inscripcion-ordinaria` · **Fecha:** 25/10/2026 · **Especificación:** [requirements.md](requirements.md) (ver *Aclaraciones* y ADR-015)
**Alcance de esta iteración:** Historias 1–4 sin cuenta — formulario público, foto, confirmación con orden de pago y seguimiento con DNI + código. Fuera: pago en línea (005), ficha PDF con QR (H5), reinscripción (H6), anulación (H7).

### Resumen

Nuevo módulo **M03 Inscripción** (esquema `inscripciones`) con tres endpoints públicos: consulta de identidad por DNI (autocompleta nombres), registro de la inscripción con foto y consulta del estado con DNI + código de postulante. Usa la API pública de M01 (etapas abiertas, vacantes, tasa), M13 (padrón de inhabilitados) y el puerto `IdentityProvider` de M02.

### Contexto técnico

| Aspecto | Valor |
|---|---|
| Almacenamiento | PostgreSQL esquema `inscripciones`; foto en `FileStorage` (`LocalFileStorage` en local, S3 en AWS — ADR-010) |
| Identidad | `MockIdentityProvider` (DNI sintéticos) o `HttpIdentityProvider` configurable con token propio (`IDENTITY_PROVIDER=http`) |
| Ubigeos | `shared/data/ubigeo.json` (INEI 2016, 1874 distritos) para validar códigos |
| Foto | JPEG 240 × 320 px ≤ 2 MB; el navegador recorta y redimensiona antes de enviar; el servidor verifica tipo real y dimensiones leyendo la cabecera JPEG |

### Verificación de la constitución

| Artículo | ¿Cumple? | Nota |
|---|---|---|
| I — Especificación primero | ✅ | Aclaraciones registradas en spec 003 y ADR-015 antes del código |
| II — Fidelidad institucional | ✅ | Etapas, tasas y vacantes salen de M01; identidad simulada etiquetada |
| III — Monolito modular | ✅ | M03 solo usa `index.ts` de M01, M02 y M13 |
| V — Privacidad | ✅ | La consulta de estado enmascara documento y correo; límites de uso por IP |
| VI — UX | ✅ | Formulario por secciones, resumen en vivo, móvil primero |

### Modelo de datos (`inscripciones.applications`)

| Grupo | Campos |
|---|---|
| Identificación | `call_code`, `applicant_code` (único, 8 dígitos Luhn), `document_type` (DNI/CE), `document_number`, `identity_status` (VERIFIED/PENDING) — **único `(call_code, document_type, document_number)`** |
| Básica | apellidos, nombres, `sex`, `marital_status`, `birth_ubigeo`, `birth_date`, `address`, `residence_ubigeo`, `economic_dependency`, `phone` (opcional), `mobile`, `email`, `photo_key` |
| Académica | `school_ubigeo`, `school_name`, `school_type`, `graduation_year`, `in_fourth_or_below`, `preparation`, `attempts` |
| Postulación | `modality` (ORD/EXO/CEPRE), `quota_category` (ORD, DIS, PS-U…), `campus`, `area`, `option_code`, `military_condition`, `family_link`, `no_vacancy_right` |
| Pago y estado | `fee_total`, `fee_lines` (json), `status` (`PENDIENTE_PAGO`, `PENDIENTE_VALIDACION`, `APTA`, `OBSERVADA`, `ANULADA`), `declaration_accepted_at`, `created_at` |

Exonerados quedan en `PENDIENTE_VALIDACION` (RN-24: requisitos validados por Admisión); ordinarios y CEPRE en `PENDIENTE_PAGO`.

### Contrato

[contracts/openapi.yaml](./contracts/openapi.yaml): `POST /identity/lookup`, `GET /inscriptions/options`, `POST /inscriptions`, `GET /inscriptions/status`.

### Reglas aplicadas en `RegisterInscription`

1. Etapa abierta para la modalidad (regular o extemporánea) — si no, 422 `STAGE_CLOSED` con la fecha de apertura.
2. Documento no inhabilitado (RN-09) — 422 `REGISTRATION_NOT_ALLOWED`.
3. Una inscripción por documento y convocatoria (RN-06) — 409 `ALREADY_REGISTERED`.
4. El programa tiene vacantes en la categoría elegida — 422 `NO_VACANCIES`.
5. Tasa calculada por M01 en el servidor; el navegador nunca envía el monto.
6. 4.º de secundaria o inferior → `no_vacancy_right = true` (RN-13).
7. Ubigeos válidos, foto válida, declaración jurada aceptada.
8. Transacción: inscripción + auditoría + evento `InscripcionRegistrada` (correo con código y orden de pago).

### Pruebas

Integración (`tests/integration/inscriptions.test.ts`): registro feliz con tasa correcta, duplicado → 409, inhabilitado → 422, CEPRE fuera de etapa → 422, sin vacantes → 422, foto inválida → 400, consulta de estado con código correcto/incorrecto. E2E por la interfaz: `scripts/e2e-inscripcion.mjs`.

## 2. Contratos de la API

- [contracts/openapi.yaml](contracts/openapi.yaml)

## 3. Actualizaciones de diseño (27 y 28/10/2026)

- **Consentimiento versionado en la inscripción** (RF-13.09): se guarda la versión aceptada y el SHA-256 del texto; si la versión no es la vigente, `CONSENT_OUTDATED`.
- **Documentos adicionales** (RF-03.05, entidad `ApplicationDocument`): DNI, estudios, servicio militar y vínculo UNSCH según la inscripción; con S3, subida directa al bucket (`POST /inscriptions/documents/upload-url` → formulario prefirmado → `POST /inscriptions/documents` con `uploadKey`), validación del contenido real y enlace temporal para el personal.
- **Retención** (RF-13.10): `anonymizeExpired` anonimiza las inscripciones de convocatorias anteriores y borra sus archivos (tarea diaria `retention.apply`).
- **Foto de la inscripción:** sigue pasando por la API (≤ 2 MB) y se guarda en el almacenamiento configurado (local o S3).

### Pulido de interfaz (29/10/2026)

- **Inscripción por pasos** (crítica de Impeccable del 29/10/2026, 27/40): el formulario de unos 30 campos se reparte en cinco pasos (Tus datos, Fotografía, Colegio, Postulación, Revisión) con indicador «Paso N de 5», validación por paso y foco en el primer campo pendiente. La **Revisión** muestra todos los datos, la foto, el programa y el monto con «Cambiar» por bloque antes de la declaración jurada. En el celular, barra fija con el paso y el monto. Mismos campos, reglas, API y borrador (al continuar, abre el primer paso incompleto). `inscription.html`, `inscription.ts`, `inscription.scss`.
- **Constancia y pago** (`inscription-receipt.ts`): orden código → estado → ficha (si ya pagó) → datos → monto con desglose → pago en línea → ventanilla plegable. La espera tras pagar vive en la constancia: «Confirmando tu pago con Culqi…» y, si pasa de ~15 s, aviso para volver a consultar. Las páginas reciben el estado con `(updated)`.
- **Resumen de errores enlazado** (pauta «Focusable Error Summary» de UI UX Pro Max): si «Siguiente» falla, el foco va a un resumen `role="alert"` con un enlace por campo pendiente que lleva a ese campo. En el celular, `scroll-padding-bottom` evita que la barra fija tape el campo enfocado.
- **Paso 1 en subgrupos** (segunda crítica, 28/40): «Tus datos» se divide en **Identidad**, **Dónde vives** y **Cómo te contactamos** (`<fieldset>` con `<legend>` y una línea de ayuda), con la fecha y el lugar de nacimiento junto a la identidad. Con más de 4 datos pendientes, el resumen dice «Falta completar N datos» y muestra una línea por subgrupo que lleva a su primer dato pendiente; con 4 o menos, un enlace por campo.
- **Errores ligados a su campo** (segunda crítica, P2): cada mensaje `.field-error` tiene `id="e-<campo>"` y el campo lo nombra en `aria-describedby` solo mientras hay error (22 campos, los grupos de opción, la foto y el aviso de modalidad cerrada); si el campo ya tenía una ayuda, se leen ambas. Con lector de pantalla se oye el motivo, no solo «inválido».
- **Pasos con nombre en el celular** (tercera crítica, P1): bajo 760 px, el nombre de los pasos que no son el actual queda oculto solo a la vista (patrón «solo lector de pantalla»), no con `display: none`; el lector anuncia «2 Fotografía» en vez de un botón sin nombre.
- **Cuarta crítica (28/40), los 3 P1:** (1) **Sin desborde a 375 px**: bajo 760 px la barra muestra cinco botones iguales solo con el número (el nombre del paso está en el título de abajo y queda para el lector de pantalla) y las rejillas `.main`, `.block` y `.card` usan `minmax(0, 1fr)`; la página mide 375 px. (2) **Errores que dicen qué hacer**: cada campo tiene su mensaje («Escribe tu celular: 9 dígitos que empiezan con 9», «Elige el departamento, la provincia y el distrito donde naciste»…) en lugar de «Este dato es obligatorio»; el resumen va **arriba** del paso (bajo el título), nombra los datos que faltan por subgrupo y sus enlaces apuntan al campo (`href="#f-doc"`). (3) **Asistente sin tapar texto**: en la inscripción, bajo 1100 px, el botón flotante cede su lugar a «Ayuda» en la barra fija (evento `sia-asistente`), y en todo el sitio se oculta mientras el menú del celular está abierto.
- **Modalidad al inicio** (cuarta crítica, P2): la modalidad pasa del paso 4 al primer subgrupo del paso 1 («¿Por qué modalidad postulas?»), con una nota que toma el plazo del cronograma en curso («Inscripción abierta hasta el viernes, 6 de noviembre», recargo si es extemporánea) y avisa que en Exonerados un evaluador revisa el expediente antes del pago. Así nadie llena tres pasos para descubrir que su modalidad está cerrada.
- **Quinta crítica (29/40), los 3 P1:** (1) **«¿No encuentras tu código?»** en Mi inscripción, Buscar aula y Ver puntaje (`shared/code-reminder.ts`): `POST /api/v1/inscriptions/code-reminder {documentNumber}` → 202 con el mismo mensaje exista o no la inscripción (no permite averiguar quién se inscribió); si existe en la convocatoria vigente, el evento `CodigoPostulanteRecordado` envía el código **solo al correo registrado** y su contenido se borra de la outbox tras el envío; límite de 5 por hora por IP y 3 por día por documento; auditoría `inscription.code_reminded`. (2) **Borrador en equipos compartidos**: el borrador se guarda 7 días (antes 30) y la nota ofrece «¿Equipo compartido o cabina? Borrar mis datos de este equipo», que lo borra y deja de guardar en esa visita. (3) **Seis pasos**: «Tus datos» (modalidad e identidad) y «Domicilio y contacto» son pasos distintos; la revisión tiene un grupo y un «Cambiar» para cada uno; en el celular la barra muestra seis botones de 46 px. El script `scripts/e2e-inscripcion.mjs` ahora avanza con «Siguiente» (no se ejecutó contra RDS).
- **Línea del trámite en «Mi inscripción»** (30/10/2026, skill interface-design; `inscription-track.ts`): reemplaza la línea de estado de la constancia por los pasos del trámite con su fecha real: Inscripción registrada → (Expediente revisado, solo exonerados) → Pago confirmado → Ficha de inscripción → Aula asignada (24 h antes del examen, del cronograma) → Examen y resultado (CEPRE termina en la ficha). Completado en guinda con check; el paso en curso en dorado con halo; observación del expediente en ámbar; si todo está al día, lo que sigue se destaca. `aria-current="step"` y estado para lector de pantalla; horizontal en escritorio y vertical en el celular. Una inscripción anulada muestra un aviso en lugar de la línea.
- **Buscador de programa** (30/10/2026, skill interface-design; crítica: «Programa en un select de 34 sin buscador»): en el paso «Postulación», un campo con lupa filtra el selector de programa mientras se escribe, sin distinguir tildes ni mayúsculas («ingenieria» encuentra 10 programas), con contador en vivo; el programa ya elegido no desaparece al buscar. Se mantiene el `<select>` nativo (accesible con teclado y en el celular) en lugar de un combobox propio.
