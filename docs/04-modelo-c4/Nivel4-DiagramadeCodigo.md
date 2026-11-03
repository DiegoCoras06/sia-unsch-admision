# Nivel 4 · Diagrama de Código

> **Proyecto:** Sistema Integral de Gestión del Proceso de Admisión – UNSCH
> **Módulos detallados:** Inscripción (M03) y Pagos (M05)
> **Modelo:** C4 · Nivel 4 de 4 · **Notación:** UML · **Versión:** 2.0 (02/11/2026), refleja el código implementado

## 1. Objetivo

Mostrar las clases reales de los módulos Inscripción y Pagos y cómo colaboran para **registrar una inscripción y confirmar su pago**. La versión 1.0 de este documento describía un diseño objetivo con una clase por caso de uso y repositorios (`RegistrarInscripcionUseCase`, `InscripcionRepository`, `PaymentPort`); puede consultarse en el historial de Git. La sección 3 resume las diferencias.

| Capa | En el código |
|---|---|
| Presentación | `presentation/routes.ts`: rutas REST con validación Zod |
| Aplicación | `InscriptionService`, `PaymentService` |
| Dominio | `inscription-rules.ts`, `payment-rules.ts`, puertos en `domain/ports.ts` |
| Infraestructura | Adaptadores de pasarela en `pagos/infrastructure/`; bandeja de eventos en `shared/events/outbox.ts` |

## 2. Diagrama de clases

Cada módulo agrupa sus casos de uso en un servicio (capa `application`) y expone su API en `index.ts`. Rutas relativas a `apps/backend/src/modules/`.

```mermaid
classDiagram
    direction TB

    class inscripcionesRoutes {
        <<presentation/routes.ts>>
        POST /inscriptions
        GET /inscriptions/status
    }
    class InscriptionService {
        <<application>>
        +register(input, meta) InscriptionSummary
        +status(dni, codigo, meta) InscriptionSummary
        +paymentContext(dni, codigo) PaymentContext
        +markPaid(codigo, operacion)
    }
    class inscriptionRules {
        <<domain/inscription-rules.ts>>
        +initialStatus(modalidad) InscriptionStatus
        +maskDocument(dni) string
    }
    class ConvocatoriasQueries {
        <<API pública de convocatorias>>
        +getCurrentCall()
        +listQuotaCategories(codigo)
    }
    class IdentityProvider {
        <<interface>>
        +lookupDni(dni) IdentityLookupResult
    }

    class pagosRoutes {
        <<presentation/routes.ts>>
        POST /payments/session
        POST /payments/confirm
        POST /payments/micuentaweb/notify
        POST /payments/yape/charge
    }
    class PaymentService {
        <<application>>
        +startSession(dni, codigo, meta)
        +confirm(mensaje, via, meta)
        +startYape(dni, codigo, meta)
        +chargeYape(dni, codigo, transaccion, token, meta)
        +status(dni, codigo, meta)
    }
    class PaymentGateway {
        <<interface>>
        +createCheckout(request) CheckoutSession
        +verify(mensaje) ProviderResult
        +query(intento) ProviderResult
    }
    class YapeGateway {
        <<interface>>
    }
    class MiCuentaWebGateway
    class IzipayPaymentGateway
    class MockPaymentGateway
    class CulqiYapeGateway
    class Outbox {
        <<shared/events/outbox.ts>>
        +publish(tx, tipo, datos)
        +subscribe(tipo, manejador)
    }

    inscripcionesRoutes --> InscriptionService
    InscriptionService --> inscriptionRules
    InscriptionService --> ConvocatoriasQueries
    InscriptionService --> IdentityProvider
    InscriptionService --> Outbox : publica InscripcionRegistrada

    pagosRoutes --> PaymentService
    PaymentService --> PaymentGateway
    PaymentService --> YapeGateway
    PaymentService ..> InscriptionService : solo paymentContext()
    PaymentService --> Outbox : publica PagoConfirmado
    Outbox ..> InscriptionService : PagoConfirmado → markPaid()

    MiCuentaWebGateway ..|> PaymentGateway
    IzipayPaymentGateway ..|> PaymentGateway
    MockPaymentGateway ..|> PaymentGateway
    CulqiYapeGateway ..|> YapeGateway
```

