# Graph Report - proyectofinal  (2026-11-20)

## Corpus Check
- 317 files · ~239,933 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .scss 5, (none) 4, .woff 4)

## Summary
- 3300 nodes · 7808 edges · 157 communities (112 shown, 45 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 248 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a877dc1d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- dossiers.ts
- admin-routes.ts
- NotificationService
- ConvocatoriasQueries
- apiErrorMessage
- Cliente API del portal
- backend/package.json
- prisma.ts
- RequestMeta
- Db
- frontend/package.json
- Configuración de Angular
- results-service.ts
- inscription-service.ts
- seguridad/index.ts
- AdminSession
- package.json
- Dependencias de desarrollo backend
- convocatorias/presentation/routes.ts
- inscripciones/index.ts
- openapi.ts
- admin-routes.ts
- PrismaPaymentRepository
- verificar.mjs
- handle
- ref_node_url
- accounts.test.ts
- PaymentGateway
- dependencies
- Exámenes (panel)
- Formulario de inscripción
- ficha.test.ts
- NoticeSources
- rule-based-provider.ts
- ref_node_fs
- admin-login.ts
- ExamService
- Convocatoria (panel)
- env.ts
- @angular/common
- Tx
- session-policy.ts
- InscriptionsAdminPage
- dossier-service.ts
- package.json: scripts
- updates
- ci.yml
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- Argon2Hasher
- usuarios/index.ts
- inscription-service.ts
- businessRule
- portal admin: ResultsAdminPage
- tsconfig.base.json: tsconfig.base.json
- InscriptionReceipt
- portal admin: blankProgram()
- call-2027-I.ts: call-2027-I.ts
- Tx
- portal admin: DossiersAdminPage
- portal admin: NotificationsAdminPage
- db.ts: db.ts
- payment-rules.ts
- OnlinePayment
- PaymentRepository
- convocatorias: PrismaConvocatoriasReposi
- e2e-expediente.mjs
- results.test.ts: results.test.ts
- assistant.ts: Assistant
- package.json: contracts/package.json
- prisma-inscription-repository.ts
- exams.test.ts: exams.test.ts
- portal admin: ContentAdminPage
- portal admin: TreasuryAdminPage
- portal admin: Component
- portal cuenta: MyAccountPage
- @angular/core
- inscription.ts
- seguridad: totp.ts
- dossier.test.ts: dossier.test.ts
- pending-features.test.ts: pending-featur
- culqi-gateway.ts
- fee-calculator.ts
- pago-culqi.test.ts
- AdminShell
- audit/audit.ts
- portal admin: AdminLoginPage
- tsconfig.json: contracts/tsconfig.json
- notifications.test.ts
- trazabilidad.mjs: trazabilidad.mjs
- catalog.ts: seed/catalog.ts
- InscriptionRepository
- generar-coleccion.py
- portal admin: DashboardPage
- KnowledgeAdminPage
- ubigeo.ts
- limites-modulos.test.ts
- StaffAdmin
- payments.test.ts: payments.test.ts
- tsconfig.json: backend/tsconfig.json
- helpers.ts
- InscriptionUnitOfWork
- portal cuenta: CreateAccountPage
- portal public: ComplaintsPage
- CasesAdminPage
- usuariosRoutes
- portal admin: AdmissionsAdminPage
- portal cuenta: AccountLoginPage
- site-header.ts: SiteHeader
- src/app.ts
- e2e-examen.mjs
- rds.ts
- ref_vitest
- content.ts: seed/content.ts
- DisqualifiedAdminPage
- tools.ts
- ref_vitest
- screenshots-panel.mjs
- DailyChart
- PrismaInscriptionRepository
- rendimiento.js
- exams.ts: seed/exams.ts
- identity.ts: identity.ts
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- @angular/core
- AssistantService
- ConvocatoriasRepository
- assistant.test.ts
- ngsw-config.json
- Tx
- SystemAdminPage
- InboxPanel
- LocalFileStorage
- assistant-rules.ts
- middleware.ts
- VenuesAdminPage
- swagger-ui-express
- e2e-resultados.mjs
- application/usability-survey.ts
- Stage
- e2e-inscripcion.mjs
- convocatorias/domain/ports.ts
- optimizar-imagenes.mjs
- pino-pretty@13.2.0
- @types/supertest@7.2.1
- @vitest/coverage-v8@5.0.5
- SecurityPage
- treasury.test.ts
- inscription-service.ts
- ApplicationDocuments
- SyllabusPage
- s3.test.ts

## God Nodes (most connected - your core abstractions)
1. `RequestMeta` - 155 edges
2. `apiErrorMessage()` - 111 edges
3. `notFound()` - 101 edges
4. `Db` - 87 edges
5. `@angular/core` - 86 edges
6. `ApiService` - 84 edges
7. `validationError()` - 69 edges
8. `businessRule()` - 63 edges
9. `Clock` - 62 edges
10. `AuditLog` - 60 edges

## Surprising Connections (you probably didn't know these)
- `StaffSession` --references--> `TokenDto`  [EXTRACTED]
  apps/backend/src/modules/usuarios/application/staff-auth-service.ts → packages/contracts/src/index.ts
- `Row` --references--> `DossierDto`  [EXTRACTED]
  apps/frontend/src/app/features/admin/pages/dossiers.ts → packages/contracts/src/index.ts
- `createApplication()` --indirect_call--> `errorHandler()`  [INFERRED]
  apps/backend/src/app.ts → apps/backend/src/shared/http/middleware.ts
- `createReportesModule()` --indirect_call--> `toPdf()`  [INFERRED]
  apps/backend/src/modules/reportes/index.ts → apps/backend/src/modules/reportes/infrastructure/exporters.ts
- `createSeguridadModule()` --indirect_call--> `authorize()`  [INFERRED]
  apps/backend/src/modules/seguridad/index.ts → apps/backend/src/modules/seguridad/presentation/auth-middleware.ts

## Import Cycles
- None detected.

## Communities (157 total, 45 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.04
Nodes (81): CLIENT, ADR-0015, ApiHttpError, FichaVerification, InboxDto, ReinscriptionCheck, SubmodalityDto, ADR-0010 (+73 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.03
Nodes (92): CLIENT, Query, StaffMe, ADR-0018, ADR-0022, shortDateTime(), adminRoutes, ADR-0018 (+84 more)

### Community 2 - "dossiers.ts"
Cohesion: 0.13
Nodes (16): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, Row (+8 more)

### Community 3 - "admin-routes.ts"
Cohesion: 0.09
Nodes (19): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+11 more)

### Community 4 - "NotificationService"
Cohesion: 0.17
Nodes (7): day(), hour(), NotificationService, applicant, meta(), notificacionesRoutes(), segment

### Community 5 - "ConvocatoriasQueries"
Cohesion: 0.26
Nodes (5): ConvocatoriasQueries, createConvocatoriasModule(), invalidatesOnUse(), convocatoriasRoutes(), toLimaIso()

### Community 6 - "apiErrorMessage"
Cohesion: 0.04
Nodes (18): AdmittedListDto, apiErrorMessage(), ExamRoomDto, MyResultDto, AuditAdminPage, PaymentsAdminPage, FindRoomPage, DossierPanel (+10 more)

### Community 8 - "backend/package.json"
Cohesion: 0.11
Nodes (18): helmet@8.3.0, jose@6.2.13, pg@8.23.1, @sia/contracts@0.1.0, effect@3.22.5, embedded-postgres@16.14.0-beta.17, @types/pdfkit@^0.17.7, @sia/contracts (+10 more)

### Community 9 - "prisma.ts"
Cohesion: 0.13
Nodes (11): db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], db, [email, file = '.admin-inicial.txt'], db, KnowledgeAdmin, ToolDeps, createAsistenteModule() (+3 more)

