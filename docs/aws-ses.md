# Amazon SES para el correo (M11, RF-11.09)

Región: **us-east-2 (Ohio)**, la misma del bucket S3 y de RDS.

Sin SES, el sistema guarda cada correo como `.html` en `apps/backend/.dev-mail/` (`EMAIL_PROVIDER=file`). Con SES los correos salen de verdad: códigos de verificación, inscripción registrada, pago confirmado, aula publicada, resultados y comunicados.

## 1. Verificar el remitente (una sola vez)

En **Amazon SES → Identidades → Crear identidad**:

1. Tipo: **Dirección de correo electrónico**, por ejemplo tu correo institucional.
2. AWS envía un correo a esa dirección: abre el enlace para verificarla.

> **Modo sandbox:** una cuenta nueva de SES solo entrega a direcciones **verificadas** y hasta 200 correos al día. Para la demo, verifica también los correos de los postulantes de prueba (mismo paso 1). Para escribir a cualquier dirección, pide **acceso a producción** en *SES → Panel de la cuenta*.

## 2. Permiso para el usuario IAM de desarrollo

Al usuario `sia-unsch-s3-local` (ver [aws-s3.md](aws-s3.md)) agrégale otra política insertada:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "EnviarCorreo", "Effect": "Allow", "Action": ["ses:SendEmail"], "Resource": "*" },
    { "Sid": "ComprobarCuenta", "Effect": "Allow", "Action": ["ses:GetAccount", "ses:GetEmailIdentity"], "Resource": "*" }
  ]
}
```

En AWS, la Lambda recibe el mismo permiso por su rol (Paso 11).

## 3. Configuración del sistema

En `apps/backend/.env.rds`:

```bash
EMAIL_FROM="Admisión UNSCH (proyecto académico) <tu-correo@dominio>"
SES_REGION=us-east-2
```

Comprueba la cuenta y el remitente; si pasas un correo, envía uno de prueba:

```bash
npm run ses:check
npm run ses:check -- tu-correo@dominio
```

Si todo sale bien, cambia `EMAIL_PROVIDER=ses` y reinicia la API (`npm run dev:rds`). En el panel, **Configuración → Integraciones** muestra «Correo: Amazon SES».

## 4. Qué pasa si SES rechaza un correo

El envío pasa por la cola de M11: si SES rechaza (por ejemplo, destinatario no verificado en sandbox), la notificación queda **FALLIDA** con el motivo y se reintenta hasta 3 veces sin duplicar.

## Pendiente: rebotes y quejas

El estado **REBOTADA** (RF-11.09) necesita un *conjunto de configuración* de SES que publique los eventos `Bounce` y `Complaint` en un tema SNS suscrito a la API por HTTPS. Requiere una URL pública, así que se configura junto con el despliegue (Paso 11). El emisor ya envía `SES_CONFIGURATION_SET` y la etiqueta `evento` cuando están definidos.
