'use client';

import { useEffect, useState } from 'react';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { PaceframeLogo } from '../../src/components/paceframe-logo';
import { auth, hasFirebaseConfig } from '../../src/lib/firebase';

type Status = 'idle' | 'working' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('Open the verification email from your inbox to finish setting up your Paceframe account.');
  const [email, setEmail] = useState('');

  useEffect(() => {
    setCode(new URLSearchParams(window.location.search).get('oobCode') ?? '');
  }, []);

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setStatus('error');
      setMessage('Web verification is not configured yet.');
      return;
    }

    if (!code) {
      setStatus('idle');
      setMessage('Open the verification email link from your inbox. Once it is verified, return to the app to log in.');
      return;
    }

    const actionCode = code;
    const currentAuth = auth;
    if (!currentAuth) {
      setStatus('error');
      setMessage('Web verification is not configured yet.');
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        setStatus('working');
        const inspected = await checkActionCode(currentAuth, actionCode);

        if (cancelled) {
          return;
        }

        setEmail(typeof inspected.data.email === 'string' ? inspected.data.email : '');
        await applyActionCode(currentAuth, actionCode);

        if (cancelled) {
          return;
        }

        setStatus('success');
        setMessage('Email verified. Open the app to log in.');
      } catch {
        if (cancelled) {
          return;
        }

        setStatus('error');
        setMessage('We could not verify that link. Open the original email again or request a fresh verification email in the app.');
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <main className="page-shell auth-shell">
      <section className="hero-card auth-hero auth-hero-upgraded">
        <div className="hero-copy">
          <div className="brand-lockup">
            <PaceframeLogo size="lg" />
            <div>
              <p className="eyebrow">PACEFRAME WEB</p>
              <p className="brand-tagline">Verify your email, then open the app.</p>
            </div>
          </div>

          <h1>{status === 'success' ? 'Verification complete' : 'Verify your email'}</h1>
          <p className="lede">
            This page finishes email verification for Paceframe. Once it is done, open the mobile app to log in and continue using the product.
          </p>

          <div className="hero-actions">
            <span className="hero-pill">Mobile-first workflow</span>
            <span className="hero-pill">Verification page</span>
            <span className="hero-pill">Public web surface</span>
          </div>

          <div className="landing-metric-grid">
            <div className="landing-metric-card">
              <span>Status</span>
              <strong>{status === 'success' ? 'Verified' : status === 'working' ? 'Checking...' : 'Ready'}</strong>
            </div>
            <div className="landing-metric-card">
              <span>Next step</span>
              <strong>Open the app to log in</strong>
            </div>
          </div>
        </div>

        <aside className="signal-card">
          <div className="signal-header">
            <span>Verification</span>
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
              <strong>Handoff only</strong>
            </div>
            <div className="signal-meter-item">
              <span>Next step</span>
              <strong>Open the app</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel auth-panel auth-panel-upgraded">
        <p className="auth-panel-label">What to do next</p>
        <div className="grid two-up">
          <div className="auth-inline-note">
            <strong>Open the app</strong>
            <p>After verification, return to Paceframe on your phone and log in with the same account.</p>
          </div>
          <div className="auth-inline-note">
            <strong>Need to retry?</strong>
            <p>If the link expired, use the mobile app to request a fresh verification email.</p>
          </div>
        </div>
      </section>

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
