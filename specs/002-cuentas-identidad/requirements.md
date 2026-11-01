# Requisitos — Cuentas del postulante e identidad

> **SDD (Spec-Driven Development) · artefacto 1 de 3: requisitos** (qué y por qué).
> Siguiente: [design.md](design.md) (cómo) · [tasks.md](tasks.md) (tareas). Principios: [constitución](../../.specify/memory/constitution.md).

**Rama:** `002-cuentas-identidad`
**Creada:** 25/10/2026
**Estado:** Aprobada · **Modificada el 25/10/2026 por [ADR-015](../../docs/adr/ADR-015-inscripcion-sin-cuenta.md):** el postulante ya no necesita cuenta para inscribirse; la consulta de identidad por DNI pasa a la spec 003. **Enmienda del mismo día:** la cuenta del postulante vuelve como **opcional** («Mi cuenta»: borrador en el servidor, historial y chatbot autenticado), vinculada a sus inscripciones por DNI; las cuentas del personal siguen en la spec 008. Las historias de este documento aplican a esa cuenta opcional.
**Módulos de arquitectura:** M02 Usuarios e identidad, M13 Seguridad
**Entrada:** "Hoy el postulante no tiene cuenta, todo es DNI + código. Quiero que cree su cuenta una vez, validada con su DNI, y desde ahí haga todo su proceso."

## Escenarios de usuario y pruebas

### Historia 1 — Crear mi cuenta con DNI (Prioridad: P1)

Como postulante, quiero crear una cuenta con mi DNI, correo y celular, para gestionar todo mi proceso desde un solo lugar (MEJ-01).

**Por qué esta prioridad:** ~~sin cuenta no hay inscripción, pagos ni seguimiento.~~ Desde ADR-015 la cuenta es opcional: aporta borrador en el servidor, historial y chatbot autenticado.

**Prueba independiente:** registrar un DNI de prueba del proveedor de identidad simulado y verificar que se crea la cuenta con nombres traídos del proveedor.

**Escenarios de aceptación:**

1. **Dado** un DNI válido y vigente, **cuando** lo ingreso con su dígito verificador, **entonces** el sistema muestra mis nombres y apellidos tal como figuran en el registro de identidad, sin que yo los escriba.
2. **Dado** que confirmo mis datos, ingreso correo, celular y contraseña, y acepto el tratamiento de datos personales, **cuando** envío el formulario, **entonces** se crea la cuenta en estado "Correo sin verificar" y recibo un código de 6 dígitos.
3. **Dado** que ya existe una cuenta con ese DNI, **cuando** intento registrarme, **entonces** se me indica que el DNI ya está registrado y se me ofrece recuperar la contraseña, sin revelar el correo completo.
4. **Dado** que el DNI figura en el registro de inhabilitados, **cuando** intento registrarme, **entonces** el sistema impide continuar e indica que debe acercarse a la Dirección de Admisión, sin detallar el motivo.
5. **Dado** que no acepto el tratamiento de datos, **cuando** intento enviar, **entonces** el botón permanece deshabilitado.

---

### Historia 2 — Verificar mi correo (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** un código correcto dentro de 15 minutos, **cuando** lo ingreso, **entonces** mi cuenta pasa a "Activa".
2. **Dado** 5 intentos fallidos, **cuando** ingreso un sexto, **entonces** el código se invalida y debo pedir uno nuevo.
3. **Dado** que pido reenviar el código, **cuando** han pasado menos de 60 segundos desde el anterior, **entonces** el sistema me pide esperar.

---

### Historia 3 — Iniciar y cerrar sesión de forma segura (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** credenciales válidas, **cuando** inicio sesión con DNI o correo y contraseña, **entonces** entro a mi panel.
2. **Dado** 5 intentos fallidos en 15 minutos, **cuando** intento de nuevo, **entonces** la cuenta se bloquea temporalmente 15 minutos y se me avisa por correo.
3. **Dado** que cierro sesión, **cuando** vuelvo atrás en el navegador, **entonces** no puedo ver información privada.
4. **Dado** 30 minutos sin actividad, **cuando** intento una acción, **entonces** se me pide volver a iniciar sesión, conservando el borrador de inscripción.

---

### Historia 4 — Recuperar mi contraseña (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** mi DNI o correo, **cuando** solicito recuperar, **entonces** recibo un enlace de un solo uso válido por 30 minutos; el mensaje en pantalla es el mismo exista o no la cuenta.
2. **Dado** que uso el enlace y defino una nueva contraseña, **cuando** la guardo, **entonces** se cierran todas mis sesiones abiertas.

---

### Historia 5 — Ver y actualizar mi perfil (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** que estoy en mi perfil, **cuando** actualizo celular, dirección o correo, **entonces** el cambio se guarda; si cambio el correo, debo verificar el nuevo.
2. **Dado** que estoy en mi perfil, **cuando** intento modificar nombres, apellidos o DNI, **entonces** esos campos no son editables y se explica que provienen del registro de identidad (RN-20, Art. 17.6).
3. **Dado** mi perfil, **cuando** lo abro, **entonces** veo mi **código de postulante** único.

---

### Historia 6 — Ver la actividad de mi cuenta (Prioridad: P3)

**Escenarios de aceptación:**

1. **Dado** mi panel, **cuando** abro "Actividad", **entonces** veo inicios de sesión, cambios de datos y acciones del proceso con fecha y hora.

### Casos límite

