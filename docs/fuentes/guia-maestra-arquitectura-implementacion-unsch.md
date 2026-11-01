# Guía maestra de arquitectura e implementación — Sistema Integral de Admisión UNSCH

**Proyecto:** Implementación de una Solución Integral para la Gestión del Proceso de Admisión UNSCH  
**Tipo:** Plataforma web institucional (portal público, portal del postulante y panel administrativo)  
**Arquitectura elegida:** Monolito Modular por Capas con principios de Clean Architecture  
**Estado:** Documento de planificación técnica, no certificación de infraestructura ya implementada  
**Versión:** 1.0 — 25 de octubre de 2026

> **Propósito.** Servir como documento único de referencia para comenzar y continuar la implementación. Las funcionalidades detalladas y sus códigos RF/RNF proceden del documento de requerimientos aportado. Las decisiones de diseño, estructuras, endpoints, tablas y planes de trabajo son propuestas técnicas para implementar y deben validarse con el equipo y la UNSCH. No se debe presentar una integración propuesta como ya contratada o disponible.

## 1. Alcance y objetivos

Centralizar convocatorias, registro y validación de identidad, inscripción ordinaria y exonerados, pagos, expedientes, exámenes, sedes/aulas, resultados, chatbot IA, notificaciones, reportes, seguridad y configuración. La experiencia comprende: **portal público**, **área autenticada del postulante**, **panel del personal** y **API REST**. El sistema debe operar según reglamentos, tasas, vacantes, plazos y autorizaciones vigentes de la universidad; no se deben fijar datos oficiales sin validación.

**Actores:** postulante, administrador general, oficina de admisión, evaluador documental, tesorería, coordinador de examen, operador de resultados, soporte y chatbot (actor lógico, no usuario humano).

## 2. Decisiones arquitectónicas

| Decisión | Elección | Razón / restricción |
|---|---|---|
| Estilo | Monolito modular | Un backend desplegable con límites claros entre módulos |
| Organización | Capas de interfaces, aplicación, dominio e infraestructura | Separación de responsabilidades e inversión de dependencias |
| Frontend | Angular + TypeScript + HTML + CSS/SCSS | SPA responsiva separada de la API |
| Backend | Node.js + TypeScript; Express como opción concreta | API REST; confirmar el framework real del repositorio antes de cambiarlo |
| Ejecución | Local en desarrollo; una función principal AWS Lambda como destino propuesto | Evitar 14 microservicios y múltiples despliegues |
| API pública | Amazon API Gateway + HTTPS | Punto de entrada a Lambda |
| Persistencia | Amazon RDS PostgreSQL | Base de datos relacional compartida con propiedad lógica por módulo |
| Documentos | Amazon S3 | Archivos privados, fichas y expedientes |
| Caché | ElastiCache Redis, **opcional** | Solo tras medir necesidad de rendimiento |
| Cola | Amazon SQS, **opcional** | Procesamiento asíncrono; requiere consumidor Lambda separado o mecanismo equivalente, sin convertir módulos en microservicios |
| Integraciones | RENIEC, pasarela de pagos, OpenRouter, correo/SMS | Adaptadores; acceso sujeto a permisos, contratos y credenciales |
| Distribución web | S3 + CloudFront; Route 53 y ACM si hay dominio propio | Frontend estático y HTTPS |
| Observabilidad | Registros de aplicación y auditoría de negocio; estrategia operativa pendiente | **Amazon CloudWatch se excluye de los diagramas y de la pila seleccionada por solicitud**. En AWS Lambda, el destino real de logs, métricas y alertas debe definirse antes de producción. |

**Importante:** Clean Architecture no es otro despliegue ni implica microservicios. La presentación Angular está fuera del backend; dentro del monolito la capa de *interfaces* recibe HTTP. Los módulos de dominio no importan clientes AWS, ORM ni frameworks. Los casos de uso dependen de contratos (puertos); infraestructura implementa esos contratos. Los adaptadores de un módulo no deben consultar tablas privadas de otro sin una interfaz autorizada.

## 3. Diagramas de arquitectura

### 3.1. Vista general de despliegue lógico

```mermaid
flowchart TB
  U["Postulante / Personal / Administrador"] --> FE["Angular - Portal web"]
  FE -->|HTTPS JSON| GW["Amazon API Gateway"]
  GW -->|Invoca| L["AWS Lambda - Monolito Node.js + TypeScript"]
  subgraph CORE["Un backend modular"]
    direction TB
    C["Controladores REST"] --> A["Casos de uso"]
    A --> D["Módulos y reglas de dominio"]
    A --> P["Puertos / contratos"]
    I["Adaptadores de infraestructura"] -.->|Implementan| P
  end
  L --- CORE
  I --> DB[("RDS PostgreSQL")]
  I --> S3["Amazon S3"]
  I -.-> REDIS["Redis - opcional"]
  I -.-> SQS["SQS - opcional"]
  I --> EXT["RENIEC / Pagos / OpenRouter / Correo-SMS"]
```

### 3.2. Módulos funcionales agrupados

```mermaid
flowchart TB
  REST["Controladores REST"] --> UC["Casos de uso"]
  subgraph MOD["Dominio: 14 módulos dentro de un solo monolito"]
    G1["Admisión: Convocatorias, Usuarios, Ordinaria, Exonerados, Pagos"]
    G2["Evaluación: Expedientes, Exámenes, Sedes y Aulas, Resultados"]
    G3["Soporte: Chatbot, Notificaciones, Reportes, Seguridad, Configuración"]
  end
  UC --> G1
  UC --> G2
  UC --> G3
  UC --> PORT["Interfaces / puertos"]
  ADP["Repositorios y adaptadores"] -.->|Implementa| PORT
  ADP --> PG[("PostgreSQL")]
  ADP --> SERV["Almacenamiento y APIs externas"]
```

### 3.3. Flujo de inscripción ordinaria

```mermaid
sequenceDiagram
  actor P as Postulante
  participant W as Angular
  participant API as API REST
  participant UC as Caso de uso
  participant DB as PostgreSQL
  participant PG as Proveedor de pagos
  P->>W: Completa formulario
  W->>API: POST /inscripciones/ordinarias
  API->>UC: Registrar inscripción
  UC->>DB: Validar convocatoria y duplicados; guardar borrador
  DB-->>UC: Código y estado
  UC-->>W: Inscripción pendiente de pago
  P->>W: Solicita pagar
  W->>API: POST /pagos/ordenes
  API->>PG: Crear sesión de pago (backend)
  PG-->>API: Referencia segura
  API-->>W: URL / token de checkout
  PG->>API: Webhook firmado de confirmación
  API->>DB: Verificar idempotencia y actualizar pago
  API->>DB: Actualizar inscripción si cumple requisitos
  W->>API: GET /inscripciones/{id}
  API-->>W: Estado verificado
```

> Los diagramas son lógicos. Para alojar Angular en AWS, la ruta real recomendada es navegador → CloudFront → S3 (estáticos); Angular → API Gateway (datos). No se envía una solicitud de API «a través» de S3.

