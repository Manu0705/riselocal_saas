-- CreateTable
CREATE TABLE "HostelProperty" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelProperty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HostelProperty_tenantId_name_key" ON "HostelProperty"("tenantId", "name");

-- CreateIndex
CREATE INDEX "HostelProperty_tenantId_isActive_idx" ON "HostelProperty"("tenantId", "isActive");

-- AddForeignKey
ALTER TABLE "HostelProperty" ADD CONSTRAINT "HostelProperty_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
