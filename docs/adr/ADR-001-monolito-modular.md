# ADR-001: Monolito modular con 14 módulos, no microservicios

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** Constitución III.1, RNF-07, RNF-09, tamaño del equipo, plazo del curso

## Contexto

El sistema tiene 14 áreas funcionales (M01–M14) con límites claros, pero los flujos críticos las cruzan: confirmar un pago cambia una inscripción, y una inscripción depende de la convocatoria, del postulante y de su expediente. El equipo es pequeño, el plazo es un semestre y la carga es estacional (picos breves en inscripción y resultados).

## Decisión

Construiremos **un solo backend desplegable** organizado en **14 módulos** con fronteras explícitas. Cada módulo tiene su carpeta, su API pública (`index.ts`) y sus propias tablas. Las funcionalidades de `specs/` son cortes verticales que pueden tocar varios módulos.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| 14 microservicios | Despliegue y escalado independientes | 14 despliegues, red entre servicios, transacciones distribuidas (sagas) para pagos e inscripciones, mucha infraestructura | Complejidad desproporcionada; pone en riesgo RNF-09 |
| Monolito por capas sin módulos | Lo más simple de empezar | Las reglas de todos los dominios se mezclan; difícil de evolucionar | No cumple RNF-07 |
| 3 servicios (admisión, evaluación, soporte) | Menos servicios | Cortes arbitrarios; pagos e inscripción seguirían cruzando servicios | Sin beneficio claro sobre el monolito modular |

## Consecuencias

**Positivas:**
- Transacciones locales de base de datos para los flujos críticos.
- Un solo pipeline, un solo despliegue, depuración sencilla.
- Si en el futuro un módulo lo necesita (p. ej. Chatbot), puede extraerse como servicio porque ya tiene fronteras definidas.

**Negativas / riesgos aceptados:**
- Un error grave puede afectar a todo el backend.
- Las fronteras se pueden erosionar si no se vigilan → mitigado en ADR-002.

**Cómo verificamos que se cumple:**
- Regla de ESLint que prohíbe importar archivos internos de otro módulo.
- Revisión de cada `design.md` en la *Verificación de la constitución*.

**Actualización (06/11/2026):** el sistema trabaja con 12 módulos. Inscripción Ordinaria y Exonerados son un solo módulo; también Exámenes, Sedes y Aulas. La decisión de monolito modular no cambia. Numeración y equivalencia: [diseño interno](../03-diseño-de-software/diseño-interno-modulos.md).