## 4. Inventario de tecnologías y herramientas

| Área | Tecnología / opción | Uso previsto | Prioridad |
|---|---|---|---|
| Lenguaje | TypeScript | Frontend y backend tipados | Esencial |
| Runtime | Node.js LTS compatible con AWS Lambda | Ejecutar API y scripts | Esencial |
| Frontend | Angular, Angular Router, HttpClient | Vistas, rutas y llamadas REST | Esencial |
| UI | HTML semántico, CSS/SCSS, diseño responsivo | Portal institucional accesible | Esencial |
| Formularios | Angular Reactive Forms + validadores | Registro, inscripción y administración | Esencial |
| Backend HTTP | Express **si es el framework ya elegido** | Rutas, controladores, middleware | Esencial |
| Validación backend | Zod o biblioteca equivalente | Validar DTO y parámetros; elegir una | Recomendado |
| ORM | Prisma **o** Sequelize/otro; elegir solo uno | Acceso tipado a PostgreSQL y migraciones | Por decidir |
| Base de datos | PostgreSQL en Amazon RDS | Persistencia transaccional | Esencial |
| Migraciones | Herramienta del ORM elegido | Esquema versionado y reproducible | Esencial |
| Auth | Sesión segura con cookies HttpOnly o JWT bien gestionado | Login, roles, recuperación, MFA administrativo | Esencial |
| Passwords | Argon2id o bcrypt correctamente configurado | Hash de contraseñas | Esencial |
| Documentos | Amazon S3 + URLs prefirmadas de corta duración | Expedientes y PDF privados | Recomendado |
| PDF/QR | Biblioteca PDF y generador QR a seleccionar | Fichas, constancias verificables | Recomendado |
| API AWS | API Gateway | Exposición HTTPS de Lambda | Objetivo despliegue |
| Cómputo AWS | Lambda + adaptador compatible con framework | Un backend desplegable | Objetivo despliegue |
| Base de datos AWS | RDS PostgreSQL; evaluar RDS Proxy | Conexiones a BD en entorno Lambda | Objetivo despliegue |
| Frontend AWS | S3 + CloudFront | Hosting SPA y distribución | Objetivo despliegue |
| Dominio/TLS | Route 53 + ACM | DNS y certificados | Opcional según dominio |
| Redis | ElastiCache Redis | Caché de lecturas no sensibles | Fase posterior |
| Cola | SQS + consumidor | Envíos y tareas asíncronas | Fase posterior |
| Identidad | API RENIEC autorizada | Verificar DNI sin exponer credenciales | Integración condicionada |
| Pagos | Proveedor aprobado, p. ej. Izipay si se contrata | Checkout, webhooks, conciliación | Integración condicionada |
| IA | OpenRouter API | Orientación con fuentes verificadas | Integración condicionada |
| Correo | Amazon SES o SMTP autorizado | Confirmaciones y avisos | Integración condicionada |
| SMS | Proveedor autorizado | Avisos opcionales | Opcional |
| Pruebas | Vitest/Jest, Supertest y Playwright | Unitarias, API y extremo a extremo | Recomendado |
| Calidad | ESLint, Prettier, TypeScript strict | Consistencia y tipado | Recomendado |
| Documentación API | OpenAPI / Swagger | Contratos de endpoints | Recomendado |
| Versionado | Git + GitHub | Historial, PR y revisión | Esencial |
| Desarrollo | VS Code, npm, PowerShell, PostgreSQL client | Implementación local | Esencial |

**No se incluyen Laravel, PHP, Blade ni Eloquent:** pertenecen a una imagen de referencia alternativa y no al stack Angular/Node.js/TypeScript seleccionado. Tampoco se incluye Amazon CloudWatch.

## 5. Los 14 módulos y entregables mínimos

| ID | Módulo | Funciones esenciales | Entidades principales |
|---|---|---|---|
| M01 | Convocatorias | Periodos, modalidades, cronograma, programas, vacantes, requisitos, comunicados | Convocatoria, Modalidad, Programa, Vacante, Cronograma |
| M02 | Usuarios e identidad | Cuenta, DNI, correo, perfil, recuperación | Usuario, Postulante, VerificaciónIdentidad |
| M03 | Inscripción ordinaria | Borrador, validaciones, programa, ficha y estado | Inscripción, InscripciónOrdinaria |
| M04 | Inscripción exonerados | Submodalidades, requisitos especiales, subsanación | InscripciónExonerado, Submodalidad |
| M05 | Pagos | Orden, checkout, webhook, estado, conciliación, devoluciones | OrdenPago, Transacción, Conciliación |
| M06 | Expedientes | Documentos, revisiones, observaciones, versiones | Expediente, Documento, Revisión |
| M07 | Exámenes | Sesiones, reglas, fechas, habilitados, incidencias | Examen, Sesión, Evaluación |
| M08 | Sedes y aulas | Sedes, capacidad, asignación, asistencia | Sede, Aula, Asignación, Asistencia |
| M09 | Resultados | Importación, validación, puntajes, mérito, publicación | Resultado, Puntaje, Publicación |
| M10 | Chatbot IA | Preguntas frecuentes, estado autorizado, derivación | Conversación, Mensaje, FuenteConocimiento |
| M11 | Notificaciones | Correo, SMS opcional, plantillas, estado de envío | Notificación, Plantilla, Envío |
| M12 | Reportes | Indicadores, filtros, exportación PDF/Excel | ConsultaReporte, Exportación |
| M13 | Seguridad | Roles, permisos, MFA admin, auditoría, sesiones | Rol, Permiso, Sesión, Auditoría |
| M14 | Configuración | Parámetros, tasas, integraciones, activación de funciones | Parámetro, Tasa, ConfiguraciónIntegración |

**Agrupación visual, no fusión técnica:** Gestión de Admisión (M01–M05), Gestión Académica y Evaluación (M06–M09), Servicios de Soporte (M10–M14). Los 14 límites modulares se conservan en el código.

## 6. Estructura inicial del repositorio

```text
PROYECTO/
├── apps/
│   ├── frontend/                   # Angular
│   │   └── src/app/
│   │       ├── core/               # auth, guards, interceptors
│   │       ├── shared/             # UI reusable
│   │       ├── features/           # public, postulante, admin
│   │       └── app.routes.ts
│   └── backend/                    # Node.js + TypeScript
│       ├── src/
│       │   ├── modules/
│       │   │   ├── convocatorias/
│       │   │   ├── usuarios/
│       │   │   ├── inscripcion-ordinaria/
│       │   │   ├── inscripcion-exonerados/
│       │   │   ├── pagos/
│       │   │   ├── expedientes/
│       │   │   ├── examenes/
│       │   │   ├── sedes-aulas/
│       │   │   ├── resultados/
│       │   │   ├── chatbot-ia/
│       │   │   ├── notificaciones/
│       │   │   ├── reportes/
│       │   │   ├── seguridad/
│       │   │   └── configuracion/
│       │   ├── shared/             # utilidades transversales mínimas
│       │   ├── app.ts              # composición y rutas
│       │   └── lambda.ts           # adaptador Lambda, si aplica
│       └── tests/
├── infra/aws/                     # IaC y certificados públicos CA
├── docs/                          # arquitectura, ADR, API y manuales
├── scripts/
├── .env.example                   # nunca secretos reales
└── package.json
```

