# 5. Decisiones Arquitectónicas (ADR)

## Sistema Integral de Gestión del Proceso de Admisión – UNSCH

Las decisiones arquitectónicas se establecen a partir de los veinte drivers arquitectónicos (DA01–DA20), considerando el estilo de **Monolito Modular por Capas**, los principios de **Clean Architecture**, el despliegue mediante **AWS Lambda**, la base de datos **PostgreSQL**, el uso de caché **Redis** (ver el estado de ADR-005 más abajo) y la comunicación segura mediante **API REST y HTTPS**.

| Identificación | Decisión arquitectónica | Conductor relacionado | Justificación | Resultado |
|---|---|---|---|---|
| ADR-001 | Monolito Modular por Capas | DA05 - Arquitectura, DA09 - Mantenibilidad, DA17 - Modularidad | Organizar las funcionalidades en módulos independientes a nivel lógico, manteniendo una única aplicación desplegable para reducir la complejidad operativa. | Aplicación monolítica modular con 14 módulos funcionales, organizados por responsabilidades y contratos internos. |
| ADR-002 | Clean Architecture (Arquitectura Limpia) | DA05 - Arquitectura, DA09 - Mantenibilidad | Separar las reglas de negocio de los detalles tecnológicos para facilitar las pruebas, modificaciones y mantenimiento. | Módulos organizados en capas de Dominio, Aplicación, Presentación e Infraestructura, con dependencias orientadas hacia el dominio. |
| ADR-003 | Despliegue mediante AWS Lambda | DA01 - Escalabilidad, DA10 - Disponibilidad, DA20 - Presupuesto | Ejecutar el backend monolítico modular mediante una función Serverless, aprovechando el escalamiento automático y el pago por uso. | Una aplicación backend desplegada como una función AWS Lambda, sin dividir los módulos en microservicios independientes. |
| ADR-004 | Persistencia mediante PostgreSQL | DA04 - Integridad, DA15 - Base de datos | Garantizar la consistencia de inscripciones, pagos, expedientes y resultados mediante transacciones y restricciones relacionales. | Amazon RDS PostgreSQL con separación lógica de datos por módulos y repositorios de persistencia. |
| ADR-005 | Estrategia de caché mediante Redis | DA02 - Rendimiento, DA01 - Escalabilidad | Reducir las consultas repetitivas a PostgreSQL durante los periodos de alta concurrencia. | Amazon ElastiCache con Redis para convocatorias, modalidades, programas, vacantes y consultas frecuentes, con políticas de expiración e invalidación. |
| ADR-006 | Comunicación mediante API REST y HTTPS | DA06 - API REST, DA03 - Seguridad | Establecer una comunicación estandarizada y cifrada entre el frontend y el backend. | Amazon API Gateway con endpoints REST protegidos mediante HTTPS y certificados TLS. |
| ADR-007 | Integración mediante interfaces y adaptadores | DA07 - Integraciones, DA09 - Mantenibilidad | Desacoplar los casos de uso de los proveedores externos y facilitar su sustitución sin modificar las reglas de negocio. | Interfaces y adaptadores para RENIEC, pasarela de pagos, OpenRouter API y servicios de notificaciones. |
| ADR-008 | Seguridad y control de acceso | DA03 - Seguridad, DA13 - Privacidad | Proteger los datos personales, académicos y financieros mediante autenticación, autorización y cifrado. | HTTPS, AWS Certificate Manager, autenticación segura, control de acceso basado en roles y gestión de secretos mediante AWS Secrets Manager. |
| ADR-009 | Comunicación asíncrona mediante eventos | DA02 - Rendimiento, DA11 - Confiabilidad | Procesar operaciones complementarias sin bloquear las solicitudes principales del sistema. | Amazon SQS y procesamiento asíncrono para notificaciones, confirmaciones y tareas complementarias, manteniendo un único backend modular. |
| ADR-010 | Distribución web mediante CDN | DA02 - Rendimiento, DA10 - Disponibilidad | Optimizar la distribución del frontend y mejorar los tiempos de carga del portal web. | Amazon S3, CloudFront, Route 53 y certificados HTTPS mediante AWS Certificate Manager. |
| ADR-011 | Chatbot inteligente mediante OpenRouter API | DA08 - Inteligencia artificial, DA13 - Privacidad | Brindar orientación y seguimiento personalizado sin exponer información sensible ni credenciales. | Módulo de chatbot integrado con OpenRouter mediante un adaptador backend, con API key protegida en AWS Secrets Manager. |
| ADR-012 | Gestión de pagos seguros | DA04 - Integridad, DA07 - Integraciones, DA11 - Confiabilidad | Garantizar que las transacciones sean verificadas y evitar pagos duplicados o inconsistentes. | Integración con pasarela de pagos mediante HTTPS, webhooks verificados, operaciones idempotentes y registros transaccionales. |
| ADR-013 | Gestión de documentos digitales | DA04 - Integridad, DA13 - Privacidad | Almacenar de manera segura las fichas, fotografías, certificados y expedientes de los postulantes. | Amazon S3 con almacenamiento privado, acceso autorizado y generación de documentos PDF. |
| ADR-014 | Auditoría y trazabilidad | DA12 - Auditabilidad, DA03 - Seguridad | Registrar las operaciones críticas y permitir identificar modificaciones realizadas durante el proceso de admisión. | Registros de auditoría para inscripciones, pagos, expedientes, calificaciones y resultados. |
| ADR-015 | Monitoreo y observabilidad | DA10 - Disponibilidad, DA16 - Observabilidad | Detectar fallas, supervisar el rendimiento y controlar el funcionamiento de las integraciones externas. | Amazon CloudWatch para logs, métricas, alarmas y monitoreo de AWS Lambda y API Gateway. |
| ADR-016 | Respaldo y recuperación de datos | DA14 - Recuperabilidad, DA04 - Integridad | Proteger la información institucional frente a fallas técnicas o pérdida de datos. | Copias de seguridad de PostgreSQL mediante mecanismos administrados de Amazon RDS y políticas de recuperación. |
| ADR-017 | Gestión de exámenes y asignación de aulas | DA18 - Programación de exámenes, DA04 - Integridad | Evitar asignaciones duplicadas, conflictos de horarios y sobreocupación de aulas. | Módulos de exámenes y aulas con reglas de negocio, validaciones de capacidad y control de concurrencia. |
| ADR-018 | Procesamiento seguro de resultados | DA19 - Publicación de resultados, DA12 - Auditabilidad | Garantizar que las calificaciones y resultados sean revisados antes de su publicación oficial. | Módulo de resultados con flujos de validación, autorización, publicación y auditoría. |
| ADR-019 | Control de concurrencia y conexiones | DA01 - Escalabilidad, DA02 - Rendimiento, DA15 - Base de datos | Evitar que el escalamiento automático de AWS Lambda sature las conexiones de PostgreSQL. | Amazon RDS Proxy, límites de concurrencia de Lambda y optimización de consultas a la base de datos. |
| ADR-020 | Automatización del despliegue (infraestructura como código) | DA10 - Disponibilidad, DA14 - Recuperabilidad, DA20 - Presupuesto | Crear y actualizar toda la infraestructura de AWS de forma repetible, sin pasos manuales que se olviden o difieran entre entornos. | AWS CDK en TypeScript con pilas de red, datos, API y web, y entornos de desarrollo y demostración. |

