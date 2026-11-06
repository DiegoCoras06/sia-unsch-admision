# Arquitectura general — SIA-UNSCH

**Versión:** 1.0 — 25/10/2026 · **Modelo:** C4 (Contexto → Contenedores → Componentes) + vista de despliegue
**Decisiones que la justifican:** [`docs/adr/`](adr/README.md)

> Esta vista es transversal a todas las funcionalidades de `specs/`. Cada `design.md` debe respetarla; si una funcionalidad necesita desviarse, se registra un ADR nuevo.

---

## 1. Impulsores de la arquitectura

Lo que más condiciona el diseño, tomado de la constitución y las especificaciones:

| Impulsor | Fuente | Consecuencia arquitectónica |
|---|---|---|
| Picos de carga muy concentrados (cierre de inscripción, día de resultados) y casi nada el resto del año | RNF-04, RNF-05 | Cómputo que escala por demanda y no cuesta cuando está inactivo → **AWS Lambda** (ADR-009) |
| Reglas de negocio densas y cambiantes por convocatoria | Constitución II.2, `reglas-negocio.md` | **Dominio aislado** y **configuración como datos** (ADR-002, ADR-011) |
| Integridad de pagos, inscripciones y resultados | RNF-09 | Base **relacional transaccional** y **idempotencia** (ADR-005, ADR-008) |
| Integraciones aún no contratadas (RENIEC, pasarela, SMS) | Constitución II.3 | **Puertos y adaptadores**, con simulaciones intercambiables (ADR-007) |
| Datos personales y documentos sensibles | RNF-03, Ley 29733 | Almacenamiento privado, URLs temporales, RBAC y auditoría (ADR-006, ADR-010) |
| Equipo pequeño, plazo de un semestre | Contexto académico | **Un solo backend desplegable**, no microservicios (ADR-001) |
| Publicación a fecha y hora exactas (aulas, resultados) y recordatorios | specs 006, 007, 010 | **Tareas programadas** y procesamiento asíncrono (ADR-012) |

---

## 2. Nivel 1 — Diagrama de contexto

Quién usa el sistema y con qué sistemas externos conversa.

```mermaid
flowchart TB
  subgraph Personas
    VIS["👤 Visitante<br/><i>consulta información pública</i>"]
    POS["🎓 Postulante<br/><i>se inscribe, paga, consulta</i>"]
    STAFF["🏛️ Personal de Admisión<br/><i>Admisión, Evaluador, Tesorería,<br/>Coordinador, Operador, Soporte, Auditor</i>"]
  end

  SIA["<b>SIA-UNSCH</b><br/>Sistema Integral de Admisión<br/><i>portal público, portal del postulante<br/>y panel administrativo</i>"]

  subgraph Externos["Sistemas externos"]
    RENIEC["🪪 Proveedor de identidad<br/>RENIEC <i>(simulado)</i>"]
    PAY["💳 Izipay<br/><i>pasarela de pagos (sandbox)</i>"]
    BANK["🏦 Entidades financieras<br/>Caja SMM · BN · Interbank<br/><i>archivos de recaudación</i>"]
    LLM["🤖 OpenRouter<br/><i>modelo de lenguaje</i>"]
    MAIL["✉️ Amazon SES<br/><i>correo</i>"]
    OMR["📝 Sistema de calificación<br/><i>lectura óptica — archivo CSV</i>"]
  end

  VIS -->|"HTTPS"| SIA
  POS -->|"HTTPS"| SIA
  STAFF -->|"HTTPS + MFA"| SIA
  SIA -->|"Valida DNI"| RENIEC
  SIA -->|"Crea sesión de pago"| PAY
  PAY -->|"Webhook firmado"| SIA
  BANK -.->|"Archivo importado por Tesorería"| SIA
  SIA -->|"Preguntas sin datos personales"| LLM
  SIA -->|"Notificaciones"| MAIL
  OMR -.->|"Archivo importado por el Operador"| SIA
```

