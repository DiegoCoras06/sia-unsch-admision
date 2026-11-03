# Graph Report - proyectofinal  (2026-11-02)

## Corpus Check
- 284 files · ~189,191 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .scss 5, (none) 4, .example 2)

## Summary
- 2896 nodes · 7091 edges · 134 communities (98 shown, 36 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 223 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Contratos y consultas de convocatoria
- Sesión del panel (frontend)
- Rutas y pantallas del portal
- Composición del backend y asistente
- Base de datos y arranque
- Identidad RENIEC y acceso
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
- Dependencias del monorepo
- Dependencias de desarrollo backend
- Servicio de expedientes
- Rutas del asistente y convocatoria
- Expedientes y almacenamiento
- Revisión de resultados
- Raíz de la app Angular
- Rutas del panel (backend)
- Pasarela micuentaweb
- Dependencias del backend
- Personal y scripts de acceso
- Puertos de pago y Yape
- Buscar aula y resultados (portal)
- Exámenes (panel)
- Formulario de inscripción
- Servicio de resultados
- Autenticación de postulantes
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
- portal avisos: app/app.ts
- account-session.ts: AccountSession
- portal admin: AttendanceAdminPage
- index.ts: seed/index.ts
- configuracion: configuracion-queries.ts
- convocatorias: .getOption()
- convocatorias: .listFees()
- seguridad: file-check.ts
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
- reportes: ReportQueries
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
- documents.ts: documents.ts
- convocatorias: .quoteFee()
- rds.ts: rds.ts
- seguridad: session-policy.ts
- portal admin: AdminLoginPage
- tsconfig.json: contracts/tsconfig.json
- e2e-resultados.mjs: e2e-resultados.mjs
- trazabilidad.mjs: trazabilidad.mjs
- catalog.ts: seed/catalog.ts
- inscripciones: FichaService
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
- screenshots-panel.mjs: screenshots-panel
- content.ts: seed/content.ts
- file-storage.ts: LocalFileStorage
- global-setup.ts: global-setup.ts
- site-images.ts: SiteImages
- portal admin: DisqualifiedAdminPage
- portal pago: KrClient
- markdown.pipe.ts: markdown.pipe.ts
- s3.test.ts: @aws-sdk/client-s3@^3.1158.0
- exams.ts: seed/exams.ts
- identity.ts: identity.ts
- portal public: AnnouncementsPage
- portal public: ProgramsPage
- portal public: HomePage
- portal public: SyllabusPage
- portal public: CartaAvalPage
- portal public: RequirementsPage
- portal resultados: Component
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
- `quote()` --calls--> `quoteFee()`  [EXTRACTED]
  apps/backend/tests/unit/convocatorias/fee-calculator.test.ts → apps/backend/src/modules/convocatorias/domain/fee-calculator.ts
- `createSeguridadModule()` --indirect_call--> `authorize()`  [INFERRED]
  apps/backend/src/modules/seguridad/index.ts → apps/backend/src/modules/seguridad/presentation/auth-middleware.ts
- `seedStaff()` --calls--> `temporaryPassword()`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/application/staff-admin.ts
- `seedStaff()` --calls--> `Argon2Hasher`  [EXTRACTED]
  apps/backend/prisma/seed/index.ts → apps/backend/src/modules/usuarios/infrastructure/argon2-hasher.ts

## Import Cycles
- None detected.

## Communities (134 total, 36 thin omitted)

### Community 0 - "Contratos y consultas de convocatoria"
Cohesion: 0.03
Nodes (79): OptionRecord, CLIENT, ADR-0015, apiErrorCode(), apiErrorDetails(), FichaVerification, ReinscriptionCheck, ADR-0010 (+71 more)

### Community 1 - "Sesión del panel (frontend)"
Cohesion: 0.03
Nodes (58): AdminSession, CLIENT, Query, StaffMe, ADR-0018, shortDateTime(), adminRoutes, ADR-0018 (+50 more)

### Community 2 - "Rutas y pantallas del portal"
Cohesion: 0.05
Nodes (50): ADR-0015, ADR-0018, StaffStep, SubmodalityDto, CallStore, AREA_NAMES, dateRange(), dateTime() (+42 more)

### Community 3 - "Composición del backend y asistente"
Cohesion: 0.08
Nodes (30): Application, AssistantReply, ADR-0017, KnowledgeAdmin, ToolDeps, createAsistenteModule(), ADR-0017, DEFAULT_PARAMETERS (+22 more)

### Community 4 - "Base de datos y arranque"
Cohesion: 0.05
Nodes (52): db, AppOverrides, backendDir, createApplication(), integrationStatus(), ADR-0002, ADR-0010, ADR-0012 (+44 more)

### Community 5 - "Identidad RENIEC y acceso"
Cohesion: 0.06
Nodes (45): token, AccessService, AuthDeps, IdentityTokenPayload, ADR-0018, ACTIONS, ProfileService, ROLE_CODES (+37 more)

### Community 6 - "Páginas del panel y errores"
Cohesion: 0.04
Nodes (16): apiErrorMessage(), MyResultDto, AuditAdminPage, CasesAdminPage, InscriptionsAdminPage, PaymentsAdminPage, FindRoomPage, ReinscriptionPage (+8 more)

### Community 8 - "Asistencia y PDF de examen"
Cohesion: 0.07
Nodes (44): attendancePdf(), eligibleListPdf(), ESCUDO, ExamInfo, examSlipPdf(), footer(), header(), hour() (+36 more)

### Community 9 - "Roles y permisos"
Cohesion: 0.08
Nodes (29): ALL, byRole, hasPermission(), Permission, PERMISSIONS, permissionsOf(), STAFF_ROLES, ADR-0018 (+21 more)

### Community 10 - "Contenido del portal (admin)"
Cohesion: 0.09
Nodes (7): ContentAdmin, CallAdmin, iso(), CatalogAdmin, SecurityAdmin, RequestMeta, notFound()

### Community 11 - "Servicio de asistencia"
Cohesion: 0.12
Nodes (8): AttendanceService, iso(), ExamService, iso(), roomInfo(), createExamenesModule(), examenesRoutes(), conflict()

### Community 12 - "Dependencias del frontend"
Cohesion: 0.05
Nodes (42): dependencies, @angular/common@22.2.3, @angular/compiler@22.2.3, @angular/core@22.2.3, @angular/forms@22.2.3, @angular/platform-browser@22.2.3, @angular/router@22.2.3, rxjs@7.8.2 (+34 more)

### Community 13 - "Configuración de Angular"
Cohesion: 0.05
Nodes (42): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+34 more)

