CREATE TYPE "HostelFeeFrequency" AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'HALF_YEARLY',
    'YEARLY',
    'ONE_TIME'
);

ALTER TABLE "HostelFee"
ADD COLUMN "billingFrequency" "HostelFeeFrequency" NOT NULL DEFAULT 'MONTHLY';

ALTER TABLE "HostelFeeAssignment"
ADD COLUMN "billingKey" TEXT;

UPDATE "HostelFee" AS older
SET "isActive" = FALSE
WHERE older."isActive" = TRUE
  AND EXISTS (
    SELECT 1
    FROM "HostelFee" AS newer
    WHERE newer."tenantId" = older."tenantId"
      AND newer."hostelId" = older."hostelId"
      AND newer."type" = older."type"
      AND newer."isActive" = TRUE
      AND (
        newer."createdAt" > older."createdAt"
        OR (newer."createdAt" = older."createdAt" AND newer."id" > older."id")
      )
  );

CREATE UNIQUE INDEX "HostelFeeAssignment_tenantId_billingKey_key"
ON "HostelFeeAssignment"("tenantId", "billingKey");
