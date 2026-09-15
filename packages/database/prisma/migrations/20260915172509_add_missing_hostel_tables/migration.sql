-- CreateEnum
CREATE TYPE "HostelFeeType" AS ENUM ('MONTHLY', 'ADMISSION', 'SECURITY_DEPOSIT', 'MESS', 'ELECTRICITY', 'MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "HostelFeeAssignmentStatus" AS ENUM ('ACTIVE', 'WAIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HostelInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HostelDepositStatus" AS ENUM ('PENDING', 'DEPOSITED', 'RECONCILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HostelLedgerEntryType" AS ENUM ('PAYMENT', 'DEPOSIT', 'REFUND', 'ADJUSTMENT', 'EXPENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "HostelLedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "HostelComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "HostelComplaintStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HostelAnnouncementAudience" AS ENUM ('ALL', 'STUDENTS', 'STAFF');

-- CreateEnum
CREATE TYPE "HostelAnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "HostelFee" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "HostelFeeType" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelFeeAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "status" "HostelFeeAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelFeeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "HostelInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelInvoiceItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "feeAssignmentId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelInvoicePayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelInvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelDeposit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "depositDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNumber" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'UPI',
    "status" "HostelDepositStatus" NOT NULL DEFAULT 'PENDING',
    "depositedBy" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "reconciledBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelLedgerEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "HostelLedgerEntryType" NOT NULL,
    "direction" "HostelLedgerDirection" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "referenceType" TEXT,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelComplaint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "HostelComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "HostelComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelAnnouncement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "audience" "HostelAnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "publishAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "HostelAnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HostelFee_tenantId_hostelId_isActive_idx" ON "HostelFee"("tenantId", "hostelId", "isActive");

-- CreateIndex
CREATE INDEX "HostelFee_tenantId_type_idx" ON "HostelFee"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "HostelFee_id_tenantId_key" ON "HostelFee"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelFee_tenantId_hostelId_name_key" ON "HostelFee"("tenantId", "hostelId", "name");

-- CreateIndex
CREATE INDEX "HostelFeeAssignment_tenantId_hostelId_studentId_idx" ON "HostelFeeAssignment"("tenantId", "hostelId", "studentId");

-- CreateIndex
CREATE INDEX "HostelFeeAssignment_tenantId_studentId_status_idx" ON "HostelFeeAssignment"("tenantId", "studentId", "status");

-- CreateIndex
CREATE INDEX "HostelFeeAssignment_tenantId_feeId_idx" ON "HostelFeeAssignment"("tenantId", "feeId");

-- CreateIndex
CREATE INDEX "HostelFeeAssignment_tenantId_dueDate_idx" ON "HostelFeeAssignment"("tenantId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "HostelFeeAssignment_id_tenantId_key" ON "HostelFeeAssignment"("id", "tenantId");

-- CreateIndex
CREATE INDEX "HostelInvoice_tenantId_hostelId_studentId_idx" ON "HostelInvoice"("tenantId", "hostelId", "studentId");

-- CreateIndex
CREATE INDEX "HostelInvoice_tenantId_studentId_status_idx" ON "HostelInvoice"("tenantId", "studentId", "status");

-- CreateIndex
CREATE INDEX "HostelInvoice_tenantId_dueDate_idx" ON "HostelInvoice"("tenantId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "HostelInvoice_id_tenantId_key" ON "HostelInvoice"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelInvoice_tenantId_invoiceNumber_key" ON "HostelInvoice"("tenantId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "HostelInvoiceItem_tenantId_invoiceId_idx" ON "HostelInvoiceItem"("tenantId", "invoiceId");

-- CreateIndex
CREATE INDEX "HostelInvoiceItem_tenantId_feeAssignmentId_idx" ON "HostelInvoiceItem"("tenantId", "feeAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelInvoiceItem_id_tenantId_key" ON "HostelInvoiceItem"("id", "tenantId");

-- CreateIndex
CREATE INDEX "HostelInvoicePayment_tenantId_invoiceId_idx" ON "HostelInvoicePayment"("tenantId", "invoiceId");

-- CreateIndex
CREATE INDEX "HostelInvoicePayment_tenantId_paymentId_idx" ON "HostelInvoicePayment"("tenantId", "paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelInvoicePayment_id_tenantId_key" ON "HostelInvoicePayment"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelInvoicePayment_tenantId_invoiceId_paymentId_key" ON "HostelInvoicePayment"("tenantId", "invoiceId", "paymentId");

-- CreateIndex
CREATE INDEX "HostelDeposit_tenantId_hostelId_status_idx" ON "HostelDeposit"("tenantId", "hostelId", "status");

-- CreateIndex
CREATE INDEX "HostelDeposit_tenantId_hostelId_depositDate_idx" ON "HostelDeposit"("tenantId", "hostelId", "depositDate");

-- CreateIndex
CREATE INDEX "HostelDeposit_tenantId_referenceNumber_idx" ON "HostelDeposit"("tenantId", "referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HostelDeposit_id_tenantId_key" ON "HostelDeposit"("id", "tenantId");

-- CreateIndex
CREATE INDEX "HostelLedgerEntry_tenantId_hostelId_entryDate_idx" ON "HostelLedgerEntry"("tenantId", "hostelId", "entryDate");

-- CreateIndex
CREATE INDEX "HostelLedgerEntry_tenantId_hostelId_type_idx" ON "HostelLedgerEntry"("tenantId", "hostelId", "type");

-- CreateIndex
CREATE INDEX "HostelLedgerEntry_tenantId_hostelId_direction_idx" ON "HostelLedgerEntry"("tenantId", "hostelId", "direction");

-- CreateIndex
CREATE INDEX "HostelLedgerEntry_tenantId_referenceType_referenceId_idx" ON "HostelLedgerEntry"("tenantId", "referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelLedgerEntry_id_tenantId_key" ON "HostelLedgerEntry"("id", "tenantId");

-- CreateIndex
CREATE INDEX "HostelComplaint_tenantId_hostelId_status_idx" ON "HostelComplaint"("tenantId", "hostelId", "status");

-- CreateIndex
CREATE INDEX "HostelComplaint_tenantId_hostelId_priority_idx" ON "HostelComplaint"("tenantId", "hostelId", "priority");

-- CreateIndex
CREATE INDEX "HostelComplaint_tenantId_hostelId_createdAt_idx" ON "HostelComplaint"("tenantId", "hostelId", "createdAt");

-- CreateIndex
CREATE INDEX "HostelComplaint_tenantId_studentId_idx" ON "HostelComplaint"("tenantId", "studentId");

-- CreateIndex
CREATE INDEX "HostelComplaint_tenantId_assignedTo_idx" ON "HostelComplaint"("tenantId", "assignedTo");

-- CreateIndex
CREATE UNIQUE INDEX "HostelComplaint_id_tenantId_key" ON "HostelComplaint"("id", "tenantId");

-- CreateIndex
CREATE INDEX "HostelAnnouncement_tenantId_hostelId_status_idx" ON "HostelAnnouncement"("tenantId", "hostelId", "status");

-- CreateIndex
CREATE INDEX "HostelAnnouncement_tenantId_hostelId_audience_idx" ON "HostelAnnouncement"("tenantId", "hostelId", "audience");

-- CreateIndex
CREATE INDEX "HostelAnnouncement_tenantId_hostelId_publishAt_idx" ON "HostelAnnouncement"("tenantId", "hostelId", "publishAt");

-- CreateIndex
CREATE INDEX "HostelAnnouncement_tenantId_hostelId_expiresAt_idx" ON "HostelAnnouncement"("tenantId", "hostelId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "HostelAnnouncement_id_tenantId_key" ON "HostelAnnouncement"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "HostelFee" ADD CONSTRAINT "HostelFee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelFee" ADD CONSTRAINT "HostelFee_hostelId_tenantId_fkey" FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelFeeAssignment" ADD CONSTRAINT "HostelFeeAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelFeeAssignment" ADD CONSTRAINT "HostelFeeAssignment_hostelId_tenantId_fkey" FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelFeeAssignment" ADD CONSTRAINT "HostelFeeAssignment_studentId_tenantId_fkey" FOREIGN KEY ("studentId", "tenantId") REFERENCES "Student"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelFeeAssignment" ADD CONSTRAINT "HostelFeeAssignment_feeId_tenantId_fkey" FOREIGN KEY ("feeId", "tenantId") REFERENCES "HostelFee"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelInvoice" ADD CONSTRAINT "HostelInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelInvoice" ADD CONSTRAINT "HostelInvoice_hostelId_tenantId_fkey" FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelInvoice" ADD CONSTRAINT "HostelInvoice_studentId_tenantId_fkey" FOREIGN KEY ("studentId", "tenantId") REFERENCES "Student"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelInvoiceItem" ADD CONSTRAINT "HostelInvoiceItem_invoiceId_tenantId_fkey" FOREIGN KEY ("invoiceId", "tenantId") REFERENCES "HostelInvoice"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelInvoiceItem" ADD CONSTRAINT "HostelInvoiceItem_feeAssignmentId_tenantId_fkey" FOREIGN KEY ("feeAssignmentId", "tenantId") REFERENCES "HostelFeeAssignment"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelInvoicePayment" ADD CONSTRAINT "HostelInvoicePayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelInvoicePayment" ADD CONSTRAINT "HostelInvoicePayment_invoiceId_tenantId_fkey" FOREIGN KEY ("invoiceId", "tenantId") REFERENCES "HostelInvoice"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelInvoicePayment" ADD CONSTRAINT "HostelInvoicePayment_paymentId_tenantId_fkey" FOREIGN KEY ("paymentId", "tenantId") REFERENCES "Payment"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelDeposit" ADD CONSTRAINT "HostelDeposit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelDeposit" ADD CONSTRAINT "HostelDeposit_hostelId_tenantId_fkey" FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelLedgerEntry" ADD CONSTRAINT "HostelLedgerEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelLedgerEntry" ADD CONSTRAINT "HostelLedgerEntry_hostelId_tenantId_fkey" FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelComplaint" ADD CONSTRAINT "HostelComplaint_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelComplaint" ADD CONSTRAINT "HostelComplaint_hostelId_tenantId_fkey" FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelComplaint" ADD CONSTRAINT "HostelComplaint_studentId_tenantId_fkey" FOREIGN KEY ("studentId", "tenantId") REFERENCES "Student"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAnnouncement" ADD CONSTRAINT "HostelAnnouncement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAnnouncement" ADD CONSTRAINT "HostelAnnouncement_hostelId_tenantId_fkey" FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
