-- CreateEnum
CREATE TYPE "FinancialRecordType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "FinancialPaymentStatus" AS ENUM ('PAID', 'PENDING', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinancialPaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'BOLETO');

-- CreateEnum
CREATE TYPE "FiscalStatus" AS ENUM ('ISSUED', 'PENDING', 'ERROR');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SETTLED', 'CANCELLED');

-- CreateTable
CREATE TABLE "FinancialRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "FinancialRecordType" NOT NULL,
    "category" TEXT,
    "paymentStatus" "FinancialPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "FinancialPaymentMethod",
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "invoiceNumber" TEXT,
    "fiscalDocumentRef" TEXT,
    "nfeStatus" "FiscalStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "financialRecordId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "FinancialPaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "receivedFrom" TEXT,
    "paidTo" TEXT,
    "notes" TEXT,
    "installmentNumber" INTEGER,
    "totalInstallments" INTEGER,
    "receiptNumber" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialRecord_organizationId_idx" ON "FinancialRecord"("organizationId");

-- CreateIndex
CREATE INDEX "FinancialRecord_organizationId_type_idx" ON "FinancialRecord"("organizationId", "type");

-- CreateIndex
CREATE INDEX "FinancialRecord_organizationId_paymentStatus_idx" ON "FinancialRecord"("organizationId", "paymentStatus");

-- CreateIndex
CREATE INDEX "FinancialRecord_organizationId_dueDate_idx" ON "FinancialRecord"("organizationId", "dueDate");

-- CreateIndex
CREATE INDEX "FinancialRecord_organizationId_patientId_idx" ON "FinancialRecord"("organizationId", "patientId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_financialRecordId_idx" ON "Payment"("organizationId", "financialRecordId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_status_idx" ON "Payment"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Payment_organizationId_paidAt_idx" ON "Payment"("organizationId", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_organizationId_receiptNumber_idx" ON "Payment"("organizationId", "receiptNumber");

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_financialRecordId_fkey" FOREIGN KEY ("financialRecordId") REFERENCES "FinancialRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