> **Nota de corrección (02/11/2026):** la fila ADR-020 estaba cortada en la versión anterior de este documento («Automat…») y el archivo se llamaba `07-Desiciones-arquitectonicas.md`. Se completó la fila y se corrigió el nombre.

## Estado de implementación (02/11/2026)

Durante la implementación (Pasos 3 a 10.2) cada decisión se detalló en un ADR propio dentro de [`docs/adr`](../adr/README.md), con sus alternativas y consecuencias. Algunas cambiaron por costo o porque la carga esperada no las justificaba; el ADR del repositorio es la versión vigente.

| Decisión de este documento | Qué se implementó | ADR vigente | Estado |
|---|---|---|---|
| ADR-001 Monolito Modular por Capas | Un backend Express con 12 carpetas de módulo que cubren los 14 módulos funcionales (Inscripción Ordinaria y Exonerados comparten `inscripciones`; Exámenes y Sedes y Aulas comparten `examenes`). | ADR-001 | ✅ |
| ADR-002 Clean Architecture | Capas `presentation`, `application`, `domain` e `infrastructure` por módulo; los controladores no tocan la base de datos. **Desviación:** la mayoría de los servicios de aplicación usan Prisma sin repositorio intermedio (ver 03, patrones). | ADR-002 | 🟡 |
| ADR-003 Despliegue con AWS Lambda | Diseñado (API Gateway HTTP API + Lambda ARM64); aún no desplegado. | ADR-009 | ⏳ Paso 11 |
| ADR-004 PostgreSQL | Amazon RDS PostgreSQL con Prisma 7, un esquema por módulo y SSL verificado. | ADR-005 | ✅ |
| ADR-005 Caché con Redis | **No se implementó.** El límite de intentos usa un contador en PostgreSQL y las consultas frecuentes son livianas. Redis se agregaría solo si la prueba de carga (EQ-01) lo exige. | ADR-005; R-08 en `specs/001-portal-publico/design.md` | Descartado por ahora |
| ADR-006 API REST y HTTPS | API REST `/api/v1` con contratos en `packages/contracts`; HTTPS llega con CloudFront al desplegar. | ADR-004, ADR-009 | ✅ / ⏳ HTTPS |
| ADR-007 Interfaces y adaptadores | Puertos `IdentityProvider`, `PaymentGateway`, `YapeGateway`, `LlmProvider`, `EmailSender` y `FileStorage`, cada uno con adaptador real y simulado. | ADR-007 | ✅ |
| ADR-008 Seguridad y control de acceso | Argon2id, JWT de 15 min + refresh rotado en cookie HttpOnly, 8 roles con permisos verificados, TOTP obligatorio para el personal. Secretos en `.env` del servidor; en AWS irán a **SSM Parameter Store** en lugar de Secrets Manager (costo). | ADR-006, ADR-018, ADR-009 | ✅ |
| ADR-009 Eventos con Amazon SQS | **Cambió:** patrón Transactional Outbox en PostgreSQL (`shared.outbox`) con suscriptores idempotentes; en AWS lo despachará EventBridge Scheduler cada minuto. | ADR-008, ADR-012 | ✅ (outbox) |
| ADR-010 CDN | S3 + CloudFront diseñados; dominio propio con Route 53 opcional. | ADR-009 | ⏳ Paso 11 |
| ADR-011 Chatbot con OpenRouter | Asistente con herramientas sobre datos oficiales, pase firmado para datos personales, presupuesto diario y modo básico sin clave. | ADR-017 | ✅ |
| ADR-012 Pagos seguros | Izipay micuentaweb (tarjeta) y Culqi (Yape) en sandbox, firma HMAC verificada en el servidor, confirmación idempotente por SDK, IPN o consulta. | ADR-016, ADR-019 | ✅ sandbox |
| ADR-013 Documentos digitales | Amazon S3 privado con URL prefirmadas; fichas, constancias y órdenes de pago en PDF con QR firmado. | ADR-010 | ✅ |
| ADR-014 Auditoría | Registro de auditoría de operaciones críticas y accesos denegados, consultable en el panel. | ADR-006, ADR-018 | ✅ |
| ADR-015 Monitoreo con CloudWatch | **Cambió:** OpenTelemetry + Grafana Cloud (sin CloudWatch). El código ya está instrumentado; falta el destino. | ADR-013 | 🟡 |
| ADR-016 Respaldo y recuperación | Respaldo automático de RDS de 7 días al desplegar; política y procedimiento visibles en el panel. | ADR-009 | ⏳ Paso 11 |
| ADR-017 Exámenes y aulas | Distribución automática «todo o nada» con control de capacidad, cruces y adecuaciones. | spec 006 | ✅ |
| ADR-018 Resultados | Versiones con aprobación de otra persona y publicación a la hora autorizada. | spec 007 | ✅ |
| ADR-019 Concurrencia con RDS Proxy | **Cambió:** `connection_limit=1` por instancia de Lambda y concurrencia reservada; RDS Proxy se reevalúa tras la prueba de carga (costo fijo). | ADR-005 | ⏳ Paso 11 |
| ADR-020 Infraestructura como código | AWS CDK en TypeScript (`infra/`) diseñado; aún no creado. | ADR-009 | ⏳ Paso 11 |

Decisiones que surgieron durante la implementación y no estaban en este documento: entorno local sin Docker (ADR-014), inscripción sin cuenta obligatoria (ADR-015), configuración de la convocatoria como datos (ADR-011 del repositorio) y Yape con Culqi (ADR-019 del repositorio).
