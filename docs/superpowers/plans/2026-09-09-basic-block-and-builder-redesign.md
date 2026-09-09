# "Básico" Block, Builder Redesign, and Display Round Colors — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "basic" workout block type (exercise time / rest time / reps / series, with computed total duration), redesign `/app/workouts/new` to match the Dashboard's industrial visual identity with a live build summary, and cycle the `/display` background color by round for multi-round workouts.

**Architecture:** `"basic"` reuses `WorkoutEngine`'s existing interval/tabata work-rest-rounds state machine (only the two type-check branches change) rather than introducing new timer semantics. `estimateWorkoutDurationSeconds` and a newly-shared `formatEstimateMinutes` helper (extracted from `WorkoutOfTheDay`) drive both the builder's live summary and the block-local duration preview. `/display` changes are two independent, additive tweaks: a background-color lookup keyed on `currentRound`, and a reps line in `ExerciseListDisplay` gated on `phase === "work"`.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Vitest + Testing Library.

## Global Constraints

- All UI copy is in Spanish (Rioplatense), matching the rest of the app.
- Reuse existing `Card`/`Button`/`Input`/`Select` primitives from `src/components/ui/` — no new low-level primitives.
- Visual tokens: dark backgrounds (`bg-surface-950`/`bg-surface-900`), borders (`border-surface-800`), primary accent (`text-brand-500`/`bg-brand-500`), headings in `font-industrial`, numeric/status text in `font-tactical` — all already defined in `src/app/globals.css`, no new tokens needed except the four Tailwind `*-950` round-color backgrounds named in Task 7 (already-shipped Tailwind classes, not custom tokens).
- No new npm dependencies.
- `"basic"` blocks reuse `workSeconds`/`restSeconds`/`rounds` exactly as `"interval"`/`"tabata"` do — no new timer fields.

---

### Task 1: Add "basic" BlockType and repsPerRound field

**Files:**
- Modify: `src/types/workout.ts`

**Interfaces:**
- Produces: `BlockType` now includes `"basic"`; `WorkoutBlock.repsPerRound?: number`

- [ ] **Step 1: Edit the type**

In `src/types/workout.ts`, change:

```ts
export type BlockType =
  | "countdown"
  | "countup"
  | "amrap"
  | "emom"
  | "interval"
  | "tabata"
  | "forTime"
  | "rest";
```

to:

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
  | "basic";
