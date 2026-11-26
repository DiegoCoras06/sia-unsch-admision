# Requisitos — Asistente virtual de admisión (chatbot IA)

> **SDD (Spec-Driven Development) · artefacto 1 de 3: requisitos** (qué y por qué).
> Siguiente: [design.md](design.md) (cómo) · [tasks.md](tasks.md) (tareas). Principios: [constitución](../../.specify/memory/constitution.md).

**Rama:** `009-chatbot-ia`
**Creada:** 25/10/2026
**Estado:** En revisión
**Módulos de arquitectura:** M10 Chatbot IA
**Entrada:** "Un asistente que responda dudas sobre fechas, tasas, requisitos y vacantes con información oficial, y que al postulante con sesión le diga el estado de su inscripción, pago, documentos y aula. Nunca debe inventar."

## Escenarios de usuario y pruebas

### Historia 1 — Resolver dudas frecuentes con información oficial (Prioridad: P1)

Como visitante, quiero preguntar en lenguaje natural y obtener respuestas basadas en el Reglamento y la convocatoria vigente (MEJ-12).

**Escenarios de aceptación:**

1. **Dado** la pregunta "¿cuánto pago si vengo de colegio particular?", **cuando** el asistente responde, **entonces** indica S/ 300.00 para Ordinario, menciona el recargo extemporáneo y cita la fuente "Tabla N.° 3, Prospecto 2027-I". _(RF-10.02, RF-10.03)_
2. **Dado** la pregunta "¿qué puedo llevar al examen?", **cuando** responde, **entonces** lista lápiz 2B, borrador y tajador, y los objetos prohibidos (Art. 26).
3. **Dado** una pregunta sin respuesta en la base de conocimientos, **cuando** responde, **entonces** dice que no tiene información verificada y ofrece derivar a un responsable. _(RF-10.16)_
4. **Dado** una pregunta ajena a la admisión, **cuando** responde, **entonces** aclara amablemente que solo atiende temas del proceso de admisión.

---

### Historia 2 — Consultar el estado de mi proceso (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** que no inicié sesión, **cuando** pregunto "¿ya se confirmó mi pago?", **entonces** el asistente me pide iniciar sesión y no solicita DNI en el chat. _(RF-10.14)_
2. **Dado** que inicié sesión, **cuando** pregunto por mi estado, **entonces** responde con los datos reales del sistema (inscripción, pago, expediente, aula si está publicada, resultado si está publicado). _(RF-10.04 a RF-10.08)_
3. **Dado** que el aula no está publicada, **cuando** pregunto por ella, **entonces** indica la fecha de publicación, sin inventar un aula.
4. **Dado** cualquier consulta personal, **cuando** se procesa, **entonces** el proveedor de IA no recibe mi DNI, nombres ni correo (RNF-11).

---

### Historia 3 — Pasar a atención humana (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** que pido hablar con una persona o el asistente no resuelve en 3 intentos, **cuando** acepto la derivación, **entonces** se crea un caso de atención con la conversación y recibo el número de caso. _(RF-10.10)_

---

### Historia 4 — Mantener la base de conocimientos (Prioridad: P2)

**Escenarios de aceptación:**

1. **Dado** que soy de la Oficina de Admisión, **cuando** agrego o edito una entrada (pregunta, respuesta, fuente), **entonces** el asistente la usa desde ese momento. _(RF-10.12)_
2. **Dado** que se publica una fe de erratas, **cuando** se registra, **entonces** las entradas afectadas se marcan para revisión.

---

### Historia 5 — Controlar costos y uso (Prioridad: P3)

**Escenarios de aceptación:**

1. **Dado** el panel del asistente, **cuando** lo abro, **entonces** veo consultas por día, temas frecuentes, tasa de derivación, consumo y costo estimado. _(RF-10.15, RF-12.10)_
2. **Dado** que se alcanza el límite diario de consumo, **cuando** llega una nueva pregunta, **entonces** el asistente responde solo con preguntas frecuentes predefinidas y avisa de la limitación.

### Casos límite

- El proveedor de IA no responde → se muestran respuestas de preguntas frecuentes por coincidencia de palabras clave.
- El usuario escribe datos personales en el chat → se enmascaran antes de enviarlos al proveedor.
- Intento de manipular al asistente para que ignore sus reglas → se mantiene dentro de su alcance.

