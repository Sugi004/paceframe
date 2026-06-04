'use client';

import { useEffect, useState } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { PaceframeLogo } from '../../src/components/paceframe-logo';
import { auth, hasFirebaseConfig } from '../../src/lib/firebase';

type Status = 'idle' | 'working' | 'success' | 'error';

export default function ResetPasswordPage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('Use the password reset email from your inbox to continue.');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setCode(new URLSearchParams(window.location.search).get('oobCode') ?? '');
  }, []);

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setStatus('error');
      setMessage('Web password reset is not configured yet.');
      return;
    }

    if (!code) {
      setStatus('idle');
      setMessage('Open the password reset email link from your inbox. After you update the password, return to the app and log in again.');
      return;
    }

    const actionCode = code;
    const currentAuth = auth;
    if (!currentAuth) {
      setStatus('error');
      setMessage('Web password reset is not configured yet.');
      return;
    }

    let cancelled = false;

    async function inspect() {
      try {
        setStatus('working');
        const verifiedEmail = await verifyPasswordResetCode(currentAuth, actionCode);

        if (cancelled) {
          return;
        }

        setEmail(verifiedEmail);
        setStatus('idle');
        setMessage('Choose a new password to finish resetting this account.');
      } catch {
        if (cancelled) {
          return;
        }

        setStatus('error');
        setMessage('We could not open that reset link. Use the original email again or request a fresh reset from the app.');
      }
    }

    void inspect();

    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auth || !code) {
      setStatus('error');
      setMessage('Open the reset email link again from your inbox.');
      return;
    }

    const resetCode = code;

    if (password.length < 6) {
      setStatus('error');
      setMessage('Use a password with at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Both password fields need to match.');
      return;
    }

    try {
      setStatus('working');
      const currentAuth = auth;
      if (!currentAuth) {
        setStatus('error');
        setMessage('Web password reset is not configured yet.');
        return;
      }

      await confirmPasswordReset(currentAuth, resetCode, password);
      setStatus('success');
      setMessage('Password updated. Open the app to log in.');
    } catch {
      setStatus('error');
      setMessage('We could not update the password right now. Open the original link again or request a fresh reset in the app.');
    }
  }

  return (
    <main className="page-shell auth-shell">
      <section className="hero-card auth-hero auth-hero-upgraded">
        <div className="hero-copy">
          <div className="brand-lockup">
            <PaceframeLogo size="lg" />
            <div>
              <p className="eyebrow">PACEFRAME WEB</p>
              <p className="brand-tagline">Reset your password, then open the app.</p>
            </div>
          </div>

          <h1>{status === 'success' ? 'Password reset complete' : 'Reset your password'}</h1>
          <p className="lede">
            This page finishes password recovery for Paceframe. When it is done, return to the mobile app and log in again.
          </p>

          <div className="hero-actions">
            <span className="hero-pill">Recovery page</span>
            <span className="hero-pill">Mobile handoff</span>
            <span className="hero-pill">Public web surface</span>
          </div>

          <div className="landing-metric-grid">
            <div className="landing-metric-card">
              <span>Status</span>
              <strong>{status === 'success' ? 'Updated' : status === 'working' ? 'Checking...' : 'Ready'}</strong>
            </div>
            <div className="landing-metric-card">
              <span>Next step</span>
              <strong>Open the app to log in</strong>
            </div>
          </div>
        </div>

        <aside className="signal-card">
          <div className="signal-header">
            <span>Password reset</span>
            <strong>{status === 'success' ? 'Complete' : 'In progress'}</strong>
          </div>

          <p>{message}</p>

          <div className="signal-meter-list">
            <div className="signal-meter-item">
              <span>Email</span>
              <strong>{email || 'unknown'}</strong>
            </div>
            <div className="signal-meter-item">
              <span>Page purpose</span>
              <strong>Recovery only</strong>
            </div>
            <div className="signal-meter-item">
              <span>Next step</span>
              <strong>Open the app</strong>
            </div>
          </div>
        </aside>
      </section>

      {status !== 'success' ? (
        <section className="panel auth-panel auth-panel-upgraded reset-form-panel">
          <p className="auth-panel-label">Choose a new password</p>
          <form onSubmit={handleSubmit} className="auth-form auth-form-upgraded reset-form">
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
            />

            <button className="action-button auth-submit" type="submit" disabled={status === 'working'}>
              {status === 'working' ? 'Working...' : 'Save new password'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="panel web-hub-panel">
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
    </main>
  );
}
