-- CreateTable
CREATE TABLE "usuarios"."staff_profiles" (
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "document_number" VARCHAR(12),
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "mfa_secret_enc" VARCHAR(200),
    "mfa_enabled_at" TIMESTAMPTZ(3),
    "mfa_last_step" INTEGER,
    "created_by" UUID,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "usuarios"."staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
