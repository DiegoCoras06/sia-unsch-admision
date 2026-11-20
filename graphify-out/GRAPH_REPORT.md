# Graph Report - proyectofinal  (2026-11-20)

## Corpus Check
- 320 files · ~241,093 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .scss 5, (none) 4, .woff 4)

## Summary
- 3310 nodes · 7843 edges · 163 communities (113 shown, 50 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 252 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f89702cc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- dossiers.ts
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
- Outbox
- package.json
- Dependencias de desarrollo backend
- handle
- payment-service.ts
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
- ficha.test.ts
- NoticeSources
- rule-based-provider.ts
- ref_node_fs
- RecoveryCodes
- ExamService
- Convocatoria (panel)
- env.ts
- attendance.ts
- Tx
- treasury.test.ts
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
- lambda-worker.ts
- CallAdmin
- portal admin: ResultsAdminPage
- tsconfig.base.json: tsconfig.base.json
- format.ts
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
- FichaService
- AdminShell
- createConfiguracionModule
- portal admin: AdminLoginPage
- tsconfig.json: contracts/tsconfig.json
- notifications.test.ts
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
- results.ts
- SystemAdminPage
- HomePage
- validationError
- resultados/presentation/routes.ts
- server.ts
- VenuesAdminPage
- InscriptionStatus
- e2e-resultados.mjs
- application/usability-survey.ts
- convocatorias-queries.ts
- ref_node_path
- CasesAdminPage
- optimizar-imagenes.mjs
- assistant-rules.ts
- SiteAssets
- LocalFileStorage
- SiteImages
- SecurityPage
- s3.test.ts
- openapi.test.ts
- expedientes/index.ts
- AdminDeps
- AdmConfirmHost
- cookie-parser
- swagger-ui-express
- SyllabusPage
- uuid@^11.1.1
- inscription-service.ts

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
- `seedStaff()` --calls--> `Argon2Hasher`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/infrastructure/argon2-hasher.ts
- `AdminDeps` --references--> `AssistantService`  [EXTRACTED]
  apps/backend/src/admin-routes.ts → apps/backend/src/modules/asistente/application/assistant-service.ts

## Import Cycles
- None detected.

## Communities (163 total, 50 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.04
Nodes (69): CLIENT, ADR-0015, ApiHttpError, FichaVerification, ReinscriptionCheck, ADR-0010, ADR-0015, ADR-0017 (+61 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.03
Nodes (89): AdminSession, CLIENT, Query, StaffMe, StaffStep, ADR-0018, ADR-0022, shortDateTime() (+81 more)

### Community 2 - "dossiers.ts"
Cohesion: 0.09
Nodes (18): InboxDto, BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket (+10 more)

### Community 3 - "admin-routes.ts"
Cohesion: 0.13
Nodes (18): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+10 more)

### Community 4 - "NotificationService"
Cohesion: 0.18
Nodes (7): day(), hour(), NotificationService, escape(), fill(), meta(), notificacionesRoutes()

### Community 5 - "convocatorias/domain/ports.ts"
Cohesion: 0.17
Nodes (9): FeeCriteria, FeeRule, SurchargeRule, CallSummary, DocumentRecord, QuotaCategoryRecord, RequirementRecord, SyllabusRecord (+1 more)

### Community 6 - "apiErrorMessage"
Cohesion: 0.04
Nodes (16): AdmittedListDto, apiErrorMessage(), ExamRoomDto, MyResultDto, AuditAdminPage, PaymentsAdminPage, FindRoomPage, DossierPanel (+8 more)

### Community 8 - "exam-service.ts"
Cohesion: 0.08
Nodes (31): RoomInfo, ExamInput, ExamInscriptions, ExamPerson, ExamRow, ExamStructure, MODALITY_LABEL, RoomRow (+23 more)

### Community 9 - "generar.ts"
Cohesion: 0.10
Nodes (19): backend, components, DESCRIPCION_MODULO, doc, files, fromSpec, Json, MODULOS (+11 more)

### Community 10 - "RequestMeta"
Cohesion: 0.10
Nodes (6): ContentAdmin, CatalogAdmin, SecurityAdmin, RequestMeta, conflict(), notFound()

### Community 11 - "Db"
Cohesion: 0.08
Nodes (31): Application, AssistantReply, ADR-0017, KnowledgeAdmin, ToolDeps, ADR-0017, ConfiguracionQueries, DEFAULT_PARAMETERS (+23 more)

### Community 12 - "frontend/package.json"
Cohesion: 0.07
Nodes (37): dependencies, @angular/common@22.2.3, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, @angular/service-worker@22.2.3 (+29 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (43): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+35 more)

### Community 14 - "results-service.ts"
Cohesion: 0.07
Nodes (24): iso(), MODALITY_LABEL, ResultPerson, ResultsPorts, ResultsService, Answers, computeScore(), Condition (+16 more)

### Community 15 - "inscription-service.ts"
Cohesion: 0.10
Nodes (8): CepreAwardees, InscriptionService, longDate(), shortDate(), maskDocument(), createInscripcionesModule(), inscripcionesRoutes(), meta()

### Community 16 - "seguridad/index.ts"
Cohesion: 0.07
Nodes (36): ALL, byRole, hasPermission(), Permission, PERMISSIONS, permissionsOf(), STAFF_ROLES, ADR-0018 (+28 more)

### Community 17 - "Outbox"
Cohesion: 0.13
Nodes (10): ACTIONS, ProfileService, IDENTITY_FIELDS, DomainEvents, EventType, Handler, Outbox, SECRET_BEARING_EVENTS (+2 more)

### Community 18 - "package.json"
Cohesion: 0.05
Nodes (41): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+33 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.07
Nodes (43): devDependencies, concurrently@10.0.6, effect@3.22.5, embedded-postgres@16.14.0-beta.17, esbuild@0.28.2, pino-pretty@13.2.0, prisma@7.10.1, supertest@7.3.1 (+35 more)

### Community 20 - "handle"
Cohesion: 0.11
Nodes (29): ADR-0017, announcementsQuery, configuracionRoutes(), booleanish, callCode, callParams, convocatoriasRoutes(), feeQuoteQuery (+21 more)

### Community 21 - "payment-service.ts"
Cohesion: 0.20
Nodes (15): Attempt, AttemptResultDto, PaymentStatusDto, ADR-0019, ADR-0024, Via, ATTEMPT_LABEL, ATTEMPT_TTL_SECONDS (+7 more)

### Community 22 - "inscription-rules.ts"
Cohesion: 0.19
Nodes (12): InscriptionInput, CAMPUSES, ECONOMIC_DEPENDENCY, initialStatus(), isPlausibleGraduationYear(), MARITAL_STATUS, MODALITIES, PAYMENT_ENTITIES (+4 more)

### Community 23 - "admin-routes.ts"
Cohesion: 0.16
Nodes (31): attendancePdf(), eligibleListPdf(), examSlipPdf(), footer(), render(), ENTRY, limaDate(), OrdenPagoService (+23 more)

### Community 24 - "PrismaPaymentRepository"
Cohesion: 0.18
Nodes (4): PrismaPaymentRepository, toAttempt(), toOrder(), withOrder()

### Community 25 - "verificar.mjs"
Cohesion: 0.11
Nodes (15): ATRIBUTOS, audit, backend, destino, hora, hoy, porAtributo, resultados (+7 more)

### Community 26 - "treasuryRoutes"
Cohesion: 0.19
Nodes (10): ANNULMENT_REASONS, money(), PAID, providerPaid(), Reason, RECONCILIATION_LABEL, Result, TreasuryService (+2 more)

### Community 27 - "ref_node_url"
Cohesion: 0.15
Nodes (10): dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile, ses (+2 more)

### Community 28 - "accounts.test.ts"
Cohesion: 0.21
Nodes (7): REDACTED_PATHS, activeAccount(), clock, lastCode(), lookup(), register(), t

### Community 29 - "PaymentGateway"
Cohesion: 0.10
Nodes (15): PaymentSessionDto, ChargeRequest, PaymentGateway, ADR-0007, ADR-0024, MOCK_TOKENS, MockPaymentGateway, ADR-0007 (+7 more)

### Community 30 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, @aws-sdk/client-sesv2@^3.1158.0, @aws-sdk/client-sqs@^3.1161.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, exceljs@^4.4.0, express@5.3.0 (+22 more)

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
Cohesion: 0.17
Nodes (14): LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017, OpenRouterProvider (+6 more)

### Community 36 - "ref_node_fs"
Cohesion: 0.11
Nodes (8): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900028', out = '.screens/cuenta'], ADR-0015, jobs, [out = '.screens', ...routes], report, widths

### Community 38 - "ExamService"
Cohesion: 0.12
Nodes (10): AttendanceService, iso(), ExamInfo, hour(), longDate(), ExamService, iso(), roomInfo() (+2 more)

### Community 40 - "env.ts"
Cohesion: 0.12
Nodes (15): application, handler, ADR-0009, Env, loadEnv(), schema, ADR-0010, ADR-0017 (+7 more)

### Community 41 - "attendance.ts"
Cohesion: 0.10
Nodes (13): AssetMap, Department, District, Province, UbigeoService, BoardExam, BoardRoom, CheckIn (+5 more)

### Community 42 - "Tx"
Cohesion: 0.10
Nodes (13): SessionMeta, SessionService, sha256(), ADR-0006, deviceLabel(), evaluateRefresh(), IDLE_LIMIT_SECONDS, RefreshDecision (+5 more)

### Community 43 - "treasury.test.ts"
Cohesion: 0.20
Nodes (7): box, clock, duplicate, paid, secrets, t, today

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
Cohesion: 0.14
Nodes (20): main(), prisma, publicDocsDir, seedCall(), seedCatalog(), seedContent(), seedExams(), seedIdentity() (+12 more)

### Community 52 - "Argon2Hasher"
Cohesion: 0.11
Nodes (13): SecretBox, Argon2Hasher, staff(), staff(), staff(), staff(), box, CHROME_WIN_NUEVO (+5 more)

### Community 53 - "usuarios/index.ts"
Cohesion: 0.10
Nodes (17): token, AccessService, AuthDeps, IdentityTokenPayload, ADR-0018, DocumentType, IdentityLookupResult, IdentityProvider (+9 more)

### Community 54 - "lambda-worker.ts"
Cohesion: 0.19
Nodes (11): application, handler(), processQueue(), SqsEvent, ADR-0012, ADR-0021, QueuedEvent, TaskName (+3 more)

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "format.ts"
Cohesion: 0.08
Nodes (17): closesIn(), dateTime(), daysUntil(), limaDay(), longDate(), soles(), ContactForm, InscriptionReceipt (+9 more)

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.16
Nodes (3): blankProgram(), blankReq(), CatalogAdminPage

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.11
Nodes (15): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+7 more)

