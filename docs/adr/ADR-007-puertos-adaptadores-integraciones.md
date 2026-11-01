# ADR-007: Integraciones externas mediante puertos y adaptadores, con simulaciones etiquetadas

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** Constitución II.3, RNF-08, ADR-002

## Contexto

RENIEC, la pasarela de pagos, los archivos bancarios, el correo, el SMS y el modelo de IA dependen de convenios o credenciales que el proyecto académico no tiene. Aun así, el flujo completo debe demostrarse.

## Decisión

Cada integración es un **puerto** (interfaz en `domain/ports`) con un adaptador **simulado** y un adaptador **real**, elegidos por variable de entorno:

| Puerto | Simulado (demo) | Real (futuro) | Variable |
|---|---|---|---|
| `IdentityProvider` | `MockIdentityProvider`: 50 DNI sintéticos en un archivo semilla | Proveedor autorizado de RENIEC | `IDENTITY_PROVIDER=mock` |
| `PaymentGateway` | `MockPaymentGateway`: página de pago propia marcada "SIMULADA", que envía un webhook firmado con HMAC | `IzipayPaymentGateway` en sandbox ([ADR-016](ADR-016-pasarela-izipay.md)) | `PAYMENTS_PROVIDER=mock\|izipay` |
| `BankStatementParser` | Formato CSV propio documentado | Formato de cada banco | — |
| `EmailSender` | `FileEmailSender` en local (archivos `.html` en `apps/backend/.dev-mail/`); SES en `demo` | SES producción | `EMAIL_PROVIDER` |
| `SmsSender` | Registro en consola | Proveedor autorizado | `SMS_PROVIDER=none` |
| `LanguageModel` | OpenRouter (real, con límite de gasto) o `FaqOnlyModel` | OpenRouter | `LLM_PROVIDER` |

Reglas:
- Toda pantalla que dependa de una simulación lo muestra visiblemente ("Verificación simulada", "Pasarela simulada").
- Todo adaptador real aplica **tiempo de espera de 10 s, hasta 3 reintentos con espera exponencial** y registra fallas (RNF-08).
- Los adaptadores simulados se usan también en las pruebas automáticas.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Llamar a las APIs directamente desde los casos de uso | Menos código | Imposible probar o cambiar de proveedor | Incumple ADR-002 |
| Omitir las integraciones | Simple | El flujo no se puede demostrar de punta a punta | Inaceptable para el MVP |

## Consecuencias

**Positivas:**
- Demostración completa sin convenios.
- Cambiar a la integración real es configuración más un adaptador nuevo.

**Negativas / riesgos aceptados:**
- La simulación puede no reflejar todos los casos del proveedor real → se revisará contra su documentación cuando se contrate.

**Cómo verificamos que se cumple:**
- Prueba E2E del flujo inscripción → pago simulado → ficha.
- Prueba de que un webhook con firma inválida es rechazado.
