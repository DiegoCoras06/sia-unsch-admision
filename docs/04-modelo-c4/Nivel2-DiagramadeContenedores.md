# Nivel 2 · Diagrama de Contenedores

> **Proyecto:** Sistema Integral de Gestión del Proceso de Admisión – UNSCH  
> **Modelo:** C4 · Nivel 2 de 4 · **Versión:** 1.0

---

## 1. Objetivo

Descomponer el **Sistema Integral de Gestión del Proceso de Admisión – UNSCH**, presentado en el nivel 1, para identificar los **contenedores** que lo conforman, las tecnologías utilizadas y los mecanismos de comunicación entre ellos.

Este nivel muestra la estructura tecnológica del sistema, incluyendo la aplicación web, el backend, los almacenes de datos y los servicios externos necesarios para gestionar el proceso de admisión universitaria.

| **Aspecto** | **Descripción** |
|---|---|
| Pregunta que responde | ¿De qué aplicaciones y almacenes de datos se compone el sistema y qué tecnologías utiliza? |
| Audiencia | Arquitectos de software, desarrolladores, docentes y responsables de operaciones. |
| Qué es un contenedor | Una aplicación o almacén de datos que se ejecuta o administra de manera independiente. No necesariamente representa un contenedor Docker. |
| Arquitectura | Monolito Modular por Capas con Clean Architecture. |
| Nivel anterior | `Nivel1-Diagrama-de-Contexto-del-Sistema.md` |
| Siguiente nivel | `Nivel3-Diagrama-de-Componentes.md` |

---

## 2. Diagrama

### Diagrama de contenedores del Sistema Integral de Gestión del Proceso de Admisión – UNSCH

```mermaid
flowchart TB

    P["👤 Postulante"]
    PA["👤 Personal de Admisión"]
    ADM["👤 Administrador"]
    OTROS["👥 Personal Autorizado<br/>Evaluadores, Tesorería,<br/>Exámenes, Resultados y Soporte"]

    subgraph UNSCH["Sistema Integral de Gestión del Proceso de Admisión – UNSCH"]
        direction TB

        WEB["Aplicación Web<br/>SPA - Frontend<br/>Interfaz de postulantes y administración"]

        API["Backend API REST<br/>Node.js + TypeScript + Express<br/>Monolito Modular + Clean Architecture<br/>AWS Lambda"]

        DB[("Base de Datos<br/>Amazon RDS PostgreSQL<br/>Información de admisión")]

        WORKER["Worker de tareas<br/>AWS Lambda + EventBridge Scheduler<br/>Eventos, recordatorios y publicaciones"]

        QUEUE["Cola de Mensajes<br/>Amazon SQS<br/>Solo ID de eventos"]

        STORAGE[("Almacenamiento de Archivos<br/>Amazon S3<br/>Expedientes y documentos")]

    end

    GATEWAY["Amazon API Gateway<br/>Entrada REST mediante HTTPS"]

    CDN["Amazon CloudFront<br/>Distribución de la aplicación web"]

    RENIEC["RENIEC vía apiperu<br/>Validación de identidad"]

    PAYMENT["Izipay micuentaweb y Culqi<br/>Tarjeta y Yape"]

    OPENROUTER["OpenRouter API<br/>Inteligencia Artificial"]

    EMAIL["Amazon SES<br/>Correo"]

    SMS["Servicio SMS<br/>Opcional, no implementado"]

    P -->|"HTTPS"| CDN
    PA -->|"HTTPS"| CDN
    ADM -->|"HTTPS"| CDN
    OTROS -->|"HTTPS"| CDN

    CDN -->|"Entrega frontend"| WEB

    WEB -->|"HTTPS / JSON"| GATEWAY
    GATEWAY -->|"Invocación AWS Lambda"| API

    API -->|"SQL / TLS"| DB
    API -->|"AWS SDK / HTTPS"| STORAGE
    API -->|"AWS SDK / HTTPS"| QUEUE
    QUEUE -->|"Entrega de mensajes"| WORKER
    WORKER -->|"SQL / TLS"| DB
    WORKER -->|"AWS SDK"| EMAIL

    API -->|"HTTPS / API autorizada"| RENIEC
    API -->|"HTTPS / REST"| PAYMENT
    API -->|"HTTPS / REST"| OPENROUTER
    API -->|"API segura"| EMAIL
    API -.->|"HTTPS / API"| SMS

    classDef persona fill:#244478,color:#ffffff,stroke:#19345f
    classDef aplicacion fill:#2563eb,color:#ffffff,stroke:#1d4ed8,stroke-width:2px
    classDef datos fill:#c7d2fe,color:#1e1b4b,stroke:#6366f1
    classDef infraestructura fill:#dbeafe,color:#1e3a8a,stroke:#3b82f6
    classDef externo fill:#929292,color:#ffffff,stroke:#666666

    class P,PA,ADM,OTROS persona
    class WEB,API aplicacion
    class DB,STORAGE datos
    class QUEUE datos
    class WORKER aplicacion
    class CDN,GATEWAY infraestructura
    class RENIEC,PAYMENT,OPENROUTER,EMAIL,SMS externo
```

