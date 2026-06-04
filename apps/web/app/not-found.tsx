import { PaceframeLogo } from '../src/components/paceframe-logo';

export default function NotFound() {
  return (
    <main className="page-shell narrow">
      <section className="hero-card auth-hero auth-hero-upgraded">
        <div className="hero-copy">
          <div className="brand-lockup">
            <PaceframeLogo size="lg" />
            <div>
              <p className="eyebrow">PACEFRAME WEB</p>
              <p className="brand-tagline">This page is not available.</p>
            </div>
          </div>

          <h1>We could not find that page.</h1>
          <p className="lede">
            The Paceframe web experience stays focused on product information, verification, password recovery, privacy, and terms.
          </p>

          <div className="hero-actions">
            <a className="mode-chip active" href="/">
              Return home
            </a>
            <a className="mode-chip" href="/privacy">
              Privacy
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
