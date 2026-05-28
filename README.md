# Paceframe

Paceframe is a mobile-first personal regulation platform that helps people plan their day around energy, recover from burnout, and build healthier routines without juggling multiple tools.

## Product shape

- `apps/mobile`: primary product for planning, recovery, reminders, care tracking, reflection, and AI coaching
- `apps/web`: public product info, verification, and password recovery shell
- `packages/shared`: shared domain models, planning engine, AI coach logic, and seed state
- `packages/mcp`: MCP server scaffolding for AI-powered assistants to read plans, summaries, and coaching context
- `supabase`: database schema and starter policies
- `docs`: architecture and integration docs

## Stack

- Mobile: Expo + React Native + TypeScript
- Web: Next.js + TypeScript
- Database: Supabase Postgres
- Auth: Firebase Authentication
- Realtime and storage: Supabase
- AI integration layer: MCP server package + shared decision engine

## Run locally

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env` and fill in your Firebase and Supabase keys
3. Start the apps you need:
   - `npm run dev:mobile`
   - `npm run dev:web`
   - `npm run dev:mcp`

### Web shell environment

The web shell expects the following production-facing values:

- `NEXT_PUBLIC_SITE_URL`: canonical public base URL for the web shell
- `NEXT_PUBLIC_FIREBASE_*`: Firebase web client configuration
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`: used by the web server to send verification and reset emails
- `RESEND_FROM_EMAIL`: verified sender address used in those emails
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

For local development, `NEXT_PUBLIC_SITE_URL` can remain unset and the app will fall back to `http://127.0.0.1:3000`.

### Mobile email handoff

Paceframe creates accounts in the mobile app, then asks the web server to generate and send the verification or password reset email through Resend. The email links land on `/verify` and `/reset` on the public web shell, where the action code is completed and the user is told to return to the app.

## Current MVP

- Energy-aware day planning
- Burnout recovery flows
- Daily check-in and focus state
- Care tracking for meals, hydration, movement, and rest
- Reminder controls for eating, moving, resting, and hydrating
- Separate open and completed task flows
- Local persistence for mobile and web auth state
- AI daily brief and AI coach recommendations
- Reflection and journal-style memory inputs
- Suggested recovery protocols
- Web product info, verification, and password recovery shell
- MCP server tools for plans, summaries, reminders, completed tasks, and recovery context

## Web shell production notes

- The web app is intentionally narrow in scope: account access, verification, onboarding support, and legal review.
- Production deployments should expose `/privacy` and `/terms` alongside the auth shell.
- Firebase authorized domains and email action URLs should match the final public web shell domain.
- Server-only secrets such as service-role keys and AI provider keys must never be exposed through `NEXT_PUBLIC_*` variables.
- Before launch, complete the remaining production work: analytics, crash reporting, export/delete-account flows, and final legal review.

## Release prep

- App Store / Play Store copy: [docs/app-store-metadata.md](/Users/sugishivam/Desktop/Paceframe/docs/app-store-metadata.md)
- Mobile release checklist: [docs/mobile-release-checklist.md](/Users/sugishivam/Desktop/Paceframe/docs/mobile-release-checklist.md)
- Generated mobile assets live in `apps/mobile/assets`