### Community 14 - "Documentos de la inscripción"
Cohesion: 0.09
Nodes (8): ApplicationDocuments, InscriptionService, longDate(), shortDate(), stamp(), maskDocument(), inscripcionesRoutes(), meta()

### Community 15 - "Ingresantes CEPRE y ficha"
Cohesion: 0.09
Nodes (30): CepreAwardees, ENTRY, ESCUDO, InscriptionInput, InscriptionSummary, NO_REINSCRIPTION, PaymentContext, ADR-0015 (+22 more)

### Community 16 - "Carga directa a S3"
Cohesion: 0.08
Nodes (19): BY_EXTENSION, fileType(), openDocument(), postToS3(), toBase64(), ADR-0010, UploadTicket, Row (+11 more)

### Community 17 - "Puntos de entrada Lambda"
Cohesion: 0.07
Nodes (29): application, handler, ADR-0009, application, ADR-0012, application, env, server (+21 more)

### Community 18 - "Dependencias del monorepo"
Cohesion: 0.06
Nodes (37): allowScripts, argon2@0.45.1, @embedded-postgres/windows-x64@16.14.0-beta.17, esbuild@0.28.2, lmdb, msgpackr-extract, @parcel/watcher, prisma@7.10.1 (+29 more)

### Community 19 - "Dependencias de desarrollo backend"
Cohesion: 0.08
Nodes (35): devDependencies, concurrently@10.0.6, embedded-postgres@16.14.0-beta.17, esbuild@0.28.2, pino-pretty@13.2.0, prisma@7.10.1, supertest@7.3.1, tsx@4.23.15 (+27 more)

