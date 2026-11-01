# 00 — Constitución del proyecto

> La constitución reúne los **principios no negociables** que toda especificación, plan y línea de código debe respetar. Se cambia solo mediante un ADR aprobado.

---

## Artículo I — Especificación primero

1. Ninguna funcionalidad se implementa sin `requirements.md` aprobado en `specs/NNN-nombre/`.
2. Flujo obligatorio por funcionalidad: **/specify** (`requirements.md`, qué y por qué) → **/clarify** (resolver `[NEEDS CLARIFICATION]`) → **/plan** (`design.md`: plan técnico, decisiones, modelo de datos y validación, más `contracts/`) → **/tasks** (`tasks.md`) → **/implement**.
3. Cada historia de usuario tiene escenarios de aceptación **Dado / Cuando / Entonces**, y cada escenario se convierte en al menos una prueba automática escrita antes del código.
4. Todo requisito es trazable: `RN (Reglamento) → FR (spec) → escenario → prueba → código`.

## Artículo II — Fidelidad institucional

1. Fechas, tasas, vacantes, modalidades, requisitos y reglas de calificación provienen **exclusivamente** de los documentos oficiales en `docs/fuentes/` (Prospecto 2027-I). Están catalogados en `docs/reglas-negocio.md`.
2. Ningún dato oficial se escribe "a fuego" en el código: se carga como **configuración de la convocatoria** (semilla de base de datos), para que el sistema sirva también para 2027-II y siguientes.
3. Toda integración no contratada (RENIEC, pasarela de pago, SMS) se implementa como **simulación claramente etiquetada** (`MockIdentityProvider`, `MockPaymentProvider`). El sistema nunca afirma una validación oficial que no ocurrió.
4. Proyecto académico: no se presenta como el portal oficial de la UNSCH ni se publica en un dominio que lo aparente.

## Artículo III — Arquitectura

1. **Monolito modular** con 14 módulos (`M01`–`M14`) y capas de **Clean Architecture**: `presentation → application → domain`, con `infrastructure` implementando los puertos del dominio.
2. El dominio no importa frameworks, ORM ni SDK de nube.
3. Un módulo solo se comunica con otro a través de su `index.ts` público; nunca lee tablas ajenas.
4. Estados de inscripción, pago, expediente y resultados se cambian **solo en el servidor** y dentro de transacciones.

## Artículo IV — Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular (standalone components, signals) + TypeScript + SCSS |
| Backend | Node.js LTS + TypeScript + Express |
| Validación | Zod (DTO compartidos) |
| Persistencia | PostgreSQL + Prisma (ORM y migraciones) |
| Autenticación | JWT de acceso corto + refresh token en cookie HttpOnly; Argon2id |
| Documentos | Almacenamiento privado (local en desarrollo, Amazon S3 en despliegue) |
| PDF / QR | PDFKit + `qrcode` |
| IA | OpenRouter (clave solo en servidor) |
| Pruebas | Vitest, Supertest, Playwright |
| Calidad | ESLint, Prettier, TypeScript `strict` |
| Despliegue (obligatorio, aclarado 25/10/2026) | AWS: S3 + CloudFront (web), API Gateway HTTP API + Lambda (API y worker), RDS PostgreSQL, S3 (documentos), SES — ver ADR-009 |
| Infraestructura como código | AWS CDK en TypeScript |
| Observabilidad | OpenTelemetry → Grafana Cloud; **sin Amazon CloudWatch** (ADR-013) |
| Desarrollo local | **Sin Docker** (ADR-014): PostgreSQL 16 embebido (`embedded-postgres`), archivos en disco, correos guardados como archivos, telemetría opcional |

> Cambios de stack requieren un ADR.

## Artículo V — Seguridad y privacidad (Ley N° 29733)

