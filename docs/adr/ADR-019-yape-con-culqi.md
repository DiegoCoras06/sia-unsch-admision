# ADR-019: Yape con Culqi junto al checkout de Izipay

**Estado:** Ampliada por [ADR-024](ADR-024-pasarela-culqi-tarjeta-y-yape.md) (11/11/2026): Culqi cobra ahora también con tarjeta y es la única pasarela; lo de Izipay quedó sin efecto.
**Fecha:** 29/10/2026
**Modifica:** [ADR-016](ADR-016-pasarela-izipay.md) (se suma una segunda pasarela solo para Yape) y la spec [005](../../specs/005-pagos/requirements.md) (FR-013)
**Impulsores:** pedido del cliente del 29/10/2026: ofrecer Yape al lado del pago con tarjeta; RF-05.03, RF-05.04, RF-05.06

## Contexto

El pago con tarjeta usa Izipay «mi cuenta web» (formulario Krypton). Ese producto no ofrece Yape; Yape en Izipay está en el «nuevo botón de pagos» (Web Core), para el que el equipo no tiene credenciales. El cliente decidió usar **Culqi** solo para Yape.

En Culqi, Yape funciona en dos pasos ([documentación](https://docs.culqi.com/es/documentacion/pagos-online/cargo-unico/tokens-yape)):

1. En el navegador, **Culqi Checkout** (`https://js.culqi.com/checkout-js`, llave pública `pk_test_…`) pide el celular de Yape y el **código de aprobación** de 6 dígitos que da la app (vale 2 minutos) y devuelve un token `ype_test_…`.
2. El servidor del comercio crea el **cargo** con ese token: `POST https://api.culqi.com/v2/charges` con la llave secreta `sk_test_…` (monto en céntimos, `currency_code: PEN`, correo, `source_id`).

Límites: solo soles y máximo S/ 2000 por pago con Yape. En pruebas, Culqi acepta el celular 900 000 001 con cualquier código de 6 dígitos.

| Credencial | Dónde se obtiene | Variable | ¿Secreta? |
|---|---|---|---|
| Llave pública | CulqiPanel → Desarrollo → API Keys | `CULQI_PUBLIC_KEY` | No (va al navegador) |
| Llave secreta | CulqiPanel → Desarrollo → API Keys | `CULQI_SECRET_KEY` | Sí (solo en `.env.rds`) |

## Decisión

- Un **segundo puerto** `YapeGateway` (además de `PaymentGateway`) con un solo caso de uso: cobrar un token de Yape. Adaptador real `CulqiYapeGateway`; sin llaves, Yape no se ofrece.
- El intento de pago con Yape usa la misma orden, número de pedido, auditoría, idempotencia y evento `PagoConfirmado` que la tarjeta; solo cambia `provider = 'culqi'` y `payMethod = 'YAPE'`.
- **La confirmación es del servidor, no del navegador** (FR-004): el navegador solo entrega el token; el resultado lo da la respuesta de Culqi al cargo, servidor a servidor, y se comprueba que el monto y la moneda coincidan con la orden.
- Rutas: `POST /payments/yape/session` (abre el intento y entrega llave pública, monto en céntimos y número de pedido) y `POST /payments/yape/charge` (token → cargo).
- En la ventana de pago, una pestaña **Yape** al lado de **Tarjeta**; Yape solo aparece si el servidor tiene las llaves de Culqi.

## Consecuencias

- Dos proveedores en Tesorería: los reportes de conciliación separan Izipay (tarjeta) y Culqi (Yape) por `provider`.
- Si la respuesta del cargo se pierde (corte de red), el intento queda «En proceso» y vence; Tesorería lo concilia con el reporte de Culqi.
- Para producción hacen falta las llaves `live` y la afiliación de Yape en Culqi.
