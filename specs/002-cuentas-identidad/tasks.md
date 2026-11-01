# Tareas: Cuentas del postulante e identidad

> **SDD (Spec-Driven Development) · artefacto 3 de 3: tareas** (pasos de implementación verificables).
> Anterior: [requirements.md](requirements.md) · [design.md](design.md).

**Entrada:** [design.md](design.md), [requirements.md](requirements.md), [design.md](design.md), [contracts/openapi.yaml](./contracts/openapi.yaml)
**Depende de:** 001 Fases 1 y 2 (base compartida)
**Formato:** `- [ ] T### [P] [H#] Descripción — ruta`

## Fase 1 — Preparación

- [x] T101 Dependencias `argon2`, `jose`, `cookie-parser` — `apps/backend/package.json`
- [x] T102 Esquema Prisma `usuarios` y `seguridad` (14 tablas), secuencia del código de postulante; migración — `prisma/schema.prisma`
- [x] T103 [P] Semilla: 50 DNI sintéticos, padrón de prueba (`99900045`), consentimiento `2026-10-v1`, rol `APPLICANT` — `prisma/seed/identity/`

## Fase 2 — Base de seguridad (bloquea a las historias)

- [x] T110 [P] Pruebas unitarias: política de contraseñas, Luhn, máquina de estados del usuario — `tests/unit/usuarios/`
- [x] T111 [P] Objetos de valor `DocumentId`, `Email`, `Phone`, `Password`, `ApplicantCode` — `modules/usuarios/domain/`
- [x] T112 [P] `Argon2Hasher`, `JoseTokenService` (HS256, 15 min) — `infrastructure/`
- [x] T113 Sesiones con rotación y detección de reutilización — `modules/seguridad/domain|application/`
- [x] T114 Middlewares `authenticate`, `authorize` — `modules/seguridad/presentation/`. *Nota:* en 002 todos los recursos privados son "del usuario actual" (`/me`), así que la propiedad se garantiza usando siempre `req.principal.userId`; `requireOwner` como middleware genérico se implementará en 003, donde aparecen recursos con ID (inscripciones).

## Fase 3 — Historia 1: crear cuenta con DNI (P1) 🎯

- [x] T120 [P] [H1] Prueba de integración: registro concurrente del mismo DNI → 1 cuenta — `tests/integration/register.test.ts`
- [x] T121 [H1] `MockIdentityProvider` (etiquetado, tiempo de espera simulado para `99900046`) — `modules/usuarios/infrastructure/`
- [x] T122 [H1] `LookupIdentity`: límites IP/documento, padrón, token de identidad 10 min — `application/`
- [x] T123 [H1] `RegisterApplicant`: transacción usuario + postulante + código + consentimiento + código de correo + auditoría + outbox
- [x] T124 [H1] `GET /legal/consent/current`, `POST /auth/identity/lookup`, `POST /auth/register`
- [x] T125 [H1] Registro en 2 pasos — `features/public/auth/register/`

## Fase 4 — Historia 2: verificar correo (P1)

- [x] T130 [H2] `VerifyEmail` (5 intentos, 15 min) y `ResendCode` (60 s, 5/h); `POST /auth/email/verify|resend`
- [x] T131 [H2] Pantalla de verificación con reenvío — `features/public/auth/verify-email/`

## Fase 5 — Historia 3: iniciar y cerrar sesión (P1)

- [x] T140 [P] [H3] Prueba: 5 fallos → bloqueo 15 min; reutilización de refresh → familia revocada
- [x] T141 [H3] `Login` (DNI o correo; mensaje único), `Refresh` (inactividad 30 min), `Logout`, `LogoutAll`
- [x] T142 [H3] `POST /auth/login|refresh|logout|logout-all` con cookie `__Host-sia_rt` (o `sia_rt` en http local)
- [x] T143 [H3] `AuthService` con token en memoria, interceptor 401 → refresh, guard, temporizador de inactividad — `core/auth/`
- [x] T144 [H3] Pantalla de ingreso y panel del postulante — `features/public/auth/login/`, `features/postulante/`

## Fase 6 — Historia 4: recuperar contraseña (P1)

- [x] T150 [H4] `RequestPasswordReset` (respuesta idéntica) y `ResetPassword` (revoca sesiones); endpoints
- [x] T151 [H4] Pantallas de recuperar y restablecer

## Fase 7 — Historia 5: perfil (P2)

- [x] T160 [H5] `GetProfile`, `UpdateProfile` (solo contacto; 422 para identidad; cambio de correo verificado); `GET/PATCH /me`
- [x] T161 [H5] Pantalla de perfil con código de postulante y "cerrar todas las sesiones"

## Fase 8 — Historia 6: actividad (P3)

- [x] T170 [H6] `GET /me/activity` desde `audit_events` con textos amigables
- [x] T171 [H6] Pantalla de actividad

## Fase final

- [x] T180 [P] Prueba de seguridad: endpoints privados sin token → 401; telemetría sin DNI/correo
- [ ] T181 Ejecutar `design.md` completo
- [ ] T182 Pila CDK de 001 + 002 y primer despliegue `demo` (**requiere confirmación de costos**)

## Tareas agregadas (27 y 28/10/2026)

- [x] T183 Consulta de DNI con apiperu.dev (RF-02.02) y comprobación `npm run apiperu:check`
- [x] T184 Distinguir «no encontrado» de «servicio no disponible» en el formulario
- [x] T185 Scripts de estado y restablecimiento de cuentas del personal
- [x] T186 Ingreso del postulante en tarjeta dividida (skill interface-design)
- [x] T187 «Mi cuenta» como resumen y refresco tras pagar (`updated`)
