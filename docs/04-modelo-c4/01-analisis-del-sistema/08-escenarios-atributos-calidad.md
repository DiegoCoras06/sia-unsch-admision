# 08. Escenarios de Atributos de Calidad

## Sistema Integral de Gestión del Proceso de Admisión – UNSCH

Se consideran los nueve primeros atributos de calidad: rendimiento, disponibilidad, escalabilidad, seguridad, mantenibilidad, integridad, usabilidad, interoperabilidad y confiabilidad.

Las medidas indicadas son objetivos de validación. Su cumplimiento debe sustentarse mediante pruebas y evidencias del sistema.

## EQ-01. Rendimiento: inscripción de postulantes

| Elemento | Descripción |
|---|---|
| Atributo de calidad | Rendimiento |
| Fuente | Postulantes. |
| Estímulo | Múltiples postulantes realizan registros, inscripciones, consultas y operaciones de pago simultáneamente. |
| Condición | El sistema funciona bajo la carga normal definida para el proceso de admisión. |
| Respuesta esperada | El sistema procesa las solicitudes y devuelve una respuesta dentro del tiempo establecido. |
| Medida | Al menos el 95 % de las solicitudes habituales responde en un máximo de 3 segundos, excluyendo las demoras de servicios externos. |
| Verificación | Ejecutar pruebas de carga y registrar tiempos de respuesta, errores y usuarios concurrentes. |

## EQ-02. Disponibilidad: continuidad del proceso de admisión

| Elemento | Descripción |
|---|---|
| Atributo de calidad | Disponibilidad |
| Fuente | Postulantes y personal administrativo. |
| Estímulo | Los usuarios acceden al sistema durante la inscripción, programación de exámenes o publicación de resultados. |
| Condición | La plataforma se encuentra desplegada en el entorno de producción durante un periodo crítico. |
| Respuesta esperada | El sistema mantiene disponibles las funcionalidades necesarias para continuar el proceso de admisión. |
| Medida | Alcanzar una disponibilidad objetivo del 99.9 %, calculada sobre el tiempo total de cada periodo crítico. |
| Verificación | Monitorear las operaciones críticas y calcular la disponibilidad a partir de los tiempos de funcionamiento e interrupción. |

## EQ-03. Escalabilidad: incremento de postulantes

| Elemento | Descripción |
|---|---|
| Atributo de calidad | Escalabilidad |
| Fuente | Incremento de postulantes concurrentes. |
| Estímulo | Aumenta la cantidad de solicitudes durante los periodos de mayor demanda. |
| Condición | El sistema está desplegado en AWS y dispone de recursos configurables de cómputo y base de datos. |
| Respuesta esperada | El sistema permite ampliar su capacidad de atención sin modificar las reglas de negocio y controla el uso de conexiones a PostgreSQL. |
| Medida | Como objetivo inicial de prueba, soportar 200 usuarios simultáneos, manteniendo al menos el 95 % de las respuestas habituales en un máximo de 3 segundos y menos del 1 % de errores técnicos, excluyendo demoras externas. |
| Verificación | Incrementar progresivamente la carga y analizar tiempos de respuesta, errores, conexiones y consumo de recursos. |

## EQ-04. Seguridad: protección de información

| Elemento | Descripción |
|---|---|
| Atributo de calidad | Seguridad |
| Fuente | Usuario no autenticado o sin los permisos necesarios. |
| Estímulo | Intenta consultar o modificar datos personales, inscripciones, pagos, expedientes o resultados protegidos. |
| Condición | El sistema aplica autenticación, comunicación mediante HTTPS y control de acceso basado en roles. |
| Respuesta esperada | El sistema verifica la identidad y los permisos del usuario y rechaza el acceso no autorizado sin exponer información sensible. |
| Medida | Rechazar el 100 % de los intentos no autorizados incluidos en los casos de prueba definidos. |
| Verificación | Ejecutar pruebas de autenticación, autorización y acceso a registros de otros usuarios. |

## EQ-05. Mantenibilidad: modificación de funcionalidades

| Elemento | Descripción |
|---|---|
| Atributo de calidad | Mantenibilidad |
| Fuente | Equipo de desarrollo. |
| Estímulo | Se solicita modificar una funcionalidad de inscripción, pagos, exámenes o resultados. |
| Condición | El sistema está organizado como Monolito Modular por Capas con principios de Clean Architecture. |
| Respuesta esperada | El cambio se implementa en el módulo correspondiente, respetando sus interfaces y las reglas de dependencia entre capas. |
| Medida | Aprobar todas las pruebas del módulo modificado y las pruebas de regresión relacionadas, sin introducir dependencias contrarias a la arquitectura definida. |
| Verificación | Revisar el código, analizar las dependencias y ejecutar las pruebas correspondientes. |

