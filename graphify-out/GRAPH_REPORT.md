# Graph Report - proyectofinal  (2026-11-04)

## Corpus Check
- 291 files · ~194,540 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .scss 5, (none) 4, .woff 4)

## Summary
- 3044 nodes · 7391 edges · 153 communities (112 shown, 41 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 224 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `25c90543`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- @angular/core
- Outbox
- NotificationService
- usuariosRoutes
- Páginas del panel y errores
- Cliente API del portal
- ficha-service.ts
- seguridad/index.ts
- Contenido del portal (admin)
- Servicio de asistencia
- attendance.ts
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
- exam-service.ts
- Rutas del panel (backend)
- micuentaweb.ts
- rds.ts
- Personal y scripts de acceso
- pagos/index.ts
- dependencies
- Exámenes (panel)
- Formulario de inscripción
- usuarios/index.ts
- src/app.ts
- Proveedor de IA (asistente)
- Pruebas E2E con Playwright
- ConvocatoriasRepository
- payments-server-check.test.ts
- Convocatoria (panel)
- InscriptionsAdminPage
- admin.test.ts: movableClock()
- .now
- ref_node_path
- asistente: AssistantService
- asistente: tools.ts
- package.json: scripts
- updates
- ci.yml
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- handle
- prisma.ts
- convocatorias: .listFees()
- scripts
- portal admin: ResultsAdminPage
- tsconfig.base.json: tsconfig.base.json
- allowScripts
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
- payment-service.ts
- examenes/presentation/routes.ts
- seguridad: totp.ts
- dossier.test.ts: dossier.test.ts
- pending-features.test.ts: pending-featur
- pagos: money()
- e2e-examen.mjs
- convocatorias: .quoteFee()
- e2e-inscripcion.mjs
- notification-service.ts
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
- assistant.test.ts
- CasesAdminPage
- content.ts: seed/content.ts
- resultados/presentation/routes.ts
- assistant-rules.ts
- staff-recovery.test.ts
- portal admin: DisqualifiedAdminPage
- scripts
- ubigeo.service.ts
- izipay-gateway.ts
- exams.ts: seed/exams.ts
- identity.ts: identity.ts
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- format.ts
- portal public: SyllabusPage
- LocalFileStorage
- rxjs
- SiteImages
- screenshots-panel.mjs
- VacancyImport
- synthetic-identities.ts
- micuentaweb.ts
- fee-calculator.test.ts
- AdminShell
- AuditAdminPage
- ref_vitest
- StaffAuthService
- devDependencies
- ApplicationDocuments
- results.ts
- global-setup.ts
- attendancePdf
- usuarios/presentation/routes.ts
- treasury.ts
- FichaService
- IzipayPaymentGateway
- KrClient
- e2e-cuenta.mjs

## God Nodes (most connected - your core abstractions)
1. `RequestMeta` - 155 edges
2. `apiErrorMessage()` - 106 edges
3. `notFound()` - 101 edges
4. `Db` - 85 edges
5. `ApiService` - 85 edges
6. `@angular/core` - 79 edges
7. `validationError()` - 65 edges
8. `businessRule()` - 64 edges
9. `Clock` - 62 edges
10. `AuditLog` - 60 edges

## Surprising Connections (you probably didn't know these)
- `StaffSession` --references--> `TokenDto`  [EXTRACTED]
  apps/backend/src/modules/usuarios/application/staff-auth-service.ts → packages/contracts/src/index.ts
- `Row` --references--> `DossierDto`  [EXTRACTED]
  apps/frontend/src/app/features/admin/pages/dossiers.ts → packages/contracts/src/index.ts
- `quote()` --calls--> `quoteFee()`  [EXTRACTED]
  apps/backend/tests/unit/convocatorias/fee-calculator.test.ts → apps/backend/src/modules/convocatorias/domain/fee-calculator.ts
- `YapeSessionDto` --references--> `YapeGateway`  [EXTRACTED]
  apps/backend/src/modules/pagos/application/payment-service.ts → apps/backend/src/modules/pagos/domain/ports.ts
- `createReportesModule()` --indirect_call--> `toPdf()`  [INFERRED]
  apps/backend/src/modules/reportes/index.ts → apps/backend/src/modules/reportes/infrastructure/exporters.ts

## Import Cycles
- None detected.

## Communities (153 total, 41 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.03
Nodes (88): OptionRecord, apiErrorCode(), apiErrorDetails(), ApiHttpError, ReinscriptionCheck, SubmodalityDto, ADR-0010, ADR-0015 (+80 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.03
Nodes (57): AdminSession, CLIENT, Query, StaffMe, ADR-0018, ADR-0022, shortDateTime(), adminRoutes (+49 more)

### Community 2 - "@angular/core"
Cohesion: 0.04
Nodes (40): appConfig, routes, ADR-0015, ADR-0018, CLIENT, ADR-0015, FichaVerification, docBySlug() (+32 more)

### Community 3 - "Outbox"
Cohesion: 0.15
Nodes (7): checkDocument(), CheckedFile, MAX_DOCUMENT_BYTES, EVIDENCE, EvidenceInput, SupportCases, Outbox

### Community 4 - "NotificationService"
Cohesion: 0.18
Nodes (7): day(), hour(), NotificationService, escape(), fill(), meta(), notificacionesRoutes()

### Community 5 - "usuariosRoutes"
Cohesion: 0.10
Nodes (22): AuthService, sha256(), describeDevice(), ProfileService, StaffSession, applicantCodeFromSequence(), COMMON, EDITABLE_FIELDS (+14 more)

### Community 6 - "Páginas del panel y errores"
Cohesion: 0.05
Nodes (20): AdmittedListDto, apiErrorMessage(), ExamRoomDto, MyResultDto, Person, PaymentsAdminPage, Room, Venue (+12 more)

### Community 8 - "ficha-service.ts"
Cohesion: 0.16
Nodes (27): ENTRY, longDate(), OrdenPagoService, stamp(), toPdf(), admissionCertificatePdf(), assets, BOLD (+19 more)

### Community 9 - "seguridad/index.ts"
Cohesion: 0.08
Nodes (33): ALL, byRole, hasPermission(), Permission, PERMISSIONS, permissionsOf(), STAFF_ROLES, ADR-0018 (+25 more)

### Community 10 - "Contenido del portal (admin)"
Cohesion: 0.08
Nodes (11): AdminDeps, ContentAdmin, sniff(), CallAdmin, iso(), CatalogAdmin, CepreAwardees, SecurityAdmin (+3 more)

### Community 11 - "Servicio de asistencia"
Cohesion: 0.15
Nodes (6): ExamInfo, ExamService, iso(), roomInfo(), examenesRoutes(), businessRule()

### Community 12 - "attendance.ts"
Cohesion: 0.08
Nodes (25): dependencies, @angular/common@22.2.3, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, rxjs@7.8.2 (+17 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (42): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+34 more)

### Community 14 - "InscriptionService"
Cohesion: 0.13
Nodes (7): InscriptionService, longDate(), shortDate(), maskDocument(), createInscripcionesModule(), inscripcionesRoutes(), nextCounterValue()

### Community 15 - "inscription-service.ts"
Cohesion: 0.13
Nodes (23): InscriptionInput, InscriptionSummary, NO_REINSCRIPTION, PaymentContext, ADR-0015, ADR-0017, CAMPUSES, ECONOMIC_DEPENDENCY (+15 more)

### Community 16 - "Carga directa a S3"
Cohesion: 0.09
Nodes (17): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, Row (+9 more)

### Community 17 - "lambda-worker.ts"
Cohesion: 0.06
Nodes (35): application, handler, ADR-0009, application, handler(), processQueue(), SqsEvent, ADR-0012 (+27 more)

### Community 18 - "scripts"
Cohesion: 0.15
Nodes (14): description, devDependencies, concurrently@10.0.6, playwright-core@1.64.1, typescript@6.0.3, engines, node, concurrently (+6 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.08
Nodes (33): devDependencies, concurrently@10.0.6, esbuild@0.28.2, pino-pretty@13.2.0, prisma@7.10.1, supertest@7.3.1, tsx@4.23.15, @types/cookie-parser@1.4.10 (+25 more)

### Community 20 - "Servicio de expedientes"
Cohesion: 0.18
Nodes (6): DossierService, iso(), latest(), expedientesRoutes(), meta(), sendFile()

### Community 21 - "middleware.ts"
Cohesion: 0.12
Nodes (20): ADR-0017, applicant, ADR-0010, ADR-0018, inscriptionSchema, meta(), name, ubigeo (+12 more)

### Community 22 - "validationError"
Cohesion: 0.12
Nodes (18): Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus, OBSERVE_HOURS (+10 more)

### Community 23 - "Revisión de resultados"
Cohesion: 0.09
Nodes (21): MODALITY_LABEL, ResultPerson, ResultsPorts, Answers, computeScore(), Condition, CONDITION_LABEL, Contender (+13 more)

### Community 24 - "exam-service.ts"
Cohesion: 0.10
Nodes (25): RoomInfo, ExamInput, ExamInscriptions, ExamPerson, ExamRow, ExamStructure, MODALITY_LABEL, RoomRow (+17 more)

### Community 25 - "Rutas del panel (backend)"
Cohesion: 0.13
Nodes (18): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+10 more)

### Community 26 - "micuentaweb.ts"
Cohesion: 0.15
Nodes (12): PaymentSessionDto, CheckoutRequest, CheckoutSession, isValidHex(), KrAnswer, KrTransaction, MiCuentaWebConfig, MiCuentaWebGateway (+4 more)

### Community 27 - "rds.ts"
Cohesion: 0.23
Nodes (11): pg@8.23.1, backendDir, caFile, check(), client(), envFile, migrate(), setup() (+3 more)

### Community 28 - "Personal y scripts de acceso"
Cohesion: 0.07
Nodes (24): argon2@0.45.1, db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], db, [email, file = '.admin-inicial.txt'], totpService, SecretBox, Argon2Hasher (+16 more)

### Community 29 - "pagos/index.ts"
Cohesion: 0.14
Nodes (12): ADR-0007, ADR-0016, ADR-0019, YapeChargeRequest, CulqiCharge, CulqiConfig, CulqiYapeGateway, parseCulqiCharge() (+4 more)

### Community 30 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, @aws-sdk/client-sqs@^3.1161.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, cookie-parser@1.4.7, exceljs@^4.4.0, express@5.3.0 (+20 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "usuarios/index.ts"
Cohesion: 0.08
Nodes (18): token, AccessService, Totp, AuthDeps, IdentityTokenPayload, ADR-0018, DocumentType, IdentityLookupResult (+10 more)

### Community 34 - "src/app.ts"
Cohesion: 0.07
Nodes (38): db, AppOverrides, backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012 (+30 more)

### Community 35 - "Proveedor de IA (asistente)"
Cohesion: 0.19
Nodes (14): LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017, OpenRouterProvider (+6 more)

### Community 36 - "Pruebas E2E con Playwright"
Cohesion: 0.12
Nodes (7): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900050', email = 'e2e.micuentaweb@example.com', card = '4970100000000055', out = '.screens/pago-sandbox'], jobs, [out = '.screens', ...routes], report, widths

### Community 37 - "ConvocatoriasRepository"
Cohesion: 0.16
Nodes (3): CallSummary, ConvocatoriasRepository, SubmodalityRecord

### Community 38 - "payments-server-check.test.ts"
Cohesion: 0.32
Nodes (5): browserApproval(), fakeJpeg(), gateway, register(), t

### Community 39 - "Convocatoria (panel)"
Cohesion: 0.12
Nodes (12): Awardee, Awardees, CallAdminPage, CallDetail, Fee, fromLima(), ImportPreview, ImportRow (+4 more)

### Community 41 - "admin.test.ts: movableClock()"
Cohesion: 0.09
Nodes (18): syntheticCheckDigit(), fixedClock(), MemoryEmailSender, MemoryFileStorage, REDACTED_PATHS, checkDigit, TEST_URL, testApp() (+10 more)

### Community 42 - ".now"
Cohesion: 0.09
Nodes (13): SessionMeta, SessionService, sha256(), ADR-0006, evaluateRefresh(), IDLE_LIMIT_SECONDS, RefreshDecision, SESSION_TTL (+5 more)

### Community 43 - "ref_node_path"
Cohesion: 0.11
Nodes (13): @aws-sdk/client-sesv2@^3.1158.0, dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile (+5 more)

### Community 44 - "asistente: AssistantService"
Cohesion: 0.23
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
Cohesion: 0.18
Nodes (16): main(), prisma, publicDocsDir, seedCall(), seedCatalog(), seedContent(), seedExams(), seedIdentity() (+8 more)

### Community 52 - "handle"
Cohesion: 0.16
Nodes (14): SiteAssets, announcementsQuery, configuracionRoutes(), booleanish, callCode, callParams, convocatoriasRoutes(), feeQuoteQuery (+6 more)

### Community 53 - "prisma.ts"
Cohesion: 0.08
Nodes (30): Application, KnowledgeAdmin, ToolDeps, ADR-0017, ConfiguracionQueries, DEFAULT_PARAMETERS, SITE_SLOTS, SiteSlot (+22 more)

### Community 54 - "convocatorias: .listFees()"
Cohesion: 0.15
Nodes (11): byPriority(), FeeInfo, FeeQuote, matches(), MilitaryCondition, Modality, quoteFee(), SchoolType (+3 more)

### Community 55 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:setup, db:start, db:stop, dev, dev:rds, izipay:check (+6 more)

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "allowScripts"
Cohesion: 0.20
Nodes (10): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+2 more)

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.16
Nodes (3): blankProgram(), blankReq(), CatalogAdminPage

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.11
Nodes (15): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+7 more)

