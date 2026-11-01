# Diseño — Pagos y conciliación

> **SDD (Spec-Driven Development) · artefacto 2 de 3: diseño** (cómo se construye).
> Anterior: [requirements.md](requirements.md) · Siguiente: [tasks.md](tasks.md). Arquitectura general: [docs/arquitectura.md](../../docs/arquitectura.md) y [ADR](../../docs/adr/README.md).


## 1. Plan técnico

**Spec:** [requirements.md](requirements.md) · **Investigación:** [design.md](design.md) · **Contrato:** [contracts/openapi.yaml](./contracts/openapi.yaml) · **Decisión:** [ADR-016](../../docs/adr/ADR-016-pasarela-izipay.md)

### Alcance de la iteración 1

| Incluido | Requisitos |
|---|---|
| Orden de pago única por inscripción, con el monto fijado en la inscripción | FR-001, FR-002 · RF-05.01, RF-05.02 |
| Pago con el formulario certificado de Izipay (pop-up) iniciado desde la constancia o «Imprimir documentos» | FR-003 · RF-05.03, RF-05.04 |
| Confirmación solo con mensaje firmado (respuesta del SDK o IPN) y verificación de monto, pedido y transacción | FR-004 · RF-05.05, RF-05.06 |
| Idempotencia: cada intento se confirma una vez; un segundo pago autorizado de una orden ya pagada queda marcado `DUPLICADO` | FR-005 · RF-05.09 |
| Registro del intento: id de transacción, número de operación, código de autorización, medio, tarjeta enmascarada, monto, fecha y estado | RF-05.07 |
| Constancia de pago (no es comprobante SUNAT) e historial de intentos consultable con DNI + código | RF-05.08, RF-05.10 |
| Inscripción `PENDIENTE_PAGO` → `APTA` por el evento `PagoConfirmado`; correo de confirmación | SC-001 · RF-11.02 |
| Pasarela simulada (`PAYMENTS_PROVIDER=mock`) para pruebas y uso local sin credenciales | ADR-007 |

**Fuera de esta iteración:** conciliación con archivos de Tesorería (RF-05.11), devoluciones y anulaciones (RF-05.12), pago de otros conceptos.

### Diseño

**Módulo M05 Pagos** (`src/modules/pagos`), esquema `pagos`, Clean Architecture como el resto:

```
domain/        payment-rules.ts (estados, número de pedido, montos) · ports.ts (PaymentGateway)
application/   payment-service.ts (iniciar, confirmar, consultar)
infrastructure/izipay-gateway.ts · mock-gateway.ts · signature.ts
presentation/  routes.ts
index.ts       createPagosModule()
```

**Puerto `PaymentGateway`:** `createSession(intento) → { token, checkout }`, `verify(mensaje) → resultado`, `query(intento) → resultado | null`. La elección del adaptador ocurre solo en `app.ts`.

**Datos (`pagos`):**

| Tabla | Clave | Contenido |
|---|---|---|
| `payment_orders` | `applicant_code` único (una orden por inscripción) | monto, moneda, estado `PENDIENTE` / `PAGADA`, `paid_at` |
| `payment_attempts` | `transaction_id` único, `order_number` único | proveedor, estado `INICIADO` / `AUTORIZADO` / `RECHAZADO` / `VENCIDO` / `DUPLICADO`, datos de la operación, `confirmed_via` (`SDK` / `IPN` / `CONSULTA`) |
| `payment_notifications` | — | bitácora inmutable de cada mensaje recibido: origen, firma válida, código, hash del contenido |

**Comunicación entre módulos:** M05 consulta la inscripción con `InscriptionService.paymentContext(dni, código)` (API pública de M03) y publica `PagoConfirmado` en la outbox, en la misma transacción que marca la orden como pagada. M03 se suscribe y pasa la inscripción a `APTA`.

**Seguridad:**
- Clave de API y clave hash solo en el servidor (variables de entorno; Secrets Manager en AWS).
- Iniciar un pago exige DNI + código de postulante y tiene límite de 10 intentos por hora por IP.
- La confirmación desde el navegador no es de confianza: solo cuenta el `payloadHttp` cuya firma verifica el servidor.
- No se guardan datos de tarjeta, salvo la tarjeta enmascarada que devuelve Izipay.

### Verificación

- Pruebas de integración con la pasarela simulada y con mensajes Izipay firmados: aprobado, rechazado, firma inválida, monto alterado, notificación repetida 10 veces, segundo pago de una orden pagada, orden ya pagada.
- Pruebas unitarias de la firma con el ejemplo publicado por Izipay.
- Prueba en el sandbox de Izipay con tarjeta de prueba (requiere las credenciales en `.env.rds`).

## 2. Decisiones técnicas (investigación)

**Fecha:** 25/10/2026 · **Fuentes:** `developers.izipay.pe` (Web Core SDK, Notificaciones, Credenciales) y su especificación OpenAPI `https://developers.izipay.pe/yaml/api-v1-esp.yaml` (servidor `https://sandbox-api-pw.izipay.pe`).