---

## 3. Nivel 2 — Diagrama de contenedores

Las piezas que se despliegan por separado y cómo se comunican.

```mermaid
flowchart TB
  USER["👥 Usuarios<br/>navegador móvil / escritorio"]

  subgraph SIA["SIA-UNSCH"]
    SPA["<b>Aplicación web</b><br/>Angular + TypeScript<br/><i>SPA: portal público,<br/>postulante y administración</i>"]
    API["<b>API</b><br/>Node.js + Express + TypeScript<br/><i>monolito modular, 12 módulos,<br/>REST /api/v1</i>"]
    WORKER["<b>Procesador asíncrono</b><br/>mismo código del monolito,<br/>otro punto de entrada<br/><i>outbox, correos, publicaciones<br/>programadas, recordatorios</i>"]
    DB[("<b>Base de datos</b><br/>PostgreSQL<br/><i>un esquema por módulo</i>")]
    FILES[("<b>Almacén de documentos</b><br/>Amazon S3 privado<br/><i>fotos, expedientes, PDF</i>")]
  end

  EXT["Sistemas externos<br/>RENIEC · Izipay · OpenRouter · SES"]

  USER -->|"HTTPS"| SPA
  SPA -->|"JSON / HTTPS<br/>JWT + cookie HttpOnly"| API
  SPA -->|"Sube/descarga con URL<br/>prefirmada de 5 min"| FILES
  API -->|"SQL (Prisma)"| DB
  API -->|"SDK"| FILES
  API -->|"HTTPS"| EXT
  WORKER -->|"SQL"| DB
  WORKER -->|"HTTPS"| EXT
  WORKER -->|"SDK"| FILES
```

| Contenedor | Tecnología | Responsabilidad | ADR |
|---|---|---|---|
| Aplicación web | Angular, standalone components, signals, SCSS | Interfaz para los tres públicos, carga diferida por área | ADR-003 |
| API | Node.js 22 + Express + TypeScript + Zod | Casos de uso, reglas, seguridad, contratos REST | ADR-001, ADR-002, ADR-004 |
| Procesador asíncrono | Mismo paquete que la API, otro *handler* | Eventos de la outbox, correos, tareas programadas | ADR-008, ADR-012 |
| Base de datos | PostgreSQL 16 + Prisma | Datos transaccionales, auditoría, outbox | ADR-005 |
| Almacén de documentos | Amazon S3 (privado) | Archivos binarios; la base guarda solo metadatos | ADR-010 |

---

## 4. Nivel 3 — Componentes de la API

### 4.1 Capas dentro de cada módulo (Clean Architecture)

```mermaid
flowchart LR
  HTTP["Petición HTTP"] --> PRES
  subgraph MOD["Módulo (p. ej. inscripcion-ordinaria)"]
    PRES["<b>presentation</b><br/>rutas · controladores ·<br/>validación Zod · mapeo DTO"]
    APP["<b>application</b><br/>casos de uso ·<br/>DTO · transacciones"]
    DOM["<b>domain</b><br/>entidades · reglas RN ·<br/>eventos · <i>puertos</i>"]
    INF["<b>infrastructure</b><br/>repositorios Prisma ·<br/>adaptadores externos"]
    IDX["index.ts<br/><i>API pública del módulo</i>"]
  end
  PRES --> APP --> DOM
  INF -.->|"implementa puertos"| DOM
  APP -->|"usa puertos"| DOM
  IDX --> APP
```

**Regla de dependencias:** las flechas solo apuntan hacia `domain`. El dominio no conoce Express, Prisma ni AWS. Otros módulos solo pueden usar lo que exporta `index.ts` (verificado con reglas de ESLint, ADR-002).

### 4.2 Módulos y sus dependencias