### Community 61 - "admin-login.ts"
Cohesion: 0.14
Nodes (7): StaffStep, STEP_LABEL, ADR-0018, SecurityPage, ADR-0022, RecoveryCodes, ADR-0022

### Community 64 - "db.ts: db.ts"
Cohesion: 0.19
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "pagos: PaymentService"
Cohesion: 0.29
Nodes (4): PaymentService, formatAmount(), sha256Hex(), pagosRoutes()

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
Cohesion: 0.19
Nodes (3): iso(), ResultsService, resultadosRoutes()

### Community 74 - "exams.test.ts: exams.test.ts"
Cohesion: 0.16
Nodes (10): box, clock, codes, DNIS, fakeJpeg(), jump(), registerOrd(), secrets (+2 more)

### Community 78 - "portal cuenta: MyAccountPage"
Cohesion: 0.16
Nodes (4): MyAccountPage, base32Decode(), text, totp()

### Community 79 - "payment-service.ts"
Cohesion: 0.15
Nodes (15): Attempt, AttemptResultDto, PaymentStatusDto, ADR-0016, ADR-0019, Via, YapeSessionDto, AttemptStatus (+7 more)

### Community 80 - "examenes/presentation/routes.ts"
Cohesion: 0.14
Nodes (12): AttendanceService, iso(), INCIDENT_TYPES, IncidentType, createExamenesModule(), applicant, examBody, meta() (+4 more)

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
Cohesion: 0.17
Nodes (9): FeeCriteria, FeeRule, SurchargeRule, DocumentRecord, EnrollmentStatsProvider, QuotaCategoryRecord, RequirementRecord, SyllabusRecord (+1 more)

