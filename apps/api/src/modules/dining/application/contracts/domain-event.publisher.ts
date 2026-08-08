import type {
  ItemArchived,
  ItemAvailabilityChanged,
  KitchenStationAssigned,
  MenuCreated,
  MenuUpdated,
  PriceChanged,
} from '@saas/domain-core/dining/menu.events';
import type {
  CartCreated,
  CartItemAdded,
  CartItemRemoved,
  CartItemUpdated,
  CartSubmitted,
} from '@saas/domain-core/dining/cart.events';
import type {
  OrderCreated,
  OrderRoundCancelled,
  OrderRoundCompleted,
  OrderRoundCreated,
  OrderRoundSubmitted,
} from '@saas/domain-core/dining/order-round.events';
import type {
  OrderLockFailed,
  OrderLocked,
  OrderLockRequested,
  OrderReopened,
} from '@saas/domain-core/dining/order-lock.events';
import type {
  OrderItemCancelled,
  OrderModificationApproved,
  OrderModificationRejected,
  OrderModificationRequested,
  OrderModified,
} from '@saas/domain-core/dining/order-modification.events';
import type {
  ParticipantDisconnected,
  ParticipantJoined,
  ParticipantLeft,
  ParticipantReconnected,
  SessionTokenExpired,
  SessionTokenGenerated,
  SessionTokenRegenerated,
} from '@saas/domain-core/dining/session.events';
import type {
  AssistedItemAdded,
  OrderSubmittedByStaff,
  ParticipantLeftSession,
  SessionOwnershipTransferred,
  WaiterJoinedSession,
} from '@saas/domain-core/dining/waiter-assist.events';
import type {
  TableAvailable,
  TableCleaningStarted,
  TableMaintenanceCompleted,
  TableMaintenanceStarted,
  TableOccupied,
  TableStatusChanged,
  WaiterAssignedToTable,
} from '@saas/domain-core/dining/table.events';
import type {
  NewTableOccupied,
  OldTableReleased,
  SessionTableChanged,
  TableTransferApproved,
  TableTransferCompleted,
  TableTransferRejected,
  TableTransferRequested,
} from '@saas/domain-core/dining/table-transfer.events';
import type {
  TableGroupCreated,
  TableGroupReleased,
  TableMergeApproved,
  TableMergeRequested,
  TablesMerged,
} from '@saas/domain-core/dining/table-group.events';

export type DiningDomainEvent =
  | { type: 'MenuCreated'; payload: MenuCreated }
  | { type: 'MenuUpdated'; payload: MenuUpdated }
  | { type: 'ItemAvailabilityChanged'; payload: ItemAvailabilityChanged }
  | { type: 'PriceChanged'; payload: PriceChanged }
  | { type: 'ItemArchived'; payload: ItemArchived }
  | { type: 'KitchenStationAssigned'; payload: KitchenStationAssigned }
  | { type: 'SessionTokenGenerated'; payload: SessionTokenGenerated }
  | { type: 'SessionTokenRegenerated'; payload: SessionTokenRegenerated }
  | { type: 'ParticipantJoined'; payload: ParticipantJoined }
  | { type: 'ParticipantDisconnected'; payload: ParticipantDisconnected }
  | { type: 'ParticipantReconnected'; payload: ParticipantReconnected }
  | { type: 'ParticipantLeft'; payload: ParticipantLeft }
  | { type: 'WaiterJoinedSession'; payload: WaiterJoinedSession }
  | { type: 'ParticipantLeftSession'; payload: ParticipantLeftSession }
  | { type: 'SessionTokenExpired'; payload: SessionTokenExpired }
  | { type: 'TableOccupied'; payload: TableOccupied }
  | { type: 'TableStatusChanged'; payload: TableStatusChanged }
  | { type: 'TableCleaningStarted'; payload: TableCleaningStarted }
  | { type: 'TableAvailable'; payload: TableAvailable }
  | { type: 'TableMaintenanceStarted'; payload: TableMaintenanceStarted }
  | { type: 'TableMaintenanceCompleted'; payload: TableMaintenanceCompleted }
  | { type: 'WaiterAssignedToTable'; payload: WaiterAssignedToTable }
  | { type: 'TableTransferRequested'; payload: TableTransferRequested }
  | { type: 'TableTransferApproved'; payload: TableTransferApproved }
  | { type: 'SessionTableChanged'; payload: SessionTableChanged }
  | { type: 'OldTableReleased'; payload: OldTableReleased }
  | { type: 'NewTableOccupied'; payload: NewTableOccupied }
  | { type: 'TableTransferCompleted'; payload: TableTransferCompleted }
  | { type: 'TableTransferRejected'; payload: TableTransferRejected }
  | { type: 'TableMergeRequested'; payload: TableMergeRequested }
  | { type: 'TableMergeApproved'; payload: TableMergeApproved }
  | { type: 'TableGroupCreated'; payload: TableGroupCreated }
  | { type: 'TablesMerged'; payload: TablesMerged }
  | { type: 'TableGroupReleased'; payload: TableGroupReleased }
  | { type: 'CartCreated'; payload: CartCreated }
  | { type: 'CartItemAdded'; payload: CartItemAdded }
  | { type: 'CartItemUpdated'; payload: CartItemUpdated }
  | { type: 'CartItemRemoved'; payload: CartItemRemoved }
  | { type: 'CartSubmitted'; payload: CartSubmitted }
  | { type: 'OrderRoundCreated'; payload: OrderRoundCreated }
  | { type: 'OrderRoundSubmitted'; payload: OrderRoundSubmitted }
  | { type: 'OrderCreated'; payload: OrderCreated }
  | { type: 'OrderRoundCompleted'; payload: OrderRoundCompleted }
  | { type: 'OrderRoundCancelled'; payload: OrderRoundCancelled }
  | { type: 'OrderLockRequested'; payload: OrderLockRequested }
  | { type: 'OrderLocked'; payload: OrderLocked }
  | { type: 'OrderReopened'; payload: OrderReopened }
  | { type: 'OrderLockFailed'; payload: OrderLockFailed }
  | { type: 'OrderModificationRequested'; payload: OrderModificationRequested }
  | { type: 'OrderModificationApproved'; payload: OrderModificationApproved }
  | { type: 'OrderModificationRejected'; payload: OrderModificationRejected }
  | { type: 'OrderItemCancelled'; payload: OrderItemCancelled }
  | { type: 'OrderModified'; payload: OrderModified }
  | { type: 'AssistedItemAdded'; payload: AssistedItemAdded }
  | { type: 'OrderSubmittedByStaff'; payload: OrderSubmittedByStaff }
  | { type: 'SessionOwnershipTransferred'; payload: SessionOwnershipTransferred };

export interface DiningDomainEventPublisher {
  publish(event: DiningDomainEvent): Promise<void>;
}