### Community 61 - "Tx"
Cohesion: 0.35
Nodes (8): AttemptRecord, AttemptWithOrder, OrderRecord, SettleData, SettleOutcome, AttemptRow, Decimalish, OrderRow

### Community 64 - "db.ts: db.ts"
Cohesion: 0.19
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "payment-rules.ts"
Cohesion: 0.35
Nodes (3): PaymentService, formatAmount(), ProviderResult

### Community 68 - "PrismaConvocatoriasRepository"
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
Nodes (39): App, appConfig, ADR-0023, routes, ADR-0015, ADR-0018, SubmodalityDto, CallStore (+31 more)

### Community 80 - "inscription.ts"
Cohesion: 0.08
Nodes (17): apiErrorCode(), apiErrorDetails(), Draft, FIELD_TARGET, LABELS, REQUIRED_MSG, STEPS, SUBGROUPS (+9 more)

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
Nodes (21): byPriority(), FeeInfo, FeeQuote, matches(), MilitaryCondition, Modality, quoteFee(), SchoolType (+13 more)

### Community 86 - "FichaService"
Cohesion: 0.36
Nodes (3): FichaService, longDate(), shortName()

### Community 90 - "tsconfig.json: contracts/tsconfig.json"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, outDir, rootDir, sourceMap, types, extends, include (+1 more)

