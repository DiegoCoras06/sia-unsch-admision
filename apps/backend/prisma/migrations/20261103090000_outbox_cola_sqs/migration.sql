-- ADR-021: la bandeja de eventos recuerda cuándo envió cada evento a Amazon SQS.
ALTER TABLE "shared"."outbox" ADD COLUMN "queued_at" TIMESTAMPTZ(3);