**Estructura interna de cada módulo** (ejemplo `inscripcion-ordinaria`):

```text
inscripcion-ordinaria/
├── domain/
│   ├── entities/
│   ├── rules/
│   └── ports/
├── application/
│   ├── use-cases/
│   └── dto/
├── infrastructure/
│   ├── persistence/
│   └── adapters/
├── presentation/
│   ├── controllers/
│   └── routes/
└── index.ts                       # API pública del módulo
```

**Reglas de dependencias:** `presentation → application → domain`; `infrastructure → interfaces internas`; el módulo publica funciones/contratos a través de `index.ts`. No acceder directamente a entidades ORM de otro módulo; no ejecutar SQL en controladores; no guardar claves en frontend; transacciones explícitas para cambios de pago e inscripción.

## 7. Pantallas y rutas Angular sugeridas

| Área | Ruta sugerida | Pantalla / función |
|---|---|---|
| Pública | `/` | Inicio, convocatoria vigente, avisos |
| Pública | `/convocatorias` | Convocatorias y cronograma |
| Pública | `/modalidades` | Ordinaria y exonerados |
| Pública | `/programas` | Programas, vacantes y requisitos |
| Pública | `/ayuda` | Preguntas frecuentes, contacto y chatbot |
| Autenticación | `/ingresar`, `/registrarse`, `/recuperar` | Cuenta y recuperación |
| Postulante | `/postulante/inicio` | Resumen y estado del proceso |
| Postulante | `/postulante/inscripcion/ordinaria` | Formulario por pasos |
| Postulante | `/postulante/inscripcion/exonerados` | Submodalidad y documentos |
| Postulante | `/postulante/pagos` | Orden, checkout y estado |
| Postulante | `/postulante/expediente` | Documentos y observaciones |
| Postulante | `/postulante/examen` | Fecha, sede, aula y ficha |
| Postulante | `/postulante/resultados` | Puntaje y condición autorizados |
| Personal | `/admin` | Indicadores según rol |
| Personal | `/admin/convocatorias` | CRUD y publicación |
| Personal | `/admin/postulantes` | Consulta y revisión autorizada |
| Personal | `/admin/expedientes` | Evaluación documental |
| Personal | `/admin/pagos` | Conciliación |
| Personal | `/admin/examenes` | Programación y aulas |
| Personal | `/admin/resultados` | Importación, revisión y publicación |
| Personal | `/admin/reportes` | Exportaciones e indicadores |
| Administrador | `/admin/usuarios`, `/admin/configuracion` | Roles, parámetros e integraciones |

**Diseño UI/UX:** identidad institucional UNSCH verificada, cabecera y navegación accesibles, CTA de inscripción, cronograma visible, estados de trámite, formularios con pasos y guardado de borrador, mensajes de error claros, responsive móvil/tableta/escritorio, WCAG 2.2 AA como objetivo. Inspirarse en la organización del portal UNI sin copiar recursos protegidos ni usar fechas/tasas inventadas.

## 8. Contrato API REST inicial (propuesto)

Prefijo: `/api/v1`. Todas las operaciones privadas requieren autenticación y autorización por recurso; no basta con ocultar botones en Angular.

| Método | Endpoint | Módulo | Acceso |
|---|---|---|---|
| GET | `/convocatorias` | M01 | Público |
| GET | `/convocatorias/:id` | M01 | Público |
| POST | `/convocatorias` | M01 | Admisión |
| GET | `/programas` | M01 | Público |
| POST | `/auth/registro` | M02 | Público |
| POST | `/auth/login` | M02/M13 | Público |
| POST | `/auth/recuperar` | M02 | Público |
| GET | `/usuarios/me` | M02 | Autenticado |
| POST | `/inscripciones/ordinarias` | M03 | Postulante |
| POST | `/inscripciones/exonerados` | M04 | Postulante |
| GET | `/inscripciones/:id` | M03/M04 | Titular o personal autorizado |
| PATCH | `/inscripciones/:id/borrador` | M03/M04 | Titular |
| POST | `/pagos/ordenes` | M05 | Postulante |
| GET | `/pagos/:id` | M05 | Titular o tesorería |
| POST | `/integraciones/pagos/webhook` | M05 | Proveedor validado por firma |
| POST | `/expedientes/:id/documentos` | M06 | Titular autorizado |
| POST | `/expedientes/:id/revisiones` | M06 | Evaluador |
| GET | `/examenes` | M07 | Según publicación |
| GET | `/postulantes/me/aula` | M08 | Titular |
| GET | `/resultados/me` | M09 | Titular, tras publicación |
| POST | `/resultados/importaciones` | M09 | Operador autorizado |
| POST | `/chatbot/mensajes` | M10 | Público para FAQ; auth para datos personales |
| GET | `/notificaciones/me` | M11 | Autenticado |
| GET | `/reportes/resumen` | M12 | Personal autorizado |
| GET | `/admin/auditoria` | M13 | Auditor/administrador autorizado |
| GET/PATCH | `/admin/configuracion` | M14 | Administrador |

**Formato sugerido de respuesta:** `data`, `meta` y `error` con código, mensaje y `requestId`; HTTP 400 validación, 401 sin sesión, 403 sin permiso, 404 inexistente/no visible, 409 conflicto, 422 regla de negocio, 429 límite, 500 error interno. Publicar contrato OpenAPI y ejemplos antes de desarrollar cada pantalla.

## 9. Modelo de datos relacional inicial

**Tablas núcleo sugeridas:** `users`, `roles`, `permissions`, `user_roles`, `applicants`, `identity_verifications`, `admission_calls`, `admission_modalities`, `exemption_submodalities`, `academic_programs`, `call_program_vacancies`, `schedules`, `requirements`, `applications`, `application_drafts`, `payment_orders`, `payment_transactions`, `payment_webhook_events`, `payment_reconciliations`, `files`, `application_documents`, `document_reviews`, `exam_sessions`, `campuses`, `buildings`, `rooms`, `exam_assignments`, `attendance`, `exam_scores`, `result_publications`, `admission_results`, `chat_conversations`, `chat_messages`, `knowledge_sources`, `notification_templates`, `notifications`, `audit_events`, `system_settings`.

**Relaciones clave:** usuario 1→1 o 1→N perfiles según política; postulante 1→N inscripciones; convocatoria 1→N inscripciones; inscripción N→1 modalidad y programa; inscripción 1→N documentos, órdenes de pago y revisiones; sesión 1→N asignaciones; asignación N→1 aula; inscripción 0..1 o 1→N resultados versionados según reglas. Definir llaves foráneas, `created_at`, `updated_at`, `version`, estado y autor de cambios relevantes.