### Community 20 - "Servicio de expedientes"
Cohesion: 0.15
Nodes (9): DossierService, iso(), latest(), applicant, expedientesRoutes(), meta(), sendFile(), ADR-0010 (+1 more)

### Community 21 - "Rutas del asistente y convocatoria"
Cohesion: 0.09
Nodes (27): ADR-0017, booleanish, callCode, callParams, feeQuoteQuery, optionsQuery, applicant, meta() (+19 more)

### Community 22 - "Expedientes y almacenamiento"
Cohesion: 0.09
Nodes (23): Doc, DossierContext, Row, ADR-0010, COMPLEMENTARY_FIELDS, DOSSIER_STATUS_LABEL, DossierStatus, OBSERVE_HOURS (+15 more)

### Community 23 - "Revisión de resultados"
Cohesion: 0.09
Nodes (21): MODALITY_LABEL, ResultPerson, ResultsPorts, Answers, computeScore(), Condition, CONDITION_LABEL, Contender (+13 more)

### Community 24 - "Raíz de la app Angular"
Cohesion: 0.06
Nodes (17): App, appConfig, routes, AssetMap, Department, District, Province, UbigeoService (+9 more)

### Community 25 - "Rutas del panel (backend)"
Cohesion: 0.11
Nodes (21): actor(), AdminDeps, adminRoutes(), day, describe(), filterSchema, meta(), page (+13 more)

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

### Community 30 - "Buscar aula y resultados (portal)"
Cohesion: 0.10
Nodes (8): AdmittedListDto, ExamRoomDto, InscriptionReceipt, MyInscriptionPage, ADR-0015, CodeReminder, DocsSidebar, @angular/forms

### Community 31 - "Exámenes (panel)"
Cohesion: 0.13
Nodes (3): ExamsAdminPage, fromLima(), toLima()

### Community 32 - "Formulario de inscripción"
Cohesion: 0.12
Nodes (3): clearDraft(), InscriptionPage, readDraft()

### Community 33 - "Servicio de resultados"
Cohesion: 0.19
Nodes (5): iso(), ResultsService, createResultadosModule(), resultadosRoutes(), businessRule()

### Community 34 - "Autenticación de postulantes"
Cohesion: 0.14
Nodes (8): AuthService, sha256(), describeDevice(), requireClientHeader(), usuariosRoutes(), IdentityLookupRequestDto, RegisterRequestDto, TokenDto

### Community 35 - "Proveedor de IA (asistente)"
Cohesion: 0.17
Nodes (14): LlmMessage, LlmProvider, LlmResponse, LlmToolCall, ToolSpec, ADR-0007, ADR-0017, OpenRouterProvider (+6 more)

### Community 36 - "Pruebas E2E con Playwright"
Cohesion: 0.09
Nodes (9): playwright-core, [dni = '99900025', code = '27000025', out = '.screens/asistente'], [dni = '99900028', out = '.screens/cuenta'], ADR-0015, [dni = '99900050', email = 'e2e.micuentaweb@example.com', card = '4970100000000055', out = '.screens/pago-sandbox'], jobs, [out = '.screens', ...routes], report (+1 more)

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
Cohesion: 0.13
Nodes (8): EnrollmentStatsProvider, SessionMeta, SessionService, sha256(), ADR-0006, SESSION_TTL, sanitize(), Tx

### Community 43 - "culqi.ts: dotenv@18.0.9"
Cohesion: 0.11
Nodes (13): dotenv@18.0.9, api, backendDir, envFile, ADR-0019, backendDir, envFile, ses (+5 more)

### Community 44 - "asistente: AssistantService"
Cohesion: 0.15
Nodes (10): AssistantService, asksForHuman(), LIMITS, maskPersonal(), NO_INFO_REPLY, SUGGESTIONS, SYSTEM_PROMPT, ADR-0017 (+2 more)

