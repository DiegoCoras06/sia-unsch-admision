# Atributos de Calidad

## Sistema Integral de Gestión del Proceso de Admisión – UNSCH

| ID | Atributo de calidad | Escenario de calidad |
|---|---|---|
| AC01 | Rendimiento | El sistema debe responder a las consultas, registros, inscripciones y pagos en un tiempo objetivo de 3 segundos, bajo condiciones normales de carga y sin considerar demoras de servicios externos. |
| AC02 | Disponibilidad | El sistema debe garantizar una disponibilidad objetivo del 99.9% durante los periodos críticos de inscripción, programación de exámenes y publicación de resultados. |
| AC03 | Escalabilidad | El sistema debe permitir incrementar los recursos del servidor para soportar una mayor cantidad de postulantes concurrentes durante los periodos de alta demanda. |
| AC04 | Seguridad | El sistema debe proteger los datos personales, académicos, financieros y resultados mediante autenticación segura, cifrado y control de acceso basado en roles. |
| AC05 | Mantenibilidad | El sistema debe implementar una arquitectura de Monolito Modular por Capas con principios de Clean Architecture, permitiendo modificar módulos sin afectar innecesariamente a los demás. |
| AC06 | Integridad | El sistema debe garantizar la consistencia de inscripciones, pagos, expedientes y resultados, evitando registros duplicados, transacciones inconsistentes y modificaciones no autorizadas. |
| AC07 | Usabilidad | El sistema debe proporcionar interfaces intuitivas, responsivas y accesibles para facilitar la inscripción, el pago y la consulta de información desde computadoras y dispositivos móviles. |
| AC08 | Interoperabilidad | El sistema debe integrarse de manera segura con RENIEC, la pasarela de pagos, OpenRouter API y los servicios de notificaciones mediante interfaces y protocolos estandarizados. |
| AC09 | Confiabilidad | El sistema debe gestionar errores de conexión, fallas de servicios externos y operaciones interrumpidas sin perder información ni duplicar transacciones. |
| AC10 | Auditabilidad | El sistema debe registrar las operaciones críticas relacionadas con inscripciones, pagos, validación documental, calificaciones y publicación de resultados, identificando al responsable y la fecha de cada operación. |
| AC11 | Privacidad | El sistema debe proteger los datos personales de los postulantes y limitar la información enviada a OpenRouter API, cumpliendo con la normativa peruana de protección de datos personales. |
| AC12 | Recuperabilidad | El sistema debe realizar copias de seguridad periódicas y disponer de procedimientos de recuperación ante fallas para restaurar la información y continuidad del servicio. |
| AC13 | Accesibilidad | El sistema debe facilitar su utilización por personas con diferentes capacidades, considerando criterios de accesibilidad web como WCAG 2.2 nivel AA. |
| AC14 | Observabilidad | El sistema debe permitir monitorear errores, tiempos de respuesta, transacciones, disponibilidad de integraciones y consumo de OpenRouter API. |
| AC15 | Modularidad | Los 14 módulos funcionales deben mantener responsabilidades claramente definidas y comunicarse mediante interfaces internas, respetando las dependencias establecidas por Clean Architecture. |

## Resumen

- Total de atributos de calidad: 15
- Arquitectura: Monolito Modular por Capas
- Enfoque arquitectónico: Clean Architecture
- Sistema: Gestión Integral del Proceso de Admisión – UNSCH