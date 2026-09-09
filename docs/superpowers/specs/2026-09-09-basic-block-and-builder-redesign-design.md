# "Básico" Block Type, Workout Builder Redesign, and Display Round Colors — Design Spec

Date: 2026-09-09
Status: Approved

## Context

Two requests bundled together because they touch the same surface area
(`/app/workouts/new`, the workout builder) and share underlying data (block
type, rounds/reps):

1. `/app/workouts/new` (`WorkoutBuilder`/`BlockEditor`/`ExerciseEditor`)
   still has the plain, untouched styling the Dashboard had before its own
   redesign — no visual identity, no live feedback on what's being built.
2. A new, simpler block type is needed: the trainer picks exercise time,
   rest time, reps per set, and number of sets/series — the total block
   duration is computed automatically, not typed in. This is distinct from
   the existing block types (which require picking `durationSeconds`
   directly, or don't expose reps at the block level at all).

A third, `/display`-only request rides along: cycle the screen's background
color by round/series so a room can tell at a glance which round a group is
on, without reading the round counter.

## Goals

1. Add a `"basic"` `BlockType`: exercise time, rest time, reps per round,
   number of rounds (series) — total duration computed and shown, not
   entered.
2. Redesign `/app/workouts/new` to match the industrial visual identity
   already established for the Dashboard (`docs/superpowers/specs/2026-09-08-dashboard-redesign-design.md`),
   with a live summary (block/exercise count, estimated total duration) so
   the trainer sees the impact of what they're building.
3. `/display` cycles its background through a small dark palette keyed to
   the current round, for multi-round workouts only.

## Non-goals

- No new block-level timer semantics beyond what `"interval"`/`"tabata"`
  already drive in `WorkoutEngine` — `"basic"` reuses the exact same
  work/rest/rounds state machine, only the UI and field labeling differ.
- No changes to `TimerEngine`, `SessionChannel`, or the Pusher sync layer.
- No changes to the Dashboard (already redesigned) or the Run page's control
  layout, beyond what's needed to display the new `repsPerRound` field if
  it's already surfaced elsewhere (it isn't — display-only concern is
  `/display`, covered here).
- No exercise-level (per-exercise-within-a-block) timer — rejected during
  brainstorming in favor of a new block type, which is simpler and reuses
  existing engine logic.

## 1. Data model: the "basic" block type

`src/types/workout.ts`:

```ts
export type BlockType =
  | "countdown"
  | "countup"
  | "amrap"
  | "emom"
  | "interval"
  | "tabata"
  | "forTime"
  | "rest"
  | "basic"; // new
```

`WorkoutBlock` gains one new optional field:

```ts
export interface WorkoutBlock {
  // ...existing fields unchanged...
  repsPerRound?: number; // new — informational only, shown on /display during the work phase
}
```

`"basic"` reuses the existing `workSeconds` / `restSeconds` / `rounds`
fields exactly as `"interval"` does — no new timer fields. The trainer-facing
distinction is purely in the `BlockEditor` UI (Section 2) and in the
Dashboard/Display's estimated-duration math already built for
`"interval"`/`"tabata"` (Section 3), which must be extended to also cover
`"basic"`.

### WorkoutEngine changes

Every place `WorkoutEngine` currently checks
`block.type === "interval" || block.type === "tabata"` to decide whether a
block runs a work/rest/rounds cycle must also include `"basic"`:

- `src/lib/workout/WorkoutEngine.ts`, `advancePhase()` — the interval/tabata
  branch.
- `src/lib/workout/WorkoutEngine.ts`, `buildTimerForCurrentPhase()` — the
  interval/tabata branch that builds the initial work-phase `TimerEngine`.

No other engine changes. `TimerEngine` itself is untouched — it already
only knows about `mode`/`durationMs`, not block types.

### estimateWorkoutDurationSeconds changes

`src/lib/workout/estimateWorkoutDurationSeconds.ts`'s `estimateBlockSeconds`
must also treat `"basic"` like `"interval"`/`"tabata"`:
`((workSeconds ?? 0) + (restSeconds ?? 0)) * (rounds ?? 1)`.

## 2. BlockEditor UI for "basic"

`src/components/workout/BlockEditor.tsx`: add a `"basic"` branch, mutually
exclusive with the existing `showWorkRest`/`showDuration` branches (a block
is either `"basic"`, work/rest-style, or duration-style — never more than
one branch renders).

