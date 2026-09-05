CREATE TYPE "StudentPaymentStatus" AS ENUM ('PAID', 'PARTIAL', 'DUE', 'OVERDUE');

ALTER TABLE "Student"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "dateOfBirth" TIMESTAMP(3),
  ADD COLUMN "emergencyName" TEXT,
  ADD COLUMN "emergencyPhone" TEXT,
  ADD COLUMN "emergencyRelation" TEXT,
  ADD COLUMN "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "paymentStatus" "StudentPaymentStatus" NOT NULL DEFAULT 'DUE';

CREATE UNIQUE INDEX "Student_tenantId_userId_key" ON "Student"("tenantId", "userId");
CREATE INDEX "Student_tenantId_name_idx" ON "Student"("tenantId", "name");
CREATE INDEX "Student_tenantId_phone_idx" ON "Student"("tenantId", "phone");
CREATE INDEX "Student_tenantId_email_idx" ON "Student"("tenantId", "email");
CREATE INDEX "Student_tenantId_paymentStatus_idx" ON "Student"("tenantId", "paymentStatus");

ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_tenantId_fkey"
  FOREIGN KEY ("userId", "tenantId") REFERENCES "TenantUser"("id", "tenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
