'use client';

import { useEffect, useState } from 'react';
import { BedDouble, LogOut } from 'lucide-react';
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

  useEffect(() => {
    const token = sessionStorage.getItem('student_token');
    const account = sessionStorage.getItem('student_account');

    if (!token) {
      router.replace(
        `/student/login?tenant=${encodeURIComponent(tenantSlug)}`,
      );
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

  const logout = () => {
    sessionStorage.removeItem('student_token');
    sessionStorage.removeItem('student_account');

    router.replace(
      `/student/login?tenant=${encodeURIComponent(tenantSlug)}`,
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBFAF7]">
        <p className="text-sm text-[#536579]">
          Loading your stay...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFAF7]">
      <header className="border-b border-[#E7E2D8] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15563A] text-white">
              <BedDouble size={21} />
            </div>

            <div>
              <p className="text-sm font-black text-[#102033]">
                Student Portal
              </p>

              <p className="text-[11px] text-[#7A8794]">
                {tenantSlug}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-[#DCE2E5] bg-white px-3 py-2 text-xs font-bold text-[#536579] transition hover:bg-[#F7F3E9]"
          >
            <LogOut size={15} />
            Logout
          </button>
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
          <h2 className="text-lg font-bold text-[#102033]">
            Student Details
          </h2>

          {student ? (
            <div className="mt-5 space-y-3 text-sm">
              <div>
                <p className="text-xs text-[#7A8794]">Name</p>
                <p className="font-semibold text-[#102033]">
                  {student.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#7A8794]">Phone</p>
                <p className="font-semibold text-[#102033]">
                  {student.phone || 'Not available'}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#7A8794]">Email</p>
                <p className="font-semibold text-[#102033]">
                  {student.email || 'Not available'}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#536579]">
              Student account information is not available.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}