# Validación local de escalabilidad de base de datos — 26/11/2026

## Objetivo

Comprobar que PostgreSQL, el pool acotado de conexiones y las restricciones de integridad soportan concurrencia de
lectura y escritura sin colisiones ni registros duplicados. La prueba usa PostgreSQL 16 temporal; nunca utiliza RDS.

## Procedimiento reproducible

```powershell
npm test -w @sia/backend -- tests/integration/database-scalability.test.ts
```

La prueba se encuentra en `apps/backend/tests/integration/database-scalability.test.ts` y se ejecuta también en CI como
parte de la suite Jest. Cada cliente de escritura usa una IP sintética diferente para medir la base sin que el límite de
10 inscripciones por IP y hora interrumpa el escenario.

## Resultados

| Escenario                      |                                     Resultado |        Tiempo local | Criterio               |
| ------------------------------ | --------------------------------------------: | ------------------: | ---------------------- |
| Lecturas públicas concurrentes |                     100 respuestas, 0 errores |            1 410 ms | < 10 s                 |
| Inscripciones concurrentes     |      12 creadas, 12 códigos únicos, 0 errores |              628 ms | < 15 s                 |
| Carrera con el mismo documento | 1 creada, 7 conflictos HTTP 409, 0 duplicados | incluido en 4,814 s | exactamente 1 registro |

La suite específica aprobó **3 de 3 pruebas** en 4,814 s. Después se ejecutó la suite completa con cobertura:

- 40 archivos de prueba aprobados;
- 308 pruebas aprobadas y 0 fallidas;
- 91,01 % de líneas y sentencias;
- 90,36 % de funciones;
- 77,51 % de ramas.

## Interpretación

- El pool encola correctamente más solicitudes que conexiones disponibles y no las pierde.
- El contador PostgreSQL genera códigos de postulante distintos aun cuando las transacciones se ejecutan a la vez.
- La restricción única de convocatoria, tipo y número de documento evita inscripciones dobles en una carrera real.
- Los conflictos esperados se traducen a HTTP 409; no aparecen errores 500 ni filas parcialmente creadas.

## Alcance

Este resultado valida la estrategia antes del despliegue. La capacidad definitiva de RDS debe medirse en Sprint 3 sobre
una copia restaurada, desde la misma región de AWS y con métricas de CPU, conexiones, latencia, IOPS y bloqueos. No se
deben ejecutar escrituras de carga sobre la base RDS que contiene datos reales.
