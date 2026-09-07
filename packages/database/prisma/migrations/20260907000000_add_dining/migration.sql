-- AlterTable
ALTER TABLE "GoogleReviewSummary" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "image" TEXT,
    "basePrice" DOUBLE PRECISION,
    "itemType" TEXT NOT NULL DEFAULT 'STANDARD',
    "kitchenStationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "availability" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVariant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceAdjustment" DOUBLE PRECISION,
    "sku" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ItemVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAddon" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "maxQuantity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ItemAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemModifier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ItemModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPrice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "variantId" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ItemPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAvailability" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "reason" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ItemAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenStation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "KitchenStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemImage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MenuItemImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "openedBy" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "assignedWaiterId" TEXT,
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DiningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningCart" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DiningCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningOrderRound" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "draftCartId" TEXT,
    "roundNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "submittedAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DiningOrderRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DiningOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningOrderItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "itemSnapshot" JSONB NOT NULL,
    "priceSnapshot" JSONB NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "kitchenStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "lockStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DiningOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningOrderLock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNLOCKED',
    "lockedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "reason" TEXT,
    "idempotencyKey" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningOrderLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningOrderLockEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT,
    "previousState" TEXT,
    "newState" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiningOrderLockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningOrderModificationRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningOrderModificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningOrderItemAdjustment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "modificationRequestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiningOrderItemAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningCartItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "modifiers" JSONB,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "addedBy" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DiningCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningCartSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiningCartSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningTable" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "activeSessionId" TEXT,
    "currentWaiterId" TEXT,
    "lastStatusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastStatusChangedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DiningTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningTableAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningTableAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningTableTransferRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fromTableId" TEXT NOT NULL,
    "toTableId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvedBy" TEXT,
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningTableTransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningTableGroup" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningTableGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningTableGroupMember" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tableGroupId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningTableGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningTableMergeRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tableIds" JSONB NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningTableMergeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionToken" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "lastAccessedAt" TIMESTAMP(3),
    "regeneratedAt" TIMESTAMP(3),

    CONSTRAINT "SessionToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionParticipant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "actorId" TEXT,
    "role" TEXT NOT NULL,
    "participantType" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "displayName" TEXT,
    "deviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'JOINING',
    "permissions" JSONB,
    "joinedBy" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Menu_tenantId_idx" ON "Menu"("tenantId");

-- CreateIndex
CREATE INDEX "Menu_tenantId_locationId_idx" ON "Menu"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "Menu_tenantId_locationId_status_idx" ON "Menu"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "Menu_tenantId_locationId_sortOrder_idx" ON "Menu"("tenantId", "locationId", "sortOrder");

-- CreateIndex
CREATE INDEX "MenuCategory_tenantId_idx" ON "MenuCategory"("tenantId");

-- CreateIndex
CREATE INDEX "MenuCategory_tenantId_locationId_idx" ON "MenuCategory"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "MenuCategory_menuId_idx" ON "MenuCategory"("menuId");

-- CreateIndex
CREATE INDEX "MenuCategory_menuId_sortOrder_idx" ON "MenuCategory"("menuId", "sortOrder");

-- CreateIndex
CREATE INDEX "MenuItem_tenantId_idx" ON "MenuItem"("tenantId");

-- CreateIndex
CREATE INDEX "MenuItem_tenantId_locationId_idx" ON "MenuItem"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "MenuItem_tenantId_locationId_categoryId_idx" ON "MenuItem"("tenantId", "locationId", "categoryId");

-- CreateIndex
CREATE INDEX "MenuItem_tenantId_locationId_status_idx" ON "MenuItem"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "MenuItem_tenantId_locationId_availability_idx" ON "MenuItem"("tenantId", "locationId", "availability");

-- CreateIndex
CREATE INDEX "ItemVariant_tenantId_idx" ON "ItemVariant"("tenantId");

-- CreateIndex
CREATE INDEX "ItemVariant_tenantId_locationId_idx" ON "ItemVariant"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "ItemVariant_itemId_idx" ON "ItemVariant"("itemId");

-- CreateIndex
CREATE INDEX "ItemAddon_tenantId_idx" ON "ItemAddon"("tenantId");

-- CreateIndex
CREATE INDEX "ItemAddon_tenantId_locationId_idx" ON "ItemAddon"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "ItemAddon_itemId_idx" ON "ItemAddon"("itemId");

