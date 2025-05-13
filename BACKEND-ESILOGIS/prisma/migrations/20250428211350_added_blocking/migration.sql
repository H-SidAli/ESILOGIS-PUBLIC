-- AlterTable
ALTER TABLE "person" ADD COLUMN     "retiredAt" TIMESTAMP(3),
ALTER COLUMN "is_retired" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_account" ADD COLUMN     "blockedAt" TIMESTAMP(3);
