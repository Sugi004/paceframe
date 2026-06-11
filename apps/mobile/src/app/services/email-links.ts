import { sendEmailVerification, sendPasswordResetEmail, type User } from 'firebase/auth';
import { auth, hasFirebaseConfig } from '../../lib/firebase';
import { getWebAppUrl } from '../utils';

function buildActionCodeUrl(path: '/verify' | '/reset') {
  return `${getWebAppUrl().replace(/\/$/, '')}${path}`;
}

export async function requestVerificationEmail(user: User) {
  if (!hasFirebaseConfig || !auth) {
    throw new Error('Firebase is not configured for mobile yet.');
  }

  await sendEmailVerification(user, {
    url: buildActionCodeUrl('/verify')
  });
}

export async function requestPasswordResetEmail(email: string) {
  if (!hasFirebaseConfig || !auth) {
    throw new Error('Firebase is not configured for mobile yet.');
  }

  await sendPasswordResetEmail(auth, email, {
    url: buildActionCodeUrl('/reset')
  });
}
