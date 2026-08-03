import { sendPaceframePasswordResetEmail } from '../../../../../src/lib/email-delivery';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!email) {
      return Response.json({ error: 'An email address is required.' }, { status: 400 });
    }

    await sendPaceframePasswordResetEmail(email);

    return Response.json({ ok: true, message: 'Password reset email sent.' });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'Unable to send password reset email.';
    return Response.json({ error: message }, { status: 500 });
  }
}
