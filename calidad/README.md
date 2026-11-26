# Pruebas de los atributos de calidad

Esta carpeta reúne **cómo se prueba cada uno de los 10 atributos de calidad** del sistema (ver
`docs/01-analisis-del-sistema/04-atributos-de-calidad.md` y `08-escenarios-atributos-calidad.md`),
los scripts para hacerlo y los resultados con fecha, que sirven como evidencia de cada escenario (EQ-01 a EQ-10).

```
calidad/
├── README.md               Esta guía
├── verificar.mjs           Corre las pruebas automáticas y escribe el reporte del día
├── k6/
│   ├── rendimiento.js      AC01: carga de solo lectura (tiempo de respuesta)
│   ├── escalabilidad.js    AC03: carga escalonada de 10 a 100 usuarios
│   └── carga-2000.js       AC01 y AC03: carga progresiva de 50 a 2000 usuarios (Sprint 2)
├── usabilidad/
│   ├── axe-consola.js      AC07: revisión manual para la consola del navegador
│   ├── verificar-portal.mjs AC07: axe, responsive, desbordes y errores JS en 22 rutas
│   └── servir-build.mjs    Servidor del build productivo para Lighthouse
├── postman/                Verificación funcional de los 12 módulos (colección, entorno y guía)
└── resultados/             Reportes generados (uno por fecha)
```

**Dos herramientas, dos preguntas:** Postman (`postman/`) responde «¿cada módulo funciona?», y k6 (`k6/`) responde
«¿cuántos usuarios soporta y con qué tiempos?».

## 1. Verificación automática (un solo comando)

```bash
node calidad/verificar.mjs
```

Hace tres cosas y deja el reporte en `calidad/resultados/AAAA-MM-DD.md`:

1. `npm audit`: vulnerabilidades de las dependencias (AC04).
2. Todas las pruebas del backend (Jest), **agrupadas por atributo**. Usan una base PostgreSQL temporal que se
   crea y se borra en cada ejecución: **nunca tocan RDS**.
3. Revisión de tipos del backend y del portal (AC05).

Tarda unos 3 a 5 minutos. Si algo falla, el reporte dice qué prueba y en qué atributo.

## 2. Cómo se prueba cada atributo

| Atributo                   | Qué se comprueba                                                                                            | Cómo                                                                                                      | Evidencia                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **AC01 Rendimiento**       | El 95 % de las peticiones (p95) responde en 3 s o menos                                                     | `k6 run calidad/k6/rendimiento.js` (ver sección 3)                                                        | Resumen de k6 en `resultados/`                                 |
| **AC02 Disponibilidad**    | 99.9 % de tiempo en línea en la etapa de inscripción                                                        | `GET /api/v1/health` vigilado por **UptimeRobot** cada minuto (después del despliegue)                    | Porcentaje de UptimeRobot                                      |
| **AC03 Escalabilidad**     | El tiempo se mantiene al subir de 10 a 100 usuarios                                                         | `k6 run calidad/k6/escalabilidad.js` (después del despliegue)                                             | Resumen de k6 por etapa                                        |
| **AC04 Seguridad**         | Sin vulnerabilidades altas; acceso por roles (403); doble factor; datos mínimos al asistente                | `verificar.mjs` (npm audit y pruebas de seguridad). Opcional: OWASP ZAP (sección 4)                       | Reporte del día                                                |
| **AC05 Mantenibilidad**    | Los 12 módulos respetan sus límites; sin errores de tipos                                                   | `verificar.mjs` (prueba de arquitectura y revisión de tipos)                                              | Reporte del día                                                |
| **AC06 Integridad**        | Sin inscripciones ni pagos duplicados; montos y rankings correctos                                          | `verificar.mjs` (pruebas de inscripción, pagos, tesorería, tasas y resultados)                            | Reporte del día                                                |
| **AC07 Usabilidad**        | WCAG 2.2 AA sin fallas; puntaje SUS de 68 o más                                                             | `node calidad/usabilidad/verificar-portal.mjs`, **Lighthouse** y la **encuesta SUS** del panel            | Reportes de axe/responsive y Lighthouse; puntaje SUS del panel |
| **AC08 Interoperabilidad** | RENIEC (APIPerú), Culqi, SES y S3 responden como se espera                                                  | `verificar.mjs` (adaptadores) y, con servicios reales, los comandos de la sección 4                       | Reporte del día y salida de los comandos                       |
| **AC09 Confiabilidad**     | Circuit breakers; DLQ; idempotencia; salud separada; métricas; 503 si la base cae; restauración de respaldo | `verificar.mjs` (fallos, reintentos, DLQ, idempotencia y health checks) y restauración en AWS (sección 4) | Reporte local y tiempo de restauración                         |
| **AC10 Auditabilidad**     | Cada operación crítica queda con responsable y fecha                                                        | `verificar.mjs` (pruebas de auditoría) y la pantalla **Auditoría** del panel                              | Reporte del día y captura del panel                            |

