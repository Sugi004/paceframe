import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Paceframe collects, uses, and protects account and planning data.'
};

const sections = [
  {
    title: 'What Paceframe collects',
    body: 'Paceframe collects the information needed to run account access and the product itself. This can include your email address, authentication identifiers, planning state, check-ins, routines, and reminder preferences.'
  },
  {
    title: 'How the data is used',
    body: 'We use data to authenticate you, sync your account state, improve reliability, and support core product features such as planning, recovery guidance, and reminders.'
  },
  {
    title: 'Third-party services',
    body: 'Paceframe currently relies on Firebase Authentication for account access and Supabase for database and sync infrastructure. Those services process the minimum information needed to perform their part of the product.'
  },
  {
    title: 'Health boundaries',
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

        <div className="panel web-hub-panel">
          <p className="web-hub-label">Quick links</p>
          <h2>Review and return</h2>
          <p className="web-hub-note-copy">Use the web shell for product and legal review, then continue your planning and recovery flow in the mobile app.</p>
          <div className="web-link-row">
            <Link className="web-link-chip active" href="/">
              Back to overview
            </Link>
            <Link className="web-link-chip" href="/terms">
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