**Descripción:** El sistema utiliza una aplicación web que se comunica mediante HTTPS con un backend REST implementado como Monolito Modular. El backend se ejecuta en AWS Lambda y utiliza PostgreSQL y Amazon S3 para gestionar la información y los procesos de admisión. Las tareas asíncronas se guardan en una bandeja de eventos dentro de PostgreSQL, se envían a Amazon SQS y las procesa un segundo Lambda (worker).

**Nota:** Amazon CloudFront y API Gateway se muestran como servicios de entrada y distribución. La aplicación web estática se almacenará en Amazon S3 y será entregada al navegador mediante CloudFront. Los servicios de infraestructura se detallan aquí para contextualizar el despliegue; no representan módulos internos del backend.

---

## 3. Contenedores

| **Contenedor** | **Tecnología** | **Responsabilidad** | **Datos que maneja** |
|---|---|---|---|
| **Aplicación Web** | SPA, tecnología frontend por definir, Amazon S3 y CloudFront | Proporcionar interfaces para postulantes, personal de admisión y administradores. Se ejecuta en el navegador. | Estado temporal de formularios, sesiones y datos de consulta. |
| **Backend API REST** | Node.js + TypeScript + Express, AWS Lambda | Exponer los endpoints REST, ejecutar las reglas de negocio, gestionar los 12 módulos funcionales e integrar servicios externos. | Procesa datos de postulantes, inscripciones, pagos, expedientes, exámenes y resultados. |
| **Base de Datos** | Amazon RDS PostgreSQL | Almacenar de forma persistente la información del proceso de admisión. | Usuarios, convocatorias, postulantes, inscripciones, pagos, expedientes, aulas, exámenes y resultados. |
| **Almacenamiento de Archivos** | Amazon S3 | Guardar documentos digitales, expedientes y archivos generados por el sistema. | Documentos de inscripción, comprobantes autorizados, fichas y archivos PDF. |
| **Cola de Mensajes** | Amazon SQS | Transportar los ID de los eventos hasta el worker, con reintentos y cola de errores. | Solo identificadores: sin datos personales. |
| **Worker de tareas** | AWS Lambda (`lambda-worker.ts`) + Amazon SQS + EventBridge Scheduler | Procesar los eventos que llegan por la cola SQS (ADR-021), vencer órdenes de pago, enviar recordatorios y publicar resultados a la hora aprobada. | Eventos de dominio, correos pendientes y tareas programadas. |

### Servicios de infraestructura complementarios

