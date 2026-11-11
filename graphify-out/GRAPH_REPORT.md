# Graph Report - proyectofinal  (2026-11-11)

## Corpus Check
- 289 files · ~192,740 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .scss 5, (none) 4, .woff 4)

## Summary
- 3013 nodes · 7284 edges · 140 communities (104 shown, 36 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 224 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e00ee0bb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- @angular/router
- auth-service.ts
- NotificationService
- usuariosRoutes
- apiErrorMessage
- Cliente API del portal
- examenes/presentation/routes.ts
- seguridad/index.ts
- notFound
- Servicio de asistencia
- frontend/package.json
- Configuración de Angular
- AdminSession
- inscription-service.ts
- account-session.ts
- lambda-worker.ts
- package.json
- Dependencias de desarrollo backend
- Servicio de expedientes
- middleware.ts
- Db
- businessRule
- @angular/forms
- Rutas del panel (backend)
- @angular/core
- rds.ts
- results-service.ts
- pago-culqi.test.ts
- dependencies
- Exámenes (panel)
- Formulario de inscripción
- exam-service.ts
- audit/audit.ts
- asistente/index.ts
- Pruebas E2E con Playwright
- ConvocatoriasRepository
- exam-service.ts
- Convocatoria (panel)
- inscription-service.ts
- ReportQueries
- .now
- ref_node_path
- AssistantService
- forbidden
- package.json: scripts
- updates
- ci.yml
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- Argon2Hasher
- usuarios/index.ts
- fee-calculator.ts
- scripts
- portal admin: ResultsAdminPage
- tsconfig.base.json: tsconfig.base.json
- usuarios/presentation/routes.ts
- portal admin: blankProgram()
- call-2027-I.ts: call-2027-I.ts
- admin-login.ts
- portal admin: DossiersAdminPage
- portal admin: NotificationsAdminPage
- db.ts: db.ts
- RequestMeta
- OnlinePayment
- file-storage.ts
- convocatorias: PrismaConvocatoriasReposi
- AssistantTools
- results.test.ts: results.test.ts
- assistant.ts: Assistant
- package.json: contracts/package.json
- ApplicationDocuments
- exams.test.ts: exams.test.ts
- portal admin: ContentAdminPage
- portal admin: TreasuryAdminPage
- portal admin: Component
- portal cuenta: MyAccountPage
- pages/audit.ts
- assistant-service.ts
- seguridad: totp.ts
- dossier.test.ts: dossier.test.ts
- pending-features.test.ts: pending-featur
- pagos: money()
- e2e-examen.mjs
- convocatorias: .quoteFee()
- fee-calculator.test.ts
- ConvocatoriasQueries
- portal admin: AdminLoginPage
- tsconfig.json: contracts/tsconfig.json
- e2e-resultados.mjs: e2e-resultados.mjs
- trazabilidad.mjs: trazabilidad.mjs
- catalog.ts: seed/catalog.ts
- session-policy.ts
- StaffAuthService
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
- resultados/presentation/routes.ts
- portal admin: AdmissionsAdminPage
- portal cuenta: AccountLoginPage
- site-header.ts: SiteHeader
- src/app.ts
- e2e-expediente.mjs: e2e-expediente.mjs
- HomePage
- event-queue.test.ts
- content.ts: seed/content.ts
- contact.ts
- e2e-cuenta.mjs
- staff-recovery.test.ts
- portal admin: DisqualifiedAdminPage
- DailyChart
- s3.test.ts
- s3-copy-local.ts
- exams.ts: seed/exams.ts
- identity.ts: identity.ts
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- steps.ts
- admin-shell.ts
- exceljs
- InscriptionsAdminPage
- ngsw-config.json
- screenshots-panel.mjs
- helmet
- accounts.test.ts
- SyllabusPage
- ubigeo.ts
- CasesAdminPage
- SiteAssets

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
- `quote()` --calls--> `quoteFee()`  [EXTRACTED]
  apps/backend/tests/unit/convocatorias/fee-calculator.test.ts → apps/backend/src/modules/convocatorias/domain/fee-calculator.ts
- `createSeguridadModule()` --indirect_call--> `authorize()`  [INFERRED]
  apps/backend/src/modules/seguridad/index.ts → apps/backend/src/modules/seguridad/presentation/auth-middleware.ts
- `seedStaff()` --calls--> `Argon2Hasher`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/infrastructure/argon2-hasher.ts

## Import Cycles
- None detected.

## Communities (140 total, 36 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.04
Nodes (64): apiErrorCode(), apiErrorDetails(), ApiHttpError, ReinscriptionCheck, SubmodalityDto, ADR-0010, ADR-0015, ADR-0017 (+56 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.03
Nodes (71): CLIENT, Query, StaffMe, ADR-0018, ADR-0022, shortDateTime(), adminRoutes, ADR-0018 (+63 more)

### Community 2 - "@angular/router"
Cohesion: 0.05
Nodes (35): App, appConfig, ADR-0023, routes, ADR-0015, ADR-0018, FichaVerification, CallStore (+27 more)

### Community 3 - "auth-service.ts"
Cohesion: 0.14
Nodes (18): IdentityTokenPayload, ADR-0018, applicantCodeFromSequence(), COMMON, EDITABLE_FIELDS, IDENTITY_FIELDS, isMinor(), isValidApplicantCode() (+10 more)

### Community 4 - "NotificationService"
Cohesion: 0.20
Nodes (5): day(), hour(), NotificationService, meta(), notificacionesRoutes()

### Community 5 - "usuariosRoutes"
Cohesion: 0.12
Nodes (13): AuthService, sha256(), ACTIONS, describeDevice(), ProfileService, StaffSession, normalizeEmail(), passwordIssues() (+5 more)

### Community 6 - "apiErrorMessage"
Cohesion: 0.04
Nodes (28): apiErrorMessage(), MyResultDto, BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010 (+20 more)

### Community 8 - "examenes/presentation/routes.ts"
Cohesion: 0.22
Nodes (8): INCIDENT_TYPES, applicant, examBody, meta(), pdf(), roomBody, venueBody, when

### Community 9 - "seguridad/index.ts"
Cohesion: 0.06
Nodes (29): DEFAULT_PARAMETERS, AccessService, EVIDENCE, EvidenceInput, SupportCases, permissionsOf(), createSeguridadModule(), Totp (+21 more)

### Community 10 - "notFound"
Cohesion: 0.11
Nodes (16): sniff(), CallAdmin, iso(), CatalogAdmin, FORMATS, VacancyImportPreview, VacancyImportRow, ROLE_CODES (+8 more)

### Community 11 - "Servicio de asistencia"
Cohesion: 0.11
Nodes (8): AttendanceService, iso(), ExamService, iso(), roomInfo(), roomOrder(), IncidentType, examenesRoutes()

### Community 12 - "frontend/package.json"
Cohesion: 0.05
Nodes (44): dependencies, @angular/common@22.2.3, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, @angular/service-worker@22.2.3 (+36 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (43): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+35 more)

### Community 14 - "AdminSession"
Cohesion: 0.11
Nodes (5): AdminSession, Count, Dashboard, ReportKind, REPORTS

### Community 15 - "inscription-service.ts"
Cohesion: 0.10
Nodes (8): InscriptionService, longDate(), shortDate(), OrdenPagoService, InscriptionStatus, maskDocument(), createInscripcionesModule(), inscripcionesRoutes()

### Community 16 - "account-session.ts"
Cohesion: 0.16
Nodes (9): CLIENT, ADR-0015, ADR-0015, ActiveSessions, ActivityDto, ConsentDto, IdentityLookupDto, RegisterResultDto (+1 more)

### Community 17 - "lambda-worker.ts"
Cohesion: 0.06
Nodes (34): application, handler, ADR-0009, application, handler(), processQueue(), SqsEvent, ADR-0012 (+26 more)

### Community 18 - "package.json"
Cohesion: 0.09
Nodes (24): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+16 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.08
Nodes (35): devDependencies, concurrently@10.0.6, embedded-postgres@16.14.0-beta.17, esbuild@0.28.2, pino-pretty@13.2.0, prisma@7.10.1, supertest@7.3.1, tsx@4.23.15 (+27 more)

### Community 20 - "Servicio de expedientes"
Cohesion: 0.18
Nodes (6): DossierService, iso(), latest(), expedientesRoutes(), meta(), sendFile()

### Community 21 - "middleware.ts"
Cohesion: 0.10
Nodes (33): ADR-0017, announcementsQuery, configuracionRoutes(), booleanish, callCode, callParams, convocatoriasRoutes(), feeQuoteQuery (+25 more)

### Community 22 - "Db"
Cohesion: 0.09
Nodes (15): Application, AppOverrides, SITE_SLOTS, SiteSlot, TYPES, CASE_STATUS_LABEL, CASE_TYPE_LABEL, AuthDeps (+7 more)

### Community 23 - "businessRule"
Cohesion: 0.20
Nodes (4): iso(), ResultsService, resultadosRoutes(), businessRule()

### Community 24 - "@angular/forms"
Cohesion: 0.09
Nodes (11): AdmittedListDto, ExamRoomDto, InboxDto, ExamTicket, ExamTicketData, ADR-0023, InboxPanel, ADR-0015 (+3 more)

### Community 25 - "Rutas del panel (backend)"
Cohesion: 0.13
Nodes (19): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+11 more)

### Community 26 - "@angular/core"
Cohesion: 0.05
Nodes (33): closesIn(), dateRange(), dateTime(), daysUntil(), limaDay(), longDate(), shortDate(), soles() (+25 more)

### Community 27 - "rds.ts"
Cohesion: 0.23
Nodes (11): pg@8.23.1, backendDir, caFile, check(), client(), envFile, migrate(), setup() (+3 more)

### Community 28 - "results-service.ts"
Cohesion: 0.09
Nodes (21): MODALITY_LABEL, ResultPerson, ResultsPorts, Answers, computeScore(), Condition, CONDITION_LABEL, Contender (+13 more)

### Community 29 - "pago-culqi.test.ts"
Cohesion: 0.06
Nodes (39): Attempt, AttemptResultDto, PaymentSessionDto, PaymentStatusDto, ADR-0019, ADR-0024, Via, ATTEMPT_LABEL (+31 more)

### Community 30 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @aws-sdk/client-sesv2@^3.1158.0, @aws-sdk/client-sqs@^3.1161.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, cookie-parser@1.4.7, express@5.3.0 (+18 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "exam-service.ts"
Cohesion: 0.11
Nodes (19): Doc, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus, OBSERVE_HOURS, REJECTION_HINT (+11 more)

### Community 34 - "audit/audit.ts"
Cohesion: 0.12
Nodes (20): createExamenesModule(), DossierContext, createExpedientesModule(), Recipient, RecordingEmailSender, Segment, DEFAULT_TEMPLATES, escape() (+12 more)

### Community 35 - "asistente/index.ts"
Cohesion: 0.12
Nodes (19): LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017, OpenRouterProvider (+11 more)

### Community 36 - "Pruebas E2E con Playwright"
Cohesion: 0.10
Nodes (10): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], errors, ADR-0015, photo, width, jobs, [out = '.screens', ...routes] (+2 more)

