import { PaceframeLogo } from '../src/components/paceframe-logo';

const productNotes = [
  {
    title: 'Energy-aware planning',
    body: 'Paceframe helps people decide what deserves focus first by matching work to available energy.'
  },
  {
    title: 'Recovery-friendly rhythm',
    body: 'It mixes planning, recovery, reminders, and burnout-aware prompts into one calmer daily workflow.'
  },
  {
    title: 'Mobile-first experience',
    body: 'The main app lives on mobile, while web stays lightweight for product context, verification, and legal pages.'
  }
] as const;

export function WebHub() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <div className="brand-lockup">
            <PaceframeLogo size="lg" />
            <div>
              <p className="eyebrow">PACEFRAME WEB</p>
              <p className="brand-tagline">Product overview, verification, and support pages.</p>
            </div>
          </div>

          <h1>Paceframe helps people plan by energy and recover before overload.</h1>
          <p className="lede">
            Paceframe is a mobile-first planning and recovery system that keeps priorities clearer, reminders calmer, and daily work aligned with real bandwidth.
          </p>

          <div className="hero-actions">
            <span className="hero-pill">Energy-aware planning</span>
            <span className="hero-pill">Mobile-first workflow</span>
            <span className="hero-pill">Support pages</span>
          </div>

          <div className="landing-metric-grid">
            <div className="landing-metric-card">
              <span>What it does</span>
              <strong>Plans around energy</strong>
            </div>
            <div className="landing-metric-card">
              <span>Main app</span>
              <strong>Mobile planning + recovery</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel web-hub-panel">
        <p className="web-hub-label">Useful links</p>
        <div className="web-link-row">
          <a className="web-link-chip active" href="/">
            Paceframe web hub
          </a>
          <a className="web-link-chip" href="/reset">
            Reset password
          </a>
          <a className="web-link-chip" href="/privacy">
            Privacy
          </a>
          <a className="web-link-chip" href="/terms">
            Terms
          </a>
        </div>
      </section>

      <section className="panel web-hub-panel">
        <p className="web-hub-label">What Paceframe is</p>
        <div className="grid three-up">
          {productNotes.map((note) => (
            <div key={note.title} className="web-hub-note">
              <strong>{note.title}</strong>
              <p>{note.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel web-hub-panel">
        <p className="web-hub-label">How it fits together</p>
        <div className="grid two-up web-hub-split">
          <div className="web-hub-note">
            <strong>Mobile first</strong>
            <p>Use the mobile app for the real daily workflow: planning, signals, recovery, and reminders.</p>
          </div>
          <div className="web-hub-note">
            <strong>Web as support</strong>
            <p>Use the web app for product context, email verification, password recovery, and legal pages.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
