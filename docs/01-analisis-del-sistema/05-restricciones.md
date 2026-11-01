# Restricciones

## Sistema Integral de Gestión del Proceso de Admisión – UNSCH

| ID | Restricción | Descripción |
|---|---|---|
| RC01 | Aplicación web | El sistema debe desarrollarse como una aplicación web responsiva, accesible desde navegadores y dispositivos móviles. |
| RC02 | Arquitectura de software | El sistema debe implementar una arquitectura de Monolito Modular por Capas, aplicando los principios de Clean Architecture. |
| RC03 | Modularidad | El sistema debe organizarse en módulos funcionales independientes a nivel lógico, integrados en una única aplicación desplegable. |
| RC04 | Control de versiones | El proyecto debe gestionarse mediante Git y mantenerse en un repositorio de GitHub. |
| RC05 | API REST | La comunicación entre el frontend y el backend debe realizarse mediante una API REST utilizando HTTPS. |
| RC06 | Base de datos | La información del sistema debe almacenarse en PostgreSQL como sistema de gestión de base de datos relacional. |
| RC07 | Validación de identidad | El sistema debe considerar la integración autorizada con RENIEC para validar la identidad de los postulantes. |
| RC08 | Pasarela de pagos | El sistema debe integrarse con una pasarela de pagos externa para procesar y confirmar los pagos de inscripción. |
| RC09 | Inteligencia artificial | El chatbot debe utilizar OpenRouter API mediante una API key almacenada de forma segura en el backend. |
| RC10 | Documentos digitales | Las fichas de inscripción, constancias y documentos generados deben poder consultarse y descargarse en formato PDF. |
| RC11 | Protección de datos | El sistema debe cumplir con la normativa peruana de protección de datos personales e implementar autenticación, autorización y cifrado. |
| RC12 | Gestión de usuarios | El sistema debe implementar control de acceso basado en roles y permisos según las responsabilidades de cada usuario. |
| RC13 | Modalidades de admisión | El sistema debe contemplar las modalidades Ordinaria y Exonerados, respetando los requisitos y procedimientos establecidos por la UNSCH. |
| RC14 | Programación de exámenes | La programación de exámenes, asignación de aulas y distribución de postulantes debe respetar los cronogramas y capacidades establecidos. |
| RC15 | Publicación de resultados | Los resultados deben publicarse únicamente después de su validación y autorización por el personal responsable. |
| RC16 | Servicios de notificación | El sistema debe considerar servicios externos de correo electrónico y, opcionalmente, SMS para enviar notificaciones. |
| RC17 | Seguridad de integraciones | Las credenciales de RENIEC, pasarela de pagos y OpenRouter deben almacenarse en el servidor y no exponerse al frontend. |
| RC18 | Despliegue | El sistema debe desplegarse como una aplicación monolítica modular, con una base de datos y servicios externos integrados mediante adaptadores. |
| RC19 | Presupuesto | La implementación inicial debe priorizar tecnologías de código abierto y servicios de bajo costo para fines académicos. |
| RC20 | Disponibilidad de servicios externos | Las integraciones con RENIEC y la pasarela de pagos dependerán de las autorizaciones, credenciales y condiciones de acceso de los proveedores. |

## Resumen

- Total de restricciones: 20
- Arquitectura: Monolito Modular por Capas
- Enfoque: Clean Architecture
- Base de datos: PostgreSQL
- Comunicación: API REST
- Inteligencia artificial: OpenRouter API
- Control de versiones: Git y GitHub
- Sistema: Gestión Integral del Proceso de Admisión – UNSCH