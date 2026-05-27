'use client';

export default function Error({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#081124',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          borderRadius: '28px',
          background: '#102347',
          padding: '32px',
          color: '#f7fbff',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.28)'
        }}
      >
        <p style={{ color: '#8ed9ff', fontWeight: 800, letterSpacing: '0.18em', marginBottom: '12px' }}>PACEFRAME WEB</p>
        <h1 style={{ fontSize: '2.4rem', lineHeight: 1.05, margin: '0 0 14px' }}>That screen needs a reset.</h1>
        <p style={{ color: '#cfe1ff', fontSize: '1.05rem', lineHeight: 1.7, margin: 0 }}>
          Paceframe hit an unexpected issue while rendering this page. Your account and saved data are still safe.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '22px',
            border: 0,
            borderRadius: '999px',
            background: '#ffd36e',
            color: '#0f1730',
            fontWeight: 900,
            fontSize: '1rem',
            padding: '12px 18px',
            cursor: 'pointer'
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
