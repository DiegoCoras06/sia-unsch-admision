# Lighthouse del portal: 2026-11-25

Se evaluó el inicio desde el build productivo de Angular, servido localmente y conectado a la API en RDS. Se usó Lighthouse 13.6.0 con el perfil de escritorio y Microsoft Edge en modo headless.

| Categoría/métrica        |   Resultado |    Criterio |
| ------------------------ | ----------: | ----------: |
| Rendimiento              |  **96/100** |        ≥ 90 |
| Accesibilidad            | **100/100** |        ≥ 90 |
| First Contentful Paint   |       0.6 s | Informativo |
| Largest Contentful Paint |       1.4 s | Informativo |
| Total Blocking Time      |       10 ms | Informativo |
| Cumulative Layout Shift  |       0.003 |       ≤ 0.1 |

Resultado: **CUMPLE**. La tabla conserva las métricas relevantes de la ejecución.

La corrección aplicada reserva el alto inicial del inicio mientras se cargan sus bloques diferidos, evitando que el pie de página salte dentro del primer viewport.
