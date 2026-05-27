# Paceframe Mobile Release Checklist

## Product QA
- Verify sign up, sign in, sign out, and password reset.
- Verify onboarding saves profile, planning style, crash window, and care targets.
- Verify the Plan tab always prompts for energy before planning when pending work exists.
- Verify `Paceframe decides` keeps high-energy work first unless the user explicitly chooses low energy.
- Verify the work-order dropdown changes both `Focus lanes` and `Priority stack`.
- Verify completed tasks reopen correctly.
- Verify reminder toggles and time shifts persist.
- Verify AI coach refresh, AI chat, and fallback provider behavior.
- Verify cloud sync saves and reloads dashboard state after signing back in.

## Notification QA
- Grant notification permission on first launch.
- Confirm enabled reminders schedule exactly once.
- Confirm disabled reminders are cancelled.
- Confirm reminders survive app relaunch.
- Confirm Android notification channel appears as `paceframe-reminders`.

## AI / backend QA
- Run `supabase/migrations/0003_ai_memory.sql` in production.
- Confirm AI conversation history is created after a live assistant exchange.
- Confirm daily and weekly review records are written after live coaching refreshes.
- Verify AI provider environment variables and quota on the deployed web server.

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
- Add production analytics.
- Add crash reporting.
- Add server log monitoring for `/api/ai/*`, `/api/ai/history`, and `/api/ai/review`.

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