### Community 37 - "ConvocatoriasRepository"
Cohesion: 0.15
Nodes (4): CallSummary, ConvocatoriasRepository, SubmodalityRecord, AreaDto

### Community 38 - "exam-service.ts"
Cohesion: 0.06
Nodes (61): attendancePdf(), eligibleListPdf(), ExamInfo, examSlipPdf(), footer(), hour(), longDate(), render() (+53 more)

### Community 39 - "Convocatoria (panel)"
Cohesion: 0.12
Nodes (12): Awardee, Awardees, CallAdminPage, CallDetail, Fee, fromLima(), ImportPreview, ImportRow (+4 more)

### Community 40 - "inscription-service.ts"
Cohesion: 0.22
Nodes (15): InscriptionInput, NO_REINSCRIPTION, ADR-0015, ADR-0017, CAMPUSES, ECONOMIC_DEPENDENCY, initialStatus(), isPlausibleGraduationYear() (+7 more)

### Community 42 - ".now"
Cohesion: 0.19
Nodes (6): SessionMeta, SessionService, sha256(), ADR-0006, deviceLabel(), SESSION_TTL

### Community 43 - "ref_node_path"
Cohesion: 0.09
Nodes (14): dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile, ses (+6 more)

### Community 44 - "AssistantService"
Cohesion: 0.27
Nodes (3): AssistantService, asistenteRoutes(), meta()

