CREATE TYPE "PaymentMethod" AS ENUM ('UPI');
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'SUBMITTED', 'VERIFYING', 'PAID', 'FAILED', 'REJECTED', 'REFUNDED');

ALTER TABLE "Student" ADD COLUMN "outstandingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "TenantSettings" ADD COLUMN "upiVpa" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN "upiPayeeName" TEXT;

CREATE UNIQUE INDEX "Student_id_tenantId_key" ON "Student"("id", "tenantId");

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "method" "PaymentMethod" NOT NULL DEFAULT 'UPI',
    "upiVpa" TEXT,
    "utr" TEXT,
    "transactionReferenceId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "receiptId" TEXT,
    "proofUrl" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rejectedReason" TEXT,
    "metadata" JSONB,
    "submitIdempotencyKey" TEXT,
    "verifyIdempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_tenantId_studentId_submitIdempotencyKey_key" ON "Payment"("tenantId", "studentId", "submitIdempotencyKey");
CREATE UNIQUE INDEX "Payment_tenantId_studentId_verifyIdempotencyKey_key" ON "Payment"("tenantId", "studentId", "verifyIdempotencyKey");
CREATE UNIQUE INDEX "Payment_id_tenantId_key" ON "Payment"("id", "tenantId");
CREATE INDEX "Payment_tenantId_studentId_status_createdAt_idx" ON "Payment"("tenantId", "studentId", "status", "createdAt");
CREATE INDEX "Payment_tenantId_utr_idx" ON "Payment"("tenantId", "utr");

CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentReceipt_paymentId_key" ON "PaymentReceipt"("paymentId");
CREATE UNIQUE INDEX "PaymentReceipt_tenantId_receiptNumber_key" ON "PaymentReceipt"("tenantId", "receiptNumber");
CREATE INDEX "PaymentReceipt_tenantId_issuedAt_idx" ON "PaymentReceipt"("tenantId", "issuedAt");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_tenantId_fkey" FOREIGN KEY ("studentId", "tenantId") REFERENCES "Student"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "Student" ADD CONSTRAINT "Student_outstandingAmount_nonnegative" CHECK ("outstandingAmount" >= 0);
