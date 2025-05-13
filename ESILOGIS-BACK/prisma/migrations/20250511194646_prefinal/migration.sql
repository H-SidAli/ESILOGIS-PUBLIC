/*
  Warnings:

  - Added the required column `picture_url` to the `equipment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "intervention_history" DROP CONSTRAINT "intervention_history_logged_by_id_fkey";

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "picture_url" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "intervention_history" ALTER COLUMN "logged_by_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "work_schedule" ALTER COLUMN "startTime" SET DATA TYPE TIME(6),
ALTER COLUMN "endTime" SET DATA TYPE TIME(6);

-- AddForeignKey
ALTER TABLE "intervention_history" ADD CONSTRAINT "intervention_history_logged_by_id_fkey" FOREIGN KEY ("logged_by_id") REFERENCES "person"("person_id") ON DELETE SET NULL ON UPDATE CASCADE;
