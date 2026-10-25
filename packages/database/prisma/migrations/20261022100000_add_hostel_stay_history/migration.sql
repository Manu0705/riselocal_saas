CREATE TYPE "HostelStayStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT');

CREATE TABLE "HostelStay" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "hostelId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "bedId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "status" "HostelStayStatus" NOT NULL DEFAULT 'ACTIVE',
  "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkedOutAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HostelStay_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HostelStay_status_dates_check" CHECK (
    ("status" = 'ACTIVE' AND "checkedOutAt" IS NULL) OR
    ("status" = 'CHECKED_OUT' AND "checkedOutAt" IS NOT NULL AND "checkedOutAt" >= "checkedInAt")
  )
);

INSERT INTO "HostelStay" (
  "id", "tenantId", "hostelId", "roomId", "bedId", "studentId",
  "status", "checkedInAt", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::TEXT,
  s."tenantId",
  s."hostelId",
  s."roomId",
  b."id",
  s."id",
  'ACTIVE'::"HostelStayStatus",
  COALESCE(last_allocation."happenedAt", s."updatedAt", s."createdAt"),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Student" s
JOIN "RoomBed" b
  ON b."tenantId" = s."tenantId"
 AND b."hostelId" = s."hostelId"
 AND b."roomId" = s."roomId"
 AND b."studentId" = s."id"
 AND b."status" = 'OCCUPIED'
LEFT JOIN LATERAL (
  SELECT ra."happenedAt"
  FROM "RoomAllocation" ra
  WHERE ra."tenantId" = s."tenantId"
    AND ra."hostelId" = s."hostelId"
    AND ra."roomId" = s."roomId"
    AND ra."bedId" = b."id"
    AND ra."studentId" = s."id"
    AND ra."action" = 'ALLOCATED'
  ORDER BY ra."happenedAt" DESC
  LIMIT 1
) last_allocation ON TRUE
WHERE s."roomId" IS NOT NULL;

CREATE UNIQUE INDEX "HostelStay_one_active_student_key"
  ON "HostelStay"("tenantId", "studentId")
  WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "HostelStay_one_active_bed_key"
  ON "HostelStay"("tenantId", "bedId")
  WHERE "status" = 'ACTIVE';
CREATE INDEX "HostelStay_tenantId_hostelId_status_checkedInAt_idx"
  ON "HostelStay"("tenantId", "hostelId", "status", "checkedInAt");
CREATE INDEX "HostelStay_tenantId_studentId_checkedInAt_idx"
  ON "HostelStay"("tenantId", "studentId", "checkedInAt");
CREATE INDEX "HostelStay_tenantId_roomId_bedId_checkedInAt_idx"
  ON "HostelStay"("tenantId", "roomId", "bedId", "checkedInAt");

ALTER TABLE "HostelStay"
  ADD CONSTRAINT "HostelStay_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "HostelStay_hostelId_tenantId_fkey"
  FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "HostelStay_roomId_tenantId_hostelId_fkey"
  FOREIGN KEY ("roomId", "tenantId", "hostelId") REFERENCES "Room"("id", "tenantId", "hostelId") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "HostelStay_bedId_tenantId_hostelId_roomId_fkey"
  FOREIGN KEY ("bedId", "tenantId", "hostelId", "roomId") REFERENCES "RoomBed"("id", "tenantId", "hostelId", "roomId") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "HostelStay_studentId_tenantId_hostelId_fkey"
  FOREIGN KEY ("studentId", "tenantId", "hostelId") REFERENCES "Student"("id", "tenantId", "hostelId") ON DELETE RESTRICT ON UPDATE CASCADE;
