import Constants from 'expo-constants';
import type { AuthMode } from './types';

type ExpoExtra = {
  web?: {
    siteUrl?: string;
  };
  firebase?: {
    authDomain?: string;
    projectId?: string;
  };
};

export function getWebAppUrl() {
  const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
  const explicitSiteUrl = process.env.EXPO_PUBLIC_SITE_URL ?? extra.web?.siteUrl ?? '';

  if (explicitSiteUrl) {
    return explicitSiteUrl;
  }

  const authDomain = extra.firebase?.authDomain ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '';

  if (authDomain) {
    return authDomain.startsWith('http://') || authDomain.startsWith('https://')
      ? authDomain
      : `https://${authDomain.replace(/^\/+/, '')}`;
  }

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? extra.firebase?.projectId ?? '';

  if (projectId) {
    return `https://${projectId}.firebaseapp.com`;
  }

  return 'http://127.0.0.1:3001';
}

export function getAuthModeMessage(mode: AuthMode) {
  if (mode === 'signup') {
    return 'Create your Paceframe account in the app, then verify your email on the web page and return to log in.';
  }

  if (mode === 'signin') {
    return 'Sign in with your existing Paceframe account. New accounts still verify their email before first use.';
  }

  return 'Enter your email and we will send a password reset message.';
}

export function formatAuthErrorMessage(error: unknown, mode: AuthMode) {
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

export function formatDeleteAccountErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'We could not delete your account right now.';
  }

  const code = typeof (error as unknown as { code?: unknown }).code === 'string' ? ((error as unknown as { code: string }).code ?? '') : '';
  const normalized = `${code} ${error.message}`.toLowerCase();

  if (normalized.includes('requires-recent-login')) {
    return 'Please sign out and sign back in, then try deleting your account again so Paceframe can finish the Firebase step.';
  }

  if (normalized.includes('permission denied') || normalized.includes('row-level security') || normalized.includes('jwt')) {
    return 'Paceframe could not remove your synced data right now. Try again once cloud access is ready.';
  }

  if (normalized.includes('network request failed') || normalized.includes('failed to fetch') || normalized.includes('could not reach')) {
    return 'Paceframe could not reach the account deletion service. Try again in a moment.';
  }

  return 'We could not delete your account right now. Try again in a moment.';
}

export function formatSyncErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Cloud sync hit an unexpected error.';
  }

  const message = error.message.toLowerCase();
  if (message.includes('invalid input syntax for type uuid') || message.includes('operator does not exist: uuid = text')) {
    return 'Your dashboard_states table is using a UUID user_id, but Paceframe syncs with Firebase string IDs. Run the updated 0002_dashboard_state.sql migration again so user_id becomes text and references public.users.';
  }
  if (message.includes('violates foreign key constraint') || message.includes('dashboard_states_user_id_fkey')) {
    return 'The dashboard_states table is pointing at the wrong users table. Run the updated 0002_dashboard_state.sql migration again so it references public.users instead of auth.users.';
  }
  if (message.includes('could not find the table') || (message.includes('dashboard_states') && message.includes('schema cache'))) {
    return 'Supabase is missing the dashboard_states table. Run the SQL in supabase/migrations/0002_dashboard_state.sql inside your Supabase SQL editor, then reopen the app.';
  }
  if (message.includes('no suitable key') || message.includes('wrong key type') || message.includes('pgrst301')) {
    return 'Supabase does not trust the Firebase token yet. In Supabase, open Authentication -> Third-Party Auth, add the Firebase integration for this Firebase project, then sign in again so the app sends a fresh token.';
  }
  if (message.includes('row-level security') || message.includes('permission denied') || message.includes('jwt')) {
    return 'Supabase blocked the request. Make sure Firebase third-party auth is enabled in Supabase and your Firebase tokens include the role "authenticated" claim.';
  }

  return 'Cloud sync is temporarily unavailable. Your device is still working locally and you can retry later.';
}

export function isSyncSetupIssue(error: unknown) {
  return error instanceof Error && (
    error.message.toLowerCase().includes('invalid input syntax for type uuid') ||
    error.message.toLowerCase().includes('operator does not exist: uuid = text') ||
    error.message.toLowerCase().includes('dashboard_states_user_id_fkey') ||
    error.message.toLowerCase().includes('could not find the table') ||
    (error.message.toLowerCase().includes('dashboard_states') && error.message.toLowerCase().includes('schema cache'))
  );
}

export function shiftTime(time: string, direction: -1 | 1) {
  const [hours, minutes] = time.split(':').map(Number);
  const total = ((hours * 60 + minutes + direction * 30) % (24 * 60) + 24 * 60) % (24 * 60);
  const nextHours = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const nextMinutes = (total % 60).toString().padStart(2, '0');
  return `${nextHours}:${nextMinutes}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function formatAIUserMessage(error: unknown, context: 'coach' | 'assistant') {
  const fallback =
    context === 'coach'
      ? 'Live AI is unavailable right now. Paceframe will keep using the built-in planner and recovery guidance.'
      : 'Paceframe AI could not answer just now. Try asking again in a moment.';

  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.toLowerCase();

  if (message.includes('quota')) {
    return 'Live AI is busy right now. Try again shortly while Paceframe keeps using your saved plan and signals.';
  }

  if (message.includes('network request failed') || message.includes('failed to fetch') || message.includes('could not reach')) {
    return 'Live AI is offline right now. Keep the AI service running, then try again.';
  }

  if (message.includes('api key') || message.includes('provider is configured')) {
    return 'Live AI is not configured correctly yet. Once the provider key is active, Paceframe will reconnect automatically.';
  }

  if (message.includes('outside the scope') || message.includes('paceframe can only answer')) {
    return 'Paceframe AI can only answer from your task, energy, recovery, and reminder data.';
  }

  return fallback;
}
