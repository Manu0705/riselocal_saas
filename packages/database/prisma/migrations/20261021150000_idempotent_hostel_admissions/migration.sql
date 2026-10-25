ALTER TABLE "Student"
  ADD COLUMN "admissionRequestId" TEXT;

CREATE UNIQUE INDEX "Student_tenantId_admissionRequestId_key"
  ON "Student"("tenantId", "admissionRequestId");
