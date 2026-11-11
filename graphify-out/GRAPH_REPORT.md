# Graph Report - proyectofinal  (2026-11-10)

## Corpus Check
- 298 files · ~198,878 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .scss 5, (none) 4, .woff 4)

## Summary
- 3119 nodes · 7564 edges · 141 communities (106 shown, 35 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 229 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d92e15c9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- @angular/core
- attendance.ts
- NotificationService
- auth-service.ts
- dossiers.ts
- Cliente API del portal
- exam-service.ts
- seguridad/index.ts
- Contenido del portal (admin)
- Servicio de asistencia
- frontend/package.json
- Configuración de Angular
- AdminSession
- inscription-service.ts
- support-cases.ts
- lambda-worker.ts
- package.json
- Dependencias de desarrollo backend
- Servicio de expedientes
- middleware.ts
- Db
- ResultsService
- env.ts
- Rutas del panel (backend)
- micuentaweb.ts
- rds.ts
- scripts
- pagos/index.ts
- dependencies
- Exámenes (panel)
- Formulario de inscripción
- dossier-service.ts
- src/app.ts
- asistente/index.ts
- Pruebas E2E con Playwright
- ConvocatoriasRepository
- ficha-service.ts
- Convocatoria (panel)
- email-sender.ts
- admin.test.ts: movableClock()
- .now
- ref_node_path
- AssistantService
- treasury.test.ts
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
- examenes/presentation/routes.ts
- exams.test.ts: exams.test.ts
- portal admin: ContentAdminPage
- portal admin: TreasuryAdminPage
- portal admin: Component
- portal cuenta: MyAccountPage
- ubigeo.service.ts
- assistant-service.ts
- seguridad: totp.ts
- dossier.test.ts: dossier.test.ts
- pending-features.test.ts: pending-featur
- pagos: money()
- e2e-examen.mjs
- convocatorias: .quoteFee()
- session-policy.ts
- InscriptionsAdminPage
- portal admin: AdminLoginPage
- tsconfig.json: contracts/tsconfig.json
- e2e-resultados.mjs: e2e-resultados.mjs
- trazabilidad.mjs: trazabilidad.mjs
- catalog.ts: seed/catalog.ts
- ReportQueries
- configuracion-queries.ts
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
- NoticeSources
- payment-rules.ts
- portal admin: AdmissionsAdminPage
- portal cuenta: AccountLoginPage
- site-header.ts: SiteHeader
- notification-service.ts
- e2e-expediente.mjs: e2e-expediente.mjs
- allowScripts
- CasesAdminPage
- content.ts: seed/content.ts
- e2e-inscripcion.mjs
- IzipayPaymentGateway
- staff-recovery.test.ts
- portal admin: DisqualifiedAdminPage
- DailyChart
- LocalFileStorage
- izipay-gateway.ts
- exams.ts: seed/exams.ts
- identity.ts: identity.ts
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- format.ts
- AdminShell
- optimizar-imagenes.mjs
- apiErrorMessage
- ngsw-config.json
- screenshots-panel.mjs
- inbox.ts
- accounts.test.ts
- SyllabusPage
- SecurityPage
- SiteAssets
- scripts
- KrClient

## God Nodes (most connected - your core abstractions)
1. `RequestMeta` - 156 edges
2. `apiErrorMessage()` - 109 edges
3. `notFound()` - 101 edges
4. `Db` - 85 edges
5. `ApiService` - 85 edges
6. `@angular/core` - 84 edges
7. `validationError()` - 65 edges
8. `businessRule()` - 64 edges
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
- `createSeguridadModule()` --indirect_call--> `authorize()`  [INFERRED]
  apps/backend/src/modules/seguridad/index.ts → apps/backend/src/modules/seguridad/presentation/auth-middleware.ts

## Import Cycles
- None detected.

## Communities (141 total, 35 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.03
Nodes (88): CLIENT, ADR-0015, apiErrorCode(), apiErrorDetails(), ApiHttpError, FichaVerification, ReinscriptionCheck, SubmodalityDto (+80 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.04
Nodes (67): CLIENT, Query, StaffMe, StaffStep, ADR-0018, ADR-0022, shortDateTime(), STEP_LABEL (+59 more)

### Community 2 - "@angular/core"
Cohesion: 0.05
Nodes (34): App, appConfig, ADR-0023, routes, ADR-0015, ADR-0018, CallStore, KEY_STAGES (+26 more)

### Community 3 - "attendance.ts"
Cohesion: 0.08
Nodes (14): @angular/common@22.2.3, AssetMap, SiteImages, BoardExam, BoardRoom, CheckIn, Incident, INCIDENTS (+6 more)

### Community 4 - "NotificationService"
Cohesion: 0.20
Nodes (5): day(), hour(), NotificationService, meta(), notificacionesRoutes()

### Community 5 - "auth-service.ts"
Cohesion: 0.07
Nodes (32): AuthService, IdentityTokenPayload, sha256(), ADR-0018, ACTIONS, describeDevice(), ProfileService, StaffSession (+24 more)

### Community 6 - "dossiers.ts"
Cohesion: 0.09
Nodes (17): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, Row (+9 more)

### Community 8 - "exam-service.ts"
Cohesion: 0.10
Nodes (24): RoomInfo, ExamInput, ExamInscriptions, ExamPerson, ExamRow, ExamStructure, MODALITY_LABEL, RoomRow (+16 more)

### Community 9 - "seguridad/index.ts"
Cohesion: 0.07
Nodes (31): ALL, byRole, Permission, PERMISSIONS, permissionsOf(), STAFF_ROLES, ADR-0018, Totp (+23 more)

### Community 10 - "Contenido del portal (admin)"
Cohesion: 0.06
Nodes (20): AdminDeps, KnowledgeAdmin, ContentAdmin, sniff(), CallAdmin, iso(), CatalogAdmin, FORMATS (+12 more)

### Community 11 - "Servicio de asistencia"
Cohesion: 0.15
Nodes (6): ExamInfo, ExamService, iso(), createExamenesModule(), examenesRoutes(), businessRule()

### Community 12 - "frontend/package.json"
Cohesion: 0.06
Nodes (36): dependencies, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, @angular/service-worker@22.2.3, rxjs@7.8.2 (+28 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (43): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+35 more)

### Community 14 - "AdminSession"
Cohesion: 0.09
Nodes (8): AdminSession, NAV, NavItem, ROLE_NAMES, Count, Dashboard, ReportKind, REPORTS

### Community 15 - "inscription-service.ts"
Cohesion: 0.05
Nodes (38): ApplicationDocuments, FichaService, shortName(), InscriptionInput, InscriptionService, InscriptionSummary, longDate(), NO_REINSCRIPTION (+30 more)

### Community 16 - "support-cases.ts"
Cohesion: 0.20
Nodes (9): checkDocument(), CheckedFile, MAX_DOCUMENT_BYTES, EVIDENCE, EvidenceInput, SupportCases, createSeguridadModule(), seguridadRoutes() (+1 more)

### Community 17 - "lambda-worker.ts"
Cohesion: 0.09
Nodes (22): @aws-sdk/client-sqs@^3.1161.0, application, handler(), processQueue(), SqsEvent, ADR-0012, ADR-0021, application (+14 more)

### Community 18 - "package.json"
Cohesion: 0.15
Nodes (14): description, devDependencies, concurrently@10.0.6, playwright-core@1.64.1, typescript@6.0.3, engines, node, concurrently (+6 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.08
Nodes (35): devDependencies, concurrently@10.0.6, embedded-postgres@16.14.0-beta.17, esbuild@0.28.2, pino-pretty@13.2.0, prisma@7.10.1, supertest@7.3.1, tsx@4.23.15 (+27 more)

### Community 20 - "Servicio de expedientes"
Cohesion: 0.17
Nodes (7): DossierService, iso(), latest(), createExpedientesModule(), expedientesRoutes(), meta(), sendFile()

### Community 21 - "middleware.ts"
Cohesion: 0.09
Nodes (37): asistenteRoutes(), meta(), ADR-0017, announcementsQuery, booleanish, callCode, callParams, feeQuoteQuery (+29 more)

### Community 22 - "Db"
Cohesion: 0.06
Nodes (41): Application, AppOverrides, DEFAULT_PARAMETERS, SITE_SLOTS, SiteSlot, TYPES, ADR-0002, AwardeeRowError (+33 more)

### Community 23 - "ResultsService"
Cohesion: 0.08
Nodes (24): iso(), ResultsService, Answers, computeScore(), Condition, CONDITION_LABEL, Contender, groupKey() (+16 more)

### Community 24 - "env.ts"
Cohesion: 0.14
Nodes (13): application, handler, ADR-0009, Env, loadEnv(), schema, ADR-0010, ADR-0016 (+5 more)

### Community 25 - "Rutas del panel (backend)"
Cohesion: 0.12
Nodes (20): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+12 more)

### Community 26 - "micuentaweb.ts"
Cohesion: 0.16
Nodes (12): PaymentSessionDto, CheckoutSession, SignedMessage, isValidHex(), KrAnswer, KrTransaction, MiCuentaWebConfig, MiCuentaWebGateway (+4 more)

### Community 27 - "rds.ts"
Cohesion: 0.23
Nodes (11): pg@8.23.1, backendDir, caFile, check(), client(), envFile, migrate(), setup() (+3 more)

### Community 28 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:setup, db:start, db:stop, dev, dev:rds, izipay:check (+6 more)

### Community 29 - "pagos/index.ts"
Cohesion: 0.11
Nodes (15): YapeSessionDto, YapeChargeRequest, YapeGateway, CulqiCharge, CulqiConfig, CulqiYapeGateway, parseCulqiCharge(), ADR-0019 (+7 more)

### Community 30 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, @aws-sdk/client-sesv2@^3.1158.0, @codegenie/serverless-express@5.0.0, cookie-parser@1.4.7, exceljs@^4.4.0, express@5.3.0, helmet@8.3.0, jose@6.2.13 (+15 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "dossier-service.ts"
Cohesion: 0.11
Nodes (18): Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus, OBSERVE_HOURS (+10 more)

### Community 34 - "src/app.ts"
Cohesion: 0.10
Nodes (22): backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012, ADR-0019, ADR-0021 (+14 more)

### Community 35 - "asistente/index.ts"
Cohesion: 0.12
Nodes (22): ToolDeps, LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017 (+14 more)

### Community 36 - "Pruebas E2E con Playwright"
Cohesion: 0.09
Nodes (9): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900028', out = '.screens/cuenta'], ADR-0015, [dni = '99900050', email = 'e2e.micuentaweb@example.com', card = '4970100000000055', out = '.screens/pago-sandbox'], jobs, [out = '.screens', ...routes], report (+1 more)

### Community 37 - "ConvocatoriasRepository"
Cohesion: 0.18
Nodes (4): ConvocatoriasQueries, ConvocatoriasRepository, convocatoriasRoutes(), OfficialDocumentDto

### Community 38 - "ficha-service.ts"
Cohesion: 0.14
Nodes (33): attendancePdf(), eligibleListPdf(), examSlipPdf(), footer(), hour(), longDate(), render(), ENTRY (+25 more)

### Community 39 - "Convocatoria (panel)"
Cohesion: 0.12
Nodes (12): Awardee, Awardees, CallAdminPage, CallDetail, Fee, fromLima(), ImportPreview, ImportRow (+4 more)

### Community 40 - "email-sender.ts"
Cohesion: 0.13
Nodes (16): isValidApplicantCode(), luhnCheckDigit(), EmailExtras, EmailMessage, FileEmailSender, ADR-0007, ADR-0014, SesEmailSender (+8 more)

### Community 41 - "admin.test.ts: movableClock()"
Cohesion: 0.13
Nodes (10): fixedClock(), MemoryEmailSender, MemoryFileStorage, checkDigit, TEST_URL, testApp(), t, base (+2 more)

### Community 42 - ".now"
Cohesion: 0.08
Nodes (10): AccessService, SessionMeta, SessionService, sha256(), ADR-0006, deviceLabel(), SESSION_TTL, sanitize() (+2 more)

### Community 43 - "ref_node_path"
Cohesion: 0.09
Nodes (15): dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile, ses (+7 more)

### Community 45 - "treasury.test.ts"
Cohesion: 0.20
Nodes (7): box, clock, duplicate, paid, secrets, t, today

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
Cohesion: 0.07
Nodes (23): argon2@0.45.1, db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], db, [email, file = '.admin-inicial.txt'], totpService, SecretBox, Argon2Hasher (+15 more)

### Community 53 - "usuarios/index.ts"
Cohesion: 0.12
Nodes (15): token, isMinor(), IdentityLookupResult, IdentityProvider, ADR-0007, ADR-0015, createIdentityProvider(), ADR-0007 (+7 more)

### Community 54 - "fee-calculator.test.ts"
Cohesion: 0.09
Nodes (24): byPriority(), FeeCriteria, FeeInfo, FeeQuote, FeeRule, matches(), MilitaryCondition, Modality (+16 more)

### Community 55 - "izipay-gateway.ts"
Cohesion: 0.18
Nodes (10): orderNumberFor(), API, IzipayConfig, SDK, isValidSignature(), parseIzipayPayload(), sha256Hex(), signPayload() (+2 more)

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "micuentaweb.ts"
Cohesion: 0.14
Nodes (11): backendDir, envFile, gw, hmacKey, keys, missing, password, publicKey (+3 more)

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.16
Nodes (3): blankProgram(), blankReq(), CatalogAdminPage

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.11
Nodes (15): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+7 more)

