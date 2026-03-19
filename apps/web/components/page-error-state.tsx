'use client';

type Props = Readonly<{
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}>;

export default function PageErrorState({
  title = 'Unable to load this page',
  message = 'Please try again. The server may still be waking up.',
  retryLabel = 'Retry',
  onRetry,
}: Props) {
  return (
    <div
      style={{
        border: '1px solid #fecaca',
        background: '#fef2f2',
        borderRadius: 14,
        padding: 20,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: '#991b1b' }}>{title}</div>
      <p style={{ margin: 0, color: '#b91c1c', fontSize: 14, lineHeight: 1.5 }}>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          style={{
            justifySelf: 'start',
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            background: '#dc2626',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}