### Community 91 - "notifications.test.ts"
Cohesion: 0.10
Nodes (14): argon2@0.45.1, db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], totpService, box, clock, t, clock (+6 more)

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
Cohesion: 0.10
Nodes (16): FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, fixedClock(), MemoryEmailSender (+8 more)

### Community 107 - "ubigeo.ts"
Cohesion: 0.22
Nodes (7): Department, departments, District, districtIndex, districtLabel(), isValidDistrict(), Province

### Community 108 - "usuariosRoutes"
Cohesion: 0.07
Nodes (26): AuthService, sha256(), describeDevice(), StaffAuthService, StaffSession, applicantCodeFromSequence(), COMMON, EDITABLE_FIELDS (+18 more)

### Community 112 - "src/app.ts"
Cohesion: 0.05
Nodes (51): db, AppOverrides, backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012 (+43 more)

### Community 113 - "e2e-examen.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 114 - "rds.ts"
Cohesion: 0.29
Nodes (9): backendDir, caFile, check(), client(), envFile, migrate(), setup(), ADR-0009 (+1 more)

### Community 115 - "ref_vitest"
Cohesion: 0.11
Nodes (11): movableClock(), clock, secrets, t, clock, failFor, FakeQueue, handled (+3 more)

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 118 - "tools.ts"
Cohesion: 0.13
Nodes (7): AssistantTools, ESTADO_ETAPA, fecha(), STOP, terms(), ToolResult, ADR-0017

