# GymTimer Pro

Timer app for gyms, CrossFit boxes, and functional training studios. A trainer
builds and runs a workout from a phone, tablet, or laptop; a second screen (TV,
monitor, projector) mirrors it live for the class to see.

## Phase 1 (MVP) scope

- Timer types: Countdown, Count Up, AMRAP, EMOM, Interval, Tabata, For Time, Rest.
- Workout Builder with blocks and exercises.
- Trainer↔Display sync via the BroadcastChannel API — **same browser/device only**
  in this phase (e.g. two tabs, or a laptop mirrored to a TV). Cross-device sync
  (phone controlling a separate physical TV) is Phase 2 and requires a small
  realtime backend (see `docs/superpowers/specs/`).
- Local persistence via `localStorage` — no account, no server required.
- Audio cues via the Web Audio API (no external sound files) and optional
  Speech Synthesis.

## Tech stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Vitest.

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

See `.env.example`. Phase 1 requires none.

## Deployment

Designed for zero-cost deployment on Vercel:

```bash
npx vercel
```

## Known limitations (Phase 1)

- The Trainer↔Display connection relies on the BroadcastChannel API, which
  only works between tabs/windows of the **same browser on the same device**.
  It cannot yet drive a physically separate TV from a phone — that is Phase 2.
- The Display's connection-status indicator can briefly flicker to
  "Disconnected" around reconnect events since there is no heartbeat/grace
  period yet; the underlying session state is unaffected.

## Roadmap

Phase 1 (this repo) → Phase 2 (cross-device realtime sync) → Phase 3 (accounts
and gyms) → Phase 4 (athletes and results) → Phase 5 (SaaS/billing) → Phase 6
(per-gym branding). Full detail in `GYMTIMER-PRO-PROMPT.md` Section 90.
