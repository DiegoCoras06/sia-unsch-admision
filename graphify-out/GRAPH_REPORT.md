# Graph Report - proyectofinal  (2026-11-04)

## Corpus Check
- 296 files · ~198,394 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .scss 5, (none) 4, .woff 4)

## Summary
- 3107 nodes · 7511 edges · 150 communities (116 shown, 34 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 229 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f63117e9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- @angular/core
- ubigeo.service.ts
- NotificationService
- usuariosRoutes
- Páginas del panel y errores
- Cliente API del portal
- exam-service.ts
- seguridad/index.ts
- Contenido del portal (admin)
- Servicio de asistencia
- frontend/package.json
- Configuración de Angular
- InscriptionService
- inscription-service.ts
- dossier-panel.ts
- lambda-worker.ts
- package.json
- Dependencias de desarrollo backend
- Servicio de expedientes
- middleware.ts
- Db
- Revisión de resultados
- format.ts
- Rutas del panel (backend)
- micuentaweb.ts
- rds.ts
- treasury.test.ts
- pagos/index.ts
- dependencies
- Exámenes (panel)
- Formulario de inscripción
- validationError
- src/app.ts
- assistant-service.ts
- Pruebas E2E con Playwright
- ConvocatoriasRepository
- ficha-service.ts
- Convocatoria (panel)
- env.ts
- admin.test.ts: movableClock()
- .now
- ref_node_path
- AssistantService
- support-cases.ts
- package.json: scripts
- updates
- ci.yml
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- Argon2Hasher
- usuarios/index.ts
- convocatorias: .listFees()
- izipay-gateway.ts
- portal admin: ResultsAdminPage
- tsconfig.base.json: tsconfig.base.json
- yape.test.ts
- portal admin: blankProgram()
- call-2027-I.ts: call-2027-I.ts
- admin-login.ts
- portal admin: DossiersAdminPage
- portal admin: NotificationsAdminPage
- db.ts: db.ts
- pagos: PaymentService
- online-payment.ts
- s3-file-storage.ts: s3-check.ts
- convocatorias: PrismaConvocatoriasReposi
- account-session.ts
- results.test.ts: results.test.ts
- assistant.ts: Assistant
- package.json: contracts/package.json
- businessRule
- exams.test.ts: exams.test.ts
- portal admin: ContentAdminPage
- portal admin: TreasuryAdminPage
- portal admin: Component
- portal cuenta: MyAccountPage
- StaffAuthService
- examenes/presentation/routes.ts
- seguridad: totp.ts
- dossier.test.ts: dossier.test.ts
- pending-features.test.ts: pending-featur
- pagos: money()
- e2e-examen.mjs
- convocatorias: .quoteFee()
- e2e-inscripcion.mjs
- exam-pdf.ts
- portal admin: AdminLoginPage
- tsconfig.json: contracts/tsconfig.json
- e2e-resultados.mjs: e2e-resultados.mjs
- trazabilidad.mjs: trazabilidad.mjs
- catalog.ts: seed/catalog.ts
- ReportQueries
- ubigeo.ts: .paymentContext()
- portal admin: DashboardPage
- portal admin: KnowledgeAdminPage
- stage.ts
- portal admin: SystemAdminPage
- StaffAdmin
- payments.test.ts: payments.test.ts
- tsconfig.json: backend/tsconfig.json
- ref_vitest
- portal admin: Component
- portal cuenta: CreateAccountPage
- portal public: ComplaintsPage
- event-queue.test.ts
- payment-rules.ts
- portal admin: AdmissionsAdminPage
- portal cuenta: AccountLoginPage
- site-header.ts: SiteHeader
- NoticeSources
- e2e-expediente.mjs: e2e-expediente.mjs
- scripts
- CasesAdminPage
- content.ts: seed/content.ts
- resultados/presentation/routes.ts
- FichaService
- staff-recovery.test.ts
- portal admin: DisqualifiedAdminPage
- DailyChart
- attendance.ts
- izipay-gateway.ts
- exams.ts: seed/exams.ts
- identity.ts: identity.ts
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- format.ts
- portal public: SyllabusPage
- session-policy.ts
- @angular/forms
- ngsw-config.json
- screenshots-panel.mjs
- allowScripts
- accounts.test.ts
- results.ts
- fee-calculator.test.ts
- AdminShell
- global-setup.ts
- VacancyImport
- SecurityPage
- treasury.ts
- pages/catalog.ts
- SiteAssets
- .getStats
- LocalFileStorage
- e2e-panel.mjs
- e2e-cuenta.mjs
- IzipayPaymentGateway

## God Nodes (most connected - your core abstractions)
1. `RequestMeta` - 156 edges
2. `apiErrorMessage()` - 109 edges
3. `notFound()` - 101 edges
4. `Db` - 85 edges
5. `ApiService` - 85 edges
6. `@angular/core` - 82 edges
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
- `createReportesModule()` --indirect_call--> `toPdf()`  [INFERRED]
  apps/backend/src/modules/reportes/index.ts → apps/backend/src/modules/reportes/infrastructure/exporters.ts
- `createSeguridadModule()` --indirect_call--> `authorize()`  [INFERRED]
  apps/backend/src/modules/seguridad/index.ts → apps/backend/src/modules/seguridad/presentation/auth-middleware.ts

## Import Cycles
- None detected.

## Communities (150 total, 34 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.05
Nodes (54): ApiHttpError, FichaVerification, ReinscriptionCheck, SubmodalityDto, ADR-0010, ADR-0015, ADR-0016, ADR-0017 (+46 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.04
Nodes (52): AdminSession, CLIENT, Query, StaffMe, ADR-0018, ADR-0022, shortDateTime(), adminRoutes (+44 more)

### Community 2 - "@angular/core"
Cohesion: 0.05
Nodes (27): App, appConfig, ADR-0023, routes, ADR-0015, ADR-0018, docBySlug(), OFFICIAL_DOCS (+19 more)

### Community 3 - "ubigeo.service.ts"
Cohesion: 0.17
Nodes (5): Department, District, Province, UbigeoService, UbigeoSelect

### Community 4 - "NotificationService"
Cohesion: 0.18
Nodes (7): day(), hour(), NotificationService, escape(), fill(), meta(), notificacionesRoutes()

### Community 5 - "usuariosRoutes"
Cohesion: 0.18
Nodes (7): AuthService, sha256(), StaffSession, normalizeEmail(), passwordIssues(), usuariosRoutes(), TokenDto

### Community 6 - "Páginas del panel y errores"
Cohesion: 0.05
Nodes (14): apiErrorMessage(), ExamRoomDto, AuditAdminPage, InscriptionsAdminPage, PaymentsAdminPage, FindRoomPage, MyInscriptionPage, ReinscriptionPage (+6 more)

### Community 8 - "exam-service.ts"
Cohesion: 0.10
Nodes (24): ExamInfo, RoomInfo, ExamInput, ExamInscriptions, ExamPerson, ExamRow, ExamStructure, MODALITY_LABEL (+16 more)

### Community 9 - "seguridad/index.ts"
Cohesion: 0.05
Nodes (51): db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], db, [email, file = '.admin-inicial.txt'], db, SessionMeta, ADR-0006, ALL (+43 more)

### Community 10 - "Contenido del portal (admin)"
Cohesion: 0.09
Nodes (10): ContentAdmin, sniff(), CallAdmin, iso(), CatalogAdmin, SecurityAdmin, RequestMeta, conflict() (+2 more)

### Community 11 - "Servicio de asistencia"
Cohesion: 0.11
Nodes (9): AttendanceService, iso(), ExamService, iso(), roomInfo(), roomOrder(), codeFromScan(), IncidentType (+1 more)

### Community 12 - "frontend/package.json"
Cohesion: 0.05
Nodes (44): dependencies, @angular/common@22.2.3, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, @angular/service-worker@22.2.3 (+36 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (43): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+35 more)

### Community 14 - "InscriptionService"
Cohesion: 0.08
Nodes (10): AdminDeps, ApplicationDocuments, CepreAwardees, InscriptionService, longDate(), maskDocument(), createInscripcionesModule(), inscripcionesRoutes() (+2 more)

### Community 15 - "inscription-service.ts"
Cohesion: 0.17
Nodes (19): InscriptionInput, InscriptionSummary, NO_REINSCRIPTION, PaymentContext, shortDate(), ADR-0015, ADR-0017, CAMPUSES (+11 more)

### Community 16 - "dossier-panel.ts"
Cohesion: 0.09
Nodes (17): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, Row (+9 more)

### Community 17 - "lambda-worker.ts"
Cohesion: 0.10
Nodes (19): application, handler(), processQueue(), SqsEvent, ADR-0012, ADR-0021, application, env (+11 more)

### Community 18 - "package.json"
Cohesion: 0.15
Nodes (14): description, devDependencies, concurrently@10.0.6, playwright-core@1.64.1, typescript@6.0.3, engines, node, concurrently (+6 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.08
Nodes (33): devDependencies, concurrently@10.0.6, esbuild@0.28.2, pino-pretty@13.2.0, prisma@7.10.1, supertest@7.3.1, tsx@4.23.15, @types/cookie-parser@1.4.10 (+25 more)

### Community 20 - "Servicio de expedientes"
Cohesion: 0.19
Nodes (6): DossierService, iso(), latest(), expedientesRoutes(), meta(), sendFile()

### Community 21 - "middleware.ts"
Cohesion: 0.13
Nodes (26): asistenteRoutes(), meta(), ADR-0017, announcementsQuery, applicant, ADR-0010, ADR-0018, inscriptionSchema (+18 more)

### Community 22 - "Db"
Cohesion: 0.08
Nodes (28): KnowledgeAdmin, ToolDeps, createAsistenteModule(), ADR-0017, ConfiguracionQueries, DEFAULT_PARAMETERS, SITE_SLOTS, SiteSlot (+20 more)

### Community 23 - "Revisión de resultados"
Cohesion: 0.09
Nodes (21): MODALITY_LABEL, ResultPerson, ResultsPorts, Answers, computeScore(), Condition, CONDITION_LABEL, Contender (+13 more)

### Community 24 - "format.ts"
Cohesion: 0.06
Nodes (31): apiErrorCode(), apiErrorDetails(), CallStore, KEY_STAGES, AREA_NAMES, dateRange(), dateTime(), longDate() (+23 more)

### Community 25 - "Rutas del panel (backend)"
Cohesion: 0.13
Nodes (17): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+9 more)

### Community 26 - "micuentaweb.ts"
Cohesion: 0.09
Nodes (20): backendDir, envFile, gw, hmacKey, keys, missing, password, publicKey (+12 more)

### Community 27 - "rds.ts"
Cohesion: 0.23
Nodes (11): pg@8.23.1, backendDir, caFile, check(), client(), envFile, migrate(), setup() (+3 more)

### Community 28 - "treasury.test.ts"
Cohesion: 0.20
Nodes (7): box, clock, duplicate, paid, secrets, t, today

### Community 29 - "pagos/index.ts"
Cohesion: 0.16
Nodes (11): YapeSessionDto, YapeChargeRequest, YapeGateway, CulqiCharge, CulqiConfig, CulqiYapeGateway, parseCulqiCharge(), ADR-0019 (+3 more)

### Community 30 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, argon2@0.45.1, @aws-sdk/client-sqs@^3.1161.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, cookie-parser@1.4.7, exceljs@^4.4.0 (+22 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "validationError"
Cohesion: 0.10
Nodes (22): Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus, OBSERVE_HOURS (+14 more)

### Community 34 - "src/app.ts"
Cohesion: 0.05
Nodes (54): AppOverrides, backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012, ADR-0019 (+46 more)

### Community 35 - "assistant-service.ts"
Cohesion: 0.06
Nodes (35): AssistantReply, ADR-0017, AssistantTools, ESTADO_ETAPA, fecha(), STOP, terms(), ToolResult (+27 more)

### Community 36 - "Pruebas E2E con Playwright"
Cohesion: 0.12
Nodes (7): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900050', email = 'e2e.micuentaweb@example.com', card = '4970100000000055', out = '.screens/pago-sandbox'], jobs, [out = '.screens', ...routes], report, widths

### Community 37 - "ConvocatoriasRepository"
Cohesion: 0.14
Nodes (5): CallSummary, ConvocatoriasRepository, SubmodalityRecord, AreaDto, OfficialDocumentDto

### Community 38 - "ficha-service.ts"
Cohesion: 0.20
Nodes (21): ENTRY, toPdf(), admissionCertificatePdf(), assets, BOLD, ESCUDO, FONTS, GOLD (+13 more)

### Community 39 - "Convocatoria (panel)"
Cohesion: 0.12
Nodes (12): Awardee, Awardees, CallAdminPage, CallDetail, Fee, fromLima(), ImportPreview, ImportRow (+4 more)

### Community 40 - "env.ts"
Cohesion: 0.12
Nodes (16): application, handler, ADR-0009, Env, loadEnv(), schema, ADR-0010, ADR-0016 (+8 more)

### Community 41 - "admin.test.ts: movableClock()"
Cohesion: 0.09
Nodes (14): fixedClock(), MemoryEmailSender, MemoryFileStorage, checkDigit, movableClock(), TEST_URL, testApp(), t (+6 more)

### Community 42 - ".now"
Cohesion: 0.10
Nodes (8): Application, SessionService, sha256(), deviceLabel(), sanitize(), Tx, Outbox, tooManyRequests()

### Community 43 - "ref_node_path"
Cohesion: 0.11
Nodes (13): @aws-sdk/client-sesv2@^3.1158.0, dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile (+5 more)

### Community 45 - "support-cases.ts"
Cohesion: 0.19
Nodes (9): checkDocument(), CheckedFile, MAX_DOCUMENT_BYTES, EVIDENCE, EvidenceInput, SupportCases, createSeguridadModule(), nextCounterValue() (+1 more)

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

### Community 52 - "Argon2Hasher"
Cohesion: 0.14
Nodes (12): Argon2Hasher, staff(), staff(), staff(), staff(), box, CHROME_WIN_NUEVO, clock (+4 more)

### Community 53 - "usuarios/index.ts"
Cohesion: 0.07
Nodes (33): token, AccessService, AuthDeps, IdentityTokenPayload, ADR-0018, ACTIONS, ProfileService, applicantCodeFromSequence() (+25 more)

### Community 54 - "convocatorias: .listFees()"
Cohesion: 0.15
Nodes (11): byPriority(), FeeInfo, FeeQuote, matches(), MilitaryCondition, Modality, quoteFee(), SchoolType (+3 more)

### Community 55 - "izipay-gateway.ts"
Cohesion: 0.20
Nodes (11): orderNumberFor(), SignedMessage, API, IzipayConfig, SDK, isValidSignature(), parseIzipayPayload(), sha256Hex() (+3 more)

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "yape.test.ts"
Cohesion: 0.33
Nodes (4): fakeJpeg(), register(), t, yape

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.16
Nodes (3): blankProgram(), blankReq(), CatalogAdminPage

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.11
Nodes (16): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+8 more)

