---
target: portal de admisión UNSCH (segunda crítica tras dos rondas de pulido)
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\diego\\OneDrive\\Desktop\\proyectofinal\\apps\\frontend\\src\\app"
timestamp: 2026-10-29T02-12-40Z
slug: apps-frontend-src-app
---
# Segunda crítica del portal de admisión UNSCH 2027-I (tras dos rondas de pulido)

## Heurísticas — 28/40 (bueno; antes 27/40)
| # | Heurística | Puntaje | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | Cuenta regresiva sin «hasta el cierre de inscripción» |
| 2 | Mundo real | 2 | «Imprimir documentos» es el centro del postulante pero no lo dice; «Ver puntaje» escondido en «Contenido» |
| 3 | Control y libertad | 3 | Sin confirmación final con el programa en grande |
| 4 | Consistencia | 2 | Tres botones primarios; `.btn--gold` definido en 4 archivos |
| 5 | Prevención de errores | 3 | Programa en un select de 34 sin buscador |
| 6 | Reconocer y no recordar | 3 | Sin «¿Olvidaste tu código?» |
| 7 | Flexibilidad | 3 | Panel con 19 secciones sin grupos |
| 8 | Estética | 3 | «Inscribirme» 3 veces en la primera pantalla; cifras repetidas |
| 9 | Errores | 3 | Lista de >12 faltantes en el paso 1; errores sin aria-describedby |
| 10 | Ayuda | 3 | Infografías JPG con texto |

## Especificidad
Específico, por encima del promedio institucional (sistema propio, portada por fecha del examen, fotos reales, constancia con código dorado). Genérico: segunda mitad de la portada con cifras repetidas.
Detector: CLI 8 (6 broken-image falsos positivos por [src] de Angular; 2 bordes en contact.ts). Navegador: /, /inscripcion, /mi-inscripcion limpias salvo line-length de `.foot__legal` (~112 caracteres, site-footer.ts:52); /contacto y /denuncias solo tarjetas copiadas del portal oficial (deliberado). Ya no aparece el contraste 3,3:1 de Denuncias.

## Problemas prioritarios
- [P1] Paso 1 con 14 campos sin subgrupos; error con >12 faltantes → subtítulos Identidad / Dónde vives / Contacto y error resumido con enlace al primero. (distill, layout)
- [P1] Trámites posteriores escondidos → columna «Mis trámites» en Contenido, retitular «Imprimir documentos», accesos de la portada según la etapa. (clarify, onboard)
- [P2] Errores sin aria-describedby → id por error y aria-describedby en cada campo. (harden, audit)
- [P2] Botones primarios inconsistentes; el asistente tapa «Carné de extranjería» a 375 px → un solo primario global; asistente lateral u oculto al escribir en formularios. (polish, adapt)
- [P3] Cifras y llamados repetidos en la portada; nota legal muy ancha. (quieter, distill)

## Personas
Jordan: «Reinscripción» sin explicar; modalidad recién en el paso 4; no sabe cómo volver. Sam: errores no ligados; menú sin retorno de foco. Casey: botones pequeños arriba; asistente en la zona del pulgar; select de 34.

## Preguntas
¿Portada según la etapa? ¿Guinda como marco y no como fondo de 14 campos? ¿Un enlace por correo en vez del código de 8 dígitos?