### Community 87 - "e2e-inscripcion.mjs"
Cohesion: 0.29
Nodes (4): errors, ADR-0015, photo, width

### Community 88 - "notification-service.ts"
Cohesion: 0.12
Nodes (18): Recipient, RecordingEmailSender, Segment, DEFAULT_TEMPLATES, TemplateKey, limaTime(), subscribeAccountNotifications(), EmailExtras (+10 more)

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

### Community 98 - "stage.ts"
Cohesion: 0.16
Nodes (9): stages, shortDate(), nextMilestone(), Stage, StageKind, StageScope, StageStatus, stageStatus() (+1 more)

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
Nodes (14): backendDir, envFile, gw, missing, ADR-0016, ATTEMPT_LABEL, ATTEMPT_TTL_SECONDS, newTransactionId() (+6 more)

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
Cohesion: 0.25
Nodes (7): applicant, Column, COVERAGE_COLUMNS, meta(), RESULT_COLUMNS, send(), ADR-0020

### Community 118 - "assistant-rules.ts"
Cohesion: 0.29
Nodes (9): AssistantReply, ADR-0017, asksForHuman(), LIMITS, maskPersonal(), NO_INFO_REPLY, SUGGESTIONS, SYSTEM_PROMPT (+1 more)

### Community 119 - "staff-recovery.test.ts"
Cohesion: 0.19
Nodes (11): group(), newRecoveryCodes(), normalizeRecoveryCode(), RECOVERY_CODE_COUNT, ADR-0022, clock, codes, login() (+3 more)

