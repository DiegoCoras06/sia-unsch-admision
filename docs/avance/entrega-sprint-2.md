# Entrega del Sprint 2: evidencias por requisito

Esta página reúne, para cada requisito del Sprint 2, **dónde está** la evidencia en el repositorio y **cómo
comprobarla**. Repositorio: https://github.com/DiegoCoras06/sia-unsch-admision

## Resumen

| # | Requisito | Estado | Evidencia principal |
|---|---|---|---|
| 1 | Estilo arquitectónico | ✅ | `docs/02-arquitectura-de-software/10-estilo-arquitectonico.md`, ADR-001 (monolito modular) |
| 2 | Patrón Clean Architecture | ✅ | ADR-002, `docs/03-diseño-de-software/diseño-interno-modulos.md`, prueba de arquitectura |
| 3 | Especificaciones SDD con criterios de aceptación y tareas | ✅ | `specs/001` a `specs/010` (requisitos, diseño y tareas): 280 de 288 tareas hechas |
| 4 | Endpoints REST documentados con OpenAPI y Swagger | ✅ | `/api/docs`, `apps/backend/swagger/openapi.json` (205 operaciones) |
| 5 | Comportamiento de la base de datos y caché | ✅ | `docs/03-diseño-de-software/base-de-datos-y-cache.md` |
| 6 | SOLID y patrones de diseño | ✅ | `docs/03-diseño-de-software/principios-diseño.md` y `patrones-diseño.md` |
| 7 | Pruebas automáticas, cobertura e integración continua | ✅ | 281 pruebas, reporte de cobertura, `.github/workflows/ci.yml` |
| 8 | Pruebas de calidad con Postman y k6 hasta 2000 usuarios | ✅ | `calidad/postman/`, `calidad/k6/`, `calidad/resultados/` |

## 1 y 2. Estilo arquitectónico y Clean Architecture

- **Estilo:** monolito modular con 12 módulos (ADR-001), cada uno con su esquema propio en PostgreSQL.
- **Patrón:** Clean Architecture dentro de cada módulo (ADR-002): `domain` (reglas y puertos), `application`
  (casos de uso), `infrastructure` (Prisma, Culqi, SES, S3) y `presentation` (rutas de Express).
- **Cómo se comprueba:** `apps/backend/tests/unit/arquitectura/` falla si un módulo importa el interior de otro o si un
  servicio de aplicación usa Prisma directamente.

## 3. Especificaciones SDD

Cada carpeta de `specs/` tiene `requirements.md` (historias con criterios de aceptación «Dado, Cuando, Entonces»),
`design.md` y `tasks.md`; cuatro tienen además su contrato `contracts/openapi.yaml`.

| Especificación | Tareas hechas |
|---|---|
| 001 Portal público | 67 de 71 |
| 002 Cuentas e identidad | 34 de 36 |
| 003 Inscripción ordinaria | 33 de 33 |
| 004 Inscripción de exonerados | 22 de 22 |
| 005 Pagos | 27 de 29 |
| 006 Examen y aulas | 23 de 23 |
| 007 Resultados e ingreso | 16 de 16 |
| 008 Panel administrativo | 32 de 32 |
| 009 Asistente con IA | 15 de 15 |
| 010 Notificaciones | 11 de 11 |

Las tareas pendientes dependen del despliegue en AWS (Paso 11).

## 4. OpenAPI y Swagger

1. Enciende la API (`npm run dev:rds`).
2. Abre **http://127.0.0.1:3000/api/docs**: 205 operaciones agrupadas por los 12 módulos.
3. El contrato completo está en `http://127.0.0.1:3000/api/openapi.json` y en `apps/backend/swagger/openapi.json`.
4. Se regenera con `npm run openapi -w @sia/backend`; una prueba falla si alguna ruta del código no está documentada.
5. Todo lo de Swagger está en la carpeta `apps/backend/swagger/` (contrato, generador y configuración de Swagger UI),
   con su guía en `apps/backend/swagger/README.md`.

## 5. Base de datos y caché

`docs/03-diseño-de-software/base-de-datos-y-cache.md`: un esquema por módulo, cómo se evitan duplicados con muchos
usuarios a la vez, el cuello de botella medido con k6, la caché aplicada (catálogo, comunicados, portada e imágenes) y
sus resultados antes y después.

## 6. SOLID y patrones

- `docs/03-diseño-de-software/principios-diseño.md`: cada principio SOLID con el archivo del código que lo aplica.
- `docs/03-diseño-de-software/patrones-diseño.md`: Adaptador (RENIEC, Culqi, IA, SES y S3), Repositorio y Unidad de
  trabajo, Fábrica, Inyección de dependencias, Fachada, Observador (bandeja de eventos), Decorador (caché del catálogo)
  y Proxy (borrar la caché con cada cambio del panel), cada uno con sus archivos.