1. Un postulante solo ve **sus propios** datos; se valida propiedad en cada endpoint (anti-IDOR).
2. **No se publican listas con nombres completos** de postulantes observados: la consulta es individual por DNI + código (mejora sobre el portal actual).
3. Personal administrativo con MFA; permisos por rol (RBAC).
4. Operaciones críticas (pagos, vacantes, expedientes, resultados, permisos) quedan en **auditoría inmutable**.
5. Secretos solo en variables de entorno del servidor; `.env.example` sin valores reales.

## Artículo VI — Experiencia de usuario

1. Diseño **mobile-first**; la mayoría de postulantes usa celular.
2. Objetivo de accesibilidad **WCAG 2.2 AA**: contraste, teclado, etiquetas, mensajes de error claros.
3. Identidad visual UNSCH: guinda institucional, dorado y blanco; escudo oficial.
4. Español claro y directo; cada pantalla dice al postulante **qué sigue**.

## Artículo VII — Calidad y definición de terminado

Un módulo está terminado cuando: tiene `requirements.md`, `design.md` y `tasks.md` aprobados; compila sin errores en modo `strict`; sus criterios de aceptación tienen pruebas verdes; respeta permisos; registra auditoría donde corresponde; y su pantalla está integrada y documentada.

## Artículo VIII — Convenciones de código

- Código, nombres de tablas y endpoints en **inglés**; textos de interfaz y documentación en **español**.
- Commits con prefijos convencionales (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- Respuesta de API uniforme: `{ data, meta }` o `{ error: { code, message, requestId } }`.
- Una rama Git por funcionalidad con el mismo nombre que su carpeta: `001-portal-publico`.

## Artículo IX — Requisitos no funcionales (aplican a todas las funcionalidades)

| Código | Requisito | Meta verificable |
|---|---|---|
| RNF-01 | Responsivo | Usable sin desplazamiento horizontal desde 360 px de ancho |
| RNF-02 | Transporte cifrado | 100 % del tráfico por HTTPS; HSTS en producción |
| RNF-03 | Protección de datos (Ley 29733) | Consentimiento explícito al registrarse; ningún dato personal en listados públicos |
| RNF-04 | Concurrencia | 500 usuarios simultáneos en inscripción y 2000 en consulta de resultados, validado con prueba de carga |
| RNF-05 | Tiempo de respuesta | Percentil 95 < 3 s en consultas habituales bajo la carga de RNF-04 |
| RNF-06 | Respaldo | Copia diaria de la base de datos; restauración probada al menos una vez |
| RNF-07 | Extensibilidad | Añadir un módulo no modifica el dominio de otros módulos |
| RNF-08 | Integraciones resilientes | Tiempo de espera ≤ 10 s, hasta 3 reintentos con espera creciente, error registrado |
| RNF-09 | Integridad transaccional | Ningún pago confirmado sin inscripción asociada; ningún resultado publicado sin aprobación |
| RNF-10 | Auditoría | Registro de quién, qué, cuándo y valor anterior/nuevo en operaciones críticas; sin permiso de edición |
| RNF-11 | Privacidad en IA | El chatbot no envía DNI, nombres ni correos al proveedor de IA |
| RNF-12 | Disponibilidad y monitoreo | 99 % de disponibilidad en periodo de inscripción y el día de resultados; alertas ante errores 5xx |
| RNF-13 | Accesibilidad | WCAG 2.2 AA: contraste ≥ 4.5:1, navegación completa por teclado, etiquetas en todos los campos |
| RNF-14 | Rendimiento de carga | Página de inicio < 2.5 s (LCP) en red 4G móvil |

## Gobernanza

- Esta constitución prevalece sobre cualquier otra práctica del proyecto.
- Toda enmienda requiere un ADR en `docs/adr/`, aprobación del equipo y aumento de versión (MAYOR: elimina principios; MENOR: agrega; PARCHE: redacción).
- Cada `design.md` incluye la tabla *Verificación de la constitución*.

**Versión:** 1.3.0 · **Ratificada:** 25/10/2026 · **Última enmienda:** 25/10/2026 (entorno local sin Docker — ADR-014; observabilidad sin CloudWatch — ADR-013)