**Restricciones importantes:** unicidad de inscripción según convocatoria y reglas de modalidad (índices únicos parciales si procede); unicidad de referencias de pago por proveedor; deduplicación de webhooks por `provider_event_id`; no superar capacidad de aula; no publicar resultados sin aprobación; claves y permisos mínimos para datos personales. Los documentos binarios van en S3; en PostgreSQL se almacena metadata y ruta privada, no URLs públicas permanentes.

**Estados de ejemplo, a validar:** inscripción `BORRADOR → PENDIENTE_PAGO → EN_REVISION → HABILITADA` o `OBSERVADA/RECHAZADA`; pago `PENDIENTE → CONFIRMADO/RECHAZADO/EXPIRADO`, con devoluciones por flujo separado; expediente `PENDIENTE → EN_REVISION → OBSERVADO/APROBADO/RECHAZADO`. No actualizar estados solo porque el navegador lo indique.

## 10. Integraciones externas: contratos y precauciones

### RENIEC

Requiere proveedor autorizado, credenciales y acuerdo de tratamiento de datos. El backend realiza la consulta, valida permisos, aplica límites y registra la verificación mínima necesaria. Para demo: adaptador `MockIdentityProvider` con datos sintéticos, claramente marcado como simulación. Nunca afirmar validación oficial si no ocurrió.

### Pasarela de pagos

Seleccionar proveedor aprobado (por ejemplo Izipay si se contrata), revisar onboarding, comisiones, firma de webhooks, sandbox, reembolsos y conciliación. El frontend solo recibe sesión/URL segura; nunca almacena PAN/CVV ni secretos del proveedor. El backend valida firma, importe, moneda, referencia, estado, idempotencia y transacción de BD. **No habilitar cobros reales sin autorización institucional y pruebas.**

### OpenRouter

La API key vive solo en backend. Chatbot con instrucciones restringidas, base de conocimiento de convocatorias publicadas, límites de tokens, control de costos y moderación de datos personales. Para consultar estado de inscripción/pago/aula, usar herramientas internas autenticadas y autorizadas; la IA no inventa estados ni accede directamente a toda la base. Incluir fallback a soporte humano.

### Correo / SMS

Enviar mediante SES/SMTP y proveedor SMS aprobado, con plantillas y preferencias. Verificar remitentes, manejar rebotes y reintentos idempotentes. No incluir datos sensibles en asuntos o mensajes. SMS es opcional.

### Redis / SQS

Introducir después de medir el sistema. Cachear solo información apropiada con TTL e invalidación. SQS requiere un consumidor, política de reintentos, DLQ cuando corresponda e idempotencia; no asumir que poner mensajes en cola implica procesarlos.

## 11. Seguridad, privacidad y controles de calidad

1. HTTPS, HSTS en producción, CORS restringido, cabeceras de seguridad y protección CSRF cuando se usan cookies.
2. Autenticación con contraseñas hasheadas, recuperación con tokens de un solo uso, verificación de correo, MFA para personal administrativo.
3. Autorización RBAC y controles por propietario: un postulante nunca puede consultar expedientes o resultados ajenos modificando IDs.
4. Validación server-side de DTO; consultas parametrizadas; límites de tamaño y tipo MIME, análisis de archivos cuando corresponda; documentos privados en S3.
5. Secretos en gestor seguro o variables cifradas de despliegue, nunca en Git, Angular, logs o documentos. Mantener `.env.example` sin valores reales.
6. Auditoría inmutable o protegida de cambios críticos: pagos, vacantes, expedientes, resultados, permisos, configuración.
7. Protección de datos personales conforme a la normativa peruana vigente; políticas de consentimiento, minimización, retención, acceso y eliminación.
8. Backups automáticos de RDS, prueba real de restauración, migraciones reversibles, plan de recuperación.
9. Límite de solicitudes, timeouts y reintentos con backoff para integraciones; manejo de fallas sin revelar secretos.
10. Objetivo de accesibilidad WCAG 2.2 AA; diseño móvil, navegación con teclado, etiquetas y mensajes comprensibles.
11. Requerimientos de rendimiento y concurrencia se validarán con pruebas, no se considerarán garantizados por el mero uso de Lambda.
12. **Operación:** al excluir CloudWatch del diseño, queda pendiente definir cómo recoger logs técnicos, métricas, alertas y fallos de Lambda antes de un entorno productivo. La auditoría funcional en PostgreSQL no sustituye el monitoreo de infraestructura.

## 12. Infraestructura AWS: implementación prevista

```text
Navegador
  ├── CloudFront (HTTPS, certificado ACM) → S3 privado (build Angular)
  └── API Gateway (HTTPS) → AWS Lambda (backend monolítico)
                                 ├── RDS PostgreSQL (red privada)
                                 ├── S3 privado (expedientes)
                                 ├── proveedores externos vía HTTPS
                                 ├── Redis (opcional)
                                 └── SQS (opcional; consumidor requerido)
Route 53 → dominio, si se contrata/configura.
```

**Red:** evaluar VPC, subredes privadas y grupos de seguridad para RDS/Lambda; salida a internet de Lambda en VPC mediante NAT u otra solución adecuada si necesita RENIEC/OpenRouter/pagos; revisar costo de NAT. **Conexiones:** limitar pool en Lambda, considerar RDS Proxy si hay concurrencia. **IAM:** políticas mínimas por recurso S3/SQS/secretos. **Despliegue:** infraestructura como código (AWS SAM, CDK o Terraform, seleccionar una), entornos `dev`, `staging`, `prod` cuando aplique. **TLS:** ACM para CloudFront y API; validar certificado de RDS.

**Costos:** Lambda, API Gateway, RDS, almacenamiento, transferencia CloudFront, Redis, SQS, NAT, RDS Proxy, dominio, correos/SMS, pasarela y OpenRouter pueden generar cargos incluso con uso bajo (especialmente RDS, Redis y NAT). Elaborar presupuesto real antes de activar recursos; no afirmar que todos son estrictamente pago por solicitud.

## 13. Configuración de desarrollo y puesta en marcha

Antes de modificar código, inspeccionar `package.json`, versiones de Angular/Node, estructura de `apps/`, scripts y estado Git. Conservar el stack real si ya funciona. Ejemplo para Windows PowerShell desde la raíz:

```powershell
npm.cmd install
npm.cmd run
npm.cmd run dev
```

Según la configuración actual del proyecto, el frontend puede estar en `http://127.0.0.1:4200` y la API en `http://127.0.0.1:3000`; verificar en la consola en lugar de asumir. El comando `npm.cmd run` muestra scripts disponibles. La conexión PostgreSQL se debe probar mediante un script seguro sin imprimir contraseña.

**Variables de entorno de ejemplo (SIN secretos):**

```dotenv
NODE_ENV=development
API_HOST=127.0.0.1
API_PORT=3000
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST:5432/BASE
RDS_CA_BUNDLE_PATH=./infra/aws/certificates/global-bundle.pem
AWS_REGION=us-east-2
S3_DOCUMENTS_BUCKET=nombre-del-bucket
PAYMENTS_PROVIDER=mock
IDENTITY_PROVIDER=mock
OPENROUTER_MODEL=modelo-a-validar
FRONTEND_ORIGIN=http://127.0.0.1:4200
```

