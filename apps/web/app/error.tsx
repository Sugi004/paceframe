'use client';

import { useEffect } from 'react';
import { PaceframeLogo } from '../src/components/paceframe-logo';

export default function WebError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[paceframe-web-error-boundary]', error);
  }, [error]);

  return (
    <main className="page-shell auth-shell">
      <section className="hero-card auth-hero auth-hero-upgraded">
        <div className="hero-copy">
          <div className="brand-lockup">
            <PaceframeLogo size="lg" />
            <div>
              <p className="eyebrow">PACEFRAME WEB</p>
              <p className="brand-tagline">Something interrupted the page.</p>
            </div>
          </div>

          <h1>We hit a rendering issue.</h1>
          <p className="lede">
            Paceframe can recover from this. Try the page again, or refresh the route if it was a transient web error.
          </p>

          <div className="hero-actions">
            <span className="hero-pill">Retry safe</span>
            <span className="hero-pill">Logged</span>
            <span className="hero-pill">Recoverable</span>
          </div>
        </div>

        <aside className="signal-card">
          <div className="signal-header">
            <span>Crash visibility</span>
            <strong>Captured</strong>
          </div>

          <p>
            The error was logged for local visibility. If this keeps happening, restart the dev server or inspect the route that triggered it.
          </p>

          <div className="signal-meter-list">
            <div className="signal-meter-item">
              <span>Digest</span>
              <strong>{error.digest || 'n/a'}</strong>
            </div>
            <div className="signal-meter-item">
              <span>Next step</span>
              <strong>Retry the page</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel auth-panel auth-panel-upgraded">
        <p className="auth-panel-label">Recovery</p>
        <div className="grid two-up">
          <div className="auth-inline-note">
            <strong>Try again</strong>
            <p>Use the button below to re-render this route after the issue is cleared.</p>
          </div>
          <div className="auth-inline-note">
            <strong>What was saved</strong>
            <p>Your local state remains protected. This page only handles the route error.</p>
          </div>
        </div>
        <button
          onClick={reset}
          type="button"
          style={{
            alignSelf: 'flex-start',
            border: 0,
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #0f1730, #173f6d)',
            color: '#fff',
            fontWeight: 900,
            fontSize: '1rem',
            padding: '14px 20px',
            boxShadow: '0 12px 30px rgba(15, 23, 48, 0.22)',
            cursor: 'pointer'
          }}
        >
          Try again
        </button>
      </section>
    </main>
  );
}
