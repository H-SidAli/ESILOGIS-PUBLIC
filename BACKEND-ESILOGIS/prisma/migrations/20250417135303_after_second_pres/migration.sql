/*
  Warnings:

  - The `priority` column on the `intervention` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `department` on the `person` table. All the data in the column will be lost.
  - You are about to drop the column `role_id` on the `user_account` table. All the data in the column will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `updated_at` on table `equipment` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TECHNICIAN', 'USER');

-- CreateEnum
CREATE TYPE "InterventionType" AS ENUM ('CORRECTIVE', 'PREVENTIVE');

-- CreateEnum
CREATE TYPE "InterventionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- AlterEnum
ALTER TYPE "EquipmentStatus" ADD VALUE 'RETIRED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InterventionStatus" ADD VALUE 'APPROVED';
ALTER TYPE "InterventionStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "InterventionStatus" ADD VALUE 'DENIED';
ALTER TYPE "InterventionStatus" ADD VALUE 'PAUSED';

-- DropForeignKey
ALTER TABLE "intervention_assignment" DROP CONSTRAINT "intervention_assignment_intervention_id_fkey";

-- DropForeignKey
ALTER TABLE "user_account" DROP CONSTRAINT "user_account_role_id_fkey";

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "next_scheduled_maintenance" TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "intervention" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "completed_by_user_id" INTEGER,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "estimated_duration" INTEGER,
ADD COLUMN     "is_recurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parts_used" TEXT,
ADD COLUMN     "recurrence_interval" INTEGER,
ADD COLUMN     "resolutionSummary" TEXT,
ADD COLUMN     "started_at" TIMESTAMP(3),
ADD COLUMN     "type" "InterventionType" NOT NULL DEFAULT 'CORRECTIVE',
ADD COLUMN     "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "priority",
ADD COLUMN     "priority" "InterventionPriority" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "person" DROP COLUMN "department",
ADD COLUMN     "department_id" INTEGER,
ADD COLUMN     "is_retired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_hash" VARCHAR(255),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user_account" DROP COLUMN "role_id",
ADD COLUMN     "is_blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "role";

-- DropEnum
DROP TYPE "Priority";

-- CreateTable
CREATE TABLE "department" (
    "department_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "work_schedule" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "day" "Weekday" NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,

    CONSTRAINT "work_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pause" (
    "id" SERIAL NOT NULL,
    "intervention_id" INTEGER NOT NULL,
    "paused_at" TIMESTAMP(3) NOT NULL,
    "resumed_at" TIMESTAMP(3),

    CONSTRAINT "pause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_name_key" ON "department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedule_personId_day_key" ON "work_schedule"("personId", "day");

-- CreateIndex
CREATE INDEX "intervention_priority_idx" ON "intervention"("priority");

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule" ADD CONSTRAINT "work_schedule_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("person_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_completed_by_user_id_fkey" FOREIGN KEY ("completed_by_user_id") REFERENCES "user_account"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pause" ADD CONSTRAINT "pause_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "intervention"("intervention_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_assignment" ADD CONSTRAINT "intervention_assignment_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "intervention"("intervention_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_account"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
