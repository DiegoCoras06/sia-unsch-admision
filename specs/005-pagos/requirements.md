# Requisitos — Pagos y conciliación

> **SDD (Spec-Driven Development) · artefacto 1 de 3: requisitos** (qué y por qué).
> Siguiente: [design.md](design.md) (cómo) · [tasks.md](tasks.md) (tareas). Principios: [constitución](../../.specify/memory/constitution.md).

**Rama:** `005-pagos`
**Creada:** 25/10/2026
**Estado:** En revisión
**Módulos de arquitectura:** M05 Pagos
**Entrada:** "Hoy se paga en banco y se espera 24 horas. Quiero pago en línea con confirmación inmediata, sin perder la opción de pagar en Caja Santa María Magdalena, Banco de la Nación o Interbank, y que Tesorería pueda cuadrar todo."

## Escenarios de usuario y pruebas

### Historia 1 — Pagar en línea y ver la confirmación al instante (Prioridad: P1)

Como postulante con orden de pago, quiero pagar con tarjeta o billetera digital desde la plataforma y ver mi pago confirmado de inmediato (MEJ-04).

**Por qué esta prioridad:** desbloquea la ficha sin esperar 24 horas.

**Prueba independiente:** pagar una orden en el ambiente de pruebas de Culqi con una tarjeta o un Yape de prueba y verificar que la inscripción pasa a Apta.

**Escenarios de aceptación:**

1. **Dado** una orden pendiente de S/ 250.00, **cuando** elijo "Pagar en línea", **entonces** soy dirigido a una página de pago segura del proveedor con el monto y concepto; la plataforma nunca pide ni guarda los datos de mi tarjeta.
2. **Dado** que el proveedor confirma el pago, **cuando** regreso a la plataforma, **entonces** veo "Pago confirmado", el número de operación y mi inscripción como **Apta**.
3. **Dado** que el pago es rechazado, **cuando** regreso, **entonces** veo "Pago rechazado" con el motivo genérico y puedo reintentar con la misma orden.
4. **Dado** que cierro la ventana antes de terminar, **cuando** vuelvo a mi panel, **entonces** el estado refleja lo que el proveedor confirmó al servidor, no lo que mostró el navegador.
5. **Dado** el entorno académico, **cuando** se muestra la página de pago, **entonces** se identifica claramente como **"Ambiente de pruebas de Culqi: no se realizan cobros reales"**.

---

### Historia 2 — Pagar en una entidad financiera (Prioridad: P1)

Como postulante sin tarjeta, quiero pagar en ventanilla o agente con mi código de postulante.

**Escenarios de aceptación:**

1. **Dado** una orden pendiente, **cuando** elijo "Pagar en banco", **entonces** veo las entidades autorizadas (Caja Santa María Magdalena, Banco de la Nación, Interbank), mi código de postulante, el monto exacto y la fecha límite, y puedo descargar la orden en PDF.
2. **Dado** que Tesorería carga el archivo de recaudación del banco, **cuando** el sistema encuentra mi código y monto exactos, **entonces** mi pago pasa a **Confirmado** y soy notificado.
3. **Dado** que el monto pagado en banco no coincide con la orden, **cuando** se procesa el archivo, **entonces** el pago queda **En revisión** para Tesorería y no se confirma automáticamente.

---

### Historia 3 — Descargar mi constancia de pago e historial (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** un pago confirmado, **cuando** descargo la constancia, **entonces** veo número de operación, fecha, monto, medio, concepto y la nota "Este documento no es un comprobante de pago tributario". *(RF-05.08)*
2. **Dado** mi panel, **cuando** abro "Mis pagos", **entonces** veo todas mis órdenes y transacciones con su estado. *(RF-05.10)*

---

### Historia 4 — Conciliar pagos como Tesorería (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** el panel de Tesorería, **cuando** filtro por fecha y medio, **entonces** veo total recaudado, cantidad de pagos confirmados, pendientes, rechazados y en revisión. *(RF-05.11, RF-12.03)*
2. **Dado** un pago en revisión, **cuando** lo resuelvo (confirmar o rechazar) con justificación, **entonces** queda registrado en auditoría con mi usuario.
3. **Dado** un rango de fechas, **cuando** exporto, **entonces** obtengo un Excel con todas las transacciones para cuadrar con el reporte del proveedor.

---

### Historia 5 — Registrar anulaciones por error (Prioridad: P3)

**Escenarios de aceptación:**

1. **Dado** un cobro duplicado comprobado, **cuando** Tesorería registra la anulación con resolución, **entonces** la transacción queda marcada **Anulada** con referencia al documento; el sistema no devuelve dinero por sí mismo (RN-08 solo admite devolución por error de cobro). *(RF-05.12)*

### Casos límite

- El proveedor envía la misma notificación de confirmación dos veces → se procesa una sola vez.
- Llega una notificación con firma inválida o monto distinto → se rechaza y se registra como incidente de seguridad.
- El postulante paga en línea y también en banco → el segundo pago queda **Duplicado** para que Tesorería lo trate.
- La orden vence → no se aceptan pagos en línea; los pagos en banco tardíos quedan en revisión.
- El monto de la orden cambia (paso a extemporáneo) → se genera una orden nueva y la anterior queda **Reemplazada**.

## Requisitos

### Requisitos funcionales

