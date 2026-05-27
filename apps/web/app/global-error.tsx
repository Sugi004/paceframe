'use client';

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#081124', fontFamily: 'Georgia, serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              borderRadius: '30px',
              background: '#102347',
              padding: '32px',
              color: '#f7fbff',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.28)'
            }}
          >
            <p style={{ color: '#8ed9ff', fontWeight: 800, letterSpacing: '0.18em', marginBottom: '12px' }}>PACEFRAME SYSTEM</p>
            <h1 style={{ fontSize: '2.7rem', lineHeight: 1.02, margin: '0 0 14px' }}>The app needs a clean restart.</h1>
            <p style={{ color: '#cfe1ff', fontSize: '1.08rem', lineHeight: 1.7, margin: 0 }}>
              Paceframe hit a global rendering issue. Try the route again and, if needed, restart the local web server.
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
      </body>
    </html>
  );
}
