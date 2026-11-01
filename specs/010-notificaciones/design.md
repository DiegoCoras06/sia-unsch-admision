# Diseño — Notificaciones al postulante

> **SDD (Spec-Driven Development) · artefacto 2 de 3: diseño** (cómo se construye).
> Anterior: [requirements.md](requirements.md) · Siguiente: [tasks.md](tasks.md). Arquitectura general: [docs/arquitectura.md](../../docs/arquitectura.md) y [ADR](../../docs/adr/README.md).


## 1. Plan técnico

**Rama:** `010-notificaciones` · **Fecha:** 26/10/2026 · **Spec:** [requirements.md](requirements.md) · **Módulo:** M11 Notificaciones

### Resumen

Módulo nuevo `notificaciones` (esquema PostgreSQL `notificaciones`):

- **Registro de cada envío** (RF-11.09): un decorador del `EmailSender` guarda cada correo que envía cualquier módulo (destinatario, asunto, evento, estado `ENVIADA`/`FALLIDA`, intentos, error). Los correos existentes de M02, M03, M05, M06 y M08 quedan registrados sin cambiar esos módulos.
- **Bandeja en la plataforma** (H2): el postulante ve sus notificaciones (por el correo de su inscripción) en «Imprimir documentos» y marca leídas.
- **Plantillas editables** (FR-006): asunto y cuerpo con variables `{{nombre}}`, `{{codigo}}`, `{{enlace}}` para recordatorios, aulas publicadas, resultados disponibles y comunicados.
- **Avisos automáticos** con clave de deduplicación (sin duplicados, SC-002), desde el ciclo del servidor (`notifications.tick`):
  - recordatorio de pago 2 días antes del cierre de la inscripción regular (H3-1, con el aviso del recargo);
  - recordatorio la víspera del examen con la hora de cierre y qué llevar (H3-2);
  - aulas publicadas (RF-11.06) y resultados disponibles sin puntaje (RF-11.07).
- **Comunicados segmentados** (H4, RF-11.08): por modalidad, programa y estado de la inscripción; se encolan y se envían en lotes de 50; el panel muestra enviados y fallidos.
- **Preferencias** (H5): el postulante puede desactivar recordatorios; los avisos obligatorios siempre llegan.
- **Reintentos**: hasta 3 intentos por notificación encolada, sin volver a enviar las ya enviadas.

### Decisiones

| Tema | Decisión |
|---|---|
| Rebotes | El proveedor de desarrollo no informa rebotes; el estado `REBOTADA` queda previsto para Amazon SES (Paso 11). |
| SMS | Fuera de esta iteración (FR-008 es opcional). |
| Datos sensibles | Ni puntajes ni DNI en asuntos o cuerpos (RNF-03); los correos llevan al portal. |
| Permiso | `notificaciones.gestionar`. |

## 2. Actualizaciones de diseño (27 y 28/10/2026)

- **Aviso de anulación** (RF-11.03): el evento `InscripcionAnulada` envía al postulante un correo con el motivo y la resolución.
