ALTER TABLE "Lead"
  ADD COLUMN "hostelId" TEXT;

ALTER TABLE "Student"
  ADD COLUMN "enquiryLeadId" TEXT;

CREATE UNIQUE INDEX "Lead_id_tenantId_key"
  ON "Lead"("id", "tenantId");

CREATE UNIQUE INDEX "Student_tenantId_enquiryLeadId_key"
  ON "Student"("enquiryLeadId", "tenantId");

CREATE INDEX "Lead_tenantId_hostelId_status_idx"
  ON "Lead"("tenantId", "hostelId", "status");

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_hostelId_tenantId_fkey"
  FOREIGN KEY ("hostelId", "tenantId")
  REFERENCES "HostelProperty"("id", "tenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Student"
  ADD CONSTRAINT "Student_enquiryLeadId_tenantId_fkey"
  FOREIGN KEY ("enquiryLeadId", "tenantId")
  REFERENCES "Lead"("id", "tenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