### Community 45 - "forbidden"
Cohesion: 0.17
Nodes (12): ALL, byRole, hasPermission(), PERMISSIONS, STAFF_ROLES, ADR-0018, authorize(), Express (+4 more)

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
Cohesion: 0.17
Nodes (17): main(), prisma, publicDocsDir, seedCall(), seedCatalog(), seedContent(), seedExams(), seedIdentity() (+9 more)

### Community 52 - "Argon2Hasher"
Cohesion: 0.06
Nodes (27): argon2@0.45.1, db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], db, [email, file = '.admin-inicial.txt'], totpService, SecretBox, Argon2Hasher (+19 more)

### Community 53 - "usuarios/index.ts"
Cohesion: 0.12
Nodes (15): token, IdentityLookupResult, IdentityProvider, ADR-0007, ADR-0015, createIdentityProvider(), createUsuariosModule(), ADR-0007 (+7 more)

### Community 54 - "fee-calculator.ts"
Cohesion: 0.15
Nodes (11): byPriority(), FeeInfo, FeeQuote, matches(), MilitaryCondition, Modality, quoteFee(), SchoolType (+3 more)

### Community 55 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:setup, db:start, db:stop, dev, dev:rds, izipay:check (+6 more)

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "usuarios/presentation/routes.ts"
Cohesion: 0.25
Nodes (8): Permission, lookupSchema, phone, profileSchema, registerSchema, StaffRouteDeps, ADR-0015, ADR-0018

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.16
Nodes (3): blankProgram(), blankReq(), CatalogAdminPage

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.11
Nodes (15): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+7 more)

