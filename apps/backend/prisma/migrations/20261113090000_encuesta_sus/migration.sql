-- Encuesta SUS al terminar la inscripción (AC07 Usabilidad, EQ-07). Sin datos personales.
CREATE TABLE "inscripciones"."usability_surveys" (
    "id" UUID NOT NULL,
    "call_code" VARCHAR(10) NOT NULL,
    "applicant_code" CHAR(8) NOT NULL,
    "answers" INTEGER[],
    "score" DECIMAL(5,2) NOT NULL,
    "comment" VARCHAR(500),
    "duration_seconds" INTEGER,
    "device" VARCHAR(12),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usability_surveys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "usability_surveys_applicant_code_key" ON "inscripciones"."usability_surveys"("applicant_code");
CREATE INDEX "usability_surveys_call_code_idx" ON "inscripciones"."usability_surveys"("call_code");
