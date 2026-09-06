# Display Industrial Redesign — Design

> Phase 1 of 2 in the "make GymTimer Pro look and feel less generic" project.
> Phase 2 (Dashboard, Workout Builder, `ui/` primitives) is a separate,
> follow-up design cycle — out of scope here.

## Context

GymTimer Pro's UI currently runs on the unmodified `create-next-app` Tailwind
defaults plus two brand color tokens (`brand-500` green, `danger-500` red).
There is no typographic system, no consistent spacing scale, no visual
identity. The user asked for the Display screen — the one mirrored to a TV
that an entire gym class reads from across the room during a workout — to
move first, toward an **industrial / raw gym** aesthetic.

There is also a pre-existing functional gap being folded into this same pass:
`WorkoutEngine.currentExerciseIndex` (`src/lib/workout/WorkoutEngine.ts:105`)
is hardcoded to `0` and never advances, so the Display never shows which
exercise is currently active — only phase, time, and round. Designing the
Display's layout without knowing the exercise name would mean redoing the
layout twice, so the fix ships together with the visual redesign.

**Audience constraint (drives every trade-off below):** the people reading
this screen are gym-goers and trainers, not developers. The look must read
as "tough gym equipment," not "hacker terminal." Anywhere the source
material (see below) trades legibility for terminal-cosplay flourish, we cut
the flourish.

## Source material

Visual direction follows the `industrial-brutalist-ui` skill's **Tactical
Telemetry / CRT Terminal** archetype (dark-mode-exclusive, monospace data,
90° corners, no gradients/soft shadows), chosen over the light "Swiss
Industrial Print" archetype because it reuses the dark `surface-950/900/800`
tokens already in `globals.css` and suits a screen viewed in a dim/neon-lit
gym.

Two **deliberate deviations** from the skill's default recipe, both for the
audience constraint above:
1. **No halftone/dithering/static-noise post-processing.** The skill treats
   these as identity markers; here they'd just make text harder to read at
   a distance for someone mid-workout. Skipped entirely.
2. **CRT scanline overlay, if used at all, must be barely perceptible**
   (≤4% opacity) and never applied over the primary numeral/exercise-name —
   only over background dead space. Decorative texture must never compete
   with legibility.
3. **ASCII bracket framing (`[ LIKE THIS ]`) used sparingly**, only on
   short status labels (connection badge, exercise counter) where it reads
   as "equipment readout" rather than clutter — never on primary content.

## Visual system

**Palette** (dark, reusing/extending existing `@theme` tokens in
`globals.css`):
- Background: `--color-surface-950` (already `oklch(0.14 0 0)`).
- Panel/zone backgrounds: `--color-surface-900` / `--color-surface-800`.
- Primary text ("phosphor"): near-white, `oklch(0.95 0 0)` — new token
  `--color-phosphor`.
- Status green (WORK/GO phase only — one specific use, per the skill's rule
  that terminal green must serve exactly one purpose): existing
  `--color-brand-500`.
- Status red (REST/STOP phase, danger/disconnected states): existing
  `--color-danger-500`.
- No other colors. No gradients. No soft/blurred box-shadows anywhere.

**Typography** (both loaded locally via `next/font/google`, zero
runtime/CDN cost):
- **Macro** (timer countdown number, phase word, exercise name): **Archivo
  Black**. Deployed huge (`clamp()`-based), uppercase, tight tracking
  (`-0.02em` to `-0.04em`), compressed leading (~0.9). This is the thing
  read from 15 meters away — size and weight carry it, not decoration.
- **Micro** (round counter, connection status, exercise counter, timestamps):
  **JetBrains Mono**, small (`0.75rem`–`0.875rem`), uppercase, generous
  tracking (`0.05em`–`0.08em`). Reads as an equipment status readout.
- No third "textural disruption" serif font — the skill's rule against
  mixing more than necessary applies doubly here; a third typeface would
  just add noise for a non-technical audience.

**Layout & geometry:**
- `border-radius: 0` everywhere on Display components — no exceptions.
- Zones separated by visible `1px`/`2px solid` borders (using
  `surface-800`/`700`-range as the line color), not shadows or card
  elevation.
- CSS Grid for the Display's macro layout: one dominant cell for
  timer+phase+exercise name, a slim strip for round indicator, a slim strip
  for connection status — mirrors the skill's "blueprint grid" without
  needing a literal grid-line overlay.

## Component changes (Phase 1 scope)

1. **`WorkoutEngine.ts`** — replace the hardcoded `currentExerciseIndex: 0`
   with real tracking: advance through `block.exercises` as reps/time
   dictate (exact advancement rule mirrors however the block already
   determines phase/round progression — implementer confirms against
   existing block/round logic during TDD). Expose the resolved exercise
   `name` on state so components don't need to re-look-up the block.
   Existing Vitest suite for `WorkoutEngine` gets new cases for this.

2. **`ExerciseListDisplay.tsx`** — restyle to Macro font for the active
   exercise name (this becomes the second-largest element on screen, right
   under the timer number), Micro font + bracket framing for "EJERCICIO 02
   / 06"-style counters on the rest.

3. **`DisplayScreen.tsx`** — restyle host layout to the grid described
   above; wire in the now-real exercise name from `WorkoutEngine` state.

4. **`TimerDisplay.tsx`** — Macro font for the number, phase-driven color
   (green for WORK, red for REST, phosphor white for neutral phases like
   COUNTDOWN prep).

5. **`PhaseIndicator.tsx`** — Macro font, uppercase phase word, colored per
   phase per the same rule as `TimerDisplay`.

6. **`RoundIndicator.tsx`** — Micro font, bracket-framed ("RONDA 02 / 06").

7. **`DisplayConnection.tsx`** — Micro font status badge,
   `[ CONECTADO ]` / `[ DESCONECTADO ]`, red/phosphor coloring, square
   corners. (The existing no-heartbeat flicker limitation is NOT being
   fixed here — out of scope, still a known limitation.)

8. **`globals.css`** — add the new tokens and font-face wiring described
   above. Existing `brand-500`/`danger-500`/`surface-*` tokens are kept,
   not renamed, to avoid touching unrelated call sites.

**Explicitly out of scope for this design:** `TimerControls.tsx` (trainer-
only, never rendered on Display), `Dashboard`, `WorkoutBuilder`,
`WorkoutCard`/`WorkoutList`, and all of `src/components/ui/` — Phase 2.

## Testing

- `WorkoutEngine.currentExerciseIndex` fix gets unit tests following the
  existing TDD pattern in `src/lib/workout/__tests__/`.
- No visual/snapshot testing exists in this repo and none is being added —
  verification of the restyled components is manual (per the project's
  existing pattern of "Step 2: Manually verify" in prior plans), checked
  via the `run` skill/dev server, cross-tab (Trainer → Display) like prior
  Display work.
- No changes to `SessionChannel` message shape are needed unless exposing
  the exercise name requires a new field on the synced state — if so, the
  existing `SessionChannel` test suite gets a case for the new field.

## Risks / open questions the implementer should flag if hit

- If `block.exercises` can be empty (a block with no exercises, e.g. a pure
  rest block), the exercise-name slot must have a defined empty state
  (blank, not a crash or "undefined").
- If advancing `currentExerciseIndex` interacts with the round-repeat logic
  in a non-obvious way, that's a signal to stop and reconsider rather than
  patch around it — flag it rather than guessing.
