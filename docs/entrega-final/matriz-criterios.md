# Matriz de los 16 criterios de evaluación

| N.º | Criterio                          | Estado verificable | Evidencia                               | Acción restante                          |
| --: | --------------------------------- | :----------------: | --------------------------------------- | ---------------------------------------- |
|   1 | Problema y requerimientos         |         ✅         | análisis, trazabilidad y reglas         | Ninguna                                  |
|   2 | Análisis y diseño                 |         ✅         | diseño interno, datos y diagramas       | Ninguna                                  |
|   3 | Arquitectura de bajo y alto nivel |         ✅         | C4, 24 ADR y pruebas de límites         | Ninguna                                  |
|   4 | Desarrollo SDD                    |         ✅         | `specs/001`–`010`                       | Vincular URL final al desplegar          |
|   5 | Unitarias e integración           |         ✅         | 342/342; cobertura 92,24 %              | Ninguna                                  |
|   6 | E2E                               |         ✅         | `npm run test:e2e`, CI y reporte        | Ampliar flujos si lo solicita el docente |
|   7 | Interfaz y UX                     |         ✅         | responsive, axe, Lighthouse y rediseños | SUS con usuarios reales, recomendable    |
|   8 | Escalabilidad frontend/backend    |      ✅ local      | lazy loading, caché y k6 2000 VU        | Repetir desplegado                       |
|   9 | Escalabilidad de base de datos    |      ✅ local      | prueba de concurrencia del 26/11        | Medir RDS restaurado en Sprint 3         |
|  10 | Dominio, DNS y CDN                |         🟡         | CDK, S3 privado, OAC y CloudFront       | Desplegar, asociar dominio y validar DNS |
|  11 | Caché                             |         ✅         | memoria, HTTP, invalidación y k6        | Activar CloudFront al desplegar          |
|  12 | CI/CD                             |         🟡         | CI completo y compilación Lambda        | Ejecutar CD con OIDC de AWS              |
|  13 | Carga k6                          |      ✅ local      | 1 597 216 peticiones; p95 589 ms        | Repetir contra AWS                       |
|  14 | Código y base en GitHub           |         ✅         | Prisma, migraciones y semillas          | Nunca subir dump real ni credenciales    |
|  15 | Informe final                     |    ✅ borrador     | `informe-final.md`                      | Completar portada y evidencia AWS        |
|  16 | Presentación y dominio            |    ✅ preparado    | guion, demo y defensa                   | Ensayar y exponer                        |

## Estado global

- Completos o demostrables localmente: **13**.
- Parciales: **2** — CDN/DNS con IaC sin desplegar y CD sin ejecutar.
- Pendiente transversal: despliegue y validación final en AWS durante Sprint 3.

No se debe marcar un servicio AWS como terminado sin URL, captura, health check y ejecución del pipeline. Esta matriz se
actualiza inmediatamente después del despliegue.
