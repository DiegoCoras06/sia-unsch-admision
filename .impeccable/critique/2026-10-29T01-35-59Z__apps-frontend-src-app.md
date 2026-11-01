---
target: portal de admisión UNSCH (portada, inscripción, imprimir documentos, contactos, denuncias, panel)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\diego\\OneDrive\\Desktop\\proyectofinal\\apps\\frontend\\src\\app"
timestamp: 2026-10-29T01-35-59Z
slug: apps-frontend-src-app
---
# Crítica del portal de admisión UNSCH 2027-I (modo refinamiento)

## Heurísticas de Nielsen — 27/40 (aceptable)
| # | Heurística | Puntaje | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | Sin indicador de avance en el formulario; tras pagar, consulta hasta ~12 s sin «Confirmando tu pago…» |
| 2 | Mundo real | 3 | Jerga: «Tipo», «Dependencia económica», menú «Contenido», «Ver puntaje» |
| 3 | Control y libertad | 3 | Sin revisión antes de «Guardar inscripción» (irreversible) |
| 4 | Consistencia | 2 | Tres estilos de botón; horarios distintos en Contactos, Denuncias y pie |
| 5 | Prevención de errores | 3 | Cambio de programa sin confirmación |
| 6 | Reconocer antes que recordar | 3 | En celular el resumen pierde sus datos y baja al final |
| 7 | Flexibilidad | 2 | «Imprimir documentos» pide documento y código cada vez; panel con 20 entradas planas |
| 8 | Estética y minimalismo | 2 | Portada de 11 secciones con cifras repetidas; constancia con 6 bloques de color |
| 9 | Recuperación de errores | 3 | Errores rosados sin ícono; sin resumen ni foco al primer error |
| 10 | Ayuda | 3 | El asistente flotante tapa campos en celular |

## Especificidad
Se siente de la UNSCH (guinda/dorado, fachada 1677, ingreso CU, rector, infografías, datos del concurso). Genérico: cifras decorativas repetidas, animaciones en todas las secciones, portada de 11 bloques iguales. Problema de fondo: disciplina en inscripción, pago y resultado.
Detector: CLI 7 avisos (5 broken-image falsos positivos por [src] de Angular; 2 bordes en contact.ts). Navegador: / e /inscripcion limpias; /contacto 9 (bordes, nested-cards, placeholder 4,4:1); /denuncias 6 (placeholders 3,3:1 con peso 300 en complaints.ts:95; bordes guinda).

## Problemas prioritarios
- [P1] Formulario de inscripción como pared única en celular → pasos 1/4…4/4, «Revisa antes de guardar», barra fija con monto y paso. (distill, onboard, layout)
- [P1] Botones Inscripción/Reinscripción ocultos bajo 1280 px; «Inscribirme» bajo el pliegue y tapado por el asistente → botones compactos siempre visibles, foto más baja en celular, asistente que no tape. (adapt)
- [P1] Constancia y pago sin orden ni feedback; nota «arriba» falsa → orden código/estado/monto/pagar/ventanilla, «Confirmando tu pago…». (clarify, harden)
- [P2] Contactos y Denuncias fuera del sistema y contradictorias (etiquetas solo placeholder con 3,3:1, «anónima» pero pide correo, horarios distintos) → conservar el aspecto del portal oficial pero etiquetas visibles, contraste, un horario, texto honesto. (polish, clarify)
- [P2] Foco dorado ~1,9:1 sobre fondos claros; errores sin resumen → foco tinta sobre claro y dorado sobre guinda; resumen de errores y foco al primero. (audit)

## Personas
Jordan: «Contenido» opaco; Inscripción vs Reinscripción; «Tipo»; dónde está el código; dónde ver si ingresé. Sam: foco invisible; menú sin gestión de foco; Denuncias sin etiquetas. Casey: CTA bajo el pliegue; asistente tapa DNI; placeholder cortado; animaciones con red lenta; la foto no se guarda en el borrador.

## Menores
Cifras 34/1803 fijas; «Nuevo» azul y gris del menú fuera de paleta; panel sin agrupar; teclado numérico para carné de extranjería.

## Preguntas
¿Por qué lo primero que desaparece en celular es el botón oficial? ¿Qué pantalla ve el postulante el día de resultados? ¿Revisión antes de la declaración jurada o solo una casilla?
