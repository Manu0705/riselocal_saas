/*
  Warnings:

  - You are about to drop the column `comment` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `leadId` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the `LeadActivityLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhatsAppClick` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `message` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Lead` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `Lead` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `domain` on table `Tenant` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_leadId_fkey";

-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_userId_fkey";

-- DropForeignKey
ALTER TABLE "LeadActivityLog" DROP CONSTRAINT "LeadActivityLog_leadId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "WhatsAppClick" DROP CONSTRAINT "WhatsAppClick_leadId_fkey";

-- DropIndex
DROP INDEX "Feedback_leadId_idx";

-- DropIndex
DROP INDEX "Lead_phone_idx";

-- DropIndex
DROP INDEX "Lead_status_idx";

-- DropIndex
DROP INDEX "Lead_tenantId_idx";

-- DropIndex
DROP INDEX "Tenant_isActive_idx";

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "comment",
DROP COLUMN "leadId",
DROP COLUMN "type",
ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "deletedAt",
DROP COLUMN "phone",
DROP COLUMN "source",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ALTER COLUMN "email" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "deletedAt",
DROP COLUMN "isActive",
ALTER COLUMN "domain" SET NOT NULL;

-- DropTable
DROP TABLE "LeadActivityLog";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "WhatsAppClick";

-- DropEnum
DROP TYPE "FeedbackType";

-- DropEnum
DROP TYPE "LeadStatus";

-- DropEnum
DROP TYPE "Role";

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
