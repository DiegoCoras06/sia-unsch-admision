# Graph Report - proyectofinal  (2026-11-03)

## Corpus Check
- 289 files · ~192,970 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .scss 5, (none) 4, .example 2)

## Summary
- 3018 nodes · 7294 edges · 139 communities (104 shown, 35 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 224 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `690e0cab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- @angular/core
- Db
- NotificationService
- usuariosRoutes
- Páginas del panel y errores
- Cliente API del portal
- Asistencia y PDF de examen
- seguridad/index.ts
- Contenido del portal (admin)
- Servicio de asistencia
- frontend/package.json
- Configuración de Angular
- InscriptionService
- inscription-service.ts
- Carga directa a S3
- lambda-worker.ts
- scripts
- Dependencias de desarrollo backend
- Servicio de expedientes
- middleware.ts
- validationError
- Revisión de resultados
- inscription.ts
- Rutas del panel (backend)
- micuentaweb.ts
- rds.ts
- Personal y scripts de acceso
- pagos/index.ts
- format.ts
- Exámenes (panel)
- Formulario de inscripción
- usuarios/index.ts
- src/app.ts
- Proveedor de IA (asistente)
- Pruebas E2E con Playwright
- .register
- payments-server-check.test.ts
- Convocatoria (panel)
- prisma.ts
- admin.test.ts: movableClock()
- seguridad: .getStats()
- ref_node_path
- asistente: AssistantService
- asistente: tools.ts
- package.json: scripts
- updates
- ci.yml
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- SiteAssets
- ConvocatoriasQueries
- convocatorias: .listFees()
- scripts
- portal admin: ResultsAdminPage
- tsconfig.base.json: tsconfig.base.json
- accounts.test.ts: synthetic-identities.t
- portal admin: blankProgram()
- call-2027-I.ts: call-2027-I.ts
- admin-login.ts
- portal admin: DossiersAdminPage
- portal admin: NotificationsAdminPage
- db.ts: db.ts
- pagos: PaymentService
- portal pago: loadScript()
- s3-file-storage.ts: s3-check.ts
- convocatorias: PrismaConvocatoriasReposi
- optimizar-imagenes.mjs
- results.test.ts: results.test.ts
- assistant.ts: Assistant
- package.json: contracts/package.json
- businessRule
- exams.test.ts: exams.test.ts
- portal admin: ContentAdminPage
- portal admin: TreasuryAdminPage
- portal admin: Component
- portal cuenta: MyAccountPage
- payment-rules.ts
- FichaService
- seguridad: totp.ts
- dossier.test.ts: dossier.test.ts
- pending-features.test.ts: pending-featur
- pagos: money()
- inscripciones/presentation/routes.ts
- convocatorias: .quoteFee()
- usuarios/presentation/routes.ts
- env.ts
- portal admin: AdminLoginPage
- tsconfig.json: contracts/tsconfig.json
- e2e-resultados.mjs: e2e-resultados.mjs
- trazabilidad.mjs: trazabilidad.mjs
- catalog.ts: seed/catalog.ts
- ReportQueries
- ubigeo.ts: .paymentContext()
- portal admin: DashboardPage
- portal admin: KnowledgeAdminPage
- portal admin: results.ts
- portal admin: SystemAdminPage
- StaffAdmin
- payments.test.ts: payments.test.ts
- tsconfig.json: backend/tsconfig.json
- session-policy.ts
- portal admin: Component
- portal cuenta: CreateAccountPage
- portal public: ComplaintsPage
- event-queue.test.ts
- AdminSession
- portal admin: AdmissionsAdminPage
- portal cuenta: AccountLoginPage
- site-header.ts: SiteHeader
- NoticeSources
- e2e-expediente.mjs: e2e-expediente.mjs
- assistant.test.ts
- CasesAdminPage
- content.ts: seed/content.ts
- resultados/presentation/routes.ts
- assistant-rules.ts
- staff-recovery.test.ts
- portal admin: DisqualifiedAdminPage
- scripts
- attendance.ts
- izipay-gateway.ts
- exams.ts: seed/exams.ts
- identity.ts: identity.ts
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- portal public: HomePage
- portal public: SyllabusPage
- ApplicationDocuments
- rxjs
- IzipayPaymentGateway
- screenshots-panel.mjs
- AdminDeps
- synthetic-identities.ts
- KrClient
- fee-calculator.test.ts
- AdminShell

## God Nodes (most connected - your core abstractions)
1. `RequestMeta` - 155 edges
2. `apiErrorMessage()` - 106 edges
3. `notFound()` - 101 edges
4. `Db` - 85 edges
5. `ApiService` - 85 edges
6. `@angular/core` - 78 edges
7. `validationError()` - 65 edges
8. `businessRule()` - 64 edges
9. `Clock` - 62 edges
10. `AuditLog` - 60 edges

## Surprising Connections (you probably didn't know these)
- `StaffSession` --references--> `TokenDto`  [EXTRACTED]
  apps/backend/src/modules/usuarios/application/staff-auth-service.ts → packages/contracts/src/index.ts
- `Row` --references--> `DossierDto`  [EXTRACTED]
  apps/frontend/src/app/features/admin/pages/dossiers.ts → packages/contracts/src/index.ts
- `createApplication()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  apps/backend/src/app.ts → apps/backend/src/shared/http/middleware.ts
- `createSeguridadModule()` --indirect_call--> `authorize()`  [INFERRED]
  apps/backend/src/modules/seguridad/index.ts → apps/backend/src/modules/seguridad/presentation/auth-middleware.ts
- `seedStaff()` --calls--> `Argon2Hasher`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/infrastructure/argon2-hasher.ts

## Import Cycles
- None detected.

## Communities (139 total, 35 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.04
Nodes (81): CLIENT, ADR-0015, ApiHttpError, ExamRoomDto, FichaVerification, ReinscriptionCheck, SubmodalityDto, ADR-0010 (+73 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.03
Nodes (64): CLIENT, Query, StaffMe, ADR-0018, ADR-0022, shortDateTime(), adminRoutes, ADR-0018 (+56 more)

### Community 2 - "@angular/core"
Cohesion: 0.05
Nodes (31): App, appConfig, routes, ADR-0015, ADR-0018, CallStore, AREA_NAMES, dateTime() (+23 more)

### Community 3 - "Db"
Cohesion: 0.11
Nodes (15): Application, AppOverrides, DEFAULT_PARAMETERS, AccessService, CASE_STATUS_LABEL, CASE_TYPE_LABEL, AuthDeps, ACTIONS (+7 more)

### Community 4 - "NotificationService"
Cohesion: 0.20
Nodes (5): day(), hour(), NotificationService, meta(), notificacionesRoutes()

### Community 5 - "usuariosRoutes"
Cohesion: 0.07
Nodes (26): AuthService, sha256(), describeDevice(), StaffAuthService, StaffSession, applicantCodeFromSequence(), COMMON, EDITABLE_FIELDS (+18 more)

### Community 6 - "Páginas del panel y errores"
Cohesion: 0.04
Nodes (18): AdmittedListDto, apiErrorMessage(), MyResultDto, AuditAdminPage, InscriptionsAdminPage, PaymentsAdminPage, SecurityPage, FindRoomPage (+10 more)

### Community 8 - "Asistencia y PDF de examen"
Cohesion: 0.07
Nodes (44): attendancePdf(), eligibleListPdf(), ESCUDO, ExamInfo, examSlipPdf(), footer(), header(), hour() (+36 more)

### Community 9 - "seguridad/index.ts"
Cohesion: 0.07
Nodes (39): FORMATS, ALL, byRole, hasPermission(), PERMISSIONS, permissionsOf(), STAFF_ROLES, ADR-0018 (+31 more)

### Community 10 - "Contenido del portal (admin)"
Cohesion: 0.08
Nodes (9): ContentAdmin, sniff(), CallAdmin, iso(), CatalogAdmin, SecurityAdmin, RequestMeta, conflict() (+1 more)

### Community 11 - "Servicio de asistencia"
Cohesion: 0.13
Nodes (7): AttendanceService, iso(), ExamService, iso(), roomInfo(), createExamenesModule(), examenesRoutes()

### Community 12 - "frontend/package.json"
Cohesion: 0.06
Nodes (34): dependencies, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, rxjs@7.8.2, @sia/contracts@0.1.0 (+26 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (42): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+34 more)

### Community 14 - "InscriptionService"
Cohesion: 0.16
Nodes (4): InscriptionService, maskDocument(), createInscripcionesModule(), inscripcionesRoutes()

### Community 15 - "inscription-service.ts"
Cohesion: 0.21
Nodes (16): InscriptionInput, InscriptionSummary, NO_REINSCRIPTION, PaymentContext, ADR-0015, ADR-0017, CAMPUSES, ECONOMIC_DEPENDENCY (+8 more)

### Community 16 - "Carga directa a S3"
Cohesion: 0.09
Nodes (17): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, Row (+9 more)

### Community 17 - "lambda-worker.ts"
Cohesion: 0.09
Nodes (22): @aws-sdk/client-sqs@^3.1161.0, application, handler(), processQueue(), SqsEvent, ADR-0012, ADR-0021, application (+14 more)

### Community 18 - "scripts"
Cohesion: 0.09
Nodes (24): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+16 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.05
Nodes (59): dependencies, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, cookie-parser@1.4.7, exceljs@^4.4.0, express@5.3.0, helmet@8.3.0 (+51 more)

### Community 20 - "Servicio de expedientes"
Cohesion: 0.19
Nodes (6): DossierService, iso(), latest(), expedientesRoutes(), meta(), sendFile()

### Community 21 - "middleware.ts"
Cohesion: 0.13
Nodes (25): ADR-0017, announcementsQuery, booleanish, callCode, callParams, feeQuoteQuery, optionsQuery, applicant (+17 more)

### Community 22 - "validationError"
Cohesion: 0.06
Nodes (33): SITE_SLOTS, SiteSlot, TYPES, Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS (+25 more)

### Community 23 - "Revisión de resultados"
Cohesion: 0.09
Nodes (21): MODALITY_LABEL, ResultPerson, ResultsPorts, Answers, computeScore(), Condition, CONDITION_LABEL, Contender (+13 more)

### Community 24 - "inscription.ts"
Cohesion: 0.08
Nodes (16): apiErrorCode(), apiErrorDetails(), Department, District, Province, UbigeoService, Draft, FIELD_TARGET (+8 more)

### Community 25 - "Rutas del panel (backend)"
Cohesion: 0.13
Nodes (18): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+10 more)

### Community 26 - "micuentaweb.ts"
Cohesion: 0.09
Nodes (21): backendDir, envFile, gw, hmacKey, keys, missing, password, publicKey (+13 more)

### Community 27 - "rds.ts"
Cohesion: 0.09
Nodes (20): pdfkit@^0.20.2, pg@8.23.1, qrcode@^1.5.4, backendDir, caFile, check(), client(), envFile (+12 more)

### Community 28 - "Personal y scripts de acceso"
Cohesion: 0.07
Nodes (24): argon2@0.45.1, db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], db, [email, file = '.admin-inicial.txt'], totpService, SecretBox, Argon2Hasher (+16 more)

