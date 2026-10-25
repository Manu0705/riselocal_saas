'use client';

import { useEffect, useState } from 'react';
import {
  BedDouble,
  LogOut,
  LockKeyhole,
  CreditCard,
  ReceiptText,
  MessageSquareWarning,
} from 'lucide-react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type StudentAccount = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export default function MyStayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tenantSlug = searchParams.get('tenant')?.trim() || '';

  const [student, setStudent] = useState<StudentAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const [showChangePasskey, setShowChangePasskey] = useState(false);
  const [currentPasskey, setCurrentPasskey] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState('');
  const [passkeyError, setPasskeyError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('student_token');
    const account = sessionStorage.getItem('student_account');

    if (!token) {
      router.replace(`/student/login?tenant=${encodeURIComponent(tenantSlug)}`);
      return;
    }

    if (account) {
      try {
        setStudent(JSON.parse(account));
      } catch {
        sessionStorage.removeItem('student_account');
      }
    }

    setLoading(false);
  }, [router, tenantSlug]);

  const changePasskey = async () => {
    setPasskeyMessage('');
    setPasskeyError('');

    if (!currentPasskey) {
      setPasskeyError('Please enter your current passkey.');
      return;
    }

    if (!newPasskey) {
      setPasskeyError('Please enter a new passkey.');
      return;
    }

    if (!confirmPasskey) {
      setPasskeyError('Please confirm your new passkey.');
      return;
    }

    if (newPasskey !== confirmPasskey) {
      setPasskeyError('New passkey and confirm passkey do not match.');
      return;
    }

    if (newPasskey.length < 6) {
      setPasskeyError('New passkey must be at least 6 characters.');
      return;
    }

    if (currentPasskey === newPasskey) {
      setPasskeyError('New passkey must be different from your current passkey.');
      return;
    }

    const token = sessionStorage.getItem('student_token');

    if (!token) {
      router.replace(`/student/login?tenant=${encodeURIComponent(tenantSlug)}`);
      return;
    }

    setPasskeyLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${API_BASE_URL}/api/hostel/student/change-passkey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPasskey,
          newPasskey,
          confirmPasskey,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || 'Unable to change passkey. Please try again.');
      }

      setPasskeyMessage(result?.message || 'Passkey changed successfully.');

      setCurrentPasskey('');
      setNewPasskey('');
      setConfirmPasskey('');
    } catch (error) {
      setPasskeyError(
        error instanceof Error ? error.message : 'Unable to change passkey. Please try again.',
      );
    } finally {
      setPasskeyLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('student_token');
    sessionStorage.removeItem('student_account');

    router.replace(`/student/login?tenant=${encodeURIComponent(tenantSlug)}`);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBFAF7]">
        <p className="text-sm text-[#536579]">Loading your stay...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFAF7]">
      <header className="border-b border-[#E7E2D8] bg-white">
        {/* <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8"> */}
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15563A] text-white">
              <BedDouble size={21} />
            </div>

            <div>
              <p className="text-sm font-black text-[#102033]">Student Portal</p>

              <p className="text-[11px] text-[#7A8794]">{tenantSlug}</p>
            </div>
          </div>

          {/* <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-[#DCE2E5] bg-white px-3 py-2 text-xs font-bold text-[#536579] transition hover:bg-[#F7F3E9]"
          >
            <LogOut size={15} />
            Logout
          </button> */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
  {/* Student navigation menu */}
  <nav
    aria-label="Student navigation"
    className="flex items-center gap-2 overflow-x-auto sm:gap-3"
  >
    <Link
      href={`/student/payments?tenant=${encodeURIComponent(tenantSlug)}`}
      className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#536579] transition hover:bg-[#F0F5F1] hover:text-[#15563A] sm:text-sm"
    >
      <CreditCard size={16} />
      Payments
    </Link>

    <Link
      href={`/student/receipts?tenant=${encodeURIComponent(tenantSlug)}`}
      className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#536579] transition hover:bg-[#F0F5F1] hover:text-[#15563A] sm:text-sm"
    >
      <ReceiptText size={16} />
      Receipts
    </Link>

    <Link
      href={`/student/complaints?tenant=${encodeURIComponent(tenantSlug)}`}
      className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#536579] transition hover:bg-[#F0F5F1] hover:text-[#15563A] sm:text-sm"
    >
      <MessageSquareWarning size={16} />
      Complaints
    </Link>
  </nav>

  {/* Logout button */}
  <button
    type="button"
    onClick={logout}
    className="flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[#DCE2E5] bg-white px-3 py-2 text-xs font-bold text-[#536579] transition hover:bg-[#F7F3E9] lg:self-auto"
  >
    <LogOut size={15} />
    Logout
  </button>
</div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B27A17]">
            My Account
          </p>

          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-[#102033]">
            My Stay
          </h1>

          <p className="mt-2 text-sm text-[#536579]">
            View your hostel stay information and account details.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E7E2D8] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#102033]">Student Details</h2>

          {student ? (
            <div className="mt-5 space-y-3 text-sm">
              <div>
                <p className="text-xs text-[#7A8794]">Name</p>
                <p className="font-semibold text-[#102033]">{student.name}</p>
              </div>

              <div>
                <p className="text-xs text-[#7A8794]">Phone</p>
                <p className="font-semibold text-[#102033]">{student.phone || 'Not available'}</p>
              </div>

              <div>
                <p className="text-xs text-[#7A8794]">Email</p>
                <p className="font-semibold text-[#102033]">{student.email || 'Not available'}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#536579]">
              Student account information is not available.
            </p>
          )}
        </div>

        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          {/* ============================================================
            CHANGE PASSKEY
        ============================================================ */}
          <div className="mt-6 rounded-2xl border border-[#E7E2D8] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <LockKeyhole size={19} className="text-[#15563A]" />

                  <h2 className="text-lg font-bold text-[#102033]">Change Passkey</h2>
                </div>

                <p className="mt-2 text-sm text-[#536579]">Change your student account passkey.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowChangePasskey((current) => !current);
                  setPasskeyError('');
                  setPasskeyMessage('');
                }}
                className="rounded-xl bg-[#15563A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1F6B48]"
              >
                {showChangePasskey ? 'Cancel' : 'Change Passkey'}
              </button>
            </div>

            {showChangePasskey ? (
              <div className="mt-6 border-t border-[#E7E2D8] pt-6">
                <div className="space-y-5">
                  {/* Current Passkey */}
                  <div>
                    <label
                      htmlFor="current-passkey"
                      className="mb-2 block text-xs font-bold text-[#102033]"
                    >
                      Current Passkey
                    </label>

                    <input
                      id="current-passkey"
                      type="password"
                      value={currentPasskey}
                      onChange={(event) => setCurrentPasskey(event.target.value)}
                      placeholder="Enter current passkey"
                      className="h-12 w-full rounded-xl border border-[#DCE2E5] bg-[#FCFCFB] px-4 text-sm text-[#102033] outline-none transition placeholder:text-[#A0A9B2] focus:border-[#1F6B48] focus:ring-4 focus:ring-[#1F6B48]/10"
                    />
                  </div>

                  {/* New Passkey */}
                  <div>
                    <label
                      htmlFor="new-passkey"
                      className="mb-2 block text-xs font-bold text-[#102033]"
                    >
                      New Passkey
                    </label>

                    <input
                      id="new-passkey"
                      type="password"
                      value={newPasskey}
                      onChange={(event) => setNewPasskey(event.target.value)}
                      placeholder="Enter new passkey"
                      className="h-12 w-full rounded-xl border border-[#DCE2E5] bg-[#FCFCFB] px-4 text-sm text-[#102033] outline-none transition placeholder:text-[#A0A9B2] focus:border-[#1F6B48] focus:ring-4 focus:ring-[#1F6B48]/10"
                    />
                  </div>

                  {/* Confirm New Passkey */}
                  <div>
                    <label
                      htmlFor="confirm-passkey"
                      className="mb-2 block text-xs font-bold text-[#102033]"
                    >
                      Confirm New Passkey
                    </label>

                    <input
                      id="confirm-passkey"
                      type="password"
                      value={confirmPasskey}
                      onChange={(event) => setConfirmPasskey(event.target.value)}
                      placeholder="Confirm new passkey"
                      className="h-12 w-full rounded-xl border border-[#DCE2E5] bg-[#FCFCFB] px-4 text-sm text-[#102033] outline-none transition placeholder:text-[#A0A9B2] focus:border-[#1F6B48] focus:ring-4 focus:ring-[#1F6B48]/10"
                    />
                  </div>

                  {/* Error */}
                  {passkeyError ? (
                    <div className="rounded-xl border border-[#F1D1CE] bg-[#FFF5F3] px-4 py-3 text-xs font-medium leading-5 text-[#A33A32]">
                      {passkeyError}
                    </div>
                  ) : null}

                  {/* Success */}
                  {passkeyMessage ? (
                    <div className="rounded-xl border border-[#CDE5D5] bg-[#F0F9F3] px-4 py-3 text-xs font-medium leading-5 text-[#15563A]">
                      {passkeyMessage}
                    </div>
                  ) : null}

                  {/* Change Passkey Button */}
                  <button
                    type="button"
                    onClick={changePasskey}
                    disabled={passkeyLoading}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-[#15563A] px-5 text-sm font-bold text-white transition hover:bg-[#1F6B48] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {passkeyLoading ? 'Changing Passkey...' : 'Change Passkey'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