No publicar `.env` real. Para Lambda, reemplazar credenciales de desarrollo por gestión de secretos y políticas IAM. Configurar proxy Angular de desarrollo o CORS explícito en backend. Aplicar migraciones solo después de revisar esquema y respaldos.

## 14. Estrategia de pruebas

| Nivel | Qué probar | Ejemplos |
|---|---|---|
| Unitarias | Entidades, reglas y casos de uso | Duplicados, tasas, vacantes, transición de estados |
| Integración | Repositorios y transacciones | PostgreSQL, migraciones, rollback |
| API | Contratos, validación y permisos | 400/401/403/409, webhooks firmados |
| E2E | Flujos Angular con Playwright | Registro → inscripción → pago simulado → ficha |
| Seguridad | Autorización y abuso | IDOR, XSS, CSRF, carga maliciosa, fuerza bruta |
| Rendimiento | Carga realista | Inscripción concurrente, consulta de resultados |
| Recuperación | Backups y fallos | Restauración BD, reintento de colas |
| Accesibilidad | Teclado, contraste y etiquetas | Formularios, errores, modales |

**Criterios de aceptación mínimos:** compila frontend/backend; migraciones reproducibles; API documentada; tests críticos verdes; no secretos en repositorio; roles comprobados; pago sandbox o mock sin cobro real; documentos privados; estados consistentes; auditoría en operaciones críticas.

## 15. Plan de implementación por fases

| Fase | Entregable verificable | Módulos |
|---|---|---|
| 0. Preparación | Repo, entorno, ADR, UI base, CI, esquema inicial, auth mock | Base transversal |
| 1. Portal público | Inicio, convocatorias, modalidades, programas, cronograma | M01, M14 |
| 2. Cuentas | Registro, login, verificación, perfil, RBAC inicial | M02, M13 |
| 3. Inscripciones | Ordinaria/exonerados, borradores, reglas, expedientes y fichas | M03, M04, M06 |
| 4. Pagos | Orden, sandbox, webhook, conciliación, idempotencia | M05 |
| 5. Evaluación | Exámenes, sedes, aulas, asistencia, resultados con aprobación | M07, M08, M09 |
| 6. Servicios | Correo, chatbot verificado, reportes y configuración | M10, M11, M12, M14 |
| 7. Endurecimiento | Seguridad, carga, accesibilidad, backups, despliegue AWS | Todos |

**Primer sprint sugerido:** (1) auditar código existente, (2) definir esquema de `users/applicants/admission_calls/programs`, (3) configurar migraciones, (4) crear layout Angular y rutas públicas, (5) implementar GET de convocatorias con datos de prueba, (6) registro/login básico, (7) pruebas automáticas y documentación. Usar mocks para RENIEC y pagos mientras no exista autorización.

## 16. Backlog técnico inicial

- [ ] Confirmar versiones y framework backend real, sin reemplazar código funcional.
- [ ] Aprobar ADR de monolito modular y límites entre módulos.
- [ ] Diseñar modelo entidad-relación y migraciones PostgreSQL.
- [ ] Definir OpenAPI, errores y política de versionado.
- [ ] Implementar layout público Angular y design system UNSCH.
- [ ] Implementar autenticación, roles, guards y autorización server-side.
- [ ] Implementar M01/M02 y luego M03/M04/M06.
- [ ] Integrar pagos primero con sandbox y webhooks verificables.
- [ ] Implementar generación PDF/QR con verificación segura.
- [ ] Diseñar importación/aprobación/publicación de resultados.
- [ ] Añadir chatbot con datos institucionales verificados.
- [ ] Configurar pruebas unitarias, API, E2E y accesibilidad.
- [ ] Planificar despliegue, seguridad de RDS, secretos y costos.
- [ ] Definir monitoreo operativo alternativo antes de producción.

## 17. Riesgos, supuestos y decisiones pendientes

**Pendientes de decisión:** framework HTTP y ORM definitivos; proveedor de pagos; disponibilidad contractual de RENIEC; proveedor SMS; esquema de sesión; autenticación MFA; configuración exacta de convocatoria y submodalidades; reglas de calificación; criterio de publicación de resultados; alojamiento definitivo; uso real de Redis/SQS; plan de observabilidad sin CloudWatch.

**Riesgos prioritarios:** exposición de datos personales, pagos duplicados o fraudulentos, apertura/cierre erróneo de convocatorias, asignación de aulas por encima de capacidad, publicación anticipada de resultados, saturación de conexiones RDS en Lambda, costos fijos AWS, alucinaciones del chatbot y falta de acceso a integraciones oficiales.

**Regla de trabajo:** ninguna fecha, monto, vacante, submodalidad, resultado o dato RENIEC se presume oficial sin fuente institucional aprobada. Para una demostración académica, usar datos sintéticos y etiquetar explícitamente toda simulación.

## 18. Definición de terminado para un módulo

Un módulo está listo cuando tiene reglas y casos de uso documentados, DTO validados, rutas y permisos, repositorio/migraciones, pruebas de casos exitosos y fallidos, trazabilidad de errores y auditoría cuando corresponde, pantalla Angular integrada, documentación OpenAPI, revisión de seguridad y demostración funcional. Las integraciones simuladas deben quedar identificadas como tales.

---

# Anexo A. Requerimientos funcionales y no funcionales de referencia

El siguiente anexo conserva el contenido del documento de requerimientos proporcionado para evitar perder el detalle RF-01 a RF-14 y RNF-01 a RNF-12. El cuerpo anterior transforma esos requerimientos en una propuesta de implementación; este anexo es la base funcional original.