| **Servicio** | **Tecnología** | **Responsabilidad** |
|---|---|---|
| **Distribución Web** | Amazon CloudFront | Distribuir el frontend mediante HTTPS. |
| **Entrada de API** | Amazon API Gateway | Recibir solicitudes REST y dirigirlas al backend AWS Lambda. |
| **Gestión de conexiones** | `connection_limit=1` por Lambda + concurrencia reservada | Evitar agotar las conexiones de PostgreSQL; RDS Proxy se reevalúa tras la prueba de carga. |
| **Gestión de secretos** | AWS SSM Parameter Store (`SecureString`) | Proteger credenciales y claves de servicios externos (menor costo que Secrets Manager). |
| **Monitoreo** | OpenTelemetry + Grafana Cloud | Registrar métricas, trazas, errores y logs (ADR-013 del repositorio). |
| **DNS** | Amazon Route 53 | Gestionar los nombres de dominio del sistema. |
| **Certificados** | AWS Certificate Manager | Gestionar certificados TLS para las comunicaciones HTTPS. |

---

## 4. Relaciones

| **Origen** | **Destino** | **Descripción** | **Protocolo** |
|---|---|---|---|
| Postulante | Aplicación Web | Realiza inscripciones, consulta pagos, exámenes y resultados. | HTTPS |
| Personal de Admisión | Aplicación Web | Gestiona convocatorias, inscripciones y procesos administrativos. | HTTPS |
| Administrador | Aplicación Web | Administra usuarios, roles y configuración. | HTTPS |
| Personal Autorizado | Aplicación Web | Realiza evaluaciones, conciliaciones y gestión de resultados. | HTTPS |
| Aplicación Web | API Gateway | Envía solicitudes a los servicios del backend. | HTTPS / JSON |
| API Gateway | Backend API REST | Invoca la aplicación desplegada en AWS Lambda. | Integración AWS Lambda |
| Backend API REST | PostgreSQL | Consulta y registra información institucional. | PostgreSQL / TLS |
| Backend API REST | Amazon S3 | Guarda y recupera documentos autorizados. | AWS SDK / HTTPS |
| Backend API REST | Bandeja de eventos | Guarda eventos en la misma transacción que el cambio de estado. | SQL / TLS |
| Backend API REST | Amazon SQS | Envía el ID de cada evento pendiente. | AWS SDK / HTTPS |
| Amazon SQS | Worker de tareas | Entrega los mensajes; los que fallan se reintentan. | Integración AWS Lambda |
| Worker de tareas | PostgreSQL y Amazon SES | Despacha eventos y envía correos pendientes. | SQL / TLS y AWS SDK |
| Backend API REST | RENIEC | Solicita validación de identidad de postulantes. | HTTPS / API autorizada |
| Backend API REST | Pasarela de Pagos | Solicita operaciones de pago y procesa confirmaciones verificadas. | HTTPS / REST |
| Backend API REST | OpenRouter API | Envía consultas del chatbot y recibe respuestas. | HTTPS / REST |
| Backend API REST | Servicio de Correo | Solicita el envío de confirmaciones y avisos. | API segura |
| Backend API REST | Servicio SMS | Opcional; no implementado. | HTTPS / API |

---

## 5. Decisiones arquitectónicas reflejadas

| **Decisión** | **Alternativa descartada** | **Motivo** |
|---|---|---|
| **Un único backend basado en Monolito Modular** | Microservicios independientes | Reduce la complejidad de desarrollo, integración y mantenimiento para el equipo del proyecto. |
| **Clean Architecture dentro de los módulos** | Código organizado únicamente por controladores y servicios | Permite separar reglas de negocio, casos de uso e infraestructura. |
| **Frontend separado del backend** | Aplicación monolítica con páginas generadas en el servidor | Facilita el desarrollo y despliegue independiente de la interfaz web. |
| **AWS Lambda para ejecutar el backend** | Servidor dedicado administrado permanentemente | Permite un despliegue administrado y escalamiento según la demanda. |
| **API Gateway como entrada REST** | Exponer directamente el backend | Centraliza el acceso a los endpoints y permite aplicar controles de seguridad. |
| **PostgreSQL como base de datos principal** | Base de datos NoSQL como almacenamiento principal | Los procesos de inscripción, pagos y resultados requieren relaciones e integridad transaccional. |
| **Sin caché por ahora** | Redis con ElastiCache | Las consultas frecuentes son livianas; Redis se agrega solo si la prueba de carga lo exige. |
| **Amazon S3 para documentos** | Guardar archivos directamente en PostgreSQL | Facilita el almacenamiento y la gestión de archivos digitales. |
| **Outbox con Amazon SQS para tareas asíncronas** | Publicar directamente en SQS | El evento se guarda en la misma transacción que el cambio, así no se pierde si SQS falla; SQS aporta reintentos y cola de errores. |
| **Integraciones externas desde el backend** | Invocar servicios externos directamente desde el navegador | Evita exponer credenciales y centraliza la validación de respuestas. |