### R-01 Producto: «nuevo botón de pagos» (Web Core SDK), no el formulario Krypton

Izipay tiene dos productos con APIs distintas. Los ejemplos de GitHub `izipay-pe/*-PaymentForm-*` usan **micuentaweb** (`api.micuentaweb.pe`, usuario/contraseña, `kr-hash`). Las credenciales del equipo son del **nuevo botón de pagos** (`api-pw.izipay.pe`). Se usa ese.

### R-02 Token de sesión

`POST {IZIPAY_API_URL}/security/v1/Token/Generate`

| Parte | Valor |
|---|---|
| Cabecera `transactionId` | Id único del comercio por transacción, 5–40 caracteres; el mismo se envía luego al SDK |
| `requestSource` | `ECOMMERCE` |
| `merchantCode` | Código de comercio |
| `orderNumber` | Número de pedido, 5–15 caracteres |
| `publicKey` | **Clave de API del nuevo botón de pagos** (`IZIPAY_API_KEY`), pese al nombre del campo |
| `amount` | Texto con 2 decimales, p. ej. `"250.00"` |
| Respuesta | `{ code: "00", message: "OK", response: { token } }` · token de un solo uso, vigencia 15 min |

**Decisión:** el token se genera solo en el servidor; la clave de API nunca llega al navegador.

### R-03 Formulario en el navegador

- SDK: `https://sandbox-checkout.izipay.pe/payments/v1/js/index.js` (sandbox) · `https://checkout.izipay.pe/payments/v1/js/index.js` (producción).
- `new Izipay({ config })` con `transactionId`, `action: 'pay'`, `merchantCode`, `order { orderNumber, currency: 'PEN', amount, processType: 'AT', merchantBuyerId, dateTimeTransaction }`, `billing { firstName, lastName, email, phoneNumber, street, city, state, country: 'PE', postalCode, documentType, document }`, `render { typeForm: 'pop-up' }`.
- `checkout.LoadForm({ authorization: token, keyRSA, callbackResponse })`. `keyRSA` es la clave pública RSA del panel (`IZIPAY_PUBLIC_KEY`); es pública por diseño.
- Medios habilitados por el SDK: tarjetas, QR, Yape, Plin, Apple Pay.

**Decisión:** modo *pop-up* (el postulante no sale de la página); los datos de tarjeta se escriben solo dentro del formulario de Izipay (SC-004).

### R-04 Respuesta y firma

La respuesta del SDK y la notificación IPN traen `code`, `message`, `messageUser`, `response { payMethod, order[ { orderNumber, amount, currency, stateMessage, codeAuth, uniqueId, referenceNumber, dateTransaction, timeTransaction } ], card { brand, pan } }`, `payloadHttp`, `signature` y `transactionId`.

**Firma:** `signature = base64( HMAC-SHA256( clave hash, payloadHttp ) )`, en UTF-8. No se valida cuando `code` es `021` o `COMMUNICATION_ERROR` (error de comunicación, sin resultado).

**Decisión:** se confía solo en `payloadHttp` verificado: se parsea ese texto (no el objeto `response` que lo acompaña), y se comprueban `transactionId`, `orderNumber`, monto y moneda contra el intento guardado. Aprobado = `code "00"` y `stateMessage "Autorizado"`.

### R-05 Notificación IPN

`POST` JSON a la URL indicada en `urlIPN` con cabecera `transactionId` y el mismo cuerpo firmado que R-04. Izipay no documenta reintentos ni la respuesta esperada → se responde `200` siempre que el mensaje se haya procesado o ya estuviera procesado, y `400` si la firma no es válida.

**Decisión:** el IPN solo llega a una URL pública (API Gateway en el Paso 6). En local se confirma con la respuesta firmada del SDK; ambas rutas pasan por el mismo caso de uso idempotente.

### R-06 Consulta de transacción

`POST /orderinfo/v1/Transaction/Search` con `Authorization: Bearer <token>`, cabecera `transactionId` y cuerpo `{ merchantCode, numberOrden, language: 'ESP' }`. Devuelve `order[]` con `stateMessage`.

**Decisión:** se usa como respaldo para resolver intentos que quedaron «iniciados» (ventana cerrada sin respuesta, o IPN que no llega a un servidor local). La respuesta no viene firmada, pero es una llamada servidor a servidor por HTTPS autenticada con nuestro token, así que se acepta si el pedido y el monto coinciden. Si falla, no bloquea: el intento vence a los 20 minutos.

### R-07 Pendiente de confirmar en sandbox

- Si `keyRSA` acepta la clave del panel tal cual (PEM o una sola línea).
- Formato exacto de `dateTimeTransaction` (se envía en microsegundos Unix, como en los ejemplos).
- Si `urlIPN` va dentro de `config` o solo se configura en el panel.

## 3. Contratos de la API

- [contracts/openapi.yaml](contracts/openapi.yaml)

## 4. Actualizaciones de diseño (27 y 28/10/2026)

