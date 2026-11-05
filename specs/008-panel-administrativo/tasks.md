# Tareas: Panel administrativo (iteración 1)

> **SDD (Spec-Driven Development) · artefacto 3 de 3: tareas** (pasos de implementación verificables).
> Anterior: [requirements.md](requirements.md) · [design.md](design.md).

**Entrada:** [design.md](design.md), [requirements.md](requirements.md), ADR-018
**Formato:** `- [ ] T### [P] [H#] Descripción — ruta`

## Fase 1 — Acceso del personal (H3)

- [x] T501 Perfil del personal, secreto TOTP cifrado y semilla de roles, permisos y primer administrador — `prisma/`, `seguridad/domain/permissions.ts`
- [x] T502 [P] TOTP RFC 6238 y caja de secretos AES-256-GCM con pruebas — `seguridad/infrastructure/`
- [x] T503 Ingreso del personal: contraseña → cambio obligatorio → TOTP → sesión — `usuarios/application/staff-auth-service.ts`
- [x] T504 `guard(permiso)` con auditoría del acceso denegado — `seguridad/presentation/`
- [x] T505 Usuarios internos: crear, roles, suspender, desactivar, restablecer TOTP; último administrador — `usuarios/application/staff-admin.ts`

## Fase 2 — Gestión

- [x] T510 [H1] Etapas, tasas, vacantes con resolución y copia de convocatoria — `convocatorias/application/call-admin.ts`
- [x] T511 [H4] Consulta de auditoría — `seguridad/application/security-admin.ts`
- [x] T512 [H5] Inhabilitados con anulación de inscripciones — `seguridad/`, `inscripciones/`
- [x] T513 [H6] Comunicados, bloques de contenido y funciones por etapa — `configuracion/application/content-admin.ts`
- [x] T514 [H7] Casos: lista, estado y consulta pública — `seguridad/`
- [x] T515 [H8] Integraciones, fallas con reintento, respaldos y retención — `configuracion/application/content-admin.ts`, `src/admin-routes.ts`
- [x] T516 Base de conocimientos y uso del asistente (RF-10.12, RF-12.10) — `asistente/`

## Fase 3 — Reportes (H2)

- [x] T520 Indicadores filtrables y vista por rol — `reportes/`
- [x] T521 Exportación Excel y PDF — `reportes/infrastructure/`

## Fase 4 — Pruebas e interfaz

- [x] T530 Pruebas de integración del panel — `tests/integration/admin*.test.ts`
- [x] T531 Panel en Angular — `features/admin/`
- [x] T532 E2E del ingreso con TOTP y una edición — `scripts/e2e-panel.mjs`

## Siguientes iteraciones

- [x] T540 Importar vacantes desde Excel: plantilla con el cuadro vigente, vista previa con diferencias y filas que no suman su TOTAL, guardado todo o nada con resolución — `vacancy-import.ts`
- [x] T541 Denuncia reservada desde el portal y envío segmentado de comunicados (M11)
- [x] T542 Evidencia en denuncias: hasta 3 archivos PDF/JPG/PNG (5 MB) verificados por contenido, almacenamiento privado y descarga auditada en «Casos» — `support-cases.ts`

## Tareas agregadas (27 y 28/10/2026)

- [x] T543 Catálogo del concurso editable
- [x] T544 Imágenes de la portada en «Contenido del portal»
- [x] T545 Retención de inscripciones desde «Configuración»
- [x] T546 Exportación de expedientes y asistencia
- [x] T547 Ingreso del personal en pantalla dividida con carátula de la Dirección de Admisión (skill interface-design)
- [x] T548 Ruta de ingresantes `/admin/ingresantes` (antes chocaba con el inicio de sesión) y redirección al panel con sesión abierta
- [x] T549 Menú lateral agrupado por tarea (Postulantes y pagos, Examen y resultados, Atención, Concurso y portal, Sistema), filtrado por permisos
- [x] T550 Inicio del panel con «Pendientes de hoy» enlazados a su sección y menú «Descargar reporte» con los 6 reportes; estados de carga y error con reintento
- [x] T551 Estados de carga, vacío y error comunes a las tablas del panel, y mensajes fijos al desplazar
- [x] T552 Códigos de respaldo del segundo factor: entrega única al activar, ingreso con código, «Mi seguridad» y aviso en el inicio (ADR-022)
- [x] T553 Documentos PDF con membrete común y tipografía Archivo; plantilla de correo con tarjeta de datos y botón de acción
