# Actores del Sistema de Gestión del Proceso de Admisión – UNSCH

## 1. Identificación de actores

Los actores representan a los usuarios y servicios externos que interactúan con el Sistema de Gestión del Proceso de Admisión de la UNSCH.

## 2. Actores del sistema

| ID | Actor | Tipo | Función principal |
|---|---|---|---|
| A01 | Postulante | Usuario | Registrarse, inscribirse en Ordinaria o Exonerados, pagar y consultar resultados. |
| A02 | Personal de Admisión | Usuario | Gestionar postulantes, inscripciones y convocatorias. |
| A03 | Administrador | Usuario | Administrar usuarios, roles, modalidades y configuraciones. |
| A04 | Evaluador Documental | Usuario | Revisar, observar y aprobar expedientes. |
| A05 | Responsable de Tesorería | Usuario | Verificar pagos y generar reportes de recaudación. |
| A06 | Coordinador de Exámenes | Usuario | Programar exámenes y asignar sedes y aulas. |
| A07 | Responsable de Resultados | Usuario | Procesar calificaciones y publicar resultados. |
| A08 | Personal de Soporte | Usuario | Atender consultas e incidencias de postulantes. |
| A09 | RENIEC | Sistema externo | Validar la identidad de los postulantes. |
| A10 | Pasarela de Pagos | Sistema externo | Procesar y confirmar pagos de inscripción. |
| A11 | Servicio de Correo | Sistema externo | Enviar confirmaciones y notificaciones. |
| A12 | OpenRouter API | Sistema externo | Procesar consultas del chatbot inteligente. |
| A13 | Servicio SMS | Sistema externo | Enviar códigos y recordatorios. |

## 3. Descripción de actores

### A01 – Postulante
Persona que realiza su inscripción, presenta documentos, efectúa pagos, consulta su examen y resultados, y utiliza el chatbot.

### A02 – Personal de Admisión
Gestiona y supervisa las inscripciones, convocatorias y datos de los postulantes.

### A03 – Administrador
Administra usuarios, permisos, modalidades, programas de estudios y configuraciones del sistema.

### A04 – Evaluador Documental
Verifica los requisitos y documentos presentados, especialmente en la modalidad Exonerados.

### A05 – Responsable de Tesorería
Supervisa las transacciones, confirma pagos y genera reportes financieros.

### A06 – Coordinador de Exámenes
Organiza los exámenes, asigna aulas, sedes y horarios a los postulantes.

### A07 – Responsable de Resultados
Gestiona calificaciones, órdenes de mérito y publicación de resultados oficiales.

### A08 – Personal de Soporte
Resuelve incidencias y atiende consultas derivadas del chatbot.

### A09 – RENIEC
Servicio externo que permite validar la identidad de los postulantes.

### A10 – Pasarela de Pagos
Servicio externo encargado de procesar y confirmar los pagos de inscripción.

### A11 – Servicio de Correo Electrónico
Envía notificaciones, confirmaciones y comunicaciones del proceso.

### A12 – OpenRouter API
Servicio externo de inteligencia artificial utilizado por el chatbot para brindar orientación y seguimiento.

### A13 – Servicio SMS
Servicio externo que permite enviar códigos de verificación y recordatorios.

## 4. Resumen

- Actores humanos: 8
- Sistemas externos: 5
- Total de actores: 13

El sistema se desarrollará mediante una arquitectura de Monolito Modular por Capas, aplicando los principios de Arquitectura Limpia (Clean Architecture).