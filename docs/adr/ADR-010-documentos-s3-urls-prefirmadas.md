# ADR-010: Documentos en S3 privado con URLs prefirmadas de corta duración

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** RNF-03, specs 003 y 004, límite de 6 MB de carga útil de Lambda

## Contexto

Se manejan fotos (240 × 320), expedientes en PDF de hasta 5 MB por documento y fichas generadas. Son datos personales. Lambda tiene un límite de tamaño de solicitud que hace inviable recibir archivos grandes a través de la API.

## Decisión

- Bucket S3 **privado** con bloqueo de acceso público y cifrado.
- **Carga directa desde el navegador** con **URL prefirmada PUT** de 5 minutos, emitida por la API solo después de validar que el usuario puede cargar ese documento, con tipo de contenido y tamaño máximo fijados en la firma.
- Tras la carga, la API **verifica** el archivo (tipo real por *magic bytes*, tamaño, dimensiones de la foto) antes de marcarlo como válido.
- **Descarga** con **URL prefirmada GET** de 5 minutos tras verificar permisos.
- Claves no adivinables: `convocatorias/{id}/postulantes/{uuid}/{documento}/{version}-{uuid}.pdf`.
- La base de datos guarda solo metadatos (clave, tipo, tamaño, hash SHA-256, versión, estado).
- En local (sin Docker, ADR-014), un adaptador `LocalFileStorage` implementa el mismo puerto `FileStorage` guardando en `apps/backend/.dev-storage/` y emitiendo URLs firmadas con HMAC servidas por la propia API.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Subir a través de la API | Control total | Límite de Lambda, costo y latencia | No viable |
| Guardar archivos en PostgreSQL | Transaccional | Base de datos pesada y costosa | Mala práctica |
| Bucket público con nombres aleatorios | Simple | Exposición de datos personales | Incumple RNF-03 |

## Consecuencias

**Positivas:**
- Archivos grandes sin pasar por Lambda.
- Ningún enlace permanente a documentos personales.

**Negativas / riesgos aceptados:**
- Un archivo puede quedar cargado sin confirmarse → regla de ciclo de vida que elimina cargas no confirmadas en 24 h.

**Cómo verificamos que se cumple:**
- Prueba: una URL de descarga vencida responde 403.
- Prueba: un PDF renombrado como `.jpg` es rechazado.
