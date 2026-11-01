# Requisitos Funcionales

## Sistema Integral de Gestión del Proceso de Admisión – UNSCH

| ID | Requisito funcional |
|---|---|
| RF01 | El sistema debe permitir registrar y actualizar los datos personales y académicos del postulante. |
| RF02 | El sistema debe permitir validar la identidad del postulante mediante RENIEC. |
| RF03 | El sistema debe permitir registrar usuarios e iniciar sesión de forma segura. |
| RF04 | El sistema debe permitir consultar y seleccionar las modalidades Ordinaria y Exonerados. |
| RF05 | El sistema debe permitir seleccionar el programa de estudios y consultar las vacantes disponibles. |
| RF06 | El sistema debe permitir registrar inscripciones en la modalidad Ordinaria. |
| RF07 | El sistema debe permitir registrar inscripciones en la modalidad Exonerados y seleccionar la submodalidad correspondiente. |
| RF08 | El sistema debe permitir adjuntar y validar los documentos requeridos según la modalidad. |
| RF09 | El sistema debe permitir generar órdenes de pago según las tasas de inscripción. |
| RF10 | El sistema debe permitir realizar pagos mediante una pasarela de pagos integrada. |
| RF11 | El sistema debe permitir verificar automáticamente el estado de los pagos y registrar las transacciones. |
| RF12 | El sistema debe permitir confirmar la inscripción y generar un código único de postulante. |
| RF13 | El sistema debe permitir generar, consultar y descargar la ficha de inscripción en PDF. |
| RF14 | El sistema debe permitir consultar el estado de inscripción y seguimiento del postulante. |
| RF15 | El sistema debe permitir registrar, consultar y subsanar observaciones documentales. |
| RF16 | El sistema debe permitir gestionar convocatorias, postulantes e inscripciones. |
| RF17 | El sistema debe permitir revisar, aprobar, observar o rechazar expedientes documentales. |
| RF18 | El sistema debe permitir consultar y conciliar los pagos realizados por los postulantes. |
| RF19 | El sistema debe permitir programar exámenes de admisión con fechas, horarios y sesiones. |
| RF20 | El sistema debe permitir administrar sedes, pabellones y aulas de evaluación. |
| RF21 | El sistema debe permitir asignar automáticamente aulas a los postulantes habilitados. |
| RF22 | El sistema debe permitir consultar y descargar la ficha de examen con sede, aula y horario. |
| RF23 | El sistema debe permitir importar, registrar y validar las calificaciones de los postulantes. |
| RF24 | El sistema debe permitir calcular puntajes y generar órdenes de mérito según las reglas establecidas. |
| RF25 | El sistema debe permitir validar y publicar los resultados oficiales del proceso de admisión. |
| RF26 | El sistema debe permitir consultar los puntajes y la condición de ingreso del postulante. |
| RF27 | El sistema debe integrar un chatbot inteligente mediante OpenRouter API para brindar orientación sobre el proceso de admisión. |
| RF28 | El sistema debe permitir al chatbot consultar estados autorizados de inscripción, pagos y documentos del postulante autenticado. |
| RF29 | El sistema debe permitir registrar y derivar consultas e incidencias al personal de soporte. |
| RF30 | El sistema debe permitir enviar notificaciones sobre inscripciones, pagos, documentos, exámenes y resultados. |
| RF31 | El sistema debe permitir generar reportes y estadísticas del proceso de admisión. |
| RF32 | El sistema debe permitir administrar usuarios, roles y permisos de acceso. |
| RF33 | El sistema debe permitir configurar modalidades, programas de estudios, vacantes y cronogramas. |
| RF34 | El sistema debe permitir administrar las integraciones con RENIEC, pasarela de pagos, OpenRouter API y correo electrónico. |
| RF35 | El sistema debe permitir registrar y consultar las operaciones realizadas mediante auditorías. |

## Relación entre Historias de Usuario y Requisitos Funcionales

| Historia de usuario | Requisitos funcionales relacionados |
|---|---|
| HU01 | RF01, RF02, RF03 |
| HU02 | RF04, RF05 |
| HU03 | RF08 |
| HU04 | RF09, RF10, RF11 |
| HU05 | RF12, RF13, RF14 |
| HU06 | RF15 |
| HU07 | RF06, RF07, RF16 |
| HU08 | RF08, RF15, RF17 |
| HU09 | RF11, RF18 |
| HU10 | RF19 |
| HU11 | RF20, RF21 |
| HU12 | RF22 |
| HU13 | RF23, RF24 |
| HU14 | RF25 |
| HU15 | RF26 |
| HU16 | RF27 |
| HU17 | RF14, RF28 |
| HU18 | RF29 |
| HU19 | RF30 |
| HU20 | RF31 |
| HU21 | RF03, RF32 |
| HU22 | RF04, RF05, RF33 |
| HU23 | RF02, RF10, RF27, RF30, RF34 |
| HU24 | RF35 |

## Resumen

- Total de historias de usuario: 24
- Total de requisitos funcionales: 35
- Módulos del sistema: 14
- Arquitectura: Monolito Modular por Capas
- Enfoque arquitectónico: Clean Architecture