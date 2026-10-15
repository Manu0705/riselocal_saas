'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  BedDouble,
  LogOut,
  MessageSquareWarning,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

type StudentComplaint = {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt?: string | null;
};

export default function ComplaintsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant')?.trim() || '';

  const [complaints, setComplaints] = useState<StudentComplaint[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('student_token');

    if (!token) {
      router.replace(
        `/student/login?tenant=${encodeURIComponent(tenantSlug)}`
      );
      return;
    }

    let cancelled = false;

    async function loadComplaints() {
      try {
        setLoading(true);
        setError('');

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

        // Replace this path with your actual complaints API endpoint.
        const response = await fetch(
          `${API_BASE_URL}/api/hostel/student/complaints`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Unable to load complaints.');
        }

        const result = await response.json();

        // Adapt this mapping to your actual API response.
        const items = Array.isArray(result)
          ? result
          : Array.isArray(result?.complaints)
            ? result.complaints
            : [];

        if (!cancelled) {
          setComplaints(items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load complaints.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadComplaints();

    return () => {
      cancelled = true;
    };
  }, [router, tenantSlug]);

  const logout = () => {
    sessionStorage.removeItem('student_token');
    sessionStorage.removeItem('student_account');
    router.replace(
      `/student/login?tenant=${encodeURIComponent(tenantSlug)}`
    );
  };

  const submitComplaint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();

    if (!cleanSubject || !cleanDescription) {
      setError('Please enter both the subject and complaint details.');
      return;
    }

    if (cleanSubject.length > 150 || cleanDescription.length > 5000) {
      setError(
        'Subject must be at most 150 characters and details at most 5000 characters.'
      );
      return;
    }

    const token = sessionStorage.getItem('student_token');

    if (!token) {
      router.replace(
        `/student/login?tenant=${encodeURIComponent(tenantSlug)}`
      );
      return;
    }

    try {
      setSubmitting(true);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

      // Replace this path and request fields with your actual API contract.
      const response = await fetch(
        `${API_BASE_URL}/api/hostel/student/complaints`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject: cleanSubject,
            description: cleanDescription,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || 'Unable to submit your complaint.'
        );
      }

      setMessage(
        result?.message || 'Your complaint was submitted successfully.'
      );
      setSubject('');
      setDescription('');

      // Refresh the list after successful submission.
      const listResponse = await fetch(
        `${API_BASE_URL}/api/hostel/student/complaints`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (listResponse.ok) {
        const listResult = await listResponse.json();

        const items = Array.isArray(listResult)
          ? listResult
          : Array.isArray(listResult?.complaints)
            ? listResult.complaints
            : [];

        setComplaints(items);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit your complaint.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBFAF7]">
        <p className="text-sm text-[#536579]">
          Loading your complaints...
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
            className="flex items-center gap-2 rounded-xl border border-[#DCE2E5] px-3 py-2 text-xs font-bold text-[#536579] hover:bg-[#F7F3E9]"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B27A17]">
          My Account
        </p>

        <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-[#102033]">
          Complaints
        </h1>

        <p className="mt-2 text-sm text-[#536579]">
          Submit a hostel-related complaint and track its status.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-[#F1D1CE] bg-[#FFF5F3] p-4 text-sm text-[#A33A32]"
          >
            {error}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-2 inline-flex items-center gap-1 font-bold underline"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-[#CDE5D5] bg-[#F0F9F3] p-4 text-sm text-[#15563A]"
          >
            {message}
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-[#E7E2D8] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <MessageSquareWarning
              size={22}
              className="text-[#15563A]"
            />
            <h2 className="text-lg font-bold text-[#102033]">
              Submit a Complaint
            </h2>
          </div>

          <form onSubmit={submitComplaint} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="complaint-subject"
                className="mb-2 block text-xs font-bold text-[#102033]"
              >
                Subject
              </label>
              <input
                id="complaint-subject"
                type="text"
                maxLength={150}
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="e.g. Room maintenance"
                className="h-12 w-full rounded-xl border border-[#DCE2E5] bg-[#FCFCFB] px-4 text-sm text-[#102033] outline-none focus:border-[#1F6B48] focus:ring-4 focus:ring-[#1F6B48]/10"
              />
            </div>

            <div>
              <label
                htmlFor="complaint-description"
                className="mb-2 block text-xs font-bold text-[#102033]"
              >
                Complaint Details
              </label>
              <textarea
                id="complaint-description"
                rows={5}
                maxLength={5000}
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe your issue..."
                className="w-full rounded-xl border border-[#DCE2E5] bg-[#FCFCFB] px-4 py-3 text-sm text-[#102033] outline-none focus:border-[#1F6B48] focus:ring-4 focus:ring-[#1F6B48]/10"
              />
              <p className="mt-1 text-right text-xs text-[#7A8794]">
                {description.length}/5000
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#15563A] px-5 text-sm font-bold text-white transition hover:bg-[#1F6B48] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-[#E7E2D8] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#102033]">
            Complaint History
          </h2>

          {complaints.length === 0 ? (
            <p className="mt-5 rounded-xl bg-[#FCFCFB] p-5 text-sm text-[#536579]">
              No complaints are available yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {complaints.map((complaint) => (
                <article
                  key={complaint.id}
                  className="rounded-xl border border-[#E7E2D8] p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="font-bold text-[#102033]">
                      {complaint.subject}
                    </h3>

                    <span className="w-fit rounded-full bg-[#F7F3E9] px-3 py-1 text-xs font-semibold text-[#8A641E]">
                      {complaint.status}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#536579]">
                    {complaint.description}
                  </p>

                  <p className="mt-3 text-xs text-[#7A8794]">
                    Submitted:{' '}
                    {complaint.createdAt
                      ? new Date(complaint.createdAt).toLocaleDateString(
                          'en-IN'
                        )
                      : 'Date not available'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}