- Proveedor de identidad no disponible → se permite continuar con nombres ingresados manualmente, la cuenta queda "Identidad pendiente de verificación" y Admisión la valida antes de habilitar al postulante.
- Postulante extranjero sin DNI (traslado internacional, Art. 45) → registro con pasaporte o carné de extranjería; la verificación es manual.
- DNI de un menor de edad → se permite (postulantes de 5.º de secundaria, RN-13).
- Correo ya usado por otra cuenta → se rechaza.

## Requisitos

### Requisitos funcionales

- **FR-001**: El sistema DEBE permitir el registro con DNI (o pasaporte/CE para extranjeros), correo y celular. *(RF-02.01)*
- **FR-002**: El sistema DEBE consultar el proveedor de identidad para obtener nombres y validar la vigencia del DNI; en esta versión el proveedor es **simulado y etiquetado** como tal. *(RF-02.02, RN-21, Constitución II.3)*
- **FR-003**: El sistema DEBE impedir el registro de personas del registro de inhabilitados. *(RN-09, RF-02.03)*
- **FR-004**: El sistema DEBE impedir más de una cuenta por documento de identidad y por correo. *(RF-02.03)*
- **FR-005**: El sistema DEBE exigir contraseñas de al menos 10 caracteres, rechazando las más comunes, y almacenarlas solo como hash. *(RF-02.04)*
- **FR-006**: El sistema DEBE verificar el correo con un código de 6 dígitos que vence en 15 minutos. *(RF-02.06)*
- **FR-007**: El sistema DEBE permitir iniciar sesión, cerrar sesión y recuperar la contraseña con enlace de un solo uso. *(RF-02.05)*
- **FR-008**: El sistema DEBE bloquear temporalmente tras 5 intentos fallidos y notificar al titular. *(RF-13.07)*
- **FR-009**: El sistema DEBE registrar el consentimiento de tratamiento de datos con fecha, hora y versión del texto aceptado. *(RF-13.09, RNF-03)*
- **FR-010**: El sistema DEBE generar un código de postulante único por cuenta. *(RF-02.08)*
- **FR-011**: El sistema DEBE permitir editar solo los datos de contacto; los de identidad requieren trámite ante Admisión. *(RF-02.07, RN-07)*
- **FR-012**: El sistema DEBE registrar la actividad principal del postulante. *(RF-02.08)*
- **FR-013**: El sistema DEBE permitir al titular cerrar todas sus sesiones abiertas. *(RF-13.08)*

### Entidades clave

- **Usuario**: credenciales, estado (sin verificar, activa, bloqueada, suspendida), roles.
- **Postulante**: perfil del usuario con documento de identidad, nombres, fecha de nacimiento, contacto, dirección y código de postulante.
- **Verificación de identidad**: resultado de la consulta al proveedor (verificado, pendiente, rechazado), proveedor y fecha.
- **Consentimiento**: versión del texto, fecha y aceptación.
- **Registro de inhabilitados**: documento, motivo, resolución y vigencia (lo gestiona Admisión en `008`).

## Criterios de éxito

- **SC-001**: Un postulante crea y verifica su cuenta en menos de 3 minutos.
- **SC-002**: 0 cuentas duplicadas por documento en las pruebas de concurrencia (dos registros simultáneos del mismo DNI).
- **SC-003**: Ningún mensaje del sistema permite averiguar si un correo o DNI está registrado, salvo el aviso del escenario 1.3, que muestra el correo parcialmente oculto.
- **SC-004**: Ninguna contraseña se almacena ni registra en texto plano (verificado por revisión de código y de registros).

## Supuestos

- La integración real con RENIEC requiere convenio; mientras tanto se usa un conjunto de DNI sintéticos.
- El envío de correo usa un servicio de prueba en desarrollo.

## Fuera de alcance

- Cuentas del personal administrativo y MFA (ver `008-panel-administrativo`).
- Inicio de sesión con redes sociales.

## Estado de los requisitos (28/10/2026)

11 de 11 requisitos del catálogo citados en esta funcionalidad están implementados y probados. Fuente: [matriz de trazabilidad](../../docs/trazabilidad-requisitos.md).

| RF | Estado | Detalle |
|---|---|---|
| RF-02.01 | ✅ | Inscripción y cuenta opcional con DNI, correo y celular |
| RF-02.02 | ✅ | Consulta de DNI con apiperu.dev (token solo en el servidor): autocompleta nombres y apellidos; si no responde, el postulante los escribe |
| RF-02.03 | ✅ | Una inscripción por DNI y convocatoria; registro de inhabilitados |
| RF-02.04 | ✅ | Cuenta opcional con contraseña segura (argon2, mínimo 10 caracteres, lista de comunes) |
| RF-02.05 | ✅ | Ingresar, cerrar sesión (también en todos los dispositivos) y recuperar la contraseña por correo |
| RF-02.06 | ✅ | Código de 6 dígitos por correo al crear la cuenta y al cambiar de correo |
| RF-02.07 | ✅ | «Mi cuenta»: correo, celular, dirección y apoderado |
| RF-02.08 | ✅ | Código de postulante con dígito Luhn y auditoría de actividades |
| RF-13.07 | ✅ | Permiso por ruta; cada acceso denegado queda auditado |
| RF-13.08 | ✅ | Suspender, cambiar roles o restablecer cierra todas las sesiones |
| RF-13.09 | ✅ | Consentimiento versionado al crear cuenta y al inscribirse (versión y huella del texto) |

✅ implementado y probado · 🟡 parcial (lo que falta depende de un servicio externo o está anotado) · ⏳ pendiente