### Community 45 - "asistente: tools.ts"
Cohesion: 0.13
Nodes (7): AssistantTools, ESTADO_ETAPA, fecha(), STOP, terms(), ToolResult, ADR-0017

### Community 46 - "package.json: scripts"
Cohesion: 0.10
Nodes (21): scripts, apiperu:check, build, culqi:check, db:reset, db:setup, db:start, db:stop (+13 more)

### Community 47 - "inscriptions.test.ts: fixedClock()"
Cohesion: 0.13
Nodes (10): fixedClock(), MemoryEmailSender, MemoryFileStorage, checkDigit, TEST_URL, testApp(), t, base (+2 more)

### Community 48 - "portal avisos: app/app.ts"
Cohesion: 0.13
Nodes (9): InboxDto, InboxPanel, Line, Msg, Panel, ADR-0017, SiteFooter, Menu (+1 more)

### Community 50 - "portal admin: AttendanceAdminPage"
Cohesion: 0.20
Nodes (3): AttendanceAdminPage, isOffline(), writeQueue()

### Community 51 - "index.ts: seed/index.ts"
Cohesion: 0.17
Nodes (16): main(), prisma, publicDocsDir, seedCall(), seedCatalog(), seedContent(), seedExams(), seedIdentity() (+8 more)

### Community 52 - "configuracion: configuracion-queries.ts"
Cohesion: 0.18
Nodes (11): ConfiguracionQueries, SITE_SLOTS, SiteAssets, SiteSlot, sniff(), TYPES, createConfiguracionModule(), announcementsQuery (+3 more)

### Community 53 - "convocatorias: .getOption()"
Cohesion: 0.18
Nodes (4): CallSummary, ConvocatoriasRepository, SubmodalityRecord, convocatoriasRoutes()

### Community 54 - "convocatorias: .listFees()"
Cohesion: 0.15
Nodes (11): byPriority(), FeeInfo, FeeQuote, matches(), MilitaryCondition, Modality, quoteFee(), SchoolType (+3 more)

### Community 55 - "seguridad: file-check.ts"
Cohesion: 0.18
Nodes (9): checkDocument(), CheckedFile, MAX_DOCUMENT_BYTES, EVIDENCE, EvidenceInput, SupportCases, createSeguridadModule(), seguridadRoutes() (+1 more)

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

### Community 67 - "s3-file-storage.ts: s3-check.ts"
Cohesion: 0.13
Nodes (6): s3, files, root, s3, TYPES, S3FileStorage

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
Cohesion: 0.33
Nodes (5): money(), providerPaid(), TreasuryService, createTesoreria(), treasuryRoutes()

### Community 85 - "documents.ts: documents.ts"
Cohesion: 0.21
Nodes (6): docBySlug(), OFFICIAL_DOCS, OfficialDoc, DocumentPage, PdfViewer, @angular/platform-browser

### Community 86 - "convocatorias: .quoteFee()"
Cohesion: 0.20
Nodes (8): FeeCriteria, FeeRule, SurchargeRule, DocumentRecord, QuotaCategoryRecord, RequirementRecord, SyllabusRecord, ADR-0002

### Community 87 - "rds.ts: rds.ts"
Cohesion: 0.29
Nodes (9): backendDir, caFile, check(), client(), envFile, migrate(), setup(), ADR-0009 (+1 more)

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

### Community 94 - "inscripciones: FichaService"
Cohesion: 0.36
Nodes (3): FichaService, longDate(), shortName()

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

### Community 115 - "screenshots-panel.mjs: screenshots-panel"
Cohesion: 0.33
Nodes (6): base32Decode(), health, [out = '.screens/panel-ui', ...routes], t, totp(), width

### Community 116 - "content.ts: seed/content.ts"
Cohesion: 0.33
Nodes (5): announcements, authorityMessages, contentBlocks, featureFlags, heroSlides

