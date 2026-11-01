-- CreateTable
CREATE TABLE "configuracion"."system_parameters" (
    "key" VARCHAR(60) NOT NULL,
    "value" VARCHAR(400) NOT NULL,
    "label" VARCHAR(160) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "system_parameters_pkey" PRIMARY KEY ("key")
);
