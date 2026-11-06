# Atributos de Calidad

# Atributos de calidad prioritarios del Sistema de Admisión UNSCH

| ID | Atributo de calidad | Escenario de calidad |
|---|---|---|
| AC01 | Rendimiento | Bajo condiciones normales de carga, al menos el 95 % de las consultas, registros, inscripciones y operaciones internas de pago debe responder en un máximo de 3 segundos, sin considerar demoras de servicios externos. |
| AC02 | Disponibilidad | El sistema debe alcanzar una disponibilidad objetivo del 99.9 % durante los periodos críticos de inscripción, programación de exámenes y publicación de resultados. |
| AC03 | Escalabilidad | Ante un incremento de postulantes concurrentes, el sistema debe permitir ampliar sus recursos de cómputo para mantener el rendimiento, sin modificar las reglas de negocio. Su capacidad debe verificarse mediante pruebas de carga. |
| AC04 | Seguridad | El sistema debe proteger los datos personales, académicos, financieros y resultados mediante autenticación segura, HTTPS y control de acceso basado en roles, rechazando operaciones no autorizadas y limitando los datos enviados a servicios externos. |
| AC05 | Mantenibilidad | Ante cambios en un módulo, el sistema debe permitir modificarlo mediante una arquitectura de Monolito Modular por Capas con principios de Clean Architecture, verificando mediante pruebas que los módulos relacionados mantienen su funcionamiento. |
| AC06 | Integridad | Ante solicitudes repetidas, operaciones simultáneas o notificaciones duplicadas de pagos, el sistema debe mantener registros consistentes y evitar duplicidades mediante transacciones, restricciones de base de datos e idempotencia. |
| AC09 | Confiabilidad | Ante fallas de conexión o de servicios externos, el sistema debe conservar las operaciones confirmadas, informar el estado de la solicitud y permitir reintentos sin duplicar transacciones. Los pagos con resultado incierto deben permanecer pendientes hasta verificar su estado con la pasarela. |
## Resumen

- Total de atributos de calidad: 15
- Arquitectura: Monolito Modular por Capas
- Enfoque arquitectónico: Clean Architecture
- Sistema: Gestión Integral del Proceso de Admisión – UNSCH