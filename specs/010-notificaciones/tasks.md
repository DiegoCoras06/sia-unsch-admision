# Tareas: Notificaciones

> **SDD (Spec-Driven Development) · artefacto 3 de 3: tareas** (pasos de implementación verificables).
> Anterior: [requirements.md](requirements.md) · [design.md](design.md).

**Spec:** [requirements.md](requirements.md) · **Plan:** [design.md](design.md)

- [x] T901 Esquema `notificaciones` (notificación, plantilla, comunicado, preferencia) y migración
- [x] T902 Decorador del envío de correo que registra cada notificación (RF-11.09)
- [x] T903 Cola con deduplicación y reintentos (hasta 3) — `notifications.tick`
- [x] T904 [H3] Recordatorios de pago y de examen; aulas publicadas; resultados disponibles
- [x] T905 [H4] Comunicados segmentados por modalidad, programa y estado, con conteos
- [x] T906 [H2] Bandeja del postulante con leídas y no leídas
- [x] T907 [H5] Preferencia de recordatorios (los avisos obligatorios no se desactivan)
- [x] T908 Plantillas editables en el panel
- [x] T910 Pruebas de integración — `tests/integration/notifications.test.ts`
- [x] T911 Panel: notificaciones, comunicados y plantillas

## Tareas agregadas (27 y 28/10/2026)

- [x] T912 Correo de anulación de la inscripción (RF-11.03)
