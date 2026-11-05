# ADR-023: Portal instalable y boleto de examen sin conexión

**Estado:** Aceptado
**Fecha:** 05/11/2026
**Modifica:** [ADR-003](ADR-003-frontend-angular-spa.md) (el frontend pasa a ser una aplicación web instalable)
**Impulsores:** AC07 Usabilidad, RC01, spec 006 («Buscar aula»); el día del examen la red celular en la puerta de la Ciudad Universitaria se satura

## Contexto

El postulante necesita su aula y asiento justo en la puerta del campus, donde miles de personas usan la misma red celular. «Buscar aula» depende del API: sin señal, no hay boleto.

## Decisión

1. **Portal instalable:** manifiesto, iconos y `@angular/service-worker`, activo solo en producción. Guarda la aplicación y, al usarlas, las imágenes.
2. **El service worker no guarda respuestas del API** (`ngsw-config.json` no tiene `dataGroups`): no quedan datos personales en la caché y el proceso nunca muestra cifras viejas como si fueran actuales.
3. **Boleto por decisión del postulante:** el botón «Guardar en este celular» guarda en `localStorage` solo lo que muestra el boleto (código, examen, horario, aula, asiento). No guarda nombre, DNI ni foto, porque el equipo puede ser compartido.
4. El boleto se puede quitar y se borra solo un día después del examen.
5. `ExamTicket` solo recibe datos, sin consultar al API, así se dibuja igual con o sin internet.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Guardar las respuestas del API en el service worker | Sin botón | Deja datos personales en el dispositivo sin que el usuario lo decida | Incumple AC11 Privacidad |
| Guardar el boleto automáticamente | Un paso menos | En un equipo compartido o una cabina, el siguiente lo vería | El guardado debe ser una decisión |
| Solo el PDF | Ya existe | Hay que descargarlo antes y buscarlo en el celular | Se mantiene como respaldo |

## Consecuencias

**Positivas:**
- El boleto se ve sin señal, y el portal se instala como una aplicación.

**Negativas / riesgos aceptados:**
- Si el aula cambia después de guardar (RF-08.09), el boleto queda desactualizado. El correo de cambio de aula sigue siendo el aviso oficial, y con internet una nueva consulta muestra el dato vigente.
- Una versión nueva llega en la visita siguiente, no en la actual.
- El service worker exige HTTPS: la instalación solo funcionará desplegado (Paso 11) o en `localhost`.

**Cómo verificamos que se cumple:**
- `ng build` genera `ngsw.json` y `ngsw-worker.js`; revisar que no incluya rutas `/api`.
- Prueba en el navegador: guardar, recargar sin datos del API, quitar y vencimiento.
- Pendiente al desplegar: instalar en un celular real y abrir el boleto en modo avión.
