# Tareas: Inscripción pública (iteración 1)

> **SDD (Spec-Driven Development) · artefacto 3 de 3: tareas** (pasos de implementación verificables).
> Anterior: [requirements.md](requirements.md) · [design.md](design.md).

**Entrada:** [design.md](design.md), [requirements.md](requirements.md) (Aclaraciones), [contracts/openapi.yaml](./contracts/openapi.yaml), ADR-015
**Formato:** `- [ ] T### [P] [H#] Descripción — ruta`

## Fase 1 — Base

- [x] T201 Ubigeos INEI (1874 distritos) validados y copiados a backend y frontend — `shared/data/ubigeo.json`
- [x] T202 Esquema `inscripciones.applications` y migración — `prisma/schema.prisma`
- [x] T203 [P] `FileStorage` (local / memoria) y lectura de dimensiones JPEG — `shared/storage/`
- [x] T204 [P] Puerto de identidad sin dígito obligatorio + `HttpIdentityProvider` configurable — `modules/usuarios/infrastructure/`

## Fase 2 — Historias 1–3: formulario, foto y orden de pago (P1)

- [x] T210 [P] [H1] Pruebas de integración: registro feliz, duplicado, inhabilitado, etapa cerrada, sin vacantes, foto, ubigeo, CE — `tests/integration/inscriptions.test.ts`
- [x] T211 [H1] `InscriptionService.register` con reglas del plan (etapa, padrón, vacantes, tasa en servidor, 4.º grado) — `modules/inscripciones/application/`
- [x] T212 [H1] `POST /identity/lookup`, `GET /inscriptions/options`, `POST /inscriptions` — `modules/inscripciones/presentation/`
- [x] T213 [H1] Formulario por secciones como el oficial, autocompletado por DNI y resumen en vivo — `features/inscripcion/inscription.*`
- [x] T214 [H2] Foto con cámara o archivo, recorte a 240 × 320 en el navegador — `features/inscripcion/photo-capture.ts`
- [x] T215 [H3] Constancia y orden de pago imprimible; correo con el código por la outbox — `inscription-receipt.ts`, `inscripciones/index.ts`

## Fase 3 — Historia 4: seguimiento sin cuenta (P1)

- [x] T220 [H4] `GET /inscriptions/status` con DNI + código, límite de uso y datos enmascarados
- [x] T221 [H4] Página «Imprimir documentos» (`/mi-inscripcion`)

## Fase final

- [x] T230 E2E por la interfaz — `scripts/e2e-inscripcion.mjs`
- [x] T231 Ficha de inscripción PDF con QR firmado y página pública de verificación (Historia 5) — `inscripciones/application/ficha-service.ts`, `features/inscripcion/verify-ficha.ts`, `tests/integration/ficha.test.ts`
- [x] T234 Borrador automático en el dispositivo (RF-03.06) — `features/inscripcion/inscription.ts`
- [x] T235 Cuenta opcional: crear, ingresar, recuperar, «Mi cuenta» con las inscripciones del mismo DNI (enmienda de ADR-015) — `features/cuenta/`, `GET /me/inscriptions`
- [ ] T232 Reinscripción (Historia 6) — página informativa lista; flujo pendiente
- [x] T233 Pago en línea (spec 005)

## Tareas agregadas (27 y 28/10/2026)

- [x] T236 Consentimiento versionado en la inscripción (RF-13.09)
- [x] T237 Documentos adicionales con subida directa a S3 (RF-03.05)
- [x] T238 Anonimización por retención (RF-13.10)

## Pulido de interfaz (29/10/2026)

- [x] T239 Inscripción por pasos con revisión antes de guardar (crítica de Impeccable)
- [x] T240 Constancia ordenada y aviso «Confirmando tu pago…»
- [x] T241 Resumen de errores con enlaces a cada campo pendiente
- [x] T242 Paso 1 en subgrupos (Identidad, Dónde vives, Contacto) y resumen corto por subgrupo
- [x] T243 Errores ligados a su campo con aria-describedby
- [x] T244 Nombres de los pasos accesibles en el celular
- [x] T245 Inscripción sin desborde a 375 px, mensajes de error específicos y resumen arriba, «Ayuda» en la barra fija
- [x] T246 Modalidad al inicio del paso 1 con su plazo
- [x] T247 «¿No encuentras tu código?» (ruta code-reminder, correo, límites, pruebas), borrador de 7 días con «Borrar mis datos» y paso «Domicilio y contacto»
- [x] T248 Línea del trámite en «Mi inscripción» con fechas del cronograma (skill interface-design)
- [x] T249 Buscador de programa en el paso «Postulación»
