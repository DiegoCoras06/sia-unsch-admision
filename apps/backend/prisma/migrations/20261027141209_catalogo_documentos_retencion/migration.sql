-- AlterTable
ALTER TABLE "convocatorias"."submodalities" ADD COLUMN     "evaluation_criteria" TEXT;

-- AlterTable
ALTER TABLE "inscripciones"."applications" ADD COLUMN     "anonymized_at" TIMESTAMPTZ(3),
ADD COLUMN     "consent_text_hash" VARCHAR(64),
ADD COLUMN     "consent_version" VARCHAR(20);

-- CreateTable
CREATE TABLE "inscripciones"."application_documents" (
    "id" UUID NOT NULL,
    "applicant_code" CHAR(8) NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "file_key" VARCHAR(200) NOT NULL,
    "file_name" VARCHAR(160) NOT NULL,
    "mime_type" VARCHAR(40) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion"."site_assets" (
    "key" VARCHAR(40) NOT NULL,
    "file_key" VARCHAR(200) NOT NULL,
    "mime_type" VARCHAR(40) NOT NULL,
    "alt" VARCHAR(300) NOT NULL,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "site_assets_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_documents_applicant_code_kind_key" ON "inscripciones"."application_documents"("applicant_code", "kind");
