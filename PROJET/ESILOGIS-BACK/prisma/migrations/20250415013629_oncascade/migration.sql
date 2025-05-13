-- DropForeignKey
ALTER TABLE "intervention_assignment" DROP CONSTRAINT "intervention_assignment_intervention_id_fkey";

-- AddForeignKey
ALTER TABLE "intervention_assignment" ADD CONSTRAINT "intervention_assignment_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "intervention"("intervention_id") ON DELETE CASCADE ON UPDATE CASCADE;