### Community 29 - "pagos/index.ts"
Cohesion: 0.09
Nodes (23): YapeSessionDto, ADR-0007, ADR-0016, ADR-0019, YapeChargeRequest, YapeGateway, createYapeGateway(), ADR-0007 (+15 more)

### Community 30 - "format.ts"
Cohesion: 0.09
Nodes (18): dateRange(), longDate(), shortDate(), STAGE_STATUS_LABEL, time(), CAMPUS, PRINCIPLES, PRIORITY (+10 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "usuarios/index.ts"
Cohesion: 0.13
Nodes (14): token, IdentityLookupResult, IdentityProvider, ADR-0007, ADR-0015, createIdentityProvider(), ADR-0007, ADR-0015 (+6 more)

### Community 34 - "src/app.ts"
Cohesion: 0.06
Nodes (49): backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012, ADR-0019, ADR-0021 (+41 more)

### Community 35 - "Proveedor de IA (asistente)"
Cohesion: 0.18
Nodes (14): LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017, OpenRouterProvider (+6 more)

### Community 36 - "Pruebas E2E con Playwright"
Cohesion: 0.07
Nodes (12): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900028', out = '.screens/cuenta'], ADR-0015, admin, base32Decode(), totp(), [dni = '99900050', email = 'e2e.micuentaweb@example.com', card = '4970100000000055', out = '.screens/pago-sandbox'] (+4 more)

### Community 37 - ".register"
Cohesion: 0.20
Nodes (6): longDate(), shortDate(), initialStatus(), isPlausibleGraduationYear(), nextCounterValue(), jpegSize()

### Community 38 - "payments-server-check.test.ts"
Cohesion: 0.20
Nodes (6): createPaymentGateway(), MockPaymentGateway, fakeJpeg(), gateway, register(), t

### Community 39 - "Convocatoria (panel)"
Cohesion: 0.12
Nodes (12): Awardee, Awardees, CallAdminPage, CallDetail, Fee, fromLima(), ImportPreview, ImportRow (+4 more)

### Community 40 - "prisma.ts"
Cohesion: 0.12
Nodes (11): db, KnowledgeAdmin, ToolDeps, createAsistenteModule(), ADR-0017, VacancyImportPreview, VacancyImportRow, AwardeeRowError (+3 more)

### Community 41 - "admin.test.ts: movableClock()"
Cohesion: 0.07
Nodes (17): syntheticCheckDigit(), fixedClock(), MemoryEmailSender, MemoryFileStorage, checkDigit, movableClock(), TEST_URL, testApp() (+9 more)

### Community 42 - "seguridad: .getStats()"
Cohesion: 0.09
Nodes (9): SessionMeta, SessionService, sha256(), ADR-0006, SupportCases, SESSION_TTL, createSeguridadModule(), Tx (+1 more)

### Community 43 - "ref_node_path"
Cohesion: 0.08
Nodes (17): @aws-sdk/client-sesv2@^3.1158.0, dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile (+9 more)

### Community 44 - "asistente: AssistantService"
Cohesion: 0.26
Nodes (3): AssistantService, asistenteRoutes(), meta()

### Community 45 - "asistente: tools.ts"
Cohesion: 0.13
Nodes (7): AssistantTools, ESTADO_ETAPA, fecha(), STOP, terms(), ToolResult, ADR-0017

### Community 46 - "package.json: scripts"
Cohesion: 0.10
Nodes (21): scripts, apiperu:check, build, culqi:check, db:reset, db:setup, db:start, db:stop (+13 more)

### Community 47 - "updates"
Cohesion: 0.12
Nodes (16): patterns, patterns, angular, aws-sdk, prisma, patterns, day, interval (+8 more)

### Community 48 - "ci.yml"
Cohesion: 0.08
Nodes (28): name, runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, name (+20 more)

### Community 50 - "portal admin: AttendanceAdminPage"
Cohesion: 0.20
Nodes (3): AttendanceAdminPage, isOffline(), writeQueue()

### Community 51 - "index.ts: seed/index.ts"
Cohesion: 0.17
Nodes (17): main(), prisma, publicDocsDir, seedCall(), seedCatalog(), seedContent(), seedExams(), seedIdentity() (+9 more)

### Community 53 - "ConvocatoriasQueries"
Cohesion: 0.09
Nodes (17): ConfiguracionQueries, shortDate(), createConfiguracionModule(), ConvocatoriasQueries, ConvocatoriasRepository, EnrollmentStatsProvider, nextMilestone(), Stage (+9 more)

### Community 54 - "convocatorias: .listFees()"
Cohesion: 0.16
Nodes (12): byPriority(), FeeCriteria, FeeInfo, FeeQuote, matches(), MilitaryCondition, Modality, quoteFee() (+4 more)

### Community 55 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:setup, db:start, db:stop, dev, dev:rds, izipay:check (+6 more)

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "accounts.test.ts: synthetic-identities.t"
Cohesion: 0.21
Nodes (7): REDACTED_PATHS, activeAccount(), clock, lastCode(), lookup(), register(), t

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.16
Nodes (3): blankProgram(), blankReq(), CatalogAdminPage

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.09
Nodes (17): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+9 more)

