# Culqi/Yape sandbox: 2026-11-25

Se validó el flujo real contra el ambiente de integración de Culqi y la API local conectada a Amazon RDS PostgreSQL.

| Paso | Resultado |
|---|---|
| Validación de llaves con `npm run culqi:check -w @sia/backend` | Llaves `pk_test_*` y `sk_test_*` aceptadas |
| Creación de token Yape | `ype_test_*` creado con el celular oficial de prueba `900 000 001` y OTP de seis dígitos |
| Cargo desde `POST /api/v1/payments/charge` | HTTP 200, `AUTORIZADO` |
| Estado de la orden | `PAGADA` |
| Mensaje del proveedor | `Su compra ha sido exitosa` |

Se utilizó únicamente una inscripción ficticia (`9990****`) y credenciales sandbox; no hubo un cobro real ni se registraron llaves o tokens completos en la evidencia.

Resultado: **CUMPLE** (T353, AC08).
