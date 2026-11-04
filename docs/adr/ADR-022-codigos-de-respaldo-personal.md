# ADR-022: Códigos de respaldo para el segundo factor del personal

**Estado:** Aceptado
**Fecha:** 03/11/2026
**Modifica:** [ADR-018](ADR-018-panel-acceso-personal.md) (se agrega una vía de recuperación al TOTP)
**Impulsores:** AC04 Seguridad, EQ-04, DA03; riesgo detectado: quien pierde el celular depende de que otro administrador esté disponible

## Contexto

El personal entra con contraseña + TOTP. Si pierde el celular, solo otro administrador puede restablecer el segundo factor (`resetMfa`). El último administrador no tiene a quién pedírselo y, durante un proceso de admisión, esperar puede bloquear una operación crítica.

## Decisión

1. Al activar el segundo factor se generan **10 códigos de un solo uso** con formato `XXXXX-XXXXX` (alfabeto sin caracteres confundibles, unos 49 bits). Se muestran **una sola vez** y el ingreso exige confirmar que se guardaron.
2. En la base se guarda solo su **huella HMAC-SHA256** con clave del servidor (`SecretBox.fingerprint`). Sin la clave, una copia de la base no permite probar códigos. No se usa Argon2 porque el código ya tiene entropía alta y es aleatorio.
3. Ingreso: `POST /admin/auth/recovery` acepta un código solo en el paso `MFA`, nunca durante la activación. El gasto es atómico (`updateMany` con `usedAt: null`) y comparte el límite de intentos del TOTP.
4. «Mi seguridad» muestra cuántos códigos quedan y permite regenerarlos con el TOTP actual; los anteriores dejan de valer. El inicio del panel avisa a quien no tiene códigos (cuentas activadas antes de esta decisión).
5. Cada uso, fallo y regeneración queda en auditoría (`staff.login_recovery`, `staff.recovery_failed`, `staff.recovery_regenerated`). `resetMfa` borra los códigos.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Solo el restablecimiento por un administrador (estado anterior) | Sin código nuevo | El último administrador queda fuera | No cubre el riesgo |
| Recuperación por correo | Familiar | El correo no es un factor independiente de la contraseña (ADR-018) | Debilita el segundo factor |
| Guardar los códigos cifrados | Se podrían volver a mostrar | Quien lea la base con la clave los obtiene | Un código solo necesita compararse |

## Consecuencias

**Positivas:**
- El personal recupera el acceso sin depender de nadie, y queda registro.

**Negativas / riesgos aceptados:**
- Quien obtenga la contraseña y un código impreso puede entrar: por eso se pide guardarlos en un lugar seguro y cada uso se audita.
- Nueva tabla `usuarios.staff_recovery_codes`: hay que aplicar la migración en RDS (`npm run rds:migrate`).

**Cómo verificamos que se cumple:**
- `tests/integration/staff-recovery.test.ts`: entrega única, solo huella en la base, un solo uso, formato flexible, rechazo durante la activación, auditoría y regeneración.
