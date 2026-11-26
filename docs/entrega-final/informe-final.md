# Informe final — Sistema Integral de Admisión UNSCH

> Documento consolidado para la evaluación. Antes de entregar, completar únicamente los datos de portada y la evidencia
> del despliegue indicada como pendiente.

## Datos generales

| Campo            | Información                                                                          |
| ---------------- | ------------------------------------------------------------------------------------ |
| Proyecto         | Sistema Integral de Admisión de la Universidad Nacional de San Cristóbal de Huamanga |
| Repositorio      | <https://github.com/DiegoCoras06/sia-unsch-admision>                                 |
| Arquitectura     | Monolito modular con Clean Architecture por módulo                                   |
| Frontend         | Angular 22                                                                           |
| Backend          | Node.js 22, Express 5 y TypeScript                                                   |
| Base de datos    | PostgreSQL 16 en Amazon RDS; PostgreSQL embebido para pruebas aisladas               |
| Integrantes      | **Completar nombres**                                                                |
| Curso y docente  | **Completar**                                                                        |
| Fecha de entrega | **Completar**                                                                        |

## 1. Resumen ejecutivo

El proyecto reemplaza procesos fragmentados de admisión por una plataforma web que concentra información pública,
inscripción, pagos, expedientes de exonerados, distribución de aulas, asistencia, resultados, notificaciones, atención y
administración. La primera versión funcional implementa diez especificaciones SDD y doce módulos de negocio.

La solución utiliza un monolito modular porque permite transacciones consistentes y un despliegue sencillo, pero protege
los límites mediante Clean Architecture y pruebas automáticas. El portal público y el panel administrativo consumen una
API REST documentada con OpenAPI. PostgreSQL separa los módulos en esquemas y aplica restricciones únicas, transacciones,
índices y una bandeja de eventos transaccional.

La calidad se verificó con 308 pruebas Jest, pruebas E2E por navegador, accesibilidad automática, Lighthouse, Postman y
k6 hasta 2000 usuarios concurrentes. La última suite completa aprobó 308 de 308 pruebas y alcanzó 91,01 % de cobertura
de líneas. La carga local obtuvo p95 de 589 ms y 0 % de errores con 2000 usuarios.

## 2. Problema y requerimientos

Los principales problemas identificados fueron la duplicación de información, los trámites presenciales, la poca
visibilidad del estado del postulante, los errores manuales en pagos y resultados, y la dificultad para atender picos de
demanda. Los actores, historias, requisitos funcionales, restricciones y atributos de calidad están documentados en
`docs/01-analisis-del-sistema/`, `docs/reglas-negocio.md`, `docs/trazabilidad-requisitos.md` y `docs/vision.md`.

Los requisitos se priorizaron alrededor de rendimiento, seguridad, disponibilidad, integridad, mantenibilidad,
interoperabilidad, usabilidad, confiabilidad y auditabilidad.

## 3. Análisis, diseño y arquitectura

La arquitectura de alto nivel contiene una SPA Angular, API Express, PostgreSQL, almacenamiento de documentos,
integraciones de identidad, pagos y correo, y un worker de eventos. El modelo C4 está documentado desde contexto hasta
código en `docs/04-modelo-c4/`.

La arquitectura de bajo nivel divide cada módulo en `domain`, `application`, `infrastructure` y `presentation`. Las
decisiones están justificadas en 24 ADR. Las pruebas `limites-modulos.test.ts` impiden que la aplicación importe Prisma,
presentación o infraestructura y que un módulo use directamente el interior de otro.

## 4. Desarrollo basado en SDD

Las carpetas `specs/001` a `specs/010` contienen requisitos, escenarios de aceptación, diseño y tareas técnicas. Cubren
portal, cuentas, inscripción ordinaria, exonerados, pagos, examen, resultados, panel, asistente y notificaciones. Los
contratos REST se consolidan en OpenAPI y Swagger, disponible en `/api/docs`.

La trazabilidad conecta requisito → especificación → tarea → implementación → prueba. Así se demuestra que las
funcionalidades se desarrollaron desde criterios verificables.

## 5. Implementación

El código se organiza como workspace npm: `apps/frontend`, `apps/backend`, `packages/contracts`, `specs`, `calidad` y
`docs`. Se aplican SOLID, repositorio, adaptador, unidad de trabajo, fachada, observador mediante outbox, decorador de
caché, proxy de invalidación, circuit breaker e idempotencia.

