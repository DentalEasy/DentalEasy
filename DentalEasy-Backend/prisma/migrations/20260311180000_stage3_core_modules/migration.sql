-- CreateEnum
CREATE TYPE "SerasaStatus" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MedicalRecordType" AS ENUM ('PROCEDURE', 'ANAMNESIS', 'PHOTO', 'NOTE');

-- AlterTable
ALTER TABLE "Paciente"
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "serasaStatus" "SerasaStatus" NOT NULL DEFAULT 'GREEN',
  ADD COLUMN "alergias" TEXT,
  ADD COLUMN "observacoesMedicas" TEXT,
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dentistUserId" TEXT NOT NULL,
    "title" TEXT,
    "procedure" TEXT,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dentistUserId" TEXT NOT NULL,
    "type" "MedicalRecordType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dentistUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Paciente_organizationId_active_idx" ON "Paciente"("organizationId", "active");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_idx" ON "Appointment"("organizationId");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_date_idx" ON "Appointment"("organizationId", "date");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_patientId_date_idx" ON "Appointment"("organizationId", "patientId", "date");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_dentistUserId_date_idx" ON "Appointment"("organizationId", "dentistUserId", "date");

-- CreateIndex
CREATE INDEX "MedicalRecord_organizationId_idx" ON "MedicalRecord"("organizationId");

-- CreateIndex
CREATE INDEX "MedicalRecord_organizationId_patientId_createdAt_idx" ON "MedicalRecord"("organizationId", "patientId", "createdAt");

-- CreateIndex
CREATE INDEX "MedicalRecord_organizationId_dentistUserId_createdAt_idx" ON "MedicalRecord"("organizationId", "dentistUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_organizationId_idx" ON "Prescription"("organizationId");

-- CreateIndex
CREATE INDEX "Prescription_organizationId_patientId_createdAt_idx" ON "Prescription"("organizationId", "patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_organizationId_dentistUserId_createdAt_idx" ON "Prescription"("organizationId", "dentistUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_dentistUserId_fkey" FOREIGN KEY ("dentistUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_dentistUserId_fkey" FOREIGN KEY ("dentistUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_dentistUserId_fkey" FOREIGN KEY ("dentistUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
