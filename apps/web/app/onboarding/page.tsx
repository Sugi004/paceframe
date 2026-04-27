export default function OnboardingPage() {
  return (
    <main className="page-shell narrow">
      <section className="panel onboarding onboarding-hero">
        <p className="eyebrow">GET STARTED</p>
        <h1>Set up access on web, then do the real onboarding in mobile.</h1>
        <div className="checklist">
          <div>
            <strong>Verify your account</strong>
            <p>Use the web sign-in flow so your email and account identity are ready for mobile.</p>
          </div>
          <div>
            <strong>Install the mobile app</strong>
            <p>Planning, reminders, recovery protocols, and AI coaching all happen there.</p>
          </div>
          <div>
            <strong>Complete your real onboarding</strong>
            <p>Tell the app about your focus, burnout patterns, routines, and care anchors from inside mobile.</p>
          </div>
          <div>
            <strong>Sync later if needed</strong>
            <p>The current product is mobile-first, with web reserved for access and verification.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