- **FR-001**: El sistema DEBE calcular el monto con la regla de tasas vigente y fijarlo en la orden. *(RF-05.01)*
- **FR-002**: El sistema DEBE generar una orden única por inscripción y concepto, con código de postulante, monto y vencimiento. *(RF-05.02)*
- **FR-003**: El sistema DEBE integrarse con una pasarela de pagos mediante el formulario certificado del proveedor; la pasarela es **Culqi**, con tarjeta y Yape en el mismo formulario ([ADR-024](../../docs/adr/ADR-024-pasarela-culqi-tarjeta-y-yape.md)). El navegador solo obtiene un token y el servidor crea el cargo con su llave secreta.
- **FR-004**: El sistema DEBE confirmar pagos únicamente por notificación firmada del proveedor o por conciliación de Tesorería, nunca por el navegador. *(RF-05.05, RF-05.06)*
- **FR-005**: El sistema DEBE procesar cada notificación del proveedor una sola vez. *(RF-05.09, RNF-09)*
- **FR-006**: El sistema DEBE registrar número de operación, monto, moneda, fecha, medio y estado. *(RF-05.07)*
- **FR-007**: El sistema DEBE permitir importar archivos de recaudación de las entidades financieras y emparejarlos por código y monto. *(RF-05.11)*
- **FR-008**: El sistema DEBE emitir constancia de pago no tributaria. *(RF-05.08)*
- **FR-009**: El sistema DEBE mostrar al postulante su historial de pagos. *(RF-05.10)*
- **FR-010**: El sistema DEBE permitir a Tesorería resolver pagos en revisión y registrar anulaciones con justificación auditada. *(RF-05.12, RNF-10)*
- **FR-011**: El sistema DEBE manejar los estados Pendiente, Confirmado, Rechazado, Expirado, En revisión, Duplicado, Anulado y Reemplazado. *(RF-05.09)*
- **FR-012**: El sistema DEBE admitir otros conceptos: constancia de ingreso (S/ 15.00), corrección de datos (S/ 15.00), reinscripción (S/ 180.00), recargos. *(Tabla N.° 3)*
- **FR-013**: El sistema DEBE ofrecer el pago con **Yape** al lado del pago con tarjeta, mediante **Culqi** ([ADR-019](../../docs/adr/ADR-019-yape-con-culqi.md)): el navegador obtiene un token con el celular y el código de aprobación de Yape, y el servidor crea el cargo con la llave secreta y lo confirma con la respuesta de Culqi; máximo S/ 2000 por pago. *(RF-05.03, RF-05.04, RF-05.06)*

### Entidades clave

- **Orden de pago**: inscripción, concepto, monto, moneda (PEN), vencimiento, estado.
- **Transacción**: orden, proveedor o entidad, número de operación, monto, fecha, medio, estado.
- **Notificación del proveedor**: identificador del evento, firma, contenido recibido, resultado del procesamiento.
- **Lote de conciliación**: archivo importado, entidad, fecha, registros emparejados y no emparejados.

## Criterios de éxito

- **SC-001**: La inscripción pasa a Apta en menos de 1 minuto tras un pago en línea confirmado.
- **SC-002**: 0 pagos confirmados dos veces en pruebas que reenvían la misma notificación 10 veces.
- **SC-003**: La conciliación de un archivo de 1 000 registros termina en menos de 1 minuto.
- **SC-004**: Ningún dato de tarjeta pasa por los servidores de la plataforma.

## Supuestos

- La pasarela es Culqi (ADR-024, 11/11/2026; reemplaza a Izipay, ADR-016): ambiente de pruebas para la demo, producción solo con convenio de la UNSCH. Los formatos de archivo de cada banco se definirán con Tesorería.

## Fuera de alcance

- Emisión de comprobantes electrónicos SUNAT.
- Devoluciones automáticas.

## Estado de los requisitos (28/10/2026)

11 de 13 requisitos del catálogo citados en esta funcionalidad están implementados y probados. Fuente: [matriz de trazabilidad](../../docs/trazabilidad-requisitos.md).

| RF | Estado | Detalle |
|---|---|---|
| RF-05.01 | ✅ | Simulador y cálculo de tasa en el servidor |
| RF-05.02 | ✅ | Orden única por inscripción, con número de pedido por intento |
| RF-05.03 | ✅ | Culqi integrado (ADR-024): tarjeta y Yape en el mismo formulario; pasarela simulada para desarrollo y pruebas |
| RF-05.04 | ✅ | Formulario de Culqi Checkout; la tarjeta nunca pasa por el servidor, que solo recibe un token |
| RF-05.05 | ✅ | El servidor cobra el token en Culqi y su respuesta, servidor a servidor, confirma el pago; no depende del navegador |
| RF-05.06 | ✅ | Confirmación solo con firma HMAC verificada; la inscripción pasa a Apta por evento |
| RF-05.07 | ✅ | Intento con transacción, operación, autorización, medio, monto, fecha y estado |
| RF-05.08 | ✅ | Constancia de pago en «Imprimir documentos» (no es comprobante SUNAT) |
| RF-05.09 | ✅ | Idempotente (IPN ×10), intentos vencidos y pagos duplicados marcados |
| RF-05.10 | ✅ | Historial de intentos con DNI + código |
| RF-05.11 | ✅ | Conciliación con el reporte de Culqi, banco o Tesorería: conciliado, diferencias de monto o estado, solo en reporte o en sistema; resolución auditada |
| RF-05.12 | ✅ | Anulación o devolución solo por error de cobro (RN-08), con resolución y aprobación de otra persona; el dinero lo mueve Tesorería |
| RF-12.03 | ✅ | Recaudación, órdenes pendientes, intentos rechazados, vencidos y duplicados |

✅ implementado y probado · 🟡 parcial (lo que falta depende de un servicio externo o está anotado) · ⏳ pendiente
