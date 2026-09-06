# GymTimer Pro

Timer app for gyms, CrossFit boxes, and functional training studios. A trainer
builds and runs a workout from a phone, tablet, or laptop; a second screen (TV,
monitor, projector) mirrors it live for the class to see.

## Phase 1 (MVP) scope

- Timer types: Countdown, Count Up, AMRAP, EMOM, Interval, Tabata, For Time, Rest.
- Workout Builder with blocks and exercises.
- Trainer↔Display sync via Pusher Channels (presence channel + client
  events) — works across physically separate devices (e.g. a phone
  running the Trainer panel and a TV/PC on a completely different network
  path showing the Display). Requires a small serverless auth route
  (`src/app/api/pusher/auth`) and the env vars listed below.
- Local persistence via `localStorage` — no account, no server required.
- Audio cues via the Web Audio API (no external sound files) and optional
  Speech Synthesis.

## Tech stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Vitest, Pusher Channels.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Testing

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

## Build

```bash
npm run build
npm run start
```

## Architecture

Business logic lives in framework-agnostic engines under `src/lib/`, each with
zero React dependency and its own Vitest suite:

- `src/lib/timer` — timestamp-based `TimerEngine` (drift-proof; not a naive
  `setInterval` counter).
- `src/lib/workout` — `WorkoutEngine`, a phase/round state machine built on top
  of `TimerEngine`.
- `src/lib/audio` — `AudioManager`, centralizes all sound/speech output.
- `src/lib/storage` — `WorkoutRepository` interface + `LocalWorkoutRepository`
  (localStorage-backed). Designed to be swapped for a Supabase-backed
  implementation later without touching call sites.
- `src/lib/session` — `SessionChannel`, the BroadcastChannel transport that
  mirrors Trainer state to the Display in real time.

React components under `src/components/` are presentational; they consume
engine state via hooks in `src/hooks/` (`useWorkoutSession`,
`useKeyboardShortcuts`, `useFullscreen`).

See `docs/superpowers/specs/2026-09-04-gymtimer-pro-mvp-design.md` for the full
technical design and `GYMTIMER-PRO-PROMPT.md` for the full product spec and
roadmap beyond Phase 1.

## Environment variables

See `.env.example`. Required:

- `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER` — read by the
  browser client (`src/lib/session/pusherClient.ts`).
- `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` / `PUSHER_CLUSTER` —
  server-only, read by `src/app/api/pusher/auth/route.ts`. Never prefix
  `PUSHER_SECRET` with `NEXT_PUBLIC_` — that would ship it to every
  browser.

All four Pusher app values come from the same dashboard app under "App
Keys" — see https://dashboard.pusher.com.

## Deployment

Designed for zero-cost deployment on Vercel:

```bash
npx vercel
```

## Roadmap

Phase 1 (this repo) → **Phase 2 (cross-device realtime sync, done)** → Phase 3
(accounts and gyms) → Phase 4 (athletes and results) → Phase 5
(SaaS/billing) → Phase 6 (per-gym branding). Full detail in
`GYMTIMER-PRO-PROMPT.md` Section 90.
