'use client';

import PageErrorState from '@/components/page-error-state';

type Props = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function DashboardError({ error, reset }: Props) {
  return (
    <div style={{ padding: 16 }}>
      <PageErrorState
        title="Dashboard page failed to render"
        message={error.message || 'Please try again.'}
        retryLabel="Retry page"
        onRetry={reset}
      />
    </div>
  );
}