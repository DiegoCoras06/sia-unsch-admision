# ADR-018: Panel administrativo — acceso del personal con segundo factor y permisos por rol

**Estado:** Aceptado
**Fecha:** 26/10/2026
**Impulsores:** spec [008](../../specs/008-panel-administrativo/requirements.md); RF-13.01 a RF-13.08; RNF-10 (auditoría inmutable); ADR-006 (autenticación)

## Contexto

El panel lo usan siete perfiles de la Dirección de Admisión con datos personales y dinero de por medio. Necesita cuentas del personal separadas de los postulantes, segundo factor obligatorio, permisos verificados en el servidor y auditoría de todo lo crítico. El portal ya tiene sesiones (refresh rotativo en cookie), JWT de acceso con roles y auditoría solo-inserción (Paso 5).

## Decisión

1. **Cuentas del personal** (`users.type = STAFF`) con un perfil propio (`usuarios.staff_profiles`): nombre, documento, cambio de contraseña obligatorio y secreto del segundo factor **cifrado** (AES-256-GCM).
2. **Segundo factor TOTP** (RFC 6238: 6 dígitos, 30 s; Google Authenticator, Microsoft Authenticator, etc.), obligatorio para todo usuario interno (RF-13.06). Primer ingreso: contraseña temporal → nueva contraseña → activar TOTP leyendo un QR. Cada paso devuelve un **desafío firmado de 10 minutos**; la sesión solo se emite después del código TOTP.
3. **Permisos por rol** en una tabla de código (`seguridad/domain/permissions.ts`), sembrada en la base para listarla. Cada ruta del panel declara su permiso; el servidor lo verifica (RF-13.07) y **registra en auditoría cada intento denegado**.

   | Rol | Ve y gestiona |
   |---|---|
   | Administrador general | Todo, incluidos usuarios y configuración |
   | Oficina de Admisión | Convocatoria, contenido, inscripciones, inhabilitados, asistente, casos, reportes |
   | Tesorería | Pagos y su reporte |
   | Evaluador documental | Inscripciones (expedientes en el Paso 7) |
   | Coordinador de examen | Inscripciones (aulas en el Paso 9) |
   | Operador de resultados | Inscripciones (resultados en el Paso 10) |
   | Soporte | Casos de atención y conversaciones del asistente |
   | Auditor | Auditoría, indicadores y reportes, solo lectura |

4. **Suspender o desactivar** una cuenta revoca todas sus sesiones al instante (RF-13.03, RF-13.08). El último administrador activo no puede quitarse el rol ni suspenderse.
5. **Escrituras por la API de cada módulo:** el panel es una capa de presentación (`/api/v1/admin/*`). Cambiar fechas, tasas o vacantes lo hace M01; contenido y funciones, M14; inhabilitados y casos, M13; base de conocimientos, M10. Las lecturas agregadas de M12 son consultas de solo lectura.
6. **Primer administrador:** la semilla crea `admin@sia-unsch.local` con una contraseña temporal aleatoria que escribe en `apps/backend/.admin-inicial.txt` (ignorado por git); nunca se imprime en consola ni se guarda en claro en la base.
7. **Exportación (RF-12.08):** Excel con `exceljs` y PDF con `pdfkit`, generados en el servidor con los filtros aplicados.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| SMS o correo como segundo factor | Familiar | Costo, depende de proveedor; el correo no es un factor independiente | TOTP no cuesta y funciona sin red |
| Proveedor externo de identidad (Cognito, Auth0) | Menos código | Otra dependencia y costo para la demo | El portal ya tiene sesiones propias auditadas |
| Permisos editables por pantalla | Flexible | Riesgo de dejar el sistema sin control | Roles fijos de la spec 008; se pueden ampliar en código |

## Consecuencias

**Positivas:** acceso del personal a la altura de los datos que maneja; cada permiso se prueba (SC-003: 100 % de accesos indebidos rechazados).

**Negativas / riesgos aceptados:** perder el teléfono bloquea el segundo factor → un administrador puede restablecerlo (queda en auditoría).

**Cómo verificamos que se cumple:** pruebas de integración del flujo completo de primer ingreso con TOTP real, de cada rol contra rutas ajenas (403 + auditoría), de suspensión con sesiones revocadas y del último administrador.
