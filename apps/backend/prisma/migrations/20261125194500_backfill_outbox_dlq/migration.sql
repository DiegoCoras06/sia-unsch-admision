-- Eventos agotados antes de incorporar la DLQ: conservarlos y clasificarlos para revisión manual.
UPDATE "shared"."outbox"
SET "dead_lettered_at" = CURRENT_TIMESTAMP,
    "next_attempt_at" = NULL,
    "claimed_at" = NULL,
    "queued_at" = NULL
WHERE "processed_at" IS NULL
  AND "dead_lettered_at" IS NULL
  AND "attempts" >= 5;