### Community 10 - "RequestMeta"
Cohesion: 0.08
Nodes (12): ContentAdmin, sniff(), CallAdmin, iso(), CatalogAdmin, FORMATS, SecurityAdmin, RequestMeta (+4 more)

### Community 11 - "Db"
Cohesion: 0.09
Nodes (15): Application, AppOverrides, DEFAULT_PARAMETERS, CASE_STATUS_LABEL, CASE_TYPE_LABEL, AuthDeps, ACTIONS, ProfileService (+7 more)

### Community 12 - "frontend/package.json"
Cohesion: 0.06
Nodes (39): dependencies, @angular/common@22.2.3, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, @angular/service-worker@22.2.3 (+31 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (43): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+35 more)

### Community 14 - "results-service.ts"
Cohesion: 0.09
Nodes (21): MODALITY_LABEL, ResultPerson, ResultsPorts, Answers, computeScore(), Condition, CONDITION_LABEL, Contender (+13 more)

### Community 15 - "inscription-service.ts"
Cohesion: 0.11
Nodes (5): InscriptionService, longDate(), shortDate(), inscripcionesRoutes(), meta()

### Community 16 - "seguridad/index.ts"
Cohesion: 0.06
Nodes (47): ALL, byRole, hasPermission(), Permission, PERMISSIONS, permissionsOf(), STAFF_ROLES, ADR-0018 (+39 more)