## 6. Base de datos y caché

PostgreSQL utiliza un esquema por módulo, restricciones únicas, índices por patrones de consulta, transacciones y
contadores atómicos. El pool es configurable. La caché en memoria protege catálogo, portada, comunicados, recursos y
dashboard. Las rutas públicas incluyen `Cache-Control` para CDN; los datos personales y administrativos usan `no-store`.

| Escenario concurrente del 26/11/2026  | Resultado                                        |
| ------------------------------------- | ------------------------------------------------ |
| 100 lecturas                          | 1410 ms, 0 errores                               |
| 12 inscripciones simultáneas          | 628 ms, 12 códigos únicos, 0 errores             |
| 8 solicitudes para el mismo documento | 1 creada, 7 conflictos controlados, 0 duplicados |

## 7. Pruebas y aseguramiento de calidad

| Tipo                    | Herramienta                            | Resultado                                                    |
| ----------------------- | -------------------------------------- | ------------------------------------------------------------ |
| Unitarias e integración | Jest + Supertest + PostgreSQL temporal | 308/308 aprobadas                                            |
| Cobertura               | V8/Jest                                | 91,01 % líneas; 90,36 % funciones; 77,51 % ramas             |
| E2E                     | Playwright + Edge                      | Inscripción completa aprobada y automatizada en CI           |
| Contrato REST           | Jest + OpenAPI                         | Todas las rutas documentadas                                 |
| Carga                   | k6                                     | 2000 VU, p95 589 ms, 0 % errores                             |
| API                     | Postman/Newman                         | 70/70 comprobaciones de lectura aprobadas                    |
| Accesibilidad           | axe-core y Playwright                  | 44 combinaciones, 0 violaciones y 0 overflow                 |
| Experiencia             | Lighthouse                             | Rendimiento 96, accesibilidad 100, CLS 0,003                 |
| Confiabilidad           | Jest                                   | circuit breaker, DLQ, health checks, idempotencia y métricas |

Las evidencias están en `calidad/resultados/`. Las capturas E2E y la cobertura se guardan como artefactos de CI.

## 8. Escalabilidad

El frontend aplica división por rutas, carga diferida, presupuestos de bundle y service worker. El backend reduce presión
sobre PostgreSQL con caché, cabeceras para CDN, pool acotado, idempotencia, outbox y procesamiento asíncrono. La capacidad
definitiva debe repetirse en AWS observando conexiones, CPU, IOPS, bloqueos y latencia.

## 9. CI/CD y repositorio

GitHub Actions ejecuta lint, tipos, compilación de contratos, backend Lambda y Angular, Jest con cobertura y E2E aislado.
El código, esquema Prisma, migraciones y semillas seguras están en GitHub; credenciales, `.env` y datos reales están
excluidos.

**Pendiente de Sprint 3:** activar CD hacia AWS después de crear la infraestructura y configurar OIDC/secretos. No se
deben guardar claves AWS permanentes en GitHub.

## 10. Despliegue, dominio, DNS y CDN

ADR-009 propone S3 + CloudFront, API Gateway + Lambda, Lambda worker, SQS y RDS. ADR-020 define la caché de CloudFront.
Antes de la entrega definitiva se deben anexar URL HTTPS, registros DNS, distribución CDN, health check desplegado, k6
contra AWS y una ejecución del pipeline CD.

## 11. Conclusiones

La solución respeta sus decisiones arquitectónicas y separa las reglas de frameworks y servicios externos. Las pruebas
demuestran funcionamiento, integridad, confiabilidad y capacidad local. La caché eliminó el cuello de botella principal:
antes aparecía 25 % de errores con 500 usuarios; después soportó 2000 usuarios con 0 % de errores.

El riesgo restante es operacional: falta desplegar, configurar DNS/CDN y repetir las pruebas desde AWS. Esta etapa se
mantiene aislada para evitar secretos en GitHub y costos sin aprobación.

## 12. Anexos

- `docs/avance/entrega-sprint-2.md`.
- `docs/arquitectura.md`, `docs/04-modelo-c4/` y `docs/adr/`.
- `specs/001` a `specs/010`.
- `apps/backend/swagger/openapi.json`.
- `calidad/resultados/`.
- `docs/entrega-final/presentacion-y-defensa.md`.
- `docs/entrega-final/matriz-criterios.md`.