```mermaid
flowchart TB
  subgraph G1["Gestión de admisión"]
    M01["M01<br/>Convocatorias"]
    M02["M02<br/>Usuarios"]
    M03["M03<br/>Inscripciones"]
    M04["M04<br/>Pagos"]
  end
  subgraph G2["Evaluación"]
    M05["M05<br/>Expedientes"]
    M06["M06<br/>Exámenes, sedes y aulas"]
    M07["M07<br/>Resultados"]
  end
  subgraph G3["Soporte"]
    M08["M08<br/>Chatbot IA"]
    M09["M09<br/>Notificaciones"]
    M10["M10<br/>Reportes"]
    M11["M11<br/>Seguridad"]
    M12["M12<br/>Configuración"]
  end

  M03 -->|"consulta etapas, tasas, vacantes"| M01
  M03 -->|"consulta postulante"| M02
  M03 -->|"crea expediente"| M05
  M03 -->|"solicita orden"| M04
  M04 -. "evento PagoConfirmado" .-> M03
  M05 -. "evento ExpedienteAutorizado" .-> M03
  M06 -->|"lista de aptos"| M03
  M07 -->|"asignaciones, asistencia"| M06
  M08 -->|"consultas autorizadas"| M03 & M04 & M05 & M06 & M07
  M09 -. "escucha todos los eventos" .-> G1 & G2
  M10 -. "lectura de vistas de reporte" .-> G1 & G2
  M11 ===|"transversal: autenticación,<br/>permisos y auditoría"| G1 & G2 & G3
  M01 -->|"parámetros"| M12
```

- **Flecha continua** = llamada síncrona a la API pública del otro módulo (`index.ts`).
- **Flecha punteada** = **evento de dominio** publicado en la *outbox* dentro de la misma transacción y entregado después mediante Amazon SQS (ADR-008 y ADR-021). Así, por ejemplo, Pagos no necesita conocer a Inscripción.
- **Reportes (M10)** solo lee **vistas de base de datos** preparadas para reportes; nunca escribe.

### 4.3 Componentes transversales (`apps/backend/src/shared`)

| Componente | Función |
|---|---|
| `http/` | Formato `{ data, meta }` / `{ error }`, `requestId`, manejo central de errores |
| `auth/` | Middleware de autenticación (JWT) y autorización (RBAC + propietario), provisto por M11 |
| `audit/` | Servicio `audit.record()` usado por cualquier módulo en operaciones críticas |
| `events/` | Outbox: `publish()` dentro de la transacción y despachador |
| `clock/` | Reloj inyectable con zona horaria `America/Lima`, para probar etapas y fechas |
| `db/` | Cliente Prisma único y helper de transacciones |
| `config/` | Variables de entorno validadas con Zod al iniciar |

---

## 5. Nivel 3 — Componentes de la aplicación web

```mermaid
flowchart TB
  ROOT["app.routes.ts"] --> PUB & POST & ADM
  subgraph CORE["core/"]
    AUTH["AuthService · tokens"]
    INT["Interceptores: auth, errores, requestId"]
    GUARD["Guards: autenticado, rol"]
  end
  subgraph SHARED["shared/ — sistema de diseño UNSCH"]
    UI["Botones, tarjetas, tablas,<br/>línea de tiempo, asistente por pasos,<br/>cuenta regresiva, carga de archivos"]
  end
  PUB["features/public<br/><i>inicio, cronograma, programas,<br/>tasas, requisitos, buscar aula,<br/>puntaje, verificar ficha</i>"]
  POST["features/postulante<br/><i>panel, inscripción, expediente,<br/>pagos, examen, resultados</i>"]
  ADM["features/admin<br/><i>convocatorias, expedientes, pagos,<br/>aulas, resultados, reportes, usuarios</i>"]
  POST & ADM --> GUARD
  PUB & POST & ADM --> UI
  PUB & POST & ADM --> INT
```

Cada área se carga de forma diferida: el visitante del portal público no descarga el código del panel administrativo (RNF-14).

---

## 6. Vista de despliegue en AWS

