-- queued_at representa una confirmación de SQS. Esta reserva separada evita
-- que dos relays envíen el mismo evento mientras la llamada de red está en curso.
ALTER TABLE "shared"."outbox"
  ADD COLUMN "relay_claimed_at" TIMESTAMPTZ(3);

CREATE INDEX "outbox_relay_pending_idx"
  ON "shared"."outbox" ("relay_claimed_at", "occurred_at")
  WHERE "processed_at" IS NULL AND "dead_lettered_at" IS NULL;
