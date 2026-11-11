# Graph Report - proyectofinal  (2026-11-11)

## Corpus Check
- 289 files · ~193,783 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .scss 5, (none) 4, .woff 4)

## Summary
- 3015 nodes · 7287 edges · 139 communities (103 shown, 36 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 224 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `182d2708`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- @angular/router
- dossiers.ts
- NotificationService
- usuariosRoutes
- apiErrorMessage
- Cliente API del portal
- Argon2Hasher
- prisma.ts
- RequestMeta
- distribution.ts
- frontend/package.json
- Configuración de Angular
- AdminSession
- inscription-service.ts
- seguridad/index.ts
- lambda-worker.ts
- package.json
- Dependencias de desarrollo backend
- Servicio de expedientes
- middleware.ts
- Db
- ref_vitest
- @angular/forms
- admin-routes.ts
- @angular/core
- rds.ts
- results-service.ts
- pago-culqi.test.ts
- dependencies
- Exámenes (panel)
- Formulario de inscripción
- ref_node_crypto
- audit/audit.ts
- asistente/index.ts
- Pruebas E2E con Playwright
- ConvocatoriasRepository
- exam-service.ts
- Convocatoria (panel)
- env.ts
- ReportQueries
- .now
- culqi.ts
- staff-auth-service.ts
- forbidden
- package.json: scripts
- updates
- ci.yml
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- notifications.test.ts
- usuarios/index.ts
- ref_node_path
- createSeguridadModule
- portal admin: ResultsAdminPage
- tsconfig.base.json: tsconfig.base.json
- usuarios/presentation/routes.ts
- portal admin: blankProgram()
- call-2027-I.ts: call-2027-I.ts
- admin-login.ts
- portal admin: DossiersAdminPage
- portal admin: NotificationsAdminPage
- db.ts: db.ts
- PaymentService
- OnlinePayment
- S3FileStorage
- convocatorias: PrismaConvocatoriasReposi
- optimizar-imagenes.mjs
- results.test.ts: results.test.ts
- assistant.ts: Assistant
- package.json: contracts/package.json
- Outbox
- exams.test.ts: exams.test.ts
- portal admin: ContentAdminPage
- portal admin: TreasuryAdminPage
- portal admin: Component
- portal cuenta: MyAccountPage
- ubigeo.service.ts
- SecurityPage
- seguridad: totp.ts
- dossier.test.ts: dossier.test.ts
- pending-features.test.ts: pending-featur
- pagos: money()
- convocatorias/presentation/routes.ts
- convocatorias: .quoteFee()
- fee-calculator.test.ts
- .getCurrentCall
- portal admin: AdminLoginPage
- tsconfig.json: contracts/tsconfig.json
- e2e-resultados.mjs: e2e-resultados.mjs
- trazabilidad.mjs: trazabilidad.mjs
- catalog.ts: seed/catalog.ts
- session-policy.ts
- StaffAuthService
- portal admin: DashboardPage
- portal admin: KnowledgeAdminPage
- convocatorias-queries.ts
- portal admin: SystemAdminPage
- StaffAdmin
- payments.test.ts: payments.test.ts
- tsconfig.json: backend/tsconfig.json
- helpers.ts
- portal admin: Component
- portal cuenta: CreateAccountPage
- portal public: ComplaintsPage
- exam-rules.ts
- InboxPanel
- portal admin: AdmissionsAdminPage
- portal cuenta: AccountLoginPage
- site-header.ts: SiteHeader
- src/app.ts
- e2e-expediente.mjs: e2e-expediente.mjs
- HomePage
- event-queue.test.ts
- content.ts: seed/content.ts
- e2e-inscripcion.mjs
- e2e-cuenta.mjs
- staff-recovery.test.ts
- portal admin: DisqualifiedAdminPage
- DailyChart
- s3.test.ts
- global-setup.ts
- exams.ts: seed/exams.ts
- identity.ts: identity.ts
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- @angular/core
- AdminShell
- scripts
- SiteImages
- ngsw-config.json
- screenshots-panel.mjs
- cookie-parser
- accounts.test.ts
- SyllabusPage
- ubigeo.ts
- CasesAdminPage

## God Nodes (most connected - your core abstractions)
1. `RequestMeta` - 153 edges
2. `apiErrorMessage()` - 109 edges
3. `notFound()` - 99 edges
4. `Db` - 85 edges
5. `@angular/core` - 84 edges
6. `ApiService` - 82 edges
7. `validationError()` - 67 edges
8. `businessRule()` - 63 edges
9. `Clock` - 62 edges
10. `AuditLog` - 60 edges

## Surprising Connections (you probably didn't know these)
- `StaffSession` --references--> `TokenDto`  [EXTRACTED]
  apps/backend/src/modules/usuarios/application/staff-auth-service.ts → packages/contracts/src/index.ts
- `Row` --references--> `DossierDto`  [EXTRACTED]
  apps/frontend/src/app/features/admin/pages/dossiers.ts → packages/contracts/src/index.ts
- `createApplication()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  apps/backend/src/app.ts → apps/backend/src/shared/http/middleware.ts
- `quote()` --calls--> `quoteFee()`  [EXTRACTED]
  apps/backend/tests/unit/convocatorias/fee-calculator.test.ts → apps/backend/src/modules/convocatorias/domain/fee-calculator.ts
- `createReportesModule()` --indirect_call--> `toPdf()`  [INFERRED]
  apps/backend/src/modules/reportes/index.ts → apps/backend/src/modules/reportes/infrastructure/exporters.ts

## Import Cycles
- None detected.

## Communities (139 total, 36 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.03
Nodes (85): CLIENT, ADR-0015, apiErrorCode(), apiErrorDetails(), ApiHttpError, FichaVerification, SubmodalityDto, ADR-0010 (+77 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.03
Nodes (69): CLIENT, Query, StaffMe, ADR-0018, ADR-0022, shortDateTime(), adminRoutes, ADR-0018 (+61 more)

### Community 2 - "@angular/router"
Cohesion: 0.06
Nodes (22): App, appConfig, ADR-0023, routes, ADR-0015, ADR-0018, LEAD, TITLE (+14 more)

### Community 3 - "dossiers.ts"
Cohesion: 0.13
Nodes (16): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, Row (+8 more)

### Community 4 - "NotificationService"
Cohesion: 0.20
Nodes (5): hour(), NotificationService, createNotificacionesModule(), meta(), notificacionesRoutes()

### Community 5 - "usuariosRoutes"
Cohesion: 0.08
Nodes (32): AuthService, IdentityTokenPayload, sha256(), ADR-0018, ACTIONS, describeDevice(), StaffSession, applicantCodeFromSequence() (+24 more)

### Community 6 - "apiErrorMessage"
Cohesion: 0.04
Nodes (18): apiErrorMessage(), AuditAdminPage, Ev, Page, InscriptionsAdminPage, Page, PaymentsAdminPage, Row (+10 more)

### Community 8 - "Argon2Hasher"
Cohesion: 0.14
Nodes (12): Argon2Hasher, staff(), staff(), staff(), staff(), box, CHROME_WIN_NUEVO, clock (+4 more)

### Community 9 - "prisma.ts"
Cohesion: 0.05
Nodes (58): DEFAULT_PARAMETERS, SITE_SLOTS, SiteSlot, TYPES, FORMATS, VacancyImportPreview, VacancyImportRow, ADR-0002 (+50 more)

### Community 10 - "RequestMeta"
Cohesion: 0.09
Nodes (10): ContentAdmin, sniff(), CallAdmin, iso(), CatalogAdmin, SecurityAdmin, RequestMeta, conflict() (+2 more)

### Community 11 - "distribution.ts"
Cohesion: 0.20
Nodes (10): Candidate, candidateOrder(), collator, distribute(), DistributionResult, roomOrder(), Seat, Seatable (+2 more)

### Community 12 - "frontend/package.json"
Cohesion: 0.06
Nodes (38): dependencies, @angular/common@22.2.3, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, @angular/service-worker@22.2.3 (+30 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (43): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+35 more)

### Community 14 - "AdminSession"
Cohesion: 0.09
Nodes (8): AdminSession, NAV, NavItem, ROLE_NAMES, Count, Dashboard, ReportKind, REPORTS

### Community 15 - "inscription-service.ts"
Cohesion: 0.07
Nodes (28): InscriptionInput, InscriptionService, InscriptionSummary, longDate(), NO_REINSCRIPTION, shortDate(), ADR-0015, ADR-0017 (+20 more)

### Community 16 - "seguridad/index.ts"
Cohesion: 0.18
Nodes (9): ADR-0018, ACCESS_TOKEN_TTL_SECONDS, AccessClaims, JoseTokenService, authenticate(), authorize(), Express, Principal (+1 more)

### Community 17 - "lambda-worker.ts"
Cohesion: 0.10
Nodes (19): Application, application, handler(), processQueue(), SqsEvent, ADR-0012, ADR-0021, application (+11 more)

### Community 18 - "package.json"
Cohesion: 0.05
Nodes (38): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+30 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.08
Nodes (35): devDependencies, concurrently@10.0.6, embedded-postgres@16.14.0-beta.17, esbuild@0.28.2, pino-pretty@13.2.0, prisma@7.10.1, supertest@7.3.1, tsx@4.23.15 (+27 more)

### Community 20 - "Servicio de expedientes"
Cohesion: 0.20
Nodes (5): DossierService, iso(), latest(), createExpedientesModule(), expedientesRoutes()

### Community 21 - "middleware.ts"
Cohesion: 0.08
Nodes (34): ADR-0017, SiteAssets, createConfiguracionModule(), announcementsQuery, configuracionRoutes(), INCIDENT_TYPES, applicant, examBody (+26 more)

### Community 22 - "Db"
Cohesion: 0.10
Nodes (10): ESTADO_ETAPA, STOP, ToolDeps, ToolResult, ADR-0017, ConvocatoriasQueries, AuditLog, Clock (+2 more)

### Community 23 - "ref_vitest"
Cohesion: 0.12
Nodes (6): movableClock(), clock, secrets, t, t, ADR-0014

### Community 24 - "@angular/forms"
Cohesion: 0.06
Nodes (13): AdmittedListDto, ExamRoomDto, MyResultDto, ExamTicket, ExamTicketData, FindRoomPage, ADR-0023, MyInscriptionPage (+5 more)

### Community 25 - "admin-routes.ts"
Cohesion: 0.13
Nodes (13): actor(), AdminDeps, adminRoutes(), day, describe(), filterSchema, meta(), page (+5 more)

### Community 26 - "@angular/core"
Cohesion: 0.08
Nodes (21): InboxDto, ReinscriptionCheck, closesIn(), dateRange(), dateTime(), daysUntil(), limaDay(), longDate() (+13 more)

### Community 27 - "rds.ts"
Cohesion: 0.23
Nodes (11): pg@8.23.1, backendDir, caFile, check(), client(), envFile, migrate(), setup() (+3 more)

### Community 28 - "results-service.ts"
Cohesion: 0.06
Nodes (32): iso(), MODALITY_LABEL, ResultPerson, ResultsPorts, ResultsService, Answers, computeScore(), Condition (+24 more)

### Community 29 - "pago-culqi.test.ts"
Cohesion: 0.06
Nodes (40): Attempt, AttemptResultDto, PaymentSessionDto, PaymentStatusDto, ADR-0019, ADR-0024, Via, ATTEMPT_LABEL (+32 more)

### Community 30 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, argon2@0.45.1, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, exceljs@^4.4.0, express@5.3.0, helmet@8.3.0 (+17 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "ref_node_crypto"
Cohesion: 0.15
Nodes (9): ApplicationDocuments, AppRow, KINDS, ADR-0010, TYPES, presignApplicantUpload(), readApplicantUpload(), ADR-0010 (+1 more)

### Community 34 - "audit/audit.ts"
Cohesion: 0.11
Nodes (17): day(), NoticeSources, Recipient, RecordingEmailSender, Segment, DEFAULT_TEMPLATES, escape(), fill() (+9 more)

### Community 35 - "asistente/index.ts"
Cohesion: 0.06
Nodes (37): AssistantReply, AssistantService, ADR-0017, KnowledgeAdmin, AssistantTools, fecha(), terms(), asksForHuman() (+29 more)

### Community 36 - "Pruebas E2E con Playwright"
Cohesion: 0.11
Nodes (9): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], admin, base32Decode(), totp(), jobs, [out = '.screens', ...routes], report (+1 more)

### Community 37 - "ConvocatoriasRepository"
Cohesion: 0.16
Nodes (4): CallSummary, ConvocatoriasRepository, SubmodalityRecord, convocatoriasRoutes()

### Community 38 - "exam-service.ts"
Cohesion: 0.06
Nodes (43): attendancePdf(), eligibleListPdf(), ExamInfo, examSlipPdf(), footer(), hour(), longDate(), render() (+35 more)

### Community 39 - "Convocatoria (panel)"
Cohesion: 0.12
Nodes (12): Awardee, Awardees, CallAdminPage, CallDetail, Fee, fromLima(), ImportPreview, ImportRow (+4 more)

### Community 40 - "env.ts"
Cohesion: 0.15
Nodes (12): application, handler, ADR-0009, Env, loadEnv(), schema, ADR-0010, ADR-0017 (+4 more)

### Community 41 - "ReportQueries"
Cohesion: 0.12
Nodes (10): MODALITY_LABEL, ReportFilter, ReportQueries, STATUS_LABEL, ATTENDANCE_COLUMNS, createReportesModule(), DOSSIER_COLUMNS, INSCRIPTION_COLUMNS (+2 more)

### Community 42 - ".now"
Cohesion: 0.23
Nodes (6): SessionMeta, SessionService, sha256(), ADR-0006, deviceLabel(), evaluateRefresh()

### Community 43 - "culqi.ts"
Cohesion: 0.18
Nodes (9): dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile, ses (+1 more)

### Community 44 - "staff-auth-service.ts"
Cohesion: 0.15
Nodes (7): AccessService, Totp, ChallengePayload, StaffChallenge, StaffStep, ADR-0018, ADR-0022

### Community 45 - "forbidden"
Cohesion: 0.22
Nodes (8): ALL, byRole, hasPermission(), PERMISSIONS, permissionsOf(), STAFF_ROLES, ADR-0018, guardFactory()

### Community 46 - "package.json: scripts"
Cohesion: 0.11
Nodes (19): scripts, apiperu:check, build, culqi:check, db:reset, db:setup, db:start, db:stop (+11 more)

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

### Community 52 - "notifications.test.ts"
Cohesion: 0.08
Nodes (14): db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], totpService, SecretBox, box, clock, t, box (+6 more)

### Community 53 - "usuarios/index.ts"
Cohesion: 0.10
Nodes (18): token, AuthDeps, ProfileService, IdentityLookupResult, IdentityProvider, PasswordHasher, ADR-0007, ADR-0015 (+10 more)

### Community 54 - "ref_node_path"
Cohesion: 0.18
Nodes (6): apply, db, db, [email, file = '.admin-inicial.txt'], db, createPrismaClient()

### Community 55 - "createSeguridadModule"
Cohesion: 0.40
Nodes (3): SupportCases, createSeguridadModule(), seguridadRoutes()

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "usuarios/presentation/routes.ts"
Cohesion: 0.22
Nodes (9): Permission, lookupSchema, phone, profileSchema, registerSchema, requireClientHeader(), StaffRouteDeps, ADR-0015 (+1 more)

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.16
Nodes (3): blankProgram(), blankReq(), CatalogAdminPage

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.11
Nodes (15): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+7 more)

### Community 61 - "admin-login.ts"
Cohesion: 0.14
Nodes (8): StaffStep, STEP_LABEL, ADR-0018, ADR-0022, RecoveryCodes, ADR-0022, ActiveSessions, SessionDto

### Community 64 - "db.ts: db.ts"
Cohesion: 0.19
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "PaymentService"
Cohesion: 0.29
Nodes (5): PaymentService, formatAmount(), createPagosModule(), meta(), pagosRoutes()

### Community 67 - "S3FileStorage"
Cohesion: 0.13
Nodes (6): s3, files, root, s3, TYPES, S3FileStorage

### Community 68 - "convocatorias: PrismaConvocatoriasReposi"
Cohesion: 0.13
Nodes (3): OptionRecord, PrismaConvocatoriasRepository, toFee()

### Community 69 - "optimizar-imagenes.mjs"
Cohesion: 0.22
Nodes (7): sharp@^0.34.5, sharp, base, dir, require, sharp, WIDTHS

### Community 70 - "results.test.ts: results.test.ts"
Cohesion: 0.14
Nodes (11): box, clock, codes, DNIS, fakeJpeg(), jump(), registerExo(), secrets (+3 more)

### Community 72 - "package.json: contracts/package.json"
Cohesion: 0.14
Nodes (14): description, devDependencies, typescript@6.0.3, exports, typescript, main, name, private (+6 more)

### Community 74 - "exams.test.ts: exams.test.ts"
Cohesion: 0.16
Nodes (10): box, clock, codes, DNIS, fakeJpeg(), jump(), registerOrd(), secrets (+2 more)

### Community 78 - "portal cuenta: MyAccountPage"
Cohesion: 0.14
Nodes (4): MyAccountPage, base32Decode(), text, totp()

### Community 79 - "ubigeo.service.ts"
Cohesion: 0.17
Nodes (5): Department, District, Province, UbigeoService, UbigeoSelect

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
Cohesion: 0.11
Nodes (16): AttendanceService, iso(), codeFromScan(), IncidentType, ANNULMENT_REASONS, money(), PAID, providerPaid() (+8 more)

### Community 85 - "convocatorias/presentation/routes.ts"
Cohesion: 0.29
Nodes (6): booleanish, callCode, callParams, feeQuoteQuery, optionsQuery, publicCache()

### Community 86 - "convocatorias: .quoteFee()"
Cohesion: 0.19
Nodes (8): FeeRule, SurchargeRule, DocumentRecord, QuotaCategoryRecord, RequirementRecord, SyllabusRecord, ADR-0002, Stage

### Community 87 - "fee-calculator.test.ts"
Cohesion: 0.11
Nodes (15): FeeInfo, FeeQuote, Money, pendingEnrollmentStats, base, CEPRE_EXTEMP, CEPRE_REGULAR, EXO_EXTEMP (+7 more)

### Community 88 - ".getCurrentCall"
Cohesion: 0.22
Nodes (4): ConfiguracionQueries, shortDate(), EnrollmentStatsProvider, toLimaIso()

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

### Community 94 - "session-policy.ts"
Cohesion: 0.22
Nodes (8): IDLE_LIMIT_SECONDS, RefreshDecision, SESSION_TTL, SessionState, ADR-0006, minutesAgo(), now, session()

### Community 98 - "convocatorias-queries.ts"
Cohesion: 0.16
Nodes (15): stages, byPriority(), FeeCriteria, matches(), MilitaryCondition, Modality, quoteFee(), SchoolType (+7 more)

### Community 101 - "payments.test.ts: payments.test.ts"
Cohesion: 0.25
Nodes (5): fakeJpeg(), register(), t, ADR-0024, Who

### Community 102 - "tsconfig.json: backend/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, ../../tsconfig.base.json

### Community 103 - "helpers.ts"
Cohesion: 0.13
Nodes (10): fixedClock(), MemoryEmailSender, MemoryFileStorage, checkDigit, TEST_URL, testApp(), t, base (+2 more)

### Community 107 - "exam-rules.ts"
Cohesion: 0.29
Nodes (6): ACCOMMODATION_HOURS, DEFAULT_INSTRUCTIONS, DEFAULT_SCORING, DEFAULT_STRUCTURE, EXAM_STATUS_LABEL, PUBLISH_HOURS_BEFORE

### Community 112 - "src/app.ts"
Cohesion: 0.06
Nodes (32): @aws-sdk/client-sesv2@^3.1158.0, @aws-sdk/client-sqs@^3.1161.0, pino@10.4.0, AppOverrides, backendDir, createApplication(), integrationStatus(), ADR-0002 (+24 more)

### Community 113 - "e2e-expediente.mjs: e2e-expediente.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 115 - "event-queue.test.ts"
Cohesion: 0.20
Nodes (7): clock, failFor, FakeQueue, handled, queue, t, ADR-0021

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 117 - "e2e-inscripcion.mjs"
Cohesion: 0.29
Nodes (4): errors, ADR-0015, photo, width

### Community 119 - "staff-recovery.test.ts"
Cohesion: 0.19
Nodes (11): group(), newRecoveryCodes(), normalizeRecoveryCode(), RECOVERY_CODE_COUNT, ADR-0022, clock, codes, login() (+3 more)

### Community 122 - "s3.test.ts"
Cohesion: 0.40
Nodes (4): @aws-sdk/client-s3@^3.1158.0, client, storage, @aws-sdk/client-s3

### Community 123 - "global-setup.ts"
Cohesion: 0.33
Nodes (3): backendDir, dataDir, TEST_DATABASE_URL

### Community 124 - "exams.ts: seed/exams.ts"
Cohesion: 0.40
Nodes (4): BUILDINGS, exams, rooms, venue

### Community 125 - "identity.ts: identity.ts"
Cohesion: 0.40
Nodes (4): consentDocument, disqualifiedPersons, permissions, roles

### Community 128 - "@angular/core"
Cohesion: 0.08
Nodes (16): AssetMap, PhotoCapture, TYPE_LABEL, CAMPUS, PRINCIPLES, PRIORITY, QUICK, StepsPage (+8 more)

### Community 130 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, ng, start, test, watch

### Community 132 - "ngsw-config.json"
Cohesion: 0.40
Nodes (4): assetGroups, index, navigationUrls, $schema

### Community 133 - "screenshots-panel.mjs"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

### Community 135 - "accounts.test.ts"
Cohesion: 0.15
Nodes (12): FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, activeAccount(), clock (+4 more)

### Community 139 - "ubigeo.ts"
Cohesion: 0.33
Nodes (5): Department, departments, District, districtIndex, Province

## Knowledge Gaps
- **129 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+124 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1193 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `apiErrorMessage` to `api.service.ts`, `Sesión del panel (frontend)`, `@angular/router`, `dossiers.ts`, `CasesAdminPage`, `AdminSession`, `@angular/forms`, `@angular/core`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `admin-login.ts`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `OnlinePayment`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `SecurityPage`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `portal admin: KnowledgeAdminPage`, `portal admin: SystemAdminPage`, `portal admin: Component`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `InboxPanel`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `portal admin: DisqualifiedAdminPage`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _129 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03386155129274395 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `RequestMeta` to `NotificationService`, `usuariosRoutes`, `prisma.ts`, `inscription-service.ts`, `Servicio de expedientes`, `middleware.ts`, `Db`, `admin-routes.ts`, `results-service.ts`, `pago-culqi.test.ts`, `ref_node_crypto`, `audit/audit.ts`, `asistente/index.ts`, `exam-service.ts`, `staff-auth-service.ts`, `usuarios/presentation/routes.ts`, `PaymentService`, `pagos: money()`, `StaffAuthService`, `StaffAdmin`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.0340883093113704 - nodes in this community are weakly interconnected._
- **Why does `notFound()` connect `RequestMeta` to `NotificationService`, `usuariosRoutes`, `prisma.ts`, `inscription-service.ts`, `Servicio de expedientes`, `middleware.ts`, `admin-routes.ts`, `results-service.ts`, `pago-culqi.test.ts`, `ref_node_crypto`, `audit/audit.ts`, `asistente/index.ts`, `ConvocatoriasRepository`, `exam-service.ts`, `PaymentService`, `pagos: money()`, `.getCurrentCall`, `convocatorias-queries.ts`, `StaffAdmin`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Should `@angular/router` be split into smaller, more focused modules?**
  _Cohesion score 0.06201550387596899 - nodes in this community are weakly interconnected._