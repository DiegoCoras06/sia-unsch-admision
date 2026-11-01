# Diseño — Panel administrativo, seguridad y reportes

> **SDD (Spec-Driven Development) · artefacto 2 de 3: diseño** (cómo se construye).
> Anterior: [requirements.md](requirements.md) · Siguiente: [tasks.md](tasks.md). Arquitectura general: [docs/arquitectura.md](../../docs/arquitectura.md) y [ADR](../../docs/adr/README.md).


## 1. Plan técnico

**Spec:** [requirements.md](requirements.md) · **Decisión:** [ADR-018](../../docs/adr/ADR-018-panel-acceso-personal.md) · **Tareas:** [tasks.md](./tasks.md)

### Alcance de la iteración 1

| Historia | Incluido | Queda para otra iteración |
|---|---|---|
| H1 Convocatoria | Editar fechas de etapas (con validación y aviso de superposición), tasas (confirmación si es 0), vacantes con resolución y motivo; copiar la convocatoria a un periodo nuevo | Importar vacantes desde Excel |
| H2 Indicadores | Inscripciones por estado, modalidad y programa; recaudación y transacciones; uso del asistente; filtros; Excel y PDF; vista según rol | Expedientes y aulas (llegan con los pasos 7 y 9) |
| H3 Usuarios | Crear, roles, activar/suspender/desactivar con cierre de sesiones; primer ingreso con TOTP; último administrador protegido | — |
| H4 Auditoría | Búsqueda por usuario, acción, recurso y fechas; sin opción de editar | — |
| H5 Inhabilitados | Registrar y retirar; anular inscripciones del mismo documento con la resolución | — |
| H6 Contenido | Comunicados y fe de erratas; bloques de texto del portal | Envío segmentado (Paso 10, M11) |
| H7 Casos | Lista, detalle, cambio de estado; consulta pública por número de caso | Denuncia anónima con evidencia |
| H8 Configuración | Funciones por etapa; estado de integraciones (secretos enmascarados); fallas de la outbox con reintento; respaldos y política de retención | Edición de credenciales desde el panel (se mantienen en variables de entorno / Secrets Manager) |
| Asistente (009) | Editar la base de conocimientos; indicadores de uso | — |

### Diseño

- **M13 seguridad:** `permissions.ts` (roles → permisos), `guard(permiso)` con auditoría del rechazo, `StaffAdmin` (usuarios internos), `AuditQueries`, `DisqualifiedRegistry`, `SupportCases` (gestión), `totp.ts`, `secret-box.ts`.
- **M02 usuarios:** `StaffAuthService` (login → cambio de contraseña → TOTP → sesión) reutilizando sesiones, cookie y `/auth/refresh`.
- **M01 convocatorias:** `CallAdmin` (etapas, tasas, vacantes, copia de convocatoria).
- **M14 configuracion:** `ContentAdmin` (comunicados, bloques, funciones), `SystemStatus` (integraciones, respaldos, retención).
- **M10 asistente:** `KnowledgeAdmin` y uso.
- **M12 reportes (nuevo):** `ReportQueries` (solo lectura) y exportadores Excel/PDF.
- **Presentación:** `/api/v1/admin/*` con un router por área; todos detrás de `authenticate` + `guard`.
- **Frontend:** `/admin` (Angular, carga diferida): ingreso, inicio con indicadores, convocatoria, inscripciones, pagos, usuarios, auditoría, inhabilitados, contenido, casos, asistente y configuración. Estilo de pantalla de trabajo: tablas, filtros y formularios densos con la identidad UNSCH.

### Verificación

Pruebas de integración: primer ingreso con TOTP real; cada rol contra rutas ajenas (403 + auditoría); suspensión cierra sesiones; último administrador; cambios de fechas, tasas y vacantes auditados con antes y después; copia de convocatoria; exportaciones Excel y PDF válidas; inhabilitar anula la inscripción. E2E por la interfaz del flujo de ingreso y de una edición.

## 2. Actualizaciones de diseño (27 y 28/10/2026)

- **Catálogo del concurso** (`/admin/catalogo`, `CatalogAdmin`): modalidades, tipos de vacante, submodalidades con criterios de evaluación, facultades, áreas, programas y documentos exigidos por submodalidad (RF-01.02, RF-01.04, RF-04.11, RF-06.01, RF-14.03), con auditoría.
- **Imágenes de la portada** en «Contenido del portal» (RF-14.01): reemplazo con descripción y vuelta a la original.
- **Retención** (RF-13.10): «Aplicar retención» también anonimiza inscripciones antiguas.
- **Exportación** de expedientes y asistencia a Excel/PDF (RF-12.04, RF-12.06); botón «Documentos» en Inscripciones (RF-03.05).
- **Casos tipo Denuncia** desde el portal (`POST /support/complaint`).
- **Almacenamiento S3** de los archivos del sistema (ver `../004-inscripcion-exonerados/design.md`).

## 3. Ingreso del personal rediseñado (30/10/2026, skill interface-design)

- **Pantalla dividida** (`features/admin/admin-login.ts`): a la izquierda, la carátula de la Dirección de Admisión en guinda: escudo, universidad, «Dirección de Admisión» y los datos reales del proceso vigente tomados del cronograma (proceso y fechas de examen en dorado), con el aviso de que cada ingreso queda registrado (auditoría `staff.login` y `staff.login_failed` con fecha, IP cifrada y navegador). A la derecha, el formulario centrado sobre blanco.
- **Pasos visibles**: «Paso 1 de 2: Correo y contraseña» → «Código de verificación»; en el primer ingreso, 3 pasos (contraseña propia y segundo factor). El flujo de seguridad de ADR-018 no cambia.
- **Detalles de uso**: mostrar u ocultar la contraseña (botón con `aria-pressed`), aviso de mayúsculas activadas, contador de 10 caracteres en la contraseña nueva, botones desactivados hasta que el código tenga 6 dígitos, código en dígitos grandes y tabulares, ayuda para recuperar el acceso y «Usar otra cuenta».
- **Celular** (≤ 860 px): la carátula se reduce a un encabezado con el escudo y el nombre de la oficina; sin desborde a 375 px.
