# Swagger: documentación de la API

Esta carpeta reúne todo lo de la documentación OpenAPI y Swagger UI del backend.

| Archivo        | Qué es                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openapi.json` | El contrato OpenAPI 3.1 de toda la API: 205 operaciones de los 12 módulos                                                  |
| `generar.ts`   | Genera `openapi.json`: une los contratos detallados de `specs/<nn>/contracts/openapi.yaml` con las rutas reales del código |
| `swagger.ts`   | Muestra Swagger UI en `/api/docs` y el contrato en `/api/openapi.json` (lo usa `src/app.ts`)                               |

## Verla

1. Enciende la API: `npm run dev:rds` (desde la raíz del proyecto).
2. Abre **http://127.0.0.1:3000/api/docs**.
3. Las operaciones están agrupadas por módulo. Con **Try it out** se prueban desde la misma página.
4. Para las rutas del panel: envía `/admin/auth/login` y luego `/admin/auth/mfa`, copia el `accessToken` y pégalo en
   **Authorize**.

El contrato completo se descarga en `http://127.0.0.1:3000/api/openapi.json` (sirve para importarlo en Postman).

## Regenerarla

Cuando agregues o cambies una ruta:

```bash
npm run openapi -w @sia/backend
```

La prueba `tests/unit/arquitectura/openapi.test.ts` falla si alguna ruta del código no está en `openapi.json`, así la
documentación no se queda atrás.

## De dónde sale cada operación

- **38 operaciones** tienen contrato detallado en `specs/` (esquemas de datos, ejemplos y errores): portal público,
  cuentas, inscripción ordinaria y pagos.
- **167 operaciones** se generan del código: módulo, descripción (del comentario de la ruta), parámetros, si necesita
  sesión, el permiso del panel (`x-permiso`) y las respuestas comunes.
