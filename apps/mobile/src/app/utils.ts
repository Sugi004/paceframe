import type { AuthMode } from './types';

export function getAuthModeMessage(mode: AuthMode) {
  if (mode === 'signup') {
    return 'Create your Paceframe account to keep planning, reminders, and recovery tied to one identity.';
  }

  if (mode === 'signin') {
    return 'Sign in to continue where your pacing, recovery, and routines left off.';
  }

  return 'Enter your email and we will send a password reset message.';
}

export function formatAuthErrorMessage(error: unknown, mode: AuthMode) {
  if (!(error instanceof Error)) {
    return 'We could not complete that request.';
  }

  if (!('code' in error) || typeof error.code !== 'string') {
    return error.message;
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
      return error.message;
  }
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

  return error.message;
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
