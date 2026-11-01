-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "examenes";

-- CreateEnum
CREATE TYPE "examenes"."ExamStatus" AS ENUM ('PROGRAMADO', 'DISTRIBUIDO', 'CONFIRMADO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "examenes"."AttendanceStatus" AS ENUM ('PENDIENTE', 'PRESENTE', 'AUSENTE');

-- CreateTable
CREATE TABLE "examenes"."exams" (
    "id" UUID NOT NULL,
    "call_code" VARCHAR(10) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "modalities" VARCHAR(6)[],
    "entry_opens_at" TIMESTAMPTZ(3) NOT NULL,
    "entry_closes_at" TIMESTAMPTZ(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "place" VARCHAR(200) NOT NULL,
    "structure" JSONB NOT NULL,
    "scoring" JSONB NOT NULL,
    "instructions" JSONB NOT NULL,
    "publish_at" TIMESTAMPTZ(3) NOT NULL,
    "status" "examenes"."ExamStatus" NOT NULL DEFAULT 'PROGRAMADO',
    "distribution_version" INTEGER NOT NULL DEFAULT 0,
    "distributed_at" TIMESTAMPTZ(3),
    "confirmed_at" TIMESTAMPTZ(3),
    "attendance_closed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes"."venues" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes"."rooms" (
    "id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "building" VARCHAR(60) NOT NULL,
    "floor" INTEGER NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "gate" VARCHAR(40) NOT NULL,
    "accessible" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes"."exam_rooms" (
    "exam_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,

    CONSTRAINT "exam_rooms_pkey" PRIMARY KEY ("exam_id","room_id")
);

-- CreateTable
CREATE TABLE "examenes"."exam_assignments" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "applicant_code" CHAR(8) NOT NULL,
    "room_id" UUID NOT NULL,
    "seat" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "attendance" "examenes"."AttendanceStatus" NOT NULL DEFAULT 'PENDIENTE',
    "checked_in_at" TIMESTAMPTZ(3),
    "late" BOOLEAN NOT NULL DEFAULT false,
    "checked_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes"."assignment_changes" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "from_room_id" UUID,
    "to_room_id" UUID NOT NULL,
    "reason" VARCHAR(400) NOT NULL,
    "actor_id" UUID,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes"."exam_incidents" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "room_id" UUID,
    "applicant_code" CHAR(8),
    "type" VARCHAR(30) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "reported_by" UUID NOT NULL,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes"."accommodation_requests" (
    "id" UUID NOT NULL,
    "applicant_code" CHAR(8) NOT NULL,
    "exam_id" UUID NOT NULL,
    "needs" VARCHAR(600) NOT NULL,
    "late" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "accommodation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exams_call_code_code_key" ON "examenes"."exams"("call_code", "code");

-- CreateIndex
CREATE UNIQUE INDEX "venues_code_key" ON "examenes"."venues"("code");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_venue_id_code_key" ON "examenes"."rooms"("venue_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "exam_assignments_exam_id_applicant_code_key" ON "examenes"."exam_assignments"("exam_id", "applicant_code");

-- CreateIndex
CREATE UNIQUE INDEX "exam_assignments_exam_id_room_id_seat_key" ON "examenes"."exam_assignments"("exam_id", "room_id", "seat");

-- CreateIndex
CREATE INDEX "assignment_changes_assignment_id_idx" ON "examenes"."assignment_changes"("assignment_id");

-- CreateIndex
CREATE INDEX "exam_incidents_exam_id_idx" ON "examenes"."exam_incidents"("exam_id");

-- CreateIndex
CREATE UNIQUE INDEX "accommodation_requests_applicant_code_key" ON "examenes"."accommodation_requests"("applicant_code");

-- AddForeignKey
ALTER TABLE "examenes"."rooms" ADD CONSTRAINT "rooms_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "examenes"."venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes"."exam_rooms" ADD CONSTRAINT "exam_rooms_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "examenes"."exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes"."exam_rooms" ADD CONSTRAINT "exam_rooms_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "examenes"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes"."exam_assignments" ADD CONSTRAINT "exam_assignments_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "examenes"."exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes"."exam_assignments" ADD CONSTRAINT "exam_assignments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "examenes"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes"."assignment_changes" ADD CONSTRAINT "assignment_changes_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "examenes"."exam_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes"."exam_incidents" ADD CONSTRAINT "exam_incidents_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "examenes"."exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
