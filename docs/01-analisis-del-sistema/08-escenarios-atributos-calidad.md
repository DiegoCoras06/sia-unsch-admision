# 08. Escenarios de Atributos de Calidad

## Sistema Integral de Gestión del Proceso de Admisión – UNSCH

Los escenarios de calidad permiten establecer y verificar cómo debe responder el sistema ante situaciones específicas, considerando los atributos de calidad y las decisiones arquitectónicas del proyecto.

## EQ-01. Rendimiento: inscripción de postulantes

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Rendimiento |
| **Fuente** | Postulante |
| **Estímulo** | Múltiples postulantes realizan registros, inscripciones y consultas simultáneamente. |
| **Condición** | El sistema se encuentra en periodo de inscripción y funciona con datos representativos. |
| **Respuesta esperada** | El sistema procesa las solicitudes correctamente, utilizando PostgreSQL con índices y consultas acotadas; en producción, AWS Lambda. Redis queda previsto solo si la prueba de carga lo exige (ver 07, ADR-005). |
| **Medida** | **Propuesta para validar:** el 95 % de las solicitudes habituales responde en 3 segundos o menos, con menos del 1 % de errores técnicos durante una prueba con 200 usuarios simultáneos, excluyendo demoras externas. |
| **Verificación** | Ejecutar pruebas de carga y registrar tiempos de respuesta, errores y usuarios concurrentes. |
| **Estado** | 🟡 Sin evidencia. No existe todavía una prueba de carga (k6 o similar) con 200 usuarios simultáneos; se ejecutará sobre el entorno desplegado (Paso 11). |

## EQ-02. Disponibilidad: continuidad del proceso de admisión

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Disponibilidad |
| **Fuente** | Postulante |
| **Estímulo** | El postulante intenta acceder al sistema durante la inscripción o publicación de resultados. |
| **Condición** | La plataforma está desplegada en AWS y cuenta con monitoreo activo. |
| **Respuesta esperada** | El sistema mantiene disponibles las operaciones críticas y comunica de manera controlada las interrupciones. |
| **Medida** | **Propuesta para validar:** disponibilidad del 99.9 % durante los periodos críticos establecidos, y alerta al equipo dentro de los 5 minutos posteriores a una falla crítica de la API, PostgreSQL o una integración externa. |
| **Verificación** | Monitorear `/api/v1/health` cada minuto, revisar las métricas de OpenTelemetry en Grafana Cloud (ADR-013 del repositorio), calcular los periodos de disponibilidad e interrupción y simular fallas controladas para medir el tiempo de alerta. |
| **Estado** | ⏳ Depende del despliegue en AWS (Paso 11). En local, la API informa su estado en `/api/v1/health` y pasa a «degradado» si la base de datos no responde; los registros estructurados con `requestId` (pino) y OpenTelemetry ya están en el código (`shared/telemetry`) y se activan al definir `OTEL_EXPORTER_OTLP_ENDPOINT`. |

## EQ-03. Escalabilidad: incremento de postulantes

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Escalabilidad |
| **Fuente** | Incremento de solicitudes de postulantes |
| **Estímulo** | Aumenta significativamente la cantidad de postulantes que utilizan el sistema simultáneamente. |
| **Condición** | Se ejecutan pruebas de carga sobre AWS Lambda con PostgreSQL configurado (Redis solo si la prueba lo exige). |
| **Respuesta esperada** | AWS Lambda escala las ejecuciones del backend y el sistema controla las conexiones a la base de datos. |
| **Medida** | **Propuesta para validar:** soportar 200 usuarios simultáneos, manteniendo el 95 % de las respuestas habituales en 3 segundos o menos y menos del 1 % de errores técnicos. |
| **Verificación** | Incrementar progresivamente la carga y analizar tiempos de respuesta, errores y consumo de recursos. |
| **Estado** | ⏳ Depende del despliegue en AWS (Paso 11) y de la prueba de carga de EQ-01. |

## EQ-04. Seguridad: protección de información

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Seguridad |
| **Fuente** | Usuario sin autorización |
| **Estímulo** | Un usuario intenta acceder a información personal, pagos, expedientes o resultados sin los permisos correspondientes, o un postulante consulta su situación mediante el chatbot. |
| **Condición** | El sistema utiliza HTTPS, autenticación, control de acceso basado en roles y el chatbot con OpenRouter API. |
| **Respuesta esperada** | El sistema rechaza las solicitudes no autorizadas, protege la información sensible y entrega al modelo de IA únicamente los datos necesarios para responder. |
| **Medida** | Rechazar el 100 % de los intentos no autorizados incluidos en las pruebas de seguridad, sin exposición de información sensible, y el 100 % de los casos de acceso indebido mediante el chatbot debe impedir la exposición de datos de otros postulantes y credenciales. |
| **Verificación** | Ejecutar pruebas de autenticación, autorización y acceso a funcionalidades protegidas; revisar las solicitudes enviadas a OpenRouter. |
| **Estado** | ✅ Cumplido. 8 roles con permisos en `seguridad/domain/permissions.ts`; cada ruta del panel declara su permiso, el servidor responde 403 y lo registra en auditoría. Personal con contraseña + TOTP y bloqueo temporal (ADR-018). El asistente solo consulta datos del postulante con un pase firmado (DNI + código) y recibe datos mínimos; DNI enmascarado en pantallas; consentimiento en la inscripción y anonimización por retención (ADR-017). Pruebas: `tests/integration/admin.test.ts`, `assistant.test.ts`. |

