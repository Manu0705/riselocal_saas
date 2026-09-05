-- Extend the existing HostelProperty table without replacing the tenant-owned hostel foundation.
CREATE TYPE "HostelStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'INACTIVE');
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'ARCHIVED');
CREATE TYPE "HostelStaffRole" AS ENUM ('ADMIN', 'STAFF');

ALTER TABLE "HostelProperty" ADD COLUMN "status" "HostelStatus" NOT NULL DEFAULT 'ACTIVE';
UPDATE "HostelProperty" SET "status" = CASE WHEN "isActive" THEN 'ACTIVE'::"HostelStatus" ELSE 'INACTIVE'::"HostelStatus" END;
ALTER TABLE "HostelProperty" DROP COLUMN "isActive";

CREATE UNIQUE INDEX "HostelProperty_id_tenantId_key" ON "HostelProperty"("id", "tenantId");
CREATE INDEX "HostelProperty_tenantId_status_idx" ON "HostelProperty"("tenantId", "status");

CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Room_tenantId_hostelId_roomNumber_key" ON "Room"("tenantId", "hostelId", "roomNumber");
CREATE UNIQUE INDEX "Room_id_tenantId_key" ON "Room"("id", "tenantId");
CREATE INDEX "Room_tenantId_hostelId_status_idx" ON "Room"("tenantId", "hostelId", "status");
CREATE INDEX "Room_tenantId_status_idx" ON "Room"("tenantId", "status");
ALTER TABLE "Room" ADD CONSTRAINT "Room_capacity_positive" CHECK ("capacity" > 0);

CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "roomId" TEXT,
    "admissionNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Student_tenantId_admissionNumber_key" ON "Student"("tenantId", "admissionNumber");
CREATE INDEX "Student_tenantId_hostelId_status_idx" ON "Student"("tenantId", "hostelId", "status");
CREATE INDEX "Student_tenantId_roomId_idx" ON "Student"("tenantId", "roomId");

CREATE TABLE "HostelStaffAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HostelStaffRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelStaffAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HostelStaffAssignment_tenantId_hostelId_userId_key" ON "HostelStaffAssignment"("tenantId", "hostelId", "userId");
CREATE INDEX "HostelStaffAssignment_tenantId_hostelId_role_idx" ON "HostelStaffAssignment"("tenantId", "hostelId", "role");

CREATE UNIQUE INDEX "TenantUser_id_tenantId_key" ON "TenantUser"("id", "tenantId");

ALTER TABLE "Room" ADD CONSTRAINT "Room_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostelId_tenantId_fkey" FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_hostelId_tenantId_fkey" FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_roomId_tenantId_fkey" FOREIGN KEY ("roomId", "tenantId") REFERENCES "Room"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HostelStaffAssignment" ADD CONSTRAINT "HostelStaffAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HostelStaffAssignment" ADD CONSTRAINT "HostelStaffAssignment_hostelId_tenantId_fkey" FOREIGN KEY ("hostelId", "tenantId") REFERENCES "HostelProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HostelStaffAssignment" ADD CONSTRAINT "HostelStaffAssignment_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "TenantUser"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