```mermaid
flowchart TB
  U["👥 Navegador"] -->|"HTTPS"| CF["Amazon CloudFront<br/><i>CDN + certificado</i>"]
  CF -->|"/*"| S3WEB[("S3 — build Angular<br/><i>privado, acceso por OAC</i>")]
  CF -->|"/api/*"| APIGW["API Gateway<br/>HTTP API"]
  APIGW --> LAPI["λ Lambda — API<br/><i>Express vía adaptador</i>"]
  SCH["EventBridge Scheduler<br/><i>tareas programadas</i>"] --> LWK["λ Lambda — Worker"]
  SQS["Amazon SQS<br/><i>ID de eventos + cola de errores</i>"] --> LWK
  LAPI -->|"ID del evento"| SQS

  subgraph VPC["VPC — 2 zonas de disponibilidad"]
    subgraph PRIV["Subredes privadas"]
      LAPI
      LWK
      RDS[("RDS PostgreSQL<br/>db.t4g.micro")]
    end
    subgraph PUBN["Subred pública"]
      NAT["Instancia NAT<br/>t4g.nano"]
    end
    S3EP["Endpoint de gateway S3<br/><i>sin costo</i>"]
  end

  LAPI & LWK --> RDS
  LAPI & LWK --> S3EP --> S3DOC[("S3 — documentos<br/><i>privado, cifrado</i>")]
  LAPI & LWK -->|"salida a internet"| NAT --> EXT["OpenRouter · SES ·<br/>pasarela (sandbox)"]
  LAPI & LWK -.-> SSM["SSM Parameter Store<br/><i>secretos cifrados</i>"]
  LAPI & LWK -.->|"OTLP vía NAT<br/>(extensión OpenTelemetry)"| GRAF["Grafana Cloud<br/><i>registros · trazas · métricas · alertas</i>"]
  GRAF -.->|"comprobación sintética<br/>cada 5 min"| CF
```

> **Sin CloudWatch (ADR-013):** el rol de las funciones Lambda no tiene permisos `logs:*`; la observabilidad se hace con OpenTelemetry hacia Grafana Cloud.

| Recurso | Para qué | Nota de costo (verificar en AWS Pricing Calculator) |
|---|---|---|
| CloudFront + S3 (web) | Servir la SPA con HTTPS | Muy bajo con tráfico de demostración |
| API Gateway (HTTP API) + Lambda | API y worker | Se paga por solicitud; casi cero en reposo |
| RDS PostgreSQL `db.t4g.micro`, 20 GB | Base de datos | **Costo fijo mensual** mientras esté encendida (el mayor del sistema) |
| Instancia NAT `t4g.nano` | Salida a internet desde la VPC | Mucho más barata que NAT Gateway administrado (ADR-009) |
| S3 (documentos) | Archivos privados | Bajo |
| SES | Correo; en modo *sandbox* solo envía a direcciones verificadas | Bajo |
| SSM Parameter Store | Secretos (parámetros estándar) | Sin costo |
| Grafana Cloud (externo) | Registros, trazas, métricas, alertas, comprobación sintética | Plan gratuito (verificar límites vigentes) |

**Infraestructura como código:** AWS CDK en TypeScript (`infra/`), con dos entornos: `dev` y `demo`. Un comando despliega y **otro destruye todo** al terminar el curso, para no generar costos (ADR-009).

---

## 7. Flujo crítico de ejemplo: pago confirmado

Cómo colaboran los contenedores y módulos en el flujo más sensible (specs 003 y 005):

