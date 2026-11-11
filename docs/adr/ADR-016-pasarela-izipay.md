# ADR-016: Izipay como pasarela de pagos (sandbox para la demo)

**Estado:** Reemplazada por [ADR-024](ADR-024-pasarela-culqi-tarjeta-y-yape.md) (11/11/2026): Izipay cerró la tienda de pruebas y Culqi pasó a cobrar tarjeta y Yape. Se conserva como registro histórico; su código se eliminó.
**Fecha:** 25/10/2026
**Modifica:** [ADR-007](ADR-007-puertos-adaptadores-integraciones.md) (adaptador real de `PaymentGateway`) y la spec [005](../../specs/005-pagos/requirements.md) (FR-003)
**Impulsores:** decisión del equipo del 25/10/2026: usar Izipay; RF-05.03 a RF-05.06, RF-05.09, RF-05.11, RF-14.05

## Contexto

ADR-007 dejó la pasarela **simulada** para la demo y anotó Izipay o Niubiz como opción real futura. El equipo ya tiene acceso al portal de desarrolladores de Izipay, que ofrece dos ambientes:

| Ambiente | API | Panel de comercio |
|---|---|---|
| Desarrollo (sandbox) | `https://sandbox-api-pw.izipay.pe` | `https://sandbox-panel.izipay.pe` |
| Producción | `https://api-pw.izipay.pe` | `https://panel.izipay.pe` |

Izipay entrega cuatro credenciales en *Panel de comercio → Desarrolladores → Claves*:

| Credencial | Uso | Variable |
|---|---|---|
| Código de comercio | Identifica al comercio en cada operación | `IZIPAY_MERCHANT_CODE` |
| Clave de API del botón de pagos | Solo para generar el token de sesión, en el servidor | `IZIPAY_API_KEY` |
| Clave hash | Calcular y verificar la firma de las notificaciones | `IZIPAY_HASH_KEY` |
| Clave pública (RSA) | Conexión con la API y cifrado de datos sensibles | `IZIPAY_PUBLIC_KEY` |

## Decisión

1. **`IzipayPaymentGateway`** es el adaptador real del puerto `PaymentGateway`; se elige con `PAYMENTS_PROVIDER=izipay`. `MockPaymentGateway` se mantiene para pruebas automáticas y entorno local sin red.
2. **La demo usa el ambiente sandbox** (`IZIPAY_ENV=sandbox`): tarjetas de prueba, sin cobros reales. La página de pago lo indica: «Ambiente de pruebas Izipay — no se realizan cobros reales». Pasar a producción exige convenio de la UNSCH con Izipay y cambiar solo variables.
3. **Flujo:** el servidor crea la orden (monto fijado por M05) → genera el **token de sesión** con la clave de API → el navegador abre el **formulario certificado de Izipay** (los datos de tarjeta nunca pasan por nuestros servidores, SC-004) → Izipay envía la **notificación (IPN)** a `POST /api/v1/payments/izipay/notify` → el servidor **verifica la firma con la clave hash** y, además, consulta la transacción a la API antes de confirmar.
4. **Idempotencia:** cada notificación se guarda por identificador de transacción con restricción única; repetirla no confirma dos veces (FR-005, SC-002). El estado del navegador nunca confirma un pago (FR-004).
5. **Secretos solo en el servidor:** en local, en `apps/backend/.env.rds` (ignorado por git); en AWS, en Secrets Manager / SSM Parameter Store cifrado, leídos por la Lambda (RF-14.05). Nunca en el frontend, el repositorio ni los registros.
6. Los endpoints exactos, campos del token de sesión y algoritmo de firma se fijan en `specs/005-pagos/design.md` contra la documentación de Izipay al planificar la spec 005 (Paso 7).

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Mantener solo la pasarela simulada | Cero dependencias | No demuestra una integración real | El equipo ya tiene acceso a Izipay |
| Niubiz | Muy usada en Perú | Requiere afiliación previa para sandbox | Izipay ya está disponible |
| Mercado Pago | Buena documentación | No es el medio habitual de la universidad | Menor alineación con Tesorería |

## Consecuencias

**Positivas:** demostración de un pago real de punta a punta (sandbox), con webhook firmado y conciliación verificable.

**Negativas / riesgos aceptados:**
- La notificación necesita una URL pública: en local no llega (se usa la consulta de transacción o un túnel); en la demo llega a API Gateway (Paso 6).
- Dependencia de la disponibilidad del sandbox de Izipay → `MockPaymentGateway` como respaldo para la presentación.
- Una credencial se compartió en el chat el 25/10/2026: es de sandbox; se recomienda regenerarla en el panel antes de cualquier uso en producción.

**Cómo verificamos que se cumple:** pruebas de integración con notificaciones firmadas válidas, inválidas y repetidas (10 veces); E2E en sandbox con tarjeta de prueba hasta que la inscripción pasa a Apta.