## EQ-06. Integridad: consistencia de inscripciones y pagos

| Elemento | Descripción |
|---|---|
| Atributo de calidad | Integridad |
| Fuente | Postulantes y pasarela de pagos. |
| Estímulo | Se reciben solicitudes simultáneas, inscripciones repetidas o notificaciones duplicadas de un mismo pago. |
| Condición | El sistema procesa operaciones de negocio utilizando PostgreSQL e integraciones con la pasarela de pagos. |
| Respuesta esperada | El sistema aplica transacciones, restricciones de unicidad e idempotencia para conservar información consistente. |
| Medida | Generar una sola inscripción por la combinación de datos definida como única y una sola aplicación de cada pago confirmado, en todos los casos de prueba de duplicidad y concurrencia. |
| Verificación | Ejecutar solicitudes concurrentes, repetir notificaciones de pago y comprobar los registros y estados almacenados. |

## EQ-07. Usabilidad: inscripción desde computadoras y móviles

| Elemento | Descripción |
|---|---|
| Atributo de calidad | Usabilidad |
| Fuente | Postulante. |
| Estímulo | El postulante realiza su inscripción y consulta su estado desde una computadora o dispositivo móvil. |
| Condición | El usuario dispone de un navegador y las funcionalidades del proceso están habilitadas. |
| Respuesta esperada | La interfaz presenta pasos comprensibles, formularios claros, mensajes de validación y confirmaciones que facilitan completar las tareas. |
| Medida | Al menos el 90 % de los participantes de una prueba de usabilidad completa las tareas principales sin asistencia del evaluador. |
| Verificación | Realizar pruebas con usuarios representativos y registrar tareas completadas, dificultades y solicitudes de ayuda. |

## EQ-08. Interoperabilidad: comunicación con servicios externos

| Elemento | Descripción |
|---|---|
| Atributo de calidad | Interoperabilidad |
| Fuente | RENIEC o proveedor autorizado de consulta de identidad, pasarela de pagos, OpenRouter API y servicio de notificaciones. |
| Estímulo | El sistema solicita validar una identidad, procesar un pago, responder una consulta del chatbot o enviar una notificación. |
| Condición | Las integraciones cuentan con credenciales y contratos de intercambio configurados mediante interfaces y adaptadores. |
| Respuesta esperada | El sistema intercambia información mediante HTTPS, interpreta las respuestas y gestiona los errores de cada proveedor. |
| Medida | El 100 % de los casos de integración definidos produce el resultado esperado o un error controlado, incluyendo respuestas inválidas y tiempos de espera agotados. |
| Verificación | Ejecutar pruebas de integración con servicios autorizados, entornos de prueba y respuestas simuladas para los casos de error. |

## EQ-09. Confiabilidad: operaciones interrumpidas

| Elemento | Descripción |
|---|---|
| Atributo de calidad | Confiabilidad |
| Fuente | Falla de conexión o interrupción de un servicio externo. |
| Estímulo | Una operación de inscripción, pago, validación de identidad o notificación se interrumpe antes de obtener una respuesta definitiva. |
| Condición | El sistema está procesando la solicitud y puede desconocer el resultado de la operación externa. |
| Respuesta esperada | El sistema conserva las operaciones confirmadas, informa el estado de la solicitud y permite reintentos controlados. Los pagos con resultado incierto permanecen pendientes hasta verificar su estado con la pasarela. |
| Medida | No perder operaciones confirmadas ni duplicar transacciones en ninguno de los escenarios de interrupción incluidos en las pruebas. |
| Verificación | Simular desconexiones, respuestas tardías y reintentos; posteriormente, comprobar la consistencia de los estados y registros. |

## Resumen de escenarios

| Código | Atributo de calidad | Qué se busca comprobar |
|---|---|---|
| EQ-01 | Rendimiento | Respuestas dentro del tiempo establecido. |
| EQ-02 | Disponibilidad | Continuidad de las funcionalidades críticas. |
| EQ-03 | Escalabilidad | Capacidad para atender más postulantes concurrentes. |
| EQ-04 | Seguridad | Protección frente a accesos y operaciones no autorizados. |
| EQ-05 | Mantenibilidad | Modificaciones controladas y respeto de las dependencias. |
| EQ-06 | Integridad | Consistencia de inscripciones y pagos ante duplicidad y concurrencia. |
| EQ-07 | Usabilidad | Facilidad para completar las tareas principales. |
| EQ-08 | Interoperabilidad | Intercambio correcto de información con servicios externos. |
| EQ-09 | Confiabilidad | Conservación de operaciones ante fallas e interrupciones. |

**Nota:** El objetivo inicial de 200 usuarios simultáneos debe confirmarse según la demanda esperada. Los estados de cumplimiento se documentarán cuando se disponga de evidencias verificables.

