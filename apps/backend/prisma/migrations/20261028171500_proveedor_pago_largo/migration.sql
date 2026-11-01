-- «micuentaweb» (11 caracteres) no cabía en VARCHAR(10).
ALTER TABLE "pagos"."payment_attempts" ALTER COLUMN "provider" SET DATA TYPE VARCHAR(20);