### Community 121 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, ng, start, test, watch

### Community 122 - "ubigeo.service.ts"
Cohesion: 0.17
Nodes (5): Department, District, Province, UbigeoService, UbigeoSelect

### Community 123 - "izipay-gateway.ts"
Cohesion: 0.16
Nodes (11): ProviderResult, PaymentGateway, SignedMessage, API, IzipayConfig, SDK, MockPaymentGateway, ADR-0007 (+3 more)

### Community 124 - "exams.ts: seed/exams.ts"
Cohesion: 0.40
Nodes (4): BUILDINGS, exams, rooms, venue

### Community 125 - "identity.ts: identity.ts"
Cohesion: 0.40
Nodes (4): consentDocument, disqualifiedPersons, permissions, roles

### Community 128 - "format.ts"
Cohesion: 0.07
Nodes (24): closesIn(), dateRange(), daysUntil(), limaDay(), longDate(), shortDate(), STAGE_STATUS_LABEL, time() (+16 more)

### Community 131 - "rxjs"
Cohesion: 0.11
Nodes (11): App, InboxDto, InboxPanel, Line, Msg, Panel, toLines(), ADR-0017 (+3 more)

### Community 133 - "screenshots-panel.mjs"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

### Community 135 - "synthetic-identities.ts"
Cohesion: 0.32
Nodes (6): ADR-0007, FIRST, scenarioFor(), SURNAMES, syntheticIdentities, SyntheticIdentity

