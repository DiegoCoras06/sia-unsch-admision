-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "asistente";

-- CreateTable
CREATE TABLE "asistente"."knowledge_entries" (
    "id" UUID NOT NULL,
    "topic" VARCHAR(40) NOT NULL,
    "question" VARCHAR(200) NOT NULL,
    "answer" VARCHAR(2000) NOT NULL,
    "source" VARCHAR(160) NOT NULL,
    "keywords" VARCHAR(400) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "knowledge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistente"."conversations" (
    "id" UUID NOT NULL,
    "identified" BOOLEAN NOT NULL DEFAULT false,
    "handed_off" BOOLEAN NOT NULL DEFAULT false,
    "case_number" VARCHAR(30),
    "failed_turns" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistente"."messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" VARCHAR(10) NOT NULL,
    "content" VARCHAR(4000) NOT NULL,
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mode" VARCHAR(10) NOT NULL,
    "tokens_in" INTEGER NOT NULL DEFAULT 0,
    "tokens_out" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistente"."usage_daily" (
    "day" DATE NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "ai_replies" INTEGER NOT NULL DEFAULT 0,
    "tokens_in" INTEGER NOT NULL DEFAULT 0,
    "tokens_out" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "handoffs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usage_daily_pkey" PRIMARY KEY ("day")
);

-- CreateIndex
CREATE INDEX "conversations_created_at_idx" ON "asistente"."conversations"("created_at");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "asistente"."messages"("conversation_id", "created_at");

-- AddForeignKey
ALTER TABLE "asistente"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "asistente"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
