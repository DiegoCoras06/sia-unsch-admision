---
target: portal de admisión UNSCH (cuarta crítica tras P1 y P2 de la tercera)
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\diego\\OneDrive\\Desktop\\proyectofinal\\apps\\frontend\\src\\app"
timestamp: 2026-10-29T06-31-30Z
slug: apps-frontend-src-app
---
# Cuarta crítica del portal de admisión UNSCH 2027-I (tras P1 y P2 de la tercera)

## Heurísticas — 28/40 (bueno; 27 → 28 → 28 → 28)
| # | Heurística | Puntaje | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | Buscar aula y Resultados piden DNI antes de decir que aún no se publica |
| 2 | Mundo real | 3 | Botón «Buscar documentos» en Mi inscripción; «34 programas» frente a 40 opciones |
| 3 | Control y libertad | 3 | — |
| 4 | Consistencia | 2 | Contactos en «usted»; títulos de pestaña distintos; «Contraloria» sin tilde; bordes de campo de bajo contraste |
| 5 | Prevención de errores | 2 | La modalidad (y si está abierta) se elige recién en el paso 4 |
| 6 | Reconocer y no recordar | 3 | — |
| 7 | Flexibilidad | 3 | Sin enlace de la calculadora al formulario con la carrera elegida |
| 8 | Estética | 3 | «Tus datos» repetido tres veces; el águila flota sobre texto |
| 9 | Errores | 3 | Resumen al final del paso, enlaces por grupo, mensajes genéricos; cuenta 13 frente a 16 marcados |
| 10 | Ayuda | 3 | Contactos sin teléfono; Facebook y Portal Web no son enlaces |

## Especificidad
No parece plantilla (contenido local: lápiz 2B, puertas, recargo, calculadora). Queda molde: trío 1677/34/1803, bloque del rector, cuenta regresiva hacia el examen de exonerados en vez del cierre de inscripción.
Detector: 8 avisos (6 broken-image falsos positivos; 2 en contact.ts deliberados). Navegador: /inscripcion desborda a 375 px (387–388 px) por `.steps__list` repeat(4, auto) 1fr y `.main` sin minmax; enlaces del pie y de carreras de 20 px; líneas de 87–115 caracteres en cronograma, /pasos y pie. Sin problemas: placeholders ≥ 4,5:1, alt, nombres accesibles, foco visible al tabular, consola limpia, portada ~40 KB de imágenes al cargar (WebP).

## Problemas prioritarios
- [P1] /inscripcion desborda a 375 px → minmax(0, …) en la barra de pasos y en `.main`/`.layout`.
- [P1] Resumen de errores lejano, por grupo y con mensajes genéricos → mensajes específicos, conteo coherente.
- [P1] Asistente tapa texto en el celular (fuera del foco de campo y con el menú abierto) → ocultarlo con el menú abierto y en la inscripción en el celular.
- [P2] Modalidad elegida tarde → preguntar la modalidad al inicio y avisar cierres.
- [P2] «34 programas» vs 40 opciones; Buscar aula/Resultados sin fecha de publicación arriba.
- [P3] Contactos/Denuncias: bordes 1,4:1, sin teléfono, «Contraloria», tuteo; «Buscar documentos».

## Personas
Jordan: cuenta regresiva equivocada, desborde, águila, sin teléfono. Sam: «Lugar de nacimiento» leído dos veces; ubigeo y radios de sexo sin mensaje ligado. Casey: cargas de 5 s; borrador con DNI 30 días en una cabina pública.

## Preguntas
¿Cuenta regresiva al cierre de inscripción? ¿Borrador en cabinas públicas? ¿Denuncia con código de seguimiento en vez de correo?
