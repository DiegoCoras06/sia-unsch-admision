# ADR-003: Frontend Angular SPA única con carga diferida por área

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** Constitución IV y VI, RNF-01, RNF-13, RNF-14

## Contexto

Hay tres públicos (visitante, postulante y personal) con pantallas muy distintas. La mayoría de postulantes entra desde el celular con redes móviles. El stack fue fijado en la guía maestra (Angular + TypeScript).

## Decisión

Una sola aplicación **Angular** (versión estable vigente) con:

- **Componentes standalone** y **signals** para el estado local.
- Rutas con **carga diferida** por área: `public`, `postulante`, `admin`.
- **Formularios reactivos** con validaciones que reflejan las del backend.
- Un **sistema de diseño UNSCH** propio en `shared/` (guinda, dorado, blanco), sin depender de una librería de componentes pesada.
- **Prerenderizado** de las páginas públicas estáticas (inicio, programas, tasas, requisitos) para mejorar la carga inicial y el SEO.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Tres aplicaciones separadas | Aislamiento total | Triple configuración y despliegue; duplicación del sistema de diseño | Sin beneficio suficiente |
| React o Next.js | Ecosistema amplio | Fuera del stack decidido por el equipo | Constitución IV |
| Angular Material completo | Componentes listos | Estética genérica y más peso | Se usarán solo las utilidades de accesibilidad de Angular CDK |

## Consecuencias

**Positivas:**
- Un visitante solo descarga el código público.
- Tipos compartidos con el backend (DTO en TypeScript).

**Negativas / riesgos aceptados:**
- Más esfuerzo inicial para el sistema de diseño propio.

**Cómo verificamos que se cumple:**
- Presupuesto de tamaño de paquetes en `angular.json` (falla la compilación si se excede).
- Lighthouse en CI: rendimiento y accesibilidad ≥ 90 en el inicio.
