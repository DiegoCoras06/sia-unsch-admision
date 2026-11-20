# Comportamiento de la base de datos y análisis de la caché (Sprint 2)

Este documento explica cómo usa la base de datos el SIA-UNSCH, qué pasa con ella cuando hay muchos usuarios a la vez
y por qué se aplicó una caché. Las cifras salen de las pruebas de `calidad/` (k6 y Postman) y del código actual.

## 1. La base de datos

| Aspecto | Decisión |
|---|---|
| Motor | PostgreSQL 18 en **Amazon RDS** (us-east-2, Ohio), con SSL verificado contra el certificado de AWS |
| Acceso | Prisma 7 con el adaptador `pg` (`shared/db/prisma.ts`), un solo cliente por proceso |
| Organización | **Un esquema por módulo** (12 esquemas más `shared`), 78 tablas y 19 migraciones. Un módulo no lee las tablas de otro: la prueba de arquitectura lo vigila (AC05) |
| Conexiones | Pool de 5 conexiones con la API en la computadora (`DB_MAX_CONNECTIONS=5`), 10 por defecto y 1 por instancia en AWS Lambda (ADR-005) |
| Respaldo | Copias automáticas de RDS y restauración a un momento dado (AC09) |

Tablas por esquema: convocatorias 24, usuarios 13, seguridad 11, exámenes 10, pagos 10, configuración 8, resultados 8,
inscripciones 5, expedientes 5, notificaciones 5, asistente 4 y shared 3 (contadores, límites de peticiones y bandeja de
eventos).

## 2. Cómo se protege la integridad cuando hay concurrencia (AC06)

Durante la inscripción muchas personas escriben a la vez. Estas son las reglas que evitan datos duplicados o
inconsistentes, todas dentro de la base y no en la memoria de la API, para que valgan aunque haya varias instancias:

| Riesgo | Cómo se evita | Dónde |
|---|---|---|
| Dos inscripciones de la misma persona | Restricción única (convocatoria, tipo y número de documento, modalidad) | `inscripciones.applications` |
| Dos postulantes con el mismo código | Contador atómico `INSERT … ON CONFLICT DO UPDATE … RETURNING` en una sola sentencia | `shared/db/counters.ts` |
| Un pago registrado dos veces | Restricción única del número de transacción y de la orden; `settle` del repositorio de pagos | `pagos.payment_attempts`, `PaymentRepository` |
| Inscripción guardada a medias | Unidad de trabajo: la inscripción, sus datos y su evento se guardan en una sola transacción | `InscriptionRepository` con `UnitOfWork` |
| Un correo o evento enviado dos veces | Bandeja de eventos con `FOR UPDATE SKIP LOCKED`: cada evento lo toma un solo proceso | `shared/events/outbox.ts` |
| Abuso de formularios públicos | Contador por ventana con `ON CONFLICT`, también atómico | `shared/rate-limit/rate-limiter.ts` |
| Cambios del panel sin rastro | Cada operación crítica escribe su evento de auditoría en la misma transacción (AC10) | `seguridad.audit_events` |

Si la base no responde, la API contesta **503** con `Retry-After` en lugar de colgarse (AC09).

## 3. El problema que encontró la prueba de carga

La primera medición con k6 (15/11/2026) se hizo con la API en la computadora del equipo (Perú) y la base en RDS (Ohio):

| Usuarios | Peticiones en 1 minuto | Promedio | p95 |
|---|---|---|---|
| 1 | | 3455 ms | 9870 ms |
| 10 | 95 | 8347 ms | 21 894 ms |

Dos causas, medidas y no supuestas:

1. **Distancia.** Cada consulta cruza el continente (entre 0,7 y 2 s ida y vuelta en las consultas de varias tablas).
2. **Pocas conexiones.** Con un pool de 5, la sexta consulta simultánea espera a que se libere una. Con 10 usuarios que
   piden 4 cosas cada uno, la cola crece y el tiempo se multiplica.

Lo que más se pedía era siempre lo mismo: la convocatoria, sus etapas, los programas, las vacantes y las tasas. Son
datos que **casi nunca cambian** durante la inscripción y que **todos** los visitantes leen.

## 4. La caché aplicada

### 4.1 En la memoria de la API (catálogo de Convocatorias)

`CachedConvocatoriasRepository` (patrón **Decorador**) envuelve al repositorio de Prisma con la misma interfaz:

| Comportamiento | Detalle |
|---|---|
| Qué guarda | Convocatoria vigente, etapas, opciones, vacantes, submodalidades, tasas, requisitos y temario |
| Cuánto dura | 5 minutos por dato |
| Precarga | Al arrancar la API y cada 4 minutos, así el primer visitante no espera |
| Consultas simultáneas | Si 100 personas piden lo mismo y no está guardado, se hace **una** consulta y las 100 comparten el resultado |
| Errores | No se guardan: si la base falla, la siguiente petición vuelve a intentar |
| Cambios del panel | Cada cambio del personal en la convocatoria borra la caché y la vuelve a cargar al instante |
| Pruebas | En el entorno de pruebas dura 0 s, para que cada prueba vea la base real |

