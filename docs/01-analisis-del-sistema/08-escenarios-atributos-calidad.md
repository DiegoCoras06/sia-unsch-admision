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
| **Respuesta esperada** | El sistema procesa las solicitudes correctamente, utilizando AWS Lambda, PostgreSQL y Redis. |
| **Medida** | **Propuesta para validar:** el 95 % de las solicitudes habituales responde en 3 segundos o menos, con menos del 1 % de errores técnicos durante una prueba con 200 usuarios simultáneos, excluyendo demoras externas. |
| **Verificación** | Ejecutar pruebas de carga y registrar tiempos de respuesta, errores y usuarios concurrentes. |
| **Estado** | Pendiente de validar la cantidad de usuarios y las condiciones de prueba. |

## EQ-02. Disponibilidad: continuidad del proceso de admisión

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Disponibilidad |
| **Fuente** | Postulante |
| **Estímulo** | El postulante intenta acceder al sistema durante la inscripción o publicación de resultados. |
| **Condición** | La plataforma está desplegada en AWS y cuenta con monitoreo activo. |
| **Respuesta esperada** | El sistema mantiene disponibles las operaciones críticas y comunica de manera controlada las interrupciones. |
| **Medida** | **Propuesta para validar:** disponibilidad del 99.9 % durante los periodos críticos establecidos. |
| **Verificación** | Revisar las métricas de Amazon CloudWatch y calcular los periodos de disponibilidad e interrupción. |
| **Estado** | Pendiente de aprobar la meta de disponibilidad y definir las operaciones críticas. |

## EQ-03. Escalabilidad: incremento de postulantes

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Escalabilidad |
| **Fuente** | Incremento de solicitudes de postulantes |
| **Estímulo** | Aumenta significativamente la cantidad de postulantes que utilizan el sistema simultáneamente. |
| **Condición** | Se ejecutan pruebas de carga sobre AWS Lambda con PostgreSQL y Redis configurados. |
| **Respuesta esperada** | AWS Lambda escala las ejecuciones del backend y el sistema controla las conexiones a la base de datos. |
| **Medida** | **Propuesta para validar:** soportar 200 usuarios simultáneos, manteniendo el 95 % de las respuestas habituales en 3 segundos o menos y menos del 1 % de errores técnicos. |
| **Verificación** | Incrementar progresivamente la carga y analizar tiempos de respuesta, errores y consumo de recursos. |
| **Estado** | Pendiente de confirmar la concurrencia objetivo y los recursos disponibles. |

## EQ-04. Seguridad: protección de información

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Seguridad |
| **Fuente** | Usuario sin autorización |
| **Estímulo** | Un usuario intenta acceder a información personal, pagos, expedientes o resultados sin los permisos correspondientes. |
| **Condición** | El sistema utiliza HTTPS, autenticación y control de acceso basado en roles. |
| **Respuesta esperada** | El sistema rechaza las solicitudes no autorizadas y protege la información sensible. |
| **Medida** | Rechazar el 100 % de los intentos no autorizados incluidos en las pruebas de seguridad, sin exposición de información sensible. |
| **Verificación** | Ejecutar pruebas de autenticación, autorización y acceso a funcionalidades protegidas. |
| **Estado** | Pendiente de definir y validar la matriz de roles y permisos. |

## EQ-05. Mantenibilidad: modificación de funcionalidades

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Mantenibilidad |
| **Fuente** | Equipo de desarrollo |
| **Estímulo** | Se requiere modificar una funcionalidad de inscripción, pagos, exámenes o resultados. |
| **Condición** | El sistema está organizado como Monolito Modular por Capas aplicando Clean Architecture. |
| **Respuesta esperada** | Los cambios se realizan en el módulo correspondiente sin afectar innecesariamente otras funcionalidades. |
| **Medida** | Las pruebas del módulo modificado y las pruebas de regresión relacionadas deben aprobarse, respetando las reglas de dependencia. |
| **Verificación** | Revisar el código, ejecutar pruebas automatizadas y verificar las dependencias entre módulos. |
| **Estado** | Pendiente de establecer las reglas de dependencia y cobertura de pruebas. |

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
| **Estado** | Pendiente de validar las reglas de negocio y restricciones de base de datos. |