## Requisitos

### Requisitos funcionales

- **FR-001**: El sistema DEBE ofrecer un asistente conversacional en todas las páginas públicas y del postulante. _(RF-10.01)_
- **FR-002**: El asistente DEBE responder solo con la base de conocimientos oficial y citar la fuente. _(RF-10.02, RF-10.03)_
- **FR-003**: El asistente DEBE consultar estados del postulante solo con sesión iniciada y a través de servicios internos autorizados. _(RF-10.04 a RF-10.08, RF-10.14)_
- **FR-004**: El asistente DEBE declarar cuando no tiene información verificada y no inventar datos. _(RF-10.16)_
- **FR-005**: El sistema DEBE derivar a atención humana creando un caso. _(RF-10.10)_
- **FR-006**: El sistema DEBE registrar conversaciones según la política de retención. _(RF-10.11)_
- **FR-007**: El sistema DEBE permitir administrar la base de conocimientos. _(RF-10.12)_
- **FR-008**: La clave del proveedor de IA DEBE residir solo en el servidor. _(RF-10.13)_
- **FR-009**: El sistema DEBE controlar consumo, costo, errores y límites de uso. _(RF-10.15)_
- **FR-010**: El sistema DEBE enmascarar datos personales antes de enviarlos al proveedor. _(RNF-11)_
- **FR-011**: El asistente DEBE ofrecer instrucciones para incidencias frecuentes de inscripción y pagos. _(RF-10.09)_

### Entidades clave

- **Conversación / Mensaje**: canal, usuario (opcional), fecha, contenido enmascarado.
- **Entrada de conocimiento**: pregunta, respuesta, fuente oficial, vigencia.
- **Registro de consumo**: fecha, consumo, costo, errores.

## Criterios de éxito

- **SC-001**: El 90 % de un conjunto de 50 preguntas de prueba se responde correctamente y con fuente.
- **SC-002**: 0 respuestas con montos, fechas o estados inventados en el conjunto de prueba.
- **SC-003**: Respuesta en menos de 5 segundos en el 95 % de los casos.

## Supuestos

- Se usa OpenRouter con un modelo configurable desde el servidor.

## Fuera de alcance

- Atención por WhatsApp u otros canales.

## Estado de los requisitos (28/10/2026)

13 de 14 requisitos del catálogo citados en esta funcionalidad están implementados y probados. Fuente: [matriz de trazabilidad](../../docs/trazabilidad-requisitos.md).

| RF       | Estado | Detalle                                                                                                                           |
| -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| RF-10.01 | 🟡     | Integrado con OpenRouter (ADR-017, probado con proveedor guionado); falta la clave para usar la IA en vivo; mientras, modo básico |
| RF-10.02 | ✅     | Responde convocatoria, modalidades, requisitos, tasas, cronograma y examen                                                        |
| RF-10.03 | ✅     | Solo con herramientas sobre datos oficiales y base de conocimientos con fuente                                                    |
| RF-10.04 | ✅     | Estado de la inscripción con pase firmado (DNI + código)                                                                          |
| RF-10.08 | ✅     | Informa el puntaje, el puesto y la condición cuando se publican los resultados                                                    |
| RF-10.09 | ✅     | Incidencias frecuentes de inscripción y pagos en la base de conocimientos                                                         |
| RF-10.10 | ✅     | Derivación a un caso de atención con la conversación                                                                              |
| RF-10.11 | ✅     | Conversaciones enmascaradas con retención de 90 días                                                                              |
| RF-10.12 | ✅     | Base de conocimientos editable en el panel; el asistente la usa al instante                                                       |
| RF-10.13 | ✅     | Clave solo en el servidor                                                                                                         |
| RF-10.14 | ✅     | Datos personales solo con pase; el DNI nunca va a la IA                                                                           |
| RF-10.15 | ✅     | Límite por IP, presupuesto diario y registro de tokens, costo y errores                                                           |
| RF-10.16 | ✅     | Sin herramienta no hay dato: responde que no tiene información verificada                                                         |
| RF-12.10 | ✅     | Consultas, respuestas con IA, derivaciones, tokens y costo del asistente                                                          |

✅ implementado y probado · 🟡 parcial (lo que falta depende de un servicio externo o está anotado) · ⏳ pendiente
