# Diseño — Resultados, admitidos y constancia de ingreso

> **SDD (Spec-Driven Development) · artefacto 2 de 3: diseño** (cómo se construye).
> Anterior: [requirements.md](requirements.md) · Siguiente: [tasks.md](tasks.md). Arquitectura general: [docs/arquitectura.md](../../docs/arquitectura.md) y [ADR](../../docs/adr/README.md).


## 1. Plan técnico

**Rama:** `007-resultados-ingreso` · **Fecha:** 26/10/2026 · **Spec:** [requirements.md](requirements.md) · **Módulo:** M09 Resultados

### Resumen

Módulo nuevo `resultados` (esquema PostgreSQL `resultados`):

1. **Importación** (H1): CSV de la lectora óptica `codigo,conocimientos,aptitud,actitud,observacion`. Se valida todo antes de procesar: código inexistente o de otro examen, duplicado, ausente con nota, aciertos fuera de rango, presente sin registro. `MAL_LLENADA` → **No calificable** (RN-41). Con inconsistencias el lote queda «Con errores» y no se procesa.
2. **Cálculo** (H2): puntaje = aciertos × puntos × factor del examen (M07, configurable; RN-31 a RN-34), sin descuento por error. Orden de mérito por programa y categoría (modalidad/submodalidad). Condición: **Admitido** (≥ 450 y dentro de las vacantes; empatados en el último puesto todos admitidos, RN-51), **No admitido**, **Ausente**, **No calificable**, **Sin derecho a vacante** (RN-13). Vacantes de exonerados no cubiertas pasan al ordinario del mismo programa (RN-05); nunca a otro programa (RN-04). Función pura probada sin base.
3. **Aprobación y publicación** (H3): versiones `BORRADOR → EN_APROBACION → PUBLICADA` (y `REEMPLAZADA`). Quien aprueba no puede ser quien envió (segregación). Visibles desde la fecha y hora autorizadas. Una rectificación crea otra versión con motivo y auditoría.
4. **Consulta** (H4): con DNI + código: puntaje, desglose, puesto, condición; admitido: felicitación, plazos de entrega y documentos. Lista pública de admitidos sin DNI.
5. **Ingreso** (H5): Admisión registra la entrega de documentos y el pago de la constancia (S/ 15.00; recargo S/ 65.00 si es extemporánea) → **Ingresante** con constancia PDF y QR verificable. Vencido el plazo, el admitido sin entrega pasa a **Admisión perdida** (RN-55) y la vacante no se cubre (RN-56).
6. **Reportes** (H6): Excel de resultados (ingresantes, no admitidos, ausentes) y cobertura de vacantes por programa y modalidad.
7. **Revisión** (H7): solicitud por error material → caso de atención `RESULT_REVIEW` (RN-57: los resultados son inimpugnables).

### Decisiones

| Tema | Decisión |
|---|---|
| Datos de otros módulos | Puertos: M07 entrega examen, calificación y asistencia; M03 entrega datos de aptos (programa, categoría, sin derecho a vacante); M01 entrega vacantes por categoría. |
| Publicación diferida | El ciclo del servidor (`results.tick`) marca la hora de aviso y encola los correos «resultados disponibles» (sin puntaje, M11). |
| Constancia de ingreso | Pago registrado por Admisión con el número de recibo de caja (no pasa por la pasarela: la orden de pago es única por inscripción). |
| Permisos | `resultados.gestionar` (operador), `resultados.aprobar` (Comisión), `ingreso.registrar` (entrega de documentos). |

## 2. Actualizaciones de diseño (27 y 28/10/2026)

- El asistente virtual informa el puntaje, el puesto y la condición cuando se publican los resultados (RF-10.08).

## Resultado con la condición como foco (30/10/2026, skill interface-design)

- En «Ver puntaje» (`features/resultados/my-result.ts`), el bloque del resultado pone la **condición** como foco («Ingresó», «No alcanzó vacante», etc.) con un color sobrio según el caso (verde para ingresó, tonos neutros para los demás; nunca rojo), el programa y la modalidad. Al lado, el **puntaje** en grande con una **regla de 0 a 1000** y la marca del **mínimo** (450); debajo, el **puesto** («12 de 340») y las **vacantes**. El lector de pantalla oye el mínimo en texto.
- Verificado en escritorio y celular (375 px, sin desborde) con respuestas simuladas (admitido y no admitido), porque los resultados se publican el día del examen.
