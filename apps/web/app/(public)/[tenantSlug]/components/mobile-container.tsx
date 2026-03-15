import React from 'react';

export default function MobileContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#f6f6f6',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        paddingLeft: 'var(--app-edge)',
        paddingRight: 'var(--app-edge)',
      }}
    >
      <div
        style={{
          width: 'min(100%, var(--app-max-width))',
          background: '#fff',
          minHeight: '100vh',
          boxShadow: '0 0 20px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
}
