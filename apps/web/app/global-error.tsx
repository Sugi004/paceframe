'use client';

export default function GlobalError() {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#081124', color: '#f7fbff', fontFamily: 'Georgia, serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
          <section
            style={{
              width: '100%',
              maxWidth: '640px',
              borderRadius: '28px',
              background: '#102347',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.28)'
            }}
          >
            <p style={{ color: '#8ed9ff', fontWeight: 800, letterSpacing: '0.18em', margin: '0 0 12px' }}>PACEFRAME SYSTEM</p>
            <h1 style={{ fontSize: '2.4rem', lineHeight: 1.05, margin: '0 0 14px' }}>The app needs a clean restart.</h1>
            <p style={{ color: '#cfe1ff', fontSize: '1.05rem', lineHeight: 1.7, margin: 0 }}>
              Paceframe hit a global rendering issue. Refresh the route and, if needed, restart the local web server.
            </p>
            <p style={{ margin: '22px 0 0' }}>
              <a
                href="/"
                style={{
                  display: 'inline-block',
                  borderRadius: '999px',
                  background: '#ffd36e',
                  color: '#0f1730',
                  fontWeight: 900,
                  textDecoration: 'none',
                  padding: '12px 18px'
                }}
              >
                Return home
              </a>
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}
