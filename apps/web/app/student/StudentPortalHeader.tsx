
'use client';

import Link from 'next/link';
import {
  BedDouble,
  CreditCard,
  ReceiptText,
  MessageSquareWarning,
  LogOut,
} from 'lucide-react';

type StudentPortalHeaderProps = {
  tenantSlug: string;
  onLogout: () => void;
};

export default function StudentPortalHeader({
  tenantSlug,
  onLogout,
}: StudentPortalHeaderProps) {
  const links = [
    {
      label: 'My Stay',
      href: `/student/my-stay?tenant=${encodeURIComponent(tenantSlug)}`,
      Icon: BedDouble,
    },
    {
      label: 'Payments',
      href: `/student/payments?tenant=${encodeURIComponent(tenantSlug)}`,
      Icon: CreditCard,
    },
    {
      label: 'Receipts',
      href: `/student/receipts?tenant=${encodeURIComponent(tenantSlug)}`,
      Icon: ReceiptText,
    },
    {
      label: 'Complaints',
      href: `/student/complaints?tenant=${encodeURIComponent(tenantSlug)}`,
      Icon: MessageSquareWarning,
    },
  ];

  return (
    <header className="border-b border-[#E7E2D8] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href={`/student/my-stay?tenant=${encodeURIComponent(tenantSlug)}`}
          className="flex items-center gap-4"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#15563A] text-white">
            <BedDouble size={28} />
          </span>

          <span>
            <span className="block text-lg font-bold text-[#102033]">
              Student Portal
            </span>
            <span className="block text-sm text-[#536579]">
              {tenantSlug}
            </span>
          </span>
        </Link>

        <nav
          aria-label="Student portal navigation"
          className="flex flex-wrap items-center gap-2 sm:gap-4"
        >
          {links.map(({ label, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#536579] transition hover:bg-[#F5F3EE] hover:text-[#15563A]"
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E7E2D8] px-4 py-3 text-sm font-semibold text-[#536579] transition hover:bg-[#F5F3EE]"
          >
            <LogOut size={20} />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
