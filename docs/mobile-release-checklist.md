# Paceframe Mobile Release Checklist

## Product QA
- Verify sign up creates a new Firebase account and routes the user through the Paceframe verification handoff.
- Verify existing users can sign in without being forced through verification again.
- Verify the first app open after onboarding shows the blocking live check-in and routes to Today after the user continues.
- Verify password reset opens the two-step web flow and returns the user to the app after the reset link is completed.
- Verify onboarding saves profile, planning style, crash window, and care targets.
- Verify the Plan tab always prompts for energy before planning when pending work exists.
- Verify `Paceframe decides` keeps high-energy work first unless the user explicitly chooses low energy.
- Verify the work-order dropdown changes both `Focus lanes` and `Priority stack`.
- Verify completed tasks reopen correctly.
- Verify reminder toggles and time shifts persist.
- Verify AI coach refresh, AI chat, and fallback provider behavior.
- Verify cloud sync saves and reloads dashboard state after signing back in.

## Notification QA
- Build a production-style binary or use a release profile on a real device.
- Grant notification permission on first launch and confirm the permission sheet only appears once.
- Enable one reminder and confirm it schedules exactly once.
- Change that reminder time and confirm the old scheduled notification is replaced, not duplicated.
- Disable the reminder and confirm the scheduled notification is cancelled.
- Leave the reminder enabled, relaunch the app, and confirm the scheduled notification is still present after reload.
- Sign out and confirm all scheduled reminders are cleared.
- Re-enable the reminder after sign-in and confirm scheduling resumes normally.
- Confirm the Android notification channel appears as `paceframe-reminders`.
- Test the three permission states explicitly: granted, denied, and revoked after the first run.

## AI / backend QA
- Run `supabase/migrations/0003_ai_memory.sql` in production.
- Confirm AI conversation history is created after a live assistant exchange.
- Confirm daily and weekly review records are written after live coaching refreshes.
- Verify AI provider environment variables and quota on the deployed web server.
- Confirm `/api/ai/*` requests are visible in the web server logs with route, method, status, and duration.

## Assets and branding
- Review `apps/mobile/assets/icon.png` on iOS and Android home screens.
- Review splash layout using `apps/mobile/assets/splash-icon.png` on small and large devices.
- Validate adaptive icon foreground/background on Android.

## Store configuration
- Set final iOS bundle identifier.
- Set final Android package name.
- Add app category, age rating, and support URL in store portals.
- Publish public Privacy Policy and Terms URLs.
- Upload final screenshots and app preview video if desired.

## Observability
- Add production analytics before submission.
- Add crash reporting before submission.
- Confirm the mobile error boundary logs production-visible crashes.
- Confirm the web route error page catches and logs page failures.
- Add server log monitoring for `/api/ai/*`, `/api/ai/history`, and `/api/ai/review`.
- Confirm reminder sync and AI route errors are readable in local logs during QA.

## Final commands
```bash
npm run typecheck
npm run test
npm --workspace apps/web run build
```

## Before submission
- Build a production mobile binary, not just Expo dev mode.
- Test sign in, AI, sync, and notifications on a real device.
- Freeze copy for App Store / Play Store listing.
- Confirm the Firebase project, Supabase migration, and deployed web env vars are all ready.
- Brand the Firebase Authentication verification and password reset templates as Paceframe before launch.
