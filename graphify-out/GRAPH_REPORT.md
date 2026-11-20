# Graph Report - proyectofinal  (2026-11-20)

## Corpus Check
- 320 files · ~242,014 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .scss 5, (none) 4, .woff 4)

## Summary
- 3314 nodes · 7851 edges · 156 communities (111 shown, 45 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 256 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0c307e25`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- format.ts
- admin-routes.ts
- NotificationService
- convocatorias/domain/ports.ts
- apiErrorMessage
- Cliente API del portal
- exam-service.ts
- generar.ts
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
- handle
- validationError
- inscription-rules.ts
- admin-routes.ts
- PrismaPaymentRepository
- verificar.mjs
- treasuryRoutes
- ref_node_url
- accounts.test.ts
- PaymentGateway
- dependencies
- Exámenes (panel)
- Formulario de inscripción
- ConvocatoriasQueries
- NoticeSources
- rule-based-provider.ts
- ref_node_fs
- scripts
- ExamService
- Convocatoria (panel)
- env.ts
- attendance.ts
- Tx
- treasury.test.ts
- ubigeo.service.ts
- dossier-service.ts
- package.json: scripts
- updates
- ci.yml
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- Argon2Hasher
- usuarios/index.ts
- lambda-worker.ts
- CallAdmin
- portal admin: ResultsAdminPage
- tsconfig.base.json: tsconfig.base.json
- @angular/forms
- portal admin: blankProgram()
- call-2027-I.ts: call-2027-I.ts
- Tx
- portal admin: DossiersAdminPage
- portal admin: NotificationsAdminPage
- db.ts: db.ts
- payment-rules.ts
- OnlinePayment
- PaymentRepository
- PrismaConvocatoriasRepository
- notifications.test.ts
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
- FichaService
- AdminShell
- convocatorias/index.ts
- portal admin: AdminLoginPage
- tsconfig.json: contracts/tsconfig.json
- staff-recovery.test.ts
- trazabilidad.mjs: trazabilidad.mjs
- catalog.ts: seed/catalog.ts
- InscriptionRepository
- generar-coleccion.py
- portal admin: DashboardPage
- KnowledgeAdminPage
- ReportQueries
- limites-modulos.test.ts
- StaffAdmin
- payments.test.ts: payments.test.ts
- tsconfig.json: backend/tsconfig.json
- helpers.ts
- InscriptionUnitOfWork
- portal cuenta: CreateAccountPage
- portal public: ComplaintsPage
- ubigeo.ts
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
- tools.ts
- DailyChart
- PrismaInscriptionRepository
- rendimiento.js
- pago-culqi.test.ts
- PrismaSurveyRepository
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- @angular/core
- AssistantService
- ConvocatoriasRepository
- assistant.test.ts
- ngsw-config.json
- InboxPanel
- SystemAdminPage
- HomePage
- inscription-service.ts
- resultados/presentation/routes.ts
- server.ts
- VenuesAdminPage
- e2e-resultados.mjs
- application/usability-survey.ts
- convocatorias-queries.ts
- ref_node_path
- CasesAdminPage
- optimizar-imagenes.mjs
- assistant-rules.ts
- AdminDeps
- LocalFileStorage
- SiteImages
- SecurityPage
- AdminDeps
- SyllabusPage
- uuid@^11.1.1
- S3FileStorage

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
- `createApplication()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  apps/backend/src/app.ts → apps/backend/src/shared/http/middleware.ts
- `seedStaff()` --calls--> `temporaryPassword()`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/application/staff-admin.ts

## Import Cycles
- None detected.

## Communities (156 total, 45 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.05
Nodes (66): CLIENT, ADR-0015, ApiHttpError, FichaVerification, InboxDto, ReinscriptionCheck, SubmodalityDto, ADR-0010 (+58 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.03
Nodes (79): CLIENT, Query, StaffMe, ADR-0018, ADR-0022, shortDateTime(), adminRoutes, ADR-0018 (+71 more)

### Community 2 - "format.ts"
Cohesion: 0.06
Nodes (33): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, closesIn() (+25 more)

### Community 3 - "admin-routes.ts"
Cohesion: 0.13
Nodes (18): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+10 more)

### Community 4 - "NotificationService"
Cohesion: 0.18
Nodes (7): day(), hour(), NotificationService, escape(), fill(), meta(), notificacionesRoutes()

### Community 5 - "convocatorias/domain/ports.ts"
Cohesion: 0.14
Nodes (10): FeeRule, SurchargeRule, CallSummary, DocumentRecord, EnrollmentStatsProvider, QuotaCategoryRecord, RequirementRecord, SubmodalityRecord (+2 more)

### Community 6 - "apiErrorMessage"
Cohesion: 0.04
Nodes (18): AdmittedListDto, apiErrorMessage(), ExamRoomDto, MyResultDto, InscriptionsAdminPage, Page, PaymentsAdminPage, Row (+10 more)

### Community 8 - "exam-service.ts"
Cohesion: 0.08
Nodes (34): RoomInfo, ExamInput, ExamInscriptions, ExamPerson, ExamRow, ExamStructure, MODALITY_LABEL, RoomRow (+26 more)

### Community 9 - "generar.ts"
Cohesion: 0.10
Nodes (19): backend, components, DESCRIPCION_MODULO, doc, files, fromSpec, Json, MODULOS (+11 more)

### Community 10 - "RequestMeta"
Cohesion: 0.11
Nodes (5): ContentAdmin, CatalogAdmin, SecurityAdmin, RequestMeta, notFound()

### Community 11 - "Db"
Cohesion: 0.08
Nodes (17): Application, AppOverrides, KnowledgeAdmin, ToolDeps, createAsistenteModule(), ADR-0017, DEFAULT_PARAMETERS, Column (+9 more)

### Community 12 - "frontend/package.json"
Cohesion: 0.06
Nodes (39): dependencies, @angular/common@22.2.3, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, @angular/service-worker@22.2.3 (+31 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (43): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+35 more)

### Community 14 - "results-service.ts"
Cohesion: 0.07
Nodes (24): iso(), MODALITY_LABEL, ResultPerson, ResultsPorts, ResultsService, Answers, computeScore(), Condition (+16 more)

### Community 15 - "inscription-service.ts"
Cohesion: 0.11
Nodes (10): InscriptionService, longDate(), shortDate(), initialStatus(), isPlausibleGraduationYear(), maskDocument(), createInscripcionesModule(), inscripcionesRoutes() (+2 more)

### Community 16 - "seguridad/index.ts"
Cohesion: 0.06
Nodes (34): SupportCases, ALL, byRole, hasPermission(), Permission, PERMISSIONS, permissionsOf(), STAFF_ROLES (+26 more)

### Community 18 - "package.json"
Cohesion: 0.08
Nodes (27): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+19 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.07
Nodes (43): devDependencies, concurrently@10.0.6, effect@3.22.5, embedded-postgres@16.14.0-beta.17, esbuild@0.28.2, pino-pretty@13.2.0, prisma@7.10.1, supertest@7.3.1 (+35 more)

### Community 20 - "handle"
Cohesion: 0.11
Nodes (30): ADR-0017, announcementsQuery, configuracionRoutes(), booleanish, callCode, callParams, feeQuoteQuery, optionsQuery (+22 more)

### Community 21 - "validationError"
Cohesion: 0.07
Nodes (36): AssistantReply, ADR-0017, FORMATS, VacancyImportPreview, VacancyImportRow, AwardeeRowError, CYCLES, Attempt (+28 more)

### Community 22 - "inscription-rules.ts"
Cohesion: 0.24
Nodes (10): InscriptionInput, CAMPUSES, ECONOMIC_DEPENDENCY, MARITAL_STATUS, MODALITIES, PAYMENT_ENTITIES, PHOTO, PREPARATION (+2 more)

### Community 23 - "admin-routes.ts"
Cohesion: 0.15
Nodes (33): attendancePdf(), eligibleListPdf(), examSlipPdf(), footer(), hour(), longDate(), render(), ENTRY (+25 more)

### Community 24 - "PrismaPaymentRepository"
Cohesion: 0.18
Nodes (4): PrismaPaymentRepository, toAttempt(), toOrder(), withOrder()

### Community 25 - "verificar.mjs"
Cohesion: 0.06
Nodes (22): backendDir, dataDir, TEST_DATABASE_URL, t, ATRIBUTOS, audit, backend, destino (+14 more)

### Community 26 - "treasuryRoutes"
Cohesion: 0.29
Nodes (6): money(), providerPaid(), TreasuryService, createTesoreria(), meta(), treasuryRoutes()

### Community 27 - "ref_node_url"
Cohesion: 0.11
Nodes (14): dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile, ses (+6 more)

### Community 28 - "accounts.test.ts"
Cohesion: 0.14
Nodes (13): FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, REDACTED_PATHS, activeAccount() (+5 more)

### Community 29 - "PaymentGateway"
Cohesion: 0.16
Nodes (9): PaymentSessionDto, ChargeRequest, PaymentGateway, ADR-0007, ADR-0024, MOCK_TOKENS, MockPaymentGateway, ADR-0007 (+1 more)

### Community 30 - "dependencies"
Cohesion: 0.06
Nodes (36): dependencies, argon2@0.45.1, @aws-sdk/client-sesv2@^3.1158.0, @aws-sdk/client-sqs@^3.1161.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, cookie-parser@1.4.7 (+28 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "ConvocatoriasQueries"
Cohesion: 0.31
Nodes (4): ConvocatoriasQueries, createConvocatoriasModule(), convocatoriasRoutes(), toLimaIso()

### Community 35 - "rule-based-provider.ts"
Cohesion: 0.19
Nodes (14): LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017, OpenRouterProvider (+6 more)

### Community 36 - "ref_node_fs"
Cohesion: 0.07
Nodes (17): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900028', out = '.screens/cuenta'], ADR-0015, admin, base32Decode(), totp(), jobs (+9 more)

### Community 37 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:setup, db:start, db:stop, dev, dev:rds, izipay:check (+6 more)

### Community 38 - "ExamService"
Cohesion: 0.12
Nodes (8): AttendanceService, iso(), ExamInfo, ExamService, iso(), roomInfo(), examenesRoutes(), businessRule()

### Community 40 - "env.ts"
Cohesion: 0.12
Nodes (14): application, handler, ADR-0009, Env, schema, ADR-0010, ADR-0017, ADR-0018 (+6 more)

### Community 41 - "attendance.ts"
Cohesion: 0.11
Nodes (12): AssetMap, BoardExam, BoardRoom, CheckIn, Incident, INCIDENTS, Pending, Row (+4 more)

### Community 42 - "Tx"
Cohesion: 0.16
Nodes (11): SessionMeta, SessionService, sha256(), ADR-0006, deviceLabel(), evaluateRefresh(), IDLE_LIMIT_SECONDS, RefreshDecision (+3 more)

### Community 43 - "treasury.test.ts"
Cohesion: 0.11
Nodes (11): totpService, clock, secrets, t, box, clock, duplicate, paid (+3 more)

### Community 44 - "ubigeo.service.ts"
Cohesion: 0.17
Nodes (5): Department, District, Province, UbigeoService, UbigeoSelect

### Community 45 - "dossier-service.ts"
Cohesion: 0.18
Nodes (6): DossierService, iso(), latest(), expedientesRoutes(), meta(), sendFile()

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
Cohesion: 0.10
Nodes (24): BUILDINGS, exams, rooms, venue, consentDocument, disqualifiedPersons, permissions, roles (+16 more)

### Community 52 - "Argon2Hasher"
Cohesion: 0.14
Nodes (12): Argon2Hasher, staff(), staff(), staff(), staff(), box, CHROME_WIN_NUEVO, clock (+4 more)

### Community 53 - "usuarios/index.ts"
Cohesion: 0.12
Nodes (15): token, IdentityLookupResult, IdentityProvider, ADR-0007, ADR-0015, createIdentityProvider(), createUsuariosModule(), ADR-0007 (+7 more)

### Community 54 - "lambda-worker.ts"
Cohesion: 0.19
Nodes (11): application, handler(), processQueue(), SqsEvent, ADR-0012, ADR-0021, QueuedEvent, TaskName (+3 more)

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "@angular/forms"
Cohesion: 0.07
Nodes (21): StaffStep, longDate(), STEP_LABEL, ADR-0018, Count, Dashboard, ReportKind, REPORTS (+13 more)

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.16
Nodes (3): blankProgram(), blankReq(), CatalogAdminPage

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.11
Nodes (15): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+7 more)

### Community 61 - "Tx"
Cohesion: 0.26
Nodes (12): AttemptRecord, AttemptWithOrder, OrderRecord, SettleData, SettleOutcome, AttemptResultDto, PaymentStatusDto, AttemptStatus (+4 more)

### Community 64 - "db.ts: db.ts"
Cohesion: 0.19
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "payment-rules.ts"
Cohesion: 0.18
Nodes (10): PaymentService, ATTEMPT_LABEL, ATTEMPT_TTL_SECONDS, formatAmount(), newTransactionId(), orderNumberFor(), ProviderResult, ADR-0019 (+2 more)

### Community 68 - "PrismaConvocatoriasRepository"
Cohesion: 0.13
Nodes (3): OptionRecord, PrismaConvocatoriasRepository, toFee()

### Community 69 - "notifications.test.ts"
Cohesion: 0.18
Nodes (4): SecretBox, box, clock, t

### Community 70 - "results.test.ts: results.test.ts"
Cohesion: 0.14
Nodes (11): box, clock, codes, DNIS, fakeJpeg(), jump(), registerExo(), secrets (+3 more)

### Community 72 - "package.json: contracts/package.json"
Cohesion: 0.14
Nodes (14): description, devDependencies, typescript@6.0.3, exports, typescript, main, name, private (+6 more)

### Community 73 - "prisma-inscription-repository.ts"
Cohesion: 0.24
Nodes (4): ApplicationRecord, DuplicateApplicationError, NewApplication, isUniqueViolation()

### Community 74 - "exams.test.ts: exams.test.ts"
Cohesion: 0.16
Nodes (10): box, clock, codes, DNIS, fakeJpeg(), jump(), registerOrd(), secrets (+2 more)

### Community 78 - "portal cuenta: MyAccountPage"
Cohesion: 0.14
Nodes (4): MyAccountPage, base32Decode(), text, totp()

### Community 79 - "@angular/core"
Cohesion: 0.04
Nodes (35): App, appConfig, ADR-0023, routes, ADR-0015, ADR-0018, CallStore, KEY_STAGES (+27 more)

### Community 80 - "inscription.ts"
Cohesion: 0.07
Nodes (17): apiErrorCode(), apiErrorDetails(), Draft, FIELD_TARGET, LABELS, InscriptionReceipt, REQUIRED_MSG, STEPS (+9 more)

### Community 81 - "seguridad: totp.ts"
Cohesion: 0.23
Nodes (12): base32Decode(), base32Encode(), hotp(), newTotpSecret(), otpauthUri(), stepAt(), totp(), TOTP_STEP_SECONDS (+4 more)

### Community 82 - "dossier.test.ts: dossier.test.ts"
Cohesion: 0.18
Nodes (9): box, clock, fakeJpeg(), pdf(), registerExo(), secrets, t, upload() (+1 more)

### Community 83 - "pending-features.test.ts: pending-featur"
Cohesion: 0.19
Nodes (10): as(), binary(), box, clock, exo, fakeJpeg(), inscription(), secrets (+2 more)

### Community 84 - "culqi-gateway.ts"
Cohesion: 0.19
Nodes (7): CulqiCharge, CulqiConfig, CulqiGateway, parseCulqiCharge(), ADR-0024, gw, req

### Community 85 - "fee-calculator.ts"
Cohesion: 0.09
Nodes (22): byPriority(), FeeCriteria, FeeInfo, FeeQuote, matches(), MilitaryCondition, Modality, quoteFee() (+14 more)

### Community 86 - "FichaService"
Cohesion: 0.36
Nodes (3): FichaService, longDate(), shortName()

### Community 88 - "convocatorias/index.ts"
Cohesion: 0.19
Nodes (8): ConfiguracionQueries, SITE_SLOTS, SiteSlot, TYPES, createConfiguracionModule(), ADR-0002, invalidatesOnUse(), MemoryCache

### Community 90 - "tsconfig.json: contracts/tsconfig.json"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, outDir, rootDir, sourceMap, types, extends, include (+1 more)

### Community 91 - "staff-recovery.test.ts"
Cohesion: 0.19
Nodes (11): group(), newRecoveryCodes(), normalizeRecoveryCode(), RECOVERY_CODE_COUNT, ADR-0022, clock, codes, login() (+3 more)

### Community 92 - "trazabilidad.mjs: trazabilidad.mjs"
Cohesion: 0.20
Nodes (9): cover, ESTADO, guide, missing, modules, n, out, sections (+1 more)

### Community 93 - "catalog.ts: seed/catalog.ts"
Cohesion: 0.22
Nodes (8): areas, faculties, FacultyKey, modalities, options, programs, quotaCategories, submodalities

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
Cohesion: 0.13
Nodes (11): fixedClock(), loadEnv(), MemoryEmailSender, MemoryFileStorage, checkDigit, TEST_URL, testApp(), t (+3 more)

### Community 104 - "InscriptionUnitOfWork"
Cohesion: 0.14
Nodes (4): InscriptionUnitOfWork, InscriptionSummary, InscriptionStatus, PrismaInscriptionUnitOfWork

### Community 107 - "ubigeo.ts"
Cohesion: 0.25
Nodes (6): Department, departments, District, districtIndex, districtLabel(), Province

### Community 108 - "usuariosRoutes"
Cohesion: 0.08
Nodes (24): AuthService, IdentityTokenPayload, sha256(), ADR-0018, describeDevice(), ProfileService, applicantCodeFromSequence(), COMMON (+16 more)

### Community 112 - "src/app.ts"
Cohesion: 0.05
Nodes (48): backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012, ADR-0021, createExamenesModule() (+40 more)

### Community 113 - "e2e-examen.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 114 - "rds.ts"
Cohesion: 0.29
Nodes (9): backendDir, caFile, check(), client(), envFile, migrate(), setup(), ADR-0009 (+1 more)

### Community 115 - "ref_vitest"
Cohesion: 0.18
Nodes (8): movableClock(), clock, failFor, FakeQueue, handled, queue, t, ADR-0021

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 118 - "tools.ts"
Cohesion: 0.29
Nodes (3): AssistantTools, fecha(), terms()

### Community 119 - "ref_vitest"
Cohesion: 0.20
Nodes (7): fakeJpeg(), register(), t, minutesAgo(), now, session(), ADR-0014

### Community 120 - "tools.ts"
Cohesion: 0.20
Nodes (4): ESTADO_ETAPA, STOP, ToolResult, ADR-0017

### Community 122 - "PrismaInscriptionRepository"
Cohesion: 0.16
Nodes (3): ApplicationFilter, PrismaInscriptionRepository, where()

### Community 123 - "rendimiento.js"
Cohesion: 0.13
Nodes (6): ETAPAS, MAXIMO, options, options, options, USUARIOS

### Community 124 - "pago-culqi.test.ts"
Cohesion: 0.22
Nodes (6): culqi, fakeJpeg(), register(), t, ADR-0024, Who

### Community 125 - "PrismaSurveyRepository"
Cohesion: 0.25
Nodes (3): SurveyAlreadyAnsweredError, SurveyRepository, PrismaSurveyRepository

### Community 128 - "@angular/core"
Cohesion: 0.06
Nodes (22): dateRange(), shortDate(), STAGE_STATUS_LABEL, time(), ApplicationFinder, CAMPUS, PRINCIPLES, PRIORITY (+14 more)

### Community 129 - "AssistantService"
Cohesion: 0.22
Nodes (4): AssistantService, maskPersonal(), asistenteRoutes(), meta()

### Community 131 - "assistant.test.ts"
Cohesion: 0.29
Nodes (5): ai, basic, scripted, toolCall(), usage

### Community 132 - "ngsw-config.json"
Cohesion: 0.40
Nodes (4): assetGroups, index, navigationUrls, $schema

### Community 136 - "inscription-service.ts"
Cohesion: 0.07
Nodes (34): Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus, OBSERVE_HOURS (+26 more)

### Community 137 - "resultados/presentation/routes.ts"
Cohesion: 0.25
Nodes (7): applicant, Column, COVERAGE_COLUMNS, meta(), RESULT_COLUMNS, send(), ADR-0020

### Community 138 - "server.ts"
Cohesion: 0.11
Nodes (19): application, background(), env, server, ticker, timer, warm(), warmer (+11 more)

### Community 142 - "e2e-resultados.mjs"
Cohesion: 0.24
Nodes (7): admin, base32Decode(), comision, errors, health, login(), totp()

### Community 143 - "application/usability-survey.ts"
Cohesion: 0.31
Nodes (7): SurveyRecord, UsabilitySurveyService, isValidSusAnswers(), SUS_STATEMENTS, SUS_TARGET, susGrade(), susScore()

### Community 144 - "convocatorias-queries.ts"
Cohesion: 0.16
Nodes (10): stages, shortDate(), nextMilestone(), Stage, StageKind, StageScope, stagesInProgress(), StageStatus (+2 more)

### Community 145 - "ref_node_path"
Cohesion: 0.08
Nodes (16): files, root, s3, TYPES, apply, db, db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'] (+8 more)

### Community 147 - "optimizar-imagenes.mjs"
Cohesion: 0.13
Nodes (11): left, out, require, root, sharp, top, base, dir (+3 more)

### Community 148 - "assistant-rules.ts"
Cohesion: 0.29
Nodes (6): asksForHuman(), LIMITS, NO_INFO_REPLY, SUGGESTIONS, SYSTEM_PROMPT, ADR-0017

### Community 149 - "AdminDeps"
Cohesion: 0.15
Nodes (6): AdminDeps, SiteAssets, sniff(), VacancyImport, CepreAwardees, Column

### Community 164 - "S3FileStorage"
Cohesion: 0.13
Nodes (6): @aws-sdk/client-s3@^3.1158.0, s3, S3FileStorage, client, storage, @aws-sdk/client-s3

## Knowledge Gaps
- **129 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+124 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1351 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `apiErrorMessage` to `api.service.ts`, `Sesión del panel (frontend)`, `format.ts`, `@angular/core`, `InboxPanel`, `SystemAdminPage`, `VenuesAdminPage`, `CasesAdminPage`, `SecurityPage`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `attendance.ts`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `@angular/forms`, `portal admin: blankProgram()`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `OnlinePayment`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `@angular/core`, `inscription.ts`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `KnowledgeAdminPage`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `DisqualifiedAdminPage`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _129 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.047719298245614036 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `RequestMeta` to `AssistantService`, `admin-routes.ts`, `NotificationService`, `exam-service.ts`, `inscription-service.ts`, `resultados/presentation/routes.ts`, `Db`, `results-service.ts`, `inscription-service.ts`, `application/usability-survey.ts`, `seguridad/index.ts`, `handle`, `validationError`, `AdminDeps`, `admin-routes.ts`, `treasuryRoutes`, `AdminDeps`, `ExamService`, `dossier-service.ts`, `CallAdmin`, `payment-rules.ts`, `FichaService`, `convocatorias/index.ts`, `StaffAdmin`, `usuariosRoutes`, `src/app.ts`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.02902418682235196 - nodes in this community are weakly interconnected._
- **Why does `@angular/core` connect `@angular/core` to `api.service.ts`, `Sesión del panel (frontend)`, `format.ts`, `@angular/core`, `apiErrorMessage`, `attendance.ts`, `frontend/package.json`, `ubigeo.service.ts`, `inscription.ts`, `DailyChart`, `@angular/forms`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Should `format.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05711263881544157 - nodes in this community are weakly interconnected._