# Firebase Auth + Supabase

## Flow

1. User signs in with Firebase Authentication.
2. Client obtains a Firebase ID token.
3. Supabase validates the Firebase token through third-party auth configuration.
4. Row-level security policies use the Firebase subject as the application user id.

## Notes

- Keep a single `users` row keyed by Firebase uid.
- Mirror the uid into profile-linked tables.
- Never trust client-side role claims without server verification.
- Store server-only keys in the backend or edge functions, never in the client apps.
- In production, configure Firebase authorized domains and email-link action URLs to match the public web shell origin.
- Keep `NEXT_PUBLIC_SITE_URL` aligned with the deployed domain so metadata, canonical tags, and auth emails point to the right place.
