import type { TenantUserRole } from '@saas/domain-core/auth.contract';

import {
  hasHostelPermission,
  type HostelPermission,
} from './hostel-rbac';

export type HostelNavItem = {
  label: string;
  href: string;
  permission: HostelPermission;
};

export const HOSTEL_NAVIGATION: readonly HostelNavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/hostel',
    permission: 'view_dashboard',
  },
  {
    label: 'Admissions',
    href: '/dashboard/hostel/admissions',
    permission: 'manage_admissions',
  },
  {
    label: 'Students',
    href: '/dashboard/hostel/students',
    permission: 'view_students',
  },
  {
    label: 'Rooms',
    href: '/dashboard/hostel/rooms',
    permission: 'view_rooms',
  },
  {
    label: 'Fees & Billing',
    href: '/dashboard/hostel/fees',
    permission: 'manage_fees',
  },
  {
    label: 'Payments',
    href: '/dashboard/hostel/payments',
    permission: 'collect_payments',
  },
  {
    label: 'Receipts & OCR',
    href: '/dashboard/hostel/receipts',
    permission: 'manage_receipts',
  },
  {
    label: 'Reconciliation',
    href: '/dashboard/hostel/reconciliation',
    permission: 'manage_reconciliation',
  },
  {
    label: 'Student Ledger',
    href: '/dashboard/hostel/ledger',
    permission: 'view_ledger',
  },
  {
    label: 'Check-in / Checkout',
    href: '/dashboard/hostel/checkin-checkout',
    permission: 'manage_checkin_checkout',
  },
  {
    label: 'Deposits',
    href: '/dashboard/hostel/deposits',
    permission: 'manage_deposits',
  },
  {
    label: 'Complaints',
    href: '/dashboard/hostel/complaints',
    permission: 'manage_complaints',
  },
  {
    label: 'Announcements',
    href: '/dashboard/hostel/announcements',
    permission: 'manage_announcements',
  },
  {
    label: 'Reports',
    href: '/dashboard/hostel/reports',
    permission: 'view_reports',
  },
  {
    label: 'Staff & Roles',
    href: '/dashboard/hostel/staff',
    permission: 'manage_staff',
  },
  {
    label: 'Settings',
    href: '/dashboard/hostel/settings',
    permission: 'manage_settings',
  },
  {
    label: 'Audit Logs',
    href: '/dashboard/hostel/audit-logs',
    permission: 'view_audit_logs',
  },
];

export function getHostelNavigation(
  role: string | null | undefined,
): readonly HostelNavItem[] {
  return HOSTEL_NAVIGATION.filter((item) =>
    hasHostelPermission(role, item.permission),
  );
}