# Diseño — Asistente virtual de admisión (chatbot IA)

> **SDD (Spec-Driven Development) · artefacto 2 de 3: diseño** (cómo se construye).
> Anterior: [requirements.md](requirements.md) · Siguiente: [tasks.md](tasks.md). Arquitectura general: [docs/arquitectura.md](../../docs/arquitectura.md) y [ADR](../../docs/adr/README.md).


## 1. Plan técnico

**Spec:** [requirements.md](requirements.md) · **Decisión:** [ADR-017](../../docs/adr/ADR-017-asistente-ia-herramientas.md) · **Tareas:** [tasks.md](./tasks.md)

### Ajuste a ADR-015

La spec dice «con sesión iniciada». Como la inscripción no exige cuenta, la identificación del asistente es **DNI + código de postulante en un formulario aparte**, que entrega un pase firmado de 30 minutos. Cuando exista la cuenta opcional, su sesión servirá igual.

### Diseño

**Módulo M10 Asistente** (`src/modules/asistente`), esquema `asistente`:

```
domain/         assistant-rules.ts (enmascarar, límites, mensajes) · ports.ts (LlmProvider)
application/    assistant-service.ts (conversar, identificar, derivar, uso, retención) · tools.ts (herramientas)
infrastructure/ openrouter-provider.ts · rule-based-provider.ts (modo básico) · scripted-provider.ts (pruebas)
presentation/   routes.ts
```

**Herramientas** (leen datos reales por las API públicas de M01, M03, M05, M14):

| Herramienta | Fuente | Requiere pase |
|---|---|---|
| `buscar_conocimiento(consulta)` | Base de conocimientos (tabla `knowledge_entries`, con fuente) | No |
| `consultar_cronograma()` | Etapas de la convocatoria vigente | No |
| `consultar_tasas()` | Tasas y reglas (Tabla N.° 3) | No |
| `consultar_vacantes(programa)` | Cuadro de vacantes | No |
| `consultar_requisitos(submodalidad?)` | Requisitos por submodalidad | No |
| `estado_de_mi_proceso()` | Inscripción, pago, documentos, aula y resultado | **Sí** |

**Datos (`asistente`):** `knowledge_entries` (tema, pregunta, respuesta, fuente, activa), `conversations` (canal, identificada sí/no, derivada, número de caso), `messages` (rol, texto enmascarado, herramientas usadas, tokens), `usage_daily` (fecha, consultas, tokens, costo, errores, derivaciones).

**API:** `POST /assistant/messages`, `POST /assistant/identify`, `POST /assistant/handoff`, `GET /assistant/suggestions`.

**Interfaz:** botón «Asistente» fijo en todas las páginas; panel con conversación, preguntas sugeridas, fuentes bajo cada respuesta, «Consultar mi proceso» (DNI + código) y «Hablar con una persona».

### Verificación

Pruebas de integración con un proveedor de IA guionado (pide herramientas como lo haría el modelo): respuesta con fuente, sin pase no hay datos personales, el proveedor no recibe el DNI, derivación crea un caso, presupuesto agotado pasa a modo básico, retención borra conversaciones viejas. Prueba del modo básico con preguntas frecuentes reales.

## 2. Actualizaciones de diseño (27 y 28/10/2026)

- **OpenRouter activo** con la clave del proyecto (`OPENROUTER_API_KEY` solo en el servidor); el modo básico queda como respaldo.
- «Consultar mi proceso» informa además el estado del expediente, el aula y el resultado (RF-10.06, RF-10.07, RF-10.08).