## 3. Pruebas de carga con k6 (AC01 y AC03)

k6 es un programa gratuito que no se agrega al proyecto. Instalación en Windows:

```bash
winget install k6 --source winget
```

Las dos pruebas **solo leen** (portada, convocatoria, programas, tasas y comunicados): no crean inscripciones ni pagos.

```bash
k6 run calidad/k6/rendimiento.js
```

```bash
k6 run calidad/k6/escalabilidad.js
```

Por defecto apuntan a la API local (`http://127.0.0.1:3000/api/v1`). Para otra dirección:

```bash
k6 run -e BASE=https://tu-dominio/api/v1 calidad/k6/rendimiento.js
```

Para el Sprint 2, la carga progresiva sube por etapas de 50, 100, 250, 500, 1000, 1500 y 2000 usuarios (30 s de subida y
1 minuto en cada una, unos 11 minutos) y entrega una tabla con el tiempo y los errores de cada etapa:

```bash
k6 run calidad/k6/carga-2000.js
```

Para validar explícitamente el sistema **sin caché de catálogo ni contenidos**, inicia la API contra RDS con
`npm run dev:rds:no-cache` y ejecuta el mismo script. El TTL queda en cero; solo se agrupan consultas idénticas que ya
están en curso (single-flight), sin conservar el resultado. La evidencia del 26/11/2026 llegó a 2000 VU con p95 de
1682 ms y 0 % de errores. Resultado bruto: `resultados/2026-11-26-k6-carga-2000-sin-cache-contenidos.txt`; análisis:
`resultados/2026-11-26-k6-sin-cache.md`.

**Importante:** con la API en tu computadora y la base en RDS (Ohio), cada consulta cruza el continente y los tiempos
miden sobre todo esa distancia. La medición válida para EQ-01 y EQ-03 es **después del despliegue en AWS**, con la API
en la misma región que RDS. Antes de correrlas contra RDS, acuérdate de que generan carga en la base de datos.

## 4. Pruebas manuales o con servicios reales

Estas no las corre `verificar.mjs` porque llaman a servicios reales o tienen costo.

| Atributo | Prueba                                                       | Comando o pasos                                                                                                                                |
| -------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| AC04     | Escaneo de vulnerabilidades web (OWASP ZAP, necesita Docker) | `docker run --rm -t zaproxy/zap-stable zap-baseline.py -t http://host.docker.internal:4200`                                                    |
| AC08     | Consulta real de DNI (APIPerú)                               | `npm run apiperu:check -w @sia/backend`                                                                                                        |
| AC08     | Llaves de Culqi (modo prueba)                                | `npm run culqi:check -w @sia/backend`                                                                                                          |
| AC08     | Remitente de correo en SES                                   | `npm run ses:check -w @sia/backend`                                                                                                            |
| AC08     | Conexión a RDS con SSL                                       | `npm run rds:check -w @sia/backend`                                                                                                            |
| AC09     | Respaldos de RDS                                             | Consola de AWS, RDS, la base, pestaña **Mantenimiento y copias de seguridad**: periodo de retención (7 días o más) y último tiempo restaurable |
| AC09     | Restauración                                                 | Restaurar a un momento dado en una **instancia temporal**, medir el tiempo, comprobar los datos y borrarla (tiene costo mientras existe)       |
| AC07     | Prueba con usuarios                                          | 5 a 10 compañeros se inscriben y responden la encuesta SUS; el panel calcula el puntaje                                                        |
| AC07     | Lector de pantalla                                           | Recorrer la inscripción con NVDA (gratuito) o el Narrador de Windows                                                                           |

Los componentes de confiabilidad que no requieren despliegue ya se validan en local. Los endpoints son
`/api/v1/health/live`, `/api/v1/health/ready`, `/api/v1/health/dependencies` y `/api/v1/health/metrics`. El panel
administrativo expone el estado y permite reintentar eventos de la DLQ con auditoría. No se publican contraseñas,
tokens ni cadenas de conexión en estas respuestas.

## 5. Registrar la evidencia

Después de cada ejecución:

1. Revisa el reporte en `calidad/resultados/`.
2. Copia el resultado al **Estado** de cada escenario en `docs/01-analisis-del-sistema/08-escenarios-atributos-calidad.md`,
   con la fecha y el nombre del reporte.
