# ADR-017: Asistente virtual con OpenRouter que responde solo con herramientas internas

**Estado:** Aceptado
**Fecha:** 26/10/2026
**Impulsores:** Módulo 10 (RF-10.01 a RF-10.16), spec [009](../../specs/009-chatbot-ia/requirements.md); RNF-11 (datos personales); ADR-015 (sin cuenta obligatoria)

## Contexto

El asistente debe orientar sobre la admisión y hacer seguimiento del proceso del postulante, sin inventar montos, fechas, estados ni puntajes (RF-10.16). Un modelo de lenguaje por sí solo inventa con facilidad. Además, desde ADR-015 el postulante no necesita cuenta: se identifica con DNI + código de postulante.

## Decisión

1. **OpenRouter** (`https://openrouter.ai/api/v1/chat/completions`), con el modelo configurable en el servidor (`OPENROUTER_MODEL`, por defecto `anthropic/claude-haiku-5.5`: admite herramientas y cuesta US$ 0,10 / 0,50 por millón de tokens). La clave `OPENROUTER_API_KEY` vive solo en el servidor (RF-10.13, RF-14.06).
2. **El modelo no sabe nada por sí mismo: consulta herramientas.** Toda cifra, fecha o estado sale de una herramienta que lee la base de datos con las API públicas de los módulos:
   `buscar_conocimiento` (base de conocimientos con fuentes), `consultar_cronograma`, `consultar_tasas`, `consultar_vacantes`, `consultar_requisitos` y `estado_de_mi_proceso`. La respuesta cita la fuente que devolvió la herramienta. Si ninguna herramienta tiene el dato, el asistente lo dice y ofrece derivar (RF-10.16).
3. **Identificación fuera del chat (RF-10.14):** el DNI y el código se escriben en un formulario del asistente, no en la conversación. El servidor los verifica y entrega un **pase firmado** (HMAC, 30 minutos) que habilita `estado_de_mi_proceso`. El modelo nunca recibe el DNI, los nombres ni el correo: la herramienta devuelve el estado sin datos de identidad.
4. **Enmascaramiento (RNF-11):** antes de enviar un mensaje al proveedor se reemplazan DNI, celulares y correos escritos por el usuario.
5. **Modo básico sin IA:** sin clave, con el proveedor caído o con el presupuesto diario agotado, responde un asistente por reglas que usa **las mismas herramientas** y lo indica («respuestas automáticas»). Así la demo funciona siempre y nunca inventa.
6. **Control de uso (RF-10.15):** límite de 30 mensajes por hora por IP, tope de herramientas por turno, presupuesto diario en dólares (`CHAT_DAILY_BUDGET_USD`) y registro diario de consultas, tokens, costo, errores y derivaciones.
7. **Conversaciones (RF-10.11):** se guardan enmascaradas, sin pase ni identidad, y se eliminan pasados `CHAT_RETENTION_DAYS` (90).
8. **Derivación (RF-10.10):** «Hablar con una persona» crea un caso de atención en M13 con la conversación enmascarada y devuelve el número de caso.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| Darle al modelo todo el reglamento en el prompt | Simple | Caro; responde de memoria y puede mezclar o inventar | RF-10.16 |
| Pedir el DNI dentro del chat | Una sola caja de texto | El DNI viajaría al proveedor de IA | RNF-11 |
| Solo reglas, sin IA | Cero costo | No entiende preguntas libres | RF-10.01 pide IA |

## Consecuencias

**Positivas:** respuestas con fuente y verificables; la demo funciona sin clave; costo de centavos por día.

**Negativas / riesgos aceptados:** el modelo puede redactar mal un dato que sí vino de una herramienta → las respuestas muestran sus fuentes para que el postulante las verifique, y las pruebas exigen que cada cifra de la respuesta esté en el resultado de alguna herramienta.

**Cómo verificamos que se cumple:** pruebas con un proveedor de IA simulado que pide herramientas; pruebas de que sin pase no hay datos personales y de que el proveedor nunca recibe el DNI.