### Community 61 - "admin-login.ts"
Cohesion: 0.21
Nodes (6): StaffStep, STEP_LABEL, ADR-0018, ADR-0022, RecoveryCodes, ADR-0022

### Community 64 - "db.ts: db.ts"
Cohesion: 0.19
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "pagos: PaymentService"
Cohesion: 0.27
Nodes (5): PaymentService, formatAmount(), createPagosModule(), meta(), pagosRoutes()

### Community 67 - "s3-file-storage.ts: s3-check.ts"
Cohesion: 0.10
Nodes (10): @aws-sdk/client-s3@^3.1158.0, s3, files, root, s3, TYPES, S3FileStorage, client (+2 more)

### Community 69 - "optimizar-imagenes.mjs"
Cohesion: 0.22
Nodes (7): sharp@^0.34.5, sharp, base, dir, require, sharp, WIDTHS

### Community 70 - "results.test.ts: results.test.ts"
Cohesion: 0.14
Nodes (11): box, clock, codes, DNIS, fakeJpeg(), jump(), registerExo(), secrets (+3 more)

### Community 72 - "package.json: contracts/package.json"
Cohesion: 0.14
Nodes (14): description, devDependencies, typescript@6.0.3, exports, typescript, main, name, private (+6 more)

### Community 73 - "businessRule"
Cohesion: 0.16
Nodes (3): iso(), ResultsService, businessRule()