## EQ-05. Mantenibilidad: modificación de funcionalidades

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Mantenibilidad |
| **Fuente** | Equipo de desarrollo |
| **Estímulo** | Se requiere modificar una funcionalidad de inscripción, pagos, exámenes o resultados. |
| **Condición** | El sistema está organizado como Monolito Modular por Capas aplicando Clean Architecture. |
| **Respuesta esperada** | Los cambios se realizan en el módulo correspondiente, respetando las responsabilidades y contratos internos de los 12 módulos, sin afectar innecesariamente otras funcionalidades. |
| **Medida** | Las pruebas del módulo modificado y las pruebas de regresión relacionadas deben aprobarse, y el 100 % de las dependencias verificadas debe respetar las reglas arquitectónicas establecidas. |
| **Verificación** | Revisar el código, ejecutar pruebas automatizadas y analizar las dependencias entre módulos. |
| **Estado** | 🟡 Parcial. Más de 250 casos de prueba (Vitest) aprobados; los módulos se comunican por su `index.ts` y por eventos; ningún controlador accede a la base de datos y ningún módulo importa capas internas de otro. Desviación: 29 de 30 servicios de aplicación usan Prisma sin un repositorio intermedio (ver 03, patrones). Falta una herramienta que verifique las reglas de dependencia de forma automática. |

## EQ-06. Integridad: consistencia de inscripciones y pagos

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Integridad |
| **Fuente** | Postulante y pasarela de pagos |
| **Estímulo** | Se generan solicitudes duplicadas de inscripción o confirmaciones repetidas de pago. |
| **Condición** | El sistema procesa operaciones concurrentes utilizando PostgreSQL. |
| **Respuesta esperada** | El sistema aplica transacciones, restricciones e idempotencia para evitar registros duplicados. |
| **Medida** | No deben generarse inscripciones duplicadas ni confirmaciones inconsistentes en los casos de prueba definidos. |
| **Verificación** | Ejecutar pruebas de concurrencia, duplicación de solicitudes y consistencia de datos. |
| **Estado** | ✅ Cumplido. Restricciones únicas en PostgreSQL, transacciones en pagos, confirmación idempotente del cargo y consulta del estado del pago a Culqi y pagos duplicados marcados para devolución. Pruebas: `payments.test.ts`, `yape.test.ts`, `inscriptions.test.ts`. |

## EQ-07. Usabilidad: inscripción de postulantes

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Usabilidad |
| **Fuente** | Postulante |
| **Estímulo** | El postulante realiza su inscripción desde una computadora o dispositivo móvil, incluso mediante teclado, lector de pantalla u otra tecnología de asistencia. |
| **Condición** | El sistema presenta formularios y procesos de inscripción habilitados en el navegador. |
| **Respuesta esperada** | La interfaz permite completar los datos, adjuntar documentos y realizar pagos de manera comprensible y accesible. |
| **Medida** | **Propuesta para validar:** al menos el 90 % de los participantes completa las tareas principales sin asistencia, y las páginas cumplen los criterios aplicables de WCAG 2.2 nivel AA (sin fallas graves ni críticas en la revisión automática). |
| **Verificación** | Realizar pruebas de usabilidad con usuarios representativos y registrar los resultados; ejecutar pruebas de accesibilidad automáticas (axe) y manuales con lector de pantalla. |
| **Estado** | 🟡 Parcial. Interfaz revisada con las skills de diseño (impeccable, interface-design): pasos de inscripción, resumen de errores, vista de celular, foco visible de dos tonos, bordes de campo con contraste 3:1, etiquetas visibles, errores con `aria-describedby` y objetivos táctiles de 44 px. Falta la prueba con participantes reales para medir el 90 %, la verificación automática (axe) y la prueba con lector de pantalla. |

## EQ-08. Interoperabilidad: integración con servicios externos

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Interoperabilidad |
| **Fuente** | RENIEC, pasarela de pagos y OpenRouter API |
| **Estímulo** | El sistema necesita validar identidades, procesar pagos o responder consultas del chatbot. |
| **Condición** | Las integraciones están configuradas mediante interfaces y adaptadores de infraestructura. |
| **Respuesta esperada** | El sistema intercambia información mediante conexiones HTTPS y gestiona las respuestas de los proveedores. |
| **Medida** | El 100 % de los casos de integración definidos debe producir la respuesta esperada o un error controlado. |
| **Verificación** | Ejecutar pruebas de integración utilizando servicios autorizados o entornos de prueba. |
| **Estado** | ✅ Cumplido en sandbox. RENIEC (apiperu), Culqi (tarjeta y Yape), Amazon SES, Amazon S3 y OpenRouter conectados; cada uno tiene su script de verificación en `apps/backend/scripts/`. Las claves de producción dependen de los contratos de la UNSCH. |

