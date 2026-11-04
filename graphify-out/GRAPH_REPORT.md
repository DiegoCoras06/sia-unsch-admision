# Graph Report - proyectofinal  (2026-11-03)

## Corpus Check
- 284 files · ~190,856 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .scss 5, (none) 4, .example 2)

## Summary
- 2958 nodes · 7184 edges · 143 communities (105 shown, 38 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 224 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3176506d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- @angular/core
- Composición del backend y asistente
- NotificationService
- usuarios/index.ts
- Páginas del panel y errores
- Cliente API del portal
- Asistencia y PDF de examen
- seguridad/index.ts
- Contenido del portal (admin)
- Servicio de asistencia
- @angular/router
- Configuración de Angular
- InscriptionService
- inscription-service.ts
- Carga directa a S3
- lambda-worker.ts
- scripts
- Dependencias de desarrollo backend
- Servicio de expedientes
- middleware.ts
- dossier-service.ts
- Revisión de resultados
- inscription.ts
- Rutas del panel (backend)
- Pasarela micuentaweb
- rds.ts
- Personal y scripts de acceso
- Puertos de pago y Yape
- format.ts
- Exámenes (panel)
- Formulario de inscripción
- dependencies
- src/app.ts
- Proveedor de IA (asistente)
- Pruebas E2E con Playwright
- .register
- ProviderResult
- Convocatoria (panel)
- payment-service.ts
- admin.test.ts: movableClock()
- seguridad: .getStats()
- ref_node_path
- asistente: AssistantService
- asistente: tools.ts
- package.json: scripts
- devDependencies
- ci.yml
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- SiteAssets
- convocatorias: .getOption()
- convocatorias: .listFees()
- InscriptionsAdminPage
- portal admin: ResultsAdminPage
- tsconfig.base.json: tsconfig.base.json
- accounts.test.ts: synthetic-identities.t
- portal admin: blankProgram()
- call-2027-I.ts: call-2027-I.ts
- convocatorias: stages
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
- micuentaweb.ts
- convocatorias: .quoteFee()
- support-cases.ts
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
- admin-shell.ts
- portal admin: AdmissionsAdminPage
- portal cuenta: AccountLoginPage
- site-header.ts: SiteHeader
- NoticeSources
- e2e-expediente.mjs: e2e-expediente.mjs
- e2e-inscripcion.mjs: e2e-inscripcion.mjs
- CasesAdminPage
- content.ts: seed/content.ts
- resultados/presentation/routes.ts
- assistant-rules.ts
- treasury.ts
- portal admin: DisqualifiedAdminPage
- scripts
- SiteImages
- izipay-gateway.ts
- exams.ts: seed/exams.ts
- identity.ts: identity.ts
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- portal public: HomePage
- portal public: SyllabusPage
- ApplicationDocuments
- InboxPanel
- e2e-examen.mjs
- yape.test.ts
- AdminDeps
- e2e-cuenta.mjs
- LocalFileStorage
- fee-calculator.test.ts
- RequirementsPage
- cookie-parser
- exceljs
- jose
- @prisma/adapter-pg

## God Nodes (most connected - your core abstractions)
1. `RequestMeta` - 152 edges
2. `apiErrorMessage()` - 103 edges
3. `notFound()` - 101 edges
4. `Db` - 85 edges
5. `ApiService` - 85 edges
6. `@angular/core` - 76 edges
7. `validationError()` - 65 edges
8. `businessRule()` - 64 edges
9. `Clock` - 62 edges
10. `AuditLog` - 60 edges

## Surprising Connections (you probably didn't know these)
- `Row` --references--> `DossierDto`  [EXTRACTED]
  apps/frontend/src/app/features/admin/pages/dossiers.ts → packages/contracts/src/index.ts
- `createApplication()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  apps/backend/src/app.ts → apps/backend/src/shared/http/middleware.ts
- `createSeguridadModule()` --indirect_call--> `authorize()`  [INFERRED]
  apps/backend/src/modules/seguridad/index.ts → apps/backend/src/modules/seguridad/presentation/auth-middleware.ts
- `seedStaff()` --calls--> `temporaryPassword()`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/application/staff-admin.ts
- `seedStaff()` --calls--> `Argon2Hasher`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/infrastructure/argon2-hasher.ts

## Import Cycles
- None detected.

## Communities (143 total, 38 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.04
Nodes (66): ApiHttpError, SubmodalityDto, ADR-0010, ADR-0015, ADR-0016, ADR-0017, ADR-0019, CallStore (+58 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.03
Nodes (57): AdminSession, CLIENT, Query, StaffMe, StaffStep, ADR-0018, shortDateTime(), STEP_LABEL (+49 more)

### Community 2 - "@angular/core"
Cohesion: 0.06
Nodes (25): ADR-0015, ADR-0018, ExamRoomDto, FichaVerification, docBySlug(), OFFICIAL_DOCS, OfficialDoc, LEAD (+17 more)

### Community 3 - "Composición del backend y asistente"
Cohesion: 0.07
Nodes (43): ToolDeps, ADR-0017, DEFAULT_PARAMETERS, SITE_SLOTS, SiteSlot, TYPES, FORMATS, ConvocatoriasQueries (+35 more)

### Community 4 - "NotificationService"
Cohesion: 0.18
Nodes (7): day(), hour(), NotificationService, escape(), fill(), meta(), notificacionesRoutes()

### Community 5 - "usuarios/index.ts"
Cohesion: 0.05
Nodes (49): token, AuthService, IdentityTokenPayload, sha256(), ADR-0018, ACTIONS, describeDevice(), ProfileService (+41 more)

### Community 6 - "Páginas del panel y errores"
Cohesion: 0.04
Nodes (15): AdmittedListDto, apiErrorMessage(), MyResultDto, AuditAdminPage, PaymentsAdminPage, FindRoomPage, DossierPanel, MyInscriptionPage (+7 more)

### Community 8 - "Asistencia y PDF de examen"
Cohesion: 0.07
Nodes (44): attendancePdf(), eligibleListPdf(), ESCUDO, ExamInfo, examSlipPdf(), footer(), header(), hour() (+36 more)

### Community 9 - "seguridad/index.ts"
Cohesion: 0.06
Nodes (36): AccessService, ALL, byRole, hasPermission(), Permission, PERMISSIONS, permissionsOf(), STAFF_ROLES (+28 more)

### Community 10 - "Contenido del portal (admin)"
Cohesion: 0.08
Nodes (8): ContentAdmin, sniff(), CallAdmin, iso(), CatalogAdmin, SecurityAdmin, RequestMeta, notFound()

### Community 11 - "Servicio de asistencia"
Cohesion: 0.12
Nodes (7): AttendanceService, iso(), ExamService, iso(), roomInfo(), createExamenesModule(), examenesRoutes()

### Community 12 - "@angular/router"
Cohesion: 0.06
Nodes (36): dependencies, @angular/common@22.2.3, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, rxjs@7.8.2 (+28 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (42): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+34 more)

### Community 14 - "InscriptionService"
Cohesion: 0.16
Nodes (4): InscriptionService, OrdenPagoService, maskDocument(), createInscripcionesModule()

### Community 15 - "inscription-service.ts"
Cohesion: 0.22
Nodes (15): InscriptionInput, InscriptionSummary, NO_REINSCRIPTION, ADR-0015, ADR-0017, CAMPUSES, ECONOMIC_DEPENDENCY, InscriptionStatus (+7 more)

### Community 16 - "Carga directa a S3"
Cohesion: 0.12
Nodes (18): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, Row (+10 more)

### Community 17 - "lambda-worker.ts"
Cohesion: 0.10
Nodes (20): application, handler(), processQueue(), SqsEvent, ADR-0012, ADR-0021, application, env (+12 more)

### Community 18 - "scripts"
Cohesion: 0.05
Nodes (38): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+30 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.08
Nodes (33): devDependencies, concurrently@10.0.6, esbuild@0.28.2, pino-pretty@13.2.0, prisma@7.10.1, supertest@7.3.1, tsx@4.23.15, @types/cookie-parser@1.4.10 (+25 more)

### Community 20 - "Servicio de expedientes"
Cohesion: 0.18
Nodes (6): DossierService, iso(), latest(), expedientesRoutes(), meta(), sendFile()

### Community 21 - "middleware.ts"
Cohesion: 0.11
Nodes (30): ADR-0017, booleanish, callCode, callParams, convocatoriasRoutes(), feeQuoteQuery, optionsQuery, applicant (+22 more)

### Community 22 - "dossier-service.ts"
Cohesion: 0.14
Nodes (14): Doc, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus, OBSERVE_HOURS, REJECTION_HINT (+6 more)

### Community 23 - "Revisión de resultados"
Cohesion: 0.09
Nodes (21): MODALITY_LABEL, ResultPerson, ResultsPorts, Answers, computeScore(), Condition, CONDITION_LABEL, Contender (+13 more)

### Community 24 - "inscription.ts"
Cohesion: 0.06
Nodes (21): CLIENT, ADR-0015, apiErrorCode(), apiErrorDetails(), Department, District, Province, UbigeoService (+13 more)

### Community 25 - "Rutas del panel (backend)"
Cohesion: 0.13
Nodes (19): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+11 more)

### Community 26 - "Pasarela micuentaweb"
Cohesion: 0.16
Nodes (12): PaymentSessionDto, CheckoutSession, SignedMessage, isValidHex(), KrAnswer, KrTransaction, MiCuentaWebConfig, MiCuentaWebGateway (+4 more)

### Community 27 - "rds.ts"
Cohesion: 0.29
Nodes (9): backendDir, caFile, check(), client(), envFile, migrate(), setup(), ADR-0009 (+1 more)

### Community 28 - "Personal y scripts de acceso"
Cohesion: 0.09
Nodes (20): argon2@0.45.1, db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], db, [email, file = '.admin-inicial.txt'], totpService, Argon2Hasher, staff() (+12 more)

### Community 29 - "Puertos de pago y Yape"
Cohesion: 0.18
Nodes (9): YapeChargeRequest, CulqiCharge, CulqiConfig, CulqiYapeGateway, parseCulqiCharge(), ADR-0019, FakeYape, gw (+1 more)

### Community 30 - "format.ts"
Cohesion: 0.05
Nodes (29): InboxDto, ReinscriptionCheck, dateRange(), dateTime(), longDate(), shortDate(), soles(), STAGE_STATUS_LABEL (+21 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, @aws-sdk/client-s3@^3.1158.0, @aws-sdk/client-sesv2@^3.1158.0, @aws-sdk/client-sqs@^3.1161.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, express@5.3.0 (+17 more)

### Community 34 - "src/app.ts"
Cohesion: 0.05
Nodes (51): db, backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012, ADR-0019 (+43 more)

### Community 35 - "Proveedor de IA (asistente)"
Cohesion: 0.13
Nodes (19): LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017, OpenRouterProvider (+11 more)

### Community 36 - "Pruebas E2E con Playwright"
Cohesion: 0.09
Nodes (13): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900050', email = 'e2e.micuentaweb@example.com', card = '4970100000000055', out = '.screens/pago-sandbox'], jobs, [out = '.screens', ...routes], base32Decode(), health, [out = '.screens/panel-ui', ...routes] (+5 more)

### Community 37 - ".register"
Cohesion: 0.17
Nodes (6): longDate(), shortDate(), initialStatus(), isPlausibleGraduationYear(), nextCounterValue(), jpegSize()

### Community 38 - "ProviderResult"
Cohesion: 0.12
Nodes (13): ProviderResult, CheckoutRequest, PaymentGateway, ADR-0007, ADR-0016, ADR-0019, MockPaymentGateway, ADR-0007 (+5 more)

### Community 39 - "Convocatoria (panel)"
Cohesion: 0.12
Nodes (12): Awardee, Awardees, CallAdminPage, CallDetail, Fee, fromLima(), ImportPreview, ImportRow (+4 more)

### Community 40 - "payment-service.ts"
Cohesion: 0.22
Nodes (12): AppOverrides, PaymentContext, Attempt, AttemptResultDto, PaymentStatusDto, ADR-0016, ADR-0019, Via (+4 more)

### Community 41 - "admin.test.ts: movableClock()"
Cohesion: 0.06
Nodes (19): fixedClock(), MemoryEmailSender, MemoryFileStorage, checkDigit, movableClock(), TEST_URL, testApp(), t (+11 more)

### Community 42 - "seguridad: .getStats()"
Cohesion: 0.14
Nodes (6): SessionMeta, SessionService, sha256(), ADR-0006, SESSION_TTL, RateLimiter

### Community 43 - "ref_node_path"
Cohesion: 0.10
Nodes (15): dotenv@18.0.9, pdfkit@^0.20.2, api, backendDir, envFile, ADR-0019, backendDir, envFile (+7 more)

### Community 44 - "asistente: AssistantService"
Cohesion: 0.22
Nodes (4): AssistantService, createAsistenteModule(), asistenteRoutes(), meta()

### Community 45 - "asistente: tools.ts"
Cohesion: 0.13
Nodes (7): AssistantTools, ESTADO_ETAPA, fecha(), STOP, terms(), ToolResult, ADR-0017

### Community 46 - "package.json: scripts"
Cohesion: 0.10
Nodes (21): scripts, apiperu:check, build, culqi:check, db:reset, db:setup, db:start, db:stop (+13 more)

### Community 47 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @angular/build@22.2.4, @angular/cli@22.2.4, @angular/compiler-cli@22.2.3, jsdom@30.0.0, typescript@6.0.3, vitest@5.0.5, typescript (+5 more)

### Community 48 - "ci.yml"
Cohesion: 0.08
Nodes (28): name, runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, name (+20 more)

### Community 50 - "portal admin: AttendanceAdminPage"
Cohesion: 0.20
Nodes (3): AttendanceAdminPage, isOffline(), writeQueue()

### Community 51 - "index.ts: seed/index.ts"
Cohesion: 0.18
Nodes (16): main(), prisma, publicDocsDir, seedCall(), seedCatalog(), seedContent(), seedExams(), seedIdentity() (+8 more)

### Community 52 - "SiteAssets"
Cohesion: 0.26
Nodes (6): ConfiguracionQueries, SiteAssets, createConfiguracionModule(), announcementsQuery, configuracionRoutes(), publicCache()

### Community 53 - "convocatorias: .getOption()"
Cohesion: 0.13
Nodes (5): CallSummary, ConvocatoriasRepository, SubmodalityRecord, AreaDto, OfficialDocumentDto

### Community 54 - "convocatorias: .listFees()"
Cohesion: 0.17
Nodes (11): byPriority(), FeeInfo, FeeQuote, matches(), MilitaryCondition, Modality, quoteFee(), SchoolType (+3 more)

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "accounts.test.ts: synthetic-identities.t"
Cohesion: 0.13
Nodes (14): ADR-0007, FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, REDACTED_PATHS (+6 more)

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.16
Nodes (3): blankProgram(), blankReq(), CatalogAdminPage

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.11
Nodes (16): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+8 more)

### Community 61 - "convocatorias: stages"
Cohesion: 0.14
Nodes (12): shortDate(), nextMilestone(), Stage, StageKind, StageScope, stagesInProgress(), StageStatus, stageStatus() (+4 more)

### Community 64 - "db.ts: db.ts"
Cohesion: 0.11
Nodes (18): embedded-postgres@16.14.0-beta.17, backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed() (+10 more)

### Community 65 - "pagos: PaymentService"
Cohesion: 0.27
Nodes (5): PaymentService, formatAmount(), createPagosModule(), meta(), pagosRoutes()

### Community 66 - "portal pago: loadScript()"
Cohesion: 0.18
Nodes (4): KrClient, loadScript(), OnlinePayment, PaymentSessionDto

### Community 67 - "s3-file-storage.ts: s3-check.ts"
Cohesion: 0.11
Nodes (8): s3, files, root, s3, TYPES, S3FileStorage, client, storage

### Community 68 - "convocatorias: PrismaConvocatoriasReposi"
Cohesion: 0.13
Nodes (3): PrismaConvocatoriasRepository, toFee(), fees

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
Cohesion: 0.20
Nodes (4): iso(), ResultsService, resultadosRoutes(), businessRule()

### Community 74 - "exams.test.ts: exams.test.ts"
Cohesion: 0.16
Nodes (10): box, clock, codes, DNIS, fakeJpeg(), jump(), registerOrd(), secrets (+2 more)

### Community 78 - "portal cuenta: MyAccountPage"
Cohesion: 0.16
Nodes (4): MyAccountPage, base32Decode(), text, totp()

### Community 79 - "payment-rules.ts"
Cohesion: 0.17
Nodes (11): backendDir, envFile, gw, missing, ADR-0016, ATTEMPT_LABEL, ATTEMPT_TTL_SECONDS, newTransactionId() (+3 more)

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
Cohesion: 0.29
Nodes (6): money(), providerPaid(), TreasuryService, createTesoreria(), meta(), treasuryRoutes()

### Community 85 - "micuentaweb.ts"
Cohesion: 0.14
Nodes (11): backendDir, envFile, gw, hmacKey, keys, missing, password, publicKey (+3 more)

### Community 86 - "convocatorias: .quoteFee()"
Cohesion: 0.20
Nodes (7): DocumentRecord, EnrollmentStatsProvider, OptionRecord, QuotaCategoryRecord, RequirementRecord, SyllabusRecord, ADR-0002

### Community 87 - "support-cases.ts"
Cohesion: 0.12
Nodes (10): Application, checkDocument(), CheckedFile, MAX_DOCUMENT_BYTES, EVIDENCE, EvidenceInput, SupportCases, createSeguridadModule() (+2 more)

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

### Community 108 - "admin-shell.ts"
Cohesion: 0.25
Nodes (4): AdminShell, NAV, NavItem, ROLE_NAMES

### Community 113 - "e2e-expediente.mjs: e2e-expediente.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 114 - "e2e-inscripcion.mjs: e2e-inscripcion.mjs"
Cohesion: 0.29
Nodes (4): errors, ADR-0015, photo, width

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 117 - "resultados/presentation/routes.ts"
Cohesion: 0.25
Nodes (7): applicant, Column, COVERAGE_COLUMNS, meta(), RESULT_COLUMNS, send(), ADR-0020

### Community 118 - "assistant-rules.ts"
Cohesion: 0.29
Nodes (9): AssistantReply, ADR-0017, asksForHuman(), LIMITS, maskPersonal(), NO_INFO_REPLY, SUGGESTIONS, SYSTEM_PROMPT (+1 more)

### Community 119 - "treasury.ts"
Cohesion: 0.29
Nodes (6): Annulment, Item, RESULTS, Run, RunDetail, Summary

### Community 121 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, ng, start, test, watch

### Community 123 - "izipay-gateway.ts"
Cohesion: 0.15
Nodes (12): orderNumberFor(), API, IzipayConfig, IzipayPaymentGateway, SDK, isValidSignature(), parseIzipayPayload(), sha256Hex() (+4 more)

### Community 124 - "exams.ts: seed/exams.ts"
Cohesion: 0.40
Nodes (4): BUILDINGS, exams, rooms, venue

### Community 125 - "identity.ts: identity.ts"
Cohesion: 0.40
Nodes (4): consentDocument, disqualifiedPersons, permissions, roles

### Community 130 - "ApplicationDocuments"
Cohesion: 0.23
Nodes (4): ApplicationDocuments, stamp(), inscripcionesRoutes(), meta()

### Community 132 - "e2e-examen.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 133 - "yape.test.ts"
Cohesion: 0.33
Nodes (4): fakeJpeg(), register(), t, yape

### Community 134 - "AdminDeps"
Cohesion: 0.25
Nodes (4): AdminDeps, KnowledgeAdmin, VacancyImport, CepreAwardees

### Community 137 - "fee-calculator.test.ts"
Cohesion: 0.15
Nodes (12): FeeCriteria, FeeRule, SurchargeRule, base, CEPRE_EXTEMP, CEPRE_REGULAR, EXO_EXTEMP, ORD_EXTEMP (+4 more)

## Knowledge Gaps
- **126 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+121 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1174 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `Páginas del panel y errores` to `api.service.ts`, `Sesión del panel (frontend)`, `@angular/core`, `InboxPanel`, `@angular/router`, `Carga directa a S3`, `inscription.ts`, `format.ts`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `portal admin: AttendanceAdminPage`, `InscriptionsAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `portal pago: loadScript()`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `portal admin: KnowledgeAdminPage`, `portal admin: results.ts`, `portal admin: SystemAdminPage`, `portal admin: Component`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `CasesAdminPage`, `treasury.ts`, `portal admin: DisqualifiedAdminPage`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _126 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0438871473354232 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `Contenido del portal (admin)` to `ApplicationDocuments`, `Composición del backend y asistente`, `NotificationService`, `usuarios/index.ts`, `AdminDeps`, `Asistencia y PDF de examen`, `seguridad/index.ts`, `Servicio de asistencia`, `InscriptionService`, `inscription-service.ts`, `Servicio de expedientes`, `middleware.ts`, `dossier-service.ts`, `Revisión de resultados`, `Rutas del panel (backend)`, `src/app.ts`, `.register`, `payment-service.ts`, `asistente: AssistantService`, `SiteAssets`, `pagos: PaymentService`, `businessRule`, `FichaService`, `pagos: money()`, `StaffAdmin`, `resultados/presentation/routes.ts`, `assistant-rules.ts`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.03381858902575588 - nodes in this community are weakly interconnected._
- **Why does `ApiService` connect `Cliente API del portal` to `api.service.ts`, `Sesión del panel (frontend)`, `@angular/core`, `@angular/router`, `Carga directa a S3`, `inscription.ts`, `format.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `@angular/core` be split into smaller, more focused modules?**
  _Cohesion score 0.05639097744360902 - nodes in this community are weakly interconnected._