### Community 74 - "exams.test.ts: exams.test.ts"
Cohesion: 0.16
Nodes (10): box, clock, codes, DNIS, fakeJpeg(), jump(), registerOrd(), secrets (+2 more)

### Community 78 - "portal cuenta: MyAccountPage"
Cohesion: 0.16
Nodes (4): MyAccountPage, base32Decode(), text, totp()

### Community 79 - "payment-rules.ts"
Cohesion: 0.12
Nodes (22): backendDir, envFile, gw, missing, ADR-0016, Attempt, AttemptResultDto, PaymentSessionDto (+14 more)

### Community 80 - "FichaService"
Cohesion: 0.36
Nodes (3): FichaService, longDate(), shortName()

### Community 81 - "seguridad: totp.ts"
Cohesion: 0.23
Nodes (12): base32Decode(), base32Encode(), hotp(), newTotpSecret(), otpauthUri(), stepAt(), totp(), TOTP_STEP_SECONDS (+4 more)

### Community 82 - "dossier.test.ts: dossier.test.ts"
Cohesion: 0.18
Nodes (9): box, clock, fakeJpeg(), pdf(), registerExo(), secrets, t, upload() (+1 more)

### Community 83 - "pending-features.test.ts: pending-featur"
Cohesion: 0.19
Nodes (10): as(), binary(), box, clock, exo, fakeJpeg(), inscription(), secrets (+2 more)

