# Tareas: Pagos en línea con Izipay (iteración 1)

> **Actualización (11/11/2026, [ADR-024](../../docs/adr/ADR-024-pasarela-culqi-tarjeta-y-yape.md)):** la pasarela es **Culqi**, con tarjeta y Yape en el mismo formulario. Lo que este documento describe sobre Izipay (formulario Krypton, firma HMAC, IPN y consulta al proveedor) quedó reemplazado: el navegador obtiene un token en Culqi Checkout, `POST /payments/charge` lo envía y el servidor crea el cargo con su llave secreta. El contrato vigente está en `contracts/openapi.yaml`.

> **SDD (Spec-Driven Development) · artefacto 3 de 3: tareas** (pasos de implementación verificables).
> Anterior: [requirements.md](requirements.md) · [design.md](design.md).

**Entrada:** [design.md](design.md), [design.md](design.md), [contracts/openapi.yaml](./contracts/openapi.yaml), ADR-016
**Formato:** `- [ ] T### [P] [H#] Descripción — ruta`

## Fase 1 — Base

- [x] T301 Esquema `pagos`: órdenes, intentos y bitácora de notificaciones; migración — `prisma/schema.prisma`
- [x] T302 [P] Variables `PAYMENTS_PROVIDER` e `IZIPAY_*` validadas (Izipay exige código de comercio, clave de API y clave hash) — `shared/config/env.ts`
- [x] T303 [P] Firma HMAC-SHA256 en base64 y comparación en tiempo constante; pruebas de firma válida, alterada y con otra clave — `pagos/infrastructure/signature.ts`

## Fase 2 — Historia 1: pagar en línea (P1)

- [x] T310 [P] [H1] Pruebas de integración: iniciar, aprobar, rechazar, firma inválida, monto alterado, notificación ×10, pago duplicado, orden pagada — `tests/integration/payments.test.ts`
- [x] T311 [H1] Puerto `PaymentGateway`; adaptadores `IzipayPaymentGateway` (token de sesión, consulta) y `MockPaymentGateway` — `pagos/infrastructure/`
- [x] T312 [H1] `PaymentService`: iniciar intento, confirmar idempotente, vencer intentos, evento `PagoConfirmado` — `pagos/application/`
- [x] T313 [H1] Rutas `POST /payments/session`, `/payments/confirm`, `/payments/izipay/notify`, `GET /payments/status`, `/payments/mock/complete` — `pagos/presentation/`
- [x] T314 [H1] M03: contexto de pago por DNI + código y paso a `APTA` al recibir `PagoConfirmado`; correo — `inscripciones/`
- [x] T315 [H1] Botón «Pagar en línea» con el formulario de Izipay (pop-up) o el simulado; resultado y constancia — `features/pago/`

## Fase 3 — Historia 2: historial (P2)

- [x] T320 [H2] Historial de intentos y constancia de pago en «Imprimir documentos» — `features/inscripcion/my-inscription.ts`

## Fase final

- [x] T330 E2E por la interfaz con la pasarela simulada — `scripts/e2e-pago.mjs`
- [x] T331 Pago de prueba con tarjeta en el sandbox de Izipay micuentaweb: aprobado el 01/11/2026 (pedido 2700005801, VISA 497010…0055), confirmado por consulta `Order/Get` (`confirmedVia = CONSULTA`), inscripción Apta y correos por SES — `scripts/e2e-pago-micuentaweb.mjs`
- [x] T354 Sin IPN, la aprobación del navegador se ratifica con la pasarela servidor a servidor antes de confirmar; si no se ratifica, el intento sigue «En proceso» (prueba `payments-server-check.test.ts`)
- [ ] T355 Prueba de la IPN de micuentaweb con `PUBLIC_API_URL` HTTPS (al desplegar en AWS, Paso 11)
- [x] T332 Conciliación con Tesorería (RF-05.11) y devoluciones (RF-05.12) — Paso 10, ver abajo

## Paso 10 — Conciliación y anulaciones

- [x] T340 Esquema: corrida de conciliación con sus partidas y anulación/devolución con resolución
- [x] T341 [H4] Importar el reporte del proveedor o de Tesorería (CSV) y cruzarlo: conciliado, diferencia de monto o estado, solo en el proveedor, solo en el sistema
- [x] T342 [H4] Resolver cada diferencia con justificación (auditado)
- [x] T343 [H5] Solicitud de anulación o devolución solo por error de cobro (RN-08), con resolución y aprobación de otra persona
- [x] T344 Panel de Tesorería: conciliación y anulaciones — `features/admin/pages/reconciliation.ts`

## Tareas agregadas (27 y 28/10/2026)

- [x] T345 Adaptador Izipay micuentaweb (REST V4 + Krypton) y comprobación `npm run micuentaweb:check`
- [x] T346 IPN de micuentaweb verificada con la contraseña REST
- [x] T347 Migración: `payment_attempts.provider` a VARCHAR(20)
- [x] T348 Ventana de pago al estilo del checkout de Izipay (diálogo con pedido, pestaña Tarjeta, campos Krypton y botón «Pagar S/ …»)
- [x] T349 ADR-019 y FR-013: Yape con Culqi
- [x] T350 Puerto `YapeGateway` y adaptador `CulqiYapeGateway` con pruebas unitarias
- [x] T351 Casos de uso `startYape` y `chargeYape`, rutas `/payments/yape/session` y `/payments/yape/charge`, prueba de integración
- [x] T352 Pestaña Yape en la ventana de pago (Culqi Checkout solo Yape)
- [ ] T353 Pago de prueba en Culqi con el celular 900 000 001 (requiere `CULQI_PUBLIC_KEY` y `CULQI_SECRET_KEY`)
