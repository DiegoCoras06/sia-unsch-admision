/*
  Warnings:

  - You are about to drop the column `linked_stage_code` on the `feature_flags` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "configuracion"."feature_flags" DROP COLUMN "linked_stage_code",
ADD COLUMN     "linked_stage_codes" TEXT[];
