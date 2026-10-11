import { hasHostelPermission, type HostelPermission } from './hostel-rbac';

export type HostelNavigationGroupId =
  | 'overview'
  | 'people'
  | 'hostel-operations'
  | 'finance'
  | 'communication'
  | 'reports'
  | 'administration';

export type HostelNavigationGroup = {
  id: HostelNavigationGroupId;
  label: string;
};

export const HOSTEL_NAVIGATION_GROUPS: readonly HostelNavigationGroup[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'people', label: 'People' },
  { id: 'hostel-operations', label: 'Hostel Operations' },
  { id: 'finance', label: 'Finance' },
  { id: 'communication', label: 'Communication' },
  { id: 'reports', label: 'Reports' },
  { id: 'administration', label: 'Administration' },
];

export type HostelNavItem = {
  label: string;
  href: string;
  permission: HostelPermission;
  group: HostelNavigationGroupId;
};

export const HOSTEL_NAVIGATION: readonly HostelNavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/hostel',
    permission: 'view_dashboard',
    group: 'overview',
  },
  {
    label: 'Admissions',
    href: '/dashboard/hostel/admissions',
    permission: 'manage_admissions',
    group: 'people',
  },
  {
    label: 'Students',
    href: '/dashboard/hostel/students',
    permission: 'view_students',
    group: 'people',
  },
  {
    label: 'Rooms',
    href: '/dashboard/hostel/rooms',
    permission: 'view_rooms',
    group: 'hostel-operations',
  },
  {
    label: 'Room Allocation',
    href: '/dashboard/hostel/rooms/allocate',
    permission: 'allocate_rooms',
    group: 'hostel-operations',
  },
  {
    label: 'Operations Workspace',
    href: '/dashboard/hostel/operations',
    permission: 'view_dashboard',
    group: 'hostel-operations',
  },
  {
    label: 'Fees & Billing',
    href: '/dashboard/hostel/fees',
    permission: 'manage_fees',
    group: 'finance',
  },
  {
    label: 'Payments',
    href: '/dashboard/hostel/payments',
    permission: 'collect_payments',
    group: 'finance',
  },
  {
    label: 'Receipts & OCR',
    href: '/dashboard/hostel/receipts',
    permission: 'manage_receipts',
    group: 'finance',
  },
  {
    label: 'Reconciliation',
    href: '/dashboard/hostel/reconciliation',
    permission: 'manage_reconciliation',
    group: 'finance',
  },
  {
    label: 'Student Ledger',
    href: '/dashboard/hostel/ledger',
    permission: 'view_ledger',
    group: 'finance',
  },
  {
    label: 'Check-in / Checkout',
    href: '/dashboard/hostel/checkin-checkout',
    permission: 'manage_checkin_checkout',
    group: 'hostel-operations',
  },
  {
    label: 'Deposits',
    href: '/dashboard/hostel/deposits',
    permission: 'manage_deposits',
    group: 'hostel-operations',
  },
  {
    label: 'Complaints',
    href: '/dashboard/hostel/complaints',
    permission: 'manage_complaints',
    group: 'communication',
  },
  {
    label: 'Announcements',
    href: '/dashboard/hostel/announcements',
    permission: 'manage_announcements',
    group: 'communication',
  },
  {
    label: 'Reports',
    href: '/dashboard/hostel/reports',
    permission: 'view_reports',
    group: 'reports',
  },
  {
    label: 'Staff & Roles',
    href: '/dashboard/hostel/staff',
    permission: 'manage_staff',
    group: 'people',
  },
  {
    label: 'Hostel Settings',
    href: '/dashboard/hostel/settings',
    permission: 'manage_settings',
    group: 'administration',
  },
  {
    label: 'Audit Logs',
    href: '/dashboard/hostel/audit-logs',
    permission: 'view_audit_logs',
    group: 'administration',
  },
];

export function getHostelNavigation(role: string | null | undefined): readonly HostelNavItem[] {
  return HOSTEL_NAVIGATION.filter((item) => hasHostelPermission(role, item.permission));
}