### Community 61 - "admin-login.ts"
Cohesion: 0.21
Nodes (6): StaffStep, STEP_LABEL, ADR-0018, ADR-0022, RecoveryCodes, ADR-0022

### Community 64 - "db.ts: db.ts"
Cohesion: 0.19
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "pagos: PaymentService"
Cohesion: 0.29
Nodes (4): PaymentService, formatAmount(), meta(), pagosRoutes()

### Community 66 - "online-payment.ts"
Cohesion: 0.09
Nodes (15): CulqiCtor, CulqiInstance, IzipayCheckout, IzipayCtor, IzipayResponse, KrClient, KrSubmit, loadScript() (+7 more)

### Community 67 - "s3-file-storage.ts: s3-check.ts"
Cohesion: 0.10
Nodes (10): @aws-sdk/client-s3@^3.1158.0, s3, files, root, s3, TYPES, S3FileStorage, client (+2 more)

### Community 68 - "convocatorias: PrismaConvocatoriasReposi"
Cohesion: 0.13
Nodes (3): PrismaConvocatoriasRepository, toFee(), fees

### Community 69 - "account-session.ts"
Cohesion: 0.13
Nodes (11): describeDevice(), CLIENT, ADR-0015, ADR-0015, ActiveSessions, ActivityDto, ConsentDto, IdentityLookupDto (+3 more)

