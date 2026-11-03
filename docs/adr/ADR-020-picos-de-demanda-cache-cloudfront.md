# ADR-020: Picos de demanda con caché en CloudFront antes que Redis

**Estado:** Aceptado
**Fecha:** 03/11/2026
**Modifica:** [ADR-005](ADR-005-postgresql-prisma.md) (la caché no es Redis) y [ADR-009](ADR-009-despliegue-aws-serverless.md) (comportamientos de caché de CloudFront)
**Impulsores:** EQ-01 y EQ-03 (rendimiento y escalabilidad, `docs/01-analisis-del-sistema/08-escenarios-atributos-calidad.md`), DA01, DA02, RC19 (bajo costo)

> No confundir con la fila ADR-020 de `docs/01-analisis-del-sistema/07-decisiones-arquitectonicas.md`, que pertenece a la numeración del sprint 1.

## Contexto

En los días críticos (cierre de inscripción y publicación de resultados) se esperan picos de unas **15 000 personas conectadas**. Con una petición cada 10 a 20 segundos por persona son entre 750 y 1 500 peticiones por segundo, y entre 150 y 450 instancias de Lambda a la vez.

Lambda escala sola; el límite es **PostgreSQL**: cada instancia abre una conexión y una `db.t4g.micro` admite del orden de 100. La mayor parte del tráfico del pico es de lectura pública e igual para todos: portada, convocatoria, programas, tasas, cronograma y la lista de admitidos.

## Decisión

1. **Las consultas públicas sin datos personales se sirven desde la caché de CloudFront.** `publicCache(segundos)` envía `Cache-Control: public, max-age=60, s-maxage=<segundos>, stale-while-revalidate=<segundos>`:
   - el navegador guarda como máximo 60 s, para que los cambios del panel se vean pronto;
   - CloudFront guarda `<segundos>` y, al vencer, sigue sirviendo la copia anterior mientras **una sola** petición la renueva, así el pico no llega en bloque a la base.

   | Ruta | CloudFront |
   |---|---|
   | `/content/home`, `/announcements`, `/calls/current`, `/calls/:code/*` (áreas, categorías, submodalidades, programas, tasas, requisitos, temario, documentos) | 300 s |
   | `/calls/:code/stats` | 3 600 s |
   | `/calls/:code/fee-quote`, `/results/admitted`, `/site-assets` | 60 s |

   Nunca se cachean las rutas con DNI o código de postulante (`/inscriptions/status`, `/results/me`, `/exam/room`, pagos) ni el panel (`no-store`).
2. **En el despliegue (Paso 11):** concurrencia reservada de Lambda acorde a las conexiones de la base, aumento del límite de Lambda de la cuenta, y subir la instancia de RDS solo durante los días pico.
3. **Redis queda descartado** mientras la prueba de carga no lo exija. Si el contador de intentos en PostgreSQL resultara un cuello de botella, se moverá a **DynamoDB** bajo demanda antes que a Redis.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Redis (ElastiCache) | Caché rápida y contadores atómicos | Costo fijo (unos US$ 12 al mes el nodo más pequeño; más en modo sin servidor), obliga a poner Lambda en la VPC | CloudFront resuelve las lecturas públicas sin servidor nuevo |
| RDS Proxy desde el inicio | Reparte pocas conexiones entre muchas Lambdas | Costo fijo mensual adicional | Se decide tras la prueba de carga (ADR-005) |
| Solo escalar Lambda | Sin cambios | La base se satura antes que Lambda | No resuelve el cuello de botella |

## Consecuencias

**Positivas:**
- En el pico, la base recibe del orden de una consulta por ruta pública por minuto, en lugar de miles.
- Costo adicional nulo: la caché de CloudFront va incluida en la distribución que ya define ADR-009.

**Negativas / riesgos aceptados:**
- Un cambio publicado desde el panel puede tardar hasta 5 minutos en verse en el portal (60 s en el navegador). La publicación de resultados y la tasa vigente tardan como máximo 1 minuto.
- La tasa mostrada por `fee-quote` puede tener hasta 1 minuto de retraso al cambiar de etapa; el monto que se cobra se recalcula en el servidor al inscribirse.

**Cómo verificamos que se cumple:**
- Pruebas de integración: `tests/integration/portal.test.ts` y `tests/integration/results.test.ts` revisan la cabecera `Cache-Control`.
- La distribución de CloudFront (Paso 11) usa una política de caché que respeta las cabeceras del origen e incluye la cadena de consulta en la clave.
- Prueba de carga con 15 000 usuarios virtuales antes del primer día crítico (EQ-01).
