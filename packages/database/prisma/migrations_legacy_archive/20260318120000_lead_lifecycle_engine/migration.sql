-- Lead lifecycle architecture upgrade

-- Extend TenantUser for team segmentation.
ALTER TABLE "TenantUser"
ADD COLUMN "teamId" TEXT;

-- Extend Lead for strict identity, attribution, ownership, lifecycle and soft delete.
ALTER TABLE "Lead"
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "source" SET DEFAULT 'ORGANIC',
ALTER COLUMN "status" SET DEFAULT 'NEW',
ADD COLUMN "campaignId" TEXT,
ADD COLUMN "utmSource" TEXT,
ADD COLUMN "utmMedium" TEXT,
ADD COLUMN "utmCampaign" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "assignedTo" TEXT,
ADD COLUMN "teamId" TEXT,
ADD COLUMN "convertedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Normalize legacy status values to canonical lifecycle states.
UPDATE "Lead"
SET "status" = CASE UPPER(TRIM(COALESCE("status", 'NEW')))
  WHEN 'OPEN' THEN 'NEW'
  WHEN 'NEW' THEN 'NEW'
  WHEN 'CONTACTED' THEN 'CONTACTED'
  WHEN 'QUALIFIED' THEN 'QUALIFIED'
  WHEN 'FOLLOW-UP' THEN 'QUALIFIED'
  WHEN 'FOLLOW_UP' THEN 'QUALIFIED'
  WHEN 'FOLLOWUP' THEN 'QUALIFIED'
  WHEN 'CONVERTED' THEN 'CONVERTED'
  WHEN 'CLOSED' THEN 'CLOSED'
  WHEN 'LOST' THEN 'CLOSED'
  ELSE 'NEW'
END;

-- Remove existing duplicate tenant+phone pairs before unique constraint is created.
DELETE FROM "Lead"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "tenantId", "phone"
        ORDER BY "createdAt" DESC, "id" DESC
      ) AS rn
    FROM "Lead"
    WHERE "deletedAt" IS NULL
  ) dedup
  WHERE dedup.rn > 1
);

-- Sessions model for 24h interaction windows.
CREATE TABLE "LeadSession" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" TEXT,
  "campaignId" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "LeadSession_pkey" PRIMARY KEY ("id")
);

-- Activity model for append-only event tracking.
CREATE TABLE "LeadActivity" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt" TIMESTAMP(3),
  "metadata" JSONB,
  CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- Booking model linked to lead identity.
CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "bookingDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- Lead constraints and indexes.
CREATE INDEX "Lead_tenantId_phone_idx" ON "Lead"("tenantId", "phone");
CREATE INDEX "Lead_tenantId_status_idx" ON "Lead"("tenantId", "status");
CREATE INDEX "Lead_tenantId_assignedTo_idx" ON "Lead"("tenantId", "assignedTo");
CREATE INDEX "Lead_tenantId_deletedAt_idx" ON "Lead"("tenantId", "deletedAt");
CREATE UNIQUE INDEX "Lead_tenantId_phone_key" ON "Lead"("tenantId", "phone");

-- Session indexes.
CREATE INDEX "LeadSession_tenantId_leadId_startedAt_idx" ON "LeadSession"("tenantId", "leadId", "startedAt");
CREATE INDEX "LeadSession_tenantId_lastActivityAt_idx" ON "LeadSession"("tenantId", "lastActivityAt");
CREATE INDEX "LeadSession_tenantId_deletedAt_idx" ON "LeadSession"("tenantId", "deletedAt");

-- Activity indexes.
CREATE INDEX "LeadActivity_tenantId_timestamp_idx" ON "LeadActivity"("tenantId", "timestamp");
CREATE INDEX "LeadActivity_tenantId_archivedAt_idx" ON "LeadActivity"("tenantId", "archivedAt");
CREATE INDEX "LeadActivity_leadId_timestamp_idx" ON "LeadActivity"("leadId", "timestamp");
CREATE INDEX "LeadActivity_sessionId_timestamp_idx" ON "LeadActivity"("sessionId", "timestamp");

-- Booking indexes.
CREATE INDEX "Booking_tenantId_createdAt_idx" ON "Booking"("tenantId", "createdAt");
CREATE INDEX "Booking_tenantId_deletedAt_idx" ON "Booking"("tenantId", "deletedAt");
CREATE UNIQUE INDEX "Booking_tenantId_leadId_key" ON "Booking"("tenantId", "leadId");

-- Foreign keys.
ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_assignedTo_fkey"
FOREIGN KEY ("assignedTo") REFERENCES "TenantUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "LeadSession"
ADD CONSTRAINT "LeadSession_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "LeadSession"
ADD CONSTRAINT "LeadSession_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "LeadActivity"
ADD CONSTRAINT "LeadActivity_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "LeadActivity"
ADD CONSTRAINT "LeadActivity_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "LeadActivity"
ADD CONSTRAINT "LeadActivity_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "LeadSession"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
