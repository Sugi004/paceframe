'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth';
import { PaceframeLogo } from '../src/components/paceframe-logo';
import { auth, hasFirebaseConfig } from '../src/lib/firebase';

const EMAIL_KEY = 'paceframe-auth-email';

type AuthMode = 'signin' | 'signup' | 'reset';

const modeCopy: Record<AuthMode, { title: string; subtitle: string; button: string }> = {
  signin: {
    title: 'Welcome back',
    subtitle: 'Sign in to continue using Paceframe across mobile and web account access.',
    button: 'Sign in'
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Start with a calm, energy-aware system for planning, recovery, and reminders.',
    button: 'Create account'
  },
  reset: {
    title: 'Reset your password',
    subtitle: 'We will send a password reset email so you can get back into Paceframe quickly.',
    button: 'Send reset email'
  }
};

const legalLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' }
] as const;

function formatAuthErrorMessage(error: unknown, mode: AuthMode) {
  if (!(error instanceof Error)) {
    return 'We could not complete that request right now.';
  }

  if (!('code' in error) || typeof error.code !== 'string') {
    return mode === 'reset'
      ? 'We could not send the reset email right now. Try again in a moment.'
      : 'We could not complete sign-in right now. Try again in a moment.';
  }

  switch (error.code) {
    case 'auth/operation-not-allowed':
      return mode === 'reset'
        ? 'Password reset is not enabled for this Firebase project yet. In Firebase Console, open Authentication -> Sign-in method and enable Email/Password first.'
        : 'Email/password sign-in is disabled in this Firebase project. In Firebase Console, open Authentication -> Sign-in method, enable Email/Password, and save.';
    case 'auth/email-already-in-use':
      return 'That email already has a Paceframe account. Switch to Sign in instead.';
    case 'auth/invalid-email':
      return 'That email address does not look valid.';
    case 'auth/weak-password':
      return 'Use a stronger password with at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'We could not find an account matching that email and password.';
    default:
      return mode === 'reset'
        ? 'We could not send the reset email right now. Try again in a moment.'
        : 'We could not complete sign-in right now. Try again in a moment.';
  }
}

