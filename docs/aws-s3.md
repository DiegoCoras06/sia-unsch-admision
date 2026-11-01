# Amazon S3 para los documentos (ADR-010)

Bucket: **`admision-unsch-documentos-2027`** · Región: **us-east-2 (Ohio)**

El sistema guarda en S3 las fotos, los documentos del expediente, los documentos adicionales de la inscripción y las imágenes editables del portal.

- Los archivos grandes (hasta 5 MB) **no pasan por la API**. El navegador los sube directo al bucket con un formulario prefirmado que vence en 5 minutos y fija el tamaño máximo y el tipo. La API comprueba después el contenido real del archivo (firma, tamaño y SHA-256) y lo guarda en su ubicación definitiva.
- Para ver un documento privado, la API entrega un enlace temporal de 2 minutos.

## 1. Bucket (una sola vez)

En **S3 → admision-unsch-documentos-2027**:

1. **Permisos → Bloquear acceso público:** las cuatro opciones **activadas**. El bucket es privado.
2. **Propiedades → Cifrado predeterminado:** SSE-S3 (AES-256).
3. **Permisos → Uso compartido de recursos entre orígenes (CORS) → Editar**, y pega:

```json
[
  {
    "AllowedOrigins": ["http://127.0.0.1:4200", "http://localhost:4200"],
    "AllowedMethods": ["POST", "GET"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Cuando el portal tenga su dominio en CloudFront (Paso 11), se agrega ese origen (por ejemplo, `https://admision.ejemplo.pe`).

4. **Administración → Reglas de ciclo de vida → Crear regla** (opcional, recomendado): prefijo `subidas/` y **vencimiento de objetos actuales a 1 día**. Así se borran las subidas que el postulante empezó y nunca confirmó.

## 2. Usuario IAM para desarrollo local (en AWS lo reemplaza el rol de la Lambda)

En **IAM → Usuarios → Crear usuario** (por ejemplo, `sia-unsch-s3-local`), sin acceso a la consola. Luego **Agregar permisos → Crear política insertada → JSON**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DocumentosAdmision",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::admision-unsch-documentos-2027/*"
    }
  ]
}
```

Solo puede leer, escribir y borrar objetos de **este** bucket: no puede listar otros buckets, cambiar la configuración ni borrar el bucket.

Después, en el usuario: **Credenciales de seguridad → Crear clave de acceso → «Código local»**. Copia la clave de acceso y la clave secreta. La secreta solo se muestra una vez.

## 3. Configuración del sistema

En `apps/backend/.env.rds`, que está ignorado por git:

```
FILE_STORAGE=s3
S3_BUCKET=admision-unsch-documentos-2027
S3_REGION=us-east-2
AWS_ACCESS_KEY_ID=<clave de acceso del usuario IAM>
AWS_SECRET_ACCESS_KEY=<clave secreta del usuario IAM>
```

- No escribas las claves en el chat ni en otros archivos.
- En la Lambda **no** se usan claves: el rol de ejecución tiene la misma política.

## 4. Archivos que ya estaban en local

Las fotos y los documentos subidos antes del cambio están en `apps/backend/.dev-storage/`. Para que se sigan viendo hay que copiarlos al bucket con las mismas rutas (`expedientes/…`, `inscripciones/…`, `fotos/…`, `portal/…`).
