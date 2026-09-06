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

**Correction from initial scoping:** this design originally assumed a
functional gap — that the Display never shows the active exercise name,
based on a README "Known limitations" note. Reading the current code
disproved that: `ExerciseListDisplay.tsx` (added in the
`exercise-catalog-ux-i18n` merge) already renders the full exercise list of
the active block via `selectVisibleExercises`. `WorkoutEngine.currentExerciseIndex`
(`src/lib/workout/WorkoutEngine.ts:105`) stays hardcoded to `0` **by
deliberate design decision** — see
`docs/superpowers/plans/2026-09-05-exercise-catalog-ux-i18n.md:16`, which
chose "show the whole block's exercise list" over "track one active
exercise index." There is no functional gap to fix here. The only leftover
is that `README.md`'s "Known limitations" section still describes the old
(now false) behavior — corrected as a one-line doc fix in this pass, not a
code change.

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

1. **`README.md`** — fix the "Known limitations" bullet that claims the
   Display doesn't render the active exercise name; it does, via
   `ExerciseListDisplay`. Replace it with an accurate note (or drop the
   bullet if there's nothing accurate left to say about it).

2. **`ExerciseListDisplay.tsx`** — restyle the exercise list it already
   renders (1+ lines via `formatExerciseLine`, plus an optional "+N más"
   overflow line via `selectVisibleExercises`): Macro font for each
   exercise line (smaller weight class than the timer number — this is
   secondary content, several lines can appear at once), Micro font +
   bracket framing for the "+N más" overflow line.

3. **`DisplayScreen.tsx`** — restyle host layout to the grid described
   above (timer/phase/exercise-list as the dominant cell, round indicator
   and the inline connection badge — currently inlined at
   `DisplayScreen.tsx:27-34`, not a separate component despite the
   similarly-named `DisplayConnection.tsx` file — as slim strips).

4. **`TimerDisplay.tsx`** — Macro font for the number, phase-driven color
   (green for WORK, red for REST, phosphor white for neutral phases like
   COUNTDOWN prep).

5. **`PhaseIndicator.tsx`** — Macro font, uppercase phase word, colored per
   phase per the same rule as `TimerDisplay`.

6. **`RoundIndicator.tsx`** — Micro font, bracket-framed ("RONDA 02 / 06").

7. **`DisplayScreen.tsx`'s inline connection badge** (lines 27-34) — Micro
   font, `[ CONECTADO ]` / `[ DESCONECTADO ]` bracket framing, brand-500 /
   phosphor-muted coloring, square corners. (The existing no-heartbeat
   flicker limitation is NOT being fixed here — out of scope, still a
   known limitation.)

8. **`DisplayConnection.tsx`** — this is the separate pre-connection
   pairing screen (shown at `/display/[code]` before the Trainer joins:
   "CONECTAR PANTALLA", the code, the QR, "Esperando al entrenador…").
   Restyle to the same system: Macro font for the big code, Micro font for
   labels/status, square corners, no gradients. It shares the Display's
   dark background so it should look like the same product as the running
   Display, not a different screen.

9. **`globals.css`** — add the new tokens and font-face wiring described
   above. Existing `brand-500`/`danger-500`/`surface-*` tokens are kept,
   not renamed, to avoid touching unrelated call sites.

**Explicitly out of scope for this design:** `TimerControls.tsx` (trainer-
only, never rendered on Display), `Dashboard`, `WorkoutBuilder`,
`WorkoutCard`/`WorkoutList`, and all of `src/components/ui/` — Phase 2.

## Testing

This is a pure restyle — no engine, type, or `SessionChannel` message-shape
changes, so no new unit tests are needed. No visual/snapshot testing exists
in this repo and none is being added: verification is manual (per the
project's existing "Step 2: Manually verify" pattern in prior plans),
checked via the `run` skill/dev server, cross-tab (Trainer → Display) like
prior Display work, and separately at `/display/[code]` for the pairing
screen.

## Risks / open questions the implementer should flag if hit

- `ExerciseListDisplay` returns `null` for rest blocks and for blocks with
  zero visible exercises (`block.type === "rest"` or `visible.length ===
  0` — see `ExerciseListDisplay.tsx:10-13`). The restyled grid layout must
  not leave a broken/empty gap in the "blueprint grid" when this happens —
  the dominant cell should gracefully collapse to just timer+phase.
- If Archivo Black or JetBrains Mono don't cover Spanish accented
  characters/ñ cleanly (check rendered glyphs for "RONDA", "MÁS",
  exercise names with accents), flag it rather than shipping mojibake —
  both fonts are commonly used and should be fine, but verify.
