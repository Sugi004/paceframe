# Architecture

## Product strategy

Paceframe is one platform with two product modes:

- `Performance mode`: plan the day using energy-aware task prioritisation
- `Recovery mode`: reduce overload with screen fatigue recovery and rest protocols

## System layout

1. Mobile app handles daily engagement, check-ins, prompts, and routines.
2. Web app handles onboarding, account access, password recovery, legal pages, and lightweight support flows.
3. Shared package owns domain types and the recommendation engine.
4. Supabase stores relational data, realtime events, and recovery logs.
5. Firebase handles user authentication.
6. The MCP package exposes app context to AI agents in a controlled way.

## Decision engine

The recommendation engine blends:

- deterministic scoring for task urgency and energy fit
- burnout risk scoring using self-reported state
- LLM or agent summarisation through the MCP layer

## Why this structure

A modular monorepo keeps the first version fast to build while making it easy to split services later if growth demands it.

## Web shell production expectations

- Keep the web app intentionally narrow so it does not compete with the mobile product surface.
- Ship canonical metadata, stable public URLs, and basic legal routes before public release.
- Treat `/privacy` and `/terms` as first-class routes, not hidden placeholders.
- Keep auth, onboarding, and account recovery flows resilient because the web shell is the main trust layer for sign-in support.
