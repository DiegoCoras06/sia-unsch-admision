# Pruebas automáticas del backend

281 pruebas en 35 archivos, con **Jest** 30 (TypeScript traducido con SWC; configuración en `jest.config.mjs`).
Cada archivo importa lo que usa desde `@jest/globals` (`describe`, `it`, `expect`, `jest.fn`).

## Cómo correrlas

Desde la raíz del proyecto:

| Comando                                        | Qué hace                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `npm test -w @sia/backend`                     | Corre todas las pruebas                                                            |
| `npm run test:coverage -w @sia/backend`        | Corre todas y genera el reporte de cobertura en `apps/backend/coverage/index.html` |
| `npm run test:watch -w @sia/backend`           | Las vuelve a correr cada vez que guardas un archivo                                |
| `npm test -w @sia/backend -- tests/unit/pagos` | Corre solo una carpeta o un archivo                                                |

Las pruebas de integración usan una base PostgreSQL temporal (puerto 5434) que se crea al empezar y se borra al terminar
(`global-setup.ts` y `global-teardown.ts`). **Nunca tocan RDS.** También corren en GitHub Actions con cada envío (`.github/workflows/ci.yml`).

## Estructura

```
tests/
├── global-setup.ts        Crea la base temporal de pruebas y carga la semilla
├── global-teardown.ts     La detiene y la borra al terminar
├── helpers.ts             Arma la API de prueba (testApp) con reloj controlado
├── unit/                  Pruebas unitarias: una regla o una clase, sin base de datos
│   ├── arquitectura/      Límites entre los 12 módulos y documentación OpenAPI completa
│   ├── convocatorias/     Etapas, cálculo de tasas y caché del catálogo
│   ├── examenes/          Distribución de postulantes en aulas
│   ├── inscripciones/     Puntaje de la encuesta SUS
│   ├── pagos/             Adaptador de Culqi
│   ├── resultados/        Ranking y desempates
│   ├── seguridad/         Política de sesiones
│   ├── usuarios/          Reglas de cuentas y adaptador de APIPerú (RENIEC)
│   ├── email/ y storage/  Adaptadores de Amazon SES y S3
│   └── shared/            Caché en memoria y respuesta 503 si la base no responde
└── integration/           Pruebas de integración: peticiones HTTP reales a la API con la base temporal
    ├── portal.test.ts             Convocatoria, programas, tasas, comunicados
    ├── inscriptions.test.ts       Inscripción ordinaria
    ├── ficha.test.ts              Ficha de inscripción en PDF
    ├── payments.test.ts           Pagos e idempotencia
    ├── pago-culqi.test.ts         Pago con Culqi (tarjeta y Yape)
    ├── treasury.test.ts           Tesorería y conciliación
    ├── admin.test.ts              Panel, roles y permisos (403)
    ├── results.test.ts            Calificación e ingresantes
    └── …                          Cuentas, sesiones, expedientes, exámenes, notificaciones, asistente, encuesta
```

## Pruebas por atributo de calidad

`node calidad/verificar.mjs` corre estas mismas pruebas y las agrupa por atributo (AC04 Seguridad, AC05
Mantenibilidad, AC06 Integridad, AC08 Interoperabilidad, AC09 Confiabilidad, AC10 Auditabilidad). Ver `calidad/README.md`.