### Community 61 - "admin-login.ts"
Cohesion: 0.12
Nodes (7): StaffStep, STEP_LABEL, ADR-0018, SecurityPage, ADR-0022, RecoveryCodes, ADR-0022

### Community 64 - "db.ts: db.ts"
Cohesion: 0.19
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "RequestMeta"
Cohesion: 0.10
Nodes (5): ContentAdmin, PaymentService, formatAmount(), SecurityAdmin, RequestMeta

### Community 67 - "file-storage.ts"
Cohesion: 0.11
Nodes (8): s3, jpegSize(), LocalFileStorage, PresignedUpload, ADR-0010, ADR-0014, S3FileStorage, ADR-0010

### Community 68 - "convocatorias: PrismaConvocatoriasReposi"
Cohesion: 0.13
Nodes (3): OptionRecord, PrismaConvocatoriasRepository, toFee()

### Community 69 - "AssistantTools"
Cohesion: 0.29
Nodes (3): AssistantTools, fecha(), terms()

### Community 70 - "results.test.ts: results.test.ts"
Cohesion: 0.14
Nodes (11): box, clock, codes, DNIS, fakeJpeg(), jump(), registerExo(), secrets (+3 more)

### Community 72 - "package.json: contracts/package.json"
Cohesion: 0.14
Nodes (14): description, devDependencies, typescript@6.0.3, exports, typescript, main, name, private (+6 more)

### Community 73 - "ApplicationDocuments"
Cohesion: 0.25
Nodes (3): AdminDeps, VacancyImport, ApplicationDocuments

### Community 74 - "exams.test.ts: exams.test.ts"
Cohesion: 0.16
Nodes (10): box, clock, codes, DNIS, fakeJpeg(), jump(), registerOrd(), secrets (+2 more)

### Community 78 - "portal cuenta: MyAccountPage"
Cohesion: 0.14
Nodes (4): MyAccountPage, base32Decode(), text, totp()

### Community 79 - "pages/audit.ts"
Cohesion: 0.07
Nodes (11): AssetMap, SiteImages, Department, District, Province, UbigeoService, AuditAdminPage, Ev (+3 more)

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
Nodes (9): ANNULMENT_REASONS, money(), PAID, providerPaid(), Reason, RECONCILIATION_LABEL, Result, TreasuryService (+1 more)

### Community 85 - "e2e-examen.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 86 - "convocatorias: .quoteFee()"
Cohesion: 0.20
Nodes (8): FeeCriteria, FeeRule, SurchargeRule, DocumentRecord, QuotaCategoryRecord, RequirementRecord, SyllabusRecord, ADR-0002

### Community 87 - "fee-calculator.test.ts"
Cohesion: 0.15
Nodes (11): base, CEPRE_EXTEMP, CEPRE_REGULAR, EXO_EXTEMP, fees, ORD_EXTEMP, quote(), REGULAR (+3 more)

### Community 88 - "ConvocatoriasQueries"
Cohesion: 0.08
Nodes (18): KnowledgeAdmin, ESTADO_ETAPA, STOP, ToolDeps, ToolResult, ADR-0017, createAsistenteModule(), ADR-0017 (+10 more)

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
Cohesion: 0.24
Nodes (8): evaluateRefresh(), IDLE_LIMIT_SECONDS, RefreshDecision, SessionState, ADR-0006, minutesAgo(), now, session()

### Community 98 - "stage.ts"
Cohesion: 0.11
Nodes (14): stages, shortDate(), EnrollmentStatsProvider, nextMilestone(), Stage, StageKind, StageScope, StageStatus (+6 more)

### Community 101 - "payments.test.ts: payments.test.ts"
Cohesion: 0.25
Nodes (5): fakeJpeg(), register(), t, ADR-0024, Who

### Community 102 - "tsconfig.json: backend/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, ../../tsconfig.base.json

### Community 103 - "ref_vitest"
Cohesion: 0.06
Nodes (19): fixedClock(), MemoryEmailSender, MemoryFileStorage, checkDigit, movableClock(), TEST_URL, testApp(), t (+11 more)