```

And change:

```ts
export interface WorkoutBlock {
  id: string;
  type: BlockType;
  durationSeconds: number;
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  exercises: Exercise[];
  label?: string;
}
```

to:

```ts
export interface WorkoutBlock {
  id: string;
  type: BlockType;
  durationSeconds: number;
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  repsPerRound?: number;
  exercises: Exercise[];
  label?: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: clean (no new errors — this is a pure additive type change, both new fields are optional/additive so no existing call site can break)

- [ ] **Step 3: Commit**

```bash
git add src/types/workout.ts
git commit -m "feat: add basic BlockType and repsPerRound field"
```

---

### Task 2: WorkoutEngine treats "basic" like interval/tabata

**Files:**
- Modify: `src/lib/workout/WorkoutEngine.ts:185` (advancePhase)
- Modify: `src/lib/workout/WorkoutEngine.ts:240` (buildTimerForCurrentPhase)
- Modify: `src/lib/workout/__tests__/WorkoutEngine.test.ts`

**Interfaces:**
- Consumes: `BlockType` from Task 1 (already includes `"basic"`)

- [ ] **Step 1: Write the failing test**

Add to `src/lib/workout/__tests__/WorkoutEngine.test.ts`, a new `describe` block after the existing `"WorkoutEngine — Interval (work/rest rounds)"` block (same file, following that block's exact structure — `basicWorkout` mirrors `intervalWorkout` but with `type: "basic"` and a `repsPerRound` field):

```ts
const basicWorkout: Workout = {
  id: "w3",
  name: "Basic Block",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [
    {
      id: "b1",
      type: "basic",
      durationSeconds: 0,
      workSeconds: 5,
      restSeconds: 3,
      rounds: 2,
      repsPerRound: 12,
      exercises: [{ id: "e1", name: "Push Ups" }],
    },
  ],
};

describe("WorkoutEngine — Basic (reuses interval/tabata state machine)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("starts round 1 in the work phase for workSeconds", () => {
    const engine = new WorkoutEngine(basicWorkout);
    engine.start();
    const state = engine.getState();
    expect(state.currentPhase).toBe("work");
    expect(state.currentRound).toBe(1);
    expect(state.totalRounds).toBe(2);
    expect(state.timer.remainingMs).toBe(5000);
  });

  it("transitions work -> rest after workSeconds elapses", () => {
    const engine = new WorkoutEngine(basicWorkout);
    engine.start();
    vi.advanceTimersByTime(5100);
    expect(engine.getState().currentPhase).toBe("rest");
  });

  it("transitions rest -> next round's work phase, then finishes after the last round's rest", () => {
    const engine = new WorkoutEngine(basicWorkout);
    engine.start();
    vi.advanceTimersByTime(5100);
    vi.advanceTimersByTime(3100);
    expect(engine.getState().currentRound).toBe(2);
    expect(engine.getState().currentPhase).toBe("work");

    vi.advanceTimersByTime(5100);
    vi.advanceTimersByTime(3100);
    expect(engine.getState().status).toBe("finished");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/workout/__tests__/WorkoutEngine.test.ts`
Expected: FAIL — a `"basic"`-typed block currently falls into the generic
"single duration, then finish" branch of `advancePhase()`, so the first
test's `currentPhase` stays `"work"` past the point the second test expects
`"rest"`, and `buildTimerForCurrentPhase()` returns a `0`-duration countdown
(from `block.durationSeconds`, which is `0` in this fixture) instead of a
5000ms one — the first test's `remainingMs` assertion fails.

- [ ] **Step 3: Update WorkoutEngine**

In `src/lib/workout/WorkoutEngine.ts`, line 185, change:

```ts
    if (block.type === "interval" || block.type === "tabata") {
```

to:

```ts
    if (block.type === "interval" || block.type === "tabata" || block.type === "basic") {
```

And at line 240, change:

```ts
    if (block.type === "interval" || block.type === "tabata") {
```

to:

```ts
    if (block.type === "interval" || block.type === "tabata" || block.type === "basic") {
```

(Both are the only two places `WorkoutEngine` distinguishes work/rest/rounds-style blocks from single-duration ones — `replaceTimer()` already reads `workSeconds`/`restSeconds` generically regardless of block type, so it needs no change.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/workout/__tests__/WorkoutEngine.test.ts`
Expected: PASS (all tests, including the 3 new ones)

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: PASS — no regressions in the existing interval/tabata/amrap tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/workout/WorkoutEngine.ts src/lib/workout/__tests__/WorkoutEngine.test.ts
git commit -m "feat: WorkoutEngine treats basic blocks like interval/tabata"
```

---

### Task 3: estimateWorkoutDurationSeconds supports "basic"; extract shared formatEstimateMinutes

**Files:**
- Modify: `src/lib/workout/estimateWorkoutDurationSeconds.ts`
- Modify: `src/lib/workout/__tests__/estimateWorkoutDurationSeconds.test.ts`
- Modify: `src/components/dashboard/WorkoutOfTheDay.tsx`

**Interfaces:**
- Produces: `formatEstimateMinutes(seconds: number): string` (newly exported from `estimateWorkoutDurationSeconds.ts`)
- Consumes (Task 4 will also consume): `formatEstimateMinutes` from `src/lib/workout/estimateWorkoutDurationSeconds.ts`

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/workout/__tests__/estimateWorkoutDurationSeconds.test.ts`:

```ts
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "../estimateWorkoutDurationSeconds";

// ... (existing imports/tests stay as-is; add these alongside them)

describe("estimateWorkoutDurationSeconds — basic blocks", () => {
  it("computes (work + rest) * rounds for basic blocks, same as interval", () => {
    const w = workout([
      { id: "b1", type: "basic", durationSeconds: 0, workSeconds: 45, restSeconds: 15, rounds: 4, exercises: [] },
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe((45 + 15) * 4);
  });
});

describe("formatEstimateMinutes", () => {
  it("rounds seconds to the nearest whole minute with an 'm' suffix", () => {
    expect(formatEstimateMinutes(660)).toBe("11m");
  });

  it("rounds down when under 30 seconds past a minute boundary", () => {
    expect(formatEstimateMinutes(90)).toBe("2m");
  });
});
```

(Note: the existing test file already has a `workout(blocks)` helper at the
top — reuse it, don't redefine it.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/workout/__tests__/estimateWorkoutDurationSeconds.test.ts`
Expected: FAIL — `formatEstimateMinutes` doesn't exist yet in this module,
and the "basic blocks" case falls through to `estimateBlockSeconds`'s final
`return block.durationSeconds` line, returning `0` instead of `240`.

- [ ] **Step 3: Update estimateWorkoutDurationSeconds.ts**

Replace `src/lib/workout/estimateWorkoutDurationSeconds.ts` entirely:

```ts
import type { Workout, WorkoutBlock } from "@/types";

function estimateBlockSeconds(block: WorkoutBlock): number {
  if (block.type === "interval" || block.type === "tabata" || block.type === "basic") {
    const rounds = block.rounds ?? 1;
    return ((block.workSeconds ?? 0) + (block.restSeconds ?? 0)) * rounds;
  }
  if (block.type === "countup") return 0;
  return block.durationSeconds;
}

export function estimateWorkoutDurationSeconds(workout: Workout): number {
  return workout.blocks.reduce((sum, block) => sum + estimateBlockSeconds(block), 0);
}

export function formatEstimateMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}
```

- [ ] **Step 4: Update WorkoutOfTheDay.tsx to use the shared helper**

In `src/components/dashboard/WorkoutOfTheDay.tsx`, change the import line:

```ts
import { estimateWorkoutDurationSeconds } from "@/lib/workout/estimateWorkoutDurationSeconds";
```

to:

```ts
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "@/lib/workout/estimateWorkoutDurationSeconds";
```

And delete the now-duplicate local function:

```ts
function formatEstimateMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}
```

(The rest of `WorkoutOfTheDay.tsx` is unchanged — it already calls
`formatEstimateMinutes(estimatedSeconds)`, which now resolves to the
imported version.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/workout/__tests__/estimateWorkoutDurationSeconds.test.ts src/components/dashboard/__tests__/WorkoutOfTheDay.test.tsx`
Expected: PASS — both files, including `WorkoutOfTheDay`'s existing "~11m"
assertion, which must still pass unchanged since the function's behavior is
identical, only its location moved.

- [ ] **Step 6: Run the full suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/workout/estimateWorkoutDurationSeconds.ts src/lib/workout/__tests__/estimateWorkoutDurationSeconds.test.ts src/components/dashboard/WorkoutOfTheDay.tsx
git commit -m "feat: estimateWorkoutDurationSeconds supports basic blocks; share formatEstimateMinutes"
```

---

### Task 4: BlockEditor — "basic" UI branch, per-block index header

**Files:**
- Modify: `src/components/workout/BlockEditor.tsx`
- Modify: `src/components/workout/__tests__/BlockEditor.test.tsx`

**Interfaces:**
- Consumes: `formatEstimateMinutes` from Task 3 (`src/lib/workout/estimateWorkoutDurationSeconds.ts`)
- Produces: `BlockEditor` now requires a new prop `index: number` (1-based, for the header label)

- [ ] **Step 1: Write the failing tests**

Add to `src/components/workout/__tests__/BlockEditor.test.tsx` (new `describe` blocks after the existing one; note the existing `describe("BlockEditor catalog toggle", ...)` block's `render(<BlockEditor block={BLOCK} onChange={vi.fn()} onRemove={vi.fn()} />)` calls all need an `index={1}` prop added too — see Step 3's note on updating existing call sites):

```tsx
describe("BlockEditor — index header", () => {
  it("shows the 1-based block position and type in the header", () => {
    render(<BlockEditor block={BLOCK} index={2} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("BLOQUE 2 · AMRAP")).toBeInTheDocument();
  });
});

describe("BlockEditor — basic block type", () => {
  const BASIC_BLOCK: WorkoutBlock = {
    id: "block-2",
    type: "basic",
    durationSeconds: 0,
    workSeconds: 30,
    restSeconds: 10,
    rounds: 3,
    repsPerRound: 12,
    exercises: [{ id: "ex-1", name: "Sentadilla" }],
  };

  it("renders the 4 basic-specific labeled inputs with their current values", () => {
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByLabelText("Tiempo de ejercicio (seg)")).toHaveValue(30);
    expect(screen.getByLabelText("Tiempo de pausa (seg)")).toHaveValue(10);
    expect(screen.getByLabelText("Series")).toHaveValue(3);
    expect(screen.getByLabelText("Reps por serie")).toHaveValue(12);
  });

  it("calls onChange with the updated field when a basic input changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={onChange} onRemove={vi.fn()} />);

    await user.clear(screen.getByLabelText("Series"));
    await user.type(screen.getByLabelText("Series"), "5");

    expect(onChange).toHaveBeenLastCalledWith({ ...BASIC_BLOCK, rounds: 5 });
  });

  it("shows the computed total duration, not an editable field", () => {
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    // (30 + 10) * 3 = 120s = 2m
    expect(screen.getByText(/Tiempo total estimado: 2m/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Duración (segundos)")).not.toBeInTheDocument();
  });

  it("does not show the interval-style work/rest/rounds inputs for a basic block", () => {
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByLabelText("Segundos de trabajo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Rondas")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/workout/__tests__/BlockEditor.test.tsx`
Expected: FAIL — `index` prop doesn't exist yet (TypeScript error surfaces
as a test failure under Vitest's type-checked transform), no `"BLOQUE 2 ·
AMRAP"` text, no basic-specific labeled inputs.

- [ ] **Step 3: Update BlockEditor.tsx**

Replace `src/components/workout/BlockEditor.tsx` entirely:

```tsx
"use client";

import { useState } from "react";
import type { BlockType, WorkoutBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EXERCISE_CATALOG } from "@/lib/workout/exerciseCatalog";
import { CROSSFIT_CATALOG } from "@/lib/workout/exerciseCatalogCrossfit";
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "@/lib/workout/estimateWorkoutDurationSeconds";
import { ExerciseEditor } from "./ExerciseEditor";

const BLOCK_TYPES: BlockType[] = [
  "countdown",
  "countup",
  "amrap",
  "emom",
  "interval",
  "tabata",
  "forTime",
  "rest",
  "basic",
];

type CatalogKind = "gym" | "crossfit";

interface BlockEditorProps {
  block: WorkoutBlock;
  index: number;
  onChange: (block: WorkoutBlock) => void;
  onRemove: () => void;
  errors?: string[];
}

export function BlockEditor({ block, index, onChange, onRemove, errors = [] }: BlockEditorProps) {
  const [catalogKind, setCatalogKind] = useState<CatalogKind>("gym");
  const catalog = catalogKind === "gym" ? EXERCISE_CATALOG : CROSSFIT_CATALOG;
  const isBasic = block.type === "basic";
  const showWorkRest = !isBasic && (block.type === "interval" || block.type === "tabata" || block.type === "emom");
  const showDuration = !isBasic && !showWorkRest;
  const hasErrors = errors.length > 0;

  return (
    <Card className={`space-y-3 ${hasErrors ? "!border-danger-500" : ""}`}>
      <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
        BLOQUE {index} · {block.type.toUpperCase()}
      </p>

      <div className="flex items-center gap-2">
        <Select
          aria-label="Tipo de bloque"
          value={block.type}
          onChange={(e) => onChange({ ...block, type: e.target.value as BlockType })}
          className="flex-1"
        >
          {BLOCK_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.toUpperCase()}
            </option>
          ))}
        </Select>
        <Button variant="ghost" type="button" onClick={onRemove} aria-label="Quitar bloque">
          🗑
        </Button>
      </div>

      {showDuration && (
        <Input
          aria-label="Duración (segundos)"
          type="number"
          value={block.durationSeconds}
          onChange={(e) => onChange({ ...block, durationSeconds: Number(e.target.value) })}
          placeholder="Duración (segundos)"
        />
      )}

      {showWorkRest && (
        <div className="grid grid-cols-3 gap-2">
          <Input
            aria-label="Segundos de trabajo"
            type="number"
            value={block.workSeconds ?? ""}
            onChange={(e) => onChange({ ...block, workSeconds: Number(e.target.value) })}
            placeholder="Trabajo (s)"
          />
          <Input
            aria-label="Segundos de descanso"
            type="number"
            value={block.restSeconds ?? ""}
            onChange={(e) => onChange({ ...block, restSeconds: Number(e.target.value) })}
            placeholder="Descanso (s)"
          />
          <Input
            aria-label="Rondas"
            type="number"
            value={block.rounds ?? ""}
            onChange={(e) => onChange({ ...block, rounds: Number(e.target.value) })}
            placeholder="Rondas"
          />
        </div>
      )}

      {isBasic && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              aria-label="Tiempo de ejercicio (seg)"
              type="number"
              value={block.workSeconds ?? ""}
              onChange={(e) => onChange({ ...block, workSeconds: Number(e.target.value) })}
              placeholder="⏱ Tiempo de ejercicio (seg)"
            />
            <Input
              aria-label="Tiempo de pausa (seg)"
              type="number"
              value={block.restSeconds ?? ""}
              onChange={(e) => onChange({ ...block, restSeconds: Number(e.target.value) })}
              placeholder="⏸ Tiempo de pausa (seg)"
            />
            <Input
              aria-label="Series"
              type="number"
              value={block.rounds ?? ""}
              onChange={(e) => onChange({ ...block, rounds: Number(e.target.value) })}
              placeholder="🔁 Series"
            />
            <Input
              aria-label="Reps por serie"
              type="number"
              value={block.repsPerRound ?? ""}
              onChange={(e) => onChange({ ...block, repsPerRound: Number(e.target.value) })}
              placeholder="💪 Reps por serie"
            />
          </div>
          <p className="text-sm text-gray-400 font-tactical">
            Tiempo total estimado: {formatEstimateMinutes(estimateWorkoutDurationSeconds({ blocks: [block] } as never))}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          size="md"
          variant={catalogKind === "gym" ? "primary" : "secondary"}
          aria-pressed={catalogKind === "gym"}
          onClick={() => setCatalogKind("gym")}
        >
          Gimnasio
        </Button>
        <Button
          type="button"
          size="md"
          variant={catalogKind === "crossfit" ? "primary" : "secondary"}
          aria-pressed={catalogKind === "crossfit"}
          onClick={() => setCatalogKind("crossfit")}
        >
          CrossFit
        </Button>
      </div>

      <div className="space-y-2">
        {block.exercises.map((exercise) => (
          <ExerciseEditor
            key={exercise.id}
            exercise={exercise}
            catalog={catalog}
            onChange={(updated) =>
              onChange({
                ...block,
                exercises: block.exercises.map((ex) => (ex.id === exercise.id ? updated : ex)),
              })
            }
            onRemove={() =>
              onChange({ ...block, exercises: block.exercises.filter((ex) => ex.id !== exercise.id) })
            }
          />
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            onChange({
              ...block,
              exercises: [...block.exercises, { id: crypto.randomUUID(), name: catalog[0].name }],
            })
          }
        >
          + Agregar ejercicio
        </Button>
      </div>

      {hasErrors && (
        <ul className="text-danger-500 text-sm space-y-1">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
```

Note on the `estimateWorkoutDurationSeconds({ blocks: [block] } as never)`
call: `estimateWorkoutDurationSeconds` takes a full `Workout`, but only
reads `.blocks` — passing a single-block array through an `as never` cast
avoids fabricating the other required `Workout` fields (`id`/`name`/etc.)
just to satisfy the type checker for a value that's discarded anyway. This
is a deliberate, narrow use of `as never`, not a general escape hatch —
confirm it compiles cleanly in Step 4's typecheck; if the cast feels wrong
during implementation, an equally acceptable alternative is calling the
block-local formula directly (`((block.workSeconds ?? 0) + (block.restSeconds ?? 0)) * (block.rounds ?? 1)`)
instead of round-tripping through the workout-level function — either is
fine, pick whichever reads cleaner in the actual file.

Update the two existing test render calls in the `"BlockEditor catalog
toggle"` describe block (4 call sites) to add `index={1}`, e.g.:

```tsx
render(<BlockEditor block={BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run src/components/workout/__tests__/BlockEditor.test.tsx`
Expected: PASS (all tests, including the 4 existing catalog-toggle ones
with `index={1}` added, and the new index-header + basic-block tests)

Run: `npx tsc --noEmit -p .`
Expected: clean

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: PASS — `BlockEditor` is also used by `WorkoutBuilder`, which
Task 5 will update to pass `index`; until Task 5 lands, `WorkoutBuilder`
will fail to typecheck/build if it still calls `BlockEditor` without
`index`. If Step 4's `tsc` run surfaces that error, it's expected at this
point in the plan — Task 5 fixes it. Confirm the error (if any) is
specifically about the missing `index` prop in `WorkoutBuilder.tsx`, not
something else; if so, proceed to Task 5 immediately in the same session
before considering this task's typecheck gate satisfied end-to-end.

- [ ] **Step 6: Commit**

```bash
git add src/components/workout/BlockEditor.tsx src/components/workout/__tests__/BlockEditor.test.tsx
git commit -m "feat: BlockEditor supports basic blocks and shows a per-block index header"
```

---

### Task 5: WorkoutBuilder — header, live summary, pass index to BlockEditor

**Files:**
- Modify: `src/components/workout/WorkoutBuilder.tsx`
- Modify: `src/components/workout/__tests__/WorkoutBuilder.test.tsx`

**Interfaces:**
- Consumes: `BlockEditor` now requires `index: number` (Task 4); `countBlocksAndExercises` (existing, `src/lib/workout/countBlocksAndExercises.ts`); `estimateWorkoutDurationSeconds`/`formatEstimateMinutes` (Task 3)

- [ ] **Step 1: Write the failing tests**

Add to `src/components/workout/__tests__/WorkoutBuilder.test.tsx`:

```tsx
describe("WorkoutBuilder header and summary", () => {
  beforeEach(() => {
    pushMock.mockClear();
    window.localStorage.clear();
  });

  it("shows 'Nueva rutina' when there is no initial workout", () => {
    render(<WorkoutBuilder />);
    expect(screen.getByRole("heading", { name: "Nueva rutina" })).toBeInTheDocument();
  });

  it("shows 'Editar rutina' when editing an existing workout", () => {
    render(<WorkoutBuilder initialWorkout={validWorkout()} />);
    expect(screen.getByRole("heading", { name: "Editar rutina" })).toBeInTheDocument();
  });

  it("shows a live summary of blocks, exercises, and estimated duration", () => {
    render(<WorkoutBuilder initialWorkout={validWorkout()} />);
    // validWorkout(): 1 block (amrap, 600s), 1 exercise
    expect(screen.getByText(/1 bloque · 1 ejercicio · ~10m totales/)).toBeInTheDocument();
  });
});
```

(Note: `WorkoutBuilder` has no default export constructor for a bare `<WorkoutBuilder />` without `initialWorkout` in the existing test file — check the component's props interface; `initialWorkout` is already optional per `src/components/workout/WorkoutBuilder.tsx`'s current `WorkoutBuilderProps`, so `<WorkoutBuilder />` alone is valid.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/workout/__tests__/WorkoutBuilder.test.tsx`
Expected: FAIL — no heading exists yet, no summary line exists yet.

- [ ] **Step 3: Update WorkoutBuilder.tsx**

In `src/components/workout/WorkoutBuilder.tsx`, add an import:

```ts
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "@/lib/workout/estimateWorkoutDurationSeconds";
```

Change the return statement's opening to add a header, and add the summary
line before the save button. The full updated render section:

```tsx
  const estimatedSeconds = estimateWorkoutDurationSeconds(workout);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-white font-industrial">
        {initialWorkout ? "Editar rutina" : "Nueva rutina"}
      </h1>

      <Input
        aria-label="Nombre del entrenamiento"
        value={workout.name}
        onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
        placeholder="Nombre del entrenamiento (ej: Entrenamiento de Murph)"
      />

      {generalErrors.length > 0 && (
        <ul className="text-danger-500 text-sm space-y-1">
          {generalErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="space-y-3">
        {workout.blocks.map((block, index) => (
          <BlockEditor
            key={block.id}
            block={block}
            index={index + 1}
            errors={errors.filter((error) => error.blockId === block.id).map((error) => error.message)}
            onChange={(updated) =>
              setWorkout({
                ...workout,
                blocks: workout.blocks.map((b) => (b.id === block.id ? updated : b)),
              })
            }
            onRemove={() =>
              setWorkout({ ...workout, blocks: workout.blocks.filter((b) => b.id !== block.id) })
            }
          />
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => setWorkout({ ...workout, blocks: [...workout.blocks, emptyBlock()] })}
        >
          + Agregar bloque
        </Button>
      </div>

      <p className="text-sm text-gray-400 font-tactical">
        {counts.blocks} bloque{counts.blocks === 1 ? "" : "s"} · {counts.exercises} ejercicio
        {counts.exercises === 1 ? "" : "s"}
        {estimatedSeconds > 0 && ` · ~${formatEstimateMinutes(estimatedSeconds)} totales`}
      </p>

      <Button type="button" size="lg" onClick={handleSave} className="w-full">
        Guardar entrenamiento
      </Button>
    </div>
  );
```

This removes the old brief "{blocks} bloques · {exercises} ejercicios" line
that used to sit right under the name input (no test asserted its exact
text, so nothing breaks) and replaces it with a single richer summary line
— including the estimated duration — directly above the save button,
matching the spec's placement, instead of showing the same block/exercise
counts twice on one page. `index + 1` converts the 0-based `.map()` index
to the 1-based label `BlockEditor` expects.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/workout/__tests__/WorkoutBuilder.test.tsx src/components/workout/__tests__/BlockEditor.test.tsx`
Expected: PASS (all tests in both files — this confirms Task 4's dangling
`index` prop requirement is now satisfied)

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: PASS

Run: `npx tsc --noEmit -p .`
Expected: clean

- [ ] **Step 6: Commit**

```bash
git add src/components/workout/WorkoutBuilder.tsx src/components/workout/__tests__/WorkoutBuilder.test.tsx
git commit -m "feat: WorkoutBuilder shows a page header and a live build summary"
```

---

### Task 6: ExerciseListDisplay shows repsPerRound during the work phase

**Files:**
- Modify: `src/components/display/ExerciseListDisplay.tsx`
- Modify: `src/components/display/__tests__/ExerciseListDisplay.test.tsx`

**Interfaces:**
- Produces: `ExerciseListDisplay` gains an optional prop `phase?: WorkoutPhase`

- [ ] **Step 1: Write the failing tests**

Add to `src/components/display/__tests__/ExerciseListDisplay.test.tsx`:

```tsx
describe("ExerciseListDisplay reps line", () => {
  it("shows the reps-per-round line during the work phase when repsPerRound is set", () => {
    const block: WorkoutBlock = { ...BLOCK, type: "basic", repsPerRound: 12 };
    render(<ExerciseListDisplay block={block} phase="work" />);
    expect(screen.getByText("💪 12 REPS")).toBeInTheDocument();
  });

  it("hides the reps-per-round line during the rest phase", () => {
    const block: WorkoutBlock = { ...BLOCK, type: "basic", repsPerRound: 12 };
    render(<ExerciseListDisplay block={block} phase="rest" />);
    expect(screen.queryByText(/REPS/)).not.toBeInTheDocument();
  });

  it("hides the reps-per-round line when repsPerRound is not set", () => {
    render(<ExerciseListDisplay block={BLOCK} phase="work" />);
    expect(screen.queryByText(/REPS/)).not.toBeInTheDocument();
  });

  it("hides the reps-per-round line when phase is omitted (existing call sites unaffected)", () => {
    const block: WorkoutBlock = { ...BLOCK, type: "basic", repsPerRound: 12 };
    render(<ExerciseListDisplay block={block} />);
    expect(screen.queryByText(/REPS/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/display/__tests__/ExerciseListDisplay.test.tsx`
Expected: FAIL — no `phase` prop exists yet, no reps line renders.

- [ ] **Step 3: Update ExerciseListDisplay.tsx**

Replace `src/components/display/ExerciseListDisplay.tsx` entirely:

```tsx
import type { WorkoutBlock, WorkoutPhase } from "@/types";
import { formatExerciseLine } from "@/lib/workout/formatExerciseLine";
import { selectVisibleExercises } from "@/lib/workout/selectVisibleExercises";

interface ExerciseListDisplayProps {
  block: WorkoutBlock;
  phase?: WorkoutPhase;
}

export function ExerciseListDisplay({ block, phase }: ExerciseListDisplayProps) {
  if (block.type === "rest") return null;

  const { visible, overflowCount } = selectVisibleExercises(block.exercises);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      {visible.map((exercise, index) => (
        <p
          key={exercise.id}
          className="font-industrial text-3xl md:text-4xl uppercase tracking-tight leading-tight text-gray-300 text-center"
        >
          {index + 1}) {formatExerciseLine(exercise)}
        </p>
      ))}
      {overflowCount > 0 && (
        <p className="font-tactical text-sm uppercase tracking-widest text-gray-500 text-center">
          [ +{overflowCount} MÁS ]
        </p>
      )}
      {block.repsPerRound && phase === "work" && (
        <p className="font-tactical text-lg uppercase tracking-widest text-brand-500 text-center">
          💪 {block.repsPerRound} REPS
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/display/__tests__/ExerciseListDisplay.test.tsx`
Expected: PASS (all tests, including the 3 pre-existing numbering ones —
unaffected since `phase` is optional and those calls omit it)

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/display/ExerciseListDisplay.tsx src/components/display/__tests__/ExerciseListDisplay.test.tsx
git commit -m "feat: ExerciseListDisplay shows reps-per-round during the work phase"
```

---

### Task 7: DisplayScreen — round-color background, pass phase through

**Files:**
- Modify: `src/components/display/DisplayScreen.tsx`
- Modify: `src/components/display/__tests__/DisplayScreen.test.tsx`

**Interfaces:**
- Consumes: `ExerciseListDisplay`'s new `phase` prop (Task 6)

- [ ] **Step 1: Write the failing tests**

Add to `src/components/display/__tests__/DisplayScreen.test.tsx`:

```tsx
describe("DisplayScreen round background color", () => {
  it("uses the default background for a single-round workout", () => {
    const state = buildState({ totalRounds: 1, currentRound: 1 });
    const { container } = render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );
    expect(container.firstChild).toHaveClass("bg-surface-950");
  });

  it("cycles the background per round for multi-round workouts", () => {
    const round1 = buildState({ totalRounds: 4, currentRound: 1 });
    const { container: c1 } = render(
      <DisplayScreen state={round1} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );
    expect(c1.firstChild).toHaveClass("bg-surface-950");

    const round2 = buildState({ totalRounds: 4, currentRound: 2 });
    const { container: c2 } = render(
      <DisplayScreen state={round2} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );
    expect(c2.firstChild).toHaveClass("bg-emerald-950");

    const round5 = buildState({ totalRounds: 6, currentRound: 5 });
    const { container: c5 } = render(
      <DisplayScreen state={round5} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );
    // round 5 wraps back to index 0 of a 4-color palette: (5-1) % 4 = 0
    expect(c5.firstChild).toHaveClass("bg-surface-950");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/display/__tests__/DisplayScreen.test.tsx`
Expected: FAIL — the outer div always has `bg-surface-950` regardless of round.

- [ ] **Step 3: Update DisplayScreen.tsx**

In `src/components/display/DisplayScreen.tsx`, add above the component
function:

```ts
const ROUND_BACKGROUNDS = ["bg-surface-950", "bg-emerald-950", "bg-sky-950", "bg-amber-950", "bg-violet-950"];
```

Inside the component, after the existing `blockProgress` calculation, add:

```ts
  const background =
    state.totalRounds > 1
      ? ROUND_BACKGROUNDS[(state.currentRound - 1) % ROUND_BACKGROUNDS.length]
      : ROUND_BACKGROUNDS[0];
```

Change the outer `<div>`'s className from:

```tsx
    <div className="min-h-screen bg-surface-950 grid grid-rows-[auto_1fr_auto] gap-4 p-4 font-tactical">
```

to:

```tsx
    <div className={`min-h-screen ${background} grid grid-rows-[auto_1fr_auto] gap-4 p-4 font-tactical`}>
```

And pass `phase` through to `ExerciseListDisplay` (Task 6's new prop):

```tsx
        {currentBlock && <ExerciseListDisplay block={currentBlock} phase={state.currentPhase} />}
```

(replacing the existing `{currentBlock && <ExerciseListDisplay block={currentBlock} />}` line)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/display/__tests__/DisplayScreen.test.tsx`
Expected: PASS (all tests, including the 4 pre-existing progress-bar/block-indicator ones)

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: PASS — full count should be at or above the pre-Task-1 baseline
plus every test added across Tasks 2-7.

Run: `npx tsc --noEmit -p .`
Expected: clean

- [ ] **Step 6: Commit**

```bash
git add src/components/display/DisplayScreen.tsx src/components/display/__tests__/DisplayScreen.test.tsx
git commit -m "feat: Display cycles background color by round and shows the work-phase reps line"
```

---

## Post-plan verification

Per project convention, this is a UI-heavy change — do not report it
complete without exercising it in an actual browser:

1. `npm run dev`, open `/app/workouts/new` → confirm the header ("Nueva
   rutina"), per-block "BLOQUE N · TIPO" labels, and the live summary line
   update as blocks/exercises are added/removed.
2. Add a "Básico" block, set exercise/pausa/series/reps, confirm the
   "Tiempo total estimado" line updates live and matches the values typed.
3. Save a workout containing a "Básico" block, run it from `/app/workouts`,
   confirm the work→rest→next-round→finish cycle behaves like an interval
   block (audio/timer/phase transitions).
4. Open `/display` for that same session on a second tab/device, confirm:
   the background cycles color as rounds advance (for a workout with more
   than 1 round), the reps line ("💪 N REPS") shows during work phases and
   disappears during rest, and a single-round workout keeps the default
   dark background throughout.
