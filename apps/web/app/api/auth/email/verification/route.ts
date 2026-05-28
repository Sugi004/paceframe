import { NextResponse } from 'next/server';
import { sendPaceframeVerificationEmail } from '../../../../../src/lib/email-delivery';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    await sendPaceframeVerificationEmail(email);

    return NextResponse.json({ message: 'Verification email sent.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not send the verification email.';
    if (message.includes('Firebase Admin credentials are missing') || message.includes('RESEND_API_KEY is missing')) {
      return NextResponse.json(
        { message: 'Email delivery is not configured yet. Add the Firebase Admin and Resend credentials in the root .env file.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ message: 'Could not send the verification email right now. Try again in a moment.' }, { status: 500 });
  }
}
