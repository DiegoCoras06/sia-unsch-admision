# Graph Report - proyectofinal  (2026-11-11)

## Corpus Check
- 289 files · ~191,468 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .scss 5, (none) 4, .woff 4)

## Summary
- 3010 nodes · 7282 edges · 142 communities (106 shown, 36 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 224 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `27abc55f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- @angular/core
- attendance.ts
- NotificationService
- usuariosRoutes
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
- scripts
- Dependencias de desarrollo backend
- Servicio de expedientes
- middleware.ts
- Db
- businessRule
- env.ts
- Rutas del panel (backend)
- format.ts
- rds.ts
- results-service.ts
- pago-culqi.test.ts
- dependencies
- Exámenes (panel)
- Formulario de inscripción
- uploads.ts
- src/app.ts
- asistente/index.ts
- Pruebas E2E con Playwright
- ConvocatoriasRepository
- ficha-service.ts
- Convocatoria (panel)
- inscription-service.ts
- admin.test.ts: movableClock()
- .now
- ref_node_path
- AssistantService
- Outbox
- package.json: scripts
- updates
- ci.yml
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- Argon2Hasher
- auth-service.ts
- fee-calculator.ts
- Argon2Hasher
- portal admin: ResultsAdminPage
- tsconfig.base.json: tsconfig.base.json
- exam-pdf.ts
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
- fee-calculator.test.ts
- InscriptionsAdminPage
- portal admin: AdminLoginPage
- tsconfig.json: contracts/tsconfig.json
- e2e-resultados.mjs: e2e-resultados.mjs
- trazabilidad.mjs: trazabilidad.mjs
- catalog.ts: seed/catalog.ts
- ReportQueries
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
- payment-service.ts
- portal admin: AdmissionsAdminPage
- portal cuenta: AccountLoginPage
- site-header.ts: SiteHeader
- notification-service.ts
- e2e-expediente.mjs: e2e-expediente.mjs
- FichaService
- event-queue.test.ts
- content.ts: seed/content.ts
- e2e-inscripcion.mjs
- resultados/presentation/routes.ts
- staff-recovery.test.ts
- portal admin: DisqualifiedAdminPage
- DailyChart
- LocalFileStorage
- assistant.test.ts
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
- global-setup.ts
- VacancyImport
- ExamInscriptions
- SecurityPage
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

## Communities (142 total, 36 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.04
Nodes (65): CLIENT, ADR-0015, ApiHttpError, ReinscriptionCheck, SubmodalityDto, ADR-0010, ADR-0015, ADR-0017 (+57 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.03
Nodes (72): CLIENT, Query, StaffMe, ADR-0018, ADR-0022, shortDateTime(), adminRoutes, ADR-0018 (+64 more)

### Community 2 - "@angular/core"
Cohesion: 0.04
Nodes (44): App, appConfig, ADR-0023, routes, ADR-0015, ADR-0018, FichaVerification, CallStore (+36 more)

### Community 3 - "attendance.ts"
Cohesion: 0.13
Nodes (6): AssetMap, SiteImages, AuditAdminPage, Ev, Page, @angular/common

### Community 4 - "NotificationService"
Cohesion: 0.20
Nodes (5): day(), hour(), NotificationService, createNotificacionesModule(), notificacionesRoutes()

### Community 5 - "usuariosRoutes"
Cohesion: 0.18
Nodes (7): AuthService, sha256(), StaffSession, normalizeEmail(), passwordIssues(), usuariosRoutes(), TokenDto

### Community 6 - "dossiers.ts"
Cohesion: 0.09
Nodes (17): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, Row (+9 more)

### Community 8 - "exam-service.ts"
Cohesion: 0.10
Nodes (24): ExamInfo, RoomInfo, ExamInput, ExamPerson, ExamRow, ExamStructure, MODALITY_LABEL, RoomRow (+16 more)

### Community 9 - "seguridad/index.ts"
Cohesion: 0.07
Nodes (37): ALL, byRole, hasPermission(), Permission, PERMISSIONS, permissionsOf(), STAFF_ROLES, ADR-0018 (+29 more)

### Community 10 - "Contenido del portal (admin)"
Cohesion: 0.08
Nodes (14): AdminDeps, ContentAdmin, sniff(), CallAdmin, iso(), CatalogAdmin, FORMATS, CepreAwardees (+6 more)

### Community 11 - "Servicio de asistencia"
Cohesion: 0.11
Nodes (9): AttendanceService, iso(), ExamService, iso(), roomInfo(), roomOrder(), codeFromScan(), IncidentType (+1 more)

### Community 12 - "frontend/package.json"
Cohesion: 0.06
Nodes (39): dependencies, @angular/common@22.2.3, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, @angular/service-worker@22.2.3 (+31 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (43): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+35 more)

### Community 14 - "AdminSession"
Cohesion: 0.11
Nodes (5): AdminSession, Count, Dashboard, ReportKind, REPORTS

### Community 15 - "inscription-service.ts"
Cohesion: 0.09
Nodes (8): ApplicationDocuments, InscriptionService, longDate(), shortDate(), createInscripcionesModule(), inscripcionesRoutes(), applicantCodeFromSequence(), nextCounterValue()

### Community 16 - "support-cases.ts"
Cohesion: 0.12
Nodes (18): Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus, OBSERVE_HOURS (+10 more)

### Community 17 - "lambda-worker.ts"
Cohesion: 0.10
Nodes (19): application, handler(), processQueue(), SqsEvent, ADR-0012, ADR-0021, application, env (+11 more)

### Community 18 - "scripts"
Cohesion: 0.05
Nodes (38): allowScripts, argon2@0.45.1, @embedded-postgres/linux-x64@16.14.0-beta.17, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher (+30 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.08
Nodes (35): devDependencies, concurrently@10.0.6, embedded-postgres@16.14.0-beta.17, esbuild@0.28.2, pino-pretty@13.2.0, prisma@7.10.1, supertest@7.3.1, tsx@4.23.15 (+27 more)

### Community 20 - "Servicio de expedientes"
Cohesion: 0.19
Nodes (6): DossierService, iso(), latest(), expedientesRoutes(), meta(), sendFile()

### Community 21 - "middleware.ts"
Cohesion: 0.10
Nodes (31): ADR-0017, booleanish, callCode, callParams, convocatoriasRoutes(), feeQuoteQuery, optionsQuery, applicant (+23 more)

### Community 22 - "Db"
Cohesion: 0.08
Nodes (32): Application, ToolDeps, ADR-0017, DEFAULT_PARAMETERS, SITE_SLOTS, SiteSlot, TYPES, ConvocatoriasQueries (+24 more)

### Community 23 - "businessRule"
Cohesion: 0.19
Nodes (4): iso(), ResultsService, resultadosRoutes(), businessRule()

### Community 24 - "env.ts"
Cohesion: 0.12
Nodes (14): application, handler, ADR-0009, Env, schema, ADR-0010, ADR-0017, ADR-0018 (+6 more)

### Community 25 - "Rutas del panel (backend)"
Cohesion: 0.13
Nodes (20): actor(), adminRoutes(), day, describe(), filterSchema, meta(), page, ADR-0018 (+12 more)

### Community 26 - "format.ts"
Cohesion: 0.06
Nodes (26): apiErrorCode(), apiErrorDetails(), closesIn(), dateTime(), daysUntil(), limaDay(), longDate(), soles() (+18 more)

### Community 27 - "rds.ts"
Cohesion: 0.29
Nodes (9): backendDir, caFile, check(), client(), envFile, migrate(), setup(), ADR-0009 (+1 more)

### Community 28 - "results-service.ts"
Cohesion: 0.09
Nodes (21): MODALITY_LABEL, ResultPerson, ResultsPorts, Answers, computeScore(), Condition, CONDITION_LABEL, Contender (+13 more)

### Community 29 - "pago-culqi.test.ts"
Cohesion: 0.06
Nodes (28): ATTEMPT_LABEL, ATTEMPT_TTL_SECONDS, newTransactionId(), orderNumberFor(), ADR-0019, ADR-0024, YAPE_MAX_AMOUNT, ChargeRequest (+20 more)

### Community 30 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, @aws-sdk/client-sesv2@^3.1158.0, @aws-sdk/client-sqs@^3.1161.0, @codegenie/serverless-express@5.0.0, cookie-parser@1.4.7, exceljs@^4.4.0, express@5.3.0, helmet@8.3.0 (+21 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "uploads.ts"
Cohesion: 0.29
Nodes (4): presignApplicantUpload(), readApplicantUpload(), ADR-0010, UPLOAD_TYPES

### Community 34 - "src/app.ts"
Cohesion: 0.08
Nodes (30): db, backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012, ADR-0021 (+22 more)

### Community 35 - "asistente/index.ts"
Cohesion: 0.18
Nodes (14): LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017, OpenRouterProvider (+6 more)

### Community 36 - "Pruebas E2E con Playwright"
Cohesion: 0.11
Nodes (8): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900028', out = '.screens/cuenta'], ADR-0015, jobs, [out = '.screens', ...routes], report, widths

### Community 37 - "ConvocatoriasRepository"
Cohesion: 0.15
Nodes (4): CallSummary, ConvocatoriasRepository, SubmodalityRecord, AreaDto

### Community 38 - "ficha-service.ts"
Cohesion: 0.23
Nodes (19): ENTRY, admissionCertificatePdf(), assets, BOLD, ESCUDO, FONTS, GOLD, GUINDA (+11 more)

### Community 39 - "Convocatoria (panel)"
Cohesion: 0.12
Nodes (12): Awardee, Awardees, CallAdminPage, CallDetail, Fee, fromLima(), ImportPreview, ImportRow (+4 more)

### Community 40 - "inscription-service.ts"
Cohesion: 0.12
Nodes (25): InscriptionInput, InscriptionSummary, NO_REINSCRIPTION, ADR-0015, ADR-0017, CAMPUSES, ECONOMIC_DEPENDENCY, initialStatus() (+17 more)

### Community 41 - "admin.test.ts: movableClock()"
Cohesion: 0.13
Nodes (11): fixedClock(), loadEnv(), MemoryEmailSender, MemoryFileStorage, checkDigit, TEST_URL, testApp(), t (+3 more)

### Community 42 - ".now"
Cohesion: 0.10
Nodes (14): SessionMeta, SessionService, sha256(), ADR-0006, deviceLabel(), evaluateRefresh(), IDLE_LIMIT_SECONDS, RefreshDecision (+6 more)

### Community 43 - "ref_node_path"
Cohesion: 0.12
Nodes (11): dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile, ses (+3 more)

### Community 44 - "AssistantService"
Cohesion: 0.26
Nodes (3): AssistantService, asistenteRoutes(), meta()

### Community 45 - "Outbox"
Cohesion: 0.11
Nodes (10): EventQueue, SqsEventQueue, ADR-0021, DomainEvents, EventType, Handler, Outbox, SECRET_BEARING_EVENTS (+2 more)

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
Cohesion: 0.07
Nodes (18): argon2@0.45.1, db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], db, [email, file = '.admin-inicial.txt'], totpService, SecretBox, box (+10 more)

### Community 53 - "auth-service.ts"
Cohesion: 0.06
Nodes (35): token, AccessService, Totp, AuthDeps, IdentityTokenPayload, ADR-0018, ACTIONS, describeDevice() (+27 more)

### Community 54 - "fee-calculator.ts"
Cohesion: 0.15
Nodes (11): byPriority(), FeeInfo, FeeQuote, matches(), MilitaryCondition, Modality, quoteFee(), SchoolType (+3 more)

### Community 55 - "Argon2Hasher"
Cohesion: 0.14
Nodes (12): Argon2Hasher, staff(), staff(), staff(), staff(), box, CHROME_WIN_NUEVO, clock (+4 more)

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "exam-pdf.ts"
Cohesion: 0.30
Nodes (11): attendancePdf(), eligibleListPdf(), examSlipPdf(), footer(), hour(), longDate(), render(), OrdenPagoService (+3 more)

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

### Community 65 - "pagos: PaymentService"
Cohesion: 0.30
Nodes (3): PaymentService, formatAmount(), ProviderResult

### Community 67 - "s3-file-storage.ts: s3-check.ts"
Cohesion: 0.09
Nodes (16): @aws-sdk/client-s3@^3.1158.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, s3, files, root, s3, TYPES (+8 more)

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
Cohesion: 0.25
Nodes (7): applicant, examBody, meta(), pdf(), roomBody, venueBody, when

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
Cohesion: 0.10
Nodes (9): movableClock(), clock, secrets, t, t, minutesAgo(), now, session() (+1 more)

### Community 108 - "payment-service.ts"
Cohesion: 0.23
Nodes (11): AppOverrides, Attempt, AttemptResultDto, PaymentSessionDto, PaymentStatusDto, ADR-0019, ADR-0024, Via (+3 more)

### Community 112 - "notification-service.ts"
Cohesion: 0.12
Nodes (20): Recipient, RecordingEmailSender, Segment, DEFAULT_TEMPLATES, escape(), fill(), TemplateKey, limaTime() (+12 more)

### Community 113 - "e2e-expediente.mjs: e2e-expediente.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 114 - "FichaService"
Cohesion: 0.31
Nodes (4): FichaService, longDate(), shortName(), maskDocument()

### Community 115 - "event-queue.test.ts"
Cohesion: 0.20
Nodes (7): clock, failFor, FakeQueue, handled, queue, t, ADR-0021

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 117 - "e2e-inscripcion.mjs"
Cohesion: 0.29
Nodes (4): errors, ADR-0015, photo, width

### Community 118 - "resultados/presentation/routes.ts"
Cohesion: 0.25
Nodes (7): applicant, Column, COVERAGE_COLUMNS, meta(), RESULT_COLUMNS, send(), ADR-0020

### Community 119 - "staff-recovery.test.ts"
Cohesion: 0.19
Nodes (11): group(), newRecoveryCodes(), normalizeRecoveryCode(), RECOVERY_CODE_COUNT, ADR-0022, clock, codes, login() (+3 more)

### Community 123 - "assistant.test.ts"
Cohesion: 0.29
Nodes (5): ai, basic, scripted, toolCall(), usage

### Community 124 - "exams.ts: seed/exams.ts"
Cohesion: 0.40
Nodes (4): BUILDINGS, exams, rooms, venue

### Community 125 - "identity.ts: identity.ts"
Cohesion: 0.40
Nodes (4): consentDocument, disqualifiedPersons, permissions, roles

### Community 128 - "format.ts"
Cohesion: 0.06
Nodes (22): dateRange(), shortDate(), STAGE_STATUS_LABEL, time(), ApplicationFinder, CAMPUS, PRINCIPLES, PRIORITY (+14 more)

### Community 130 - "optimizar-imagenes.mjs"
Cohesion: 0.29
Nodes (5): base, dir, require, sharp, WIDTHS

### Community 131 - "apiErrorMessage"
Cohesion: 0.04
Nodes (17): AdmittedListDto, apiErrorMessage(), ExamRoomDto, MyResultDto, CasesAdminPage, Page, PaymentsAdminPage, Row (+9 more)

### Community 132 - "ngsw-config.json"
Cohesion: 0.40
Nodes (4): assetGroups, index, navigationUrls, $schema

### Community 133 - "screenshots-panel.mjs"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

### Community 135 - "accounts.test.ts"
Cohesion: 0.14
Nodes (13): FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, REDACTED_PATHS, activeAccount() (+5 more)

### Community 137 - "global-setup.ts"
Cohesion: 0.33
Nodes (3): backendDir, dataDir, TEST_DATABASE_URL

### Community 144 - "SiteAssets"
Cohesion: 0.31
Nodes (4): SiteAssets, announcementsQuery, configuracionRoutes(), publicCache()

## Knowledge Gaps
- **129 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+124 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1192 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `apiErrorMessage` to `api.service.ts`, `Sesión del panel (frontend)`, `@angular/core`, `attendance.ts`, `format.ts`, `dossiers.ts`, `inbox.ts`, `SecurityPage`, `AdminSession`, `format.ts`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `admin-login.ts`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `OnlinePayment`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `InscriptionsAdminPage`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `portal admin: KnowledgeAdminPage`, `portal admin: SystemAdminPage`, `portal admin: Component`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `portal admin: DisqualifiedAdminPage`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _129 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0430622009569378 - nodes in this community are weakly interconnected._
- **Why does `notFound()` connect `Contenido del portal (admin)` to `NotificationService`, `exam-service.ts`, `seguridad/index.ts`, `VacancyImport`, `Servicio de asistencia`, `inscription-service.ts`, `SiteAssets`, `support-cases.ts`, `Servicio de expedientes`, `Db`, `businessRule`, `results-service.ts`, `ConvocatoriasRepository`, `ficha-service.ts`, `inscription-service.ts`, `AssistantService`, `auth-service.ts`, `assistant-service.ts`, `pagos: money()`, `stage.ts`, `StaffAdmin`, `payment-service.ts`, `notification-service.ts`, `FichaService`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.03240058910162003 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `Contenido del portal (admin)` to `NotificationService`, `usuariosRoutes`, `exam-service.ts`, `seguridad/index.ts`, `VacancyImport`, `Servicio de asistencia`, `inscription-service.ts`, `SiteAssets`, `support-cases.ts`, `Servicio de expedientes`, `middleware.ts`, `Db`, `businessRule`, `Rutas del panel (backend)`, `results-service.ts`, `ficha-service.ts`, `inscription-service.ts`, `AssistantService`, `auth-service.ts`, `exam-pdf.ts`, `pagos: PaymentService`, `examenes/presentation/routes.ts`, `assistant-service.ts`, `pagos: money()`, `StaffAuthService`, `StaffAdmin`, `payment-service.ts`, `notification-service.ts`, `FichaService`, `resultados/presentation/routes.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `@angular/core` be split into smaller, more focused modules?**
  _Cohesion score 0.03710575139146568 - nodes in this community are weakly interconnected._