### Community 17 - "AdminSession"
Cohesion: 0.11
Nodes (6): AdminSession, Count, Dashboard, ReportKind, REPORTS, Usability

### Community 18 - "package.json"
Cohesion: 0.05
Nodes (41): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+33 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.07
Nodes (27): devDependencies, concurrently@10.0.6, esbuild@0.28.2, prisma@7.10.1, supertest@7.3.1, tsx@4.23.15, @types/cookie-parser@1.4.10, @types/express@5.0.6 (+19 more)

### Community 20 - "convocatorias/presentation/routes.ts"
Cohesion: 0.33
Nodes (5): booleanish, callCode, callParams, feeQuoteQuery, optionsQuery

### Community 21 - "inscripciones/index.ts"
Cohesion: 0.15
Nodes (12): AwardeeRowError, CepreAwardees, CYCLES, PaymentContext, UsabilitySurveyService, createInscripcionesModule(), ADR-0008, ADR-0015 (+4 more)

### Community 22 - "openapi.ts"
Cohesion: 0.10
Nodes (19): backend, components, DESCRIPCION_MODULO, doc, files, fromSpec, Json, MODULOS (+11 more)

### Community 23 - "admin-routes.ts"
Cohesion: 0.06
Nodes (61): attendancePdf(), eligibleListPdf(), ExamInfo, examSlipPdf(), footer(), hour(), longDate(), render() (+53 more)

### Community 24 - "PrismaPaymentRepository"
Cohesion: 0.18
Nodes (4): PrismaPaymentRepository, toAttempt(), toOrder(), withOrder()

### Community 25 - "verificar.mjs"
Cohesion: 0.11
Nodes (15): ATRIBUTOS, audit, backend, destino, hora, hoy, porAtributo, resultados (+7 more)

### Community 26 - "handle"
Cohesion: 0.07
Nodes (34): applicant, meta(), sendFile(), ADR-0010, ADR-0018, inscriptionSchema, name, ubigeo (+26 more)

### Community 27 - "ref_node_url"
Cohesion: 0.08
Nodes (19): dotenv@18.0.9, api, backendDir, envFile, ADR-0019, files, root, s3 (+11 more)

### Community 28 - "accounts.test.ts"
Cohesion: 0.21
Nodes (7): REDACTED_PATHS, activeAccount(), clock, lastCode(), lookup(), register(), t

### Community 29 - "PaymentGateway"
Cohesion: 0.16
Nodes (9): PaymentSessionDto, ChargeRequest, PaymentGateway, ADR-0007, ADR-0024, MOCK_TOKENS, MockPaymentGateway, ADR-0007 (+1 more)