## 7. Pruebas automáticas, cobertura e integración continua

- **281 pruebas** del backend (unitarias y de integración) con **Jest 30**, como pide el enunciado. TypeScript se
  traduce con SWC (`@swc/jest`) y Jest carga el código como módulos ES; la configuración está en
  `apps/backend/jest.config.mjs`. Hasta el 20/11/2026 se usó Vitest; las 281 pruebas se migraron sin cambiar lo que
  comprueban.
- **Cobertura:** `npm run test:coverage -w @sia/backend` genera `apps/backend/coverage/index.html`. Última medición
  con Jest (20/11/2026, 281 pruebas en 35 archivos, todas aprobadas):

  | Métrica | Cubierto | Porcentaje |
  |---|---|---|
  | Líneas | 11 763 de 12 677 | 92,79 % |
  | Sentencias | 11 763 de 12 677 | 92,79 % |
  | Funciones | 722 de 806 | 89,57 % |
  | Ramas | 2769 de 3583 | 77,28 % |

  Jest cuenta las líneas de otra forma que Vitest (con Vitest la misma suite daba 88,28 % de líneas y 67,95 % de
  ramas); el código cubierto es el mismo.
- **Carpeta de pruebas:** `apps/backend/tests/`, separada en `unit/` e `integration/`, con su guía en
  `apps/backend/tests/README.md`.
- **Integración continua:** `.github/workflows/ci.yml` corre en cada envío a GitHub la revisión de tipos, las pruebas
  con cobertura (resumen en la página de la ejecución y reporte descargable `cobertura-backend`) y la compilación del
  portal. Estado: aprobado desde el commit `0c307e2` (20/11/2026). La compilación del portal fallaba desde el
  rediseño porque los estilos de la portada y del panel superaban el límite de 16 kB por componente; se subió a 32 kB.
  Resultados en https://github.com/DiegoCoras06/sia-unsch-admision/actions

## 8. Pruebas de calidad

### Postman (¿cada módulo funciona?)

`calidad/postman/SIA-UNSCH.postman_collection.json`: 62 peticiones en 14 carpetas (una por módulo, salud y errores
esperados). Cada petición comprueba el código de respuesta, que responda en 3 s o menos y la forma de los datos. Las
carpetas de solo lectura pasaron completas con Newman el 20/11/2026: 22 peticiones, 70 de 70 comprobaciones, promedio de
197 ms (`calidad/resultados/2026-11-20-postman-solo-lectura.txt`). Guía en
`calidad/postman/README.md`.

### k6 (¿cuántos usuarios soporta?)

| Prueba | Archivo de resultados |
|---|---|
| 1 y 10 usuarios, antes y después de la caché del catálogo | `calidad/resultados/2026-11-15-k6-rendimiento-*.txt` |
| 50 a 2000 usuarios, antes de la caché de contenidos | `calidad/resultados/2026-11-20-k6-carga-2000-sin-cache-contenidos.txt` |
| 50 a 2000 usuarios, con la caché de contenidos | `calidad/resultados/2026-11-20-k6-carga-2000.txt` |

Resultado con la caché de contenidos (1 597 216 peticiones, solo lectura, API en la computadora y base en RDS):

| Usuarios | Promedio | Mediana | p95 | Errores | Meta |
|---|---|---|---|---|---|
| 50 | 2 ms | 1 ms | 5 ms | 0 % | Cumple |
| 100 | 3 ms | 2 ms | 8 ms | 0 % | Cumple |
| 250 | 21 ms | 2 ms | 25 ms | 0 % | Cumple |
| 500 | 7 ms | 1 ms | 32 ms | 0 % | Cumple |
| 1000 | 16 ms | 4 ms | 70 ms | 0 % | Cumple |
| 1500 | 241 ms | 196 ms | 482 ms | 0 % | Cumple |
| 2000 | 503 ms | 494 ms | 589 ms | 0 % | Cumple |

Con 2000 usuarios simultáneos, p95 de 0,59 s y 0 % de errores: cumple la meta de EQ-01 (3 s) en todas las etapas. Sin la
caché de contenidos solo cumplía hasta 50 usuarios; la comparación y su análisis están en
`docs/03-diseño-de-software/base-de-datos-y-cache.md`.

### Verificación automática por atributo

`node calidad/verificar.mjs` corre npm audit, todas las pruebas agrupadas por atributo de calidad (AC04 a AC10) y la
revisión de tipos, y escribe el reporte del día en `calidad/resultados/`. Último reporte:
`calidad/resultados/2026-11-20.md` (281 pruebas aprobadas, 0 vulnerabilidades, tipos sin errores; AC01 y AC03 con el
resultado de k6).
