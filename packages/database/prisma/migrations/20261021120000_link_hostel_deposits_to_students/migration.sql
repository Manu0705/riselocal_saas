CREATE TYPE "HostelDepositType" AS ENUM ('SECURITY_DEPOSIT', 'ADVANCE_RENT', 'OTHER');

ALTER TABLE "HostelDeposit"
  ADD COLUMN "studentId" TEXT,
  ADD COLUMN "depositType" "HostelDepositType" NOT NULL DEFAULT 'OTHER';

CREATE INDEX "HostelDeposit_tenantId_hostelId_depositType_idx"
  ON "HostelDeposit"("tenantId", "hostelId", "depositType");

CREATE INDEX "HostelDeposit_tenantId_studentId_idx"
  ON "HostelDeposit"("tenantId", "studentId");

ALTER TABLE "HostelDeposit"
  ADD CONSTRAINT "HostelDeposit_security_deposit_requires_student"
  CHECK ("depositType" <> 'SECURITY_DEPOSIT' OR "studentId" IS NOT NULL);

ALTER TABLE "HostelDeposit"
  ADD CONSTRAINT "HostelDeposit_studentId_tenantId_fkey"
  FOREIGN KEY ("studentId", "tenantId")
  REFERENCES "Student"("id", "tenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;