## 3. Diferencias con el diseño del sprint 1

| Diseño objetivo | Código real |
|---|---|
| Una clase por caso de uso (`RegistrarInscripcionUseCase`, `ProcesarPagoUseCase`) | Un servicio por módulo (`InscriptionService`, `PaymentService`) con un método por caso de uso |
| `InscripcionRepository` / `PostgresInscripcionRepository`, `PagoRepository` | No existen: los servicios usan Prisma directamente (pendiente) |
| `PaymentPort` y `PaymentGatewayAdapter` | `PaymentGateway` con 3 adaptadores, y `YapeGateway` con `CulqiYapeGateway` |
| `ElegibilidadPort` | La elegibilidad se valida en `InscriptionService` con datos de `ConvocatoriasQueries` |
| `ConfirmarPagoInscripcionUseCase` llamado por Pagos | Pagos publica `PagoConfirmado` y Inscripciones reacciona (Observador), sin llamada directa |
| Entidad `Inscripcion` con estados | Tipo `InscriptionStatus` (generado por Prisma) + reglas en `inscription-rules.ts` |

## 4. Secuencia: registrar inscripción y confirmar pago

```mermaid
sequenceDiagram
    actor P as Postulante
    participant W as Angular
    participant RI as inscripcionesRoutes
    participant IS as InscriptionService
    participant DB as PostgreSQL
    participant RP as pagosRoutes
    participant PS as PaymentService
    participant GW as MiCuentaWebGateway
    participant OB as Outbox

    P->>W: Completa la inscripción
    W->>RI: POST /api/v1/inscriptions
    RI->>IS: register(datos validados con Zod)
    IS->>DB: Transacción: inscripción PENDIENTE_PAGO + orden de pago + evento InscripcionRegistrada
    IS-->>W: Código de postulante
    OB-->>P: Correo con el código y la orden de pago

    P->>W: Pagar con tarjeta
    W->>RP: POST /api/v1/payments/session
    RP->>PS: startSession(dni, código)
    PS->>IS: paymentContext(dni, código)
    PS->>GW: createCheckout(monto, pedido)
    GW-->>W: formToken del formulario de Izipay
    W->>GW: El postulante paga en el formulario incrustado
    GW-->>W: Respuesta firmada
    W->>RP: POST /api/v1/payments/confirm
    RP->>PS: confirm(mensaje, SDK)
    PS->>GW: verify(firma HMAC)
    PS->>DB: Transacción: intento y orden PAGADOS + evento PagoConfirmado
    OB->>IS: PagoConfirmado → markPaid()
    IS->>DB: Inscripción APTA
    OB-->>P: Correo «Pago confirmado»
```

Si el navegador se cierra antes de confirmar, el pago se confirma por la notificación IPN (`/payments/micuentaweb/notify`, al tener URL pública) o por la consulta al proveedor (`query`); las tres vías son idempotentes.

## 5. Patrones y principios visibles

| Patrón o principio | Dónde |
|---|---|
| Adaptador | `PaymentGateway` y `YapeGateway` con sus adaptadores |
| Fábrica | `createPaymentGateway` elige micuentaweb, Izipay o la simulada según `PAYMENTS_PROVIDER` |
| Observador | `PagoConfirmado` en la bandeja de eventos; Inscripciones lo escucha |
| Segregación de interfaces | `PaymentService` solo conoce `paymentContext()` de Inscripciones |
| Inversión de dependencias | Cumplida para los servicios externos; pendiente para la base de datos (sin repositorios) |

## 6. Conclusión

El flujo de inscripción y pago respeta las capas de Clean Architecture y desacopla los módulos con eventos. La mejora pendiente es extraer `InscripcionRepository` y `PagoRepository` para que los servicios no dependan de Prisma.