### Community 70 - "results.test.ts: results.test.ts"
Cohesion: 0.14
Nodes (11): box, clock, codes, DNIS, fakeJpeg(), jump(), registerExo(), secrets (+3 more)

### Community 72 - "package.json: contracts/package.json"
Cohesion: 0.14
Nodes (14): description, devDependencies, typescript@6.0.3, exports, typescript, main, name, private (+6 more)

### Community 73 - "businessRule"
Cohesion: 0.19
Nodes (4): iso(), ResultsService, resultadosRoutes(), businessRule()

### Community 74 - "exams.test.ts: exams.test.ts"
Cohesion: 0.16
Nodes (10): box, clock, codes, DNIS, fakeJpeg(), jump(), registerOrd(), secrets (+2 more)

### Community 79 - "StaffAuthService"
Cohesion: 0.19
Nodes (6): StaffAuthService, group(), newRecoveryCodes(), normalizeRecoveryCode(), RECOVERY_CODE_COUNT, ADR-0022

### Community 80 - "examenes/presentation/routes.ts"
Cohesion: 0.22
Nodes (8): INCIDENT_TYPES, applicant, examBody, meta(), pdf(), roomBody, venueBody, when

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
Cohesion: 0.19
Nodes (10): ANNULMENT_REASONS, money(), PAID, providerPaid(), Reason, RECONCILIATION_LABEL, Result, TreasuryService (+2 more)

