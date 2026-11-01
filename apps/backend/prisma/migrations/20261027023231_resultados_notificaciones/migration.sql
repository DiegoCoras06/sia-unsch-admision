-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notificaciones";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "resultados";

-- CreateEnum
CREATE TYPE "pagos"."ReconciliationResult" AS ENUM ('CONCILIADO', 'DIFERENCIA_MONTO', 'DIFERENCIA_ESTADO', 'SOLO_PROVEEDOR', 'SOLO_SISTEMA');

-- CreateEnum
CREATE TYPE "pagos"."AnnulmentStatus" AS ENUM ('SOLICITADA', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "resultados"."ScoreBatchStatus" AS ENUM ('VALIDO', 'CON_ERRORES', 'PROCESADO');

-- CreateEnum
CREATE TYPE "resultados"."ResultVersionStatus" AS ENUM ('BORRADOR', 'EN_APROBACION', 'PUBLICADA', 'REEMPLAZADA', 'DESCARTADA');

-- CreateEnum
CREATE TYPE "resultados"."ResultCondition" AS ENUM ('ADMITIDO', 'NO_ADMITIDO', 'AUSENTE', 'NO_CALIFICABLE', 'SIN_DERECHO_VACANTE');

-- CreateEnum
CREATE TYPE "resultados"."AdmissionStatus" AS ENUM ('PENDIENTE', 'INGRESANTE', 'PERDIDA');

-- CreateEnum
CREATE TYPE "notificaciones"."NotificationStatus" AS ENUM ('PENDIENTE', 'ENVIADA', 'FALLIDA', 'REBOTADA');

-- AlterEnum
ALTER TYPE "seguridad"."SupportCaseType" ADD VALUE 'RESULT_REVIEW';

-- AlterTable
ALTER TABLE "examenes"."exams" ADD COLUMN     "rooms_notified_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "pagos"."reconciliation_runs" (
    "id" UUID NOT NULL,
    "source" VARCHAR(20) NOT NULL,
    "file_name" VARCHAR(160) NOT NULL,
    "period_from" TIMESTAMPTZ(3) NOT NULL,
    "period_to" TIMESTAMPTZ(3) NOT NULL,
    "summary" JSONB NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos"."reconciliation_items" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "reference" VARCHAR(40) NOT NULL,
    "applicant_code" CHAR(8),
    "provider_amount" DECIMAL(10,2),
    "provider_status" VARCHAR(20),
    "system_amount" DECIMAL(10,2),
    "system_status" VARCHAR(20),
    "result" "pagos"."ReconciliationResult" NOT NULL,
    "resolution" VARCHAR(400),
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(3),

    CONSTRAINT "reconciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos"."payment_annulments" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "kind" VARCHAR(12) NOT NULL,
    "reason" VARCHAR(20) NOT NULL,
    "detail" VARCHAR(600) NOT NULL,
    "resolution" VARCHAR(120) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "pagos"."AnnulmentStatus" NOT NULL DEFAULT 'SOLICITADA',
    "requested_by" UUID NOT NULL,
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(3),
    "decision_note" VARCHAR(400),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_annulments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados"."score_batches" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "file_name" VARCHAR(160) NOT NULL,
    "status" "resultados"."ScoreBatchStatus" NOT NULL,
    "rows" JSONB NOT NULL,
    "issues" JSONB NOT NULL,
    "valid_count" INTEGER NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados"."result_versions" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "call_code" VARCHAR(10) NOT NULL,
    "version" INTEGER NOT NULL,
    "batch_id" UUID NOT NULL,
    "status" "resultados"."ResultVersionStatus" NOT NULL DEFAULT 'BORRADOR',
    "reason" VARCHAR(400),
    "created_by" UUID NOT NULL,
    "submitted_by" UUID,
    "submitted_at" TIMESTAMPTZ(3),
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "publish_at" TIMESTAMPTZ(3),
    "notified_at" TIMESTAMPTZ(3),
    "vacancies" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "result_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados"."exam_results" (
    "id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "applicant_code" CHAR(8) NOT NULL,
    "option_code" CHAR(3) NOT NULL,
    "quota_category" VARCHAR(6) NOT NULL,
    "knowledge" INTEGER,
    "vocational" INTEGER,
    "attitude" INTEGER,
    "score" DECIMAL(7,2),
    "rank" INTEGER,
    "condition" "resultados"."ResultCondition" NOT NULL,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados"."admissions" (
    "id" UUID NOT NULL,
    "applicant_code" CHAR(8) NOT NULL,
    "call_code" VARCHAR(10) NOT NULL,
    "status" "resultados"."AdmissionStatus" NOT NULL DEFAULT 'PENDIENTE',
    "documents_received_at" TIMESTAMPTZ(3),
    "received_by" UUID,
    "receipt_number" VARCHAR(40),
    "late" BOOLEAN NOT NULL DEFAULT false,
    "amount_paid" DECIMAL(10,2),
    "note" VARCHAR(400),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones"."notifications" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "event" VARCHAR(40) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "notificaciones"."NotificationStatus" NOT NULL DEFAULT 'PENDIENTE',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" VARCHAR(500),
    "dedupe_key" VARCHAR(120),
    "campaign_id" UUID,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "read_at" TIMESTAMPTZ(3),
    "sent_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones"."notification_templates" (
    "key" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "notificaciones"."campaigns" (
    "id" UUID NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "segment" JSONB NOT NULL,
    "recipients" INTEGER NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones"."notification_preferences" (
    "email" VARCHAR(254) NOT NULL,
    "reminders" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE INDEX "reconciliation_items_run_id_result_idx" ON "pagos"."reconciliation_items"("run_id", "result");

-- CreateIndex
CREATE INDEX "payment_annulments_attempt_id_idx" ON "pagos"."payment_annulments"("attempt_id");

-- CreateIndex
CREATE INDEX "score_batches_exam_id_idx" ON "resultados"."score_batches"("exam_id");

-- CreateIndex
CREATE UNIQUE INDEX "result_versions_exam_id_version_key" ON "resultados"."result_versions"("exam_id", "version");

-- CreateIndex
CREATE INDEX "exam_results_version_id_option_code_quota_category_idx" ON "resultados"."exam_results"("version_id", "option_code", "quota_category");

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_version_id_applicant_code_key" ON "resultados"."exam_results"("version_id", "applicant_code");

-- CreateIndex
CREATE UNIQUE INDEX "admissions_applicant_code_key" ON "resultados"."admissions"("applicant_code");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notificaciones"."notifications"("dedupe_key");

-- CreateIndex
CREATE INDEX "notifications_email_created_at_idx" ON "notificaciones"."notifications"("email", "created_at");

-- CreateIndex
CREATE INDEX "notifications_status_created_at_idx" ON "notificaciones"."notifications"("status", "created_at");

-- CreateIndex
CREATE INDEX "notifications_campaign_id_idx" ON "notificaciones"."notifications"("campaign_id");

-- AddForeignKey
ALTER TABLE "pagos"."reconciliation_items" ADD CONSTRAINT "reconciliation_items_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "pagos"."reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados"."exam_results" ADD CONSTRAINT "exam_results_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "resultados"."result_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
