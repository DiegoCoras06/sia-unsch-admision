-- T542: evidencia adjunta a las denuncias.
CREATE TABLE "seguridad"."support_case_attachments" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "file_name" VARCHAR(200) NOT NULL,
    "content_type" VARCHAR(40) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "storage_key" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_case_attachments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "support_case_attachments_case_id_idx" ON "seguridad"."support_case_attachments"("case_id");
ALTER TABLE "seguridad"."support_case_attachments" ADD CONSTRAINT "support_case_attachments_case_id_fkey"
    FOREIGN KEY ("case_id") REFERENCES "seguridad"."support_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- T640: lista de adjudicados del CEPRE-UNSCH.
CREATE TABLE "inscripciones"."cepre_awardees" (
    "id" UUID NOT NULL,
    "call_code" VARCHAR(10) NOT NULL,
    "document_number" VARCHAR(12) NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "option_code" CHAR(3) NOT NULL,
    "cycle" VARCHAR(10) NOT NULL,
    "loaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cepre_awardees_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cepre_awardees_call_code_document_number_key" ON "inscripciones"."cepre_awardees"("call_code", "document_number");

-- T232: reinscripción de exonerados no admitidos al Ordinario (RN-16): una segunda inscripción con otra modalidad.
ALTER TABLE "inscripciones"."applications" ADD COLUMN "reinscription_of" CHAR(8);
DROP INDEX "inscripciones"."applications_call_code_document_type_document_number_key";
CREATE UNIQUE INDEX "applications_call_code_document_type_document_number_modality_key"
    ON "inscripciones"."applications"("call_code", "document_type", "document_number", "modality");