```mermaid
sequenceDiagram
  autonumber
  actor P as Postulante
  participant W as Aplicación web
  participant API as API (M04 Pagos)
  participant PG as Izipay (sandbox)
  participant DB as PostgreSQL
  participant Q as Amazon SQS
  participant WK as Worker
  participant M03 as M03 Inscripciones
  participant M09 as M09 Notificaciones

  P->>W: "Pagar en línea"
  W->>API: POST /api/v1/payments/orders/{id}/checkout
  API->>PG: Crear sesión de pago (monto fijado en servidor)
  PG-->>API: URL de pago
  API-->>W: Redirigir
  P->>PG: Paga
  PG->>API: Webhook firmado (eventId)
  API->>API: Verificar firma, monto y moneda
  API->>DB: BEGIN · registrar eventId (único) · pago=CONFIRMADO · outbox(PagoConfirmado) · COMMIT
  API-->>PG: 200 OK (también si el eventId ya existía)
  API->>Q: Enviar ID del evento
  Q->>WK: Entregar ID del evento
  WK->>DB: Leer y reservar el evento
  WK->>M03: PagoConfirmado → inscripción APTA
  WK->>M09: PagoConfirmado → correo "Tu ficha está lista"
  W->>API: GET /api/v1/applications/me (sondeo)
  API-->>W: Estado APTA + ficha disponible
```

---

## 8. Atributos de calidad y tácticas

| Atributo | Escenario (estímulo → respuesta medida) | Tácticas | RNF |
|---|---|---|---|
| Rendimiento | 2 000 consultas de resultados simultáneas → p95 < 3 s | Escalado de Lambda, índices, consultas de solo lectura, caché HTTP en CloudFront para contenido público | RNF-04, RNF-05 |
| Disponibilidad | Falla de una zona de AWS → el servicio continúa | Lambda multi-AZ; RDS con respaldo automático; en `demo`, RDS en una sola AZ (riesgo aceptado, ADR-009) | RNF-06, RNF-12 |
| Observabilidad | Error 500 en producción → el equipo recibe alerta en menos de 5 min con la traza | OpenTelemetry + Grafana Cloud, alertas y comprobación sintética (ADR-013) | RNF-12 |
| Integridad | Webhook repetido 10 veces → un solo pago | Restricción única por `eventId`, transacciones, outbox | RNF-09 |
| Seguridad | Postulante cambia el ID en la URL → 404 | Autorización por propietario en cada caso de uso, IDs no secuenciales (UUID) | RNF-03 |
| Seguridad | Robo de contraseña de personal → sin acceso | MFA TOTP obligatorio para personal | RF-13.06 |
| Auditabilidad | Cambio de vacantes → quién, cuándo, antes y después | `audit_events` solo de inserción; rol de base de datos sin UPDATE ni DELETE en esa tabla | RNF-10 |
| Modificabilidad | Nueva convocatoria 2027-II → sin cambiar código | Configuración como datos y copia de convocatoria | RNF-07 |
| Modificabilidad | Contratar RENIEC real → sin tocar el dominio | Puerto `IdentityProvider` con adaptador nuevo | RNF-07 |
| Privacidad | Pregunta al chatbot con DNI → el proveedor no lo recibe | Enmascarado antes de enviar; herramientas internas autorizadas | RNF-11 |
| Facilidad de prueba | Simular el 08/11 para probar el recargo | Reloj inyectable (`shared/clock`) | — |

---

## 9. Correspondencia funcionalidades → contenedores y módulos

| Funcionalidad | Web | API (módulos) | Worker | Externos |
|---|---|---|---|---|
| 001 Portal público | public | M01, M12 | — | — |
| 002 Cuentas | public, postulante | M02, M11 | correo de verificación | RENIEC (sim.), SES |
| 003 Ordinario | postulante | M03, M04, M05 | ficha, eventos | — |
| 004 Exonerados | postulante, admin | M03, M05 | eventos | — |
| 005 Pagos | postulante, admin | M04 | outbox | Pasarela (sim.) |
| 006 Examen y aulas | public, admin | M06 | publicación programada | — |
| 007 Resultados | public, postulante, admin | M07 | publicación programada | archivo de calificación |
| 008 Panel | admin | M01, M10, M11, M12 | — | — |
| 009 Chatbot | todas | M08 | — | OpenRouter |
| 010 Notificaciones | postulante, admin | M09 | envíos, recordatorios | SES |