### Community 84 - "pagos: money()"
Cohesion: 0.18
Nodes (11): ANNULMENT_REASONS, money(), PAID, providerPaid(), Reason, RECONCILIATION_LABEL, Result, TreasuryService (+3 more)

### Community 85 - "inscripciones/presentation/routes.ts"
Cohesion: 0.22
Nodes (7): ESCUDO, OrdenPagoService, stamp(), inscriptionSchema, meta(), name, ubigeo

### Community 86 - "convocatorias: .quoteFee()"
Cohesion: 0.17
Nodes (10): FeeRule, SurchargeRule, CallSummary, DocumentRecord, OptionRecord, QuotaCategoryRecord, RequirementRecord, SubmodalityRecord (+2 more)

### Community 87 - "usuarios/presentation/routes.ts"
Cohesion: 0.22
Nodes (9): Permission, lookupSchema, phone, profileSchema, registerSchema, requireClientHeader(), StaffRouteDeps, ADR-0015 (+1 more)

### Community 88 - "env.ts"
Cohesion: 0.12
Nodes (16): application, handler, ADR-0009, Env, loadEnv(), schema, ADR-0010, ADR-0016 (+8 more)

### Community 90 - "tsconfig.json: contracts/tsconfig.json"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, outDir, rootDir, sourceMap, types, extends, include (+1 more)

