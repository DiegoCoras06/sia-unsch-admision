# Requisitos — Notificaciones al postulante

> **SDD (Spec-Driven Development) · artefacto 1 de 3: requisitos** (qué y por qué).
> Siguiente: [design.md](design.md) (cómo) · [tasks.md](tasks.md) (tareas). Principios: [constitución](../../.specify/memory/constitution.md).

**Rama:** `010-notificaciones`
**Creada:** 25/10/2026
**Estado:** En revisión
**Módulos de arquitectura:** M11 Notificaciones
**Entrada:** "Que el postulante no tenga que entrar a cada rato a la web: que le llegue un correo cuando cambia su estado, cuando se publica su aula o sus resultados, y recordatorios de fechas."

## Escenarios de usuario y pruebas

### Historia 1 — Recibir avisos de cada cambio de estado (Prioridad: P1)

**Escenarios de aceptación:**

1. **Dado** que creo mi cuenta, **cuando** se registra, **entonces** recibo el código de verificación por correo. *(RF-11.01)*
2. **Dado** que mi pago se confirma, **cuando** cambia el estado, **entonces** recibo un correo con enlace a mi ficha. *(RF-11.02)*
3. **Dado** que mi expediente es observado, **cuando** el evaluador finaliza la revisión, **entonces** recibo un correo con la fecha límite de subsanación, sin el detalle de documentos sensibles en el asunto. *(RF-11.04)*
4. **Dado** que se publica la distribución de aulas o los resultados, **cuando** se publican, **entonces** recibo un aviso con enlace a mi panel (sin incluir mi puntaje en el correo). *(RF-11.06, RF-11.07)*

---

### Historia 2 — Ver mis notificaciones en la plataforma (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** mi panel, **cuando** abro la campana de notificaciones, **entonces** veo todas las notificaciones con estado leído/no leído.

---

### Historia 3 — Recibir recordatorios de fechas (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** una inscripción pendiente de pago, **cuando** faltan 2 días para el cierre de la etapa regular, **entonces** recibo un recordatorio con el monto y el aviso del recargo extemporáneo. *(RF-11.05)*
2. **Dado** que soy apto, **cuando** falta 1 día para mi examen, **entonces** recibo la hora límite de ingreso y la lista de qué llevar.

---

### Historia 4 — Enviar comunicados segmentados (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** que soy de la Oficina de Admisión, **cuando** envío un comunicado a "Exonerados con expediente observado", **entonces** solo esos postulantes lo reciben y veo cuántos fueron enviados, entregados y rebotados. *(RF-11.08, RF-11.09)*

---

### Historia 5 — Elegir mis preferencias (Prioridad: P3)

**Escenarios de aceptación:**

1. **Dado** mis preferencias, **cuando** desactivo recordatorios, **entonces** dejo de recibirlos, pero sigo recibiendo los avisos obligatorios del proceso.

### Casos límite

- El correo rebota → se marca el correo como no válido y se avisa en el panel para que lo actualice.
- Falla el servicio de correo → se reintenta hasta 3 veces sin enviar duplicados.
- Comunicado masivo de 2 000 destinatarios → se envía en lotes respetando el límite del proveedor.

## Requisitos

### Requisitos funcionales

- **FR-001**: El sistema DEBE notificar por correo la creación de cuenta, pagos, cambios de estado, observaciones, aula y resultados. *(RF-11.01 a RF-11.04, RF-11.06, RF-11.07)*
- **FR-002**: El sistema DEBE enviar recordatorios automáticos de fechas importantes. *(RF-11.05)*
- **FR-003**: El sistema DEBE permitir comunicados segmentados por modalidad, programa o estado. *(RF-11.08)*
- **FR-004**: El sistema DEBE registrar estado de envío y entrega de cada notificación. *(RF-11.09)*
- **FR-005**: El sistema DEBE mostrar las notificaciones dentro de la plataforma. *(MEJ-13)*
- **FR-006**: El sistema DEBE usar plantillas editables y no incluir datos sensibles en asuntos ni cuerpos de correo. *(RNF-03)*
- **FR-007**: El sistema DEBE reintentar envíos fallidos sin duplicar. *(RNF-08)*
- **FR-008**: El sistema PUEDE enviar SMS opcionales cuando exista proveedor autorizado.

### Entidades clave

- **Plantilla**: evento, asunto, cuerpo, canal.
- **Notificación**: destinatario, evento, canal, estado (pendiente, enviada, entregada, rebotada, fallida), intentos.
- **Preferencia**: postulante, tipo, activo.

## Criterios de éxito

- **SC-001**: El 95 % de las notificaciones de cambio de estado se envía en menos de 2 minutos.
- **SC-002**: 0 notificaciones duplicadas en pruebas con fallas simuladas del proveedor.

## Supuestos

- En desarrollo se usa un buzón de prueba que captura los correos sin enviarlos.

## Fuera de alcance

- Notificaciones push en aplicación móvil nativa.

## Estado de los requisitos (28/10/2026)

7 de 8 requisitos del catálogo citados en esta funcionalidad están implementados y probados. Fuente: [matriz de trazabilidad](../../docs/trazabilidad-requisitos.md).

| RF | Estado | Detalle |
|---|---|---|
| RF-11.01 | ✅ | Correos de código de verificación y de cuenta creada |
| RF-11.02 | ✅ | Correos de orden generada y pago confirmado, registrados en M11 |
| RF-11.04 | ✅ | Correo con los documentos observados y el plazo de subsanación |
| RF-11.05 | ✅ | Recordatorio de pago 2 días antes del cierre y recordatorio la víspera del examen, sin duplicados y con preferencia |
| RF-11.06 | ✅ | Aviso único por postulante cuando se publica su aula |
| RF-11.07 | ✅ | Aviso de resultados disponibles, sin puntaje en el correo |
| RF-11.08 | ✅ | Comunicados por modalidad, programa y estado con enviados, en cola y fallidos |
| RF-11.09 | 🟡 | Registro de cada correo con estado e intentos (hasta 3, sin duplicar); el estado «rebotado» llega con Amazon SES (Paso 11) |

✅ implementado y probado · 🟡 parcial (lo que falta depende de un servicio externo o está anotado) · ⏳ pendiente
