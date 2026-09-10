import type { TenantUserRole } from '@saas/domain-core/auth.contract';

export type HostelPermission =
  | 'view_dashboard'
  | 'manage_hostel'
  | 'manage_admissions'
  | 'view_students'
  | 'manage_students'
  | 'view_rooms'
  | 'manage_rooms'
  | 'allocate_rooms'
  | 'manage_fees'
  | 'collect_payments'
  | 'verify_payments'
  | 'manage_receipts'
  | 'manage_reconciliation'
  | 'view_ledger'
  | 'manage_checkin_checkout'
  | 'manage_deposits'
  | 'manage_complaints'
  | 'manage_announcements'
  | 'view_reports'
  | 'manage_staff'
  | 'manage_settings'
  | 'view_audit_logs';

const ROLE_PERMISSIONS: Record<TenantUserRole, readonly HostelPermission[]> = {
  owner: [
    'view_dashboard',
    'manage_hostel',
    'manage_admissions',
    'view_students',
    'manage_students',
    'view_rooms',
    'manage_rooms',
    'allocate_rooms',
    'manage_fees',
    'collect_payments',
    'verify_payments',
    'manage_receipts',
    'manage_reconciliation',
    'view_ledger',
    'manage_checkin_checkout',
    'manage_deposits',
    'manage_complaints',
    'manage_announcements',
    'view_reports',
    'manage_staff',
    'manage_settings',
    'view_audit_logs',
  ],

  manager: [
    'view_dashboard',
    'manage_admissions',
    'view_students',
    'manage_students',
    'view_rooms',
    'manage_rooms',
    'allocate_rooms',
    'manage_fees',
    'collect_payments',
    'verify_payments',
    'manage_receipts',
    'view_ledger',
    'manage_checkin_checkout',
    'manage_deposits',
    'manage_complaints',
    'manage_announcements',
    'view_reports',
    'manage_settings',
  ],

  staff: [
    'view_dashboard',
    'view_students',
    'view_rooms',
    'allocate_rooms',
    'collect_payments',
    'manage_receipts',
    'manage_checkin_checkout',
    'manage_complaints',
    'manage_announcements',
  ],
  student: [],
};

export function hasHostelPermission(
  role: string | null | undefined,
  permission: HostelPermission,
): boolean {
  if (!role) return false;

  const normalizedRole = role.trim().toLowerCase();

  if (
    normalizedRole !== 'owner' &&
    normalizedRole !== 'manager' &&
    normalizedRole !== 'staff'
  ) {
    return false;
  }

  return ROLE_PERMISSIONS[normalizedRole].includes(permission);
}

export function getHostelPermissions(
  role: string | null | undefined,
): readonly HostelPermission[] {
  if (!role) return [];

  const normalizedRole = role.trim().toLowerCase();

  if (
    normalizedRole !== 'owner' &&
    normalizedRole !== 'manager' &&
    normalizedRole !== 'staff'
  ) {
    return [];
  }

  return ROLE_PERMISSIONS[normalizedRole];
}

export function isHostelRole(
  role: string | null | undefined,
): role is TenantUserRole {
  return (
    role === 'owner' ||
    role === 'manager' ||
    role === 'staff'
  );
}