### Community 85 - "e2e-examen.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 86 - "convocatorias: .quoteFee()"
Cohesion: 0.25
Nodes (6): DocumentRecord, OptionRecord, QuotaCategoryRecord, RequirementRecord, SyllabusRecord, ADR-0002

### Community 87 - "e2e-inscripcion.mjs"
Cohesion: 0.29
Nodes (4): errors, ADR-0015, photo, width

### Community 88 - "exam-pdf.ts"
Cohesion: 0.33
Nodes (11): attendancePdf(), eligibleListPdf(), examSlipPdf(), footer(), hour(), longDate(), render(), OrdenPagoService (+3 more)

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
Cohesion: 0.29
Nodes (6): Department, departments, District, districtIndex, isValidDistrict(), Province

### Community 98 - "stage.ts"
Cohesion: 0.17
Nodes (10): shortDate(), nextMilestone(), Stage, StageKind, StageScope, stagesInProgress(), StageStatus, stageStatus() (+2 more)

### Community 101 - "payments.test.ts: payments.test.ts"
Cohesion: 0.32
Nodes (5): confirmWith(), fakeJpeg(), register(), signed(), t

### Community 102 - "tsconfig.json: backend/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, ../../tsconfig.base.json

### Community 103 - "ref_vitest"
Cohesion: 0.12
Nodes (6): totpService, clock, secrets, t, t, ADR-0014

