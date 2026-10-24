ALTER TABLE "Student"
  DROP CONSTRAINT IF EXISTS "Student_userId_tenantId_fkey";

DROP INDEX IF EXISTS "Student_tenantId_userId_key";

ALTER TABLE "Student"
  DROP COLUMN IF EXISTS "userId";
