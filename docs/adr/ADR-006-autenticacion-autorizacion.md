# ADR-006: Autenticación con JWT corto + refresh en cookie HttpOnly; autorización RBAC + propietario; MFA para personal

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** RNF-03, RF-13.02, RF-13.06, RF-13.08, specs 002 y 008

## Contexto

Hay dos poblaciones: miles de postulantes (cuentas temporales, desde celular) y pocas decenas de usuarios internos con acceso a datos sensibles. El backend corre en Lambda (sin estado en memoria) y la SPA se sirve desde el mismo dominio vía CloudFront.

## Decisión

**Autenticación**
- Contraseñas con **Argon2id**.
- **Token de acceso JWT** de 15 minutos, enviado en el encabezado `Authorization`, guardado solo en memoria del navegador.
- **Refresh token opaco** de 7 días (postulantes) u 8 horas (personal) en cookie `HttpOnly; Secure; SameSite=Strict`, almacenado como hash en la base y **rotado** en cada uso (si se reutiliza uno viejo, se revoca toda la familia de sesiones).
- **MFA TOTP** (aplicación de autenticación) obligatorio para todo usuario interno.
- Límite de intentos y bloqueo temporal (spec 002).

**Autorización**
- **RBAC**: roles → permisos (`expedientes.dictaminar`, `pagos.conciliar`, `resultados.publicar`…).
- **Control de propietario** en cada caso de uso: un postulante solo accede a recursos cuyo `applicantId` es el suyo; si no lo es, responde **404**, no 403, para no revelar existencia.
- La verificación ocurre en la capa de aplicación, no solo en la ruta.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Amazon Cognito | Servicio administrado, MFA incluido | Personalización del flujo con DNI/RENIEC más compleja; acoplamiento a AWS en local | Se reevalúa para producción real |
| Sesiones en servidor | Revocación inmediata | Requiere almacén compartido (Redis) en Lambda | Costo y complejidad |
| JWT de larga duración en `localStorage` | Simple | Vulnerable a XSS y no revocable | Inseguro |

## Consecuencias

**Positivas:**
- Sin estado en Lambda; revocación efectiva vía refresh tokens.
- Protección contra IDOR verificada por pruebas.

**Negativas / riesgos aceptados:**
- Un token de acceso robado vale hasta 15 minutos.

**Cómo verificamos que se cumple:**
- Pruebas de API por cada endpoint privado: sin token → 401; otro rol → 403; otro postulante → 404.
