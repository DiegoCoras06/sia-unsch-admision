-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "pagos";

-- CreateEnum
CREATE TYPE "pagos"."PaymentOrderStatus" AS ENUM ('PENDIENTE', 'PAGADA');

-- CreateEnum
CREATE TYPE "pagos"."PaymentAttemptStatus" AS ENUM ('INICIADO', 'AUTORIZADO', 'RECHAZADO', 'VENCIDO', 'DUPLICADO');

-- CreateTable
CREATE TABLE "pagos"."payment_orders" (
    "id" UUID NOT NULL,
    "call_code" VARCHAR(10) NOT NULL,
    "applicant_code" CHAR(8) NOT NULL,
    "concept" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'PEN',
    "status" "pagos"."PaymentOrderStatus" NOT NULL DEFAULT 'PENDIENTE',
    "paid_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos"."payment_attempts" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" VARCHAR(10) NOT NULL,
    "transaction_id" VARCHAR(40) NOT NULL,
    "order_number" VARCHAR(15) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "pagos"."PaymentAttemptStatus" NOT NULL DEFAULT 'INICIADO',
    "provider_code" VARCHAR(30),
    "provider_message" VARCHAR(120),
    "pay_method" VARCHAR(20),
    "authorization_code" VARCHAR(20),
    "operation_number" VARCHAR(40),
    "reference_number" VARCHAR(40),
    "card_masked" VARCHAR(30),
    "confirmed_via" VARCHAR(10),
    "confirmed_at" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos"."payment_notifications" (
    "id" UUID NOT NULL,
    "source" VARCHAR(10) NOT NULL,
    "transaction_id" VARCHAR(40),
    "signature_valid" BOOLEAN NOT NULL,
    "provider_code" VARCHAR(30),
    "payload_hash" CHAR(64) NOT NULL,
    "outcome" VARCHAR(20) NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_applicant_code_key" ON "pagos"."payment_orders"("applicant_code");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_transaction_id_key" ON "pagos"."payment_attempts"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_order_number_key" ON "pagos"."payment_attempts"("order_number");

-- CreateIndex
CREATE INDEX "payment_attempts_order_id_created_at_idx" ON "pagos"."payment_attempts"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_notifications_transaction_id_idx" ON "pagos"."payment_notifications"("transaction_id");

-- AddForeignKey
ALTER TABLE "pagos"."payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "pagos"."payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
