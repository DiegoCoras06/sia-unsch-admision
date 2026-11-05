-- Reserva del evento mientras se procesa: evita correos duplicados con varios procesadores.
ALTER TABLE "shared"."outbox" ADD COLUMN "claimed_at" TIMESTAMPTZ(3);
