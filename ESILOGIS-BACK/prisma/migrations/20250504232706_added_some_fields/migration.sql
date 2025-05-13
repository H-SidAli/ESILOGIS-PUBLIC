-- AlterTable
ALTER TABLE "user_account" ADD COLUMN     "first_name" VARCHAR(255),
ADD COLUMN     "last_name" VARCHAR(255);

-- CreateTable
CREATE TABLE "document" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "intervention_id" INTEGER,
    "equipment_id" INTEGER,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by_id" INTEGER NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "intervention"("intervention_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("equipment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "user_account"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
