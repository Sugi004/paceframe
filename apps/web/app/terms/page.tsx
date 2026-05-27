import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Core usage terms for Paceframe account access, planning, recovery support, and AI guidance.'
};

const sections = [
  {
    title: 'Use of the product',
    body: 'Paceframe is intended to support planning, recovery, reminders, and reflection. You agree to use the service lawfully and not attempt to misuse the product, automate abusive traffic, or interfere with other users or infrastructure.'
  },
  {
    title: 'Accounts and access',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for activity that occurs under your account. If you believe your account has been compromised, you should reset access immediately.'
  },
  {
    title: 'AI guidance limits',
    body: 'AI outputs are generated to support productivity and recovery workflows, but they may be incomplete or incorrect. You remain responsible for decisions you make based on the product. Paceframe should not be treated as medical, psychiatric, legal, or financial advice.'
  },
  {
    title: 'Availability and changes',
    body: 'Because Paceframe is still evolving, features, models, integrations, and limits may change over time. We may modify or remove parts of the product as the platform matures toward production readiness.'
  },
  {
    title: 'Content and responsibility',
    body: 'You retain responsibility for the content you enter into the app. Do not upload information you do not have the right to use or information that would create unnecessary safety, privacy, or compliance risk.'
  },
  {
    title: 'Launch status',
    body: 'The current web shell is designed primarily for access, verification, and onboarding support. Mobile remains the core Paceframe product experience.'
  }
] as const;

export default function TermsPage() {
  return (
    <main className="page-shell auth-shell">
      <section className="hero-card auth-hero auth-hero-upgraded">
        <div className="hero-copy">
          <p className="eyebrow">PACEFRAME LEGAL</p>
          <h1>Terms of Use</h1>
          <p className="lede">
            These terms cover the current Paceframe experience across account access, onboarding, mobile planning, and AI-guided recovery workflows.
          </p>
          <div className="hero-actions">
            <span className="hero-pill">Last updated May 17, 2026</span>
            <span className="hero-pill">Current MVP terms</span>
          </div>
        </div>

        <div className="auth-panel auth-panel-upgraded">
          <div className="auth-panel-header">
            <p className="auth-panel-label">Quick links</p>
            <h2>Continue with context</h2>
            <p className="auth-message">Review the legal basics here, then head back to account access or read how Paceframe handles data.</p>
          </div>
          <div className="auth-inline-note">
            <Link className="action-button auth-submit" href="/">
              Back to account access
            </Link>
            <Link className="ghost-button" href="/privacy">
              Read privacy policy
            </Link>
          </div>
        </div>
      </section>

      <section className="grid two-up">
        {sections.map((section) => (
          <article key={section.title} className="panel warm">
            <p className="eyebrow">TERMS</p>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