### Community 104 - "portal admin: Component"
Cohesion: 0.27
Nodes (3): Room, Venue, VenuesAdminPage

### Community 107 - "event-queue.test.ts"
Cohesion: 0.20
Nodes (7): clock, failFor, FakeQueue, handled, queue, t, ADR-0021

### Community 108 - "payment-rules.ts"
Cohesion: 0.14
Nodes (19): backendDir, envFile, gw, missing, ADR-0016, Attempt, AttemptResultDto, PaymentStatusDto (+11 more)

### Community 113 - "e2e-expediente.mjs: e2e-expediente.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 114 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:setup, db:start, db:stop, dev, dev:rds, izipay:check (+6 more)

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 117 - "resultados/presentation/routes.ts"
Cohesion: 0.13
Nodes (14): booleanish, callCode, callParams, convocatoriasRoutes(), feeQuoteQuery, optionsQuery, applicant, Column (+6 more)

### Community 118 - "FichaService"
Cohesion: 0.31
Nodes (4): FichaService, longDate(), shortName(), sectionTitle()

### Community 119 - "staff-recovery.test.ts"
Cohesion: 0.29
Nodes (6): clock, codes, login(), recovery(), t, ADR-0022

### Community 122 - "attendance.ts"
Cohesion: 0.11
Nodes (10): AssetMap, SiteImages, BoardExam, BoardRoom, CheckIn, Incident, INCIDENTS, Pending (+2 more)

### Community 123 - "izipay-gateway.ts"
Cohesion: 0.13
Nodes (13): ProviderResult, CheckoutRequest, PaymentGateway, ADR-0007, ADR-0016, ADR-0019, MockPaymentGateway, ADR-0007 (+5 more)

### Community 124 - "exams.ts: seed/exams.ts"
Cohesion: 0.40
Nodes (4): BUILDINGS, exams, rooms, venue

### Community 125 - "identity.ts: identity.ts"
Cohesion: 0.40
Nodes (4): consentDocument, disqualifiedPersons, permissions, roles

### Community 128 - "format.ts"
Cohesion: 0.06
Nodes (18): closesIn(), daysUntil(), limaDay(), ApplicationFinder, CAMPUS, HomePage, PRINCIPLES, PRIORITY (+10 more)

### Community 130 - "session-policy.ts"
Cohesion: 0.24
Nodes (8): evaluateRefresh(), IDLE_LIMIT_SECONDS, RefreshDecision, SessionState, ADR-0006, minutesAgo(), now, session()

