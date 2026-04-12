-- Add tenant theme support, booking metadata, and Google review summary

ALTER TABLE "Tenant"
ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'default';

ALTER TABLE "Booking"
ADD COLUMN IF NOT EXISTS "selectedServices" JSONB,
ADD COLUMN IF NOT EXISTS "selectedTime" TEXT;

CREATE TABLE IF NOT EXISTS "GoogleReviewSummary" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "rating" DOUBLE PRECISION,
  "totalReviewsCount" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoogleReviewSummary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GoogleReviewSummary_tenantId_key" ON "GoogleReviewSummary"("tenantId");
CREATE INDEX IF NOT EXISTS "GoogleReviewSummary_tenantId_idx" ON "GoogleReviewSummary"("tenantId");

ALTER TABLE "GoogleReviewSummary"
ADD CONSTRAINT "GoogleReviewSummary_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
