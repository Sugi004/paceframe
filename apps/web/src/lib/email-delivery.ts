import { getServerEnvValue } from './server-env';
import { getFirebaseAdminAuth } from './firebase-admin';

type EmailKind = 'verification' | 'reset';

function getSiteUrl() {
  return getServerEnvValue('NEXT_PUBLIC_SITE_URL') || 'http://127.0.0.1:3001';
}

function getResendApiKey() {
  return getServerEnvValue('RESEND_API_KEY');
}

function getResendFrom() {
  return getServerEnvValue('RESEND_FROM_EMAIL') || 'Paceframe <onboarding@resend.dev>';
}

function normalizeActionLink(actionLink: string, kind: EmailKind) {
  const link = new URL(actionLink);
  const landing = new URL(kind === 'verification' ? '/verify' : '/reset', getSiteUrl());
  landing.search = link.search;
  return landing.toString();
}

async function sendResendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is missing in the root .env file.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: getResendFrom(),
      to: [to],
      subject,
      html,
      text
    })
  });

  const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ? `Resend ${payload.error.message}` : `Resend request failed with status ${response.status}.`);
  }
}

async function sendPaceframeEmail(kind: EmailKind, email: string) {
  const auth = getFirebaseAdminAuth();
  const siteUrl = getSiteUrl();
  const actionUrl =
    kind === 'verification'
      ? await auth.generateEmailVerificationLink(email, {
          url: `${siteUrl}/verify`
        })
      : await auth.generatePasswordResetLink(email, {
          url: `${siteUrl}/reset`
        });

  const landingUrl = normalizeActionLink(actionUrl, kind);
  const subject = kind === 'verification' ? 'Verify your Paceframe account' : 'Reset your Paceframe password';
  const headline = kind === 'verification' ? 'Verify your email' : 'Reset your password';
  const buttonLabel = kind === 'verification' ? 'Open verification page' : 'Open password reset page';
  const body =
    kind === 'verification'
      ? 'Finish creating your Paceframe account by verifying your email, then return to the app to log in.'
      : 'Use this link to reset your Paceframe password, then return to the app to log in again.';

  await sendResendEmail({
    to: email,
    subject,
    html: `
      <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #f7f9fd; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #e7edf7;">
          <div style="letter-spacing: 0.22em; font-size: 12px; font-weight: 800; color: #5f7db4; margin-bottom: 12px;">PACEFRAME</div>
          <h1 style="font-size: 28px; line-height: 1.1; margin: 0 0 14px; color: #0f1730;">${headline}</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #4b5976; margin: 0 0 24px;">${body}</p>
          <a href="${landingUrl}" style="display: inline-block; background: linear-gradient(135deg, #0f1730, #173f6d); color: #ffffff; text-decoration: none; font-weight: 800; padding: 14px 20px; border-radius: 999px;">${buttonLabel}</a>
          <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 20px 0 0;">If the button does not work, paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 13px; line-height: 1.7; color: #0f1730; margin: 8px 0 0;">${landingUrl}</p>
          <p style="font-size: 13px; line-height: 1.7; color: #64748b; margin: 20px 0 0;">After verification or reset, open the Paceframe mobile app to continue.</p>
        </div>
      </div>
    `,
    text: `${headline}\n\n${body}\n\nOpen this link:\n${landingUrl}\n\nAfter verification or reset, open the Paceframe mobile app to continue.`
  });
}

export async function sendPaceframeVerificationEmail(email: string) {
  await sendPaceframeEmail('verification', email);
}

export async function sendPaceframePasswordResetEmail(email: string) {
  await sendPaceframeEmail('reset', email);
}