### Community 131 - "@angular/forms"
Cohesion: 0.06
Nodes (18): AdmittedListDto, InboxDto, MyResultDto, ExamTicket, ExamTicketData, ADR-0023, InboxPanel, ADR-0015 (+10 more)

### Community 132 - "ngsw-config.json"
Cohesion: 0.40
Nodes (4): assetGroups, index, navigationUrls, $schema

### Community 133 - "screenshots-panel.mjs"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

### Community 134 - "allowScripts"
Cohesion: 0.20
Nodes (10): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+2 more)

### Community 135 - "accounts.test.ts"
Cohesion: 0.14
Nodes (13): FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, REDACTED_PATHS, activeAccount() (+5 more)

### Community 136 - "results.ts"
Cohesion: 0.25
Nodes (7): Batch, ExamResults, Issue, STATUS, TAG, VersionDetail, VersionSummary

### Community 137 - "fee-calculator.test.ts"
Cohesion: 0.15
Nodes (12): FeeCriteria, FeeRule, SurchargeRule, base, CEPRE_EXTEMP, CEPRE_REGULAR, EXO_EXTEMP, ORD_EXTEMP (+4 more)

### Community 139 - "global-setup.ts"
Cohesion: 0.25
Nodes (5): embedded-postgres@16.14.0-beta.17, backendDir, dataDir, TEST_DATABASE_URL, embedded-postgres

### Community 140 - "VacancyImport"
Cohesion: 0.39
Nodes (3): VacancyImport, VacancyImportPreview, VacancyImportRow

### Community 142 - "treasury.ts"
Cohesion: 0.29
Nodes (6): Annulment, Item, RESULTS, Run, RunDetail, Summary

### Community 143 - "pages/catalog.ts"
Cohesion: 0.29
Nodes (6): Catalog, FORMATS, Modality, Program, Requirement, Sub

### Community 145 - ".getStats"
Cohesion: 0.33
Nodes (3): EnrollmentStatsProvider, toLimaIso(), StatsDto

### Community 147 - "e2e-panel.mjs"
Cohesion: 0.40
Nodes (3): base32Decode(), text, totp()

### Community 150 - "IzipayPaymentGateway"
Cohesion: 0.36
Nodes (4): PaymentSessionDto, CheckoutSession, IzipayPaymentGateway, gatewayUnavailable()

## Knowledge Gaps
- **135 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+130 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1237 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `Páginas del panel y errores` to `api.service.ts`, `Sesión del panel (frontend)`, `@angular/core`, `@angular/forms`, `format.ts`, `results.ts`, `SecurityPage`, `treasury.ts`, `pages/catalog.ts`, `dossier-panel.ts`, `format.ts`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `admin-login.ts`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `online-payment.ts`, `account-session.ts`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `portal admin: KnowledgeAdminPage`, `portal admin: SystemAdminPage`, `portal admin: Component`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `CasesAdminPage`, `portal admin: DisqualifiedAdminPage`, `attendance.ts`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _135 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05069124423963134 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `Contenido del portal (admin)` to `NotificationService`, `usuariosRoutes`, `exam-service.ts`, `seguridad/index.ts`, `Servicio de asistencia`, `VacancyImport`, `InscriptionService`, `inscription-service.ts`, `SiteAssets`, `Servicio de expedientes`, `middleware.ts`, `Db`, `Revisión de resultados`, `Rutas del panel (backend)`, `validationError`, `src/app.ts`, `assistant-service.ts`, `ficha-service.ts`, `AssistantService`, `usuarios/index.ts`, `pagos: PaymentService`, `businessRule`, `StaffAuthService`, `examenes/presentation/routes.ts`, `pagos: money()`, `exam-pdf.ts`, `StaffAdmin`, `payment-rules.ts`, `resultados/presentation/routes.ts`, `FichaService`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.035003431708991076 - nodes in this community are weakly interconnected._
- **Why does `playwright-core` connect `Pruebas E2E con Playwright` to `screenshots-panel.mjs`, `e2e-expediente.mjs: e2e-expediente.mjs`, `package.json`, `e2e-panel.mjs`, `e2e-cuenta.mjs`, `e2e-examen.mjs`, `e2e-inscripcion.mjs`, `e2e-resultados.mjs: e2e-resultados.mjs`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Should `@angular/core` be split into smaller, more focused modules?**
  _Cohesion score 0.05310734463276836 - nodes in this community are weakly interconnected._