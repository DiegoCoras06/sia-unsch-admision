# Atributos de Calidad

## Sistema Integral de Gestión del Proceso de Admisión – UNSCH

El sistema prioriza **10 atributos de calidad**, los que más influyen en un proceso de admisión: atender picos de postulantes, proteger sus datos, cobrar sin errores y dejar constancia de cada operación.

| ID | Atributo de calidad | Escenario de calidad |
|---|---|---|
| AC01 | Rendimiento | El sistema debe responder a las consultas, registros, inscripciones y pagos en un tiempo objetivo de 3 segundos, bajo condiciones normales de carga y sin considerar demoras de servicios externos. |
| AC02 | Disponibilidad | El sistema debe garantizar una disponibilidad objetivo del 99.9 % durante los periodos críticos de inscripción, programación de exámenes y publicación de resultados, y monitorear errores, tiempos de respuesta e integraciones para detectar fallas a tiempo. |
| AC03 | Escalabilidad | El sistema debe permitir incrementar los recursos del servidor para soportar una mayor cantidad de postulantes concurrentes durante los periodos de alta demanda. |
| AC04 | Seguridad | El sistema debe proteger los datos personales, académicos, financieros y resultados mediante autenticación segura, cifrado y control de acceso basado en roles, y limitar la información enviada a OpenRouter API, cumpliendo con la normativa peruana de protección de datos personales. |
| AC05 | Mantenibilidad | El sistema debe implementar una arquitectura de Monolito Modular por Capas con principios de Clean Architecture, en la que los 12 módulos funcionales mantengan responsabilidades definidas y se comuniquen mediante interfaces internas, permitiendo modificar un módulo sin afectar innecesariamente a los demás. |
| AC06 | Integridad | El sistema debe garantizar la consistencia de inscripciones, pagos, expedientes y resultados, evitando registros duplicados, transacciones inconsistentes y modificaciones no autorizadas. |
| AC07 | Usabilidad | El sistema debe proporcionar interfaces intuitivas, responsivas y accesibles (WCAG 2.2 nivel AA) para facilitar la inscripción, el pago y la consulta de información desde computadoras y dispositivos móviles. |
| AC08 | Interoperabilidad | El sistema debe integrarse de manera segura con RENIEC, la pasarela de pagos, OpenRouter API y los servicios de notificaciones mediante interfaces y protocolos estandarizados. |
| AC09 | Confiabilidad | El sistema debe gestionar errores de conexión, fallas de servicios externos y operaciones interrumpidas sin perder información ni duplicar transacciones, y contar con copias de seguridad y procedimientos para restaurar la información ante fallas. |
| AC10 | Auditabilidad | El sistema debe registrar las operaciones críticas relacionadas con inscripciones, pagos, validación documental, calificaciones y publicación de resultados, identificando al responsable y la fecha de cada operación. |

## Atributos integrados

La lista anterior tenía 15 atributos. Para concentrar el análisis en los más importantes, cinco se integraron en el atributo con el que comparten objetivo y forma de medición; sus exigencias se conservan:

| Atributo anterior | Se integra en | Motivo |
|---|---|---|
| Privacidad | AC04 Seguridad | Proteger los datos personales y limitar lo que se envía a servicios externos es parte de la seguridad de la información. |
| Recuperabilidad | AC09 Confiabilidad | Restaurar la información tras una falla forma parte de la confiabilidad (ISO/IEC 25010: fiabilidad). |
| Accesibilidad | AC07 Usabilidad | Una interfaz usable para todos debe cumplir WCAG 2.2 AA. |
| Observabilidad | AC02 Disponibilidad | El monitoreo y las alertas son el medio para detectar caídas y mantener el servicio disponible. |
| Modularidad | AC05 Mantenibilidad | La independencia de los 12 módulos es lo que permite modificar uno sin afectar a los demás. |

## Resumen

- Total de atributos de calidad: 10
- Arquitectura: Monolito Modular por Capas
- Enfoque arquitectónico: Clean Architecture
- Sistema: Gestión Integral del Proceso de Admisión – UNSCH
