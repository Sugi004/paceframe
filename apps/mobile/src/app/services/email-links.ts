import { getWebAppUrl } from '../utils';

async function sendEmailLink(path: string, email: string) {
  const response = await fetch(`${getWebAppUrl().replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ email })
  });

  const payload = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Could not send the email right now.');
  }
}

export async function requestVerificationEmail(email: string) {
  await sendEmailLink('/api/auth/email/verification', email);
}

export async function requestPasswordResetEmail(email: string) {
  await sendEmailLink('/api/auth/email/reset', email);
}