### Community 30 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, argon2@0.45.1, @aws-sdk/client-sesv2@^3.1158.0, @aws-sdk/client-sqs@^3.1161.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, cookie-parser@1.4.7 (+20 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "ficha.test.ts"
Cohesion: 0.17
Nodes (4): backendDir, dataDir, TEST_DATABASE_URL, t

### Community 35 - "rule-based-provider.ts"
Cohesion: 0.19
Nodes (14): LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017, OpenRouterProvider (+6 more)

### Community 36 - "ref_node_fs"
Cohesion: 0.11
Nodes (8): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900028', out = '.screens/cuenta'], ADR-0015, jobs, [out = '.screens', ...routes], report, widths

### Community 37 - "admin-login.ts"
Cohesion: 0.21
Nodes (6): StaffStep, STEP_LABEL, ADR-0018, ADR-0022, RecoveryCodes, ADR-0022

### Community 38 - "ExamService"
Cohesion: 0.09
Nodes (17): AttendanceService, iso(), ExamService, iso(), roomInfo(), roomOrder(), codeFromScan(), INCIDENT_TYPES (+9 more)

### Community 40 - "env.ts"
Cohesion: 0.12
Nodes (15): application, handler, ADR-0009, Env, loadEnv(), schema, ADR-0010, ADR-0017 (+7 more)

### Community 41 - "@angular/common"
Cohesion: 0.22
Nodes (3): AssetMap, SiteImages, @angular/common

### Community 42 - "Tx"
Cohesion: 0.20
Nodes (6): SessionMeta, SessionService, sha256(), ADR-0006, deviceLabel(), SESSION_TTL

### Community 43 - "session-policy.ts"
Cohesion: 0.24
Nodes (8): evaluateRefresh(), IDLE_LIMIT_SECONDS, RefreshDecision, SessionState, ADR-0006, minutesAgo(), now, session()

### Community 45 - "dossier-service.ts"
Cohesion: 0.21
Nodes (4): DossierService, iso(), latest(), expedientesRoutes()

### Community 46 - "package.json: scripts"
Cohesion: 0.10
Nodes (21): scripts, apiperu:check, build, culqi:check, db:reset, db:setup, db:start, db:stop (+13 more)

### Community 47 - "updates"
Cohesion: 0.12
Nodes (16): patterns, patterns, angular, aws-sdk, prisma, patterns, day, interval (+8 more)

### Community 48 - "ci.yml"
Cohesion: 0.07
Nodes (32): name, runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, name (+24 more)

### Community 50 - "portal admin: AttendanceAdminPage"
Cohesion: 0.20
Nodes (3): AttendanceAdminPage, isOffline(), writeQueue()

### Community 51 - "index.ts: seed/index.ts"
Cohesion: 0.17
Nodes (17): main(), prisma, publicDocsDir, seedCall(), seedCatalog(), seedContent(), seedExams(), seedIdentity() (+9 more)

### Community 52 - "Argon2Hasher"
Cohesion: 0.14
Nodes (12): Argon2Hasher, staff(), staff(), staff(), staff(), box, CHROME_WIN_NUEVO, clock (+4 more)

### Community 53 - "usuarios/index.ts"
Cohesion: 0.11
Nodes (13): token, SecretBox, IdentityLookupResult, createIdentityProvider(), createUsuariosModule(), ADR-0007, ADR-0015, ADR-0018 (+5 more)

### Community 54 - "inscription-service.ts"
Cohesion: 0.19
Nodes (17): InscriptionInput, NO_REINSCRIPTION, ADR-0015, ADR-0017, CAMPUSES, ECONOMIC_DEPENDENCY, initialStatus(), isPlausibleGraduationYear() (+9 more)

### Community 55 - "businessRule"
Cohesion: 0.19
Nodes (4): iso(), ResultsService, resultadosRoutes(), businessRule()

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.16
Nodes (3): blankProgram(), blankReq(), CatalogAdminPage

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.09
Nodes (18): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+10 more)