## EQ-07. Usabilidad: inscripción de postulantes

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Usabilidad |
| **Fuente** | Postulante |
| **Estímulo** | El postulante realiza su inscripción desde una computadora o dispositivo móvil. |
| **Condición** | El sistema presenta formularios y procesos de inscripción habilitados. |
| **Respuesta esperada** | La interfaz permite completar los datos, adjuntar documentos y realizar pagos de manera comprensible. |
| **Medida** | **Propuesta para validar:** al menos el 90 % de los participantes completa las tareas principales sin asistencia. |
| **Verificación** | Realizar pruebas de usabilidad con usuarios representativos y registrar los resultados. |
| **Estado** | Pendiente de definir los participantes y las tareas de evaluación. |

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
| **Estado** | Pendiente de disponer de credenciales y accesos a los servicios externos. |

## EQ-09. Confiabilidad: fallas en servicios externos

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Confiabilidad |
| **Fuente** | Pasarela de pagos o servicio externo |
| **Estímulo** | Un servicio externo presenta una interrupción durante una operación. |
| **Condición** | El sistema está procesando una inscripción, pago o validación de identidad. |
| **Respuesta esperada** | El sistema conserva el estado de la operación, informa el problema y ejecuta reintentos controlados cuando corresponda. |
| **Medida** | No deben perderse operaciones confirmadas ni generarse transacciones duplicadas en los escenarios de falla probados. |
| **Verificación** | Simular interrupciones, respuestas tardías y errores de servicios externos. |
| **Estado** | Pendiente de definir las políticas de reintentos y recuperación. |

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
| **Estado** | Pendiente de definir las operaciones auditables y la política de conservación. |

## EQ-11. Privacidad: consultas mediante chatbot inteligente

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Privacidad |
| **Fuente** | Postulante |
| **Estímulo** | El postulante consulta mediante el chatbot el estado de su inscripción, pago o expediente. |
| **Condición** | El chatbot utiliza OpenRouter API y el postulante está autenticado. |
| **Respuesta esperada** | El backend verifica los permisos y proporciona al modelo únicamente la información necesaria para responder. |
| **Medida** | El 100 % de los casos de prueba de acceso indebido debe impedir la exposición de datos de otros postulantes y credenciales. |
| **Verificación** | Revisar las solicitudes enviadas a OpenRouter y ejecutar pruebas de privacidad y autorización. |
| **Estado** | Pendiente de establecer las políticas de tratamiento y minimización de datos. |

## EQ-12. Recuperabilidad: restauración de información

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Recuperabilidad |
| **Fuente** | Falla de infraestructura |
| **Estímulo** | Ocurre una interrupción o pérdida accidental de información en la base de datos. |
| **Condición** | El sistema utiliza Amazon RDS PostgreSQL con mecanismos de respaldo configurados. |
| **Respuesta esperada** | El equipo técnico restaura la información mediante los procedimientos de recuperación establecidos. |
| **Medida** | **Propuesta para validar:** recuperación del servicio en un máximo de 4 horas (RTO) y pérdida de datos no superior a 15 minutos (RPO), si la configuración de respaldos lo permite. |
| **Verificación** | Ejecutar simulacros de restauración y medir los tiempos y puntos de recuperación. |
| **Estado** | Pendiente de aprobar los objetivos RTO y RPO y verificar su viabilidad técnica. |