### Community 61 - "admin-login.ts"
Cohesion: 0.18
Nodes (5): ADR-0022, RecoveryCodes, ADR-0022, ActiveSessions, SessionDto

### Community 64 - "db.ts: db.ts"
Cohesion: 0.19
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "pagos: PaymentService"
Cohesion: 0.29
Nodes (4): PaymentService, formatAmount(), meta(), pagosRoutes()

### Community 66 - "OnlinePayment"
Cohesion: 0.29
Nodes (3): loadScript(), OnlinePayment, PaymentSessionDto

### Community 67 - "s3-file-storage.ts: s3-check.ts"
Cohesion: 0.09
Nodes (15): @aws-sdk/client-s3@^3.1158.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, s3, files, root, s3, TYPES (+7 more)

### Community 68 - "convocatorias: PrismaConvocatoriasReposi"
Cohesion: 0.13
Nodes (3): OptionRecord, PrismaConvocatoriasRepository, toFee()

### Community 69 - "AssistantTools"
Cohesion: 0.13
Nodes (7): AssistantTools, ESTADO_ETAPA, fecha(), STOP, terms(), ToolResult, ADR-0017

### Community 70 - "results.test.ts: results.test.ts"
Cohesion: 0.14
Nodes (11): box, clock, codes, DNIS, fakeJpeg(), jump(), registerExo(), secrets (+3 more)

