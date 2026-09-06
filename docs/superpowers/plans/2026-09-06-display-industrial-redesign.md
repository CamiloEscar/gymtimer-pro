# Display Industrial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Display screen (the TV-mirrored screen a whole gym class reads from across the room) and its pairing screen to an industrial/"tactical telemetry" dark aesthetic, per `docs/superpowers/specs/2026-09-06-display-industrial-redesign-design.md`.

**Architecture:** Pure presentational restyle — no props, state, types, or `SessionChannel` message shape change anywhere in this plan. Two new fonts (Archivo Black for macro/headline text, JetBrains Mono for micro/metadata text) are wired via `next/font/google` in the root layout and exposed as Tailwind utilities (`font-industrial`, `font-tactical`) via new `@theme` tokens in `globals.css`. Every touched component swaps Tailwind classes only.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4 (`@theme` tokens), `next/font/google`.

## Global Constraints

- No `border-radius` anywhere in touched components — square (90°) corners only, per the design spec's "no exceptions" rule.
- No gradients, no soft/blurred `box-shadow` — zones are separated with `1px`/`2px solid` borders instead.
- Dark palette only (`surface-950/900/800/700`, `phosphor`, existing `brand-500` green for WORK/GO, existing `danger-500` red for REST/STOP) — no light-mode variant for these components.
- Bracket framing (`[ LIKE THIS ]`) only on short status/metadata labels (connection badge, round counter, overflow counter) — never on the timer number or exercise names.
- No halftone/dithering/scanline/noise post-processing effects — explicitly excluded per the design spec's audience-legibility trade-off.
- Scope is limited to: `globals.css`, `layout.tsx`, `DisplayScreen.tsx`, `TimerDisplay.tsx`, `PhaseIndicator.tsx`, `RoundIndicator.tsx`, `ExerciseListDisplay.tsx`, `DisplayConnection.tsx`, `README.md`. Nothing else changes (`TimerControls.tsx`, Dashboard, WorkoutBuilder, `WorkoutCard`/`WorkoutList`, `src/components/ui/*` are Phase 2, a separate future plan).
- This plan does NOT touch `WorkoutEngine.ts` or `currentExerciseIndex` — confirmed during spec review that this is dead-by-design, not a bug (see spec's "Correction from initial scoping" section).

---

### Task 1: Design tokens and industrial fonts

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: Tailwind utility classes `font-industrial` (Archivo Black) and `font-tactical` (JetBrains Mono), plus color utilities `bg-phosphor`/`text-phosphor` and `border-surface-700` — all later tasks in this plan consume these class names verbatim.

- [ ] **Step 1: Add the two Google fonts to the root layout**

Edit `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo_Black, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GymTimer Pro",
  description: "Temporizador de entrenamientos para gimnasio, sin backend.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${archivoBlack.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Add the new theme tokens to `globals.css`**

Edit `src/app/globals.css` — append inside the existing final `@theme { ... }` block (do not create a second `@theme` block):

```css
@theme {
  --color-brand-500: oklch(0.7 0.19 150); /* energetic green — "GO" */
  --color-brand-600: oklch(0.6 0.19 150);
  --color-danger-500: oklch(0.63 0.24 25); /* rest / stop */
  --color-surface-950: oklch(0.14 0 0); /* display background */
  --color-surface-900: oklch(0.18 0 0);
  --color-surface-800: oklch(0.24 0 0);
  --color-surface-700: oklch(0.32 0 0); /* border lines on dark surfaces */
  --color-phosphor: oklch(0.95 0 0); /* primary text on Display/tactical screens */
  --font-display: var(--font-geist-sans), sans-serif;
  --font-industrial: var(--font-archivo-black), sans-serif; /* macro: timer, phase, headlines */
  --font-tactical: var(--font-jetbrains-mono), monospace; /* micro: status, counters, metadata */
}
```

- [ ] **Step 3: Manually verify**

Run `npm run dev`, open `http://localhost:3000`, open devtools and confirm in the Network/Elements tab that `Archivo_Black` and `JetBrains_Mono` font files load with no 404s and no console errors. This step only verifies the fonts load — no visual change should be visible yet since nothing consumes `font-industrial`/`font-tactical` until Task 2.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: add industrial/tactical design tokens and fonts"
```

---

### Task 2: Restyle TimerDisplay and PhaseIndicator

**Files:**
- Modify: `src/components/timer/TimerDisplay.tsx`
- Modify: `src/components/timer/PhaseIndicator.tsx`

**Interfaces:**
- Consumes: `font-industrial`, `text-phosphor` from Task 1.
- No prop or export signature changes — both components keep their exact current props.

- [ ] **Step 1: Restyle `TimerDisplay.tsx`**

Replace the full file:

```tsx
interface TimerDisplayProps {
  remainingMs: number;
  elapsedMs: number;
  mode: "countdown" | "countup";
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function TimerDisplay({ remainingMs, elapsedMs, mode }: TimerDisplayProps) {
  const value = mode === "countdown" ? remainingMs : elapsedMs;
  return (
    <p className="font-industrial tabular-nums text-phosphor text-center leading-none tracking-tight text-[clamp(5rem,18vw,14rem)]">
      {formatTime(value)}
    </p>
  );
}
```

- [ ] **Step 2: Restyle `PhaseIndicator.tsx`**

Replace the full file:

```tsx
import type { WorkoutPhase } from "@/types";

const PHASE_LABELS: Record<WorkoutPhase, string> = {
  getReady: "PREPARATE",
  work: "TRABAJO",
  rest: "DESCANSO",
  finished: "TIEMPO",
};

const PHASE_CLASSES: Record<WorkoutPhase, string> = {
  getReady: "text-yellow-400",
  work: "text-brand-500",
  rest: "text-danger-500",
  finished: "text-phosphor",
};

export function PhaseIndicator({ phase }: { phase: WorkoutPhase }) {
  return (
    <p
      className={`font-industrial text-3xl md:text-5xl uppercase tracking-tight leading-none text-center ${PHASE_CLASSES[phase]}`}
    >
      {PHASE_LABELS[phase]}
    </p>
  );
}
```

- [ ] **Step 3: Manually verify**

Run `npm run dev`, create/open a workout, start a run in the Trainer panel, open `/display/[code]` in a second tab. Confirm: the timer number renders in the new condensed heavy font at a very large size, and the phase word (PREPARATE/TRABAJO/DESCANSO/TIEMPO) renders in the same font with the correct color per phase (yellow/green/red/white).

- [ ] **Step 4: Commit**

```bash
git add src/components/timer/TimerDisplay.tsx src/components/timer/PhaseIndicator.tsx
git commit -m "feat: restyle TimerDisplay and PhaseIndicator to industrial look"
```

---

### Task 3: Restyle RoundIndicator and ExerciseListDisplay

**Files:**
- Modify: `src/components/timer/RoundIndicator.tsx`
- Modify: `src/components/display/ExerciseListDisplay.tsx`

**Interfaces:**
- Consumes: `font-industrial`, `font-tactical` from Task 1. `formatExerciseLine` and `selectVisibleExercises` are unchanged (`src/lib/workout/formatExerciseLine.ts`, `src/lib/workout/selectVisibleExercises.ts`) — do not modify them.

- [ ] **Step 1: Restyle `RoundIndicator.tsx`**

Replace the full file:

```tsx
export function RoundIndicator({ round, totalRounds }: { round: number; totalRounds: number }) {
  if (totalRounds <= 1) return null;
  return (
    <p className="font-tactical text-sm md:text-base uppercase tracking-widest text-gray-400 text-center">
      [ RONDA {round} / {totalRounds} ]
    </p>
  );
}
```

- [ ] **Step 2: Restyle `ExerciseListDisplay.tsx`**

Replace the full file:

```tsx
import type { WorkoutBlock } from "@/types";
import { formatExerciseLine } from "@/lib/workout/formatExerciseLine";
import { selectVisibleExercises } from "@/lib/workout/selectVisibleExercises";

interface ExerciseListDisplayProps {
  block: WorkoutBlock;
}

export function ExerciseListDisplay({ block }: ExerciseListDisplayProps) {
  if (block.type === "rest") return null;

  const { visible, overflowCount } = selectVisibleExercises(block.exercises);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      {visible.map((exercise) => (
        <p
          key={exercise.id}
          className="font-industrial text-3xl md:text-4xl uppercase tracking-tight leading-tight text-gray-300 text-center"
        >
          {formatExerciseLine(exercise)}
        </p>
      ))}
      {overflowCount > 0 && (
        <p className="font-tactical text-sm uppercase tracking-widest text-gray-500 text-center">
          [ +{overflowCount} MÁS ]
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Manually verify**

In the same cross-tab setup as Task 2, build a workout with a block that has 2+ rounds and 3+ exercises (so both the round indicator and the overflow "+N MÁS" line are visible — `selectVisibleExercises` caps at 4 by default, so add 5+ exercises to see overflow). Confirm the round line shows `[ RONDA 1 / N ]` in bracket-framed mono, exercise names render in the condensed heavy font, and the overflow line (if any) shows `[ +N MÁS ]`. Also confirm a single-round workout shows no round indicator at all (existing `totalRounds <= 1` guard), and a rest-type block shows no exercise list (existing `block.type === "rest"` guard) — both should still behave exactly as before, only the styling changed.

- [ ] **Step 4: Commit**

```bash
git add src/components/timer/RoundIndicator.tsx src/components/display/ExerciseListDisplay.tsx
git commit -m "feat: restyle RoundIndicator and ExerciseListDisplay to industrial look"
```

---

### Task 4: Restyle the DisplayScreen shell and connection badge

**Files:**
- Modify: `src/components/display/DisplayScreen.tsx`

**Interfaces:**
- Consumes: `TimerDisplay`, `PhaseIndicator`, `RoundIndicator`, `ExerciseListDisplay` (all restyled in Tasks 2-3, same props as before). `font-tactical`, `font-industrial`, `border-surface-700`, `text-phosphor` from Task 1.
- No prop signature changes to `DisplayScreen` itself.

- [ ] **Step 1: Restyle `DisplayScreen.tsx`**

Replace the full file:

```tsx
"use client";

import type { ConnectionStatus, SessionState } from "@/types";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { ExerciseListDisplay } from "./ExerciseListDisplay";

interface DisplayScreenProps {
  state: SessionState;
  connectionStatus: ConnectionStatus;
  onFullscreenToggle: () => void;
}

export function DisplayScreen({ state, connectionStatus, onFullscreenToggle }: DisplayScreenProps) {
  const currentBlock = state.workout.blocks[state.currentBlockIndex];

  return (
    <div className="min-h-screen bg-surface-950 grid grid-rows-[auto_1fr_auto] gap-4 p-4 font-tactical">
      <div className="flex items-center justify-between border-b border-surface-700 pb-2">
        <button
          onClick={onFullscreenToggle}
          className="text-gray-500 hover:text-phosphor text-sm"
          aria-label="Pantalla completa"
        >
          ⛶
        </button>
        <p className="text-sm uppercase tracking-widest text-gray-400">{state.workout.name}</p>
        <span className="flex items-center gap-2 text-xs uppercase tracking-widest">
          <span
            className={`inline-block h-2 w-2 ${
              connectionStatus === "connected" ? "bg-brand-500" : "bg-danger-500"
            }`}
          />
          {connectionStatus === "connected" ? "[ CONECTADO ]" : "[ DESCONECTADO ]"}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center gap-6">
        <PhaseIndicator phase={state.currentPhase} />
        <TimerDisplay
          remainingMs={state.timer.remainingMs}
          elapsedMs={state.timer.elapsedMs}
          mode={state.timer.mode}
        />
        {currentBlock && <ExerciseListDisplay block={currentBlock} />}
        {state.currentPhase === "finished" && (
          <p className="font-industrial text-4xl uppercase text-phosphor">
            ENTRENAMIENTO COMPLETADO
          </p>
        )}
      </div>

      <div className="border-t border-surface-700 pt-2 flex justify-center">
        <RoundIndicator round={state.currentRound} totalRounds={state.totalRounds} />
      </div>
    </div>
  );
}
```

Note: when `RoundIndicator` returns `null` (single-round workout), the bottom grid row still renders its border-top strip with empty content — this is intentional (keeps the grid visually anchored) and matches the spec's note that the layout must not leave a broken gap.

- [ ] **Step 2: Manually verify**

Cross-tab verify again (Trainer run panel driving `/display/[code]`): confirm the top strip (fullscreen button, workout name, connection badge) and bottom strip (round indicator) are visually separated from the main content by thin lines, everything has square corners, and toggling fullscreen still works. Confirm the connection badge dot and bracket label switch between green/`[ CONECTADO ]` and red/`[ DESCONECTADO ]` when you close/reopen the Display tab.

- [ ] **Step 3: Commit**

```bash
git add src/components/display/DisplayScreen.tsx
git commit -m "feat: restyle DisplayScreen shell to industrial grid layout"
```

---

### Task 5: Restyle the DisplayConnection pairing screen

**Files:**
- Modify: `src/components/display/DisplayConnection.tsx`

**Interfaces:**
- No prop signature changes. Keeps the existing `useEffect`-deferred `url` state (hydration-safe pattern) untouched.

- [ ] **Step 1: Restyle `DisplayConnection.tsx`**

Replace the full file:

```tsx
"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ConnectionStatus } from "@/types";

interface DisplayConnectionProps {
  code: string;
  status: ConnectionStatus;
}

export function DisplayConnection({ code, status }: DisplayConnectionProps) {
  // Computed only after mount (not during the initial render) so the
  // server-rendered HTML and the first client render both omit the QR code —
  // reading window.location during render diverges between SSR and hydration
  // and causes a React hydration mismatch.
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/display/${code}`);
  }, [code]);

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-6 p-4 font-tactical">
      <h1 className="font-industrial text-3xl md:text-4xl uppercase tracking-tight text-phosphor">
        CONECTAR PANTALLA
      </h1>
      <p className="text-xs uppercase tracking-widest text-gray-500">[ CÓDIGO ]</p>
      <p className="font-industrial text-6xl md:text-7xl uppercase tracking-widest text-brand-500">
        {code}
      </p>
      {url && (
        <div className="border-2 border-surface-700 p-2">
          <QRCodeSVG value={url} size={200} bgColor="transparent" fgColor="#EAEAEA" />
        </div>
      )}
      <p className="text-xs uppercase tracking-widest text-gray-500">Escaneá para conectar</p>
      <p
        className={`text-sm uppercase tracking-widest ${
          status === "connected" ? "text-brand-500" : "text-gray-500"
        }`}
      >
        {status === "connected" ? "[ CONECTADO ]" : "[ ESPERANDO AL ENTRENADOR ]"}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Manually verify**

Open `/display/[code]` before starting a Trainer session (so it's in the waiting/pairing state). Confirm: the code renders huge in the industrial font, the QR code has a square bordered frame around it (no rounded corners), and the status line reads `[ ESPERANDO AL ENTRENADOR ]` in gray. Then start the Trainer session and confirm the status line switches to `[ CONECTADO ]` in green — same behavior as before, only the styling changed.

- [ ] **Step 3: Commit**

```bash
git add src/components/display/DisplayConnection.tsx
git commit -m "feat: restyle DisplayConnection pairing screen to industrial look"
```

---

### Task 6: Fix the stale README limitation about exercise names

**Files:**
- Modify: `README.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Remove the stale bullet**

In the `## Known limitations (Phase 1)` section of `README.md`, delete this bullet (it's factually wrong — `ExerciseListDisplay` already renders the block's exercises on the Display):

```md
- The Display does not currently render the active exercise name (e.g. "15
  SQUATS") — only phase, time, and round. Exercises are shown in the Workout
  Builder and run panel's workout data, but not surfaced on-screen during a
  running phase yet.
```

Leave the other two bullets (BroadcastChannel same-device limitation, connection-flicker) untouched.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: remove stale README claim about missing exercise names on Display"
```

---

## Final check

After Task 6, run the full verification pass once more end-to-end:

```bash
npm run build
npm run test
```

Both must succeed with no new errors before considering this plan done. Neither command's output should differ from the pre-existing baseline (this plan doesn't add or change any tests, and doesn't touch business logic), so any new failure here means a mistake was introduced in one of the JSX/CSS edits above (most likely a typo in a class name or a broken import) — go back and check the relevant task, don't paper over it.