## EQ-13. Accesibilidad: utilización de la plataforma

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Accesibilidad |
| **Fuente** | Postulante |
| **Estímulo** | Un postulante utiliza el sistema mediante teclado, lector de pantalla u otra tecnología de asistencia. |
| **Condición** | La plataforma está disponible mediante navegador web. |
| **Respuesta esperada** | El sistema permite navegar, completar formularios y consultar información mediante interfaces accesibles. |
| **Medida** | Cumplimiento de los criterios aplicables de WCAG 2.2 nivel AA. |
| **Verificación** | Ejecutar pruebas de accesibilidad automáticas y manuales. |
| **Estado** | Pendiente de realizar la evaluación de accesibilidad. |

## EQ-14. Observabilidad: detección de fallas

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Observabilidad |
| **Fuente** | Infraestructura AWS |
| **Estímulo** | Se produce un error en AWS Lambda, PostgreSQL o una integración externa. |
| **Condición** | El sistema cuenta con registros, métricas y alarmas configuradas en Amazon CloudWatch. |
| **Respuesta esperada** | La infraestructura registra el incidente y genera una alerta para facilitar su diagnóstico. |
| **Medida** | **Propuesta para validar:** las fallas críticas detectables deben generar alertas dentro de los 5 minutos posteriores a su detección. |
| **Verificación** | Simular fallas controladas y revisar los registros, métricas y tiempos de alerta. |
| **Estado** | Pendiente de configurar los indicadores y umbrales de monitoreo. |

## EQ-15. Modularidad: independencia funcional

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Modularidad |
| **Fuente** | Equipo de desarrollo |
| **Estímulo** | Se incorpora una nueva funcionalidad o se modifica uno de los módulos del sistema. |
| **Condición** | La aplicación utiliza Monolito Modular por Capas y principios de Clean Architecture. |
| **Respuesta esperada** | El cambio se implementa respetando las responsabilidades y contratos internos de los módulos. |
| **Medida** | El 100 % de las dependencias verificadas debe respetar las reglas arquitectónicas establecidas y las pruebas relacionadas deben aprobarse. |
| **Verificación** | Realizar análisis de dependencias, revisión de código y pruebas de regresión. |
| **Estado** | Pendiente de definir las reglas arquitectónicas verificables. |

## Resumen de Escenarios

| Código | Atributo de calidad | Qué se busca comprobar |
|---|---|---|
| EQ-01 | Rendimiento | Que las inscripciones y consultas respondan dentro del tiempo establecido. |
| EQ-02 | Disponibilidad | Que las operaciones críticas permanezcan disponibles. |
| EQ-03 | Escalabilidad | Que el sistema soporte el incremento de postulantes concurrentes. |
| EQ-04 | Seguridad | Que los usuarios no accedan a información sin autorización. |
| EQ-05 | Mantenibilidad | Que los cambios no afecten innecesariamente otros módulos. |
| EQ-06 | Integridad | Que las inscripciones y pagos mantengan información consistente. |
| EQ-07 | Usabilidad | Que los postulantes completen sus operaciones fácilmente. |
| EQ-08 | Interoperabilidad | Que el sistema se comunique correctamente con servicios externos. |
| EQ-09 | Confiabilidad | Que las fallas externas no generen pérdidas o duplicaciones de operaciones. |
| EQ-10 | Auditabilidad | Que las operaciones críticas puedan rastrearse. |
| EQ-11 | Privacidad | Que el chatbot y los servicios externos protejan los datos personales. |
| EQ-12 | Recuperabilidad | Que la información pueda restaurarse después de una falla. |
| EQ-13 | Accesibilidad | Que la plataforma sea utilizable mediante tecnologías de asistencia. |
| EQ-14 | Observabilidad | Que las fallas puedan detectarse y diagnosticarse oportunamente. |
| EQ-15 | Modularidad | Que los módulos mantengan responsabilidades y dependencias controladas. |

**Nota:** Las medidas propuestas deben aprobarse y validarse mediante pruebas. Los escenarios están alineados con los 15 atributos de calidad AC01–AC15 y las decisiones arquitectónicas del sistema.