### Community 61 - "Tx"
Cohesion: 0.26
Nodes (12): AttemptRecord, AttemptWithOrder, OrderRecord, SettleData, SettleOutcome, AttemptResultDto, PaymentStatusDto, AttemptStatus (+4 more)

### Community 64 - "db.ts: db.ts"
Cohesion: 0.19
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "payment-rules.ts"
Cohesion: 0.18
Nodes (10): PaymentService, ATTEMPT_LABEL, ATTEMPT_TTL_SECONDS, formatAmount(), newTransactionId(), orderNumberFor(), ProviderResult, ADR-0019 (+2 more)

### Community 68 - "convocatorias: PrismaConvocatoriasReposi"
Cohesion: 0.13
Nodes (3): OptionRecord, PrismaConvocatoriasRepository, toFee()

### Community 69 - "e2e-expediente.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 70 - "results.test.ts: results.test.ts"
Cohesion: 0.14
Nodes (11): box, clock, codes, DNIS, fakeJpeg(), jump(), registerExo(), secrets (+3 more)

### Community 72 - "package.json: contracts/package.json"
Cohesion: 0.14
Nodes (14): description, devDependencies, typescript@6.0.3, exports, typescript, main, name, private (+6 more)

### Community 73 - "prisma-inscription-repository.ts"
Cohesion: 0.20
Nodes (4): ApplicationRecord, DuplicateApplicationError, NewApplication, isUniqueViolation()

### Community 74 - "exams.test.ts: exams.test.ts"
Cohesion: 0.16
Nodes (10): box, clock, codes, DNIS, fakeJpeg(), jump(), registerOrd(), secrets (+2 more)

### Community 78 - "portal cuenta: MyAccountPage"
Cohesion: 0.14
Nodes (4): MyAccountPage, base32Decode(), text, totp()

### Community 79 - "@angular/core"
Cohesion: 0.04
Nodes (39): App, appConfig, ADR-0023, routes, ADR-0015, ADR-0018, CallStore, KEY_STAGES (+31 more)

### Community 80 - "inscription.ts"
Cohesion: 0.06
Nodes (21): apiErrorCode(), apiErrorDetails(), Department, District, Province, UbigeoService, Draft, FIELD_TARGET (+13 more)

### Community 81 - "seguridad: totp.ts"
Cohesion: 0.23
Nodes (12): base32Decode(), base32Encode(), hotp(), newTotpSecret(), otpauthUri(), stepAt(), totp(), TOTP_STEP_SECONDS (+4 more)

### Community 82 - "dossier.test.ts: dossier.test.ts"
Cohesion: 0.20
Nodes (8): box, clock, fakeJpeg(), registerExo(), secrets, t, upload(), who()

### Community 83 - "pending-features.test.ts: pending-featur"
Cohesion: 0.18
Nodes (11): pdf(), as(), binary(), box, clock, exo, fakeJpeg(), inscription() (+3 more)

### Community 84 - "culqi-gateway.ts"
Cohesion: 0.19
Nodes (7): CulqiCharge, CulqiConfig, CulqiGateway, parseCulqiCharge(), ADR-0024, gw, req

### Community 85 - "fee-calculator.ts"
Cohesion: 0.08
Nodes (27): byPriority(), FeeCriteria, FeeInfo, FeeQuote, FeeRule, matches(), MilitaryCondition, Modality (+19 more)

### Community 86 - "pago-culqi.test.ts"
Cohesion: 0.22
Nodes (6): culqi, fakeJpeg(), register(), t, ADR-0024, Who

### Community 88 - "audit/audit.ts"
Cohesion: 0.10
Nodes (22): ConfiguracionQueries, shortDate(), SITE_SLOTS, SiteAssets, SiteSlot, TYPES, createConfiguracionModule(), announcementsQuery (+14 more)

### Community 90 - "tsconfig.json: contracts/tsconfig.json"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, outDir, rootDir, sourceMap, types, extends, include (+1 more)

### Community 91 - "notifications.test.ts"
Cohesion: 0.09
Nodes (14): totpService, movableClock(), clock, secrets, t, box, clock, t (+6 more)