### Community 91 - "e2e-resultados.mjs: e2e-resultados.mjs"
Cohesion: 0.24
Nodes (7): admin, base32Decode(), comision, errors, health, login(), totp()

### Community 92 - "trazabilidad.mjs: trazabilidad.mjs"
Cohesion: 0.20
Nodes (9): cover, ESTADO, guide, missing, modules, n, out, sections (+1 more)

### Community 93 - "catalog.ts: seed/catalog.ts"
Cohesion: 0.22
Nodes (8): areas, faculties, FacultyKey, modalities, options, programs, quotaCategories, submodalities

### Community 95 - "ubigeo.ts: .paymentContext()"
Cohesion: 0.22
Nodes (7): Department, departments, District, districtIndex, districtLabel(), isValidDistrict(), Province

### Community 98 - "portal admin: results.ts"
Cohesion: 0.25
Nodes (7): Batch, ExamResults, Issue, STATUS, TAG, VersionDetail, VersionSummary

### Community 101 - "payments.test.ts: payments.test.ts"
Cohesion: 0.32
Nodes (5): confirmWith(), fakeJpeg(), register(), signed(), t

### Community 102 - "tsconfig.json: backend/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, ../../tsconfig.base.json

### Community 103 - "session-policy.ts"
Cohesion: 0.24
Nodes (8): evaluateRefresh(), IDLE_LIMIT_SECONDS, RefreshDecision, SessionState, ADR-0006, minutesAgo(), now, session()

### Community 107 - "event-queue.test.ts"
Cohesion: 0.20
Nodes (7): clock, failFor, FakeQueue, handled, queue, t, ADR-0021

### Community 108 - "AdminSession"
Cohesion: 0.12
Nodes (4): AdminSession, NAV, NavItem, ROLE_NAMES

### Community 113 - "e2e-expediente.mjs: e2e-expediente.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 114 - "assistant.test.ts"
Cohesion: 0.29
Nodes (5): ai, basic, scripted, toolCall(), usage

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 117 - "resultados/presentation/routes.ts"
Cohesion: 0.27
Nodes (9): applicant, Column, COVERAGE_COLUMNS, meta(), RESULT_COLUMNS, resultadosRoutes(), send(), ADR-0020 (+1 more)

### Community 118 - "assistant-rules.ts"
Cohesion: 0.29
Nodes (9): AssistantReply, ADR-0017, asksForHuman(), LIMITS, maskPersonal(), NO_INFO_REPLY, SUGGESTIONS, SYSTEM_PROMPT (+1 more)

### Community 119 - "staff-recovery.test.ts"
Cohesion: 0.29
Nodes (6): clock, codes, login(), recovery(), t, ADR-0022

### Community 121 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, ng, start, test, watch

