# Drivers Arquitectónicos

## Sistema Integral de Gestión del Proceso de Admisión – UNSCH

| ID | Driver arquitectónico | Origen | ¿Por qué influye en la arquitectura? |
|---|---|---|---|
| DA01 | El sistema debe soportar un incremento significativo de postulantes durante los periodos de inscripción y publicación de resultados. | AC03 - Escalabilidad | Influye en el escalamiento del monolito modular, la gestión de concurrencia y la distribución de carga. |
| DA02 | El sistema debe mantener tiempos de respuesta adecuados durante operaciones simultáneas de inscripción, pagos y consultas. | AC01 - Rendimiento | Influye en la optimización de consultas, uso de caché y procesamiento de solicitudes. |
| DA03 | El sistema debe proteger los datos personales, académicos y financieros de los postulantes. | AC04 - Seguridad | Influye en la autenticación, autorización, cifrado y control de acceso basado en roles. |
| DA04 | El sistema debe garantizar la integridad de inscripciones, pagos, expedientes y resultados. | AC06 - Integridad | Influye en las validaciones, restricciones de base de datos y gestión de transacciones. |
| DA05 | El sistema debe implementar un Monolito Modular por Capas aplicando Clean Architecture. | RC02, RC03 | Define la organización de módulos, separación de responsabilidades y dirección de las dependencias. |
| DA06 | El sistema debe utilizar una API REST para la comunicación entre el frontend y el backend. | RC05 - API REST | Condiciona el diseño de los endpoints, contratos de comunicación y mecanismos de seguridad. |
| DA07 | El sistema debe integrarse con RENIEC y una pasarela de pagos externa. | RC07, RC08 | Influye en el diseño de adaptadores, manejo de errores, validación de respuestas y confirmación de transacciones. |
| DA08 | El sistema debe integrar un chatbot inteligente mediante OpenRouter API. | RC09 - Inteligencia artificial | Influye en la integración de modelos de IA, protección de credenciales, control de consumo y acceso seguro a información institucional. |
| DA09 | El sistema debe permitir modificar sus módulos sin afectar innecesariamente otras funcionalidades. | AC05 - Mantenibilidad | Influye en la modularidad, separación de responsabilidades y aplicación de los principios de Clean Architecture. |
| DA10 | El sistema debe mantenerse disponible durante las etapas críticas del proceso de admisión. | AC02 - Disponibilidad | Influye en el monitoreo, recuperación ante fallas y estrategia de despliegue. |
| DA11 | El sistema debe garantizar el procesamiento confiable de pagos y operaciones críticas. | AC09 - Confiabilidad | Influye en la implementación de transacciones, idempotencia, reintentos y manejo de fallas externas. |
| DA12 | El sistema debe registrar las operaciones críticas de inscripción, pagos, evaluación documental y resultados. | AC10 - Auditabilidad | Influye en el diseño de registros de auditoría, trazabilidad y control de modificaciones. |
| DA13 | El sistema debe garantizar la privacidad de los datos compartidos con servicios externos y modelos de inteligencia artificial. | AC11 - Privacidad | Influye en la minimización de datos, protección de información sensible y restricciones de acceso. |
| DA14 | El sistema debe permitir recuperar la información ante fallas del servidor o base de datos. | AC12 - Recuperabilidad | Influye en las estrategias de respaldo, restauración y recuperación ante desastres. |
| DA15 | El sistema debe utilizar PostgreSQL como base de datos relacional. | RC06 - Base de datos | Condiciona el diseño de persistencia, relaciones, índices, restricciones y transacciones. |
| DA16 | El sistema debe monitorear el funcionamiento de sus módulos e integraciones externas. | AC14 - Observabilidad | Influye en la implementación de logs, métricas, alertas y monitoreo de servicios. |
| DA17 | El sistema debe organizar sus 14 módulos funcionales con responsabilidades y contratos internos definidos. | AC15 - Modularidad | Influye en la estructura del código, comunicación entre módulos y reducción del acoplamiento. |
| DA18 | El sistema debe permitir programar exámenes y asignar aulas evitando conflictos y sobreocupación. | RF19, RF20, RF21 | Influye en las reglas de negocio, validaciones de capacidad y control de concurrencia. |
| DA19 | El sistema debe garantizar que los resultados oficiales sean validados y autorizados antes de publicarse. | RF23, RF24, RF25 | Influye en los flujos de aprobación, permisos, trazabilidad y protección de calificaciones. |
| DA20 | El sistema debe priorizar tecnologías de código abierto y servicios de bajo costo para su implementación académica. | RC19 - Presupuesto | Influye en la selección de tecnologías, infraestructura y servicios externos. |

## Resumen

- Total de drivers arquitectónicos: 20
- Drivers de atributos de calidad: DA01, DA02, DA03, DA04, DA09, DA10, DA11, DA12, DA13, DA14, DA16, DA17.
- Drivers de restricciones tecnológicas: DA05, DA06, DA07, DA08, DA15, DA20.
- Drivers funcionales: DA18, DA19.
- Arquitectura seleccionada: Monolito Modular por Capas.
- Enfoque arquitectónico: Clean Architecture.
- Base de datos: PostgreSQL.
- Comunicación: API REST.
- Integraciones principales: RENIEC, pasarela de pagos, OpenRouter API y servicios de notificación.