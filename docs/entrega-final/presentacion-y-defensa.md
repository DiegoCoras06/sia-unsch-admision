# Presentación y defensa técnica

## Distribución sugerida — 15 minutos

|      Tiempo | Diapositiva    | Mensaje principal                                                 |
| ----------: | -------------- | ----------------------------------------------------------------- |
|   0:00–1:00 | Problema       | Trazabilidad, autoservicio e integridad durante picos.            |
|   1:00–2:00 | Solución       | Portal, inscripción, pago, examen, resultados y panel.            |
|   2:00–3:30 | Requerimientos | Diez SDD y atributos medibles.                                    |
|   3:30–5:00 | Arquitectura   | Monolito modular + Clean Architecture; por qué no microservicios. |
|   5:00–6:00 | Datos          | Esquemas, restricciones, transacciones, outbox e índices.         |
|   6:00–7:00 | Escalabilidad  | lazy loading, caché, pool y CDN.                                  |
|   7:00–8:00 | Confiabilidad  | circuit breaker, DLQ, health checks e idempotencia.               |
|   8:00–9:30 | Pruebas        | 308 Jest, E2E, Postman, axe, Lighthouse y cobertura.              |
|  9:30–10:30 | k6             | 2000 VU, p95 589 ms y 0 % errores.                                |
| 10:30–13:30 | Demo           | inscripción → consulta → panel → Swagger → Actions.               |
| 13:30–14:30 | Despliegue     | AWS, DNS/CDN y evidencia final.                                   |
| 14:30–15:00 | Cierre         | decisiones justificadas y resultados medibles.                    |

## Guion de demostración

1. Mostrar portada y navegación responsive.
2. Registrar un DNI sintético: autocompletado, foto, programa y tasa.
3. Mostrar el código y consultar “Mi inscripción”.
4. Ingresar al panel y enseñar resumen, pagos, expedientes y auditoría.
5. Abrir `/api/docs` y ejecutar un endpoint público.
6. Abrir GitHub Actions: pruebas, cobertura y evidencia E2E.
7. Mostrar reportes de k6 y concurrencia de PostgreSQL.
8. Tras desplegar, abrir la URL HTTPS y `/api/v1/health/ready`.

Preparar una inscripción y un administrador. Nunca mostrar `.env`, contraseñas, TOTP, tokens, DNI real ni la conexión
de RDS.

## Plan alternativo si falla Internet

- ejecutar localmente con PostgreSQL embebido;
- conservar capturas de AWS, GitHub Actions y Swagger;
- llevar el informe y resultados en PDF;
- tener un video corto del flujo principal.

## Preguntas probables y respuestas

### ¿Por qué monolito modular y no microservicios?

El equipo y dominio no justifican la complejidad operacional de microservicios. El monolito permite transacciones y
despliegue simple; los límites automáticos permiten separar módulos en el futuro si la carga lo exige.

### ¿Dónde está Clean Architecture?

Dentro de cada módulo. Dominio y aplicación no dependen de Express, Prisma ni AWS. Los servicios externos implementan
puertos en infraestructura y las rutas son adaptadores de entrada.

### ¿Cómo evitan una doble inscripción?

El caso de uso valida la regla y PostgreSQL mantiene una restricción única. Una prueba lanza ocho solicitudes simultáneas
y demuestra una creación y siete conflictos HTTP 409.

### ¿Cómo evitan un pago doble?

Con claves de idempotencia, transacciones únicas y estados persistidos. Un segundo cobro efectivo queda marcado como
duplicado para devolución y genera un evento auditable.

### ¿Qué solucionó la caché?

Antes, con 500 usuarios aparecía 25 % de errores. Después de cachear catálogo y contenido, k6 alcanzó 2000 usuarios con
p95 de 589 ms y 0 % de errores.

### ¿La caché puede mostrar datos personales de otro usuario?

No. Solo se cachean rutas públicas. Inscripciones, pagos, sesiones y panel envían `Cache-Control: no-store`.

### ¿Qué ocurre si falla un proveedor?

El circuit breaker deja de insistir temporalmente. Los eventos asíncronos se reintentan y terminan en DLQ tras cinco
fallos para revisión y reintento manual.

### ¿Qué significan liveness y readiness?

Liveness indica que el proceso responde. Readiness comprueba que puede atender tráfico, incluida la base.

### ¿Por qué k6 local no demuestra capacidad productiva?

Demuestra el comportamiento del software, pero comparte recursos con el generador. La medición final debe ejecutarse en
AWS, cerca de RDS, observando CPU, conexiones, IOPS y latencia.

### ¿Qué contiene GitHub sobre la base de datos?

Esquema Prisma, migraciones y semillas sintéticas. No contiene datos personales, dump de RDS ni credenciales.

### ¿Cómo funciona CI/CD?

CI compila contratos, Lambda y Angular, verifica arquitectura y tipos, corre Jest y E2E. CD se habilita con OIDC de
GitHub después de aprobar CI, sin claves AWS permanentes.

## Lista de ensayo

- cada integrante explica una decisión y una evidencia;
- la demo dura menos de cuatro minutos;
- se memorizan 308, 91,01 %, 2000 VU, 589 ms y 0 %;
- se diferencia claramente qué está desplegado y qué no;
- se responde desde evidencia, sin afirmar resultados no medidos.
