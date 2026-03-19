'use client';

type Props = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function TenantPageError({ error, reset }: Props) {
  return (
    <div className="bg-stone-50">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full rounded-[28px] border border-red-200 bg-white p-8 shadow-[0_24px_60px_rgba(220,38,38,0.08)]">
          <div className="mb-3 inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-700">
            Temporary issue
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-stone-900">This tenant page is not available right now</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {error.message || 'The upstream API may still be waking up. Please retry in a few seconds.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Retry page
            </button>
            <button
              type="button"
              onClick={() => globalThis.location.reload()}
              className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
            >
              Hard reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}