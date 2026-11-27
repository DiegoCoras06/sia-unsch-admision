# Cobertura Jest del backend — 27/11/2026

## Resultado

La suite completa se ejecutó con:

```powershell
npm run test:coverage -w @sia/backend
```

- 46 suites aprobadas;
- 342 pruebas aprobadas y 0 fallidas;
- PostgreSQL efímero local, sin conexión a RDS;
- proveedores externos sustituidos por dobles de prueba;
- umbrales y configuración de cobertura sin reducciones.

| Métrica    | Antes   | Después | Cubierto         |
| ---------- | ------- | ------- | ---------------- |
| Líneas     | 91,42 % | 92,24 % | 19 196 de 20 809 |
| Sentencias | 91,42 % | 92,24 % | 19 196 de 20 809 |
| Funciones  | 90,55 % | 91,49 % | 775 de 847       |
| Ramas      | 78,25 % | 79,10 % | 3078 de 3891     |

## Escenarios agregados

- OpenRouter: solicitud segura, respuesta completa, valores predeterminados, rechazo HTTP y respuesta no JSON.
- Idempotencia: omisión en rutas no protegidas, clave inválida, adquisición, replay, conflicto, bloqueo concurrente,
  recuperación por expiración o timeout y liberación ante respuestas 5xx.
- Contenido administrativo: consultas, comunicados, fe de erratas, bloques, funciones, parámetros, validaciones,
  auditoría y reintento controlado de eventos fallidos.

Los archivos `openrouter-provider.ts`, `content-admin.ts` e `idempotency.ts` alcanzaron 100 % de cobertura de líneas.
