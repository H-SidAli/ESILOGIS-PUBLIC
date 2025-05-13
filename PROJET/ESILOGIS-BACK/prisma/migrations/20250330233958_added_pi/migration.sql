/*
  Warnings:

  - The values [PI] on the enum `InterventionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InterventionStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
ALTER TABLE "intervention" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "intervention" ALTER COLUMN "status" TYPE "InterventionStatus_new" USING ("status"::text::"InterventionStatus_new");
ALTER TYPE "InterventionStatus" RENAME TO "InterventionStatus_old";
ALTER TYPE "InterventionStatus_new" RENAME TO "InterventionStatus";
DROP TYPE "InterventionStatus_old";
ALTER TABLE "intervention" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "Priority" ADD VALUE 'PI';
