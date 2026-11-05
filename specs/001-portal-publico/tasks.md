# Tareas: Portal público de admisión

> **SDD (Spec-Driven Development) · artefacto 3 de 3: tareas** (pasos de implementación verificables).
> Anterior: [requirements.md](requirements.md) · [design.md](design.md).

**Entrada:** [design.md](design.md), [requirements.md](requirements.md), [design.md](design.md), [contracts/openapi.yaml](./contracts/openapi.yaml)
**Formato:** `- [ ] T### [P] [H#] Descripción — ruta`
`[P]` = paralelizable · `[H#]` = historia de usuario · ✅ = hecho

## Fase 1 — Preparación del monorepo (bloquea todo)

- [x] T001 Monorepo con npm workspaces, `engines.node >= 22`, `.gitignore`, `.editorconfig`, `.env.example` — `/package.json`
- [x] T002 [P] TypeScript base `strict` compartido — `/tsconfig.base.json`
- [x] T003 [P] Paquete de contratos (tipos y esquemas Zod compartidos) — `packages/contracts/`
- [x] T004 Backend: Express 5, Prisma 7, Zod 4, pino, Vitest; scripts `dev`, `build`, `test` — `apps/backend/package.json`
- [x] T005 PostgreSQL embebido: `db:start`, `db:stop`, `db:setup` (ADR-014) — `apps/backend/scripts/db.ts`
- [x] T006 Frontend Angular 22 (standalone, SCSS, rutas, sin SSR en servidor) — `apps/frontend/`
- [ ] T007 [P] ESLint con fronteras de módulos (ADR-002) y Prettier — `/eslint.config.mjs`

## Fase 2 — Base compartida del backend (bloquea a las historias)

- [x] T010 Configuración validada con Zod; prohíbe `APP_FIXED_NOW` en `demo` — `apps/backend/src/shared/config/`
- [x] T011 [P] Reloj inyectable con zona `America/Lima` — `src/shared/clock/`
- [x] T012 [P] Sobre `{data, meta}` / `{error}`, `requestId`, errores de dominio → HTTP, 404 genérico — `src/shared/http/`
- [x] T013 [P] Logger pino con redacción de datos personales; OpenTelemetry opcional (ADR-013) — `src/shared/telemetry/`
- [x] T014 [P] Límite de uso con contador en PostgreSQL — `src/shared/rate-limit/`
- [x] T015 [P] Outbox + despachador; `EmailSender` (`FileEmailSender` local) — `src/shared/events/`, `src/shared/email/`
- [x] T016 [P] Servicio de auditoría solo-inserción — `src/shared/audit/`
- [x] T017 Composición de la aplicación y puntos de entrada `server.ts`, `lambda-api.ts`, `lambda-worker.ts` — `src/app.ts`
- [x] T018 Esquema Prisma de M01, M14, M13 (casos) y `shared`; primera migración — `prisma/schema.prisma`
- [x] T019 Semilla 2027-I desde `docs/reglas-negocio.md`: convocatoria, 13 etapas, 34 programas / 40 opciones, 16 categorías, 640 vacantes, 24 tasas + reglas, requisitos, temario, contenido — `prisma/seed/2027-I/`

## Fase 3 — Historia 1: convocatoria y cronograma (P1) 🎯

**Prueba independiente:** con `APP_FIXED_NOW`, el inicio muestra la etapa en curso y la cuenta regresiva.

- [x] T020 [P] [H1] Pruebas unitarias: estado de etapa (bordes de medianoche en Lima) y siguiente hito — `tests/unit/convocatorias/stage.test.ts`
- [x] T021 [H1] Dominio `StageWindow`, `NextMilestone` — `modules/convocatorias/domain/`
- [x] T022 [H1] Caso de uso `GetCurrentCall` + repositorio Prisma — `modules/convocatorias/application|infrastructure/`
- [x] T023 [H1] `GET /calls/current` (404 si no hay convocatoria) — `modules/convocatorias/presentation/`
- [x] T024 [H1] Inicio: hero, etapa actual, cuenta regresiva, accesos rápidos — `features/public/home/`
- [x] T025 [H1] Cronograma como línea de tiempo con estados — `features/public/schedule/`

## Fase 4 — Historia 2: programas y vacantes (P1)

- [x] T030 [P] [H2] Prueba de integración: 40 opciones, 18/13/9 por área, Σ ORD 926, Σ 1803 — `tests/integration/seed.test.ts`
- [x] T031 [H2] `SearchOptions` (búsqueda sin tildes, filtros área/categoría) y `GetOptionDetail` — `modules/convocatorias/application/`
- [x] T032 [H2] `GET /calls/{code}/areas`, `/quota-categories`, `/options`, `/options/{internalCode}`
- [x] T033 [H2] Buscador de programas con filtros y estado "Sin vacantes en esta modalidad" — `features/public/programs/`
- [x] T034 [H2] Ficha de la opción — `features/public/program-detail/`