### Community 119 - "ref_vitest"
Cohesion: 0.20
Nodes (7): fakeJpeg(), register(), t, minutesAgo(), now, session(), ADR-0014

### Community 120 - "screenshots-panel.mjs"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

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
Cohesion: 0.06
Nodes (22): dateRange(), shortDate(), STAGE_STATUS_LABEL, time(), ApplicationFinder, CAMPUS, PRINCIPLES, PRIORITY (+14 more)

### Community 129 - "AssistantService"
Cohesion: 0.23
Nodes (5): AssistantService, asksForHuman(), maskPersonal(), asistenteRoutes(), meta()

### Community 130 - "ConvocatoriasRepository"
Cohesion: 0.10
Nodes (4): ConvocatoriasRepository, SubmodalityRecord, createConvocatoriasModule(), CachedConvocatoriasRepository

### Community 131 - "assistant.test.ts"
Cohesion: 0.29
Nodes (5): ai, basic, scripted, toolCall(), usage

### Community 132 - "ngsw-config.json"
Cohesion: 0.40
Nodes (4): assetGroups, index, navigationUrls, $schema

### Community 133 - "results.ts"
Cohesion: 0.25
Nodes (7): Batch, ExamResults, Issue, STATUS, TAG, VersionDetail, VersionSummary

### Community 136 - "validationError"
Cohesion: 0.09
Nodes (25): FORMATS, Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus (+17 more)

### Community 137 - "resultados/presentation/routes.ts"
Cohesion: 0.25
Nodes (7): applicant, Column, COVERAGE_COLUMNS, meta(), RESULT_COLUMNS, send(), ADR-0020

### Community 138 - "server.ts"
Cohesion: 0.11
Nodes (19): application, background(), env, server, ticker, timer, warm(), warmer (+11 more)

### Community 141 - "InscriptionStatus"
Cohesion: 0.29
Nodes (4): ApplicationFilter, InscriptionSummary, InscriptionStatus, where()

### Community 142 - "e2e-resultados.mjs"
Cohesion: 0.24
Nodes (7): admin, base32Decode(), comision, errors, health, login(), totp()

