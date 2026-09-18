'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import {
  ArrowLeft,
  BedDouble,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  UserRound,
  ShieldCheck,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

type LoginResponse = {
  success?: boolean;
  message?: string;
  token?: string;

  data?: {
    token?: string;
    student?: {
      id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
    };
  };

  student?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
};

export default function StudentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tenantSlug = searchParams.get('tenant')?.trim() || '';

//   const [studentIdOrMobile, setStudentIdOrMobile] = useState('');
const [identifier, setIdentifier] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');

    if (!tenantSlug) {
      setError(
        'Hostel information is missing. Please open Student Login from your hostel website.',
      );
      return;
    }

    if (!identifier.trim()) {
  setError(
    'Please enter your Student ID or registered mobile number.',
  );
  return;
}

    // if (!studentIdOrMobile.trim()) {
    //   setError(
    //     'Please enter your Student ID or registered mobile number.',
    //   );
    //   return;
    // }

    if (!passkey) {
      setError('Please enter your passkey.');
      return;
    }

    setLoading(true);

    try {
      /*
       * Student authentication endpoint.
       *
       * Expected backend endpoint:
       * POST /hostel/student/login
       *
       * Request:
       * {
       *   tenantSlug,
       *   studentIdOrMobile,
       *   passkey
       * }
       */

      const response = await fetch(
        `${API_BASE_URL}/api/hostel/student/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            tenantSlug,
            // studentIdOrMobile: studentIdOrMobile.trim(),
             identifier: identifier.trim(),
            passkey,
          }),
        },
      );

      const result = (await response
        .json()
        .catch(() => null)) as LoginResponse | null;

      if (!response.ok) {
        throw new Error(
          result?.message ||
            'Invalid Student ID, mobile number or passkey. Please try again.',
        );
      }

      const token = result?.token || result?.data?.token;

      if (!token) {
        throw new Error(
          'Student login succeeded, but no authentication token was returned by the server.',
        );
      }

      /*
       * Student sessions are kept in sessionStorage so one student's
       * login does not leak between browser tabs.
       */
      sessionStorage.setItem('student_token', token);

      const student =
        result?.student || result?.data?.student;

      if (student) {
        sessionStorage.setItem(
          'student_account',
          JSON.stringify(student),
        );
      }

      router.replace(
        `/student/my-stay?tenant=${encodeURIComponent(tenantSlug)}`,
      );
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Unable to sign in. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFAF7]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* ============================================================
            LEFT / HOSTEL VISUAL
        ============================================================ */}
        <section className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[#15563A]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.15),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(196,139,39,0.24),transparent_32%)]" />
          </div>

          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5" />

          <div className="absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-[#C18B27]/15" />

          <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#15563A] shadow-lg">
                  <BedDouble size={25} />
                </div>

                <div>
                  <p className="text-lg font-black tracking-tight text-white">
                    Student Accommodation
                  </p>

                  <p className="text-xs text-white/65">
                    Live • Learn • Grow
                  </p>
                </div>
              </div>

              <div className="mt-24 max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F3D99F]">
                  Welcome Back
                </p>

                <h1 className="mt-4 font-serif text-5xl font-bold leading-[1.02] tracking-[-0.035em] text-white xl:text-6xl">
                  Your stay,
                  <br />
                  your home.
                </h1>

                <p className="mt-6 max-w-lg text-base leading-7 text-white/75">
                  Sign in to manage your hostel stay, payments,
                  receipts and complaints from one secure student
                  account.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-white/70">
              <ShieldCheck
                size={18}
                className="text-[#9ACB5A]"
              />
              Secure student access
            </div>
          </div>
        </section>

        {/* ============================================================
            LOGIN PANEL
        ============================================================ */}
        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[460px]">
            <div className="mb-7 flex items-center justify-between">
              <Link
                href={
                  tenantSlug
                    ? `/?tenant=${encodeURIComponent(tenantSlug)}`
                    : '/'
                }
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#536579] transition hover:text-[#1F6B48]"
              >
                <ArrowLeft size={16} />
                Back to hostel
              </Link>

              <span className="rounded-full bg-[#E8F3EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1F6B48]">
                Student Portal
              </span>
            </div>

            <div className="rounded-[28px] border border-[#E7E2D8] bg-white p-6 shadow-[0_20px_70px_rgba(16,32,51,0.08)] sm:p-9">
              {/* Mobile brand */}
              <div className="mb-8 lg:hidden">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#15563A] text-white">
                  <BedDouble size={24} />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B27A17]">
                  Welcome Back
                </p>

                <h2 className="mt-2 font-serif text-4xl font-bold tracking-[-0.025em] text-[#102033]">
                  Student Login
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#536579]">
                  Sign in to access your hostel account.
                </p>

                {tenantSlug ? (
                  <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-[#F7F3E9] px-3 py-1.5 text-[11px] font-semibold text-[#7B5A1B]">
                    <BedDouble size={13} />

                    <span className="truncate">
                      {tenantSlug}
                    </span>
                  </div>
                ) : null}
              </div>

              <form onSubmit={login} className="mt-8 space-y-5">
                {/* ====================================================
                    STUDENT ID / REGISTERED MOBILE
                ==================================================== */}
                <div>
                  <label
                    htmlFor="student-id-or-mobile"
                    className="mb-2 block text-xs font-bold text-[#102033]"
                  >
                    Student ID / Registered Mobile Number
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A8794]"
                    />

                    <input
                      id="student-id-or-mobile"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      inputMode="text"
                      value={identifier}
onChange={(event) =>
  setIdentifier(event.target.value)
}
                    //   value={studentIdOrMobile}
                    //   onChange={(event) =>
                    //     setStudentIdOrMobile(
                    //       event.target.value,
                    //     )
                    //   }
                      placeholder="Enter Student ID or registered mobile"
                      className="h-12 w-full rounded-xl border border-[#DCE2E5] bg-[#FCFCFB] pl-11 pr-4 text-sm text-[#102033] outline-none transition placeholder:text-[#A0A9B2] focus:border-[#1F6B48] focus:ring-4 focus:ring-[#1F6B48]/10"
                    />
                  </div>
                </div>

                {/* ====================================================
                    PASSKEY
                ==================================================== */}
                <div>
                  <label
                    htmlFor="student-passkey"
                    className="mb-2 block text-xs font-bold text-[#102033]"
                  >
                    Passkey
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A8794]"
                    />

                    <input
                      id="student-passkey"
                      name="passkey"
                      type={showPasskey ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={passkey}
                      onChange={(event) =>
                        setPasskey(event.target.value)
                      }
                      placeholder="Enter your passkey"
                      className="h-12 w-full rounded-xl border border-[#DCE2E5] bg-[#FCFCFB] pl-11 pr-12 text-sm text-[#102033] outline-none transition placeholder:text-[#A0A9B2] focus:border-[#1F6B48] focus:ring-4 focus:ring-[#1F6B48]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPasskey(
                          (current) => !current,
                        )
                      }
                      aria-label={
                        showPasskey
                          ? 'Hide passkey'
                          : 'Show passkey'
                      }
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#7A8794] transition hover:bg-[#E8F3EC] hover:text-[#1F6B48]"
                    >
                      {showPasskey ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* ====================================================
                    ERROR
                ==================================================== */}
                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-[#F1D1CE] bg-[#FFF5F3] px-4 py-3 text-xs font-medium leading-5 text-[#A33A32]"
                  >
                    {error}
                  </div>
                ) : null}

                {/* ====================================================
                    SIGN IN BUTTON
                ==================================================== */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#15563A] px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(21,86,58,0.20)] transition hover:bg-[#1F6B48] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />

                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* ========================================================
                  FOOTER MESSAGE
              ======================================================== */}
              <div className="mt-7 border-t border-[#E7E2D8] pt-6 text-center">
                <p className="text-xs text-[#536579]">
                  Don&apos;t have a student account?
                </p>

                <p className="mt-1 text-xs font-semibold text-[#1F6B48]">
                  Contact your hostel
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-[10px] leading-5 text-[#8A8F98]">
              Your student account is connected to this hostel
              only.
              <br />
              Keep your login details private.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}