## Fase 5 — Historia 3: simulador de tasa (P1)

- [x] T040 [P] [H3] Pruebas unitarias: tabla de casos de la Tabla 3 (todas las combinaciones + recargos 65/50 + vínculo familiar) — `tests/unit/convocatorias/fee-calculator.test.ts`
- [x] T041 [H3] `Money` y `FeeCalculator` — `modules/convocatorias/domain/`
- [x] T042 [H3] `QuoteFee` + `GET /calls/{code}/fees` y `/fee-quote`
- [x] T043 [H3] Página de tasas con simulador paso a paso — `features/public/fees/`

## Fase 6 — Historia 4: requisitos, temario y reglamento (P2)

- [x] T050 [H4] `GET /requirements`, `/syllabus`, `/documents`
- [x] T051 [P] [H4] Requisitos por submodalidad — `features/public/requirements/`
- [x] T052 [P] [H4] Temario con búsqueda — `features/public/syllabus/`
- [x] T053 [P] [H4] Pasos Ordinario y Exonerado accesibles — `features/public/steps/`

## Fase 7 — Historia 5: comunicados (P2)

- [x] T060 [H5] `GET /announcements` paginado con filtro por sección — `modules/configuracion/`
- [x] T061 [H5] Lista de comunicados y aviso de fe de erratas en la página afectada — `features/public/announcements/`

## Fase 8 — Historia 6: institucional y contacto (P3)

- [x] T070 [H6] `GET /content/home` (carrusel, autoridades, bloques, accesos según etapa) — `modules/configuracion/`
- [x] T071 [H6] `GET /calls/{code}/stats` con `EnrollmentStatsProvider` provisional (R-09)
- [x] T072 [H6] `POST /support/contact`: caso con número, *honeypot*, límite 5/h, correo por outbox — `modules/seguridad/`
- [x] T073 [H6] Secciones institucionales del inicio y página de contacto — `features/public/`

## Fase final — Pulido

- [x] T080 Sistema de diseño UNSCH: tokens, componentes base, pie "proyecto académico" — `shared/ui/`
- [ ] T081 [P] Prueba de contrato: respuestas vs `contracts/openapi.yaml`
- [ ] T082 [P] Verificación en navegador a 360 px y escritorio; revisión de accesibilidad
- [ ] T083 Ejecutar `design.md` completo

## Aclaración 25/10/2026 (FR-014, FR-015)

- [x] T090 Página de documento oficial con PDF incrustado, botón «Ver documento completo» y menú lateral — `features/public/documents/`, `shared/pdf-viewer.ts`
- [x] T091 Encabezado con menús Contenido y Pasos, y botones Inscripción y Reinscripción — `shared/site-header.ts`

## Dependencias

Fase 1 → Fase 2 → Fases 3, 4, 5 (paralelas) → 6, 7, 8 → final. La 002 depende de T010–T017.

## Tareas agregadas (27 y 28/10/2026)

- [x] T092 Cabecera con menú «Contenido» de tres columnas y escudo
- [x] T093 Página «Denuncias» con caso reservado en el panel
- [x] T094 Página «Contactos» con equipo, canales y horario
- [x] T095 Relación de observados y modelo de carta aval
- [x] T096 Imágenes de la portada editables (RF-14.01)
- [x] T097 Reversión del rediseño y foto del ingreso de la Ciudad Universitaria

## Pulido de interfaz (29/10/2026)

- [x] T098 Botones oficiales visibles en celular y portada con «Inscribirme» en la primera pantalla
- [x] T099 Foco visible de dos tonos y errores con ícono en todo el portal
- [x] T100 Denuncias y Contactos: etiquetas visibles, contraste y textos honestos
- [x] T101 «Mis trámites» en Contenido, «Mi inscripción» y portada según la etapa
- [x] T102 Botón principal único (.btn--gold global) y asistente que se aparta al escribir
- [x] T103 Contactos y Denuncias sin desborde, foco visible y obligatorios marcados; portada con estado de carga
- [x] T104 Imágenes WebP con srcset (script optimizar-imagenes) y globo del asistente que se oculta
- [x] T105 34 programas / 40 opciones y fechas de publicación en Buscar aula y Ver puntaje
- [x] T106 Contactos y Denuncias: tuteo, bordes 3:1, obligatorios y reserva ligada; «Ver mi inscripción»
- [x] T107 Foco visible en campos sobre guinda y bordes de campo ≥ 3:1 (token --field-line)
- [x] T108 Sección Misión y principios con galería de la Ciudad Universitaria en la portada
- [x] T109 Infografías de Ordinario y Exonerado completas (1042 × 822) con sus variantes WebP
- [x] T110 Acabado formal: botones, campos y paneles con esquinas suaves; sin flechas, mayúsculas ni entradas animadas
- [x] T111 Línea de tiempo del cronograma con marca «Hoy» y cuenta de días hasta el cierre de cada etapa en curso
