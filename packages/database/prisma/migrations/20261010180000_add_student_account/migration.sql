
-- CreateTable
CREATE TABLE "StudentAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentAccount_tenantId_idx"
ON "StudentAccount"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAccount_studentId_tenantId_key"
ON "StudentAccount"("studentId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAccount_id_tenantId_key"
ON "StudentAccount"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "StudentAccount"
ADD CONSTRAINT "StudentAccount_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAccount"
ADD CONSTRAINT "StudentAccount_studentId_tenantId_fkey"
FOREIGN KEY ("studentId", "tenantId")
REFERENCES "Student"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;
