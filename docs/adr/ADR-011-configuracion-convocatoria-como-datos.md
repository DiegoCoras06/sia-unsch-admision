# ADR-011: Reglas variables de la convocatoria como datos versionados, no como código

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** Constitución II.2, RNF-07, spec 008 (Historia 1), aclaraciones del 25/10/2026

## Contexto

Cada convocatoria cambia fechas, tasas, recargos, vacantes, submodalidades, documentos requeridos y valores de puntaje (incluida la futura Tabla 5). Hoy mismo hay aclaraciones provisionales (puntajes uniformes, recargo CEPRE de S/ 50) que cambiarán.

## Decisión

Separar **qué cambia por convocatoria** (datos) de **cómo se aplica** (código):

| Datos de configuración (tablas) | Lógica estable (dominio) |
|---|---|
| Etapas del cronograma con inicio y fin en hora de Lima | "¿Está abierta la etapa X ahora?" |
| Tasas por modalidad, submodalidad, gestión del colegio y condición; recargos (`65.00`, `recargo_cepre_extemporaneo = 50.00`) | Cálculo del monto (regla de §3 de `reglas-negocio.md`) |
| Vacantes por opción (`P01`–`P40`) y submodalidad | Orden de mérito, empates, mínimo y vacantes que pasan a ordinario |
| Puntaje por pregunta y factor por área (inicial: 9 / 5 / 1.0) | Cálculo del puntaje total |
| Documentos requeridos por submodalidad | Validación del expediente |

- Los datos de 2027-I se cargan con una **semilla** (`prisma/seed/2027-I/*.json`) generada a partir de `docs/reglas-negocio.md`.
- Una convocatoria **publicada** congela su configuración; los cambios posteriores requieren resolución y quedan auditados (RN-03).
- Una **copia** de convocatoria crea la siguiente a partir de la anterior.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Constantes en el código | Rápido | Cada convocatoria exige un despliegue | Incumple Constitución II.2 |
| Motor de reglas genérico (p. ej. json-rules-engine) | Muy flexible | Reglas difíciles de probar y leer | Sobrediseño |

## Consecuencias

**Positivas:**
- 2027-II se configura sin programar (SC-001 de spec 008).
- La Tabla 5 oficial se carga sin cambiar código.

**Negativas / riesgos aceptados:**
- Más pantallas de administración y validaciones de configuración.

**Cómo verificamos que se cumple:**
- Prueba: la semilla 2027-I reproduce los totales oficiales (926 vacantes ordinario, 1803 en total) y todos los montos de la Tabla 3.
