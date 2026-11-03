
# 5. Diagrama de Arquitectura Inicial

## 5.1. Estilo arquitectónico

El Sistema Integral de Gestión del Proceso de Admisión UNSCH utilizará una arquitectura de **Monolito Modular por Capas**, donde las funcionalidades estarán organizadas en módulos independientes a nivel lógico, pero integrados dentro de una única aplicación backend.

Esta arquitectura permitirá separar las responsabilidades del sistema, facilitar su mantenimiento y simplificar el despliegue de la aplicación.

## 5.2. Diagrama de arquitectura inicial

```mermaid
flowchart TB
    U["Postulante / Personal de admisión / Administrador"]

    subgraph WEB["Capa de presentación"]
        FE["Aplicación Angular"]
    end

    subgraph ACCESO["Acceso seguro"]
        DNS["Amazon Route 53 - Dominio"]
        CDN["Amazon CloudFront - HTTPS"]
        API["Amazon API Gateway - REST HTTPS"]
    end

    subgraph MONOLITO["Monolito Modular - Node.js + TypeScript"]
        direction TB

        subgraph INTERFACES["Capa de interfaces"]
            CTRL["Controladores REST"]
        end

        subgraph APLICACION["Capa de aplicación"]
            UC["Casos de uso"]
        end

        subgraph DOMINIO["Capa de dominio"]
            US["Usuarios y autenticación"]
            PO["Postulantes"]
            IN["Inscripciones"]
            EV["Evaluaciones y resultados"]
            DO["Documentos"]
            PA["Pagos"]
            NO["Notificaciones"]
        end

        subgraph INFRA["Capa de infraestructura"]
            REP["Repositorios"]
            EXT["Adaptadores externos"]
            EVT["Gestión de eventos"]
        end

        CTRL --> UC

        UC --> US
        UC --> PO
        UC --> IN
        UC --> EV
        UC --> DO
        UC --> PA
        UC --> NO

        US --> REP
        PO --> REP
        IN --> REP
        EV --> REP
        DO --> REP
        PA --> REP
        NO --> REP

        PO --> EXT
        PA --> EXT
        NO --> EXT

        IN --> EVT
        PA --> EVT
    end

    subgraph DATOS["Persistencia y almacenamiento"]
        DB[("Amazon RDS - PostgreSQL")]
        S3["Amazon S3 - Documentos"]
    end

    subgraph EVENTOS["Comunicación asíncrona"]
        EB["Outbox en PostgreSQL<br/>+ EventBridge Scheduler"]
    end

    subgraph EXTERNOS["Integraciones externas"]
        ID["RENIEC vía apiperu"]
        PG["Izipay micuentaweb y Culqi (Yape)"]
        AI["OpenRouter API"]
        SES["Amazon SES"]
    end

    U --> DNS
    DNS --> CDN
    CDN --> FE
    FE --> API
    API --> CTRL

    REP --> DB
    REP --> S3

    EVT --> DB
    EB --> NO

    EXT --> ID
    EXT --> PG
    EXT --> SES
    EXT --> AI
```

## 5.3. Descripción de las capas

### Capa de presentación

Estará desarrollada con Angular y permitirá la interacción de los postulantes, personal de admisión y administradores con el sistema.

### Capa de interfaces

Estará compuesta por controladores REST encargados de recibir las solicitudes HTTP, validar los datos y comunicarse con la capa de aplicación.

### Capa de aplicación

Contendrá los casos de uso que coordinan los procesos de registro de postulantes, inscripciones, pagos, evaluaciones y consulta de resultados.

### Capa de dominio

Contendrá las reglas de negocio y estará organizada en siete módulos funcionales:

1. Usuarios y autenticación.
2. Postulantes.
3. Inscripciones.
4. Evaluaciones y resultados.
5. Documentos.
6. Pagos.
7. Notificaciones.

### Capa de infraestructura

Implementará los repositorios de datos, los adaptadores externos y la comunicación con los servicios AWS.

## 5.4. Tecnologías utilizadas

| Tecnología | Función |
|---|---|
| Angular | Interfaz web |
| Node.js y TypeScript | Backend modular |
| AWS Lambda | Ejecución del backend |
| Amazon API Gateway | API REST segura |
| Amazon RDS PostgreSQL | Base de datos |
| Amazon S3 | Almacenamiento de archivos |
| Amazon CloudFront | Distribución web |
| Amazon Route 53 | Dominio |
| Amazon EventBridge Scheduler | Despacho periódico de la bandeja de eventos y tareas programadas |
| Amazon SES | Correos electrónicos |
| AWS Certificate Manager | Certificados HTTPS |

## 5.5. Justificación arquitectónica

Se seleccionó la arquitectura de Monolito Modular por Capas porque permite organizar el sistema en módulos funcionales claramente definidos, manteniendo una única aplicación backend.

Esta arquitectura facilita el desarrollo, las pruebas, el mantenimiento y el despliegue del sistema, evitando la complejidad de administrar múltiples microservicios.

Asimismo, permite integrar servicios de AWS para proporcionar almacenamiento, seguridad y procesamiento de solicitudes.

## 5.6. Consideraciones

El diagrama representa una vista lógica inicial de la arquitectura.

Los módulos compartirán una instancia de PostgreSQL, pero deberán mantener límites lógicos y acceder a los datos mediante repositorios e interfaces definidas.

El backend podrá desplegarse como una única función AWS Lambda conectada a Amazon API Gateway.

Amazon S3 podrá utilizarse tanto para almacenar documentos como para alojar los archivos estáticos del frontend, que serán distribuidos mediante CloudFront.

Las integraciones externas se implementarán mediante adaptadores.

El certificado HTTPS se administrará mediante AWS Certificate Manager.

## 5.7. Estado de implementación (02/11/2026)

La arquitectura se implementó con estos ajustes respecto de la vista inicial:

| Elemento de la vista inicial | Cómo quedó | Motivo |
|---|---|---|
| 7 módulos de dominio | 14 módulos funcionales en 12 carpetas (ver 03, diseño interno) | El análisis detallado separó convocatorias, expedientes, exámenes, chatbot, reportes, seguridad y configuración |
| ElastiCache Redis | Retirado del diagrama; previsto solo si la prueba de carga lo exige | Las consultas frecuentes son livianas y el límite de intentos funciona con PostgreSQL; Redis añade un costo fijo |
| Amazon EventBridge como bus de eventos | Bandeja de eventos (Transactional Outbox) en PostgreSQL; EventBridge Scheduler solo dispara el despacho cada minuto | El evento se guarda en la misma transacción que el cambio, así no se pierde ni se duplica (ADR-008 del repositorio) |
| Validación de identidad | RENIEC por medio de apiperu.dev | Proveedor autorizado y de bajo costo para el proyecto académico |
| Pasarela de pagos | Izipay micuentaweb (tarjeta) y Culqi (Yape) | Yape no estaba disponible en la cuenta de Izipay (ADR-019) |
| Route 53, CloudFront, API Gateway, Lambda | Diseñados, pendientes del despliegue | Paso 11 de la hoja de ruta |

Hoy el sistema funciona en local (Node.js + Angular) conectado a los servicios reales de AWS: RDS PostgreSQL, S3 y SES.

