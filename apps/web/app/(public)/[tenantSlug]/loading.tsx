export default function TenantPageLoading() {
  return (
    <div className="bg-stone-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="h-64 animate-pulse bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 sm:h-80" />
          <div className="grid gap-4 px-6 py-6 sm:px-8">
            <div className="h-10 w-2/3 animate-pulse rounded-full bg-stone-200" />
            <div className="h-4 w-full animate-pulse rounded-full bg-stone-200" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-stone-200" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-stone-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-[24px] border border-stone-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}