### 4.2 En el navegador y en la CDN (cabeceras HTTP)

Unas 16 rutas públicas de lectura (catálogo, portada, comunicados, imágenes e ingresantes) responden con
`Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=300` o un tiempo parecido según cuánto cambia
el dato: el navegador reusa la respuesta hasta 1 minuto y una CDN (CloudFront, en el despliegue) la sirve varios minutos
sin llegar a la API.

### 4.3 Qué no se guarda en caché

Todo lo personal o que cambia con cada operación: inscripciones, pagos, sesiones, expedientes, resultados del
postulante, auditoría y el panel. Siempre se lee de la base, porque un dato viejo ahí sería un error.

### 4.4 Por qué no Redis (ADR-005)

Hoy la API corre en una sola instancia, así que la memoria del proceso basta. Redis solo hace falta si varias instancias
deben compartir la caché; queda previsto, y el cambio sería otro Decorador con la misma interfaz, sin tocar los servicios
(principio abierto/cerrado).

## 5. Resultados con la caché

Misma prueba, mismas rutas, misma computadora y misma base (15/11/2026):

| Usuarios | Peticiones en 1 minuto | Promedio | p95 | Errores |
|---|---|---|---|---|
| 1 | | 40 ms | 135 ms | 0 % |
| 10 | 3144 | 26 ms | 135 ms | 0 % |

El p95 con 10 usuarios bajó de **21,9 s a 0,135 s** (unas 160 veces menos) y la API atendió 33 veces más peticiones.

### 5.1 Carga progresiva hasta 2000 usuarios (Sprint 2)

Prueba `calidad/k6/carga-2000.js` (20/11/2026), solo lectura, con la API en la computadora del equipo y la base en
RDS. Cada usuario pide 4 rutas por segundo: convocatoria, opciones y submodalidades (en la caché) y comunicados
(**sin caché**, va a la base). 255 085 peticiones en total. Resultado completo en
`calidad/resultados/2026-11-20-k6-carga-2000.txt`.

| Usuarios | Promedio | Mediana | p95 | Errores | Meta (p95 de 3 s y menos de 1 % de errores) |
|---|---|---|---|---|---|
| 50 | 878 ms | 3 ms | 2981 ms | 0 % | Cumple |
| 100 | 1611 ms | 3 ms | 6497 ms | 0 % | No cumple |
| 250 | 4478 ms | 3 ms | 18 114 ms | 0 % | No cumple |
| 500 | 7508 ms | 3 ms | 30 000 ms | 25 % | No cumple |
| 1000 | 30 000 ms | 30 000 ms | 30 001 ms | 100 % | No cumple |
| 1500 | 1139 ms | 0 ms | 0 ms | 99,6 % | No cumple |
| 2000 | 6049 ms | 0 ms | 30 023 ms | 91,2 % | No cumple |

**Lectura de los resultados:**

1. **La caché funciona.** La mediana se mantuvo en 3 ms hasta 500 usuarios: tres de cada cuatro peticiones (las del
   catálogo) se respondieron desde la memoria sin tocar la base.
2. **El cuello de botella es la ruta sin caché.** Los comunicados tardan unos 1,6 s por consulta (Perú a Ohio) y solo hay
   5 conexiones: la API puede atender unas 3 por segundo, pero 100 usuarios piden 100 por segundo. La cola crece, el p95
   sube y con 500 usuarios exactamente el **25 %** de las peticiones (una de cada cuatro, los comunicados) vence a los 30 s.
3. **Desde 1000 usuarios el límite es la computadora.** La misma máquina crea los usuarios y atiende la API en un solo
   proceso; Windows se quedó sin puertos de red («Solo se permite un uso de cada dirección de socket») y la API quedó
   ocupada vaciando la cola hasta reiniciarla. Esto no mide a RDS ni al sistema desplegado.

**Conclusión:** el sistema cumple la meta hasta 50 usuarios en esta configuración, y el primer límite está en las
lecturas que todavía van a la base. La siguiente mejora es guardar en caché los contenidos públicos (comunicados,
portada e imágenes) igual que el catálogo, y repetir la prueba desde una máquina distinta o con la API desplegada.

## 6. Recomendaciones para el pico real de inscripción (10 000 a 15 000 personas)

1. **CloudFront** delante de la API para las rutas públicas: la mayoría de las lecturas ni llegarían a la API.
2. **RDS Proxy** para repartir pocas conexiones entre muchas instancias de Lambda.
3. Subir el tamaño de la instancia de RDS solo durante las semanas de inscripción.
4. Cambiar el contador del código de postulante por una `SEQUENCE` de PostgreSQL si ese contador se vuelve el cuello de botella.
5. Mover el límite de peticiones a AWS WAF y subir las fotos directamente a S3 con URL firmada.
6. Enviar los correos por la cola (SQS) para que la inscripción no espere al correo.
7. Repetir esta prueba con la API ya desplegada en la misma región que RDS, que es la medición válida para EQ-01 y EQ-03.
