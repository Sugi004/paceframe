'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { confirmPasswordReset, sendPasswordResetEmail, verifyPasswordResetCode } from 'firebase/auth';
import { PaceframeLogo } from '../../src/components/paceframe-logo';
import { auth } from '../../src/lib/firebase';

type ResetPhase = 'hydrating' | 'request' | 'request-sending' | 'request-sent' | 'verifying' | 'ready' | 'submitting' | 'updated' | 'error';

async function sendResetEmail(email: string) {
  if (!auth) {
    throw new Error('Web password reset is not configured yet. Add Firebase client credentials so this link can be sent.');
  }

  await sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/reset`
  });
}

export default function ResetPasswordPage() {
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<ResetPhase>('hydrating');
  const [message, setMessage] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isHydrating = phase === 'hydrating';
  const hasCode = code.length > 0;
  const isRequestMode = !hasCode;
  const isRequestSent = phase === 'request-sent';
  const isLinkReady = hasCode && phase === 'ready';
  const isLinkUpdating = hasCode && phase === 'submitting';
  const isLinkComplete = hasCode && phase === 'updated';
  const isVerifying = hasCode && phase === 'verifying';
  const hasCodeError = hasCode && phase === 'error';

  useEffect(() => {
    const nextCode = new URLSearchParams(window.location.search).get('oobCode') ?? '';
    setCode(nextCode);

    if (!nextCode) {
      setPhase('request');
      setMessage('Enter your email to request a reset link. We will send a secure web link that opens this page again with a verified code.');
      return;
    }

    if (!auth) {
      setPhase('error');
      setMessage('Web password reset is not configured yet. Add Firebase client credentials so this link can be verified.');
      return;
    }

    const currentAuth = auth;
    let cancelled = false;

    async function inspectResetLink() {
      try {
        setPhase('verifying');
        setMessage('Verifying your reset link...');
        const resolvedEmail = await verifyPasswordResetCode(currentAuth, nextCode);

        if (cancelled) {
          return;
        }

        setVerifiedEmail(resolvedEmail);
        setPhase('ready');
        setMessage(`Link verified for ${resolvedEmail}. Choose a new password to finish resetting this account.`);
      } catch {
        if (cancelled) {
          return;
        }

        setVerifiedEmail('');
        setPhase('error');
        setMessage('We could not open that reset link. Request a fresh password reset email and try again.');
      }
    }

    void inspectResetLink();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = requestEmail.trim();
    if (!email) {
      setPhase('error');
      setMessage('Enter your email address first.');
      return;
    }

    try {
      setPhase('request-sending');
      setMessage('Sending your reset email...');
      await sendResetEmail(email);
      setPhase('request-sent');
      setMessage(`Reset email sent to ${email}. Open the email, then return here with the link.`);
    } catch (error) {
      setPhase('request');
      setMessage(error instanceof Error ? error.message : 'We could not send the reset email right now.');
    }
  }

  async function handleFinalizeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasCode || !auth) {
      setPhase('error');
      setMessage('Open the reset link again from your inbox.');
      return;
    }

    if (password.length < 6) {
      setPhase('error');
      setMessage('Use a password with at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setPhase('error');
      setMessage('Both password fields need to match.');
      return;
    }

    try {
      setPhase('submitting');
      setMessage('Saving your new password...');
      const currentAuth = auth;
      await confirmPasswordReset(currentAuth, code, password);
      setPhase('updated');
      setMessage('Password updated. Open the app to log in again.');
    } catch {
      setPhase('error');
      setMessage('We could not update the password right now. Open the original link again or request a fresh reset email.');
    }
  }

  const heroTitle = isHydrating
    ? 'Preparing reset page'
    : isLinkComplete
    ? 'Password reset complete'
    : isVerifying
      ? 'Checking your reset link'
      : hasCodeError
        ? 'Reset link needs attention'
        : isLinkReady || isLinkUpdating
          ? 'Reset your password'
          : 'Request a password reset';

  const heroLede = isHydrating
    ? 'We are checking this page to see whether you need a password reset request or the verified password form.'
    : isLinkComplete
    ? 'Your password has been updated. Open the Paceframe mobile app to log in again.'
    : isVerifying
      ? 'We are checking the secure reset link from your inbox. Once it is verified, you can choose a new password here.'
      : hasCodeError
        ? 'That reset link could not be verified. Request a fresh password reset email and try again.'
        : isLinkReady || isLinkUpdating
          ? `The reset link is verified for ${verifiedEmail}. Choose a new password to finish.`
          : 'Enter the email tied to your Paceframe account and we will send a secure reset link.';

  const heroStatus = isHydrating
    ? 'Loading'
    : isLinkComplete
    ? 'Updated'
    : isVerifying
      ? 'Verifying'
      : isLinkReady
        ? 'Ready'
        : isRequestSent
          ? 'Email sent'
          : isLinkUpdating
            ? 'Saving...'
            : hasCodeError
              ? 'Needs retry'
              : 'Request email';

  const nextStep = isHydrating
    ? 'Checking URL'
    : isLinkComplete
    ? 'Open the app'
    : isLinkReady || isLinkUpdating
      ? 'Choose password'
      : isRequestSent
        ? 'Open the emailed link'
        : hasCodeError
          ? 'Request fresh email'
          : 'Request the reset email';

  return (
    <main className="page-shell auth-shell reset-page">
      <section className="hero-card auth-hero auth-hero-upgraded">
        <div className="hero-copy">
          <div className="brand-lockup">
            <PaceframeLogo size="lg" />
            <div>
              <p className="eyebrow">PACEFRAME WEB</p>
              <p className="brand-tagline">Password recovery, verified on the web.</p>
            </div>
          </div>

          <h1>{heroTitle}</h1>
          <p className="lede">{heroLede}</p>

          <div className="hero-actions">
            <span className="hero-pill">Email request</span>
            <span className="hero-pill">Verified link</span>
            <span className="hero-pill">Mobile handoff</span>
          </div>

          <div className="landing-metric-grid">
            <div className="landing-metric-card">
              <span>Status</span>
              <strong>{heroStatus}</strong>
            </div>
            <div className="landing-metric-card">
              <span>Next step</span>
              <strong>{nextStep}</strong>
            </div>
          </div>
        </div>

        <aside className="signal-card">
          <div className="signal-header">
            <span>Reset flow</span>
            <strong>{isLinkComplete ? 'Complete' : isVerifying ? 'Verifying' : isLinkReady ? 'Verified' : isRequestSent ? 'Email sent' : hasCodeError ? 'Retry needed' : 'In progress'}</strong>
          </div>

          <p>{message}</p>

          <div className="signal-meter-list">
            <div className="signal-meter-item">
              <span>Account email</span>
              <strong>{verifiedEmail || requestEmail || 'Waiting for email'}</strong>
            </div>
            <div className="signal-meter-item">
              <span>Page purpose</span>
              <strong>{isRequestMode ? 'Request link' : 'Finish reset'}</strong>
            </div>
            <div className="signal-meter-item">
              <span>Next step</span>
              <strong>{nextStep}</strong>
            </div>
          </div>
        </aside>
      </section>

      {isHydrating ? (
        <section className="panel auth-panel auth-panel-upgraded reset-form-panel reset-link-panel">
          <p className="auth-panel-label">Loading reset page</p>
          <div className="auth-inline-note">
            <p>We are checking the URL and deciding whether to show the request form or the verified password form.</p>
          </div>
        </section>
      ) : isLinkComplete ? (
        <section className="panel auth-panel auth-panel-upgraded reset-form-panel reset-final-panel">
          <p className="auth-panel-label">Password updated</p>
          <div className="auth-inline-note">
            <p>Open the Paceframe app and log in with the same account to continue planning there.</p>
          </div>
        </section>
      ) : isVerifying ? (
        <section className="panel auth-panel auth-panel-upgraded reset-form-panel reset-link-panel">
          <p className="auth-panel-label">Verifying link</p>
          <div className="auth-inline-note">
            <p>We are checking the secure link from your email. This page will unlock the password fields after Firebase confirms the code.</p>
          </div>
        </section>
      ) : isLinkReady || isLinkUpdating ? (
        <section className="panel auth-panel auth-panel-upgraded reset-form-panel reset-final-panel">
          <p className="auth-panel-label">Choose a new password</p>
          <div className="reset-email-note">
            <span>Verified account</span>
            <strong>{verifiedEmail}</strong>
          </div>
          <form onSubmit={handleFinalizeSubmit} className="auth-form auth-form-upgraded reset-form">
            <label className="auth-label" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />

            <label className="auth-label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              className="auth-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat the password"
              autoComplete="new-password"
            />

            <button className="action-button auth-submit" type="submit" disabled={phase === 'submitting'}>
              {phase === 'submitting' ? 'Saving...' : 'Save new password'}
            </button>
          </form>
        </section>
      ) : hasCodeError ? (
        <section className="panel web-hub-panel reset-links-panel">
          <p className="web-hub-label">Need a fresh link?</p>
          <p className="web-hub-note-copy">That reset link could not be verified. Start over to request a new email and try again.</p>
          <div className="web-link-row">
            <a className="web-link-chip active" href="/reset">
              Start over
            </a>
            <a className="web-link-chip" href="/">
              Paceframe web hub
            </a>
            <a className="web-link-chip" href="/privacy">
              Privacy
            </a>
            <a className="web-link-chip" href="/terms">
              Terms
            </a>
          </div>
        </section>
      ) : (
        <section className="panel auth-panel auth-panel-upgraded reset-form-panel reset-request-panel">
          <p className="auth-panel-label">Request reset email</p>
          <div className="auth-inline-note">
            <p>Enter the email tied to your Paceframe account. We will send a secure reset email through the web flow.</p>
          </div>
          <form onSubmit={handleRequestSubmit} className="auth-form auth-form-upgraded reset-form">
            <label className="auth-label" htmlFor="requestEmail">
              Account email
            </label>
            <input
              id="requestEmail"
              className="auth-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={requestEmail}
              onChange={(event) => setRequestEmail(event.target.value)}
              placeholder="name@example.com"
            />

            <button className="action-button auth-submit" type="submit" disabled={phase === 'request-sending'}>
              {phase === 'request-sending' ? 'Sending...' : 'Send reset email'}
            </button>
          </form>
          {isRequestSent ? (
            <div className="reset-email-note">
              <span>Email sent</span>
              <strong>{requestEmail.trim()}</strong>
              <p>Open the email, tap the link, and this page will switch to the password form.</p>
            </div>
          ) : null}
        </section>
      )}

      {!hasCodeError ? (
        <section className="panel web-hub-panel reset-links-panel">
          <p className="web-hub-label">Useful links</p>
          <div className="web-link-row">
            <a className="web-link-chip active" href="/">
              Paceframe web hub
            </a>
            <a className="web-link-chip" href="/privacy">
              Privacy
            </a>
            <a className="web-link-chip" href="/terms">
              Terms
            </a>
          </div>
        </section>
      ) : null}
    </main>
  );
}
