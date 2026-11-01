---
target: portal de admisión UNSCH (quinta crítica tras P1-P3 de la cuarta)
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\diego\\OneDrive\\Desktop\\proyectofinal\\apps\\frontend\\src\\app"
timestamp: 2026-10-29T06-46-01Z
slug: apps-frontend-src-app
---
# Quinta crítica del portal de admisión UNSCH 2027-I (tras P1–P3 de la cuarta)

## Heurísticas — 29/40 (bueno; 27 → 28 → 28 → 28 → 29)
| # | Heurística | Puntaje | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | Buscar aula y Resultados muestran el formulario activo semanas antes de abrir |
| 2 | Mundo real | 4 | — |
| 3 | Control y libertad | 2 | No se puede recuperar el código de postulante; el borrador no se borra fácil; denuncia exige correo |
| 4 | Consistencia | 3 | Obligatorios del paso 1 sin aria-required |
| 5 | Prevención de errores | 3 | Paso 1 con ~20 campos visibles |
| 6 | Reconocer y no recordar | 3 | Código de 8 dígitos sin pista de dónde encontrarlo |
| 7 | Flexibilidad | 3 | Falta autocomplete en apellido materno |
| 8 | Estética | 2 | Portada de 14,6 pantallas en móvil; Contacto pone el equipo antes de los canales |
| 9 | Errores | 3 | Resumen ejemplar; ubigeo sin aria-describedby por select |
| 10 | Ayuda | 3 | Asistente tapa campos en móvil fuera de la inscripción |

## Especificidad
Específico (submodalidades reales, recargo, puertas, horarios, 450/1000, RENIEC). Genérico: bloques del rector y vicerrector.
Detector: 8 avisos (6 broken-image falsos positivos; 2 en contact.ts deliberados). Navegador: sin desbordes en 8 rutas; placeholders ≥4,5:1; bordes de Contacto/Denuncias 3,7:1; resumen de errores con foco y aria-describedby correcto. Reales: selects del buscador de la portada con borde 1,14:1 (styles.scss:129-133); foco débil (~1,4:1) en campos sobre guinda en Mi inscripción, Buscar aula y Resultados (`.input:focus { outline:none }` + borde blanco fijo); ubigeo y radios de sexo sin descripción/aria-invalid; objetivos táctiles de 20–28 px; pie de ~105 caracteres; foto de fachada ampliada.

## Problemas prioritarios
- [P1] Sin recuperación del código de postulante → «¿No encuentras tu código?» que lo reenvía al correo/celular registrado.
- [P1] Borrador con datos personales 30 días en el equipo → botón «Borrar mis datos de este equipo» y opción de equipo compartido.
- [P1] Paso 1 sobrecargado → dividir en dos pasos.
- [P2] Foco débil en campos sobre guinda; bordes del buscador de la portada 1,14:1.
- [P2] Asistente tapa campos en móvil fuera de la inscripción; denuncia con correo obligatorio.
- [P2] Densidad de portada y Contacto en móvil.

## Personas
Jordan: Reinscripción confunde; paso 1 de ~3000 px; sin código queda bloqueado. Sam: obligatorios sin aria-required; ubigeo; 5 h2 de personas antes del formulario. Casey: portada de 11 848 px; consultas de 5 s con solo «Buscando…»; borrador en cabina.

## Preguntas
¿DNI + fecha de nacimiento en vez del código? ¿Se mide el abandono del paso 1? ¿Denuncia con reserva que exige correo?