### Community 122 - "attendance.ts"
Cohesion: 0.10
Nodes (11): @angular/common@22.2.3, AssetMap, SiteImages, BoardExam, BoardRoom, CheckIn, Incident, INCIDENTS (+3 more)

### Community 123 - "izipay-gateway.ts"
Cohesion: 0.16
Nodes (13): orderNumberFor(), ProviderResult, PaymentGateway, SignedMessage, API, SDK, ADR-0007, isValidSignature() (+5 more)

### Community 124 - "exams.ts: seed/exams.ts"
Cohesion: 0.40
Nodes (4): BUILDINGS, exams, rooms, venue

### Community 125 - "identity.ts: identity.ts"
Cohesion: 0.40
Nodes (4): consentDocument, disqualifiedPersons, permissions, roles

### Community 131 - "rxjs"
Cohesion: 0.17
Nodes (8): InboxDto, InboxPanel, Line, Msg, Panel, toLines(), ADR-0017, rxjs

### Community 133 - "screenshots-panel.mjs"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

### Community 134 - "AdminDeps"
Cohesion: 0.29
Nodes (4): AdminDeps, VacancyImport, CepreAwardees, Column

### Community 135 - "synthetic-identities.ts"
Cohesion: 0.40
Nodes (5): FIRST, scenarioFor(), SURNAMES, syntheticIdentities, SyntheticIdentity

### Community 137 - "fee-calculator.test.ts"
Cohesion: 0.17
Nodes (10): base, CEPRE_EXTEMP, CEPRE_REGULAR, EXO_EXTEMP, fees, ORD_EXTEMP, REGULAR, rules (+2 more)

## Knowledge Gaps
- **132 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+127 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1198 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `Páginas del panel y errores` to `api.service.ts`, `Sesión del panel (frontend)`, `@angular/core`, `rxjs`, `Carga directa a S3`, `inscription.ts`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `admin-login.ts`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `portal pago: loadScript()`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `portal admin: KnowledgeAdminPage`, `portal admin: results.ts`, `portal admin: SystemAdminPage`, `portal admin: Component`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `CasesAdminPage`, `portal admin: DisqualifiedAdminPage`, `attendance.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _132 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03650615901455767 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `Contenido del portal (admin)` to `ApplicationDocuments`, `Db`, `NotificationService`, `usuariosRoutes`, `AdminDeps`, `Asistencia y PDF de examen`, `seguridad/index.ts`, `Servicio de asistencia`, `InscriptionService`, `inscription-service.ts`, `Servicio de expedientes`, `middleware.ts`, `validationError`, `Revisión de resultados`, `Rutas del panel (backend)`, `src/app.ts`, `.register`, `prisma.ts`, `asistente: AssistantService`, `SiteAssets`, `ConvocatoriasQueries`, `pagos: PaymentService`, `businessRule`, `payment-rules.ts`, `FichaService`, `pagos: money()`, `inscripciones/presentation/routes.ts`, `usuarios/presentation/routes.ts`, `StaffAdmin`, `resultados/presentation/routes.ts`, `assistant-rules.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.033707865168539325 - nodes in this community are weakly interconnected._
- **Why does `notFound()` connect `Contenido del portal (admin)` to `api.service.ts`, `ApplicationDocuments`, `Db`, `NotificationService`, `AdminDeps`, `Asistencia y PDF de examen`, `seguridad/index.ts`, `Servicio de asistencia`, `InscriptionService`, `inscription-service.ts`, `Servicio de expedientes`, `validationError`, `Revisión de resultados`, `src/app.ts`, `.register`, `prisma.ts`, `asistente: AssistantService`, `SiteAssets`, `ConvocatoriasQueries`, `pagos: PaymentService`, `businessRule`, `payment-rules.ts`, `FichaService`, `pagos: money()`, `ubigeo.ts: .paymentContext()`, `StaffAdmin`, `assistant-rules.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `@angular/core` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._