### Community 143 - "application/usability-survey.ts"
Cohesion: 0.17
Nodes (10): SurveyAlreadyAnsweredError, SurveyRecord, SurveyRepository, UsabilitySurveyService, isValidSusAnswers(), SUS_STATEMENTS, SUS_TARGET, susGrade() (+2 more)

### Community 144 - "convocatorias-queries.ts"
Cohesion: 0.14
Nodes (12): stages, shortDate(), EnrollmentStatsProvider, nextMilestone(), Stage, StageKind, StageScope, stagesInProgress() (+4 more)

### Community 145 - "ref_node_path"
Cohesion: 0.09
Nodes (12): files, root, s3, TYPES, apply, db, db, [email, file = '.admin-inicial.txt'] (+4 more)

### Community 147 - "optimizar-imagenes.mjs"
Cohesion: 0.12
Nodes (13): sharp@^0.35.5, sharp, left, out, require, root, sharp, top (+5 more)

### Community 148 - "assistant-rules.ts"
Cohesion: 0.33
Nodes (5): LIMITS, NO_INFO_REPLY, SUGGESTIONS, SYSTEM_PROMPT, ADR-0017

### Community 153 - "s3.test.ts"
Cohesion: 0.40
Nodes (4): @aws-sdk/client-s3@^3.1158.0, client, storage, @aws-sdk/client-s3

### Community 154 - "openapi.test.ts"
Cohesion: 0.40
Nodes (4): backend, doc, src, walk()

### Community 155 - "expedientes/index.ts"
Cohesion: 0.20
Nodes (7): checkDocument(), CheckedFile, MAX_DOCUMENT_BYTES, EVIDENCE, EvidenceInput, SupportCases, nextCounterValue()

### Community 156 - "AdminDeps"
Cohesion: 0.23
Nodes (4): AdminDeps, VacancyImport, ApplicationDocuments, Column

### Community 164 - "inscription-service.ts"
Cohesion: 0.11
Nodes (11): s3, NO_REINSCRIPTION, PaymentContext, ADR-0015, ADR-0017, jpegSize(), PresignedUpload, ADR-0010 (+3 more)

## Knowledge Gaps
- **129 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+124 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1347 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `apiErrorMessage` to `api.service.ts`, `Sesión del panel (frontend)`, `dossiers.ts`, `@angular/core`, `results.ts`, `SystemAdminPage`, `VenuesAdminPage`, `CasesAdminPage`, `SecurityPage`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `attendance.ts`, `InscriptionsAdminPage`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `format.ts`, `portal admin: blankProgram()`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `OnlinePayment`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `@angular/core`, `inscription.ts`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `KnowledgeAdminPage`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `DisqualifiedAdminPage`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _129 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03908316191595651 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `RequestMeta` to `AssistantService`, `admin-routes.ts`, `NotificationService`, `validationError`, `exam-service.ts`, `resultados/presentation/routes.ts`, `Db`, `results-service.ts`, `inscription-service.ts`, `application/usability-survey.ts`, `Outbox`, `seguridad/index.ts`, `handle`, `SiteAssets`, `payment-service.ts`, `admin-routes.ts`, `treasuryRoutes`, `AdminDeps`, `inscription-service.ts`, `ExamService`, `dossier-service.ts`, `usuarios/index.ts`, `CallAdmin`, `payment-rules.ts`, `FichaService`, `StaffAdmin`, `usuariosRoutes`, `src/app.ts`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.028314028314028315 - nodes in this community are weakly interconnected._
- **Why does `@angular/core` connect `Sesión del panel (frontend)` to `api.service.ts`, `@angular/core`, `dossiers.ts`, `results.ts`, `apiErrorMessage`, `attendance.ts`, `frontend/package.json`, `@angular/core`, `inscription.ts`, `DailyChart`, `format.ts`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Should `dossiers.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09269162210338681 - nodes in this community are weakly interconnected._