### Community 136 - "micuentaweb.ts"
Cohesion: 0.14
Nodes (11): backendDir, envFile, gw, hmacKey, keys, missing, password, publicKey (+3 more)

### Community 137 - "fee-calculator.test.ts"
Cohesion: 0.15
Nodes (11): base, CEPRE_EXTEMP, CEPRE_REGULAR, EXO_EXTEMP, fees, ORD_EXTEMP, quote(), REGULAR (+3 more)

### Community 140 - "ref_vitest"
Cohesion: 0.16
Nodes (8): fakeJpeg(), register(), t, yape, minutesAgo(), now, session(), ADR-0014

### Community 142 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @angular/build@22.2.4, @angular/cli@22.2.4, @angular/compiler-cli@22.2.3, jsdom@30.0.0, typescript@6.0.3, vitest@5.0.5, typescript (+5 more)

### Community 144 - "results.ts"
Cohesion: 0.25
Nodes (7): Batch, ExamResults, Issue, STATUS, TAG, VersionDetail, VersionSummary

### Community 145 - "global-setup.ts"
Cohesion: 0.25
Nodes (5): embedded-postgres@16.14.0-beta.17, backendDir, dataDir, TEST_DATABASE_URL, embedded-postgres

### Community 146 - "attendancePdf"
Cohesion: 0.46
Nodes (7): attendancePdf(), eligibleListPdf(), examSlipPdf(), footer(), hour(), longDate(), render()

### Community 147 - "usuarios/presentation/routes.ts"
Cohesion: 0.25
Nodes (7): lookupSchema, phone, profileSchema, registerSchema, requireClientHeader(), ADR-0015, ADR-0018

### Community 148 - "treasury.ts"
Cohesion: 0.29
Nodes (6): Annulment, Item, RESULTS, Run, RunDetail, Summary

## Knowledge Gaps
- **133 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+128 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1200 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `Páginas del panel y errores` to `api.service.ts`, `Sesión del panel (frontend)`, `@angular/core`, `rxjs`, `format.ts`, `AuditAdminPage`, `attendance.ts`, `Carga directa a S3`, `results.ts`, `treasury.ts`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `InscriptionsAdminPage`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `admin-login.ts`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `OnlinePayment`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `portal admin: KnowledgeAdminPage`, `portal admin: SystemAdminPage`, `portal admin: Component`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `CasesAdminPage`, `portal admin: DisqualifiedAdminPage`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _133 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.030479988605611737 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `Contenido del portal (admin)` to `NotificationService`, `usuariosRoutes`, `VacancyImport`, `ficha-service.ts`, `seguridad/index.ts`, `Servicio de asistencia`, `StaffAuthService`, `InscriptionService`, `ApplicationDocuments`, `inscription-service.ts`, `usuarios/presentation/routes.ts`, `Servicio de expedientes`, `middleware.ts`, `validationError`, `Revisión de resultados`, `exam-service.ts`, `Rutas del panel (backend)`, `usuarios/index.ts`, `asistente: AssistantService`, `handle`, `prisma.ts`, `pagos: PaymentService`, `businessRule`, `payment-service.ts`, `examenes/presentation/routes.ts`, `pagos: money()`, `notification-service.ts`, `StaffAdmin`, `resultados/presentation/routes.ts`, `assistant-rules.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.03307560137457045 - nodes in this community are weakly interconnected._
- **Why does `@angular/core` connect `@angular/core` to `api.service.ts`, `Sesión del panel (frontend)`, `format.ts`, `rxjs`, `Páginas del panel y errores`, `Convocatoria (panel)`, `attendance.ts`, `Carga directa a S3`, `results.ts`, `treasury.ts`, `ubigeo.service.ts`, `admin-login.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `@angular/core` be split into smaller, more focused modules?**
  _Cohesion score 0.04240506329113924 - nodes in this community are weakly interconnected._