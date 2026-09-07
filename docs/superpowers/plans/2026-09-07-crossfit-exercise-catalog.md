# CrossFit Exercise Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second, CrossFit-specific exercise catalog (Weightlifting / Gymnastics / Monostructural/Cardio) that trainers can switch to per block via a toggle, alongside the existing generic gym catalog.

**Architecture:** A new static data file (`exerciseCatalogCrossfit.ts`) mirrors the shape of the existing `exerciseCatalog.ts` and reuses its `CatalogExercise` type and `groupCatalogByCategory` helper. `ExerciseEditor` stops importing a hardcoded catalog and instead receives one via a `catalog` prop. `BlockEditor` holds local toggle state (`"gym" | "crossfit"`) and passes the corresponding catalog down to every `ExerciseEditor` in that block.

**Tech Stack:** Next.js (App Router), React, TypeScript, Vitest + @testing-library/react + jsdom (already configured, not yet used for component tests in this repo).

## Global Constraints

- Movement names in the CrossFit catalog are technical English terms, unlocalized (e.g. "Clean & Jerk", not "Cargada y Envío") — this is the universal convention even in Spanish-speaking boxes.
- The toggle is transient UI state only: no changes to `WorkoutBlock`, `Exercise`, `validateWorkout.ts`, or localStorage.
- No changes to the existing generic catalog (`exerciseCatalog.ts`) or its categories.
- Spec reference: `docs/superpowers/specs/2026-09-07-crossfit-exercise-catalog-design.md`.

---

### Task 1: CrossFit catalog data

**Files:**
- Create: `src/lib/workout/exerciseCatalogCrossfit.ts`
- Test: `src/lib/workout/__tests__/exerciseCatalogCrossfit.test.ts`

**Interfaces:**
- Consumes: `CatalogExercise` type from `src/lib/workout/exerciseCatalog.ts` (existing: `{ id: string; name: string; category: string }`), `groupCatalogByCategory` from the same file (existing, unchanged).
- Produces: `CROSSFIT_CATALOG: CatalogExercise[]` — consumed by Task 3 (`BlockEditor`).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/workout/__tests__/exerciseCatalogCrossfit.test.ts
import { describe, it, expect } from "vitest";
import { CROSSFIT_CATALOG } from "../exerciseCatalogCrossfit";
import { groupCatalogByCategory } from "../exerciseCatalog";

const KNOWN_CATEGORIES = ["Weightlifting", "Gymnastics", "Monostructural/Cardio"];

