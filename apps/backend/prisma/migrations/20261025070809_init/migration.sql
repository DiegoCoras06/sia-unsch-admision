-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "configuracion";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "convocatorias";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "seguridad";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "shared";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "usuarios";

-- CreateEnum
CREATE TYPE "convocatorias"."CallStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "convocatorias"."StageScope" AS ENUM ('ORD', 'EXO', 'CEPRE', 'REINS', 'ALL');

-- CreateEnum
CREATE TYPE "convocatorias"."StageKind" AS ENUM ('REGULAR', 'EXTEMPORANEOUS', 'EXAM', 'PUBLICATION', 'DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "convocatorias"."FeeKind" AS ENUM ('BASE', 'SURCHARGE', 'OTHER');

-- CreateEnum
CREATE TYPE "convocatorias"."SchoolType" AS ENUM ('ESTATAL', 'PARTICULAR');

-- CreateEnum
CREATE TYPE "convocatorias"."MilitaryCondition" AS ENUM ('NONE', 'ACTIVE', 'DISCHARGED');

-- CreateEnum
CREATE TYPE "convocatorias"."SyllabusLevel" AS ENUM ('AREA', 'COURSE', 'SECTION', 'TOPIC');

-- CreateEnum
CREATE TYPE "configuracion"."AnnouncementType" AS ENUM ('COMUNICADO', 'FE_ERRATAS', 'RESULTADO');

-- CreateEnum
CREATE TYPE "usuarios"."UserType" AS ENUM ('APPLICANT', 'STAFF');

-- CreateEnum
CREATE TYPE "usuarios"."UserStatus" AS ENUM ('PENDING_EMAIL', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "usuarios"."DocumentType" AS ENUM ('DNI', 'CE', 'PASAPORTE');

-- CreateEnum
CREATE TYPE "usuarios"."IdentityStatus" AS ENUM ('VERIFIED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "seguridad"."SupportCaseType" AS ENUM ('CONTACT', 'COMPLAINT', 'CHATBOT_ESCALATION');

-- CreateEnum
CREATE TYPE "seguridad"."SupportCaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- CreateTable
CREATE TABLE "convocatorias"."admission_calls" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "year" INTEGER NOT NULL,
    "period" VARCHAR(3) NOT NULL,
    "status" "convocatorias"."CallStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admission_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."schedule_stages" (
    "id" UUID NOT NULL,
    "call_id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "scope" "convocatorias"."StageScope" NOT NULL,
    "kind" "convocatorias"."StageKind" NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "schedule_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."academic_areas" (
    "id" UUID NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(60) NOT NULL,

    CONSTRAINT "academic_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."faculties" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."programs" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "faculty_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "schedule_number" INTEGER NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."application_options" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "internal_code" CHAR(3) NOT NULL,
    "specialty" VARCHAR(160),
    "official_vacancy_code" VARCHAR(4) NOT NULL,
    "display_name" VARCHAR(200) NOT NULL,
    "search_text" VARCHAR(400) NOT NULL,
    "duration_years" INTEGER NOT NULL,
    "degree" VARCHAR(200) NOT NULL,
    "professional_title" VARCHAR(300) NOT NULL,
    "profile_page" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "application_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."modalities" (
    "id" UUID NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "modalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."submodalities" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "modality_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "legal_basis" VARCHAR(200) NOT NULL,
    "uses_base_documents" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "submodalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."quota_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "modality_id" UUID NOT NULL,
    "submodality_id" UUID,
    "variant" VARCHAR(20),
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "quota_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."vacancies" (
    "id" UUID NOT NULL,
    "call_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "quota_category_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."fees" (
    "id" UUID NOT NULL,
    "call_id" UUID NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "concept" VARCHAR(200) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "kind" "convocatorias"."FeeKind" NOT NULL,
    "legal_note" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."fee_rules" (
    "id" UUID NOT NULL,
    "call_id" UUID NOT NULL,
    "fee_id" UUID NOT NULL,
    "modality_code" VARCHAR(6) NOT NULL,
    "submodality_code" VARCHAR(10),
    "school_type" "convocatorias"."SchoolType",
    "military_condition" "convocatorias"."MilitaryCondition",
    "family_link" BOOLEAN,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "fee_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."surcharge_rules" (
    "id" UUID NOT NULL,
    "call_id" UUID NOT NULL,
    "fee_id" UUID NOT NULL,
    "applies_to_scope" "convocatorias"."StageScope" NOT NULL,
    "stage_kind" "convocatorias"."StageKind" NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "surcharge_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."requirement_documents" (
    "id" UUID NOT NULL,
    "call_id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "article" VARCHAR(20) NOT NULL,
    "accepted_formats" TEXT[],
    "is_base" BOOLEAN NOT NULL,

    CONSTRAINT "requirement_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."submodality_requirements" (
    "id" UUID NOT NULL,
    "submodality_id" UUID NOT NULL,
    "requirement_id" UUID NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "submodality_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."syllabus_nodes" (
    "id" UUID NOT NULL,
    "call_id" UUID NOT NULL,
    "parent_id" UUID,
    "level" "convocatorias"."SyllabusLevel" NOT NULL,
    "title" VARCHAR(400) NOT NULL,
    "search_text" VARCHAR(400) NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "syllabus_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias"."official_documents" (
    "id" UUID NOT NULL,
    "call_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "public_url" VARCHAR(400) NOT NULL,
    "published_at" TIMESTAMPTZ(3) NOT NULL,
    "size_bytes" INTEGER NOT NULL,

    CONSTRAINT "official_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion"."announcements" (
    "id" UUID NOT NULL,
    "call_code" VARCHAR(10),
    "type" "configuracion"."AnnouncementType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body_md" TEXT NOT NULL,
    "affects_section" VARCHAR(30),
    "published_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion"."content_blocks" (
    "key" VARCHAR(40) NOT NULL,
    "body_md" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "configuracion"."hero_slides" (
    "id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "subtitle" VARCHAR(200) NOT NULL,
    "image_url" VARCHAR(400) NOT NULL,
    "cta_label" VARCHAR(40),
    "cta_route" VARCHAR(120),
    "sort_order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion"."authority_messages" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "position" VARCHAR(160) NOT NULL,
    "message" TEXT NOT NULL,
    "photo_url" VARCHAR(400) NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "authority_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion"."feature_flags" (
    "key" VARCHAR(40) NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "route" VARCHAR(120) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "linked_stage_code" VARCHAR(40),
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "usuarios"."users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "type" "usuarios"."UserType" NOT NULL,
    "status" "usuarios"."UserStatus" NOT NULL DEFAULT 'PENDING_EMAIL',
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "failed_login_since" TIMESTAMPTZ(3),
    "locked_until" TIMESTAMPTZ(3),
    "email_verified_at" TIMESTAMPTZ(3),
    "last_login_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios"."applicants" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_type" "usuarios"."DocumentType" NOT NULL,
    "document_number" VARCHAR(12) NOT NULL,
    "applicant_code" CHAR(8) NOT NULL,
    "first_names" VARCHAR(80) NOT NULL,
    "paternal_surname" VARCHAR(80) NOT NULL,
    "maternal_surname" VARCHAR(80) NOT NULL,
    "birth_date" DATE,
    "phone" VARCHAR(9) NOT NULL,
    "ubigeo" CHAR(6),
    "address_line" VARCHAR(200),
    "guardian_name" VARCHAR(160),
    "identity_status" "usuarios"."IdentityStatus" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios"."identity_verifications" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "provider" VARCHAR(10) NOT NULL,
    "result" VARCHAR(20) NOT NULL,
    "checked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_by" UUID,

    CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios"."email_verification_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "code_hmac" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMPTZ(3),
    "sent_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios"."password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios"."consent_documents" (
    "version" VARCHAR(20) NOT NULL,
    "text_md" TEXT NOT NULL,
    "text_hash" VARCHAR(64) NOT NULL,
    "published_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "consent_documents_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "usuarios"."consents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "text_hash" VARCHAR(64) NOT NULL,
    "accepted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguridad"."sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "last_refreshed_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "revoke_reason" VARCHAR(20),
    "replaced_by" UUID,
    "user_agent" VARCHAR(300),
    "ip_hash" VARCHAR(64),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguridad"."roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguridad"."permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(60) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguridad"."role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "seguridad"."user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "seguridad"."disqualified_persons" (
    "id" UUID NOT NULL,
    "document_type" VARCHAR(10) NOT NULL,
    "document_number" VARCHAR(12) NOT NULL,
    "reason" VARCHAR(300) NOT NULL,
    "resolution" VARCHAR(120) NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_until" DATE,

    CONSTRAINT "disqualified_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguridad"."audit_events" (
    "id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_user_id" UUID,
    "action" VARCHAR(60) NOT NULL,
    "resource_type" VARCHAR(40) NOT NULL,
    "resource_id" VARCHAR(60),
    "before" JSONB,
    "after" JSONB,
    "request_id" VARCHAR(40),
    "ip_hash" VARCHAR(64),
    "user_agent" VARCHAR(300),

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguridad"."support_cases" (
    "id" UUID NOT NULL,
    "case_number" VARCHAR(20) NOT NULL,
    "type" "seguridad"."SupportCaseType" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(9),
    "message" VARCHAR(2000) NOT NULL,
    "status" "seguridad"."SupportCaseStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared"."rate_limit_counters" (
    "key" VARCHAR(120) NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "rate_limit_counters_pkey" PRIMARY KEY ("key","window_start")
);

-- CreateTable
CREATE TABLE "shared"."outbox" (
    "id" UUID NOT NULL,
    "event_type" VARCHAR(60) NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correlation_id" VARCHAR(40),
    "processed_at" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" VARCHAR(500),

    CONSTRAINT "outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared"."counters" (
    "key" VARCHAR(40) NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "counters_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "admission_calls_code_key" ON "convocatorias"."admission_calls"("code");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_stages_call_id_code_key" ON "convocatorias"."schedule_stages"("call_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "academic_areas_code_key" ON "convocatorias"."academic_areas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_name_key" ON "convocatorias"."faculties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "programs_name_key" ON "convocatorias"."programs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "application_options_internal_code_key" ON "convocatorias"."application_options"("internal_code");

-- CreateIndex
CREATE UNIQUE INDEX "modalities_code_key" ON "convocatorias"."modalities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "submodalities_code_key" ON "convocatorias"."submodalities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "quota_categories_code_key" ON "convocatorias"."quota_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vacancies_call_id_option_id_quota_category_id_key" ON "convocatorias"."vacancies"("call_id", "option_id", "quota_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "fees_call_id_code_key" ON "convocatorias"."fees"("call_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_documents_call_id_code_key" ON "convocatorias"."requirement_documents"("call_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "submodality_requirements_submodality_id_requirement_id_key" ON "convocatorias"."submodality_requirements"("submodality_id", "requirement_id");

-- CreateIndex
CREATE INDEX "syllabus_nodes_call_id_search_text_idx" ON "convocatorias"."syllabus_nodes"("call_id", "search_text");

-- CreateIndex
CREATE INDEX "announcements_published_at_idx" ON "configuracion"."announcements"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "usuarios"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "applicants_user_id_key" ON "usuarios"."applicants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "applicants_applicant_code_key" ON "usuarios"."applicants"("applicant_code");

-- CreateIndex
CREATE UNIQUE INDEX "applicants_document_type_document_number_key" ON "usuarios"."applicants"("document_type", "document_number");

-- CreateIndex
CREATE INDEX "email_verification_codes_user_id_sent_at_idx" ON "usuarios"."email_verification_codes"("user_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "usuarios"."password_reset_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "consents_user_id_version_key" ON "usuarios"."consents"("user_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "seguridad"."sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "seguridad"."sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_family_id_idx" ON "seguridad"."sessions"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "seguridad"."roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "seguridad"."permissions"("code");

-- CreateIndex
CREATE INDEX "disqualified_persons_document_type_document_number_idx" ON "seguridad"."disqualified_persons"("document_type", "document_number");

-- CreateIndex
CREATE INDEX "audit_events_actor_user_id_occurred_at_idx" ON "seguridad"."audit_events"("actor_user_id", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "support_cases_case_number_key" ON "seguridad"."support_cases"("case_number");

-- CreateIndex
CREATE INDEX "outbox_processed_at_occurred_at_idx" ON "shared"."outbox"("processed_at", "occurred_at");

-- AddForeignKey
ALTER TABLE "convocatorias"."schedule_stages" ADD CONSTRAINT "schedule_stages_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "convocatorias"."admission_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."programs" ADD CONSTRAINT "programs_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "convocatorias"."faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."programs" ADD CONSTRAINT "programs_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "convocatorias"."academic_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."application_options" ADD CONSTRAINT "application_options_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "convocatorias"."programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."submodalities" ADD CONSTRAINT "submodalities_modality_id_fkey" FOREIGN KEY ("modality_id") REFERENCES "convocatorias"."modalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."quota_categories" ADD CONSTRAINT "quota_categories_modality_id_fkey" FOREIGN KEY ("modality_id") REFERENCES "convocatorias"."modalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."quota_categories" ADD CONSTRAINT "quota_categories_submodality_id_fkey" FOREIGN KEY ("submodality_id") REFERENCES "convocatorias"."submodalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."vacancies" ADD CONSTRAINT "vacancies_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "convocatorias"."admission_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."vacancies" ADD CONSTRAINT "vacancies_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "convocatorias"."application_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."vacancies" ADD CONSTRAINT "vacancies_quota_category_id_fkey" FOREIGN KEY ("quota_category_id") REFERENCES "convocatorias"."quota_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."fees" ADD CONSTRAINT "fees_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "convocatorias"."admission_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."fee_rules" ADD CONSTRAINT "fee_rules_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "convocatorias"."admission_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."fee_rules" ADD CONSTRAINT "fee_rules_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "convocatorias"."fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."surcharge_rules" ADD CONSTRAINT "surcharge_rules_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "convocatorias"."admission_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."surcharge_rules" ADD CONSTRAINT "surcharge_rules_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "convocatorias"."fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."requirement_documents" ADD CONSTRAINT "requirement_documents_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "convocatorias"."admission_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."submodality_requirements" ADD CONSTRAINT "submodality_requirements_submodality_id_fkey" FOREIGN KEY ("submodality_id") REFERENCES "convocatorias"."submodalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."submodality_requirements" ADD CONSTRAINT "submodality_requirements_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "convocatorias"."requirement_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."syllabus_nodes" ADD CONSTRAINT "syllabus_nodes_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "convocatorias"."admission_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."syllabus_nodes" ADD CONSTRAINT "syllabus_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "convocatorias"."syllabus_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias"."official_documents" ADD CONSTRAINT "official_documents_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "convocatorias"."admission_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios"."applicants" ADD CONSTRAINT "applicants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios"."identity_verifications" ADD CONSTRAINT "identity_verifications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "usuarios"."applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios"."email_verification_codes" ADD CONSTRAINT "email_verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios"."consents" ADD CONSTRAINT "consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios"."consents" ADD CONSTRAINT "consents_version_fkey" FOREIGN KEY ("version") REFERENCES "usuarios"."consent_documents"("version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguridad"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "seguridad"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguridad"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "seguridad"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguridad"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "seguridad"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