```text
Requerimientos funcionales por módulos para el Sistema Integral de Gestión del Proceso de Admisión – UNSCH
Propuesta de solución tecnológica | Universidad Nacional de San Cristóbal de Huamanga | 2026
1. Descripción general del sistema
El proyecto “Implementación de una Solución Integral para la Gestión del Proceso de Admisión UNSCH” tiene como finalidad desarrollar una plataforma web centralizada que permita administrar, automatizar y supervisar todas las etapas del proceso de admisión de la Universidad Nacional de San Cristóbal de Huamanga, desde la publicación de convocatorias hasta la publicación de resultados y la generación de reportes finales.
La solución integrará la inscripción de postulantes mediante las modalidades Ordinaria y Exonerados, validación de identidad con RENIEC, pasarela de pagos, verificación documental, programación de exámenes, asignación de aulas, publicación de resultados y un chatbot inteligente conectado mediante una API de OpenRouter para brindar orientación y seguimiento personalizado.
El sistema contemplará tres entornos principales:
	Portal del postulante: inscripción, pagos, documentos, seguimiento, consultas, exámenes y resultados.
	Panel administrativo: configuración, evaluación, control, validación y gestión integral de la admisión.
	Servicios e integraciones: RENIEC, pasarela de pagos, OpenRouter, correo electrónico y otros servicios autorizados.
2. Actores del sistema
Actor	Responsabilidad
Postulante	Registrarse, inscribirse, pagar y consultar su proceso
Administrador general	Configurar y supervisar todo el sistema
Oficina de Admisión	Gestionar convocatorias, modalidades y procesos
Evaluador documental	Revisar expedientes de exonerados
Responsable de tesorería	Supervisar pagos y conciliaciones
Coordinador de examen	Programar exámenes, aulas y distribución
Operador de resultados	Gestionar calificaciones y publicación
Personal de soporte	Atender incidencias y consultas
Chatbot IA	Orientar y consultar estados autorizados
3. Requerimientos funcionales organizados por módulos
Los requerimientos se identificarán con códigos RF para facilitar su incorporación al documento de análisis, diseño, implementación y pruebas del sistema.
4. Módulos propuestos
Al revisar el portal oficial de Admisión UNSCH, se identifican apartados de inscripción, pasos para ordinarios y exonerados, cronograma, requisitos, tasas, vacantes, temario, búsqueda de aula y consulta de puntajes. Estos elementos servirán como base para ampliar la solución. 
Admisión 2027-I
Arquitectura funcional propuesta
Sistema Integral de Admisión UNSCH
Portal público · Portal del postulante · Panel administrativo
01. Convocatorias
02. Usuarios y RENIEC
03. Inscripción ordinaria
04. Inscripción exonerados
05. Pagos
06. Expedientes
07. Exámenes
08. Aulas y sedes
09. Resultados
10. Chatbot IA
11. Notificaciones
12. Reportes
13. Seguridad
14. Configuración
Servicios externos y base de datos
RENIEC · Pasarela de pagos · OpenRouter API · Correo/SMS · Base de datos institucional
Módulo 01. Gestión de convocatorias y procesos de admisión
Objetivo: Administrar las convocatorias de admisión, modalidades, cronogramas, programas profesionales y vacantes.
Código	Requerimiento funcional
RF-01.01	El sistema debe permitir crear, modificar y administrar procesos de admisión por año y periodo académico.
RF-01.02	El sistema debe permitir configurar las modalidades de admisión Ordinaria y Exonerados, incluyendo sus categorías o submodalidades autorizadas.
RF-01.03	El sistema debe permitir registrar las fechas de inscripción, pago, subsanación, evaluación, examen y publicación de resultados.
RF-01.04	El sistema debe permitir administrar las escuelas profesionales, facultades y áreas académicas.
RF-01.05	El sistema debe permitir configurar el número de vacantes por escuela profesional y modalidad.
RF-01.06	El sistema debe publicar convocatorias, reglamentos, requisitos, temarios y cronogramas.
RF-01.07	El sistema debe controlar automáticamente la apertura y cierre de las inscripciones según las fechas establecidas.
RF-01.08	El sistema debe permitir publicar comunicados, modificaciones y fe de erratas.
Módulo 02. Registro de usuarios y validación de identidad
Objetivo: Garantizar el registro seguro y la identificación de los postulantes.
Código	Requerimiento funcional
RF-02.01	El sistema debe permitir el registro de postulantes mediante DNI, correo electrónico y número de celular.
RF-02.02	El sistema debe validar los datos de identidad mediante integración autorizada con RENIEC.
RF-02.03	El sistema debe verificar que el postulante no tenga una inscripción incompatible o duplicada dentro del mismo proceso.
RF-02.04	El sistema debe permitir crear una cuenta con credenciales seguras.
RF-02.05	El sistema debe permitir iniciar sesión, cerrar sesión y recuperar contraseñas.
RF-02.06	El sistema debe verificar el correo electrónico mediante un código de confirmación.
RF-02.07	El sistema debe permitir actualizar datos de contacto, dirección y otros datos editables.
RF-02.08	El sistema debe generar un identificador único de postulante y registrar sus actividades principales.
Módulo 03. Inscripción de postulantes – Modalidad Ordinaria
Objetivo: Digitalizar la inscripción de postulantes que participan en el examen ordinario.
Código	Requerimiento funcional
RF-03.01	El sistema debe permitir seleccionar la modalidad de admisión Ordinaria.
RF-03.02	El sistema debe presentar un formulario de inscripción con datos personales, académicos y de contacto.
RF-03.03	El sistema debe permitir seleccionar el programa de estudios al que desea postular.
RF-03.04	El sistema debe validar los requisitos de inscripción definidos en la convocatoria.
RF-03.05	El sistema debe permitir adjuntar fotografía y documentos requeridos en formatos autorizados.
RF-03.06	El sistema debe guardar inscripciones incompletas como borrador para continuarlas posteriormente.
RF-03.07	El sistema debe calcular el derecho de inscripción correspondiente según las reglas de la convocatoria.
RF-03.08	El sistema debe permitir confirmar la inscripción una vez validado el pago y los requisitos aplicables.
RF-03.09	El sistema debe generar una ficha de inscripción en formato PDF con código único y código QR verificable.
RF-03.10	El sistema debe mostrar el estado de inscripción y permitir descargar la ficha cuando esté habilitada.

Módulo 04. Inscripción de postulantes – Modalidad Exonerados
Objetivo: Gestionar la inscripción y evaluación de postulantes que acceden mediante las submodalidades especiales autorizadas por la universidad.
Código	Requerimiento funcional
RF-04.01	El sistema debe permitir seleccionar la modalidad Exonerados y la submodalidad correspondiente.
RF-04.02	El sistema debe mostrar los requisitos específicos según la submodalidad seleccionada.
RF-04.03	El sistema debe permitir registrar información personal, académica y datos complementarios.
RF-04.04	El sistema debe permitir adjuntar certificados, constancias, resoluciones y otros documentos sustentatorios.
RF-04.05	El sistema debe validar la integridad y formato de los documentos cargados.
RF-04.06	El sistema debe permitir que un evaluador autorizado revise los expedientes.
RF-04.07	El sistema debe permitir aprobar, observar o rechazar expedientes, registrando el motivo.
RF-04.08	El sistema debe permitir subsanar observaciones dentro de los plazos establecidos.
RF-04.09	El sistema debe verificar el cumplimiento de los requisitos antes de habilitar las siguientes etapas.
RF-04.10	El sistema debe generar la ficha de inscripción de exonerados una vez cumplidas las condiciones.
RF-04.11	El sistema debe administrar las vacantes y criterios de evaluación específicos de cada submodalidad.
RF-04.12	El sistema debe permitir la programación de evaluaciones o exámenes especiales cuando corresponda.
Importante: Las submodalidades concretas de exonerados deberán configurarse según el reglamento vigente de la UNSCH, evitando establecer categorías o beneficios que no estén autorizados.


Módulo 05. Gestión de pagos y pasarela de pagos
Objetivo: Automatizar el cobro de derechos de inscripción y la confirmación de las transacciones.
Código	Requerimiento funcional
RF-05.01	El sistema debe calcular automáticamente el monto a pagar según modalidad, categoría y tasa vigente.
RF-05.02	El sistema debe generar una orden de pago única asociada al postulante y proceso.
RF-05.03	El sistema debe integrarse con una pasarela de pagos autorizada que admita los medios habilitados por la universidad.
RF-05.04	El sistema debe redirigir al postulante a un entorno seguro de pago o utilizar un formulario de pago certificado.
RF-05.05	El sistema debe recibir confirmaciones de pago mediante notificaciones seguras del proveedor, como webhooks.
RF-05.06	El sistema debe actualizar automáticamente el estado del pago después de verificar la transacción.
RF-05.07	El sistema debe registrar el identificador de operación, monto, fecha, medio y estado del pago.
RF-05.08	El sistema debe generar una constancia de pago y permitir su descarga, diferenciándola del comprobante tributario cuando corresponda.
RF-05.09	El sistema debe evitar pagos duplicados y gestionar operaciones pendientes, rechazadas o expiradas.
RF-05.10	El sistema debe permitir consultar el historial de transacciones del postulante.
RF-05.11	El sistema debe permitir al personal autorizado conciliar los pagos registrados con los reportes del proveedor y tesorería.
RF-05.12	El sistema debe gestionar devoluciones o anulaciones conforme a las reglas institucionales y del proveedor.




Módulo 06. Gestión y validación de expedientes
Objetivo: Centralizar la revisión documental de los postulantes de ambas modalidades.
Código	Requerimiento funcional
RF-06.01	El sistema debe permitir administrar los documentos obligatorios según la modalidad y convocatoria.
RF-06.02	El sistema debe permitir visualizar y descargar los expedientes de postulantes autorizados.
RF-06.03	El sistema debe asignar expedientes a evaluadores según criterios de distribución.
RF-06.04	El sistema debe permitir registrar observaciones específicas por documento.
RF-06.05	El sistema debe notificar al postulante cuando su expediente requiera subsanación.
RF-06.06	El sistema debe mantener el historial de versiones y revisiones documentales.
RF-06.07	El sistema debe permitir aprobar o rechazar el expediente con una justificación.
RF-06.08	El sistema debe impedir la habilitación para el examen cuando existan requisitos obligatorios pendientes.
Módulo 07. Programación y gestión de exámenes de admisión
Objetivo: Administrar las fechas, sesiones, características y condiciones de los exámenes.
Código	Requerimiento funcional
RF-07.01	El sistema debe permitir crear exámenes asociados a cada proceso y modalidad.
RF-07.02	El sistema debe permitir configurar fecha, hora de inicio, duración y lugar de evaluación.
RF-07.03	El sistema debe permitir definir las áreas académicas y reglas de evaluación.
RF-07.04	El sistema debe permitir configurar los criterios de calificación y puntajes conforme al reglamento.
RF-07.05	El sistema debe generar una relación de postulantes habilitados para rendir el examen.
RF-07.06	El sistema debe permitir programar sesiones diferenciadas para Ordinarios y Exonerados.
RF-07.07	El sistema debe controlar que las fechas y sesiones no presenten conflictos de programación.
RF-07.08	El sistema debe publicar las indicaciones, materiales permitidos y horarios de ingreso al examen.
RF-07.09	El sistema debe permitir registrar reprogramaciones autorizadas y notificar a los afectados.
Módulo 08. Gestión de sedes, aulas y distribución de postulantes
Objetivo: Organizar la asignación de postulantes a las sedes y aulas del examen.
Código	Requerimiento funcional
RF-08.01	El sistema debe permitir registrar sedes, pabellones, pisos y aulas de evaluación.
RF-08.02	El sistema debe permitir configurar la capacidad máxima de cada aula.
RF-08.03	El sistema debe distribuir automáticamente a los postulantes habilitados según capacidad y reglas institucionales.
RF-08.04	El sistema debe impedir la asignación duplicada de postulantes a una misma sesión.
RF-08.05	El sistema debe permitir consultar el aula asignada mediante DNI o código de postulante, aplicando controles de privacidad.
RF-08.06	El sistema debe generar una ficha de examen con sede, aula, horario y código QR.
RF-08.07	El sistema debe generar listas de asistencia por aula y sesión.
RF-08.08	El sistema debe permitir registrar asistencia, inasistencia e incidencias durante el examen.
RF-08.09	El sistema debe permitir gestionar cambios de aula autorizados y conservar su trazabilidad.



Módulo 09. Procesamiento, publicación y consulta de resultados
Objetivo: Gestionar las calificaciones y publicar los resultados oficiales de manera segura y transparente.
Código	Requerimiento funcional
RF-09.01	El sistema debe permitir importar las calificaciones desde archivos estructurados o sistemas de evaluación autorizados.
RF-09.02	El sistema debe validar la integridad de los registros y detectar inconsistencias antes del procesamiento.
RF-09.03	El sistema debe calcular los puntajes finales conforme a los criterios de evaluación configurados.
RF-09.04	El sistema debe generar el orden de mérito por programa de estudios y modalidad.
RF-09.05	El sistema debe determinar la condición de ingreso según vacantes y reglas de desempate aprobadas.
RF-09.06	El sistema debe permitir revisar, validar y aprobar los resultados antes de su publicación.
RF-09.07	El sistema debe publicar los resultados oficiales en la fecha y hora autorizadas.
RF-09.08	El sistema debe permitir al postulante consultar su puntaje y condición mediante un mecanismo seguro.
RF-09.09	El sistema debe permitir generar reportes de ingresantes, no ingresantes, ausentes y resultados por modalidad.
RF-09.10	El sistema debe permitir descargar constancias de ingreso cuando hayan sido autorizadas.
RF-09.11	El sistema debe conservar versiones de resultados y registrar rectificaciones debidamente aprobadas.
RF-09.12	El sistema debe permitir administrar solicitudes de revisión o reclamos dentro de los plazos establecidos.





Módulo 10. Chatbot inteligente de orientación y seguimiento – OpenRouter API
Objetivo: Brindar asistencia automatizada a los postulantes durante todas las etapas del proceso de admisión mediante un chatbot integrado con modelos de inteligencia artificial accesibles a través de OpenRouter.
Código	Requerimiento funcional
RF-10.01	El sistema debe integrar un chatbot de inteligencia artificial mediante la API de OpenRouter.
RF-10.02	El chatbot debe responder preguntas sobre convocatorias, modalidades, requisitos, costos, cronogramas y exámenes.
RF-10.03	El chatbot debe consultar información institucional verificada para responder sobre el proceso de admisión vigente.
RF-10.04	El chatbot debe permitir al postulante autenticado consultar el estado de su inscripción.
RF-10.05	El chatbot debe permitir consultar el estado del pago utilizando los servicios internos autorizados.
RF-10.06	El chatbot debe informar si existen documentos pendientes, observados o aprobados.
RF-10.07	El chatbot debe proporcionar información sobre sede, aula y horario asignados cuando estén publicados.
RF-10.08	El chatbot debe orientar sobre la consulta de resultados y mostrar únicamente información autorizada.
RF-10.09	El chatbot debe ofrecer instrucciones para solucionar incidencias frecuentes de inscripción y pagos.
RF-10.10	El chatbot debe derivar consultas complejas o no resueltas a un responsable de soporte.
RF-10.11	El sistema debe permitir registrar conversaciones conforme a las políticas de privacidad y retención.
RF-10.12	El administrador debe poder actualizar la base de conocimientos utilizada por el chatbot.
RF-10.13	El sistema debe almacenar la API key de OpenRouter exclusivamente en el servidor y nunca exponerla al navegador.
RF-10.14	El chatbot debe solicitar autenticación antes de acceder a información personal y limitar sus consultas según los permisos del usuario.
RF-10.15	El sistema debe controlar el consumo de tokens, costos, errores y límites de uso de la API.
RF-10.16	El chatbot debe indicar cuando no dispone de información verificada y evitar inventar pagos, estados, puntajes o fechas.
Ejemplo del chatbot integrado
Asistente virtual UNSCH
Tu inscripción en la modalidad Ordinaria se encuentra en revisión documental. El pago figura como confirmado y tienes una fotografía pendiente de validación.
Ejemplo ilustrativo. En el sistema real, el estado se obtendría de la base de datos, no de una respuesta inventada por la IA.
Módulo 11. Notificaciones y comunicaciones
Objetivo: Mantener informado al postulante sobre cada etapa de su proceso.
Código	Requerimiento funcional
RF-11.01	El sistema debe enviar notificaciones al crear una cuenta y confirmar el correo electrónico.
RF-11.02	El sistema debe notificar la generación de órdenes y confirmación de pagos.
RF-11.03	El sistema debe informar cuando una inscripción cambie de estado.
RF-11.04	El sistema debe notificar las observaciones documentales y fechas límite de subsanación.
RF-11.05	El sistema debe enviar recordatorios de fechas importantes del proceso.
RF-11.06	El sistema debe informar cuando se publique la asignación de aulas.
RF-11.07	El sistema debe informar cuando los resultados oficiales estén disponibles.
RF-11.08	El sistema debe permitir enviar comunicados segmentados por modalidad, programa o estado.
RF-11.09	El sistema debe registrar el estado de envío y entrega de las notificaciones.

Módulo 12. Reportes, estadísticas y panel de control
Objetivo: Proporcionar información para supervisar el proceso de admisión y facilitar la toma de decisiones.
Código	Requerimiento funcional
RF-12.01	El sistema debe mostrar un panel de control con el número de postulantes registrados, inscritos y habilitados.
RF-12.02	El sistema debe generar estadísticas de postulantes por modalidad y programa de estudios.
RF-12.03	El sistema debe mostrar los ingresos recaudados y las transacciones pendientes o rechazadas.
RF-12.04	El sistema debe generar reportes de expedientes aprobados, observados y rechazados.
RF-12.05	El sistema debe mostrar la ocupación de aulas y distribución de postulantes.
RF-12.06	El sistema debe generar estadísticas de asistencia a exámenes.
RF-12.07	El sistema debe generar reportes de puntajes, ingresantes y cobertura de vacantes.
RF-12.08	El sistema debe permitir exportar reportes en formatos PDF y Excel.
RF-12.09	El sistema debe permitir filtrar reportes por convocatoria, modalidad, programa y fechas.
RF-12.10	El sistema debe mostrar indicadores de atención y consultas del chatbot.
Módulo 13. Administración, roles y seguridad
Objetivo: Controlar el acceso y proteger los datos personales y académicos.
Código	Requerimiento funcional
RF-13.01	El sistema debe permitir crear y administrar usuarios internos.
RF-13.02	El sistema debe implementar permisos diferenciados mediante roles.
RF-13.03	El sistema debe permitir activar, suspender y desactivar cuentas administrativas.
RF-13.04	El sistema debe registrar las operaciones críticas realizadas por los usuarios.
RF-13.05	El sistema debe permitir consultar auditorías de cambios en pagos, expedientes y resultados.
RF-13.06	El sistema debe implementar autenticación multifactor para usuarios administrativos.
RF-13.07	El sistema debe impedir el acceso a información o funcionalidades no autorizadas.
RF-13.08	El sistema debe permitir administrar sesiones y revocar accesos comprometidos.
RF-13.09	El sistema debe administrar el consentimiento y tratamiento de datos personales.
RF-13.10	El sistema debe permitir configurar políticas de retención y eliminación de información.
Módulo 14. Configuración general e integraciones
Objetivo: Centralizar la configuración de parámetros institucionales y conexiones externas.
Código	Requerimiento funcional
RF-14.01	El sistema debe permitir configurar datos institucionales, logotipos y contenido del portal.
RF-14.02	El sistema debe permitir administrar las tasas de inscripción por convocatoria y modalidad.
RF-14.03	El sistema debe permitir configurar los requisitos documentales y reglas de validación.
RF-14.04	El sistema debe permitir administrar los parámetros de conexión con RENIEC, según las autorizaciones correspondientes.
RF-14.05	El sistema debe permitir configurar las credenciales de la pasarela de pagos mediante almacenamiento seguro.
RF-14.06	El sistema debe permitir configurar la API key y el modelo de OpenRouter desde el servidor.
RF-14.07	El sistema debe permitir configurar los servicios de correo electrónico y mensajería.
RF-14.08	El sistema debe permitir activar o desactivar funcionalidades según la etapa del proceso.
RF-14.09	El sistema debe registrar fallas de integración y habilitar mecanismos de reintento controlado.
RF-14.10	El sistema debe permitir gestionar respaldos y parámetros operativos de recuperación.

Requerimientos no funcionales
Estos requisitos son fundamentales para que el sistema funcione correctamente, especialmente durante los periodos de inscripción y publicación de resultados.
Código	Requerimiento no funcional
RNF-01	La plataforma debe ser responsiva y compatible con computadoras, tabletas y celulares.
RNF-02	El sistema debe utilizar HTTPS y cifrado para proteger la información transmitida.
RNF-03	El sistema debe cumplir la Ley de Protección de Datos Personales del Perú y su reglamentación aplicable.
RNF-04	El sistema debe soportar incrementos de usuarios concurrentes durante inscripciones y publicación de resultados, según pruebas de carga.
RNF-05	Las consultas habituales deben responder en un tiempo objetivo de 3 segundos bajo condiciones de carga definidas, excluyendo dependencias externas lentas.
RNF-06	El sistema debe implementar copias de seguridad automáticas y procedimientos probados de restauración.
RNF-07	La arquitectura debe permitir ampliar módulos sin afectar significativamente los existentes.
RNF-08	Las integraciones externas deben implementar tiempos de espera, reintentos controlados y registros de errores.
RNF-09	El sistema debe garantizar la integridad transaccional de pagos, inscripciones y resultados.
RNF-10	El sistema debe contar con registros de auditoría protegidos contra modificaciones no autorizadas.
RNF-11	El chatbot debe evitar enviar datos personales innecesarios a OpenRouter y aplicar controles de acceso a la información consultada.
RNF-12	La plataforma debe contar con mecanismos de monitoreo, alertas y recuperación ante fallas.

```