describe("CROSSFIT_CATALOG", () => {
  it("has at least 40 exercises", () => {
    expect(CROSSFIT_CATALOG.length).toBeGreaterThanOrEqual(40);
  });

  it("has unique ids", () => {
    const ids = CROSSFIT_CATALOG.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses known categories", () => {
    for (const exercise of CROSSFIT_CATALOG) {
      expect(KNOWN_CATEGORIES).toContain(exercise.category);
    }
  });

  it("has a non-empty name for every exercise", () => {
    for (const exercise of CROSSFIT_CATALOG) {
      expect(exercise.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("groups into all three known categories with groupCatalogByCategory", () => {
    const grouped = groupCatalogByCategory(CROSSFIT_CATALOG);
    expect(Object.keys(grouped).sort()).toEqual([...KNOWN_CATEGORIES].sort());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- exerciseCatalogCrossfit`
Expected: FAIL with "Cannot find module '../exerciseCatalogCrossfit'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/workout/exerciseCatalogCrossfit.ts
import type { CatalogExercise } from "./exerciseCatalog";

export const CROSSFIT_CATALOG: CatalogExercise[] = [
  // Weightlifting
  { id: "cf-wl-01", name: "Back Squat", category: "Weightlifting" },
  { id: "cf-wl-02", name: "Front Squat", category: "Weightlifting" },
  { id: "cf-wl-03", name: "Overhead Squat", category: "Weightlifting" },
  { id: "cf-wl-04", name: "Deadlift", category: "Weightlifting" },
  { id: "cf-wl-05", name: "Sumo Deadlift High Pull", category: "Weightlifting" },
  { id: "cf-wl-06", name: "Clean", category: "Weightlifting" },
  { id: "cf-wl-07", name: "Power Clean", category: "Weightlifting" },
  { id: "cf-wl-08", name: "Hang Clean", category: "Weightlifting" },
  { id: "cf-wl-09", name: "Clean & Jerk", category: "Weightlifting" },
  { id: "cf-wl-10", name: "Snatch", category: "Weightlifting" },
  { id: "cf-wl-11", name: "Power Snatch", category: "Weightlifting" },
  { id: "cf-wl-12", name: "Hang Snatch", category: "Weightlifting" },
  { id: "cf-wl-13", name: "Thruster", category: "Weightlifting" },
  { id: "cf-wl-14", name: "Push Press", category: "Weightlifting" },
  { id: "cf-wl-15", name: "Push Jerk", category: "Weightlifting" },
  { id: "cf-wl-16", name: "Split Jerk", category: "Weightlifting" },

  // Gymnastics
  { id: "cf-gy-01", name: "Pull-up", category: "Gymnastics" },
  { id: "cf-gy-02", name: "Chest-to-Bar Pull-up", category: "Gymnastics" },
  { id: "cf-gy-03", name: "Muscle-up", category: "Gymnastics" },
  { id: "cf-gy-04", name: "Ring Dip", category: "Gymnastics" },
  { id: "cf-gy-05", name: "Handstand Push-up", category: "Gymnastics" },
  { id: "cf-gy-06", name: "Handstand Walk", category: "Gymnastics" },
  { id: "cf-gy-07", name: "Toes-to-Bar", category: "Gymnastics" },
  { id: "cf-gy-08", name: "Knees-to-Elbows", category: "Gymnastics" },
  { id: "cf-gy-09", name: "Pistol Squat", category: "Gymnastics" },
  { id: "cf-gy-10", name: "Air Squat", category: "Gymnastics" },
  { id: "cf-gy-11", name: "Push-up", category: "Gymnastics" },
  { id: "cf-gy-12", name: "Rope Climb", category: "Gymnastics" },
  { id: "cf-gy-13", name: "L-Sit", category: "Gymnastics" },
  { id: "cf-gy-14", name: "Ring Row", category: "Gymnastics" },
  { id: "cf-gy-15", name: "GHD Sit-up", category: "Gymnastics" },

  // Monostructural/Cardio
  { id: "cf-mo-01", name: "Row", category: "Monostructural/Cardio" },
  { id: "cf-mo-02", name: "Assault Bike", category: "Monostructural/Cardio" },
  { id: "cf-mo-03", name: "Ski Erg", category: "Monostructural/Cardio" },
  { id: "cf-mo-04", name: "Run", category: "Monostructural/Cardio" },
  { id: "cf-mo-05", name: "Double-Under", category: "Monostructural/Cardio" },
  { id: "cf-mo-06", name: "Single-Under", category: "Monostructural/Cardio" },
  { id: "cf-mo-07", name: "Burpee", category: "Monostructural/Cardio" },
  { id: "cf-mo-08", name: "Burpee Box Jump Over", category: "Monostructural/Cardio" },
  { id: "cf-mo-09", name: "Wall Ball Shot", category: "Monostructural/Cardio" },
  { id: "cf-mo-10", name: "Kettlebell Swing", category: "Monostructural/Cardio" },
  { id: "cf-mo-11", name: "Box Jump", category: "Monostructural/Cardio" },
  { id: "cf-mo-12", name: "Farmers Carry", category: "Monostructural/Cardio" },
  { id: "cf-mo-13", name: "Sled Push", category: "Monostructural/Cardio" },
  { id: "cf-mo-14", name: "Shuttle Run", category: "Monostructural/Cardio" },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- exerciseCatalogCrossfit`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/workout/exerciseCatalogCrossfit.ts src/lib/workout/__tests__/exerciseCatalogCrossfit.test.ts
git commit -m "feat: add CrossFit exercise catalog"
```

---

### Task 2: `ExerciseEditor` accepts an injected catalog

**Files:**
- Modify: `src/components/workout/ExerciseEditor.tsx`
- Test: `src/components/workout/__tests__/ExerciseEditor.test.tsx`

**Interfaces:**
- Consumes: `CatalogExercise` type and `groupCatalogByCategory` from `src/lib/workout/exerciseCatalog.ts` (existing, unchanged).
- Produces: `ExerciseEditor` now requires a `catalog: CatalogExercise[]` prop (breaking change to its existing props — Task 3 updates the only caller, `BlockEditor`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/workout/__tests__/ExerciseEditor.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseEditor } from "../ExerciseEditor";

const CATALOG = [
  { id: "a", name: "Back Squat", category: "Weightlifting" },
  { id: "b", name: "Pull-up", category: "Gymnastics" },
];

describe("ExerciseEditor", () => {
  it("renders <option>s from the catalog prop, grouped by category", () => {
    render(
      <ExerciseEditor
        exercise={{ id: "ex-1", name: "Back Squat" }}
        catalog={CATALOG}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const select = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((option) => option.value);
    expect(optionValues).toEqual(["Back Squat", "Pull-up"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ExerciseEditor`
Expected: FAIL — TypeScript error / prop mismatch, since `ExerciseEditor` doesn't accept a `catalog` prop yet and still imports `EXERCISE_CATALOG` internally.

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/workout/ExerciseEditor.tsx
"use client";

import type { Exercise } from "@/types";
import type { CatalogExercise } from "@/lib/workout/exerciseCatalog";
import { groupCatalogByCategory } from "@/lib/workout/exerciseCatalog";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ExerciseEditorProps {
  exercise: Exercise;
  catalog: CatalogExercise[];
  onChange: (exercise: Exercise) => void;
  onRemove: () => void;
}

export function ExerciseEditor({ exercise, catalog, onChange, onRemove }: ExerciseEditorProps) {
  const catalogByCategory = groupCatalogByCategory(catalog);

  return (
    <div className="grid grid-cols-2 gap-2 items-end border-t border-surface-800 pt-2 first:border-t-0 first:pt-0">
      <Select
        aria-label="Ejercicio"
        value={exercise.name}
        onChange={(e) => onChange({ ...exercise, name: e.target.value })}
        className="col-span-2"
      >
        {Object.entries(catalogByCategory).map(([category, exercises]) => (
          <optgroup key={category} label={category}>
            {exercises.map((catalogExercise) => (
              <option key={catalogExercise.id} value={catalogExercise.name}>
                {catalogExercise.name}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <Input
        aria-label="Reps"
        type="number"
        value={exercise.reps ?? ""}
        onChange={(e) =>
          onChange({ ...exercise, reps: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder="Reps"
      />
      <Input
        aria-label="Series"
        type="number"
        value={exercise.sets ?? ""}
        onChange={(e) =>
          onChange({ ...exercise, sets: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder="Series"
      />
      <Input
        aria-label="Peso (kg)"
        type="number"
        value={exercise.weightKg ?? ""}
        onChange={(e) =>
          onChange({ ...exercise, weightKg: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder="Peso (kg)"
      />
      <Input
        aria-label="Notas"
        value={exercise.notes ?? ""}
        onChange={(e) => onChange({ ...exercise, notes: e.target.value || undefined })}
        placeholder="Notas"
      />
      <Button
        variant="ghost"
        size="md"
        type="button"
        onClick={onRemove}
        aria-label="Quitar ejercicio"
        className="col-span-2 justify-self-start"
      >
        ✕ Quitar ejercicio
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ExerciseEditor`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/components/workout/ExerciseEditor.tsx src/components/workout/__tests__/ExerciseEditor.test.tsx
git commit -m "refactor: inject catalog into ExerciseEditor via prop"
```

---

### Task 3: `BlockEditor` toggle between Gimnasio and CrossFit

**Files:**
- Modify: `src/components/workout/BlockEditor.tsx`
- Test: `src/components/workout/__tests__/BlockEditor.test.tsx`

**Interfaces:**
- Consumes: `EXERCISE_CATALOG` from `src/lib/workout/exerciseCatalog.ts` (existing), `CROSSFIT_CATALOG` from `src/lib/workout/exerciseCatalogCrossfit.ts` (Task 1), `ExerciseEditor` with its new `catalog` prop (Task 2).
- Produces: no new exports — `BlockEditor`'s public props (`BlockEditorProps`) are unchanged.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/workout/__tests__/BlockEditor.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockEditor } from "../BlockEditor";
import type { WorkoutBlock } from "@/types";

const BLOCK: WorkoutBlock = {
  id: "block-1",
  type: "amrap",
  durationSeconds: 600,
  exercises: [{ id: "ex-1", name: "Sentadilla" }],
};

describe("BlockEditor catalog toggle", () => {
  it("defaults to the Gimnasio catalog", () => {
    render(<BlockEditor block={BLOCK} onChange={vi.fn()} onRemove={vi.fn()} />);
    const select = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((option) => option.value);
    expect(optionValues).toContain("Sentadilla");
    expect(optionValues).not.toContain("Back Squat");
  });

  it("switches to the CrossFit catalog when the toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<BlockEditor block={BLOCK} onChange={vi.fn()} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "CrossFit" }));

    const select = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((option) => option.value);
    expect(optionValues).toContain("Back Squat");
    expect(optionValues).not.toContain("Sentadilla");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- BlockEditor`
Expected: FAIL — no button named "CrossFit" exists yet, and `ExerciseEditor` (rendered inside `BlockEditor`) still receives no `catalog` prop, causing a TypeScript error at build.

Note: if `@testing-library/user-event` is not yet a dependency, add it first:
```bash
npm install -D @testing-library/user-event
```

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/workout/BlockEditor.tsx
"use client";

import { useState } from "react";
import type { BlockType, WorkoutBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EXERCISE_CATALOG } from "@/lib/workout/exerciseCatalog";
import { CROSSFIT_CATALOG } from "@/lib/workout/exerciseCatalogCrossfit";
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
];

type CatalogKind = "gym" | "crossfit";

interface BlockEditorProps {
  block: WorkoutBlock;
  onChange: (block: WorkoutBlock) => void;
  onRemove: () => void;
  errors?: string[];
}

export function BlockEditor({ block, onChange, onRemove, errors = [] }: BlockEditorProps) {
  const [catalogKind, setCatalogKind] = useState<CatalogKind>("gym");
  const catalog = catalogKind === "gym" ? EXERCISE_CATALOG : CROSSFIT_CATALOG;
  const showWorkRest = block.type === "interval" || block.type === "tabata" || block.type === "emom";
  const showDuration = !showWorkRest;
  const hasErrors = errors.length > 0;

  return (
    <Card className={`space-y-3 ${hasErrors ? "!border-danger-500" : ""}`}>
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

      <div className="flex gap-2">
        <Button
          type="button"
          size="md"
          variant={catalogKind === "gym" ? "primary" : "secondary"}
          onClick={() => setCatalogKind("gym")}
        >
          Gimnasio
        </Button>
        <Button
          type="button"
          size="md"
          variant={catalogKind === "crossfit" ? "primary" : "secondary"}
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- BlockEditor`
Expected: PASS (2 tests)

- [ ] **Step 5: Run the full suite to catch regressions**

Run: `npm test`
Expected: PASS — all existing tests (including `exerciseCatalog.test.ts`, `validateWorkout.test.ts`, `selectVisibleExercises.test.ts`, `formatExerciseLine.test.ts`, `countBlocksAndExercises.test.ts`) still pass unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/components/workout/BlockEditor.tsx src/components/workout/__tests__/BlockEditor.test.tsx
git commit -m "feat: add Gimnasio/CrossFit catalog toggle to BlockEditor"
```

---

### Task 4: Manual verification in the browser

**Files:** none (manual QA step, no code changes).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Exercise the golden path**

Navigate to `/app/workouts/new` (or edit an existing workout), add a block, and confirm:
1. The block shows a "Gimnasio" / "CrossFit" toggle, defaulting to "Gimnasio".
2. Adding an exercise while on "Gimnasio" shows the existing Spanish catalog (Piernas, Pecho, etc.) in the `<Select>`.
3. Clicking "CrossFit" changes the `<Select>` options to the English movement names grouped under "Weightlifting", "Gymnastics", "Monostructural/Cardio".
4. Toggling back to "Gimnasio" and reloading the page resets the toggle to "Gimnasio" (confirms it's not persisted), while any already-saved exercises in the block keep their previously chosen name regardless of the catalog shown.
5. "+ Agregar ejercicio" while on "CrossFit" adds a new exercise pre-filled with the first CrossFit catalog entry ("Back Squat"), not the gym one.

- [ ] **Step 3: Stop the dev server**

Kill the `npm run dev` process once verification is complete.

---

## Plan Self-Review

**Spec coverage:**
- §2 (data) → Task 1.
- §3 (toggle, transient state) → Task 3.
- §4 (`ExerciseEditor` prop change) → Task 2.
- §5 out-of-scope items (no mixing catalogs, no persistence, no translation, no RX fields, no benchmark WOD templates, no changes to generic catalog) → none of Tasks 1–4 touch them; confirmed by inspection of the diffs above.

**Placeholder scan:** No TBD/TODO, no "add appropriate X" phrasing — all code blocks are complete and copy-pasteable.

**Type consistency:** `CatalogExercise` used identically across Tasks 1–3 (`{ id, name, category }`, imported from `exerciseCatalog.ts` everywhere, never redefined). `ExerciseEditorProps.catalog` (Task 2) matches the `catalog` prop passed in Task 3's `BlockEditor`. `CatalogKind` (`"gym" | "crossfit"`) is local to `BlockEditor`, not exported, so no cross-task naming risk.
