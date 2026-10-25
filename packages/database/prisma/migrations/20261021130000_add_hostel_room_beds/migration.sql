CREATE TYPE "RoomBedStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'INACTIVE');
CREATE UNIQUE INDEX "Room_id_tenantId_hostelId_key"
  ON "Room"("id", "tenantId", "hostelId");
CREATE UNIQUE INDEX "Student_id_tenantId_hostelId_key"
  ON "Student"("id", "tenantId", "hostelId");

ALTER TABLE "Student"
  DROP CONSTRAINT "Student_roomId_tenantId_fkey",
  ADD CONSTRAINT "Student_roomId_tenantId_hostelId_fkey"
  FOREIGN KEY ("roomId", "tenantId", "hostelId")
  REFERENCES "Room"("id", "tenantId", "hostelId")
  ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

ALTER TABLE "RoomAllocation"
  DROP CONSTRAINT "RoomAllocation_studentId_tenantId_fkey",
  ADD CONSTRAINT "RoomAllocation_studentId_tenantId_hostelId_fkey"
  FOREIGN KEY ("studentId", "tenantId", "hostelId")
  REFERENCES "Student"("id", "tenantId", "hostelId")
  ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;

CREATE TABLE "RoomBed" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "hostelId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "bedNumber" TEXT NOT NULL,
  "status" "RoomBedStatus" NOT NULL DEFAULT 'AVAILABLE',
  "studentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoomBed_pkey" PRIMARY KEY ("id")
);

WITH assigned_students AS (
  SELECT
    s."id",
    s."tenantId",
    s."hostelId",
    s."roomId",
    ROW_NUMBER() OVER (
      PARTITION BY s."tenantId", s."hostelId", s."roomId"
      ORDER BY s."createdAt", s."id"
    ) AS bed_number
  FROM "Student" s
  INNER JOIN "Room" r
    ON r."id" = s."roomId"
   AND r."tenantId" = s."tenantId"
   AND r."hostelId" = s."hostelId"
  WHERE s."roomId" IS NOT NULL
), room_sizes AS (
  SELECT
    r."id",
    r."tenantId",
    r."hostelId",
    r."capacity",
    GREATEST(r."capacity", COUNT(a."id")::INTEGER) AS bed_count
  FROM "Room" r
  LEFT JOIN assigned_students a
    ON a."roomId" = r."id"
   AND a."tenantId" = r."tenantId"
   AND a."hostelId" = r."hostelId"
  GROUP BY r."id", r."tenantId", r."hostelId", r."capacity"
)
INSERT INTO "RoomBed" (
  "id", "tenantId", "hostelId", "roomId", "bedNumber", "status", "studentId", "updatedAt"
)
SELECT
  gen_random_uuid()::TEXT,
  r."tenantId",
  r."hostelId",
  r."id",
  'B' || beds.bed_number::TEXT,
  CASE WHEN a."id" IS NULL THEN 'AVAILABLE'::"RoomBedStatus" ELSE 'OCCUPIED'::"RoomBedStatus" END,
  a."id",
  CURRENT_TIMESTAMP
FROM room_sizes r
CROSS JOIN LATERAL generate_series(1, r.bed_count) AS beds(bed_number)
LEFT JOIN assigned_students a
  ON a."roomId" = r."id"
 AND a."tenantId" = r."tenantId"
 AND a."hostelId" = r."hostelId"
 AND a.bed_number = beds.bed_number;

CREATE UNIQUE INDEX "RoomBed_tenantId_roomId_bedNumber_key"
  ON "RoomBed"("tenantId", "roomId", "bedNumber");
CREATE UNIQUE INDEX "RoomBed_tenantId_studentId_key"
  ON "RoomBed"("tenantId", "studentId");
CREATE UNIQUE INDEX "RoomBed_id_tenantId_hostelId_key"
  ON "RoomBed"("id", "tenantId", "hostelId");
CREATE UNIQUE INDEX "RoomBed_id_tenantId_hostelId_roomId_key"
  ON "RoomBed"("id", "tenantId", "hostelId", "roomId");
CREATE INDEX "RoomBed_tenantId_hostelId_roomId_status_idx"
  ON "RoomBed"("tenantId", "hostelId", "roomId", "status");
CREATE INDEX "RoomBed_tenantId_studentId_status_idx"
  ON "RoomBed"("tenantId", "studentId", "status");

ALTER TABLE "RoomBed"
  ADD CONSTRAINT "RoomBed_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "RoomBed_hostelId_tenantId_fkey"
  FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "RoomBed_roomId_tenantId_hostelId_fkey"
  FOREIGN KEY ("roomId", "tenantId", "hostelId") REFERENCES "Room"("id", "tenantId", "hostelId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "RoomBed_studentId_tenantId_hostelId_fkey"
  FOREIGN KEY ("studentId", "tenantId", "hostelId") REFERENCES "Student"("id", "tenantId", "hostelId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RoomBed"
  ADD CONSTRAINT "RoomBed_state_matches_student"
  CHECK (
    ("status" = 'AVAILABLE' AND "studentId" IS NULL) OR
    ("status" IN ('RESERVED', 'OCCUPIED') AND "studentId" IS NOT NULL) OR
    ("status" = 'INACTIVE' AND "studentId" IS NULL)
  );

ALTER TABLE "RoomAllocation"
  ADD COLUMN "bedId" TEXT,
  ADD CONSTRAINT "RoomAllocation_bedId_tenantId_hostelId_fkey"
  FOREIGN KEY ("bedId", "tenantId", "hostelId", "roomId") REFERENCES "RoomBed"("id", "tenantId", "hostelId", "roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "RoomAllocation_tenantId_bedId_happenedAt_idx"
  ON "RoomAllocation"("tenantId", "bedId", "happenedAt");