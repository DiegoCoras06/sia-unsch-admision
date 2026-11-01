-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "expedientes";

-- CreateEnum
CREATE TYPE "expedientes"."DossierStatus" AS ENUM ('BORRADOR', 'EN_REVISION', 'OBSERVADO', 'AUTORIZADO', 'RECHAZADO', 'NO_SUBSANADO');

-- CreateEnum
CREATE TYPE "expedientes"."DossierDocumentStatus" AS ENUM ('CARGADO', 'CONFORME', 'OBSERVADO', 'REEMPLAZADO');

-- CreateTable
CREATE TABLE "expedientes"."dossiers" (
    "id" UUID NOT NULL,
    "applicant_code" CHAR(8) NOT NULL,
    "call_code" VARCHAR(10) NOT NULL,
    "submodality" VARCHAR(10) NOT NULL,
    "status" "expedientes"."DossierStatus" NOT NULL DEFAULT 'BORRADOR',
    "evaluator_id" UUID,
    "submitted_at" TIMESTAMPTZ(3),
    "decided_at" TIMESTAMPTZ(3),
    "decision_note" VARCHAR(600),
    "observe_deadline" TIMESTAMPTZ(3),
    "verified_in_person" BOOLEAN NOT NULL DEFAULT false,
    "complementary" JSONB NOT NULL DEFAULT '{}',
    "special_evaluation" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expedientes"."dossier_documents" (
    "id" UUID NOT NULL,
    "dossier_id" UUID NOT NULL,
    "requirement_code" VARCHAR(30) NOT NULL,
    "version" INTEGER NOT NULL,
    "file_key" VARCHAR(200) NOT NULL,
    "file_name" VARCHAR(160) NOT NULL,
    "mime_type" VARCHAR(40) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "status" "expedientes"."DossierDocumentStatus" NOT NULL DEFAULT 'CARGADO',
    "note" VARCHAR(400),
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(3),
    "reviewer_id" UUID,

    CONSTRAINT "dossier_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expedientes"."dossier_events" (
    "id" UUID NOT NULL,
    "dossier_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" VARCHAR(40) NOT NULL,
    "note" VARCHAR(600),
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dossier_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_applicant_code_key" ON "expedientes"."dossiers"("applicant_code");

-- CreateIndex
CREATE INDEX "dossiers_status_evaluator_id_idx" ON "expedientes"."dossiers"("status", "evaluator_id");

-- CreateIndex
CREATE UNIQUE INDEX "dossier_documents_dossier_id_requirement_code_version_key" ON "expedientes"."dossier_documents"("dossier_id", "requirement_code", "version");

-- CreateIndex
CREATE INDEX "dossier_events_dossier_id_at_idx" ON "expedientes"."dossier_events"("dossier_id", "at");

-- AddForeignKey
ALTER TABLE "expedientes"."dossier_documents" ADD CONSTRAINT "dossier_documents_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "expedientes"."dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes"."dossier_events" ADD CONSTRAINT "dossier_events_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "expedientes"."dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
