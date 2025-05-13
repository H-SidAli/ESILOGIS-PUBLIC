-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('IN_SERVICE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "user_account" (
    "user_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "google_id" VARCHAR(255),
    "role_id" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "person" (
    "person_id" SERIAL NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone_number" VARCHAR(20),
    "department" VARCHAR(100),
    "user_account_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_technician" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "person_pkey" PRIMARY KEY ("person_id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "equipment_id" SERIAL NOT NULL,
    "inventory_code" VARCHAR(50) NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'IN_SERVICE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "type_id" INTEGER NOT NULL,
    "acquisition_date" TIMESTAMP(3),
    "commission_date" TIMESTAMP(3),
    "location_id" INTEGER NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("equipment_id")
);

-- CreateTable
CREATE TABLE "equipment_types" (
    "type_id" SERIAL NOT NULL,
    "type_name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(255) NOT NULL,

    CONSTRAINT "equipment_types_pkey" PRIMARY KEY ("type_id")
);

-- CreateTable
CREATE TABLE "intervention" (
    "intervention_id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "InterventionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "equipment_id" INTEGER,
    "location_id" INTEGER NOT NULL,
    "reported_by_user_id" INTEGER NOT NULL,

    CONSTRAINT "intervention_pkey" PRIMARY KEY ("intervention_id")
);

-- CreateTable
CREATE TABLE "intervention_assignment" (
    "assignment_id" SERIAL NOT NULL,
    "intervention_id" INTEGER NOT NULL,
    "person_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_assignment_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "location" (
    "location_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "role" (
    "role_id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "intervention_history" (
    "history_id" SERIAL NOT NULL,
    "intervention_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "parts_used" TEXT,
    "notes" TEXT,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logged_by_id" INTEGER NOT NULL,
    "user_account_id" INTEGER,

    CONSTRAINT "intervention_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_google_id_key" ON "user_account"("google_id");

-- CreateIndex
CREATE INDEX "user_account_email_idx" ON "user_account"("email");

-- CreateIndex
CREATE INDEX "user_account_google_id_idx" ON "user_account"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_email_key" ON "person"("email");

-- CreateIndex
CREATE UNIQUE INDEX "person_user_account_id_key" ON "person"("user_account_id");

-- CreateIndex
CREATE INDEX "person_email_idx" ON "person"("email");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_inventory_code_key" ON "equipment"("inventory_code");

-- CreateIndex
CREATE INDEX "equipment_inventory_code_idx" ON "equipment"("inventory_code");

-- CreateIndex
CREATE INDEX "equipment_status_idx" ON "equipment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_types_type_name_key" ON "equipment_types"("type_name");

-- CreateIndex
CREATE INDEX "intervention_created_at_idx" ON "intervention"("created_at");

-- CreateIndex
CREATE INDEX "intervention_location_id_idx" ON "intervention"("location_id");

-- CreateIndex
CREATE INDEX "intervention_priority_idx" ON "intervention"("priority");

-- CreateIndex
CREATE INDEX "intervention_reported_by_user_id_idx" ON "intervention"("reported_by_user_id");

-- CreateIndex
CREATE INDEX "intervention_status_idx" ON "intervention"("status");

-- CreateIndex
CREATE UNIQUE INDEX "intervention_assignment_intervention_id_person_id_key" ON "intervention_assignment"("intervention_id", "person_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_name_key" ON "location"("name");

-- CreateIndex
CREATE INDEX "location_name_idx" ON "location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE INDEX "role_name_idx" ON "role"("name");

-- AddForeignKey
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "equipment_types"("type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("equipment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_reported_by_user_id_fkey" FOREIGN KEY ("reported_by_user_id") REFERENCES "user_account"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_assignment" ADD CONSTRAINT "intervention_assignment_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "intervention"("intervention_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_assignment" ADD CONSTRAINT "intervention_assignment_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("person_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_history" ADD CONSTRAINT "intervention_history_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "intervention"("intervention_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_history" ADD CONSTRAINT "intervention_history_logged_by_id_fkey" FOREIGN KEY ("logged_by_id") REFERENCES "person"("person_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_history" ADD CONSTRAINT "intervention_history_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