export function AuthShell({ initialMode = 'signup' }: { initialMode?: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'working' | 'sent' | 'verified' | 'error'>('idle');
  const [message, setMessage] = useState('The real Paceframe experience lives in mobile. Use the web app for access, verification, and recovery.');
  const [user, setUser] = useState<User | null>(null);

  const authReady = Boolean(hasFirebaseConfig && auth);
  const currentMode = modeCopy[mode];

  useEffect(() => {
    setMode(initialMode);
    setStatus('idle');
    setMessage(modeCopy[initialMode].subtitle);
  }, [initialMode]);

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      router.replace('/onboarding');
    }
  }, [router, user]);

  useEffect(() => {
    async function completeEmailLinkSignIn() {
      if (!auth || typeof window === 'undefined' || !isSignInWithEmailLink(auth, window.location.href)) {
        return;
      }

      const storedEmail = window.localStorage.getItem(EMAIL_KEY) ?? '';
      if (!storedEmail) {
        setStatus('error');
        setMessage('Verification link opened, but the original email is missing on this browser. Start again from this page.');
        return;
      }

      try {
        setStatus('working');
        await signInWithEmailLink(auth, storedEmail, window.location.href);
        window.localStorage.removeItem(EMAIL_KEY);
        setStatus('verified');
        setMessage('Email verified. You can continue in the mobile app with the same Paceframe account.');
        router.replace('/onboarding');
      } catch (error) {
        setStatus('error');
        setMessage('We could not verify your email link right now. Start again from this page.');
      }
    }

    completeEmailLinkSignIn();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auth) {
      setStatus('error');
      setMessage('Firebase is not configured yet on the web app.');
      return;
    }

    if (!email.trim()) {
      setStatus('error');
      setMessage('Enter your email address first.');
      return;
    }

    if (mode !== 'reset' && password.length < 6) {
      setStatus('error');
      setMessage('Use a password with at least 6 characters.');
      return;
    }

    try {
      setStatus('working');

      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        setStatus('verified');
        setMessage('Account created. You can now use the same credentials in the mobile app.');
        router.push('/onboarding');
        return;
      }

      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setStatus('verified');
        setMessage('Signed in. Your account is ready to use in the mobile app too.');
        router.push('/onboarding');
        return;
      }

      await sendPasswordResetEmail(auth, email.trim());
      setStatus('sent');
      setMessage('Password reset email sent. Check your inbox and follow the instructions.');
    } catch (error) {
      setStatus('error');
      setMessage(formatAuthErrorMessage(error, mode));
    }
  }

  async function handleMagicLink() {
    if (!auth) {
      setStatus('error');
      setMessage('Firebase is not configured yet on the web app.');
      return;
    }

    if (!email.trim()) {
      setStatus('error');
      setMessage('Enter your email first to send a magic link.');
      return;
    }

    try {
      setStatus('working');
      await sendSignInLinkToEmail(auth, email.trim(), {
        url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        handleCodeInApp: true
      });
      window.localStorage.setItem(EMAIL_KEY, email.trim());
      setStatus('sent');
      setMessage('Magic link sent. Open it in this browser to finish signing in.');
    } catch (error) {
      setStatus('error');
      setMessage(formatAuthErrorMessage(error, 'signin'));
    }
  }

  async function handleSignOut() {
    if (!auth) {
      return;
    }

    await signOut(auth);
    router.replace('/');
    setStatus('idle');
    setMessage('Signed out. Paceframe still saves the real planning experience for mobile.');
  }

  return (
    <main className="page-shell auth-shell">
      <section className="hero-card auth-hero auth-hero-upgraded">
        <div className="hero-copy">
          <div className="brand-lockup">
            <PaceframeLogo size="lg" />
            <div>
              <p className="eyebrow">PACEFRAME</p>
              <p className="brand-tagline">Plan by energy. Recover before burnout.</p>
            </div>
          </div>

          <h1>Your personal pace, protected by design.</h1>
          <p className="lede">
            Paceframe helps ambitious people organize work, recovery, meals, movement, and reminders in one system that adapts to energy instead of only urgency.
          </p>

          <div className="hero-actions">
            <span className="hero-pill">Energy-aware planning</span>
            <span className="hero-pill">Burnout risk tracking</span>
            <span className="hero-pill">Product overview</span>
          </div>

          <div className="landing-metric-grid">
            <div className="landing-metric-card">
              <span>One product</span>
              <strong>planning + recovery</strong>
            </div>
            <div className="landing-metric-card">
              <span>Built for</span>
              <strong>founders, creators, operators</strong>
            </div>
          </div>
        </div>

        <div className="auth-panel auth-panel-upgraded">
          <div className="auth-panel-header">
            <p className="auth-panel-label">Account access</p>
            <h2>{user ? 'Account ready' : currentMode.title}</h2>
            <p className="auth-message">{user ? message : currentMode.subtitle}</p>
          </div>

          {!authReady ? (
            <div className="auth-placeholder">
              <strong>Firebase setup needed</strong>
              <p>Add your Firebase web config in `.env` to activate sign-in and verification.</p>
            </div>
          ) : null}

          {user ? (
            <div className="auth-user-card auth-user-card-upgraded">
              <div>
                <strong>{user.email ?? 'Signed in user'}</strong>
                <p>{user.emailVerified ? 'Email verified' : 'Email not yet verified'}</p>
              </div>
              <button className="action-button" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <>
              <div className="auth-mode-switch">
                {(['signup', 'signin', 'reset'] as AuthMode[]).map((nextMode) => (
                  <a
                    key={nextMode}
                    className={nextMode === mode ? 'mode-chip active' : 'mode-chip'}
                    href={nextMode === 'signup' ? '/' : `/?mode=${nextMode}`}
                  >
                    {nextMode === 'signup' ? 'Create account' : nextMode === 'signin' ? 'Sign in' : 'Reset'}
                  </a>
                ))}
              </div>

              <form className="auth-form auth-form-upgraded" onSubmit={handleSubmit}>
                <label htmlFor="email" className="auth-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="auth-input"
                />

                {mode !== 'reset' ? (
                  <>
                    <label htmlFor="password" className="auth-label">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 6 characters"
                      className="auth-input"
                    />
                  </>
                ) : null}

                <button className="action-button auth-submit" type="submit" disabled={!authReady || status === 'working'}>
                  {status === 'working' ? 'Working...' : currentMode.button}
                </button>
              </form>

              <div className="auth-inline-note">
                <p>{message}</p>
                {mode !== 'reset' ? (
                  <button className="ghost-button" type="button" onClick={handleMagicLink} disabled={!authReady || status === 'working'}>
                    Send magic link instead
                  </button>
                ) : null}
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.82 }}>
                  By continuing, you agree to Paceframe&apos;s{' '}
                  <a href="/terms">Terms</a> and acknowledge the{' '}
                  <a href="/privacy">Privacy Policy</a>.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="grid two-up">
        <div className="panel">
          <p className="eyebrow">WHAT YOU GET</p>
          <h2>A life manager that works with your nervous system, not against it.</h2>
          <ul>
            <li>
              <strong>Adaptive planning</strong>
              <span>Tasks reorder around urgency, energy fit, and recovery cost.</span>
            </li>
            <li>
              <strong>Check-ins that matter</strong>
              <span>Burnout risk updates from stress, sleep trouble, and screen fatigue.</span>
            </li>
            <li>
              <strong>Care built in</strong>
              <span>Meals, hydration, movement, and rest stay visible alongside work.</span>
            </li>
          </ul>
        </div>

        <div className="panel warm">
          <p className="eyebrow">WHY WEB STILL MATTERS</p>
          <h2>Access, verification, and lightweight support</h2>
          <ul>
            <li>
              <strong>Create account</strong>
              <span>Start with email and password, or use a magic link when you want less friction.</span>
            </li>
            <li>
              <strong>Recover access</strong>
              <span>Password reset and verification live here so mobile stays focused on the product itself.</span>
            </li>
            <li>
              <strong>Keep one identity</strong>
              <span>The same Firebase account can move with you between the mobile app and the web access layer.</span>
            </li>
          </ul>
        </div>
      </section>

      <footer
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0 0 2.5rem',
          color: 'rgba(221, 231, 255, 0.78)'
        }}
      >
        <p style={{ margin: 0, maxWidth: '40rem' }}>
          Paceframe web is for product information, verification, and lightweight account support. Daily planning and recovery are designed for the mobile product.
        </p>
        <nav aria-label="Legal" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {legalLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </footer>
    </main>
  );
}
