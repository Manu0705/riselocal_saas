'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  BedDouble,
  ChevronDown,
  CircleUserRound,
  CreditCard,
  FileText,
  LogOut,
  MessageSquareWarning,
  UserRound,
} from 'lucide-react';

type StudentAccount = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

type Props = {
  readonly tenantSlug: string;
  readonly className?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function StudentAccountMenu({
  tenantSlug,
  className = '',
}: Readonly<Props>) {
  const [student, setStudent] = useState<StudentAccount | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkStudentAuthentication() {
      try {
        const token =
          sessionStorage.getItem('student_token') ||
          localStorage.getItem('student_token');

        if (!token) {
          if (!cancelled) {
            setStudent(null);
            setChecked(true);
          }
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/hostel/student/me?tenantSlug=${encodeURIComponent(
            tenantSlug,
          )}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          },
        );

        if (!response.ok) {
          if (!cancelled) {
            setStudent(null);
            setChecked(true);
          }
          return;
        }

        const data = (await response.json()) as {
          student?: StudentAccount | null;
        };

        if (!cancelled) {
          setStudent(data.student ?? null);
          setChecked(true);
        }
      } catch {
        if (!cancelled) {
          setStudent(null);
          setChecked(true);
        }
      }
    }

    void checkStudentAuthentication();

    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () =>
      document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('student_token');
    localStorage.removeItem('student_token');
    setStudent(null);
    setOpen(false);
  };

  if (!checked) {
    return (
      <div
        className={`h-10 w-[105px] animate-pulse rounded-full bg-[#F3F0E9] ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (!student) {
    return (
      <Link
        href={`/student/login?tenant=${encodeURIComponent(tenantSlug)}`}
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-[#E7E2D8] bg-white px-4 py-2.5 text-xs font-bold text-[#102033] shadow-sm transition hover:-translate-y-0.5 hover:border-[#1F6B48] hover:text-[#1F6B48] ${className}`}
      >
        <CircleUserRound size={17} />
        <span>My Account</span>
      </Link>
    );
  }

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-full border border-[#DDE8E1] bg-white px-3 py-1.5 shadow-sm transition hover:border-[#1F6B48]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F3EC] text-[#1F6B48]">
          <UserRound size={17} />
        </span>

        <span className="hidden max-w-[110px] truncate text-left text-xs font-bold text-[#102033] sm:block">
          {student.name}
        </span>

        <ChevronDown
          size={15}
          className={`text-[#536579] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-[100] w-[250px] overflow-hidden rounded-2xl border border-[#E7E2D8] bg-white p-2 shadow-2xl"
        >
          <div className="border-b border-[#E7E2D8] px-3 py-3">
            <p className="truncate text-sm font-bold text-[#102033]">
              {student.name}
            </p>

            {student.email ? (
              <p className="mt-0.5 truncate text-[11px] text-[#536579]">
                {student.email}
              </p>
            ) : null}

            <span className="mt-2 inline-flex rounded-full bg-[#E8F3EC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1F6B48]">
              Student
            </span>
          </div>

          <div className="py-1">
            <AccountLink
              href={`/student/my-stay?tenant=${encodeURIComponent(tenantSlug)}`}
              icon={BedDouble}
              label="My Stay"
              onClick={() => setOpen(false)}
            />
            <AccountLink
              href={`/student/payments?tenant=${encodeURIComponent(tenantSlug)}`}
              icon={CreditCard}
              label="Payments"
              onClick={() => setOpen(false)}
            />
            <AccountLink
              href={`/student/receipts?tenant=${encodeURIComponent(tenantSlug)}`}
              icon={FileText}
              label="Receipts"
              onClick={() => setOpen(false)}
            />
            <AccountLink
              href={`/student/complaints?tenant=${encodeURIComponent(tenantSlug)}`}
              icon={MessageSquareWarning}
              label="Complaints"
              onClick={() => setOpen(false)}
            />
          </div>

          <div className="border-t border-[#E7E2D8] pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#A33A32] transition hover:bg-[#FFF3F1]"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AccountLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof BedDouble;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#102033] transition hover:bg-[#F5F8F5] hover:text-[#1F6B48]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F3EC] text-[#1F6B48]">
        <Icon size={16} />
      </span>
      {label}
    </Link>
  );
}
