# Postman: verificación funcional de los 12 módulos

**Postman** comprueba que cada módulo responde lo correcto. **k6** (`calidad/k6/`) demuestra cuántos usuarios soporta
el sistema y con qué tiempos.

| Archivo                             | Qué es                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `SIA-UNSCH.postman_collection.json` | La colección: 62 peticiones en 14 carpetas, con pruebas automáticas               |
| `local.postman_environment.json`    | Variables para la API en tu computadora                                           |
| `generar-coleccion.py`              | Vuelve a generar los dos archivos (`python calidad/postman/generar-coleccion.py`) |

## 1. Importar en Postman

1. Abre Postman y elige **Import**.
2. Arrastra los dos archivos `.json` de esta carpeta.
3. Arriba a la derecha, elige el entorno **SIA-UNSCH local**.
4. La API debe estar encendida (`http://127.0.0.1:3000`).

## 2. Variables del entorno

| Variable                      | Para qué                                                    | Valor                                             |
| ----------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `baseUrl`                     | Dirección de la API                                         | `http://127.0.0.1:3000/api/v1` (o la de AWS)      |
| `convocatoria`, `programa`    | Datos del catálogo                                          | `2027-I`, `P34`                                   |
| `dni`, `codigo`               | Una inscripción de prueba para las consultas del postulante | Las escribes tú                                   |
| `dniNuevo`                    | DNI de prueba para crear una inscripción                    | Lo escribes tú                                    |
| `adminEmail`, `adminPassword` | Tu cuenta del panel                                         | Las escribes tú; **no se guardan en el proyecto** |
| `mfaCode`                     | Código de 6 dígitos del autenticador                        | Lo escribes justo antes de enviar                 |
| `challenge`, `adminToken`     | Se llenan solos al ingresar                                 | No los toques                                     |

## 3. Carpetas (una por módulo)

| Carpeta                   | Qué verifica                                                           | ¿Necesita sesión? |
| ------------------------- | ---------------------------------------------------------------------- | ----------------- |
| 00. Salud de la API       | Que la API y la base de datos respondan                                | No                |
| 01. Convocatorias         | Convocatoria, etapas, programas, tasas, simulador, requisitos, temario | No                |
| 02. Configuración         | Portada, comunicados e imágenes                                        | No                |
| 03. Inscripciones         | Formulario, observados, estado con DNI y código                        | No                |
| 04. Pagos                 | Estado del pago                                                        | No                |
| 05. Usuarios              | Ingreso del personal con doble factor, usuarios y roles                | Ingreso y panel   |
| 06. Seguridad y auditoría | Auditoría, casos de atención, estado de integraciones                  | Sí                |
| 07. Expedientes           | Expediente del exonerado y panel de evaluación                         | Panel             |
| 08. Exámenes              | Aula del postulante, exámenes, sedes y asistencia                      | Panel             |
| 09. Resultados            | Ingresantes, resultado del postulante, panel de resultados             | Panel             |
| 10. Notificaciones        | Bandeja del postulante, envíos, plantillas y campañas                  | Panel             |
| 11. Asistente virtual     | Preguntas sugeridas y uso                                              | Panel             |
| 12. Reportes              | Indicadores, inscripciones, pagos, encuesta SUS y Excel                | Sí                |
| 13. Errores esperados     | Que los errores respondan bien (400, 401, 404)                         | No                |

Cada petición comprueba tres cosas: el **código de respuesta**, que responda en **3 s o menos** (meta de EQ-01) y que
los datos tengan la forma correcta.

## 4. Cómo usarla

**Una petición:** ábrela y presiona **Send**. Los resultados de las pruebas aparecen en la pestaña **Test Results**.

**Todo de una vez:** clic derecho sobre la colección, **Run collection**, y luego **Run**. Postman muestra cuántas pruebas
pasaron por módulo; guarda una captura como evidencia.

**Panel del personal:**

1. Escribe `adminEmail` y `adminPassword` en el entorno.
2. Envía **05. Usuarios > Ingreso del personal > 1. Correo y contraseña**.
3. Escribe en `mfaCode` el código de tu aplicación de autenticación y envía **2. Código del autenticador**.
4. Ya puedes usar las carpetas del panel durante 15 minutos (luego repite el paso 3).

## 5. Cuidado con las carpetas «Escribe en la base»

Las subcarpetas **Escribe en la base** crean inscripciones, intentos de pago, consultas y conversaciones en la base a la
que apunte `baseUrl`. Con la API conectada a RDS, quedan guardadas allí. En una corrida completa, **desmárcalas** en el
Collection Runner, o úsalas solo con datos de prueba.

## 6. Desde la terminal (opcional)

Con [Newman](https://www.npmjs.com/package/newman), la versión de terminal de Postman, se corren las carpetas que solo
leen sin abrir Postman:

```bash
npx newman run calidad/postman/SIA-UNSCH.postman_collection.json -e calidad/postman/local.postman_environment.json --folder "00. Salud de la API" --folder "01. Convocatorias (portal)" --folder "02. Configuración (contenidos)" --folder "13. Errores esperados"
```
