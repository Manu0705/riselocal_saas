CREATE TYPE "RoomSharingType" AS ENUM ('SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'DORMITORY');
CREATE TYPE "RoomVacancyStatus" AS ENUM ('VACANT', 'PARTIALLY_OCCUPIED', 'FULL', 'UNAVAILABLE');
CREATE TYPE "RoomAllocationAction" AS ENUM ('ALLOCATED', 'DEALLOCATED');

ALTER TABLE "Room"
  ADD COLUMN "occupancy" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sharingType" "RoomSharingType" NOT NULL DEFAULT 'SINGLE',
  ADD COLUMN "vacancyStatus" "RoomVacancyStatus" NOT NULL DEFAULT 'VACANT',
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Room" ADD CONSTRAINT "Room_occupancy_valid" CHECK ("occupancy" >= 0 AND "occupancy" <= "capacity");

CREATE INDEX "Room_tenantId_hostelId_vacancyStatus_idx" ON "Room"("tenantId", "hostelId", "vacancyStatus");

CREATE TABLE "RoomAllocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "action" "RoomAllocationAction" NOT NULL,
    "actorId" TEXT,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomAllocation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoomAllocation_tenantId_roomId_happenedAt_idx" ON "RoomAllocation"("tenantId", "roomId", "happenedAt");
CREATE INDEX "RoomAllocation_tenantId_studentId_happenedAt_idx" ON "RoomAllocation"("tenantId", "studentId", "happenedAt");
CREATE UNIQUE INDEX "Student_id_tenantId_key" ON "Student"("id", "tenantId");

ALTER TABLE "RoomAllocation" ADD CONSTRAINT "RoomAllocation_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomAllocation" ADD CONSTRAINT "RoomAllocation_hostelId_tenantId_fkey"
  FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomAllocation" ADD CONSTRAINT "RoomAllocation_roomId_tenantId_fkey"
  FOREIGN KEY ("roomId", "tenantId") REFERENCES "Room"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomAllocation" ADD CONSTRAINT "RoomAllocation_studentId_tenantId_fkey"
  FOREIGN KEY ("studentId", "tenantId") REFERENCES "Student"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