### Community 72 - "package.json: contracts/package.json"
Cohesion: 0.14
Nodes (14): description, devDependencies, typescript@6.0.3, exports, typescript, main, name, private (+6 more)

### Community 73 - "examenes/presentation/routes.ts"
Cohesion: 0.13
Nodes (13): AttendanceService, iso(), roomInfo(), codeFromScan(), INCIDENT_TYPES, IncidentType, applicant, examBody (+5 more)

### Community 74 - "exams.test.ts: exams.test.ts"
Cohesion: 0.16
Nodes (10): box, clock, codes, DNIS, fakeJpeg(), jump(), registerOrd(), secrets (+2 more)

### Community 78 - "portal cuenta: MyAccountPage"
Cohesion: 0.14
Nodes (4): MyAccountPage, base32Decode(), text, totp()

### Community 79 - "ubigeo.service.ts"
Cohesion: 0.17
Nodes (5): Department, District, Province, UbigeoService, UbigeoSelect

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
Cohesion: 0.21
Nodes (9): ANNULMENT_REASONS, money(), providerPaid(), RECONCILIATION_LABEL, TreasuryService, createTesoreria(), day, meta() (+1 more)

### Community 85 - "e2e-examen.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 86 - "convocatorias: .quoteFee()"
Cohesion: 0.18
Nodes (8): CallSummary, DocumentRecord, EnrollmentStatsProvider, QuotaCategoryRecord, RequirementRecord, SubmodalityRecord, SyllabusRecord, ADR-0002