### Community 92 - "trazabilidad.mjs: trazabilidad.mjs"
Cohesion: 0.20
Nodes (9): cover, ESTADO, guide, missing, modules, n, out, sections (+1 more)

### Community 93 - "catalog.ts: seed/catalog.ts"
Cohesion: 0.22
Nodes (8): areas, faculties, FacultyKey, modalities, options, programs, quotaCategories, submodalities

### Community 98 - "ubigeo.ts"
Cohesion: 0.25
Nodes (7): Department, departments, District, districtIndex, districtLabel(), isValidDistrict(), Province

### Community 99 - "limites-modulos.test.ts"
Cohesion: 0.38
Nodes (5): files, filesIn(), MODULES, posix(), SRC

### Community 101 - "payments.test.ts: payments.test.ts"
Cohesion: 0.25
Nodes (5): fakeJpeg(), register(), t, ADR-0024, Who

### Community 102 - "tsconfig.json: backend/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, ../../tsconfig.base.json

### Community 103 - "helpers.ts"
Cohesion: 0.10
Nodes (16): FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, fixedClock(), MemoryEmailSender (+8 more)

### Community 104 - "InscriptionUnitOfWork"
Cohesion: 0.14
Nodes (4): InscriptionUnitOfWork, InscriptionSummary, InscriptionStatus, PrismaInscriptionUnitOfWork

### Community 108 - "usuariosRoutes"
Cohesion: 0.07
Nodes (26): AuthService, sha256(), describeDevice(), StaffAuthService, StaffSession, applicantCodeFromSequence(), COMMON, EDITABLE_FIELDS (+18 more)

### Community 112 - "src/app.ts"
Cohesion: 0.05
Nodes (49): backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012, ADR-0021, createExamenesModule() (+41 more)

### Community 113 - "e2e-examen.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 114 - "rds.ts"
Cohesion: 0.29
Nodes (9): backendDir, caFile, check(), client(), envFile, migrate(), setup(), ADR-0009 (+1 more)

### Community 115 - "ref_vitest"
Cohesion: 0.20
Nodes (7): clock, failFor, FakeQueue, handled, queue, t, ADR-0021

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 118 - "tools.ts"
Cohesion: 0.13
Nodes (7): AssistantTools, ESTADO_ETAPA, fecha(), STOP, terms(), ToolResult, ADR-0017

### Community 119 - "ref_vitest"
Cohesion: 0.29
Nodes (4): fakeJpeg(), register(), t, ADR-0014

### Community 120 - "screenshots-panel.mjs"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

### Community 122 - "PrismaInscriptionRepository"
Cohesion: 0.16
Nodes (3): ApplicationFilter, PrismaInscriptionRepository, where()

### Community 123 - "rendimiento.js"
Cohesion: 0.13
Nodes (6): ETAPAS, MAXIMO, options, options, options, USUARIOS

### Community 124 - "exams.ts: seed/exams.ts"
Cohesion: 0.40
Nodes (4): BUILDINGS, exams, rooms, venue

### Community 125 - "identity.ts: identity.ts"
Cohesion: 0.40
Nodes (4): consentDocument, disqualifiedPersons, permissions, roles

### Community 128 - "@angular/core"
Cohesion: 0.05
Nodes (26): AREA_NAMES, closesIn(), dateRange(), daysUntil(), limaDay(), longDate(), shortDate(), STAGE_STATUS_LABEL (+18 more)

### Community 129 - "AssistantService"
Cohesion: 0.21
Nodes (4): AssistantService, asistenteRoutes(), meta(), ADR-0017

### Community 131 - "assistant.test.ts"
Cohesion: 0.29
Nodes (5): ai, basic, scripted, toolCall(), usage

### Community 132 - "ngsw-config.json"
Cohesion: 0.40
Nodes (4): assetGroups, index, navigationUrls, $schema

### Community 133 - "Tx"
Cohesion: 0.14
Nodes (7): AccessService, SupportCases, createSeguridadModule(), seguridadRoutes(), sanitize(), nextCounterValue(), Tx

