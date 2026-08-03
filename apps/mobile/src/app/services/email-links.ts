import type { User } from 'firebase/auth';
import { getWebAppUrl } from '../utils';

function buildActionCodeUrl(path: '/verify' | '/reset') {
  return `${getWebAppUrl().replace(/\/$/, '')}${path}`;
}

async function postEmailRequest(path: '/api/auth/email/verification' | '/api/auth/email/reset', email: string) {
  const response = await fetch(new URL(path, getWebAppUrl()).toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });

  const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Email request failed with status ${response.status}.`);
  }
}

export async function requestVerificationEmail(user: User) {
  const email = user.email?.trim();

  if (!email) {
    throw new Error('We could not find an email address for this account.');
  }

  try {
    await postEmailRequest('/api/auth/email/verification', email);
    return;
  } catch {
    // Fall back to Firebase Auth email delivery if the web handoff is unavailable.
  }

  const { sendEmailVerification } = await import('firebase/auth');
  await sendEmailVerification(user, {
    url: buildActionCodeUrl('/verify')
  });
}

export async function requestVerificationEmailByEmail(email: string) {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    throw new Error('Enter your email address first.');
  }

  await postEmailRequest('/api/auth/email/verification', trimmedEmail);
}

export async function requestPasswordResetEmail(email: string) {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    throw new Error('Enter your email address first.');
  }

  try {
    await postEmailRequest('/api/auth/email/reset', trimmedEmail);
    return;
  } catch {
    // Fall back to Firebase Auth email delivery if the web handoff is unavailable.
  }

  const { sendPasswordResetEmail } = await import('firebase/auth');
  const { auth, hasFirebaseConfig } = await import('../../lib/firebase');

  if (!hasFirebaseConfig || !auth) {
    throw new Error('Firebase is not configured for mobile yet.');
  }

  await sendPasswordResetEmail(auth, trimmedEmail, {
    url: buildActionCodeUrl('/reset')
  });
}