-- CreateIndex
CREATE INDEX "ItemModifier_tenantId_idx" ON "ItemModifier"("tenantId");

-- CreateIndex
CREATE INDEX "ItemModifier_tenantId_locationId_idx" ON "ItemModifier"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "ItemModifier_itemId_idx" ON "ItemModifier"("itemId");

-- CreateIndex
CREATE INDEX "ItemPrice_tenantId_idx" ON "ItemPrice"("tenantId");

-- CreateIndex
CREATE INDEX "ItemPrice_tenantId_locationId_idx" ON "ItemPrice"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "ItemPrice_itemId_idx" ON "ItemPrice"("itemId");

-- CreateIndex
CREATE INDEX "ItemPrice_tenantId_locationId_effectiveFrom_idx" ON "ItemPrice"("tenantId", "locationId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "ItemAvailability_itemId_key" ON "ItemAvailability"("itemId");

-- CreateIndex
CREATE INDEX "ItemAvailability_tenantId_idx" ON "ItemAvailability"("tenantId");

-- CreateIndex
CREATE INDEX "ItemAvailability_tenantId_locationId_idx" ON "ItemAvailability"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "ItemAvailability_tenantId_locationId_status_idx" ON "ItemAvailability"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "KitchenStation_tenantId_idx" ON "KitchenStation"("tenantId");

-- CreateIndex
CREATE INDEX "KitchenStation_tenantId_locationId_idx" ON "KitchenStation"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "KitchenStation_tenantId_locationId_name_idx" ON "KitchenStation"("tenantId", "locationId", "name");

-- CreateIndex
CREATE INDEX "MenuItemImage_tenantId_idx" ON "MenuItemImage"("tenantId");

-- CreateIndex
CREATE INDEX "MenuItemImage_tenantId_locationId_idx" ON "MenuItemImage"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "MenuItemImage_itemId_idx" ON "MenuItemImage"("itemId");

-- CreateIndex
CREATE INDEX "MenuItemImage_itemId_sortOrder_idx" ON "MenuItemImage"("itemId", "sortOrder");

-- CreateIndex
CREATE INDEX "DiningSession_tenantId_idx" ON "DiningSession"("tenantId");

-- CreateIndex
CREATE INDEX "DiningSession_tenantId_locationId_idx" ON "DiningSession"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningSession_tenantId_locationId_tableId_idx" ON "DiningSession"("tenantId", "locationId", "tableId");

-- CreateIndex
CREATE INDEX "DiningSession_tenantId_locationId_status_idx" ON "DiningSession"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningSession_tenantId_locationId_deletedAt_idx" ON "DiningSession"("tenantId", "locationId", "deletedAt");

-- CreateIndex
CREATE INDEX "DiningCart_tenantId_idx" ON "DiningCart"("tenantId");

-- CreateIndex
CREATE INDEX "DiningCart_tenantId_locationId_idx" ON "DiningCart"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningCart_tenantId_locationId_sessionId_idx" ON "DiningCart"("tenantId", "locationId", "sessionId");

-- CreateIndex
CREATE INDEX "DiningCart_tenantId_locationId_status_idx" ON "DiningCart"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningCart_tenantId_locationId_deletedAt_idx" ON "DiningCart"("tenantId", "locationId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiningCart_tenantId_locationId_sessionId_roundNumber_key" ON "DiningCart"("tenantId", "locationId", "sessionId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DiningOrderRound_draftCartId_key" ON "DiningOrderRound"("draftCartId");

-- CreateIndex
CREATE INDEX "DiningOrderRound_tenantId_idx" ON "DiningOrderRound"("tenantId");

-- CreateIndex
CREATE INDEX "DiningOrderRound_tenantId_locationId_idx" ON "DiningOrderRound"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningOrderRound_tenantId_locationId_sessionId_idx" ON "DiningOrderRound"("tenantId", "locationId", "sessionId");

-- CreateIndex
CREATE INDEX "DiningOrderRound_tenantId_locationId_status_idx" ON "DiningOrderRound"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningOrderRound_tenantId_locationId_deletedAt_idx" ON "DiningOrderRound"("tenantId", "locationId", "deletedAt");

-- CreateIndex
CREATE INDEX "DiningOrderRound_tenantId_locationId_idempotencyKey_idx" ON "DiningOrderRound"("tenantId", "locationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "DiningOrderRound_tenantId_locationId_sessionId_roundNumber_key" ON "DiningOrderRound"("tenantId", "locationId", "sessionId", "roundNumber");

-- CreateIndex
CREATE INDEX "DiningOrder_tenantId_idx" ON "DiningOrder"("tenantId");

-- CreateIndex
CREATE INDEX "DiningOrder_tenantId_locationId_idx" ON "DiningOrder"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningOrder_tenantId_locationId_sessionId_idx" ON "DiningOrder"("tenantId", "locationId", "sessionId");

-- CreateIndex
CREATE INDEX "DiningOrder_tenantId_locationId_roundId_idx" ON "DiningOrder"("tenantId", "locationId", "roundId");

-- CreateIndex
CREATE INDEX "DiningOrder_tenantId_locationId_status_idx" ON "DiningOrder"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningOrder_tenantId_locationId_deletedAt_idx" ON "DiningOrder"("tenantId", "locationId", "deletedAt");

-- CreateIndex
CREATE INDEX "DiningOrderItem_tenantId_idx" ON "DiningOrderItem"("tenantId");

-- CreateIndex
CREATE INDEX "DiningOrderItem_tenantId_locationId_idx" ON "DiningOrderItem"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningOrderItem_tenantId_locationId_orderId_idx" ON "DiningOrderItem"("tenantId", "locationId", "orderId");

-- CreateIndex
CREATE INDEX "DiningOrderItem_tenantId_locationId_kitchenStatus_idx" ON "DiningOrderItem"("tenantId", "locationId", "kitchenStatus");

-- CreateIndex
CREATE INDEX "DiningOrderItem_tenantId_locationId_lockStatus_idx" ON "DiningOrderItem"("tenantId", "locationId", "lockStatus");

-- CreateIndex
CREATE INDEX "DiningOrderItem_tenantId_locationId_deletedAt_idx" ON "DiningOrderItem"("tenantId", "locationId", "deletedAt");

-- CreateIndex
CREATE INDEX "DiningOrderLock_tenantId_idx" ON "DiningOrderLock"("tenantId");

-- CreateIndex
CREATE INDEX "DiningOrderLock_tenantId_locationId_idx" ON "DiningOrderLock"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningOrderLock_tenantId_locationId_orderId_idx" ON "DiningOrderLock"("tenantId", "locationId", "orderId");

-- CreateIndex
CREATE INDEX "DiningOrderLock_tenantId_locationId_status_idx" ON "DiningOrderLock"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningOrderLock_tenantId_locationId_lockedAt_idx" ON "DiningOrderLock"("tenantId", "locationId", "lockedAt");

-- CreateIndex
CREATE INDEX "DiningOrderLock_tenantId_locationId_idempotencyKey_idx" ON "DiningOrderLock"("tenantId", "locationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "DiningOrderLock_orderId_key" ON "DiningOrderLock"("orderId");

-- CreateIndex
CREATE INDEX "DiningOrderLockEvent_tenantId_idx" ON "DiningOrderLockEvent"("tenantId");

-- CreateIndex
CREATE INDEX "DiningOrderLockEvent_tenantId_locationId_idx" ON "DiningOrderLockEvent"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningOrderLockEvent_tenantId_locationId_orderId_idx" ON "DiningOrderLockEvent"("tenantId", "locationId", "orderId");

-- CreateIndex
CREATE INDEX "DiningOrderLockEvent_tenantId_locationId_action_idx" ON "DiningOrderLockEvent"("tenantId", "locationId", "action");

-- CreateIndex
CREATE INDEX "DiningOrderLockEvent_tenantId_locationId_createdAt_idx" ON "DiningOrderLockEvent"("tenantId", "locationId", "createdAt");

-- CreateIndex
CREATE INDEX "DiningOrderModificationRequest_tenantId_idx" ON "DiningOrderModificationRequest"("tenantId");

-- CreateIndex
CREATE INDEX "DiningOrderModificationRequest_tenantId_locationId_idx" ON "DiningOrderModificationRequest"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningOrderModificationRequest_tenantId_locationId_orderId_idx" ON "DiningOrderModificationRequest"("tenantId", "locationId", "orderId");

-- CreateIndex
CREATE INDEX "DiningOrderModificationRequest_tenantId_locationId_sessionI_idx" ON "DiningOrderModificationRequest"("tenantId", "locationId", "sessionId");

-- CreateIndex
CREATE INDEX "DiningOrderModificationRequest_tenantId_locationId_status_idx" ON "DiningOrderModificationRequest"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningOrderModificationRequest_tenantId_locationId_idempote_idx" ON "DiningOrderModificationRequest"("tenantId", "locationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "DiningOrderItemAdjustment_tenantId_idx" ON "DiningOrderItemAdjustment"("tenantId");

-- CreateIndex
CREATE INDEX "DiningOrderItemAdjustment_tenantId_locationId_idx" ON "DiningOrderItemAdjustment"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningOrderItemAdjustment_tenantId_locationId_orderId_idx" ON "DiningOrderItemAdjustment"("tenantId", "locationId", "orderId");

-- CreateIndex
CREATE INDEX "DiningOrderItemAdjustment_tenantId_locationId_orderItemId_idx" ON "DiningOrderItemAdjustment"("tenantId", "locationId", "orderItemId");

-- CreateIndex
CREATE INDEX "DiningOrderItemAdjustment_tenantId_locationId_modificationR_idx" ON "DiningOrderItemAdjustment"("tenantId", "locationId", "modificationRequestId");

-- CreateIndex
CREATE INDEX "DiningOrderItemAdjustment_tenantId_locationId_type_idx" ON "DiningOrderItemAdjustment"("tenantId", "locationId", "type");

-- CreateIndex
CREATE INDEX "DiningOrderItemAdjustment_tenantId_locationId_createdAt_idx" ON "DiningOrderItemAdjustment"("tenantId", "locationId", "createdAt");

-- CreateIndex
CREATE INDEX "DiningCartItem_tenantId_idx" ON "DiningCartItem"("tenantId");

-- CreateIndex
CREATE INDEX "DiningCartItem_tenantId_locationId_idx" ON "DiningCartItem"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningCartItem_tenantId_locationId_cartId_idx" ON "DiningCartItem"("tenantId", "locationId", "cartId");

-- CreateIndex
CREATE INDEX "DiningCartItem_tenantId_locationId_status_idx" ON "DiningCartItem"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningCartItem_tenantId_locationId_deletedAt_idx" ON "DiningCartItem"("tenantId", "locationId", "deletedAt");

-- CreateIndex
CREATE INDEX "DiningCartSnapshot_tenantId_idx" ON "DiningCartSnapshot"("tenantId");

-- CreateIndex
CREATE INDEX "DiningCartSnapshot_tenantId_locationId_idx" ON "DiningCartSnapshot"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningCartSnapshot_tenantId_locationId_cartId_idx" ON "DiningCartSnapshot"("tenantId", "locationId", "cartId");

-- CreateIndex
CREATE UNIQUE INDEX "DiningCartSnapshot_cartId_version_key" ON "DiningCartSnapshot"("cartId", "version");

-- CreateIndex
CREATE INDEX "DiningTable_tenantId_idx" ON "DiningTable"("tenantId");

-- CreateIndex
CREATE INDEX "DiningTable_tenantId_locationId_idx" ON "DiningTable"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningTable_tenantId_locationId_areaId_idx" ON "DiningTable"("tenantId", "locationId", "areaId");

-- CreateIndex
CREATE INDEX "DiningTable_tenantId_locationId_status_idx" ON "DiningTable"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningTable_tenantId_locationId_activeSessionId_idx" ON "DiningTable"("tenantId", "locationId", "activeSessionId");

-- CreateIndex
CREATE INDEX "DiningTable_tenantId_locationId_deletedAt_idx" ON "DiningTable"("tenantId", "locationId", "deletedAt");

-- CreateIndex
CREATE INDEX "DiningTableAssignment_tenantId_idx" ON "DiningTableAssignment"("tenantId");

-- CreateIndex
CREATE INDEX "DiningTableAssignment_tenantId_locationId_idx" ON "DiningTableAssignment"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningTableAssignment_tenantId_locationId_sessionId_idx" ON "DiningTableAssignment"("tenantId", "locationId", "sessionId");

-- CreateIndex
CREATE INDEX "DiningTableAssignment_tenantId_locationId_tableId_idx" ON "DiningTableAssignment"("tenantId", "locationId", "tableId");

-- CreateIndex
CREATE INDEX "DiningTableAssignment_tenantId_locationId_status_idx" ON "DiningTableAssignment"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningTableAssignment_tenantId_locationId_assignedAt_idx" ON "DiningTableAssignment"("tenantId", "locationId", "assignedAt");

-- CreateIndex
CREATE INDEX "DiningTableTransferRequest_tenantId_idx" ON "DiningTableTransferRequest"("tenantId");

-- CreateIndex
CREATE INDEX "DiningTableTransferRequest_tenantId_locationId_idx" ON "DiningTableTransferRequest"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningTableTransferRequest_tenantId_locationId_sessionId_idx" ON "DiningTableTransferRequest"("tenantId", "locationId", "sessionId");

-- CreateIndex
CREATE INDEX "DiningTableTransferRequest_tenantId_locationId_fromTableId_idx" ON "DiningTableTransferRequest"("tenantId", "locationId", "fromTableId");

-- CreateIndex
CREATE INDEX "DiningTableTransferRequest_tenantId_locationId_toTableId_idx" ON "DiningTableTransferRequest"("tenantId", "locationId", "toTableId");

-- CreateIndex
CREATE INDEX "DiningTableTransferRequest_tenantId_locationId_status_idx" ON "DiningTableTransferRequest"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningTableTransferRequest_tenantId_locationId_createdAt_idx" ON "DiningTableTransferRequest"("tenantId", "locationId", "createdAt");

-- CreateIndex
CREATE INDEX "DiningTableGroup_tenantId_idx" ON "DiningTableGroup"("tenantId");

-- CreateIndex
CREATE INDEX "DiningTableGroup_tenantId_locationId_idx" ON "DiningTableGroup"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningTableGroup_tenantId_locationId_sessionId_idx" ON "DiningTableGroup"("tenantId", "locationId", "sessionId");

-- CreateIndex
CREATE INDEX "DiningTableGroup_tenantId_locationId_status_idx" ON "DiningTableGroup"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningTableGroup_tenantId_locationId_createdAt_idx" ON "DiningTableGroup"("tenantId", "locationId", "createdAt");

-- CreateIndex
CREATE INDEX "DiningTableGroupMember_tenantId_idx" ON "DiningTableGroupMember"("tenantId");

-- CreateIndex
CREATE INDEX "DiningTableGroupMember_tableGroupId_idx" ON "DiningTableGroupMember"("tableGroupId");

-- CreateIndex
CREATE INDEX "DiningTableGroupMember_tableId_idx" ON "DiningTableGroupMember"("tableId");

-- CreateIndex
CREATE INDEX "DiningTableMergeRequest_tenantId_idx" ON "DiningTableMergeRequest"("tenantId");

-- CreateIndex
CREATE INDEX "DiningTableMergeRequest_tenantId_locationId_idx" ON "DiningTableMergeRequest"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "DiningTableMergeRequest_tenantId_locationId_sessionId_idx" ON "DiningTableMergeRequest"("tenantId", "locationId", "sessionId");

-- CreateIndex
CREATE INDEX "DiningTableMergeRequest_tenantId_locationId_status_idx" ON "DiningTableMergeRequest"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "DiningTableMergeRequest_tenantId_locationId_createdAt_idx" ON "DiningTableMergeRequest"("tenantId", "locationId", "createdAt");

-- CreateIndex
CREATE INDEX "SessionToken_tenantId_idx" ON "SessionToken"("tenantId");

-- CreateIndex
CREATE INDEX "SessionToken_tenantId_locationId_idx" ON "SessionToken"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "SessionToken_tenantId_locationId_token_idx" ON "SessionToken"("tenantId", "locationId", "token");

-- CreateIndex
CREATE INDEX "SessionToken_tenantId_locationId_status_idx" ON "SessionToken"("tenantId", "locationId", "status");

-- CreateIndex
CREATE INDEX "SessionToken_sessionId_status_idx" ON "SessionToken"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SessionToken_sessionId_key" ON "SessionToken"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionToken_token_key" ON "SessionToken"("token");

-- CreateIndex
CREATE INDEX "SessionParticipant_tenantId_idx" ON "SessionParticipant"("tenantId");

-- CreateIndex
CREATE INDEX "SessionParticipant_tenantId_locationId_idx" ON "SessionParticipant"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "SessionParticipant_sessionId_idx" ON "SessionParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "SessionParticipant_sessionId_status_idx" ON "SessionParticipant"("sessionId", "status");

-- CreateIndex
CREATE INDEX "SessionParticipant_sessionId_deviceId_idx" ON "SessionParticipant"("sessionId", "deviceId");

-- CreateIndex
CREATE INDEX "SessionParticipant_sessionId_actorId_idx" ON "SessionParticipant"("sessionId", "actorId");

-- CreateIndex
CREATE INDEX "SessionParticipant_tenantId_locationId_sessionId_status_idx" ON "SessionParticipant"("tenantId", "locationId", "sessionId", "status");

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_kitchenStationId_fkey" FOREIGN KEY ("kitchenStationId") REFERENCES "KitchenStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVariant" ADD CONSTRAINT "ItemVariant_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAddon" ADD CONSTRAINT "ItemAddon_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModifier" ADD CONSTRAINT "ItemModifier_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPrice" ADD CONSTRAINT "ItemPrice_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPrice" ADD CONSTRAINT "ItemPrice_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAvailability" ADD CONSTRAINT "ItemAvailability_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenStation" ADD CONSTRAINT "KitchenStation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemImage" ADD CONSTRAINT "MenuItemImage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningSession" ADD CONSTRAINT "DiningSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningSession" ADD CONSTRAINT "DiningSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DiningTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningCart" ADD CONSTRAINT "DiningCart_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningCart" ADD CONSTRAINT "DiningCart_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderRound" ADD CONSTRAINT "DiningOrderRound_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderRound" ADD CONSTRAINT "DiningOrderRound_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderRound" ADD CONSTRAINT "DiningOrderRound_draftCartId_fkey" FOREIGN KEY ("draftCartId") REFERENCES "DiningCart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrder" ADD CONSTRAINT "DiningOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrder" ADD CONSTRAINT "DiningOrder_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "DiningOrderRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrder" ADD CONSTRAINT "DiningOrder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderItem" ADD CONSTRAINT "DiningOrderItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderItem" ADD CONSTRAINT "DiningOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DiningOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderLock" ADD CONSTRAINT "DiningOrderLock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderLock" ADD CONSTRAINT "DiningOrderLock_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DiningOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderLockEvent" ADD CONSTRAINT "DiningOrderLockEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderLockEvent" ADD CONSTRAINT "DiningOrderLockEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DiningOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderModificationRequest" ADD CONSTRAINT "DiningOrderModificationRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderModificationRequest" ADD CONSTRAINT "DiningOrderModificationRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DiningOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderItemAdjustment" ADD CONSTRAINT "DiningOrderItemAdjustment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderItemAdjustment" ADD CONSTRAINT "DiningOrderItemAdjustment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DiningOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderItemAdjustment" ADD CONSTRAINT "DiningOrderItemAdjustment_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "DiningOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningOrderItemAdjustment" ADD CONSTRAINT "DiningOrderItemAdjustment_modificationRequestId_fkey" FOREIGN KEY ("modificationRequestId") REFERENCES "DiningOrderModificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningCartItem" ADD CONSTRAINT "DiningCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "DiningCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningCartSnapshot" ADD CONSTRAINT "DiningCartSnapshot_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "DiningCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTableAssignment" ADD CONSTRAINT "DiningTableAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTableAssignment" ADD CONSTRAINT "DiningTableAssignment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DiningTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTableTransferRequest" ADD CONSTRAINT "DiningTableTransferRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTableTransferRequest" ADD CONSTRAINT "DiningTableTransferRequest_fromTableId_fkey" FOREIGN KEY ("fromTableId") REFERENCES "DiningTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTableTransferRequest" ADD CONSTRAINT "DiningTableTransferRequest_toTableId_fkey" FOREIGN KEY ("toTableId") REFERENCES "DiningTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTableGroup" ADD CONSTRAINT "DiningTableGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTableGroup" ADD CONSTRAINT "DiningTableGroup_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTableGroupMember" ADD CONSTRAINT "DiningTableGroupMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTableGroupMember" ADD CONSTRAINT "DiningTableGroupMember_tableGroupId_fkey" FOREIGN KEY ("tableGroupId") REFERENCES "DiningTableGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTableMergeRequest" ADD CONSTRAINT "DiningTableMergeRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTableMergeRequest" ADD CONSTRAINT "DiningTableMergeRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionToken" ADD CONSTRAINT "SessionToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