- **Pasarela activa: Izipay micuentaweb** (API REST V4 + formulario incrustado Krypton): adaptador `MiCuentaWebGateway` (`apps/backend/src/modules/pagos/infrastructure/micuentaweb-gateway.ts`). El servidor crea el pago (`Charge/CreatePayment`, autenticación con ID de tienda y contraseña REST) y entrega el `formToken`; la web dibuja el formulario con la clave pública.
- **Verificación:** `kr-answer` firmado con HMAC-SHA-256 (clave HMAC para la respuesta del navegador; contraseña REST para la IPN en `POST /payments/micuentaweb/notify`). Se comprueba que el pedido y el monto coincidan.
- Configuración: `PAYMENTS_PROVIDER=micuentaweb` y `MICUENTAWEB_*` (solo claves de test). Comprobación sin cobro: `npm run micuentaweb:check`.
- El adaptador del «Botón de pagos web» (`IzipayPaymentGateway`) y la pasarela simulada se conservan.
- Migración `20261028171500_proveedor_pago_largo`: `payment_attempts.provider` pasa a `VARCHAR(20)` («micuentaweb» tiene 11 caracteres); los datos devueltos por la pasarela se recortan al tamaño de cada columna.

## 5. Pulido de interfaz (29/10/2026)

- **Ventana de pago al estilo del checkout de Izipay** (`features/pago/online-payment.ts`): «Pagar S/ …» abre un `<dialog>` modal (Esc y × lo cierran, el foco queda dentro) con encabezado de canasta y **número de pedido**, la pestaña **Tarjeta** marcada (Visa, Mastercard, American Express y Diners Club), el aviso «Recuerda activar tus compras por internet», comercio y concepto, los campos de **micuentaweb (Krypton V4)** acomodados como en el ejemplo (número de tarjeta; caducidad y CVV en una fila, con textos de ejemplo `kr-placeholder-*`), el botón verde azulado «Pagar S/ …» y el pie «Powered by izipay». Solo se muestra la pestaña que la cuenta tiene activa (no hay pestañas de Yape, Plin o QR que no funcionen). Krypton ya dibuja el formulario al recibir el formToken; `renderElements` solo se llama si no existe. Con la ventana abierta, el asistente se oculta.
- **Web Core («nuevo botón de pagos»)**: el adaptador `izipay` sigue disponible y muestra la ventana original de Izipay con Tarjeta, Plin, QR y Yape, pero requiere en `.env.rds` el código de comercio, la clave API, la clave hash y la clave pública RSA de Web Core (hoy vacíos; `npm run izipay:check` lo verifica).

## 6. Yape con Culqi (29/10/2026, [ADR-019](../../docs/adr/ADR-019-yape-con-culqi.md))

**Flujo**

```
Postulante            Web (Angular)                 API SIA                    Culqi
    │ «Pagar» → pestaña Yape │                           │                          │
    │──────────────────────▶ POST /payments/yape/session ▶ intento INICIADO        │
    │                        ◀ llave pública, céntimos, pedido                      │
    │ celular + código ─────▶ Culqi Checkout ───────────────────────────────────▶ token ype_…
    │                        POST /payments/yape/charge {transactionId, token} ─▶ POST /v2/charges
    │                        │                           ◀──────────── cargo (aprobado o rechazado)
    │                        ◀ resultado; si aprobó: orden PAGADA y evento PagoConfirmado
```

- **Puerto** `YapeGateway.charge({ amountCents, email, token, description, metadata })` → `ProviderResult`. Adaptador `CulqiYapeGateway` (fetch a `https://api.culqi.com/v2/charges`, `Authorization: Bearer sk_…`, 15 s de espera). Éxito: `outcome.type = venta_exitosa`; número de operación = `reference_code` (o el id del cargo); autorización = `authorization_code`; medio `YAPE`. Rechazo (HTTP 402/4xx con `object: error`): se guarda `user_message` y el código.
- **Servicio** `PaymentService.startYape` abre el intento con `provider = culqi` (mismas reglas que la tarjeta: inscripción no anulada, expediente autorizado, orden no pagada, máximo 20 intentos) y rechaza montos mayores a S/ 2000. `chargeYape` acepta un solo cargo por intento (`INICIADO` → resultado), comprueba monto y moneda, y reutiliza `apply` (idempotencia, duplicados, auditoría y `PagoConfirmado`). La conciliación automática no consulta a Izipay por los intentos de Culqi.
- **Configuración**: `CULQI_PUBLIC_KEY` y `CULQI_SECRET_KEY` en `.env.rds`; el ambiente sale del prefijo de la llave (`pk_test` → pruebas). Sin llaves, `status` responde `yape: null` y la pestaña no se muestra. Comprobación: `npm run culqi:check`.
- **Interfaz**: en la ventana de pago, pestañas **Tarjeta** y **Yape**; Yape explica los dos datos que se piden (celular y código de aprobación de la app, válido 2 minutos) y abre Culqi Checkout solo con el método Yape.
- **Pruebas**: adaptador con respuestas de Culqi simuladas (aprobado, rechazado, error de red) y flujo de integración con un `YapeGateway` falso: sesión, cargo aprobado → orden pagada y evento, segundo cargo del mismo intento rechazado, monto distinto rechazado.