### Community 108 - "resultados/presentation/routes.ts"
Cohesion: 0.25
Nodes (7): applicant, Column, COVERAGE_COLUMNS, meta(), RESULT_COLUMNS, send(), ADR-0020

### Community 112 - "src/app.ts"
Cohesion: 0.07
Nodes (30): db, backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012, ADR-0021 (+22 more)

### Community 113 - "e2e-expediente.mjs: e2e-expediente.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 115 - "event-queue.test.ts"
Cohesion: 0.20
Nodes (7): clock, failFor, FakeQueue, handled, queue, t, ADR-0021

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 117 - "contact.ts"
Cohesion: 0.29
Nodes (3): ContactPage, Member, TEAM

### Community 119 - "staff-recovery.test.ts"
Cohesion: 0.19
Nodes (11): group(), newRecoveryCodes(), normalizeRecoveryCode(), RECOVERY_CODE_COUNT, ADR-0022, clock, codes, login() (+3 more)

### Community 122 - "s3.test.ts"
Cohesion: 0.40
Nodes (4): @aws-sdk/client-s3@^3.1158.0, client, storage, @aws-sdk/client-s3

### Community 123 - "s3-copy-local.ts"
Cohesion: 0.40
Nodes (4): files, root, s3, TYPES

### Community 124 - "exams.ts: seed/exams.ts"
Cohesion: 0.40
Nodes (4): BUILDINGS, exams, rooms, venue

### Community 125 - "identity.ts: identity.ts"
Cohesion: 0.40
Nodes (4): consentDocument, disqualifiedPersons, permissions, roles

### Community 128 - "steps.ts"
Cohesion: 0.17
Nodes (6): StepsPage, escape(), inline(), MarkdownPipe, PhotoDirective, HomeContentDto

### Community 129 - "admin-shell.ts"
Cohesion: 0.25
Nodes (4): AdminShell, NAV, NavItem, ROLE_NAMES

### Community 132 - "ngsw-config.json"
Cohesion: 0.40
Nodes (4): assetGroups, index, navigationUrls, $schema

### Community 133 - "screenshots-panel.mjs"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

### Community 135 - "accounts.test.ts"
Cohesion: 0.14
Nodes (13): FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, REDACTED_PATHS, activeAccount() (+5 more)

### Community 139 - "ubigeo.ts"
Cohesion: 0.25
Nodes (7): Department, departments, District, districtIndex, districtLabel(), isValidDistrict(), Province

## Knowledge Gaps
- **129 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+124 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1193 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `apiErrorMessage` to `api.service.ts`, `Sesión del panel (frontend)`, `@angular/router`, `InscriptionsAdminPage`, `CasesAdminPage`, `AdminSession`, `account-session.ts`, `@angular/forms`, `@angular/core`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `admin-login.ts`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `OnlinePayment`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `pages/audit.ts`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `portal admin: KnowledgeAdminPage`, `portal admin: SystemAdminPage`, `portal admin: Component`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `contact.ts`, `portal admin: DisqualifiedAdminPage`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _129 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0436036036036036 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `RequestMeta` to `auth-service.ts`, `NotificationService`, `usuariosRoutes`, `examenes/presentation/routes.ts`, `seguridad/index.ts`, `notFound`, `Servicio de asistencia`, `inscription-service.ts`, `SiteAssets`, `Servicio de expedientes`, `middleware.ts`, `Db`, `businessRule`, `Rutas del panel (backend)`, `results-service.ts`, `pago-culqi.test.ts`, `exam-service.ts`, `audit/audit.ts`, `exam-service.ts`, `inscription-service.ts`, `AssistantService`, `usuarios/presentation/routes.ts`, `ApplicationDocuments`, `assistant-service.ts`, `pagos: money()`, `ConvocatoriasQueries`, `StaffAuthService`, `StaffAdmin`, `resultados/presentation/routes.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.03307560137457045 - nodes in this community are weakly interconnected._
- **Why does `notFound()` connect `notFound` to `NotificationService`, `usuariosRoutes`, `seguridad/index.ts`, `Servicio de asistencia`, `inscription-service.ts`, `SiteAssets`, `Servicio de expedientes`, `Db`, `businessRule`, `results-service.ts`, `pago-culqi.test.ts`, `exam-service.ts`, `audit/audit.ts`, `ConvocatoriasRepository`, `exam-service.ts`, `inscription-service.ts`, `AssistantService`, `RequestMeta`, `ApplicationDocuments`, `assistant-service.ts`, `pagos: money()`, `ConvocatoriasQueries`, `stage.ts`, `StaffAdmin`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Should `@angular/router` be split into smaller, more focused modules?**
  _Cohesion score 0.04528158295281583 - nodes in this community are weakly interconnected._