### Community 87 - "session-policy.ts"
Cohesion: 0.24
Nodes (8): evaluateRefresh(), IDLE_LIMIT_SECONDS, RefreshDecision, SessionState, ADR-0006, minutesAgo(), now, session()

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

### Community 95 - "configuracion-queries.ts"
Cohesion: 0.38
Nodes (3): ConfiguracionQueries, shortDate(), toLimaIso()

### Community 98 - "stage.ts"
Cohesion: 0.12
Nodes (16): stages, nextMilestone(), Stage, StageKind, StageScope, stagesInProgress(), StageStatus, stageStatus() (+8 more)

### Community 100 - "StaffAdmin"
Cohesion: 0.19
Nodes (3): StaffAdmin, temporaryPassword(), PasswordHasher

### Community 101 - "payments.test.ts: payments.test.ts"
Cohesion: 0.32
Nodes (5): confirmWith(), fakeJpeg(), register(), signed(), t

### Community 102 - "tsconfig.json: backend/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, ../../tsconfig.base.json

### Community 103 - "ref_vitest"
Cohesion: 0.08
Nodes (13): movableClock(), clock, secrets, t, clock, failFor, FakeQueue, handled (+5 more)

### Community 108 - "payment-rules.ts"
Cohesion: 0.14
Nodes (15): backendDir, envFile, gw, missing, ADR-0016, AttemptResultDto, PaymentStatusDto, ATTEMPT_LABEL (+7 more)

