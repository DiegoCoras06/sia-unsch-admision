-- Sprint 2 / EQ-09: DLQ con reintentos espaciados e idempotencia persistente.
ALTER TABLE "shared"."outbox"
  ADD COLUMN "next_attempt_at" TIMESTAMPTZ(3),
  ADD COLUMN "dead_lettered_at" TIMESTAMPTZ(3);

CREATE INDEX "outbox_dead_lettered_at_occurred_at_idx"
  ON "shared"."outbox"("dead_lettered_at", "occurred_at");

CREATE TABLE "shared"."idempotency_records" (
  "id" UUID NOT NULL,
  "scope" VARCHAR(160) NOT NULL,
  "key" VARCHAR(100) NOT NULL,
  "request_hash" CHAR(64) NOT NULL,
  "state" VARCHAR(12) NOT NULL,
  "status_code" INTEGER,
  "response" JSONB,
  "locked_at" TIMESTAMPTZ(3) NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idempotency_records_scope_key_key"
  ON "shared"."idempotency_records"("scope", "key");
CREATE INDEX "idempotency_records_expires_at_idx"
  ON "shared"."idempotency_records"("expires_at");
