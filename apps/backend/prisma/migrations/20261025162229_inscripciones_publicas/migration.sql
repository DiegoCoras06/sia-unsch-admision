-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "inscripciones";

-- CreateEnum
CREATE TYPE "inscripciones"."ApplicationStatus" AS ENUM ('PENDIENTE_PAGO', 'PENDIENTE_VALIDACION', 'APTA', 'OBSERVADA', 'ANULADA');

-- CreateTable
CREATE TABLE "inscripciones"."applications" (
    "id" UUID NOT NULL,
    "call_code" VARCHAR(10) NOT NULL,
    "applicant_code" CHAR(8) NOT NULL,
    "document_type" VARCHAR(4) NOT NULL,
    "document_number" VARCHAR(12) NOT NULL,
    "identity_status" VARCHAR(10) NOT NULL,
    "paternal_surname" VARCHAR(80) NOT NULL,
    "maternal_surname" VARCHAR(80) NOT NULL,
    "first_names" VARCHAR(80) NOT NULL,
    "sex" CHAR(1) NOT NULL,
    "marital_status" VARCHAR(12) NOT NULL,
    "birth_ubigeo" CHAR(6) NOT NULL,
    "birth_date" DATE NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "residence_ubigeo" CHAR(6) NOT NULL,
    "economic_dependency" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(15),
    "mobile" CHAR(9) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "photo_key" VARCHAR(200) NOT NULL,
    "school_ubigeo" CHAR(6) NOT NULL,
    "school_name" VARCHAR(200) NOT NULL,
    "school_type" VARCHAR(10) NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "in_fourth_or_below" BOOLEAN NOT NULL,
    "preparation" VARCHAR(20) NOT NULL,
    "attempts" INTEGER NOT NULL,
    "modality" VARCHAR(6) NOT NULL,
    "quota_category" VARCHAR(6) NOT NULL,
    "campus" VARCHAR(20) NOT NULL,
    "area" VARCHAR(3) NOT NULL,
    "option_code" CHAR(3) NOT NULL,
    "military_condition" VARCHAR(12) NOT NULL,
    "family_link" BOOLEAN NOT NULL,
    "no_vacancy_right" BOOLEAN NOT NULL,
    "fee_total" DECIMAL(10,2) NOT NULL,
    "fee_lines" JSONB NOT NULL,
    "status" "inscripciones"."ApplicationStatus" NOT NULL,
    "declaration_accepted_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "applications_applicant_code_key" ON "inscripciones"."applications"("applicant_code");

-- CreateIndex
CREATE INDEX "applications_call_code_option_code_idx" ON "inscripciones"."applications"("call_code", "option_code");

-- CreateIndex
CREATE UNIQUE INDEX "applications_call_code_document_type_document_number_key" ON "inscripciones"."applications"("call_code", "document_type", "document_number");
