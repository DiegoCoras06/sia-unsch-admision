# ADR-024: Culqi como única pasarela de pagos, con tarjeta y Yape

**Estado:** Aceptado
**Fecha:** 11/11/2026
**Reemplaza:** [ADR-016](ADR-016-pasarela-izipay.md) (Izipay como pasarela de tarjeta) y la parte de [ADR-019](ADR-019-yape-con-culqi.md) que mantenía dos pasarelas
**Modifica:** [ADR-007](ADR-007-puertos-adaptadores-integraciones.md) (adaptador real de `PaymentGateway`) y la spec [005](../../specs/005-pagos/requirements.md)
**Impulsores:** decisión del equipo del 11/11/2026; RF-05.03 a RF-05.06, RF-05.09, RF-05.11, RF-14.05

## Contexto

El pago con tarjeta usaba Izipay «mi cuenta web» y Yape usaba Culqi (ADR-019). El 10/11/2026 Izipay cerró la tienda de pruebas (`PSP_553 The shop has been closed`) y el formulario de tarjeta dejó de abrirse. Culqi, en cambio, funcionaba, y su formulario (Culqi Checkout) acepta tarjetas de débito y crédito además de Yape.

Mantener dos pasarelas obligaba a dos integraciones, dos tipos de confirmación (firma HMAC de Izipay y cargo de Culqi) y dos reportes en Tesorería.

## Decisión

**Culqi es la única pasarela de pagos.** El formulario de Culqi Checkout ofrece tarjeta (Visa, Mastercard, American Express y Diners Club) y Yape (hasta S/ 2000 por pago).

| Paso | Qué ocurre |
|---|---|
| 1. Abrir el pago | `POST /payments/session` abre un intento y devuelve la llave pública y el monto en céntimos. Nunca la llave secreta. |
| 2. Pagar | El navegador abre Culqi Checkout. La tarjeta o el código de Yape van directo a Culqi, que devuelve un token (`tkn_…` o `ype_…`). |
| 3. Cobrar | `POST /payments/charge` envía el token. El servidor crea el cargo en Culqi con su llave secreta. |
| 4. Confirmar | La respuesta del cargo, servidor a servidor, confirma el pago. Se comparan monto y moneda con la orden, y un intento se cobra una sola vez. |

- Un solo puerto `PaymentGateway` con dos adaptadores: `CulqiGateway` (real) y `MockPaymentGateway` (simulada, para desarrollo y pruebas).
- `PAYMENTS_PROVIDER` toma `culqi` o `mock`. Las llaves (`CULQI_PUBLIC_KEY`, `CULQI_SECRET_KEY`) viven solo en el servidor.
- Tesorería concilia con el reporte de Culqi, del banco o de Tesorería.

## Consecuencias

**Positivas**
- Un solo proveedor, un solo flujo y un solo reporte de conciliación.
- La confirmación no depende del navegador ni de una notificación pública (IPN): el cargo lo crea el servidor y su respuesta es el resultado.
- El pago funciona en local sin URL pública.

**Negativas o riesgos aceptados**
- Dependencia de un solo proveedor. El puerto `PaymentGateway` permite agregar otro adaptador si hiciera falta.
- Si Culqi no responde al cobrar (error 5xx o tiempo agotado), el intento queda en proceso y Tesorería lo verifica en la conciliación.

## Cómo verificamos que se cumple
- `tests/integration/pago-culqi.test.ts`: tarjeta y Yape aprobados y rechazados, monto alterado, token ajeno y doble cobro.
- `tests/integration/payments.test.ts`: flujo completo con la pasarela simulada (orden pagada, inscripción Apta, correo y pago duplicado).
- `tests/unit/pagos/culqi.test.ts`: lectura de la respuesta del cargo y formato de los tokens.