### Community 137 - "assistant-rules.ts"
Cohesion: 0.29
Nodes (9): AssistantReply, ADR-0017, asksForHuman(), LIMITS, maskPersonal(), NO_INFO_REPLY, SUGGESTIONS, SYSTEM_PROMPT (+1 more)

### Community 138 - "middleware.ts"
Cohesion: 0.08
Nodes (29): application, handler(), processQueue(), SqsEvent, ADR-0012, ADR-0021, application, background() (+21 more)

### Community 142 - "e2e-resultados.mjs"
Cohesion: 0.24
Nodes (7): admin, base32Decode(), comision, errors, health, login(), totp()

### Community 143 - "application/usability-survey.ts"
Cohesion: 0.18
Nodes (9): SurveyAlreadyAnsweredError, SurveyRecord, SurveyRepository, isValidSusAnswers(), SUS_STATEMENTS, SUS_TARGET, susGrade(), susScore() (+1 more)

### Community 145 - "e2e-inscripcion.mjs"
Cohesion: 0.29
Nodes (4): errors, ADR-0015, photo, width

### Community 146 - "convocatorias/domain/ports.ts"
Cohesion: 0.18
Nodes (8): CallSummary, DocumentRecord, EnrollmentStatsProvider, QuotaCategoryRecord, RequirementRecord, SubmodalityRecord, SyllabusRecord, ADR-0002

### Community 147 - "optimizar-imagenes.mjs"
Cohesion: 0.13
Nodes (11): left, out, require, root, sharp, top, base, dir (+3 more)

### Community 153 - "treasury.test.ts"
Cohesion: 0.20
Nodes (7): box, clock, duplicate, paid, secrets, t, today

### Community 155 - "inscription-service.ts"
Cohesion: 0.06
Nodes (28): s3, Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus (+20 more)

### Community 156 - "ApplicationDocuments"
Cohesion: 0.25
Nodes (3): AdminDeps, VacancyImport, ApplicationDocuments

### Community 164 - "s3.test.ts"
Cohesion: 0.40
Nodes (4): @aws-sdk/client-s3@^3.1158.0, client, storage, @aws-sdk/client-s3

## Knowledge Gaps
- **129 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+124 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1345 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `apiErrorMessage` to `api.service.ts`, `Sesión del panel (frontend)`, `dossiers.ts`, `@angular/core`, `SystemAdminPage`, `InboxPanel`, `VenuesAdminPage`, `AdminSession`, `SecurityPage`, `Exámenes (panel)`, `Formulario de inscripción`, `admin-login.ts`, `Convocatoria (panel)`, `InscriptionsAdminPage`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `OnlinePayment`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `@angular/core`, `inscription.ts`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `KnowledgeAdminPage`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `CasesAdminPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `DisqualifiedAdminPage`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _129 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03838383838383838 - nodes in this community are weakly interconnected._
- **Why does `@angular/core` connect `@angular/core` to `api.service.ts`, `Sesión del panel (frontend)`, `dossiers.ts`, `@angular/core`, `admin-login.ts`, `apiErrorMessage`, `@angular/common`, `frontend/package.json`, `inscription.ts`, `AdminSession`, `DailyChart`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.025792273883876938 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `RequestMeta` to `AssistantService`, `admin-routes.ts`, `NotificationService`, `assistant-rules.ts`, `prisma.ts`, `Db`, `results-service.ts`, `inscription-service.ts`, `application/usability-survey.ts`, `seguridad/index.ts`, `inscripciones/index.ts`, `admin-routes.ts`, `handle`, `inscription-service.ts`, `ApplicationDocuments`, `ExamService`, `dossier-service.ts`, `inscription-service.ts`, `businessRule`, `payment-rules.ts`, `audit/audit.ts`, `StaffAdmin`, `usuariosRoutes`, `src/app.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `dossiers.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13230769230769232 - nodes in this community are weakly interconnected._