### Community 112 - "notification-service.ts"
Cohesion: 0.20
Nodes (11): Recipient, RecordingEmailSender, Segment, DEFAULT_TEMPLATES, escape(), fill(), TemplateKey, limaTime() (+3 more)

### Community 113 - "e2e-expediente.mjs: e2e-expediente.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 114 - "allowScripts"
Cohesion: 0.20
Nodes (10): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+2 more)

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 117 - "e2e-inscripcion.mjs"
Cohesion: 0.29
Nodes (4): errors, ADR-0015, photo, width

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
Nodes (27): closesIn(), dateRange(), daysUntil(), limaDay(), longDate(), shortDate(), STAGE_STATUS_LABEL, time() (+19 more)

### Community 130 - "optimizar-imagenes.mjs"
Cohesion: 0.22
Nodes (7): sharp@^0.34.5, sharp, base, dir, require, sharp, WIDTHS

### Community 131 - "apiErrorMessage"
Cohesion: 0.05
Nodes (16): AdmittedListDto, apiErrorMessage(), ExamRoomDto, MyResultDto, PaymentsAdminPage, FindRoomPage, MyInscriptionPage, ReinscriptionPage (+8 more)

### Community 132 - "ngsw-config.json"
Cohesion: 0.40
Nodes (4): assetGroups, index, navigationUrls, $schema

### Community 133 - "screenshots-panel.mjs"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

### Community 135 - "accounts.test.ts"
Cohesion: 0.15
Nodes (12): FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, activeAccount(), clock (+4 more)

### Community 144 - "SiteAssets"
Cohesion: 0.38
Nodes (3): SiteAssets, createConfiguracionModule(), configuracionRoutes()

### Community 145 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, ng, start, test, watch

## Knowledge Gaps
- **136 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+131 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1243 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `apiErrorMessage` to `api.service.ts`, `Sesión del panel (frontend)`, `@angular/core`, `attendance.ts`, `format.ts`, `dossiers.ts`, `inbox.ts`, `SecurityPage`, `AdminSession`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `admin-login.ts`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `OnlinePayment`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `InscriptionsAdminPage`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `portal admin: KnowledgeAdminPage`, `portal admin: SystemAdminPage`, `portal admin: Component`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `CasesAdminPage`, `portal admin: DisqualifiedAdminPage`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _136 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.02862840051274747 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `Contenido del portal (admin)` to `NotificationService`, `auth-service.ts`, `exam-service.ts`, `seguridad/index.ts`, `Servicio de asistencia`, `inscription-service.ts`, `SiteAssets`, `Servicio de expedientes`, `middleware.ts`, `Db`, `ResultsService`, `Rutas del panel (backend)`, `dossier-service.ts`, `ficha-service.ts`, `AssistantService`, `pagos: PaymentService`, `examenes/presentation/routes.ts`, `assistant-service.ts`, `pagos: money()`, `StaffAdmin`, `notification-service.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.03565323565323565 - nodes in this community are weakly interconnected._
- **Why does `@angular/core` connect `@angular/core` to `api.service.ts`, `Sesión del panel (frontend)`, `format.ts`, `attendance.ts`, `apiErrorMessage`, `dossiers.ts`, `Convocatoria (panel)`, `inbox.ts`, `frontend/package.json`, `AdminSession`, `ubigeo.service.ts`, `DailyChart`, `admin-login.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `@angular/core` be split into smaller, more focused modules?**
  _Cohesion score 0.04965920155793573 - nodes in this community are weakly interconnected._