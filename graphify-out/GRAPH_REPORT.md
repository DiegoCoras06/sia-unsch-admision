# Graph Report - proyectofinal  (2026-11-02)

## Corpus Check
- 281 files · ~189,202 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .scss 5, (none) 4, .example 2)

## Summary
- 2897 nodes · 7095 edges · 132 communities (101 shown, 31 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 223 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ef4e244`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.service.ts
- Sesión del panel (frontend)
- format.ts
- Composición del backend y asistente
- Base de datos y arranque
- validationError
- Páginas del panel y errores
- Cliente API del portal
- Asistencia y PDF de examen
- Roles y permisos
- Contenido del portal (admin)
- Servicio de asistencia
- Dependencias del frontend
- Configuración de Angular
- Documentos de la inscripción
- Ingresantes CEPRE y ficha
- Carga directa a S3
- Puntos de entrada Lambda
- package.json
- Dependencias de desarrollo backend
- Servicio de expedientes
- Rutas del asistente y convocatoria
- Expedientes y almacenamiento
- Revisión de resultados
- inscription.ts
- Rutas del panel (backend)
- Pasarela micuentaweb
- Dependencias del backend
- Personal y scripts de acceso
- Puertos de pago y Yape
- @angular/core
- Exámenes (panel)
- Formulario de inscripción
- usuarios/index.ts
- online-payment.ts
- Proveedor de IA (asistente)
- Pruebas E2E con Playwright
- Notificaciones y campañas
- Pasarela Izipay
- Convocatoria (panel)
- pagos: izipay.ts
- admin.test.ts: movableClock()
- seguridad: .getStats()
- culqi.ts: dotenv@18.0.9
- asistente: AssistantService
- asistente: tools.ts
- package.json: scripts
- inscriptions.test.ts: fixedClock()
- InboxPanel
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- site-assets.ts
- convocatorias: .getOption()
- convocatorias: .listFees()
- scripts
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
- usuarios: StaffAdmin
- exams.test.ts: exams.test.ts
- portal admin: ContentAdminPage
- portal admin: TreasuryAdminPage
- portal admin: Component
- portal cuenta: MyAccountPage
- fee-calculator.test.ts: .of()
- pagos: PaymentSessionDto
- seguridad: totp.ts
- dossier.test.ts: dossier.test.ts
- pending-features.test.ts: pending-featur
- pagos: money()
- allowScripts
- convocatorias: .quoteFee()
- rds.ts: rds.ts
- seguridad: session-policy.ts
- portal admin: AdminLoginPage
- tsconfig.json: contracts/tsconfig.json
- e2e-resultados.mjs: e2e-resultados.mjs
- trazabilidad.mjs: trazabilidad.mjs
- catalog.ts: seed/catalog.ts
- convocatorias/presentation/routes.ts
- ubigeo.ts: .paymentContext()
- portal admin: DashboardPage
- portal admin: KnowledgeAdminPage
- portal admin: results.ts
- portal admin: SystemAdminPage
- assistant.test.ts: assistant.test.ts
- payments.test.ts: payments.test.ts
- tsconfig.json: backend/tsconfig.json
- portal admin: treasury.ts
- portal admin: Component
- portal cuenta: CreateAccountPage
- portal public: ComplaintsPage
- notificaciones: NoticeSources
- payments-server-check.test.ts: payments-
- portal admin: AdmissionsAdminPage
- portal cuenta: AccountLoginPage
- site-header.ts: SiteHeader
- e2e-examen.mjs: e2e-examen.mjs
- e2e-expediente.mjs: e2e-expediente.mjs
- e2e-inscripcion.mjs: e2e-inscripcion.mjs
- CasesAdminPage
- content.ts: seed/content.ts
- file-storage.ts: LocalFileStorage
- assistant-rules.ts
- attendance.ts
- portal admin: DisqualifiedAdminPage
- scripts
- markdown.pipe.ts: markdown.pipe.ts
- s3.test.ts: @aws-sdk/client-s3@^3.1158.0
- exams.ts: seed/exams.ts
- identity.ts: identity.ts
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- portal public: HomePage
- portal public: SyllabusPage
- .getStats
- package.json: pdfkit@^0.20.2

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
- `quote()` --calls--> `quoteFee()`  [EXTRACTED]
  apps/backend/tests/unit/convocatorias/fee-calculator.test.ts → apps/backend/src/modules/convocatorias/domain/fee-calculator.ts
- `seedStaff()` --calls--> `temporaryPassword()`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/application/staff-admin.ts
- `seedStaff()` --calls--> `Argon2Hasher`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/infrastructure/argon2-hasher.ts

## Import Cycles
- None detected.

## Communities (132 total, 31 thin omitted)

### Community 0 - "api.service.ts"
Cohesion: 0.05
Nodes (58): ApiHttpError, SubmodalityDto, ADR-0010, ADR-0015, ADR-0016, ADR-0017, ADR-0019, CallStore (+50 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.04
Nodes (53): AdminSession, CLIENT, Query, StaffMe, StaffStep, ADR-0018, shortDateTime(), STEP_LABEL (+45 more)

### Community 2 - "format.ts"
Cohesion: 0.07
Nodes (25): InboxDto, ReinscriptionCheck, dateRange(), dateTime(), longDate(), shortDate(), soles(), STAGE_STATUS_LABEL (+17 more)

### Community 3 - "Composición del backend y asistente"
Cohesion: 0.08
Nodes (34): Application, AppOverrides, AssistantReply, ADR-0017, KnowledgeAdmin, ToolDeps, createAsistenteModule(), ADR-0017 (+26 more)

### Community 4 - "Base de datos y arranque"
Cohesion: 0.06
Nodes (43): db, backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012, ADR-0019 (+35 more)

### Community 5 - "validationError"
Cohesion: 0.06
Nodes (54): PAID, Reason, Result, AuthService, IdentityTokenPayload, sha256(), ADR-0018, ACTIONS (+46 more)

### Community 6 - "Páginas del panel y errores"
Cohesion: 0.04
Nodes (16): AdmittedListDto, apiErrorMessage(), MyResultDto, AuditAdminPage, InscriptionsAdminPage, PaymentsAdminPage, FindRoomPage, ReinscriptionPage (+8 more)

### Community 8 - "Asistencia y PDF de examen"
Cohesion: 0.07
Nodes (43): attendancePdf(), eligibleListPdf(), ESCUDO, ExamInfo, examSlipPdf(), footer(), header(), hour() (+35 more)

### Community 9 - "Roles y permisos"
Cohesion: 0.09
Nodes (23): SupportCases, ALL, byRole, hasPermission(), Permission, PERMISSIONS, permissionsOf(), STAFF_ROLES (+15 more)

### Community 10 - "Contenido del portal (admin)"
Cohesion: 0.09
Nodes (7): ContentAdmin, CallAdmin, iso(), CatalogAdmin, SecurityAdmin, RequestMeta, notFound()

### Community 11 - "Servicio de asistencia"
Cohesion: 0.12
Nodes (8): AttendanceService, iso(), ExamService, iso(), roomInfo(), roomOrder(), createExamenesModule(), examenesRoutes()

### Community 12 - "Dependencias del frontend"
Cohesion: 0.10
Nodes (27): dependencies, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/router@22.2.3, rxjs@7.8.2, @sia/contracts@0.1.0, tslib@2.8.1 (+19 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (42): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+34 more)

### Community 14 - "Documentos de la inscripción"
Cohesion: 0.08
Nodes (13): ApplicationDocuments, FichaService, longDate(), shortName(), InscriptionService, longDate(), shortDate(), initialStatus() (+5 more)

### Community 15 - "Ingresantes CEPRE y ficha"
Cohesion: 0.13
Nodes (22): InscriptionInput, InscriptionSummary, NO_REINSCRIPTION, PaymentContext, ADR-0015, ADR-0017, ESCUDO, OrdenPagoService (+14 more)

### Community 16 - "Carga directa a S3"
Cohesion: 0.09
Nodes (17): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, Row (+9 more)

### Community 17 - "Puntos de entrada Lambda"
Cohesion: 0.07
Nodes (29): application, handler, ADR-0009, application, ADR-0012, application, env, server (+21 more)

### Community 18 - "package.json"
Cohesion: 0.15
Nodes (14): description, devDependencies, concurrently@10.0.6, playwright-core@1.64.1, typescript@6.0.3, engines, node, concurrently (+6 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.08
Nodes (35): devDependencies, concurrently@10.0.6, embedded-postgres@16.14.0-beta.17, esbuild@0.28.2, pino-pretty@13.2.0, prisma@7.10.1, supertest@7.3.1, tsx@4.23.15 (+27 more)

### Community 20 - "Servicio de expedientes"
Cohesion: 0.21
Nodes (4): DossierService, iso(), latest(), expedientesRoutes()

### Community 21 - "Rutas del asistente y convocatoria"
Cohesion: 0.10
Nodes (22): ADR-0017, configuracionRoutes(), applicant, meta(), sendFile(), ADR-0010, ADR-0018, applicant (+14 more)

### Community 22 - "Expedientes y almacenamiento"
Cohesion: 0.06
Nodes (33): Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus, OBSERVE_HOURS (+25 more)

### Community 23 - "Revisión de resultados"
Cohesion: 0.06
Nodes (31): iso(), MODALITY_LABEL, ResultPerson, ResultsPorts, ResultsService, Answers, computeScore(), Condition (+23 more)

### Community 24 - "inscription.ts"
Cohesion: 0.06
Nodes (24): CLIENT, ADR-0015, apiErrorCode(), apiErrorDetails(), Department, District, Province, UbigeoService (+16 more)

### Community 25 - "Rutas del panel (backend)"
Cohesion: 0.07
Nodes (23): actor(), AdminDeps, adminRoutes(), day, describe(), filterSchema, meta(), page (+15 more)

### Community 26 - "Pasarela micuentaweb"
Cohesion: 0.09
Nodes (20): backendDir, envFile, gw, hmacKey, keys, missing, password, publicKey (+12 more)

### Community 27 - "Dependencias del backend"
Cohesion: 0.07
Nodes (29): dependencies, @aws-sdk/client-sesv2@^3.1158.0, @aws-sdk/s3-presigned-post@^3.1158.0, @aws-sdk/s3-request-presigner@^3.1158.0, @codegenie/serverless-express@5.0.0, cookie-parser@1.4.7, exceljs@^4.4.0, express@5.3.0 (+21 more)

### Community 28 - "Personal y scripts de acceso"
Cohesion: 0.09
Nodes (20): argon2@0.45.1, db, [role = 'ADMISION', email = 'comision.local@unsch.test', file = '.comision-local.txt'], db, [email, file = '.admin-inicial.txt'], totpService, Argon2Hasher, staff() (+12 more)

### Community 29 - "Puertos de pago y Yape"
Cohesion: 0.10
Nodes (18): YapeSessionDto, ADR-0007, ADR-0016, ADR-0019, YapeChargeRequest, YapeGateway, CulqiCharge, CulqiConfig (+10 more)

### Community 30 - "@angular/core"
Cohesion: 0.04
Nodes (44): @angular/platform-browser@22.2.3, App, appConfig, routes, ADR-0015, ADR-0018, ExamRoomDto, FichaVerification (+36 more)

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "usuarios/index.ts"
Cohesion: 0.10
Nodes (16): token, SecretBox, IdentityLookupResult, IdentityProvider, ADR-0007, ADR-0015, createIdentityProvider(), createUsuariosModule() (+8 more)

### Community 34 - "online-payment.ts"
Cohesion: 0.13
Nodes (11): CulqiCtor, CulqiInstance, IzipayCheckout, IzipayCtor, IzipayResponse, KrSubmit, scripts, ADR-0016 (+3 more)

### Community 35 - "Proveedor de IA (asistente)"
Cohesion: 0.17
Nodes (14): LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017, OpenRouterProvider (+6 more)

### Community 36 - "Pruebas E2E con Playwright"
Cohesion: 0.07
Nodes (15): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900028', out = '.screens/cuenta'], ADR-0015, [dni = '99900050', email = 'e2e.micuentaweb@example.com', card = '4970100000000055', out = '.screens/pago-sandbox'], jobs, [out = '.screens', ...routes], base32Decode() (+7 more)

### Community 37 - "Notificaciones y campañas"
Cohesion: 0.19
Nodes (6): day(), hour(), NotificationService, escape(), fill(), notificacionesRoutes()

### Community 38 - "Pasarela Izipay"
Cohesion: 0.16
Nodes (14): ProviderResult, CheckoutRequest, SignedMessage, API, IzipayConfig, SDK, MockPaymentGateway, ADR-0007 (+6 more)

### Community 39 - "Convocatoria (panel)"
Cohesion: 0.12
Nodes (12): Awardee, Awardees, CallAdminPage, CallDetail, Fee, fromLima(), ImportPreview, ImportRow (+4 more)

### Community 40 - "pagos: izipay.ts"
Cohesion: 0.13
Nodes (21): backendDir, envFile, gw, missing, ADR-0016, Attempt, AttemptResultDto, PaymentStatusDto (+13 more)

### Community 41 - "admin.test.ts: movableClock()"
Cohesion: 0.09
Nodes (9): movableClock(), clock, secrets, t, t, box, clock, t (+1 more)

### Community 42 - "seguridad: .getStats()"
Cohesion: 0.09
Nodes (10): AccessService, SessionMeta, SessionService, sha256(), ADR-0006, SESSION_TTL, Totp, PasswordHasher (+2 more)

### Community 43 - "culqi.ts: dotenv@18.0.9"
Cohesion: 0.11
Nodes (13): dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile, ses (+5 more)

### Community 44 - "asistente: AssistantService"
Cohesion: 0.23
Nodes (5): AssistantService, asksForHuman(), maskPersonal(), asistenteRoutes(), meta()

### Community 45 - "asistente: tools.ts"
Cohesion: 0.13
Nodes (7): AssistantTools, ESTADO_ETAPA, fecha(), STOP, terms(), ToolResult, ADR-0017

### Community 46 - "package.json: scripts"
Cohesion: 0.10
Nodes (21): scripts, apiperu:check, build, culqi:check, db:reset, db:setup, db:start, db:stop (+13 more)

### Community 47 - "inscriptions.test.ts: fixedClock()"
Cohesion: 0.13
Nodes (10): fixedClock(), MemoryEmailSender, MemoryFileStorage, checkDigit, TEST_URL, testApp(), t, base (+2 more)

### Community 50 - "portal admin: AttendanceAdminPage"
Cohesion: 0.20
Nodes (3): AttendanceAdminPage, isOffline(), writeQueue()

### Community 51 - "index.ts: seed/index.ts"
Cohesion: 0.17
Nodes (16): main(), prisma, publicDocsDir, seedCall(), seedCatalog(), seedContent(), seedExams(), seedIdentity() (+8 more)

### Community 52 - "site-assets.ts"
Cohesion: 0.25
Nodes (6): SITE_SLOTS, SiteAssets, SiteSlot, sniff(), TYPES, createConfiguracionModule()

### Community 53 - "convocatorias: .getOption()"
Cohesion: 0.17
Nodes (4): CallSummary, ConvocatoriasRepository, SubmodalityRecord, convocatoriasRoutes()

### Community 54 - "convocatorias: .listFees()"
Cohesion: 0.15
Nodes (11): byPriority(), FeeInfo, FeeQuote, matches(), MilitaryCondition, Modality, quoteFee(), SchoolType (+3 more)

### Community 55 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:setup, db:start, db:stop, dev, dev:rds, izipay:check (+6 more)

### Community 57 - "tsconfig.base.json: tsconfig.base.json"
Cohesion: 0.10
Nodes (19): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+11 more)

### Community 58 - "accounts.test.ts: synthetic-identities.t"
Cohesion: 0.14
Nodes (13): FIRST, scenarioFor(), SURNAMES, syntheticCheckDigit(), syntheticIdentities, SyntheticIdentity, REDACTED_PATHS, activeAccount() (+5 more)

### Community 59 - "portal admin: blankProgram()"
Cohesion: 0.16
Nodes (3): blankProgram(), blankReq(), CatalogAdminPage

### Community 60 - "call-2027-I.ts: call-2027-I.ts"
Cohesion: 0.11
Nodes (15): call, feeRules, fees, FeeSeed, Kind, officialDocuments, officialTotals, ReqSeed (+7 more)

### Community 61 - "convocatorias: stages"
Cohesion: 0.16
Nodes (9): stages, shortDate(), nextMilestone(), Stage, StageKind, StageScope, StageStatus, stageStatus() (+1 more)

### Community 64 - "db.ts: db.ts"
Cohesion: 0.16
Nodes (13): backendDir, dataDir, ensureDatabase(), ensureStarted(), isPortOpen(), main(), migrateAndSeed(), npx() (+5 more)

### Community 65 - "pagos: PaymentService"
Cohesion: 0.30
Nodes (4): PaymentService, formatAmount(), createPagosModule(), pagosRoutes()

### Community 66 - "portal pago: loadScript()"
Cohesion: 0.18
Nodes (4): KrClient, loadScript(), OnlinePayment, PaymentSessionDto

### Community 67 - "s3-file-storage.ts: s3-check.ts"
Cohesion: 0.13
Nodes (6): s3, files, root, s3, TYPES, S3FileStorage

### Community 68 - "convocatorias: PrismaConvocatoriasReposi"
Cohesion: 0.13
Nodes (3): OptionRecord, PrismaConvocatoriasRepository, toFee()

### Community 69 - "optimizar-imagenes.mjs"
Cohesion: 0.22
Nodes (7): sharp@^0.34.5, sharp, base, dir, require, sharp, WIDTHS

### Community 70 - "results.test.ts: results.test.ts"
Cohesion: 0.15
Nodes (10): box, clock, codes, DNIS, fakeJpeg(), jump(), registerExo(), secrets (+2 more)

### Community 72 - "package.json: contracts/package.json"
Cohesion: 0.14
Nodes (14): description, devDependencies, typescript@6.0.3, exports, typescript, main, name, private (+6 more)

### Community 74 - "exams.test.ts: exams.test.ts"
Cohesion: 0.16
Nodes (10): box, clock, codes, DNIS, fakeJpeg(), jump(), registerOrd(), secrets (+2 more)

### Community 78 - "portal cuenta: MyAccountPage"
Cohesion: 0.16
Nodes (4): MyAccountPage, base32Decode(), text, totp()

### Community 79 - "fee-calculator.test.ts: .of()"
Cohesion: 0.15
Nodes (11): base, CEPRE_EXTEMP, CEPRE_REGULAR, EXO_EXTEMP, fees, ORD_EXTEMP, quote(), REGULAR (+3 more)

### Community 80 - "pagos: PaymentSessionDto"
Cohesion: 0.23
Nodes (5): PaymentSessionDto, CheckoutSession, PaymentGateway, IzipayPaymentGateway, gatewayUnavailable()

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
Nodes (7): stamp(), money(), providerPaid(), TreasuryService, createTesoreria(), treasuryRoutes(), businessRule()

### Community 85 - "allowScripts"
Cohesion: 0.22
Nodes (9): allowScripts, argon2@0.45.1, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher, prisma@7.10.1 (+1 more)

### Community 86 - "convocatorias: .quoteFee()"
Cohesion: 0.20
Nodes (8): FeeCriteria, FeeRule, SurchargeRule, DocumentRecord, QuotaCategoryRecord, RequirementRecord, SyllabusRecord, ADR-0002

### Community 87 - "rds.ts: rds.ts"
Cohesion: 0.16
Nodes (12): backendDir, caFile, check(), client(), envFile, migrate(), setup(), ADR-0009 (+4 more)

### Community 88 - "seguridad: session-policy.ts"
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

### Community 94 - "convocatorias/presentation/routes.ts"
Cohesion: 0.29
Nodes (6): booleanish, callCode, callParams, feeQuoteQuery, optionsQuery, publicCache()

### Community 95 - "ubigeo.ts: .paymentContext()"
Cohesion: 0.22
Nodes (7): Department, departments, District, districtIndex, districtLabel(), isValidDistrict(), Province

### Community 98 - "portal admin: results.ts"
Cohesion: 0.25
Nodes (7): Batch, ExamResults, Issue, STATUS, TAG, VersionDetail, VersionSummary

### Community 100 - "assistant.test.ts: assistant.test.ts"
Cohesion: 0.29
Nodes (5): ai, basic, scripted, toolCall(), usage

### Community 101 - "payments.test.ts: payments.test.ts"
Cohesion: 0.32
Nodes (5): confirmWith(), fakeJpeg(), register(), signed(), t

### Community 102 - "tsconfig.json: backend/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, ../../tsconfig.base.json

### Community 103 - "portal admin: treasury.ts"
Cohesion: 0.29
Nodes (6): Annulment, Item, RESULTS, Run, RunDetail, Summary

### Community 108 - "payments-server-check.test.ts: payments-"
Cohesion: 0.33
Nodes (4): fakeJpeg(), gateway, register(), t

### Community 112 - "e2e-examen.mjs: e2e-examen.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 113 - "e2e-expediente.mjs: e2e-expediente.mjs"
Cohesion: 0.33
Nodes (3): admin, base32Decode(), totp()

### Community 114 - "e2e-inscripcion.mjs: e2e-inscripcion.mjs"
Cohesion: 0.29
Nodes (4): errors, ADR-0015, photo, width

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 118 - "assistant-rules.ts"
Cohesion: 0.33
Nodes (5): LIMITS, NO_INFO_REPLY, SUGGESTIONS, SYSTEM_PROMPT, ADR-0017

### Community 119 - "attendance.ts"
Cohesion: 0.10
Nodes (11): @angular/common@22.2.3, AssetMap, SiteImages, BoardExam, BoardRoom, CheckIn, Incident, INCIDENTS (+3 more)

### Community 121 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, ng, start, test, watch

### Community 122 - "markdown.pipe.ts: markdown.pipe.ts"
Cohesion: 0.24
Nodes (5): StepsPage, escape(), inline(), MarkdownPipe, HomeContentDto

### Community 123 - "s3.test.ts: @aws-sdk/client-s3@^3.1158.0"
Cohesion: 0.40
Nodes (4): @aws-sdk/client-s3@^3.1158.0, client, storage, @aws-sdk/client-s3

### Community 124 - "exams.ts: seed/exams.ts"
Cohesion: 0.40
Nodes (4): BUILDINGS, exams, rooms, venue

### Community 125 - "identity.ts: identity.ts"
Cohesion: 0.40
Nodes (4): consentDocument, disqualifiedPersons, permissions, roles

## Knowledge Gaps
- **117 isolated node(s):** `ADR-0018`, `ADR-0017`, `ADR-0017`, `ADR-0019`, `ADR-0014` (+112 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1139 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `Páginas del panel y errores` to `api.service.ts`, `Sesión del panel (frontend)`, `format.ts`, `Carga directa a S3`, `inscription.ts`, `@angular/core`, `Exámenes (panel)`, `Formulario de inscripción`, `online-payment.ts`, `Convocatoria (panel)`, `InboxPanel`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `portal pago: loadScript()`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `portal admin: KnowledgeAdminPage`, `portal admin: results.ts`, `portal admin: SystemAdminPage`, `portal admin: treasury.ts`, `portal admin: Component`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `CasesAdminPage`, `attendance.ts`, `portal admin: DisqualifiedAdminPage`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _117 weakly-connected nodes found - possible missing edges._
- **Should `api.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `Contenido del portal (admin)` to `Composición del backend y asistente`, `Base de datos y arranque`, `validationError`, `Asistencia y PDF de examen`, `Servicio de asistencia`, `Documentos de la inscripción`, `Ingresantes CEPRE y ficha`, `Servicio de expedientes`, `Rutas del asistente y convocatoria`, `Expedientes y almacenamiento`, `Revisión de resultados`, `Rutas del panel (backend)`, `Notificaciones y campañas`, `pagos: izipay.ts`, `asistente: AssistantService`, `index.ts: seed/index.ts`, `site-assets.ts`, `pagos: PaymentService`, `usuarios: StaffAdmin`, `pagos: money()`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.03529686769518466 - nodes in this community are weakly interconnected._
- **Why does `notFound()` connect `Contenido del portal (admin)` to `api.service.ts`, `Composición del backend y asistente`, `Base de datos y arranque`, `validationError`, `Asistencia y PDF de examen`, `Servicio de asistencia`, `Documentos de la inscripción`, `Ingresantes CEPRE y ficha`, `Servicio de expedientes`, `Rutas del asistente y convocatoria`, `Expedientes y almacenamiento`, `Revisión de resultados`, `Rutas del panel (backend)`, `Notificaciones y campañas`, `pagos: izipay.ts`, `asistente: AssistantService`, `index.ts: seed/index.ts`, `site-assets.ts`, `convocatorias: .getOption()`, `convocatorias: stages`, `pagos: PaymentService`, `usuarios: StaffAdmin`, `pagos: money()`, `ubigeo.ts: .paymentContext()`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `format.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0663265306122449 - nodes in this community are weakly interconnected._