Layout: a 2×2 grid of labeled inputs, in this order, each with a small
emoji-prefixed label (matching the app's existing style of icon-prefixed
copy, e.g. `WorkoutCard`'s "▶ Iniciar"/"✏ Editar"):

- "⏱ Tiempo de ejercicio (seg)" → `block.workSeconds`
- "⏸ Tiempo de pausa (seg)" → `block.restSeconds`
- "🔁 Series" → `block.rounds`
- "💪 Reps por serie" → `block.repsPerRound`

Below the grid, a read-only summary line (not an input):

> Tiempo total estimado: **{formatted}**

computed via `estimateWorkoutDurationSeconds`'s same
`(work+rest)×rounds` formula applied to this single block (a local
computation in `BlockEditor`, not a call into the workout-level function),
formatted as minutes via the same `formatEstimateMinutes`-style helper
already used in `WorkoutOfTheDay` (round to nearest minute; the known "0m"
rounding quirk for sub-minute totals is accepted here too, consistent with
the Dashboard's prior decision not to fix it).

The exercise picker below (`ExerciseEditor` list + "+ Agregar ejercicio")
is unchanged — every block type, `"basic"` included, still attaches one or
more exercises from the catalog.

### BLOCK_TYPES / labeling

Add `"basic"` to the `BLOCK_TYPES` array. Its `<option>` label reads
"BÁSICO" (uppercase, matching the existing `type.toUpperCase()` pattern) —
no special-casing needed there.

## 3. Workout Builder redesign (`/app/workouts/new`)

`src/components/workout/WorkoutBuilder.tsx` and its children get the same
visual language already established for the Dashboard
(`src/app/globals.css` tokens: `surface-950/900/800`, `brand-500`,
`font-industrial` for headings, `font-tactical` for numeric/status text —
no new tokens needed).

Changes:

1. **Page header**: "Nueva rutina" when `initialWorkout` is absent, "Editar
   rutina" when present — `font-industrial`, matching Dashboard's `<h1>`
   styling. Currently the page has no heading at all, just the name input.
2. **Per-block header label**: each `BlockEditor` card gets a small header
   row above its type `<Select>` reading `` `BLOQUE {index+1} · {block.type.toUpperCase()}` ``
   in `font-tactical`, `text-brand-500` — so blocks are scannable without
   reading every dropdown. This requires passing the block's 1-based index
   down from `WorkoutBuilder` to `BlockEditor` (a new required prop).
3. **Live summary**: directly above the "Guardar entrenamiento" button, a
   line reading `` `{blocks} bloques · {exercises} ejercicios · ~{duration} totales` ``
   using the already-built `countBlocksAndExercises` and
   `estimateWorkoutDurationSeconds` (extended per Section 1) — recomputed on
   every render from the current in-progress `workout` state, so it updates
   live as the trainer edits.
4. No changes to save/validation logic, routing, or the exercise catalog
   toggle (Gimnasio/CrossFit) — purely additive visual/informational
   changes.

## 4. Display round-color cycling

`src/components/display/DisplayScreen.tsx`: the outer wrapping `<div>`'s
background, currently a static `bg-surface-950`, becomes conditional:

```ts
const ROUND_BACKGROUNDS = [
  "bg-surface-950", // round 1 (and the default/single-round case)
  "bg-emerald-950",
  "bg-sky-950",
  "bg-amber-950",
  "bg-violet-950",
];

const background =
  state.totalRounds > 1
    ? ROUND_BACKGROUNDS[(state.currentRound - 1) % ROUND_BACKGROUNDS.length]
    : ROUND_BACKGROUNDS[0];
```

(Exact Tailwind color-950 shades to be picked during implementation to stay
visually dark/desaturated enough not to hurt the `text-phosphor` contrast —
the four accent hues are green/blue/amber/violet, all at the darkest
available Tailwind step, consistent with the industrial dark theme.)

Applies only when `state.totalRounds > 1`; single-round workouts (most
`amrap`/`forTime`/`rest` blocks) keep the plain `surface-950` background,
per the brainstorming decision to avoid noise where a round concept doesn't
meaningfully apply.

## 4b. Displaying `repsPerRound` on `/display`

Gap closed during spec self-review: Section 1 declares `repsPerRound` as
"shown on /display during the work phase" but never specified where.

`src/components/display/ExerciseListDisplay.tsx` currently receives only
`block` and renders the exercise list unconditionally (it already hides
itself for `"rest"`-type blocks). It gains a second prop, `phase:
WorkoutPhase` (passed from `DisplayScreen` as `state.currentPhase`, which
`DisplayScreen` already has in scope). When `block.repsPerRound` is set AND
`phase === "work"`, render one extra line below the exercise list:

```tsx
{block.repsPerRound && phase === "work" && (
  <p className="font-tactical text-lg uppercase tracking-widest text-brand-500 text-center">
    💪 {block.repsPerRound} REPS
  </p>
)}
```

Not shown during `"rest"` phase (nothing to do reps of while resting), and
naturally absent for block types that don't set `repsPerRound` (everything
except `"basic"` today).

## 5. Testing

- `WorkoutEngine`: extend existing interval/tabata test coverage
  (`src/lib/workout/__tests__/WorkoutEngine.test.ts`) with a `"basic"`-typed
  block exercising the same work→rest→next-round→finish transitions, to
  prove the added `|| block.type === "basic"` branches behave identically.
- `estimateWorkoutDurationSeconds`: add a `"basic"` case to its existing
  test file, mirroring the `"interval"` case.
- `BlockEditor`: component tests for the new `"basic"` branch — all 4 inputs
  render with correct labels/values, onChange wiring, and the computed
  summary line reflects the current work/rest/rounds values.
- `WorkoutBuilder`: component test(s) for the header text (create vs edit
  mode) and the live summary line updating as blocks/exercises change.
- `DisplayScreen`: component test(s) asserting the background class per
  `currentRound`/`totalRounds` combination, including the `totalRounds <= 1`
  no-cycling case.
- `ExerciseListDisplay`: component test(s) for the new reps line — shown
  when `repsPerRound` is set and `phase === "work"`, hidden during
  `"rest"`, absent when `repsPerRound` is unset.

## Open questions / risks

None outstanding.
