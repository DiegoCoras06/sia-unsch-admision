# ADR-015: Inscripción pública sin cuenta; seguimiento con DNI + código de postulante

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Reemplaza parcialmente:** la Historia 1 de la spec 002 ("crear cuenta para inscribirse") y MEJ-01
**Impulsores:** decisión del equipo del 25/10/2026 ("un postulante no necesita crear su cuenta para inscribirse"); paridad con el flujo oficial de `admision.unsch.edu.pe/inscripcion`

## Contexto

La spec 002 obligaba al postulante a crear una cuenta (correo verificado y contraseña) antes de inscribirse. El portal oficial no lo exige: el postulante llena un formulario público, el DNI autocompleta sus nombres, imprime su orden de pago y luego consulta sus documentos con **DNI + código de postulante**. El equipo decide mantener ese flujo, más simple para postulantes que entran una sola vez desde el celular.

## Decisión

1. **Inscripción pública** en `/inscripcion`, sin cuenta: secciones *Información básica*, *Información académica* e *Información de postulante* (como el formulario oficial), más las mejoras propias: tasa calculada en vivo, vacantes del programa elegido, validación de la foto y declaración jurada.
2. **El DNI autocompleta** apellidos y nombres mediante el puerto `IdentityProvider` (ADR-007), sin pedir dígito verificador (igual que el portal oficial) y con límite de consultas por IP. Adaptadores: simulado (DNI sintéticos) y HTTP configurable con token propio para un proveedor de consulta RENIEC.
3. **Seguimiento sin cuenta:** `/mi-inscripcion` con DNI + código de postulante (8 dígitos con Luhn) muestra el estado, la orden de pago y los siguientes pasos. El código se envía también por correo.
4. **Las cuentas con contraseña (módulos M02/M13 de la spec 002) se conservan para el personal de la Dirección de Admisión** (spec 008). Las pantallas públicas de registro e ingreso de postulantes se retiran del menú.
5. Los datos de la inscripción pertenecen al nuevo módulo **M03 Inscripción** (esquema `inscripciones`), que usa por su API pública: M01 (etapas, tasas, vacantes), M13 (padrón de inhabilitados) y el puerto de identidad.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Mantener la cuenta obligatoria (spec 002) | Panel personal, sesión, recuperación | Fricción; difiere del flujo oficial | Decisión del equipo |
| Cuenta opcional además del formulario | Lo mejor de ambos | Dos caminos que mantener y explicar | Se puede agregar después |

## Consecuencias

**Positivas:** inscripción en un solo formulario; menos datos personales guardados (sin contraseñas de postulantes).

**Negativas / riesgos aceptados:**
- Consultar un DNI devuelve nombres sin autenticación (igual que el portal oficial) → límite de 20 consultas por hora por IP y registro de auditoría.
- Quien conozca DNI + código puede ver el estado de una inscripción → el código no es secuencial visible al público (Luhn sobre secuencia interna) y la consulta no muestra datos sensibles completos (documento y correo enmascarados).

**Cómo verificamos que se cumple:** pruebas de integración de `POST /inscriptions` (etapa cerrada, DNI duplicado, inhabilitado, tasa calculada) y E2E por la interfaz del formulario completo.

## Enmienda 25/10/2026 — Cuenta opcional del postulante

**Motivo:** el catálogo oficial de 14 módulos ([trazabilidad](../trazabilidad-requisitos.md)) exige que el sistema *permita* crear cuenta, iniciar sesión, recuperar contraseña y verificar el correo (RF-02.01, RF-02.04 a RF-02.07), guardar borradores (RF-03.06), ver el historial de pagos (RF-05.10) y que el chatbot pida autenticación antes de mostrar datos personales (RF-10.04, RF-10.14).

**Decisión:** se adopta la alternativa «cuenta opcional» descartada arriba, sin cambiar lo esencial de este ADR:

1. **Inscribirse sigue sin requerir cuenta.** El formulario público y la consulta con DNI + código se mantienen.
2. **«Mi cuenta» es opcional:** el postulante puede crearla antes o después de inscribirse con DNI, correo verificado (código de 6 dígitos) y contraseña. Usa la API de la spec 002, que ya existe (`/auth/*`, `/me`).
3. **Vinculación:** al crear la cuenta, o desde ella, se vinculan las inscripciones del mismo DNI que coincidan con el correo verificado, o con DNI + código de postulante.
4. **Qué agrega la cuenta:** borrador guardado en el servidor (sin cuenta, el borrador queda solo en el dispositivo), historial de pagos y notificaciones, y acceso del chatbot a los datos propios.
5. **Chatbot:** con cuenta, usa la sesión; sin cuenta, solo responde información pública o pide DNI + código y un código de un solo uso enviado al correo.

**Consecuencia aceptada:** hay dos caminos que mantener. Se explica en una sola frase en el formulario: «No necesitas cuenta; si la creas, podrás guardar tu avance y ver tu historial».