### Community 118 - "global-setup.ts: global-setup.ts"
Cohesion: 0.33
Nodes (3): backendDir, dataDir, TEST_DATABASE_URL

### Community 122 - "markdown.pipe.ts: markdown.pipe.ts"
Cohesion: 0.47
Nodes (3): escape(), inline(), MarkdownPipe

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
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiErrorMessage()` connect `Páginas del panel y errores` to `Contratos y consultas de convocatoria`, `Sesión del panel (frontend)`, `Rutas y pantallas del portal`, `Carga directa a S3`, `Raíz de la app Angular`, `Buscar aula y resultados (portal)`, `Exámenes (panel)`, `Formulario de inscripción`, `Convocatoria (panel)`, `portal avisos: app/app.ts`, `portal admin: AttendanceAdminPage`, `portal admin: ResultsAdminPage`, `portal admin: blankProgram()`, `portal admin: DossiersAdminPage`, `portal admin: NotificationsAdminPage`, `portal pago: loadScript()`, `assistant.ts: Assistant`, `portal admin: ContentAdminPage`, `portal admin: TreasuryAdminPage`, `portal admin: Component`, `portal cuenta: MyAccountPage`, `portal admin: AdminLoginPage`, `portal admin: DashboardPage`, `portal admin: KnowledgeAdminPage`, `portal admin: results.ts`, `portal admin: SystemAdminPage`, `portal admin: treasury.ts`, `portal admin: Component`, `portal cuenta: CreateAccountPage`, `portal public: ComplaintsPage`, `portal admin: AdmissionsAdminPage`, `portal cuenta: AccountLoginPage`, `portal admin: DisqualifiedAdminPage`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `ADR-0018`, `ADR-0017`, `ADR-0017` to the rest of the system?**
  _117 weakly-connected nodes found - possible missing edges._
- **Should `Contratos y consultas de convocatoria` be split into smaller, more focused modules?**
  _Cohesion score 0.030715316429602145 - nodes in this community are weakly interconnected._
- **Why does `RequestMeta` connect `Contenido del portal (admin)` to `Composición del backend y asistente`, `Base de datos y arranque`, `Identidad RENIEC y acceso`, `Asistencia y PDF de examen`, `Roles y permisos`, `Servicio de asistencia`, `Documentos de la inscripción`, `Ingresantes CEPRE y ficha`, `Servicio de expedientes`, `Rutas del asistente y convocatoria`, `Expedientes y almacenamiento`, `Revisión de resultados`, `Rutas del panel (backend)`, `Servicio de resultados`, `Autenticación de postulantes`, `Notificaciones y campañas`, `pagos: izipay.ts`, `asistente: AssistantService`, `index.ts: seed/index.ts`, `configuracion: configuracion-queries.ts`, `pagos: PaymentService`, `usuarios: StaffAdmin`, `pagos: money()`, `inscripciones: FichaService`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `Sesión del panel (frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.03240058910162003 - nodes in this community are weakly interconnected._
- **Why does `notFound()` connect `Contenido del portal (admin)` to `Contratos y consultas de convocatoria`, `Composición del backend y asistente`, `Base de datos y arranque`, `Identidad RENIEC y acceso`, `Asistencia y PDF de examen`, `Servicio de asistencia`, `Documentos de la inscripción`, `Ingresantes CEPRE y ficha`, `Servicio de expedientes`, `Expedientes y almacenamiento`, `Revisión de resultados`, `Rutas del panel (backend)`, `Servicio de resultados`, `Autenticación de postulantes`, `Notificaciones y campañas`, `pagos: izipay.ts`, `asistente: AssistantService`, `index.ts: seed/index.ts`, `configuracion: configuracion-queries.ts`, `convocatorias: .getOption()`, `convocatorias: stages`, `pagos: PaymentService`, `usuarios: StaffAdmin`, `pagos: money()`, `inscripciones: FichaService`, `ubigeo.ts: .paymentContext()`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `Rutas y pantallas del portal` be split into smaller, more focused modules?**
  _Cohesion score 0.054858934169279 - nodes in this community are weakly interconnected._