## EQ-09. Confiabilidad: fallas en servicios externos

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Confiabilidad |
| **Fuente** | Pasarela de pagos o servicio externo |
| **Estímulo** | Un servicio externo presenta una interrupción durante una operación, o se produce una pérdida accidental de información en la base de datos. |
| **Condición** | El sistema está procesando una inscripción, pago o validación de identidad, y utiliza Amazon RDS PostgreSQL con respaldos configurados. |
| **Respuesta esperada** | El sistema conserva el estado de la operación, informa el problema y ejecuta reintentos controlados cuando corresponda; ante una pérdida de datos, el equipo técnico restaura la información con los procedimientos establecidos. |
| **Medida** | No deben perderse operaciones confirmadas ni generarse transacciones duplicadas en los escenarios de falla probados. **Propuesta para validar:** recuperación del servicio en un máximo de 4 horas (RTO) y pérdida de datos no superior a 15 minutos (RPO). |
| **Verificación** | Simular interrupciones, respuestas tardías y errores de servicios externos; ejecutar un simulacro de restauración y medir los tiempos y puntos de recuperación. |
| **Estado** | 🟡 Parcial. Fallas externas cumplidas: bandeja de eventos (outbox) en PostgreSQL con reintentos, correos con hasta 3 intentos sin duplicar y consulta del estado del pago a la pasarela si no llega respuesta. La restauración depende del despliegue: la política de respaldo y el procedimiento están en «Configuración» del panel y las copias automáticas de RDS se activan en el Paso 11. |

## EQ-10. Auditabilidad: seguimiento de operaciones

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Auditabilidad |
| **Fuente** | Personal administrativo |
| **Estímulo** | Un usuario modifica una inscripción, expediente, pago o resultado. |
| **Condición** | El usuario está autenticado y realiza una operación crítica. |
| **Respuesta esperada** | El sistema registra la operación, el usuario responsable, la fecha y los cambios realizados. |
| **Medida** | El 100 % de las operaciones críticas definidas debe generar registros de auditoría. |
| **Verificación** | Ejecutar operaciones críticas y comprobar los registros generados. |
| **Estado** | ✅ Cumplido. Registro de auditoría con responsable, fecha, IP y cambios para inscripciones, pagos, expedientes, calificaciones, resultados y accesos denegados; consulta en «Auditoría» del panel. |

## Resumen de Escenarios

| Código | Atributo de calidad | Qué se busca comprobar |
|---|---|---|
| EQ-01 | Rendimiento | Que las inscripciones y consultas respondan dentro del tiempo establecido. |
| EQ-02 | Disponibilidad | Que las operaciones críticas permanezcan disponibles y las fallas se detecten a tiempo. |
| EQ-03 | Escalabilidad | Que el sistema soporte el incremento de postulantes concurrentes. |
| EQ-04 | Seguridad | Que nadie acceda a información sin autorización y que el chatbot no exponga datos personales. |
| EQ-05 | Mantenibilidad | Que los cambios en un módulo no afecten innecesariamente a los demás. |
| EQ-06 | Integridad | Que las inscripciones y pagos mantengan información consistente. |
| EQ-07 | Usabilidad | Que los postulantes completen sus operaciones fácilmente, también con tecnologías de asistencia. |
| EQ-08 | Interoperabilidad | Que el sistema se comunique correctamente con servicios externos. |
| EQ-09 | Confiabilidad | Que las fallas no generen pérdidas o duplicaciones y que la información pueda restaurarse. |
| EQ-10 | Auditabilidad | Que las operaciones críticas puedan rastrearse. |

## Estado de verificación (11/11/2026)

| Estado | Escenarios |
|---|---|
| ✅ Cumplido con evidencia | EQ-04, EQ-06, EQ-08, EQ-10 |
| 🟡 Parcial | EQ-05, EQ-07, EQ-09 |
| ⏳ Depende del despliegue en AWS (Paso 11) | EQ-02, EQ-03 |
| Sin evidencia todavía | EQ-01 (prueba de carga) |

**Nota:** Las medidas propuestas deben aprobarse y validarse mediante pruebas. Los escenarios están alineados con los 10 atributos de calidad AC01–AC10 y las decisiones arquitectónicas del sistema. Privacidad, recuperabilidad, accesibilidad, observabilidad y modularidad se integraron en seguridad, confiabilidad, usabilidad, disponibilidad y mantenibilidad (ver 04).
