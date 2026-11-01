-- Restricciones de integridad que Prisma no expresa en el esquema (ADR-005, data-model.md).

-- M01 Convocatorias
ALTER TABLE "convocatorias"."schedule_stages"
  ADD CONSTRAINT "schedule_stages_dates_chk" CHECK ("ends_at" >= "starts_at");
ALTER TABLE "convocatorias"."vacancies"
  ADD CONSTRAINT "vacancies_quantity_chk" CHECK ("quantity" >= 0);
ALTER TABLE "convocatorias"."fees"
  ADD CONSTRAINT "fees_amount_chk" CHECK ("amount" >= 0);
ALTER TABLE "convocatorias"."admission_calls"
  ADD CONSTRAINT "admission_calls_code_chk" CHECK ("code" ~ '^\d{4}-(I|II)$'),
  ADD CONSTRAINT "admission_calls_published_chk" CHECK ("status" = 'DRAFT' OR "published_at" IS NOT NULL);
ALTER TABLE "convocatorias"."application_options"
  ADD CONSTRAINT "application_options_code_chk" CHECK ("internal_code" ~ '^P\d{2}$');

-- M02 Usuarios
ALTER TABLE "usuarios"."users"
  ADD CONSTRAINT "users_email_lower_chk" CHECK ("email" = lower("email"));
ALTER TABLE "usuarios"."applicants"
  ADD CONSTRAINT "applicants_phone_chk" CHECK ("phone" ~ '^9\d{8}$'),
  ADD CONSTRAINT "applicants_dni_chk" CHECK ("document_type" <> 'DNI' OR "document_number" ~ '^\d{8}$'),
  ADD CONSTRAINT "applicants_code_chk" CHECK ("applicant_code" ~ '^\d{8}$');
ALTER TABLE "usuarios"."email_verification_codes"
  ADD CONSTRAINT "email_codes_attempts_chk" CHECK ("attempts" BETWEEN 0 AND 5);

-- M13 Seguridad: auditoría solo de inserción (RNF-10).
-- En AWS además el rol de la aplicación no tiene UPDATE/DELETE sobre esta tabla.
CREATE FUNCTION "seguridad"."audit_events_immutable"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events es de solo inserción';
END;
$$;

CREATE TRIGGER "audit_events_no_update_delete"
  BEFORE UPDATE OR DELETE ON "seguridad"."audit_events"
  FOR EACH ROW EXECUTE FUNCTION "seguridad"."audit_events_immutable"();
