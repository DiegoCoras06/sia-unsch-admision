# ADR-009: Despliegue en AWS con CloudFront + S3, API Gateway + Lambda, RDS e instancia NAT, definido con CDK

**Estado:** Aceptado
**Fecha:** 25/10/2026
**Impulsores:** Aclaración del 25/10/2026 ("el sistema debe quedar desplegado en AWS"), RNF-02, RNF-04, RNF-12, guía maestra §12

## Contexto

El sistema se presentará **desplegado en AWS**. La carga es estacional y, fuera de la demostración, casi nula. El presupuesto es de estudiante: hay que minimizar **costos fijos** y poder **apagar todo** al terminar.

## Decisión

| Capa | Servicio | Configuración |
|---|---|---|
| Web | **S3** privado + **CloudFront** con Origin Access Control | HTTPS con certificado de CloudFront (dominio `*.cloudfront.net`; dominio propio opcional con Route 53 + ACM) |
| API | **API Gateway HTTP API** + **Lambda** (Node.js 22, ARM64, 1024 MB) | Ruta `/api/*` detrás de la misma distribución de CloudFront → sin CORS |
| Worker | **Lambda** separado + **EventBridge Scheduler** | Ver ADR-012 |
| Base de datos | **RDS PostgreSQL 16**, `db.t4g.micro`, 20 GB gp3, una AZ, cifrado, respaldo automático 7 días | Subred privada, sin acceso público |
| Red | VPC con 2 AZ, subredes privadas y una pública | **Instancia NAT `t4g.nano`** (imagen fck-nat) en lugar de NAT Gateway; **endpoint de gateway S3** gratuito |
| Documentos | **S3** privado, cifrado SSE-S3, bloqueo de acceso público | ADR-010 |
| Secretos | **SSM Parameter Store** (`SecureString`) | Clave JWT, clave de OpenRouter, secreto HMAC del webhook, credenciales de BD |
| Correo | **SES** | Modo *sandbox*: solo destinatarios verificados (suficiente para la demo) |
| IaC | **AWS CDK en TypeScript** (`infra/`) | Pilas: `Network`, `Data`, `Api`, `Web`; entornos `dev` y `demo` |
| Región | `us-east-2` (Ohio) | Coherente con la guía maestra; se puede cambiar por parámetro |

**Confirmación del equipo (25/10/2026):** el sistema se despliega en **AWS Lambda** para pagar por uso, solo para la presentación del curso. La base de datos será **RDS PostgreSQL `db.t4g.micro` en VPC privada con NAT**, en la cuenta de AWS del equipo. Se entiende que **Lambda, API Gateway, CloudFront y S3 cobran por uso**, pero **RDS y la instancia NAT cobran por hora mientras están encendidas**; por eso ambos se detienen entre sesiones (`npm run aws:sleep`) y se encienden antes de la presentación (`npm run aws:wake`). El desarrollo diario sigue con PostgreSQL embebido (ADR-014); el acceso desde el PC a RDS, solo para migraciones y revisión, se hace por un túnel de **AWS Systems Manager** a través de la instancia NAT, sin abrir la base de datos a internet.

**Ciclo de vida para controlar costos:**
- `npm run deploy:demo` crea todo; `npm run destroy:demo` lo elimina (con instantánea final opcional de RDS).
- Fuera de las fechas de presentación, RDS se **detiene** (AWS lo reinicia automáticamente a los 7 días; se documenta).
- **AWS Budgets** con alerta por correo al superar un umbral mensual definido por el equipo.

## Alternativas consideradas

| Alternativa | A favor | En contra | Motivo del descarte |
|---|---|---|---|
| NAT Gateway administrado | Sin mantenimiento | Costo fijo por hora alto para un proyecto académico | Se usa instancia NAT; riesgo de disponibilidad aceptado |
| Lambda fuera de la VPC + RDS público | Sin NAT | Base de datos expuesta a internet | Inaceptable (RNF-03) |
| Aurora Serverless v2 | Escala automática | Costo mínimo superior a `db.t4g.micro` | No justificado |
| EC2 o ECS Fargate con contenedor | Sin arranque en frío | Pago por hora aunque nadie lo use | Peor ajuste a la carga estacional |
| AWS Amplify Hosting | Muy simple para el frontend | Menos control y separado del resto de la IaC | Se prefiere todo en CDK |
| AWS SAM o Terraform | Válidos | CDK usa TypeScript, el mismo lenguaje del proyecto | Coherencia del stack |

## Consecuencias

**Positivas:**
- Costo casi nulo en reposo, salvo RDS y la instancia NAT.
- Escala sola en los picos de inscripción y resultados.
- Toda la infraestructura es reproducible y destruible con un comando.

**Negativas / riesgos aceptados:**
- **RDS en una sola AZ** y **una sola instancia NAT**: si fallan, el sistema queda fuera de servicio hasta recuperarlos. Aceptable para la demostración; en producción real: Multi-AZ y NAT Gateway.
- Arranque en frío de Lambda en la primera petición.
- **Los costos deben estimarse con AWS Pricing Calculator antes de desplegar**; este ADR no garantiza montos.

**Cómo verificamos que se cumple:**
- `cdk diff` revisado antes de cada despliegue.
- Lista de verificación de seguridad: RDS sin acceso público, buckets con bloqueo público, secretos fuera del repositorio.
