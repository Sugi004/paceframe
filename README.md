# Paceframe

Paceframe is a mobile-first personal regulation platform that helps people plan their day around energy, recover from burnout, and build healthier routines without juggling multiple tools.

## Product shape

- `apps/mobile`: primary product for planning, recovery, reminders, care tracking, reflection, and AI coaching
- `apps/web`: lightweight auth and verification shell for account access
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
- Web email-link sign-in and verification shell
- MCP server tools for plans, summaries, reminders, completed tasks, and recovery context
