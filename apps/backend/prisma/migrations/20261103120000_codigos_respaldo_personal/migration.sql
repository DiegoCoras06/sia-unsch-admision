-- ADR-022: códigos de respaldo del segundo factor del personal.
CREATE TABLE "usuarios"."staff_recovery_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" CHAR(64) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_recovery_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "staff_recovery_codes_user_id_code_hash_key" ON "usuarios"."staff_recovery_codes"("user_id", "code_hash");

ALTER TABLE "usuarios"."staff_recovery_codes" ADD CONSTRAINT "staff_recovery_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
