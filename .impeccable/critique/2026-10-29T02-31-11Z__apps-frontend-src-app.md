---
target: portal de admisión UNSCH (tercera crítica tras P1 y P2)
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:C:\\Users\\diego\\OneDrive\\Desktop\\proyectofinal\\apps\\frontend\\src\\app"
timestamp: 2026-10-29T02-31-11Z
slug: apps-frontend-src-app
---
# Tercera crítica del portal de admisión UNSCH 2027-I (tras resolver P1 y P2 de la segunda)

## Heurísticas — 28/40 (bueno; antes 27 → 28)
| # | Heurística | Puntaje | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | La portada muestra «0 Ciencias» y «No hay comunicados» mientras carga |
| 2 | Mundo real | 3 | Denuncias usa «usted» y tono de oficina; «Reinscripción» sin explicar |
| 3 | Control y libertad | 3 | Esc no devuelve el foco al botón del menú |
| 4 | Consistencia | 2 | Denuncias con otro sistema visual (radios, sombras, mayúsculas); enlaces repetidos en menú, barra lateral y pie |
| 5 | Prevención de errores | 3 | Sin ejemplo del formato del código de postulante |
| 6 | Reconocer y no recordar | 3 | En celular los pasos 2–5 solo muestran número |
| 7 | Flexibilidad | 2 | Sin atajo «ya me inscribí → pagar» en la portada |
| 8 | Estética | 3 | Portada muy larga (34 programas listados) |
| 9 | Errores | 3 | El resumen por subgrupo no dice qué campo falta |
| 10 | Ayuda | 3 | Buscar aula sin la fecha concreta de publicación |

## Especificidad
Específico: campos guinda y dorado, Archivo grande, fotos reales con crédito, fechas en hora de Lima, calculadora. Genérico: /denuncias (y /contacto, deliberado) con tarjetas redondeadas, sombras y banda azul.
Detector: 8 avisos (6 broken-image falsos positivos; 2 en contact.ts deliberados). Navegador: /contacto desborda a 375 px (468 px de ancho, correos largos y pistas 1fr); botones «×» de 22–26 px; .link-arrow y radios de 28 px; .foot__legal ~113 caracteres. Placeholders ≥ 4,5:1, sin imágenes sin alt, sin errores de consola.

## Problemas prioritarios
- [P1] /contacto desborda horizontalmente en el celular → minmax(0,1fr) y overflow-wrap en correos.
- [P1] Pasos 2–5 sin nombre accesible en el celular → .sr-only en vez de display:none.
- [P1] Estados vacíos falsos mientras carga la portada → estado cargando/listo/error.
- [P1] /denuncias quita el anillo de foco y usa otro lenguaje visual → .input/.btn globales, tuteo, obligatorios marcados.
- [P2] Asistente/globo tapa contenido en escritorio; botones «×» pequeños.
- [P2] Imágenes pesadas sin srcset ni WebP; escudo PNG de 500 px.
- [P3] .reveal deja secciones en blanco al bajar rápido; nota legal muy ancha.

## Personas
Jordan: Inscripción vs Reinscripción sin explicar; portada larga. Sam: pasos sin nombre en móvil; foco invisible en Denuncias; Esc sin retorno de foco. Casey: «0 programas» al cargar; ~2 MB de JPG; secciones en blanco.

## Preguntas
¿Selector «¿Qué vienes a hacer hoy?» en la portada? ¿Qué gana Denuncias con un sistema visual propio? ¿Qué resuelve el asistente que la página no diga?
