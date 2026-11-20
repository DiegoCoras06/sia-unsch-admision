# Graph Report - proyectofinal  (2026-11-20)

## Corpus Check
- 321 files · ~242,316 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .scss 5, (none) 4, .woff 4)

## Summary
- 3330 nodes · 7872 edges · 161 communities (116 shown, 45 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 256 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8d0a1e3a`
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
- examenes/presentation/routes.ts
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
- exam-service.ts
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
- Argon2Hasher
- dossier-service.ts
- dossier-service.ts
- package.json: scripts
- updates
- ci.yml
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- format.ts
- auth-service.ts
- lambda-worker.ts
- businessRule
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
- fee-calculator.test.ts
- ficha.test.ts
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
- session-policy.ts
- overrides
- DailyChart
- PrismaInscriptionRepository
- rendimiento.js
- InscriptionsAdminPage
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
- allowScripts
- inscription-service.ts
- resultados/presentation/routes.ts
- server.ts
- VenuesAdminPage
- admin-shell.ts
- e2e-resultados.mjs
- application/usability-survey.ts
- e2e-inscripcion.mjs
- CasesAdminPage
- optimizar-imagenes.mjs
- assistant-rules.ts
- VacancyImport
- LocalFileStorage
- e2e-expediente.mjs
- SecurityPage
- screenshots-panel.mjs
- convocatorias/presentation/routes.ts
- seed/exams.ts
- AdminDeps
- identity.ts
- jest.config.mjs
- SyllabusPage
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
- `quote()` --calls--> `quoteFee()`  [EXTRACTED]
  apps/backend/tests/unit/convocatorias/fee-calculator.test.ts → apps/backend/src/modules/convocatorias/domain/fee-calculator.ts
- `createReportesModule()` --indirect_call--> `toPdf()`  [INFERRED]
  apps/backend/src/modules/reportes/index.ts → apps/backend/src/modules/reportes/infrastructure/exporters.ts

## Import Cycles
- None detected.

## Communities (161 total, 45 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.04
Nodes (68): CLIENT, ADR-0015, ApiHttpError, FichaVerification, InboxDto, SubmodalityDto, ADR-0010, ADR-0015 (+60 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.03
Nodes (83): CLIENT, Query, StaffMe, ADR-0018, ADR-0022, shortDateTime(), adminRoutes, ADR-0018 (+75 more)

### Community 2 - "format.ts"
Cohesion: 0.09
Nodes (17): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, Row (+9 more)

### Community 3 - "admin-routes.ts"
Cohesion: 0.13
Nodes (18): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+10 more)

### Community 4 - "NotificationService"
Cohesion: 0.20
Nodes (5): day(), hour(), NotificationService, meta(), notificacionesRoutes()

### Community 5 - "convocatorias/domain/ports.ts"
Cohesion: 0.11
Nodes (13): FeeInfo, FeeQuote, Money, CallSummary, DocumentRecord, EnrollmentStatsProvider, OptionRecord, QuotaCategoryRecord (+5 more)

### Community 6 - "apiErrorMessage"
Cohesion: 0.04
Nodes (19): AdmittedListDto, apiErrorMessage(), ExamRoomDto, MyResultDto, AuditAdminPage, PaymentsAdminPage, FindRoomPage, MyInscriptionPage (+11 more)

### Community 8 - "examenes/presentation/routes.ts"
Cohesion: 0.25
Nodes (7): applicant, examBody, meta(), pdf(), roomBody, venueBody, when

### Community 9 - "generar.ts"
Cohesion: 0.10
Nodes (19): backend, components, DESCRIPCION_MODULO, doc, files, fromSpec, Json, MODULOS (+11 more)

### Community 10 - "RequestMeta"
Cohesion: 0.08
Nodes (12): AdminDeps, ContentAdmin, SiteAssets, sniff(), CallAdmin, iso(), CatalogAdmin, SecurityAdmin (+4 more)

### Community 11 - "Db"
Cohesion: 0.08
Nodes (16): Application, AppOverrides, ToolDeps, DEFAULT_PARAMETERS, ConvocatoriasQueries, Column, CASE_STATUS_LABEL, CASE_TYPE_LABEL (+8 more)

### Community 12 - "frontend/package.json"
Cohesion: 0.07
Nodes (36): dependencies, @angular/common@22.2.3, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/router@22.2.3, @angular/service-worker@22.2.3, rxjs@7.8.2 (+28 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (43): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+35 more)

### Community 14 - "results-service.ts"
Cohesion: 0.09
Nodes (21): MODALITY_LABEL, ResultPerson, ResultsPorts, Answers, computeScore(), Condition, CONDITION_LABEL, Contender (+13 more)

### Community 15 - "inscription-service.ts"
Cohesion: 0.10
Nodes (7): InscriptionService, longDate(), shortDate(), maskDocument(), inscripcionesRoutes(), applicantCodeFromSequence(), districtLabel()

### Community 16 - "seguridad/index.ts"
Cohesion: 0.07
Nodes (29): ALL, byRole, hasPermission(), PERMISSIONS, permissionsOf(), STAFF_ROLES, ADR-0018, Totp (+21 more)

### Community 17 - "AdminSession"
Cohesion: 0.11
Nodes (6): AdminSession, Count, Dashboard, ReportKind, REPORTS, Usability

### Community 18 - "package.json"
Cohesion: 0.15
Nodes (14): description, devDependencies, concurrently@10.0.6, playwright-core@1.64.1, typescript@6.0.3, engines, node, concurrently (+6 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.06
Nodes (44): devDependencies, concurrently@10.0.6, effect@3.22.5, esbuild@0.28.2, jest@30.5.2, @jest/globals@30.5.2, pino-pretty@13.2.0, prisma@7.10.1 (+36 more)

### Community 20 - "handle"
Cohesion: 0.12
Nodes (26): ADR-0017, announcementsQuery, configuracionRoutes(), applicant, ADR-0010, ADR-0018, inscriptionSchema, meta() (+18 more)

### Community 21 - "validationError"
Cohesion: 0.07
Nodes (29): KnowledgeAdmin, createAsistenteModule(), ADR-0017, FORMATS, VacancyImportPreview, VacancyImportRow, AwardeeRowError, CepreAwardees (+21 more)

### Community 22 - "inscription-rules.ts"
Cohesion: 0.19
Nodes (12): InscriptionInput, CAMPUSES, ECONOMIC_DEPENDENCY, initialStatus(), isPlausibleGraduationYear(), MARITAL_STATUS, MODALITIES, PAYMENT_ENTITIES (+4 more)

### Community 23 - "exam-service.ts"
Cohesion: 0.06
Nodes (65): attendancePdf(), eligibleListPdf(), ExamInfo, examSlipPdf(), footer(), hour(), longDate(), render() (+57 more)

### Community 24 - "PrismaPaymentRepository"
Cohesion: 0.18
Nodes (4): PrismaPaymentRepository, toAttempt(), toOrder(), withOrder()

### Community 25 - "verificar.mjs"
Cohesion: 0.09
Nodes (18): ATRIBUTOS, audit, backend, destino, dirResultados, hora, hoy, jest (+10 more)

### Community 26 - "treasuryRoutes"
Cohesion: 0.32
Nodes (5): money(), providerPaid(), TreasuryService, meta(), treasuryRoutes()

### Community 27 - "ref_node_url"
Cohesion: 0.07
Nodes (21): dotenv@18.0.9, api, backendDir, envFile, ADR-0019, files, root, s3 (+13 more)

### Community 28 - "accounts.test.ts"
Cohesion: 0.14
Nodes (13): FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, REDACTED_PATHS, activeAccount() (+5 more)

### Community 29 - "PaymentGateway"
Cohesion: 0.11
Nodes (13): ProviderResult, ChargeRequest, ADR-0007, ADR-0024, MOCK_TOKENS, ADR-0007, culqi, FakeCulqi (+5 more)

### Community 30 - "dependencies"
Cohesion: 0.06
Nodes (32): dependencies, @aws-sdk/client-sesv2@^3.1158.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, cookie-parser@1.4.7, exceljs@^4.4.0, express@5.3.0 (+24 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "ConvocatoriasQueries"
Cohesion: 0.23
Nodes (5): createConvocatoriasModule(), convocatoriasRoutes(), AreaDto, OfficialDocumentDto, StatsDto

### Community 35 - "rule-based-provider.ts"
Cohesion: 0.19
Nodes (14): LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017, OpenRouterProvider (+6 more)

### Community 36 - "ref_node_fs"
Cohesion: 0.09
Nodes (10): db, [email, file = '.admin-inicial.txt'], playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900028', out = '.screens/cuenta'], ADR-0015, jobs, [out = '.screens', ...routes] (+2 more)

### Community 37 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:setup, db:start, db:stop, dev, dev:rds, izipay:check (+6 more)

### Community 38 - "ExamService"
Cohesion: 0.12
Nodes (6): AttendanceService, iso(), ExamService, iso(), roomInfo(), examenesRoutes()

### Community 40 - "env.ts"
Cohesion: 0.12
Nodes (14): application, handler, ADR-0009, Env, schema, ADR-0010, ADR-0017, ADR-0018 (+6 more)

### Community 41 - "attendance.ts"
Cohesion: 0.11
Nodes (10): AssetMap, SiteImages, BoardExam, BoardRoom, CheckIn, Incident, INCIDENTS, Pending (+2 more)

### Community 42 - "Tx"
Cohesion: 0.13
Nodes (9): AccessService, SessionMeta, SessionService, sha256(), ADR-0006, deviceLabel(), SESSION_TTL, sanitize() (+1 more)

### Community 43 - "Argon2Hasher"
Cohesion: 0.13
Nodes (14): Argon2Hasher, staff(), staff(), staff(), staff(), makeStaff(), box, clock (+6 more)

### Community 44 - "dossier-service.ts"
Cohesion: 0.09
Nodes (24): Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus, OBSERVE_HOURS (+16 more)

### Community 45 - "dossier-service.ts"
Cohesion: 0.19
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
Cohesion: 0.18
Nodes (16): main(), prisma, publicDocsDir, seedCall(), seedCatalog(), seedContent(), seedExams(), seedIdentity() (+8 more)

### Community 52 - "format.ts"
Cohesion: 0.10
Nodes (17): ReinscriptionCheck, dateRange(), dateTime(), longDate(), shortDate(), STAGE_STATUS_LABEL, time(), ContactForm (+9 more)

### Community 53 - "auth-service.ts"
Cohesion: 0.06
Nodes (39): token, Permission, IdentityTokenPayload, ADR-0018, ACTIONS, describeDevice(), ProfileService, COMMON (+31 more)

### Community 54 - "lambda-worker.ts"
Cohesion: 0.15
Nodes (14): @aws-sdk/client-sqs@^3.1161.0, application, handler(), processQueue(), SqsEvent, ADR-0012, ADR-0021, QueuedEvent (+6 more)

### Community 55 - "businessRule"
Cohesion: 0.19
Nodes (4): iso(), ResultsService, resultadosRoutes(), businessRule()

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "@angular/forms"
Cohesion: 0.14
Nodes (8): StaffStep, STEP_LABEL, ADR-0018, ADR-0022, RecoveryCodes, ADR-0022, ActiveSessions, SessionDto

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.09
Nodes (17): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+9 more)

### Community 61 - "Tx"
Cohesion: 0.26
Nodes (12): AttemptRecord, AttemptWithOrder, OrderRecord, SettleData, SettleOutcome, AttemptResultDto, PaymentStatusDto, AttemptStatus (+4 more)

### Community 64 - "db.ts: db.ts"
Cohesion: 0.19
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "payment-rules.ts"
Cohesion: 0.18
Nodes (9): PaymentService, ATTEMPT_LABEL, ATTEMPT_TTL_SECONDS, formatAmount(), newTransactionId(), orderNumberFor(), ADR-0019, ADR-0024 (+1 more)

### Community 68 - "PrismaConvocatoriasRepository"
Cohesion: 0.13
Nodes (3): PrismaConvocatoriasRepository, toFee(), fees

### Community 69 - "notifications.test.ts"
Cohesion: 0.09
Nodes (14): argon2@0.45.1, db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], totpService, SecretBox, box, clock, t (+6 more)

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
Nodes (38): @angular/platform-browser@22.2.3, App, appConfig, ADR-0023, routes, ADR-0015, ADR-0018, CallStore (+30 more)

### Community 80 - "inscription.ts"
Cohesion: 0.06
Nodes (21): apiErrorCode(), apiErrorDetails(), Department, District, Province, UbigeoService, Draft, FIELD_TARGET (+13 more)

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

### Community 85 - "fee-calculator.test.ts"
Cohesion: 0.14
Nodes (12): FeeRule, SurchargeRule, base, CEPRE_EXTEMP, CEPRE_REGULAR, EXO_EXTEMP, ORD_EXTEMP, quote() (+4 more)

### Community 86 - "ficha.test.ts"
Cohesion: 0.14
Nodes (6): embedded-postgres@16.14.0-beta.17, backendDir, dataDir, TEST_DATABASE_URL, t, embedded-postgres

### Community 88 - "convocatorias/index.ts"
Cohesion: 0.09
Nodes (27): ConfiguracionQueries, shortDate(), SITE_SLOTS, SiteSlot, TYPES, createConfiguracionModule(), byPriority(), FeeCriteria (+19 more)

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
Cohesion: 0.11
Nodes (15): fixedClock(), loadEnv(), MemoryEmailSender, MemoryFileStorage, checkDigit, TEST_URL, testApp(), t (+7 more)

### Community 104 - "InscriptionUnitOfWork"
Cohesion: 0.14
Nodes (4): InscriptionUnitOfWork, InscriptionSummary, InscriptionStatus, PrismaInscriptionUnitOfWork

### Community 107 - "ubigeo.ts"
Cohesion: 0.29
Nodes (6): Department, departments, District, districtIndex, isValidDistrict(), Province

### Community 108 - "usuariosRoutes"
Cohesion: 0.17
Nodes (7): AuthService, sha256(), StaffSession, normalizeEmail(), passwordIssues(), usuariosRoutes(), TokenDto

### Community 112 - "src/app.ts"
Cohesion: 0.06
Nodes (47): db, backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012, ADR-0021 (+39 more)

### Community 113 - "e2e-examen.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 114 - "rds.ts"
Cohesion: 0.23
Nodes (11): pg@8.23.1, backendDir, caFile, check(), client(), envFile, migrate(), setup() (+3 more)

### Community 115 - "ref_vitest"
Cohesion: 0.11
Nodes (11): movableClock(), clock, secrets, t, clock, failFor, FakeQueue, handled (+3 more)

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 118 - "tools.ts"
Cohesion: 0.13
Nodes (7): AssistantTools, ESTADO_ETAPA, fecha(), STOP, terms(), ToolResult, ADR-0017

### Community 119 - "session-policy.ts"
Cohesion: 0.24
Nodes (8): evaluateRefresh(), IDLE_LIMIT_SECONDS, RefreshDecision, SessionState, ADR-0006, minutesAgo(), now, session()

### Community 120 - "overrides"
Cohesion: 0.17
Nodes (12): glob, glob, glob, overrides, effect, jest-config, @jest/reporters, jest-runtime (+4 more)

### Community 122 - "PrismaInscriptionRepository"
Cohesion: 0.16
Nodes (3): ApplicationFilter, PrismaInscriptionRepository, where()

### Community 123 - "rendimiento.js"
Cohesion: 0.13
Nodes (6): ETAPAS, MAXIMO, options, options, options, USUARIOS

### Community 125 - "PrismaSurveyRepository"
Cohesion: 0.25
Nodes (3): SurveyAlreadyAnsweredError, SurveyRepository, PrismaSurveyRepository

### Community 128 - "@angular/core"
Cohesion: 0.05
Nodes (19): closesIn(), daysUntil(), limaDay(), ApplicationFinder, CAMPUS, HomePage, PRINCIPLES, PRIORITY (+11 more)

### Community 129 - "AssistantService"
Cohesion: 0.23
Nodes (3): AssistantService, asistenteRoutes(), meta()

### Community 131 - "assistant.test.ts"
Cohesion: 0.29
Nodes (5): ai, basic, scripted, toolCall(), usage

### Community 132 - "ngsw-config.json"
Cohesion: 0.40
Nodes (4): assetGroups, index, navigationUrls, $schema

### Community 135 - "allowScripts"
Cohesion: 0.20
Nodes (10): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+2 more)

### Community 136 - "inscription-service.ts"
Cohesion: 0.11
Nodes (15): AppRow, KINDS, ADR-0010, TYPES, NO_REINSCRIPTION, ADR-0015, ADR-0017, jpegSize() (+7 more)

### Community 137 - "resultados/presentation/routes.ts"
Cohesion: 0.25
Nodes (7): applicant, Column, COVERAGE_COLUMNS, meta(), RESULT_COLUMNS, send(), ADR-0020

### Community 138 - "server.ts"
Cohesion: 0.11
Nodes (19): application, background(), env, server, ticker, timer, warm(), warmer (+11 more)

### Community 141 - "admin-shell.ts"
Cohesion: 0.25
Nodes (4): NAV, NavItem, ROLE_NAMES, AdmConfirmHost

### Community 142 - "e2e-resultados.mjs"
Cohesion: 0.24
Nodes (7): admin, base32Decode(), comision, errors, health, login(), totp()

### Community 143 - "application/usability-survey.ts"
Cohesion: 0.40
Nodes (6): SurveyRecord, isValidSusAnswers(), SUS_STATEMENTS, SUS_TARGET, susGrade(), susScore()

### Community 145 - "e2e-inscripcion.mjs"
Cohesion: 0.29
Nodes (4): errors, ADR-0015, photo, width

### Community 147 - "optimizar-imagenes.mjs"
Cohesion: 0.12
Nodes (13): sharp@^0.35.5, sharp, left, out, require, root, sharp, top (+5 more)

### Community 148 - "assistant-rules.ts"
Cohesion: 0.29
Nodes (9): AssistantReply, ADR-0017, asksForHuman(), LIMITS, maskPersonal(), NO_INFO_REPLY, SUGGESTIONS, SYSTEM_PROMPT (+1 more)

### Community 151 - "e2e-expediente.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 153 - "screenshots-panel.mjs"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

### Community 154 - "convocatorias/presentation/routes.ts"
Cohesion: 0.33
Nodes (5): booleanish, callCode, callParams, feeQuoteQuery, optionsQuery

### Community 155 - "seed/exams.ts"
Cohesion: 0.40
Nodes (4): BUILDINGS, exams, rooms, venue

### Community 157 - "identity.ts"
Cohesion: 0.40
Nodes (4): consentDocument, disqualifiedPersons, permissions, roles

### Community 164 - "S3FileStorage"
Cohesion: 0.13
Nodes (6): @aws-sdk/client-s3@^3.1158.0, s3, S3FileStorage, client, storage, @aws-sdk/client-s3

## Knowledge Gaps
- **129 isolated node(s):** `ADR-0014`, `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019` (+124 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1359 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `apiErrorMessage` to `api.service.ts`, `Sesión del panel (frontend)`, `format.ts`, `@angular/core`, `InboxPanel`, `SystemAdminPage`, `VenuesAdminPage`, `AdminSession`, `CasesAdminPage`, `SecurityPage`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `attendance.ts`, `portal admin: AttendanceAdminPage`, `format.ts`, `portal admin: ResultsAdminPage`, `@angular/forms`, `portal admin: blankProgram()`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `OnlinePayment`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `@angular/core`, `inscription.ts`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `KnowledgeAdminPage`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `DisqualifiedAdminPage`, `InscriptionsAdminPage`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `ADR-0014`, `ADR-0018`, `ADR-0017` to the rest of the system?**
  _129 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.041220382992534894 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `RequestMeta` to `AssistantService`, `admin-routes.ts`, `NotificationService`, `examenes/presentation/routes.ts`, `inscription-service.ts`, `resultados/presentation/routes.ts`, `Db`, `results-service.ts`, `inscription-service.ts`, `application/usability-survey.ts`, `seguridad/index.ts`, `handle`, `assistant-rules.ts`, `validationError`, `VacancyImport`, `exam-service.ts`, `treasuryRoutes`, `AdminDeps`, `ExamService`, `dossier-service.ts`, `dossier-service.ts`, `auth-service.ts`, `businessRule`, `payment-rules.ts`, `convocatorias/index.ts`, `StaffAdmin`, `usuariosRoutes`, `src/app.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.03065739570164349 - nodes in this community are weakly interconnected._
- **Why does `@angular/core` connect `@angular/core` to `api.service.ts`, `Sesión del panel (frontend)`, `format.ts`, `@angular/core`, `apiErrorMessage`, `attendance.ts`, `frontend/package.json`, `admin-shell.ts`, `inscription.ts`, `AdminSession`, `format.ts`, `DailyChart`, `@angular/forms`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `format.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0915915915915916 - nodes in this community are weakly interconnected._