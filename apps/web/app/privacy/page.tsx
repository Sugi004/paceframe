import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Paceframe collects, uses, and protects account and planning data.'
};

const sections = [
  {
    title: 'What Paceframe collects',
    body: 'Paceframe collects the information needed to run account access and the product itself. This can include your email address, authentication identifiers, planning state, check-ins, routines, reminder preferences, and AI prompts you intentionally send through the product.'
  },
  {
    title: 'How the data is used',
    body: 'We use data to authenticate you, sync your account state, generate recommendations, improve reliability, and support core product features such as planning, recovery guidance, reminders, and AI-assisted coaching.'
  },
  {
    title: 'Third-party services',
    body: 'Paceframe currently relies on Firebase Authentication for account access, Supabase for database and sync infrastructure, and model providers for AI responses. Those providers process the minimum information needed to perform their part of the service.'
  },
  {
    title: 'Health and AI boundaries',
    body: 'Paceframe is a self-management and reflection tool. It is not a medical device, does not provide therapy, and should not be used as a substitute for licensed mental health or medical care.'
  },
  {
    title: 'Retention and control',
    body: 'You should retain control over what you enter into Paceframe. Sensitive information should be shared thoughtfully. Production-ready delete/export flows are part of the roadmap and should be completed before broad public launch.'
  },
  {
    title: 'Security basics',
    body: 'We aim to protect data in transit and at rest, limit access to server-only credentials, and separate public client configuration from privileged service keys. Production deployments should also enable logging, incident review, and least-privilege access controls.'
  }
] as const;

export default function PrivacyPage() {
  return (
    <main className="page-shell auth-shell">
      <section className="hero-card auth-hero auth-hero-upgraded">
        <div className="hero-copy">
          <p className="eyebrow">PACEFRAME LEGAL</p>
          <h1>Privacy Policy</h1>
          <p className="lede">
            Paceframe is designed to help people plan around energy and recovery. This page explains, at a high level, how product and account data is handled in the current web shell and the broader Paceframe platform.
          </p>
          <div className="hero-actions">
            <span className="hero-pill">Last updated May 17, 2026</span>
            <span className="hero-pill">Applies to web and mobile</span>
          </div>
        </div>

        <div className="auth-panel auth-panel-upgraded">
          <div className="auth-panel-header">
            <p className="auth-panel-label">Quick links</p>
            <h2>Review and return</h2>
            <p className="auth-message">Use the web shell for access and legal review, then continue your planning and recovery flow in the mobile app.</p>
          </div>
          <div className="auth-inline-note">
            <Link className="action-button auth-submit" href="/">
              Back to account access
            </Link>
            <Link className="ghost-button" href="/terms">
              Read terms
            </Link>
          </div>
        </div>
      </section>

      <section className="grid two-up">
        {sections.map((section) => (
          <article key={section.title} className="panel">
            <p className="eyebrow">PRIVACY</p>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
