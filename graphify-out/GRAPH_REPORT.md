# Graph Report - proyectofinal  (2026-11-09)

## Corpus Check
- 297 files · ~198,710 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .scss 5, (none) 4, .woff 4)

## Summary
- 3113 nodes · 7522 edges · 157 communities (113 shown, 44 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 229 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `181325c0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- @angular/core
- attendance.ts
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
- AdminSession
- lambda-worker.ts
- scripts
- Dependencias de desarrollo backend
- Servicio de expedientes
- middleware.ts
- Db
- Revisión de resultados
- email-sender.ts
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
- asistente/index.ts
- Pruebas E2E con Playwright
- ConvocatoriasRepository
- ficha-service.ts
- Convocatoria (panel)
- ref_node_path
- admin.test.ts: movableClock()
- .now
- ref_node_path
- AssistantService
- notifications.test.ts
- package.json: scripts
- updates
- ci.yml
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- Argon2Hasher
- usuarios/index.ts
- fee-calculator.test.ts
- izipay-gateway.ts
- portal admin: ResultsAdminPage
- tsconfig.base.json: tsconfig.base.json
- micuentaweb.ts
- portal admin: blankProgram()
- call-2027-I.ts: call-2027-I.ts
- admin-login.ts
- portal admin: DossiersAdminPage
- portal admin: NotificationsAdminPage
- db.ts: db.ts
- pagos: PaymentService
- OnlinePayment
- s3-file-storage.ts: s3-check.ts
- convocatorias: PrismaConvocatoriasReposi
- AssistantTools
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
- assistant-service.ts
- seguridad: totp.ts
- dossier.test.ts: dossier.test.ts
- pending-features.test.ts: pending-featur
- pagos: money()
- e2e-examen.mjs
- convocatorias: .quoteFee()
- tools.ts
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
- usuarios/presentation/routes.ts
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
- prisma.ts
- e2e-expediente.mjs: e2e-expediente.mjs
- pages/exams.ts
- CasesAdminPage
- content.ts: seed/content.ts
- resultados/presentation/routes.ts
- FichaService
- staff-recovery.test.ts
- portal admin: DisqualifiedAdminPage
- DailyChart
- SiteImages
- izipay-gateway.ts
- exams.ts: seed/exams.ts
- identity.ts: identity.ts
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- format.ts
- portal public: SyllabusPage
- optimizar-imagenes.mjs
- MyResultPage
- ngsw-config.json
- screenshots-panel.mjs
- inbox.ts
- accounts.test.ts
- results.ts
- assistant.test.ts
- AdminShell
- global-setup.ts
- VacancyImport
- SecurityPage
- treasury.ts
- expedientes/presentation/routes.ts
- SiteAssets
- scripts
- LocalFileStorage
- KrClient
- e2e-cuenta.mjs
- assistant.ts
- @aws-sdk/client-sesv2
- prisma.config.ts
- Stage
- VerifyFichaPage
- CartaAvalPage
- RequirementsPage
- exceljs

## God Nodes (most connected - your core abstractions)
1. `RequestMeta` - 156 edges
2. `apiErrorMessage()` - 109 edges
3. `notFound()` - 101 edges
4. `Db` - 85 edges
5. `ApiService` - 85 edges
6. `@angular/core` - 83 edges
7. `validationError()` - 65 edges
8. `businessRule()` - 64 edges
9. `Clock` - 62 edges
10. `AuditLog` - 60 edges

## Surprising Connections (you probably didn't know these)
- `StaffSession` --references--> `TokenDto`  [EXTRACTED]
  apps/backend/src/modules/usuarios/application/staff-auth-service.ts → packages/contracts/src/index.ts
- `Row` --references--> `DossierDto`  [EXTRACTED]
  apps/frontend/src/app/features/admin/pages/dossiers.ts → packages/contracts/src/index.ts
- `seedStaff()` --calls--> `temporaryPassword()`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/application/staff-admin.ts
- `seedStaff()` --calls--> `Argon2Hasher`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/infrastructure/argon2-hasher.ts
- `AdminDeps` --references--> `AssistantService`  [EXTRACTED]
  apps/backend/src/admin-routes.ts → apps/backend/src/modules/asistente/application/assistant-service.ts

## Import Cycles
- None detected.

## Communities (157 total, 44 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.03
Nodes (79): CLIENT, ADR-0015, apiErrorCode(), apiErrorDetails(), ApiHttpError, FichaVerification, ReinscriptionCheck, ADR-0010 (+71 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.04
Nodes (66): CLIENT, Query, StaffMe, StaffStep, ADR-0018, ADR-0022, BY_EXTENSION, fileType() (+58 more)

### Community 2 - "@angular/core"
Cohesion: 0.05
Nodes (38): App, appConfig, ADR-0023, routes, ADR-0015, ADR-0018, SubmodalityDto, CallStore (+30 more)

### Community 3 - "attendance.ts"
Cohesion: 0.08
Nodes (15): @angular/common@22.2.3, AssetMap, Department, District, Province, UbigeoService, BoardExam, BoardRoom (+7 more)

### Community 4 - "NotificationService"
Cohesion: 0.21
Nodes (4): day(), hour(), NotificationService, notificacionesRoutes()

### Community 5 - "usuariosRoutes"
Cohesion: 0.18
Nodes (6): AuthService, sha256(), StaffSession, normalizeEmail(), usuariosRoutes(), TokenDto

### Community 6 - "Páginas del panel y errores"
Cohesion: 0.04
Nodes (16): apiErrorMessage(), ExamRoomDto, AuditAdminPage, InscriptionsAdminPage, PaymentsAdminPage, FindRoomPage, DossierPanel, MyInscriptionPage (+8 more)

### Community 8 - "exam-service.ts"
Cohesion: 0.10
Nodes (24): ExamInfo, RoomInfo, ExamInput, ExamInscriptions, ExamPerson, ExamRow, ExamStructure, MODALITY_LABEL (+16 more)

### Community 9 - "seguridad/index.ts"
Cohesion: 0.08
Nodes (29): EVIDENCE, EvidenceInput, SupportCases, ALL, byRole, hasPermission(), PERMISSIONS, permissionsOf() (+21 more)

### Community 10 - "Contenido del portal (admin)"
Cohesion: 0.07
Nodes (14): AdminDeps, ContentAdmin, sniff(), CallAdmin, iso(), CatalogAdmin, FORMATS, Column (+6 more)

### Community 11 - "Servicio de asistencia"
Cohesion: 0.09
Nodes (17): AttendanceService, iso(), ExamService, iso(), roomInfo(), roomOrder(), codeFromScan(), INCIDENT_TYPES (+9 more)

### Community 12 - "frontend/package.json"
Cohesion: 0.09
Nodes (30): dependencies, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, @angular/service-worker@22.2.3, rxjs@7.8.2 (+22 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (43): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+35 more)

### Community 14 - "InscriptionService"
Cohesion: 0.12
Nodes (9): CepreAwardees, InscriptionService, OrdenPagoService, createInscripcionesModule(), inscripcionesRoutes(), inscriptionSchema, meta(), name (+1 more)

### Community 15 - "inscription-service.ts"
Cohesion: 0.11
Nodes (24): InscriptionInput, InscriptionSummary, longDate(), NO_REINSCRIPTION, shortDate(), ADR-0015, ADR-0017, CAMPUSES (+16 more)

### Community 17 - "lambda-worker.ts"
Cohesion: 0.06
Nodes (35): application, handler, ADR-0009, application, handler(), processQueue(), SqsEvent, ADR-0012 (+27 more)

### Community 18 - "scripts"
Cohesion: 0.05
Nodes (38): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+30 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.09
Nodes (31): devDependencies, concurrently@10.0.6, esbuild@0.28.2, pino-pretty@13.2.0, supertest@7.3.1, tsx@4.23.15, @types/cookie-parser@1.4.10, @types/express@5.0.6 (+23 more)

### Community 20 - "Servicio de expedientes"
Cohesion: 0.21
Nodes (4): DossierService, iso(), latest(), expedientesRoutes()

### Community 21 - "middleware.ts"
Cohesion: 0.11
Nodes (26): asistenteRoutes(), meta(), ADR-0017, announcementsQuery, configuracionRoutes(), booleanish, callCode, callParams (+18 more)

### Community 22 - "Db"
Cohesion: 0.11
Nodes (10): Application, AppOverrides, AccessService, AuthDeps, AuditLog, Clock, Db, Outbox (+2 more)

### Community 23 - "Revisión de resultados"
Cohesion: 0.09
Nodes (21): MODALITY_LABEL, ResultPerson, ResultsPorts, Answers, computeScore(), Condition, CONDITION_LABEL, Contender (+13 more)

### Community 24 - "email-sender.ts"
Cohesion: 0.15
Nodes (10): RecordingEmailSender, limaTime(), subscribeAccountNotifications(), EmailExtras, EmailMessage, EmailSender, FileEmailSender, ADR-0007 (+2 more)

### Community 25 - "Rutas del panel (backend)"
Cohesion: 0.13
Nodes (18): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+10 more)

### Community 26 - "micuentaweb.ts"
Cohesion: 0.16
Nodes (12): PaymentSessionDto, CheckoutSession, SignedMessage, isValidHex(), KrAnswer, KrTransaction, MiCuentaWebConfig, MiCuentaWebGateway (+4 more)

### Community 27 - "rds.ts"
Cohesion: 0.29
Nodes (9): backendDir, caFile, check(), client(), envFile, migrate(), setup(), ADR-0009 (+1 more)

### Community 28 - "treasury.test.ts"
Cohesion: 0.20
Nodes (7): box, clock, duplicate, paid, secrets, t, today

### Community 29 - "pagos/index.ts"
Cohesion: 0.10
Nodes (16): YapeSessionDto, YapeChargeRequest, YapeGateway, CulqiCharge, CulqiConfig, CulqiYapeGateway, parseCulqiCharge(), ADR-0019 (+8 more)

### Community 30 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, argon2@0.45.1, @aws-sdk/client-s3@^3.1158.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, cookie-parser@1.4.7, express@5.3.0 (+22 more)

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "validationError"
Cohesion: 0.09
Nodes (21): Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus, OBSERVE_HOURS (+13 more)

### Community 34 - "src/app.ts"
Cohesion: 0.06
Nodes (38): backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012, ADR-0019, ADR-0021 (+30 more)

### Community 35 - "asistente/index.ts"
Cohesion: 0.15
Nodes (17): KnowledgeAdmin, LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017 (+9 more)

### Community 36 - "Pruebas E2E con Playwright"
Cohesion: 0.09
Nodes (11): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], errors, ADR-0015, photo, width, [dni = '99900050', email = 'e2e.micuentaweb@example.com', card = '4970100000000055', out = '.screens/pago-sandbox'], jobs (+3 more)

### Community 37 - "ConvocatoriasRepository"
Cohesion: 0.16
Nodes (5): ConvocatoriasQueries, ConvocatoriasRepository, createConvocatoriasModule(), convocatoriasRoutes(), StatsDto

### Community 38 - "ficha-service.ts"
Cohesion: 0.20
Nodes (21): ENTRY, admissionCertificatePdf(), assets, BOLD, ESCUDO, FONTS, GOLD, GUINDA (+13 more)

### Community 39 - "Convocatoria (panel)"
Cohesion: 0.12
Nodes (12): Awardee, Awardees, CallAdminPage, CallDetail, Fee, fromLima(), ImportPreview, ImportRow (+4 more)

### Community 40 - "ref_node_path"
Cohesion: 0.14
Nodes (7): apply, db, db, [email, file = '.admin-inicial.txt'], db, PasswordHasher, createPrismaClient()

### Community 41 - "admin.test.ts: movableClock()"
Cohesion: 0.10
Nodes (16): FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, fixedClock(), MemoryEmailSender (+8 more)

### Community 42 - ".now"
Cohesion: 0.10
Nodes (16): SessionMeta, SessionService, sha256(), ADR-0006, deviceLabel(), evaluateRefresh(), IDLE_LIMIT_SECONDS, RefreshDecision (+8 more)

### Community 43 - "ref_node_path"
Cohesion: 0.18
Nodes (9): dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile, ses (+1 more)

### Community 45 - "notifications.test.ts"
Cohesion: 0.13
Nodes (7): db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], totpService, SecretBox, box, clock, t

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
Cohesion: 0.18
Nodes (16): main(), prisma, publicDocsDir, seedCall(), seedCatalog(), seedContent(), seedExams(), seedIdentity() (+8 more)

### Community 52 - "Argon2Hasher"
Cohesion: 0.14
Nodes (12): Argon2Hasher, staff(), staff(), staff(), staff(), box, CHROME_WIN_NUEVO, clock (+4 more)

### Community 53 - "usuarios/index.ts"
Cohesion: 0.08
Nodes (28): token, IdentityTokenPayload, ADR-0018, applicantCodeFromSequence(), COMMON, EDITABLE_FIELDS, isMinor(), isValidApplicantCode() (+20 more)

### Community 54 - "fee-calculator.test.ts"
Cohesion: 0.09
Nodes (22): byPriority(), FeeCriteria, FeeQuote, FeeRule, matches(), MilitaryCondition, Modality, quoteFee() (+14 more)

### Community 55 - "izipay-gateway.ts"
Cohesion: 0.15
Nodes (12): orderNumberFor(), API, IzipayConfig, IzipayPaymentGateway, SDK, isValidSignature(), parseIzipayPayload(), sha256Hex() (+4 more)

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "micuentaweb.ts"
Cohesion: 0.14
Nodes (11): backendDir, envFile, gw, hmacKey, keys, missing, password, publicKey (+3 more)

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.11
Nodes (9): blankProgram(), blankReq(), Catalog, CatalogAdminPage, FORMATS, Modality, Program, Requirement (+1 more)

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.11
Nodes (15): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+7 more)

### Community 61 - "admin-login.ts"
Cohesion: 0.20
Nodes (4): ADR-0022, RecoveryCodes, ADR-0022, ActiveSessions

### Community 64 - "db.ts: db.ts"
Cohesion: 0.19
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "pagos: PaymentService"
Cohesion: 0.33
Nodes (3): PaymentService, formatAmount(), pagosRoutes()

### Community 66 - "OnlinePayment"
Cohesion: 0.29
Nodes (3): loadScript(), OnlinePayment, PaymentSessionDto

### Community 67 - "s3-file-storage.ts: s3-check.ts"
Cohesion: 0.11
Nodes (10): s3, files, root, s3, TYPES, PresignedUpload, S3FileStorage, ADR-0010 (+2 more)

### Community 69 - "AssistantTools"
Cohesion: 0.29
Nodes (3): AssistantTools, fecha(), terms()

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

### Community 78 - "portal cuenta: MyAccountPage"
Cohesion: 0.14
Nodes (4): MyAccountPage, base32Decode(), text, totp()

### Community 79 - "StaffAuthService"
Cohesion: 0.19
Nodes (8): StaffAuthService, AppError, forbidden(), locked(), tooManyRequests(), ADR-0006, ADR-0007, unauthorized()

### Community 80 - "assistant-service.ts"
Cohesion: 0.29
Nodes (9): AssistantReply, ADR-0017, asksForHuman(), LIMITS, maskPersonal(), NO_INFO_REPLY, SUGGESTIONS, SYSTEM_PROMPT (+1 more)

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
Cohesion: 0.20
Nodes (11): ANNULMENT_REASONS, money(), PAID, providerPaid(), Reason, RECONCILIATION_LABEL, Result, TreasuryService (+3 more)

### Community 85 - "e2e-examen.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 86 - "convocatorias: .quoteFee()"
Cohesion: 0.23
Nodes (10): FeeInfo, DocumentRecord, EnrollmentStatsProvider, OptionRecord, QuotaCategoryRecord, RequirementRecord, SyllabusRecord, ADR-0002 (+2 more)

### Community 87 - "tools.ts"
Cohesion: 0.18
Nodes (5): ESTADO_ETAPA, STOP, ToolDeps, ToolResult, ADR-0017

### Community 88 - "exam-pdf.ts"
Cohesion: 0.41
Nodes (10): attendancePdf(), eligibleListPdf(), examSlipPdf(), footer(), hour(), longDate(), render(), stamp() (+2 more)

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
Cohesion: 0.25
Nodes (6): Department, departments, District, districtIndex, districtLabel(), Province

### Community 98 - "stage.ts"
Cohesion: 0.10
Nodes (19): stages, shortDate(), CallSummary, SubmodalityRecord, nextMilestone(), StageKind, StageScope, stagesInProgress() (+11 more)

### Community 100 - "usuarios/presentation/routes.ts"
Cohesion: 0.09
Nodes (19): Permission, ACTIONS, describeDevice(), ProfileService, StaffAdmin, temporaryPassword(), IDENTITY_FIELDS, createUsuariosModule() (+11 more)

### Community 101 - "payments.test.ts: payments.test.ts"
Cohesion: 0.32
Nodes (5): confirmWith(), fakeJpeg(), register(), signed(), t

### Community 102 - "tsconfig.json: backend/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, ../../tsconfig.base.json

### Community 103 - "ref_vitest"
Cohesion: 0.14
Nodes (5): movableClock(), clock, secrets, t, t

### Community 107 - "event-queue.test.ts"
Cohesion: 0.20
Nodes (7): clock, failFor, FakeQueue, handled, queue, t, ADR-0021

### Community 108 - "payment-rules.ts"
Cohesion: 0.14
Nodes (19): backendDir, envFile, gw, missing, ADR-0016, Attempt, AttemptResultDto, PaymentStatusDto (+11 more)

### Community 112 - "prisma.ts"
Cohesion: 0.08
Nodes (27): DEFAULT_PARAMETERS, SITE_SLOTS, SiteSlot, TYPES, createExamenesModule(), createExpedientesModule(), AwardeeRowError, CYCLES (+19 more)

### Community 113 - "e2e-expediente.mjs: e2e-expediente.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 114 - "pages/exams.ts"
Cohesion: 0.20
Nodes (9): ExamDetail, ExamRow, fromLima(), MODALITIES, RoomUse, SCORING, STRUCTURE, toLima() (+1 more)

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 117 - "resultados/presentation/routes.ts"
Cohesion: 0.25
Nodes (7): applicant, Column, COVERAGE_COLUMNS, meta(), RESULT_COLUMNS, send(), ADR-0020

### Community 118 - "FichaService"
Cohesion: 0.36
Nodes (3): FichaService, longDate(), shortName()

### Community 119 - "staff-recovery.test.ts"
Cohesion: 0.19
Nodes (11): group(), newRecoveryCodes(), normalizeRecoveryCode(), RECOVERY_CODE_COUNT, ADR-0022, clock, codes, login() (+3 more)

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
Cohesion: 0.05
Nodes (30): closesIn(), dateRange(), daysUntil(), limaDay(), longDate(), shortDate(), STAGE_STATUS_LABEL, time() (+22 more)

### Community 130 - "optimizar-imagenes.mjs"
Cohesion: 0.22
Nodes (7): sharp@^0.34.5, sharp, base, dir, require, sharp, WIDTHS

### Community 131 - "MyResultPage"
Cohesion: 0.20
Nodes (3): AdmittedListDto, MyResultDto, MyResultPage

### Community 132 - "ngsw-config.json"
Cohesion: 0.40
Nodes (4): assetGroups, index, navigationUrls, $schema

### Community 133 - "screenshots-panel.mjs"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

### Community 135 - "accounts.test.ts"
Cohesion: 0.21
Nodes (7): REDACTED_PATHS, activeAccount(), clock, lastCode(), lookup(), register(), t

### Community 136 - "results.ts"
Cohesion: 0.25
Nodes (7): Batch, ExamResults, Issue, STATUS, TAG, VersionDetail, VersionSummary

### Community 137 - "assistant.test.ts"
Cohesion: 0.29
Nodes (5): ai, basic, scripted, toolCall(), usage

### Community 139 - "global-setup.ts"
Cohesion: 0.25
Nodes (5): embedded-postgres@16.14.0-beta.17, backendDir, dataDir, TEST_DATABASE_URL, embedded-postgres

### Community 140 - "VacancyImport"
Cohesion: 0.39
Nodes (3): VacancyImport, VacancyImportPreview, VacancyImportRow

### Community 142 - "treasury.ts"
Cohesion: 0.29
Nodes (6): Annulment, Item, RESULTS, Run, RunDetail, Summary

### Community 143 - "expedientes/presentation/routes.ts"
Cohesion: 0.33
Nodes (5): applicant, meta(), sendFile(), ADR-0010, ADR-0018

### Community 145 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, ng, start, test, watch

### Community 149 - "assistant.ts"
Cohesion: 0.33
Nodes (5): Line, Msg, Panel, toLines(), ADR-0017

### Community 150 - "@aws-sdk/client-sesv2"
Cohesion: 0.33
Nodes (4): @aws-sdk/client-sesv2@^3.1158.0, @aws-sdk/client-sqs@^3.1161.0, @aws-sdk/client-sesv2, @aws-sdk/client-sqs

## Knowledge Gaps
- **135 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+130 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1239 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `Páginas del panel y errores` to `api.service.ts`, `Sesión del panel (frontend)`, `@angular/core`, `attendance.ts`, `MyResultPage`, `inbox.ts`, `results.ts`, `SecurityPage`, `treasury.ts`, `assistant.ts`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `admin-login.ts`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `OnlinePayment`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `portal admin: KnowledgeAdminPage`, `portal admin: SystemAdminPage`, `portal admin: Component`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `pages/exams.ts`, `CasesAdminPage`, `portal admin: DisqualifiedAdminPage`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _135 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03080657206870799 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `Contenido del portal (admin)` to `NotificationService`, `usuariosRoutes`, `exam-service.ts`, `seguridad/index.ts`, `Servicio de asistencia`, `VacancyImport`, `InscriptionService`, `expedientes/presentation/routes.ts`, `SiteAssets`, `inscription-service.ts`, `Servicio de expedientes`, `middleware.ts`, `Db`, `Revisión de resultados`, `Rutas del panel (backend)`, `validationError`, `ficha-service.ts`, `AssistantService`, `usuarios/index.ts`, `pagos: PaymentService`, `businessRule`, `StaffAuthService`, `assistant-service.ts`, `pagos: money()`, `exam-pdf.ts`, `usuarios/presentation/routes.ts`, `payment-rules.ts`, `prisma.ts`, `resultados/presentation/routes.ts`, `FichaService`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.035232212308396245 - nodes in this community are weakly interconnected._
- **Why does `playwright-core` connect `Pruebas E2E con Playwright` to `screenshots-panel.mjs`, `portal cuenta: MyAccountPage`, `e2e-expediente.mjs: e2e-expediente.mjs`, `scripts`, `e2e-cuenta.mjs`, `e2e-examen.mjs`, `e2e-resultados.mjs: e2e-resultados.mjs`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Should `@angular/core` be split into smaller, more focused modules?**
  _Cohesion score 0.046760710553814006 - nodes in this community are weakly interconnected._