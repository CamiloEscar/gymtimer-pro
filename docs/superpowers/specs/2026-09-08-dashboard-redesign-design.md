# Dashboard Redesign — Design Spec

Date: 2026-09-08
Status: Approved (sub-project 1 of 4: Dashboard → Workout list → Builder → Run screen)

## Context

The current Dashboard (`src/components/dashboard/Dashboard.tsx`) is minimal to the
point of feeling like an unstyled scaffold: a bare `<h1>`, a "workout of the day"
block, and a plain bullet list of recent workouts as text links
(`src/components/dashboard/RecentWorkouts.tsx`). The `/display` route already
received an "industrial" visual identity (dark surfaces, Archivo Black display
font, JetBrains Mono for tactical/status text, electric-green brand accent —
defined in `src/app/globals.css`). This spec extends that same identity to the
Dashboard, the first screen the trainer sees, and adds real content instead of
placeholder-level sections.

This is sub-project 1 of a 4-part UI/UX pass across the app (Dashboard → Workout
list → Builder → Run screen), done in that order. Only the Dashboard is in scope
here.

## Goals

1. Give the Dashboard the same visual identity as `/display` (dark, bold,
   industrial) instead of default/untouched Tailwind styling.
2. Add real, useful content: session stats, quick actions, search, and a richer
   presentation of existing sections (workout of the day, recent workouts).
3. Lay the groundwork (workout history tracking) so stats are backed by real
   data, not fabricated numbers.

## Non-goals

- Workout list screen, Workout Builder, Run screen — separate sub-projects,
  done after this one.
- Any change to `TimerEngine`, `WorkoutEngine`, or `/display` sync behavior.
- Editing/deleting history entries — history is write-once (created on
  completion), read-only from the Dashboard for now.

## 1. Workout history tracking (new capability)

No part of the codebase currently records when a workout session was
completed — `LocalWorkoutRepository` only stores workout *definitions*. A
`WorkoutResult` type exists in `src/types/workout.ts` but is entirely unwired
(no repository, no call site). Real stats (streak, sessions this week, total
time trained) need this data to exist.

### New type

```ts
// src/types/workoutHistory.ts
export interface WorkoutHistoryEntry {
  id: string;
  workoutId: string;
  workoutName: string;
  completedAt: string; // ISO timestamp
  durationMs: number;
}
```

### New repository

`src/lib/storage/WorkoutHistoryRepository.ts`, following the exact pattern of
`LocalWorkoutRepository` (`Result<T, StorageError>`, same
`ok`/`err`/`writeAll` helpers, own localStorage key `gymtimer.history`):

- `list(): Result<WorkoutHistoryEntry[], StorageError>`
- `record(entry: Omit<WorkoutHistoryEntry, "id">): Result<WorkoutHistoryEntry, StorageError>`

### Write site

`src/app/app/workouts/[id]/run/page.tsx`, in the existing effect that already
watches `session.state.status` (currently only used to call
`audio.playFinish()`, around line 70-73). When status transitions to
`"finished"`, also call `historyRepo.record(...)` with `workout.id`,
`workout.name`, and `completedAt: new Date().toISOString()`.

`durationMs` source: `session.state.timer.elapsedMs` resets on every
work/rest/round phase change (each is a fresh `TimerEngine` inside
`WorkoutEngine`), so it can't represent total session time. Instead, add a
`sessionStartedAt` ref in `RunWorkoutContent`, set to `Date.now()` the first
time `handleStart()` runs (guarded so a later `resume()` doesn't reset it).
At the `"finished"` transition, `durationMs = Date.now() - sessionStartedAt.current`.

Guard against double-recording: this effect can re-run on state changes while
status stays `"finished"`; use a ref flag (`hasRecordedRef`) reset only when a
new workout session starts, matching the existing `resetPending` state
pattern already in that file.

## 2. Derived stats

Computed client-side in the Dashboard from `WorkoutHistoryRepository.list()` —
no new storage needed beyond the raw entries:

- **Sessions this week**: count of entries with `completedAt` within the
  current ISO week (Monday–Sunday, local time).
- **Current streak**: consecutive calendar days (most recent backwards) with
  at least one entry. Zero history → 0, not an error state.
- **Total time trained**: sum of `durationMs` across all entries, formatted as
  hours/minutes.
- **Total routines saved**: `workouts.length` from the existing
  `LocalWorkoutRepository` (no history needed).

When there's no history yet, stats render a motivating empty state ("arrancá
tu racha hoy") instead of a bare `0`.

## 3. Layout (top to bottom)

1. **Header** — app name + time-of-day-aware greeting ("Buenas tardes"),
   Archivo Black.
2. **Stats row** — 3–4 small `Card`s in a grid: sessions this week, streak,
   total time trained, total routines saved.
3. **Quick actions** — row of large icon+label buttons: "Nueva rutina" (→
   `/app/workouts/new`), "Abrir Display" (→ `/display`), and conditionally
   "Continuar [workout name]" (→ `/app/workouts/[id]/run`) when a workout of
   the day exists.
4. **Search** — text input filtering the workout list client-side by name
   (case-insensitive substring match), live as you type.
5. **Workout of the day** — existing concept, upgraded card showing block
   count and estimated total duration, not just the name.
6. **Recent workouts** — replaces the current plain `<ul>` of text links with
   a responsive grid of the existing `WorkoutCard` component (already used
   elsewhere for the workout list — reused here, not duplicated).

Visual language: dark `surface-950/900` backgrounds, `surface-800` borders,
`brand-500` for primary actions/accents, Archivo Black for headings, JetBrains
Mono for numeric/status text (stat values, timestamps) — matching `/display`'s
existing token set in `src/app/globals.css`. No new design tokens needed.

## 4. Testing

- `WorkoutHistoryRepository`: unit tests for record/list, and specifically the
  streak calculation (empty history, single day, consecutive days, a gap that
  breaks the streak, multiple entries same day counting once).
- `Dashboard`, `WorkoutOfTheDay`, `RecentWorkouts`: component tests via
  Vitest + Testing Library, following the existing suite's patterns (see
  `src/components/workout/__tests__/*`).
- No changes to `TimerEngine`, `WorkoutEngine`, `SessionChannel`, or
  `/display` — the existing 112 tests for those must continue passing
  unmodified.

## Open questions / risks

None outstanding — the `durationMs` source question is resolved above
(`sessionStartedAt` ref in `run/page.tsx`).