---

## 6. Seguridad entre contenedores

| **Comunicación** | **Medida de seguridad** |
|---|---|
| Navegador → Aplicación Web | Tráfico cifrado mediante HTTPS y certificados TLS. |
| Aplicación Web → API Gateway | HTTPS, autenticación y autorización para operaciones protegidas. |
| API Gateway → Backend AWS Lambda | Permisos de invocación controlados mediante políticas de AWS. |
| Backend → PostgreSQL | Conexiones cifradas mediante TLS, credenciales protegidas y acceso restringido desde la red autorizada. |
| Backend → Amazon S3 | Permisos mínimos mediante IAM, cifrado de objetos y acceso privado a documentos. |
| Backend y Worker → Amazon SQS | Permisos IAM mínimos, cifrado y solo identificadores en los mensajes. |
| Worker → PostgreSQL | Mismas credenciales protegidas y red privada que el backend. |
| Backend → RENIEC | Comunicación segura y uso de credenciales institucionales autorizadas. |
| Backend → Pasarela de Pagos | HTTPS, verificación de confirmaciones e idempotencia de operaciones. |
| Backend → OpenRouter API | HTTPS, protección de claves API y minimización de datos personales enviados. |
| Backend → Servicios de Notificación | Credenciales protegidas y uso de canales seguros. |

### Controles adicionales

- **Autenticación:** identificación segura de usuarios.
- **Autorización:** control de acceso basado en roles (RBAC).
- **Protección de credenciales:** en el servidor (`.env`) y, al desplegar, en AWS SSM Parameter Store.
- **Auditoría:** registro de operaciones administrativas y acciones críticas.
- **Monitoreo:** OpenTelemetry con Grafana Cloud.
- **Respaldo:** copias de seguridad y recuperación de PostgreSQL.
- **Privacidad:** protección de los datos personales de los postulantes.
- **Validación:** comprobación de entradas antes de procesar operaciones.
- **Integridad:** restricciones y transacciones para evitar registros inconsistentes.

---

## 7. Estado de implementación (02/11/2026)

| Contenedor | Estado |
|---|---|
| Aplicación Web (Angular) | ✅ Implementada; se publica en S3 + CloudFront en el Paso 11 |
| Backend API REST | ✅ Implementado (`server.ts` en local, `lambda-api.ts` para Lambda) |
| Worker de tareas | ✅ Código listo (`lambda-worker.ts`); en local las tareas corren en el mismo proceso |
| Cola de Mensajes (Amazon SQS) | ✅ Código y pruebas listos (ADR-021); ⏳ la cola se crea en el Paso 11. Sin `SQS_QUEUE_URL`, los eventos se procesan en el mismo proceso |
| Base de datos | ✅ Amazon RDS PostgreSQL en uso |
| Almacenamiento de archivos | ✅ Amazon S3 en uso |
| API Gateway, CloudFront, Route 53, ACM | ⏳ Paso 11 |

Esta versión reemplaza Redis de la propuesta inicial; el motivo está en `01-analisis-del-sistema/07-decisiones-arquitectonicas.md`.
