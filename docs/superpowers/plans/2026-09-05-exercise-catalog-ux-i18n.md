# Catálogo de ejercicios, Display, UX y localización — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `sets` field and static exercise catalog to the workout data model, show the current block's exercises on the Display, fix six concrete UX gaps (confirmations, CTA, counters, error association, copy-code, connection indicator), and localize all user-visible text to Spanish.

**Architecture:** Pure, independently testable helper functions (`exerciseCatalog.ts`, `countBlocksAndExercises.ts`, `formatExerciseLine.ts`, `selectVisibleExercises.ts`, the restructured `validateWorkout.ts`) are built and unit-tested first, then wired into existing components. Component/page edits that only relabel text or add a `Modal`/CTA with no new pure logic skip the TDD ceremony and are implemented + manually verified. No changes to `WorkoutEngine`, `TimerEngine`, `SessionChannel`, or `AudioManager`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, vitest + @testing-library/react (jsdom), existing `ui/` primitives (`Button`, `Card`, `Input`, `Select`, `Modal`).

## Global Constraints

- Conventional commits, no `Co-Authored-By` / AI attribution in any commit message.
- `Exercise` gains exactly one new field, `sets?: number`; `timeSeconds`/`distanceMeters` are untouched.
- No validation is added for `sets`, `weightKg`, or `notes` — they stay optional, no business rules.
- No change to `WorkoutEngine` — `currentExerciseIndex` stays hardcoded to `0`; Display renders the full exercise list of `state.workout.blocks[state.currentBlockIndex]` instead of a single "active exercise."
- Exercise list line format: `NOMBRE · Nreps · Sseries · Pkg`, omitting any segment whose field is unset — never `· undefined` or `· 0kg`.
- Exercise list hidden entirely when the current block's `type === "rest"`.
- Exercise list shows at most 4 lines; beyond that, truncate with a "+N más" indicator (no scrolling, no smaller font).
- Timer stays the dominant visual element (~10rem+); exercise list lines are visibly smaller (~2.5–3rem).
- i18n scope is strictly user-visible text (labels, placeholders, aria-labels, headings, button text). Code identifiers, types, and variable names stay in English. `validateWorkout.ts` error message strings are explicitly out of scope for this cycle (not listed in the design spec's i18n file table) — only their new `blockId` association is added.
- No custom "other exercise" free-text escape hatch in the catalog select — closed catalog only.
- Every new pure function lives under `src/lib/workout/` and has a matching test under `src/lib/workout/__tests__/`.

---

### Task 1: Exercise `sets` field + static exercise catalog

**Files:**
- Modify: `src/types/workout.ts` (add `sets?: number` to `Exercise`)
- Create: `src/lib/workout/exerciseCatalog.ts`
- Test: `src/lib/workout/__tests__/exerciseCatalog.test.ts`

**Interfaces:**
- Consumes: nothing new (pure data module)
- Produces: `interface CatalogExercise { id: string; name: string; category: string }`, `const EXERCISE_CATALOG: CatalogExercise[]`, `function groupCatalogByCategory(catalog: CatalogExercise[]): Record<string, CatalogExercise[]>` — both used by Task 2 and Task 3.

- [ ] **Step 1: Write the failing test**
```ts
// src/lib/workout/__tests__/exerciseCatalog.test.ts
import { describe, it, expect } from "vitest";
import { EXERCISE_CATALOG, groupCatalogByCategory } from "../exerciseCatalog";

const KNOWN_CATEGORIES = [
  "Piernas",
  "Pecho",
  "Espalda",
  "Core",
  "Cardio/Funcional",
  "Hombros/Brazos",
];

describe("EXERCISE_CATALOG", () => {
  it("has at least 40 exercises", () => {
    expect(EXERCISE_CATALOG.length).toBeGreaterThanOrEqual(40);
  });

  it("has unique ids", () => {
    const ids = EXERCISE_CATALOG.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses known categories", () => {
    for (const exercise of EXERCISE_CATALOG) {
      expect(KNOWN_CATEGORIES).toContain(exercise.category);
    }
  });

  it("has a non-empty name for every exercise", () => {
    for (const exercise of EXERCISE_CATALOG) {
      expect(exercise.name.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("groupCatalogByCategory", () => {
  it("groups exercises under their category key", () => {
    const catalog = [
      { id: "a", name: "Sentadilla", category: "Piernas" },
      { id: "b", name: "Press banca", category: "Pecho" },
      { id: "c", name: "Zancada", category: "Piernas" },
    ];
    const grouped = groupCatalogByCategory(catalog);
    expect(Object.keys(grouped)).toEqual(["Piernas", "Pecho"]);
    expect(grouped["Piernas"].map((e) => e.id)).toEqual(["a", "c"]);
    expect(grouped["Pecho"].map((e) => e.id)).toEqual(["b"]);
  });

  it("returns an empty object for an empty catalog", () => {
    expect(groupCatalogByCategory([])).toEqual({});
  });
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run src/lib/workout/__tests__/exerciseCatalog.test.ts`
Expected: FAIL with "Cannot find module '../exerciseCatalog'" (file does not exist yet)
- [ ] **Step 3: Write minimal implementation**

First, add `sets` to `src/types/workout.ts`:
```ts
export interface Exercise {
  id: string;
  name: string;
  reps?: number;
  sets?: number;
  timeSeconds?: number;
  distanceMeters?: number;
  weightKg?: number;
  notes?: string;
}
```

Then create `src/lib/workout/exerciseCatalog.ts`:
```ts
export interface CatalogExercise {
  id: string;
  name: string;
  category: string;
}

export const EXERCISE_CATALOG: CatalogExercise[] = [
  // Piernas
  { id: "leg-01", name: "Sentadilla", category: "Piernas" },
  { id: "leg-02", name: "Sentadilla búlgara", category: "Piernas" },
  { id: "leg-03", name: "Zancada", category: "Piernas" },
  { id: "leg-04", name: "Peso muerto", category: "Piernas" },
  { id: "leg-05", name: "Peso muerto rumano", category: "Piernas" },
  { id: "leg-06", name: "Hip thrust", category: "Piernas" },
  { id: "leg-07", name: "Prensa de piernas", category: "Piernas" },
  { id: "leg-08", name: "Elevación de talones", category: "Piernas" },
  { id: "leg-09", name: "Sentadilla goblet", category: "Piernas" },
  { id: "leg-10", name: "Step up", category: "Piernas" },

  // Pecho
  { id: "chest-01", name: "Press banca", category: "Pecho" },
  { id: "chest-02", name: "Press banca inclinado", category: "Pecho" },
  { id: "chest-03", name: "Flexiones de brazos", category: "Pecho" },
  { id: "chest-04", name: "Aperturas con mancuernas", category: "Pecho" },
  { id: "chest-05", name: "Fondos en paralelas", category: "Pecho" },
  { id: "chest-06", name: "Press con mancuernas", category: "Pecho" },
  { id: "chest-07", name: "Cruce de poleas", category: "Pecho" },
  { id: "chest-08", name: "Flexiones declinadas", category: "Pecho" },

  // Espalda
  { id: "back-01", name: "Dominadas", category: "Espalda" },
  { id: "back-02", name: "Remo con barra", category: "Espalda" },
  { id: "back-03", name: "Remo con mancuerna", category: "Espalda" },
  { id: "back-04", name: "Jalón al pecho", category: "Espalda" },
  { id: "back-05", name: "Peso muerto sumo", category: "Espalda" },
  { id: "back-06", name: "Remo en polea baja", category: "Espalda" },
  { id: "back-07", name: "Face pull", category: "Espalda" },
  { id: "back-08", name: "Superman", category: "Espalda" },

  // Core
  { id: "core-01", name: "Plancha", category: "Core" },
  { id: "core-02", name: "Abdominales", category: "Core" },
  { id: "core-03", name: "Elevación de piernas", category: "Core" },
  { id: "core-04", name: "Russian twist", category: "Core" },
  { id: "core-05", name: "Plancha lateral", category: "Core" },
  { id: "core-06", name: "Mountain climbers", category: "Core" },
  { id: "core-07", name: "Rueda abdominal", category: "Core" },
  { id: "core-08", name: "Hollow hold", category: "Core" },

  // Cardio/Funcional
  { id: "cardio-01", name: "Burpees", category: "Cardio/Funcional" },
  { id: "cardio-02", name: "Jumping jacks", category: "Cardio/Funcional" },
  { id: "cardio-03", name: "Cuerda para saltar", category: "Cardio/Funcional" },
  { id: "cardio-04", name: "Remo (máquina)", category: "Cardio/Funcional" },
  { id: "cardio-05", name: "Wall balls", category: "Cardio/Funcional" },
  { id: "cardio-06", name: "Kettlebell swing", category: "Cardio/Funcional" },
  { id: "cardio-07", name: "Box jump", category: "Cardio/Funcional" },
  { id: "cardio-08", name: "Sprint", category: "Cardio/Funcional" },

  // Hombros/Brazos
  { id: "arms-01", name: "Press militar", category: "Hombros/Brazos" },
  { id: "arms-02", name: "Elevaciones laterales", category: "Hombros/Brazos" },
  { id: "arms-03", name: "Curl de bíceps", category: "Hombros/Brazos" },
  { id: "arms-04", name: "Extensión de tríceps", category: "Hombros/Brazos" },
  { id: "arms-05", name: "Press Arnold", category: "Hombros/Brazos" },
  { id: "arms-06", name: "Elevaciones frontales", category: "Hombros/Brazos" },
  { id: "arms-07", name: "Curl martillo", category: "Hombros/Brazos" },
  { id: "arms-08", name: "Fondos de tríceps en banco", category: "Hombros/Brazos" },
];

export function groupCatalogByCategory(
  catalog: CatalogExercise[]
): Record<string, CatalogExercise[]> {
  return catalog.reduce<Record<string, CatalogExercise[]>>((acc, exercise) => {
    if (!acc[exercise.category]) acc[exercise.category] = [];
    acc[exercise.category].push(exercise);
    return acc;
  }, {});
}
```
- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run src/lib/workout/__tests__/exerciseCatalog.test.ts`
Expected: PASS (6 tests)
- [ ] **Step 5: Commit**
```bash
git add src/types/workout.ts src/lib/workout/exerciseCatalog.ts src/lib/workout/__tests__/exerciseCatalog.test.ts
git commit -m "feat: add sets field to Exercise and static exercise catalog"
```

---

### Task 2: `ExerciseEditor` rework — catalog select, sets/weight/notes, grid layout, Spanish labels

**Files:**
- Modify: `src/components/workout/ExerciseEditor.tsx` (full rewrite)

**Interfaces:**
- Consumes: `EXERCISE_CATALOG`, `groupCatalogByCategory` from Task 1 (`@/lib/workout/exerciseCatalog`); `Exercise` type (`sets` field from Task 1)
- Produces: no new exports — `ExerciseEditor` keeps its existing `{ exercise, onChange, onRemove }` props, consumed unchanged by `BlockEditor`

This is a pure UI/JSX rework (new fields + relabeling) with no new pure logic — implement + manually verify, no TDD ceremony.

- [ ] **Step 1: Implement**
```tsx
// src/components/workout/ExerciseEditor.tsx
"use client";

import type { Exercise } from "@/types";
import { EXERCISE_CATALOG, groupCatalogByCategory } from "@/lib/workout/exerciseCatalog";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ExerciseEditorProps {
  exercise: Exercise;
  onChange: (exercise: Exercise) => void;
  onRemove: () => void;
}

const CATALOG_BY_CATEGORY = groupCatalogByCategory(EXERCISE_CATALOG);

export function ExerciseEditor({ exercise, onChange, onRemove }: ExerciseEditorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 items-end border-t border-surface-800 pt-2 first:border-t-0 first:pt-0">
      <Select
        aria-label="Ejercicio"
        value={exercise.name}
        onChange={(e) => onChange({ ...exercise, name: e.target.value })}
        className="col-span-2"
      >
        {Object.entries(CATALOG_BY_CATEGORY).map(([category, exercises]) => (
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
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/app/workouts/new`, confirm the exercise row shows a categorized dropdown (optgroups: Piernas, Pecho, Espalda, Core, Cardio/Funcional, Hombros/Brazos) plus Reps/Series/Peso (kg)/Notas inputs laid out in a 2-column grid, and the "Quitar ejercicio" button removes the row.
- [ ] **Step 3: Commit**
```bash
git add src/components/workout/ExerciseEditor.tsx
git commit -m "feat: rework ExerciseEditor with exercise catalog select and sets/weight/notes fields"
```

---

### Task 3: `BlockEditor` — catalog-driven default exercise + Spanish labels

**Files:**
- Modify: `src/components/workout/BlockEditor.tsx`

**Interfaces:**
- Consumes: `EXERCISE_CATALOG` from Task 1 (`@/lib/workout/exerciseCatalog`)
- Produces: no new exports — `BlockEditor` keeps its existing `{ block, onChange, onRemove }` props (a fourth optional `errors` prop is added in Task 7)

Pure UI relabeling + one default-value change — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/components/workout/BlockEditor.tsx
"use client";

import type { BlockType, WorkoutBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EXERCISE_CATALOG } from "@/lib/workout/exerciseCatalog";
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

interface BlockEditorProps {
  block: WorkoutBlock;
  onChange: (block: WorkoutBlock) => void;
  onRemove: () => void;
}

export function BlockEditor({ block, onChange, onRemove }: BlockEditorProps) {
  const showWorkRest = block.type === "interval" || block.type === "tabata" || block.type === "emom";
  const showDuration = !showWorkRest;

  return (
    <Card className="space-y-3">
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

      <div className="space-y-2">
        {block.exercises.map((exercise) => (
          <ExerciseEditor
            key={exercise.id}
            exercise={exercise}
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
              exercises: [...block.exercises, { id: crypto.randomUUID(), name: EXERCISE_CATALOG[0].name }],
            })
          }
        >
          + Agregar ejercicio
        </Button>
      </div>
    </Card>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/app/workouts/new`, click "+ Agregar ejercicio" and confirm the new row is pre-selected to the catalog's first exercise ("Sentadilla") instead of a blank name; confirm block type/duration/work-rest-rounds labels are in Spanish.
- [ ] **Step 3: Commit**
```bash
git add src/components/workout/BlockEditor.tsx
git commit -m "feat: default new exercises to the catalog and localize BlockEditor labels"
```

---

### Task 4: `countBlocksAndExercises` pure function

**Files:**
- Create: `src/lib/workout/countBlocksAndExercises.ts`
- Test: `src/lib/workout/__tests__/countBlocksAndExercises.test.ts`

**Interfaces:**
- Consumes: `Workout` type (`@/types`)
- Produces: `function countBlocksAndExercises(workout: Workout): { blocks: number; exercises: number }` — consumed by Task 6 (`WorkoutBuilder`)

- [ ] **Step 1: Write the failing test**
```ts
// src/lib/workout/__tests__/countBlocksAndExercises.test.ts
import { describe, it, expect } from "vitest";
import { countBlocksAndExercises } from "../countBlocksAndExercises";
import type { Workout } from "@/types";

function workoutWith(blocks: Workout["blocks"]): Workout {
  return {
    id: "w1",
    name: "Test",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks,
  };
}

describe("countBlocksAndExercises", () => {
  it("counts zero blocks and zero exercises for an empty workout", () => {
    expect(countBlocksAndExercises(workoutWith([]))).toEqual({ blocks: 0, exercises: 0 });
  });

  it("counts blocks and sums exercises across all blocks", () => {
    const workout = workoutWith([
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 600,
        exercises: [
          { id: "e1", name: "Burpees" },
          { id: "e2", name: "Sentadilla" },
        ],
      },
      {
        id: "b2",
        type: "forTime",
        durationSeconds: 0,
        exercises: [{ id: "e3", name: "Remo" }],
      },
    ]);
    expect(countBlocksAndExercises(workout)).toEqual({ blocks: 2, exercises: 3 });
  });
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run src/lib/workout/__tests__/countBlocksAndExercises.test.ts`
Expected: FAIL with "Cannot find module '../countBlocksAndExercises'"
- [ ] **Step 3: Write minimal implementation**
```ts
// src/lib/workout/countBlocksAndExercises.ts
import type { Workout } from "@/types";

export function countBlocksAndExercises(workout: Workout): { blocks: number; exercises: number } {
  return {
    blocks: workout.blocks.length,
    exercises: workout.blocks.reduce((sum, block) => sum + block.exercises.length, 0),
  };
}
```
- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run src/lib/workout/__tests__/countBlocksAndExercises.test.ts`
Expected: PASS (2 tests)
- [ ] **Step 5: Commit**
```bash
git add src/lib/workout/countBlocksAndExercises.ts src/lib/workout/__tests__/countBlocksAndExercises.test.ts
git commit -m "feat: add countBlocksAndExercises helper"
```

---

### Task 5: `validateWorkout` — restructure to `ValidationError[]` with `blockId`

**Files:**
- Modify: `src/lib/workout/validateWorkout.ts`
- Test: `src/lib/workout/__tests__/validateWorkout.test.ts` (full rewrite)

**Interfaces:**
- Consumes: `Workout`/`WorkoutBlock` types (`@/types`)
- Produces: `interface ValidationError { message: string; blockId?: string }`, `function validateWorkout(workout: Workout): ValidationError[]` — consumed by Task 6 (`WorkoutBuilder`) and Task 7 (`BlockEditor`)

Error message text stays in English (out of i18n scope per the design spec's file table — see Global Constraints); only the return shape changes to carry `blockId`.

- [ ] **Step 1: Write the failing test**
```ts
// src/lib/workout/__tests__/validateWorkout.test.ts
import { describe, it, expect } from "vitest";
import { validateWorkout } from "../validateWorkout";
import type { Workout } from "@/types";

function baseWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: "w1",
    name: "Fran",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 0,
        exercises: [{ id: "e1", name: "Thrusters", reps: 21 }],
      },
    ],
    ...overrides,
  };
}

describe("validateWorkout", () => {
  it("accepts a valid workout with no errors", () => {
    expect(validateWorkout(baseWorkout())).toEqual([]);
  });

  it("requires a name", () => {
    const errors = validateWorkout(baseWorkout({ name: "" }));
    expect(errors).toContainEqual({ message: "Name is required" });
  });

  it("requires at least one block", () => {
    const errors = validateWorkout(baseWorkout({ blocks: [] }));
    expect(errors).toContainEqual({ message: "Add at least one block" });
  });

  it("rejects a block with rounds <= 0 and attaches the block id", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "interval",
          durationSeconds: 0,
          workSeconds: 20,
          restSeconds: 10,
          rounds: 0,
          exercises: [{ id: "e1", name: "Row" }],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Rounds must be greater than 0",
      blockId: "b1",
    });
  });

  it("rejects a block with no exercises and attaches the block id", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "amrap", durationSeconds: 600, exercises: [] }],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Each block needs at least one exercise",
      blockId: "b1",
    });
  });
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run src/lib/workout/__tests__/validateWorkout.test.ts`
Expected: FAIL — `toContainEqual({ message: "Name is required" })` fails because `validateWorkout` still returns plain strings (`"Name is required"`), not `{ message, blockId? }` objects
- [ ] **Step 3: Write minimal implementation**
```ts
// src/lib/workout/validateWorkout.ts
import type { Workout } from "@/types";

export interface ValidationError {
  message: string;
  blockId?: string;
}

export function validateWorkout(workout: Workout): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!workout.name.trim()) {
    errors.push({ message: "Name is required" });
  }

  if (workout.blocks.length === 0) {
    errors.push({ message: "Add at least one block" });
  }

  for (const block of workout.blocks) {
    if (block.exercises.length === 0) {
      errors.push({ message: "Each block needs at least one exercise", blockId: block.id });
    }
    const needsRounds = block.type === "interval" || block.type === "tabata" || block.type === "emom";
    if (needsRounds && (block.rounds ?? 0) <= 0) {
      errors.push({ message: "Rounds must be greater than 0", blockId: block.id });
    }
  }

  return errors;
}
```
- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run src/lib/workout/__tests__/validateWorkout.test.ts`
Expected: PASS (5 tests)
- [ ] **Step 5: Commit**
```bash
git add src/lib/workout/validateWorkout.ts src/lib/workout/__tests__/validateWorkout.test.ts
git commit -m "feat: attach blockId to validateWorkout errors"
```

---

### Task 6: `WorkoutBuilder` — wire block/exercise counter and per-block errors, Spanish labels

**Files:**
- Modify: `src/components/workout/WorkoutBuilder.tsx` (full rewrite)

**Interfaces:**
- Consumes: `countBlocksAndExercises` (Task 4), `validateWorkout`/`ValidationError` (Task 5), `BlockEditor` with its new optional `errors?: string[]` prop (produced in Task 7 — this task passes that prop; Task 7 makes `BlockEditor` render it)
- Produces: no new exports

Pure UI wiring of already-tested pure functions — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/components/workout/WorkoutBuilder.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Workout, WorkoutBlock } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { validateWorkout, type ValidationError } from "@/lib/workout/validateWorkout";
import { countBlocksAndExercises } from "@/lib/workout/countBlocksAndExercises";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BlockEditor } from "./BlockEditor";

function emptyBlock(): WorkoutBlock {
  return { id: crypto.randomUUID(), type: "amrap", durationSeconds: 600, exercises: [] };
}

interface WorkoutBuilderProps {
  initialWorkout?: Workout;
}

export function WorkoutBuilder({ initialWorkout }: WorkoutBuilderProps) {
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout>(
    initialWorkout ?? {
      id: crypto.randomUUID(),
      name: "",
      createdAt: new Date().toISOString(),
      favorite: false,
      blocks: [emptyBlock()],
    }
  );
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const counts = countBlocksAndExercises(workout);
  const generalErrors = errors.filter((error) => !error.blockId).map((error) => error.message);

  function handleSave() {
    const validationErrors = validateWorkout(workout);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    const repo = new LocalWorkoutRepository();
    const result = repo.save(workout);
    if (!result.ok) {
      setErrors([{ message: result.error.message }]);
      return;
    }
    router.push("/app/workouts");
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Input
        aria-label="Nombre del entrenamiento"
        value={workout.name}
        onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
        placeholder="Nombre del entrenamiento (ej: Entrenamiento de Murph)"
      />

      <p className="text-sm text-gray-400">
        {counts.blocks} bloques · {counts.exercises} ejercicios
      </p>

      {generalErrors.length > 0 && (
        <ul className="text-danger-500 text-sm space-y-1">
          {generalErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="space-y-3">
        {workout.blocks.map((block) => (
          <BlockEditor
            key={block.id}
            block={block}
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

      <Button type="button" size="lg" onClick={handleSave} className="w-full">
        Guardar entrenamiento
      </Button>
    </div>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/app/workouts/new`. Confirm the header shows "1 bloques · 0 ejercicios" and updates live as blocks/exercises are added. Try saving with an interval block with `rounds = 0` and no exercises — confirm the specific error messages appear (still in English text, per scope) but note this is deferred to Task 7 for the visual block association; confirm the empty-name error still appears in the top list. Confirm TypeScript compiles: `npx tsc --noEmit`.
- [ ] **Step 3: Commit**
```bash
git add src/components/workout/WorkoutBuilder.tsx
git commit -m "feat: show block/exercise counter and split general vs per-block validation errors in WorkoutBuilder"
```

---

### Task 7: `BlockEditor` — visual error association (red border + inline messages)

**Files:**
- Modify: `src/components/workout/BlockEditor.tsx` (adds `errors` prop to the Task 3 version)

**Interfaces:**
- Consumes: `errors?: string[]` passed by `WorkoutBuilder` (Task 6)
- Produces: `BlockEditorProps` now includes `errors?: string[]`

Pure UI — implement + manually verify.

- [ ] **Step 1: Implement**
Apply this diff to `src/components/workout/BlockEditor.tsx` (the version from Task 3):
```tsx
interface BlockEditorProps {
  block: WorkoutBlock;
  onChange: (block: WorkoutBlock) => void;
  onRemove: () => void;
  errors?: string[];
}

export function BlockEditor({ block, onChange, onRemove, errors = [] }: BlockEditorProps) {
  const showWorkRest = block.type === "interval" || block.type === "tabata" || block.type === "emom";
  const showDuration = !showWorkRest;
  const hasErrors = errors.length > 0;

  return (
    <Card className={`space-y-3 ${hasErrors ? "!border-danger-500" : ""}`}>
```
And, immediately after the exercises `<div className="space-y-2">...</div>` block (before the closing `</Card>`), add:
```tsx
      {hasErrors && (
        <ul className="text-danger-500 text-sm space-y-1">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
```
The full resulting file:
```tsx
// src/components/workout/BlockEditor.tsx
"use client";

import type { BlockType, WorkoutBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EXERCISE_CATALOG } from "@/lib/workout/exerciseCatalog";
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

interface BlockEditorProps {
  block: WorkoutBlock;
  onChange: (block: WorkoutBlock) => void;
  onRemove: () => void;
  errors?: string[];
}

export function BlockEditor({ block, onChange, onRemove, errors = [] }: BlockEditorProps) {
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

      <div className="space-y-2">
        {block.exercises.map((exercise) => (
          <ExerciseEditor
            key={exercise.id}
            exercise={exercise}
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
              exercises: [...block.exercises, { id: crypto.randomUUID(), name: EXERCISE_CATALOG[0].name }],
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
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/app/workouts/new`, set a block to `interval` with `rounds = 0`, remove its only exercise, click "Guardar entrenamiento". Confirm that block's `Card` now shows a red border and lists both error messages inline, while other (valid) blocks show no border/messages.
- [ ] **Step 3: Commit**
```bash
git add src/components/workout/BlockEditor.tsx
git commit -m "feat: highlight blocks with validation errors and show inline messages"
```

---

### Task 8: `formatExerciseLine` pure function

**Files:**
- Create: `src/lib/workout/formatExerciseLine.ts`
- Test: `src/lib/workout/__tests__/formatExerciseLine.test.ts`

**Interfaces:**
- Consumes: `Exercise` type (`@/types`)
- Produces: `function formatExerciseLine(exercise: Exercise): string` — consumed by Task 10 (`ExerciseListDisplay`)

- [ ] **Step 1: Write the failing test**
```ts
// src/lib/workout/__tests__/formatExerciseLine.test.ts
import { describe, it, expect } from "vitest";
import { formatExerciseLine } from "../formatExerciseLine";
import type { Exercise } from "@/types";

describe("formatExerciseLine", () => {
  it("renders only the name when no other fields are set", () => {
    const exercise: Exercise = { id: "e1", name: "Burpees" };
    expect(formatExerciseLine(exercise)).toBe("Burpees");
  });

  it("appends reps when set", () => {
    const exercise: Exercise = { id: "e1", name: "Burpees", reps: 15 };
    expect(formatExerciseLine(exercise)).toBe("Burpees · 15reps");
  });

  it("appends sets when set", () => {
    const exercise: Exercise = { id: "e1", name: "Sentadilla", sets: 4 };
    expect(formatExerciseLine(exercise)).toBe("Sentadilla · 4series");
  });

  it("appends weight when set", () => {
    const exercise: Exercise = { id: "e1", name: "Peso muerto", weightKg: 60 };
    expect(formatExerciseLine(exercise)).toBe("Peso muerto · 60kg");
  });

  it("combines all segments in reps, sets, weight order", () => {
    const exercise: Exercise = { id: "e1", name: "Sentadilla", reps: 10, sets: 3, weightKg: 40 };
    expect(formatExerciseLine(exercise)).toBe("Sentadilla · 10reps · 3series · 40kg");
  });

  it("omits weight of 0 as unset-like but keeps an explicit weight of 0 hidden is wrong — treats 0 as a real value", () => {
    const exercise: Exercise = { id: "e1", name: "Curl", weightKg: 0 };
    expect(formatExerciseLine(exercise)).toBe("Curl · 0kg");
  });
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run src/lib/workout/__tests__/formatExerciseLine.test.ts`
Expected: FAIL with "Cannot find module '../formatExerciseLine'"
- [ ] **Step 3: Write minimal implementation**
```ts
// src/lib/workout/formatExerciseLine.ts
import type { Exercise } from "@/types";

export function formatExerciseLine(exercise: Exercise): string {
  const segments: string[] = [exercise.name];

  if (exercise.reps !== undefined) segments.push(`${exercise.reps}reps`);
  if (exercise.sets !== undefined) segments.push(`${exercise.sets}series`);
  if (exercise.weightKg !== undefined) segments.push(`${exercise.weightKg}kg`);

  return segments.join(" · ");
}
```
- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run src/lib/workout/__tests__/formatExerciseLine.test.ts`
Expected: PASS (6 tests)
- [ ] **Step 5: Commit**
```bash
git add src/lib/workout/formatExerciseLine.ts src/lib/workout/__tests__/formatExerciseLine.test.ts
git commit -m "feat: add formatExerciseLine helper for the Display exercise list"
```

---

### Task 9: `selectVisibleExercises` truncation pure function

**Files:**
- Create: `src/lib/workout/selectVisibleExercises.ts`
- Test: `src/lib/workout/__tests__/selectVisibleExercises.test.ts`

**Interfaces:**
- Consumes: `Exercise` type (`@/types`)
- Produces: `function selectVisibleExercises(exercises: Exercise[], max?: number): { visible: Exercise[]; overflowCount: number }` — consumed by Task 10 (`ExerciseListDisplay`)

- [ ] **Step 1: Write the failing test**
```ts
// src/lib/workout/__tests__/selectVisibleExercises.test.ts
import { describe, it, expect } from "vitest";
import { selectVisibleExercises } from "../selectVisibleExercises";
import type { Exercise } from "@/types";

function exercises(count: number): Exercise[] {
  return Array.from({ length: count }, (_, i) => ({ id: `e${i}`, name: `Exercise ${i}` }));
}

describe("selectVisibleExercises", () => {
  it("returns all exercises with no overflow when under the default max of 4", () => {
    const result = selectVisibleExercises(exercises(3));
    expect(result.visible).toHaveLength(3);
    expect(result.overflowCount).toBe(0);
  });

  it("returns exactly 4 with no overflow when equal to the default max", () => {
    const result = selectVisibleExercises(exercises(4));
    expect(result.visible).toHaveLength(4);
    expect(result.overflowCount).toBe(0);
  });

  it("truncates to the default max of 4 and reports the overflow count", () => {
    const result = selectVisibleExercises(exercises(7));
    expect(result.visible).toHaveLength(4);
    expect(result.visible.map((e) => e.id)).toEqual(["e0", "e1", "e2", "e3"]);
    expect(result.overflowCount).toBe(3);
  });

  it("respects a custom max", () => {
    const result = selectVisibleExercises(exercises(5), 2);
    expect(result.visible).toHaveLength(2);
    expect(result.overflowCount).toBe(3);
  });

  it("returns an empty visible list and zero overflow for an empty input", () => {
    expect(selectVisibleExercises([])).toEqual({ visible: [], overflowCount: 0 });
  });
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run src/lib/workout/__tests__/selectVisibleExercises.test.ts`
Expected: FAIL with "Cannot find module '../selectVisibleExercises'"
- [ ] **Step 3: Write minimal implementation**
```ts
// src/lib/workout/selectVisibleExercises.ts
import type { Exercise } from "@/types";

export function selectVisibleExercises(
  exercises: Exercise[],
  max = 4
): { visible: Exercise[]; overflowCount: number } {
  return {
    visible: exercises.slice(0, max),
    overflowCount: Math.max(0, exercises.length - max),
  };
}
```
- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run src/lib/workout/__tests__/selectVisibleExercises.test.ts`
Expected: PASS (5 tests)
- [ ] **Step 5: Commit**
```bash
git add src/lib/workout/selectVisibleExercises.ts src/lib/workout/__tests__/selectVisibleExercises.test.ts
git commit -m "feat: add selectVisibleExercises truncation helper"
```

---

### Task 10: `ExerciseListDisplay` component wired into `DisplayScreen` + connection dot + i18n

**Files:**
- Create: `src/components/display/ExerciseListDisplay.tsx`
- Modify: `src/components/display/DisplayScreen.tsx` (full rewrite)

**Interfaces:**
- Consumes: `formatExerciseLine` (Task 8), `selectVisibleExercises` (Task 9), `SessionState`/`WorkoutBlock` types (`@/types`)
- Produces: `ExerciseListDisplay` component with props `{ block: WorkoutBlock }` — used only by `DisplayScreen`

Pure UI composition of already-tested pure functions, plus the connection-dot visual fix and Display i18n (grouped here since all three touch `DisplayScreen.tsx`) — implement + manually verify.

- [ ] **Step 1: Implement `ExerciseListDisplay`**
```tsx
// src/components/display/ExerciseListDisplay.tsx
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
        <p key={exercise.id} className="text-[2.75rem] leading-tight text-gray-300 text-center">
          {formatExerciseLine(exercise)}
        </p>
      ))}
      {overflowCount > 0 && (
        <p className="text-2xl text-gray-500 text-center">+{overflowCount} más</p>
      )}
    </div>
  );
}
```
This uses Tailwind's arbitrary-value syntax (`text-[2.75rem]`) to land in the spec's literal ~2.5-3rem target for the exercise list lines, while the timer (`TimerDisplay`, unchanged by this plan) renders at its existing `text-7xl md:text-9xl` (4.5rem/8rem — the codebase's actual scale, short of the spec's "~10rem or more" phrasing but still comfortably the largest element on screen) and remains dominant.
- [ ] **Step 2: Rewrite `DisplayScreen.tsx`**
```tsx
// src/components/display/DisplayScreen.tsx
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
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-8 p-4 relative">
      <button
        onClick={onFullscreenToggle}
        className="absolute top-4 left-4 text-gray-600 hover:text-white text-sm"
        aria-label="Pantalla completa"
      >
        ⛶
      </button>
      <span className="absolute top-4 right-4 flex items-center gap-2 text-sm text-gray-400">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            connectionStatus === "connected" ? "bg-brand-500" : "bg-gray-600"
          }`}
        />
        {connectionStatus === "connected" ? "Conectado" : "Desconectado"}
      </span>
      <p className="text-3xl md:text-5xl text-gray-400 font-bold">{state.workout.name}</p>
      <PhaseIndicator phase={state.currentPhase} />
      <TimerDisplay
        remainingMs={state.timer.remainingMs}
        elapsedMs={state.timer.elapsedMs}
        mode={state.timer.mode}
      />
      <RoundIndicator round={state.currentRound} totalRounds={state.totalRounds} />
      {currentBlock && <ExerciseListDisplay block={currentBlock} />}
      {state.currentPhase === "finished" && (
        <p className="text-4xl font-black text-white">ENTRENAMIENTO COMPLETADO</p>
      )}
    </div>
  );
}
```
- [ ] **Step 3: Manually verify**
Run: `npm run dev`, start a workout at `/app/workouts/[id]/run`, open `/display/[code]` in a second tab. Confirm: the exercise list of the current block appears below `RoundIndicator`, in smaller text than the timer; a `rest` block shows no exercise list; a block with more than 4 exercises truncates with "+N más"; the connection indicator shows a colored dot + "Conectado"/"Desconectado"; the fullscreen button has aria-label "Pantalla completa"; on workout completion the message reads "ENTRENAMIENTO COMPLETADO".
- [ ] **Step 4: Commit**
```bash
git add src/components/display/ExerciseListDisplay.tsx src/components/display/DisplayScreen.tsx
git commit -m "feat: show current block's exercise list on Display and improve connection indicator"
```

---

### Task 11: `DisplayConnection.tsx` i18n

**Files:**
- Modify: `src/components/display/DisplayConnection.tsx`

Pure text relabeling — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/components/display/DisplayConnection.tsx
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
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-4xl font-black text-white">CONECTAR PANTALLA</h1>
      <p className="text-gray-400">Código:</p>
      <p className="text-6xl font-mono font-bold text-brand-500 tracking-widest">{code}</p>
      {url && <QRCodeSVG value={url} size={200} bgColor="transparent" fgColor="#ffffff" />}
      <p className="text-gray-400">Escaneá para conectar</p>
      <p className={status === "connected" ? "text-brand-500" : "text-gray-500"}>
        {status === "connected" ? "CONECTADO ✓" : "Esperando al entrenador…"}
      </p>
    </div>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/display`, enter a code not yet connected — confirm it shows "Esperando al entrenador…"; connect a trainer session with the same code and confirm it shows "CONECTADO ✓".
- [ ] **Step 3: Commit**
```bash
git add src/components/display/DisplayConnection.tsx
git commit -m "feat: localize DisplayConnection status text to Spanish"
```

---

### Task 12: `WorkoutList`/`WorkoutCard` — delete confirmation modal + i18n

**Files:**
- Modify: `src/components/workout/WorkoutList.tsx` (full rewrite)
- Modify: `src/components/workout/WorkoutCard.tsx` (full rewrite)

**Interfaces:**
- Consumes: `Modal` from `@/components/ui/Modal`
- Produces: no new exports — `WorkoutCard`'s `onDelete: (id: string) => void` prop keeps the same signature; the confirmation gate lives in `WorkoutList`, which only calls `onDelete`/`repo.delete` after the user confirms

Pure UI (confirmation flow + relabeling) — implement + manually verify.

- [ ] **Step 1: Implement `WorkoutCard.tsx`**
```tsx
// src/components/workout/WorkoutCard.tsx
"use client";

import Link from "next/link";
import type { Workout } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface WorkoutCardProps {
  workout: Workout;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkoutCard({ workout, onDuplicate, onDelete }: WorkoutCardProps) {
  return (
    <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-white font-semibold">{workout.name}</p>
        <p className="text-sm text-gray-400">
          {workout.blocks.length} block{workout.blocks.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/app/workouts/${workout.id}/run`}>
          <Button size="md">▶ Iniciar</Button>
        </Link>
        <Link href={`/app/workouts/${workout.id}`}>
          <Button size="md" variant="secondary">
            ✏ Editar
          </Button>
        </Link>
        <Button size="md" variant="secondary" onClick={() => onDuplicate(workout.id)} aria-label="Duplicar entrenamiento">
          📋
        </Button>
        <Button size="md" variant="danger" onClick={() => onDelete(workout.id)} aria-label="Eliminar entrenamiento">
          🗑
        </Button>
      </div>
    </Card>
  );
}
```
- [ ] **Step 2: Implement `WorkoutList.tsx`**
```tsx
// src/components/workout/WorkoutList.tsx
"use client";

import { useEffect, useState } from "react";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { WorkoutCard } from "./WorkoutCard";

export function WorkoutList() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null);
  const repo = new LocalWorkoutRepository();

  function reload() {
    const result = repo.list();
    setWorkouts(result.ok ? result.value : []);
  }

  useEffect(() => {
    reload();
  }, []);

  function confirmDelete() {
    if (!pendingDelete) return;
    repo.delete(pendingDelete.id);
    setPendingDelete(null);
    reload();
  }

  if (workouts.length === 0) {
    return <p className="text-gray-400 p-4">Todavía no hay entrenamientos. Creá el primero.</p>;
  }

  return (
    <div className="space-y-3 p-4">
      {workouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          onDuplicate={(id) => {
            repo.duplicate(id);
            reload();
          }}
          onDelete={() => setPendingDelete(workout)}
        />
      ))}
      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={`¿Eliminar '${pendingDelete?.name ?? ""}'?`}
      >
        <p className="text-gray-400 mb-4">Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
```
- [ ] **Step 3: Manually verify**
Run: `npm run dev`, open `/app/workouts` with at least one saved workout, click the delete (🗑) button. Confirm a modal appears titled "¿Eliminar '{nombre}'?" with the "Esta acción no se puede deshacer." body; clicking "Cancelar" closes it without deleting; clicking "Eliminar" removes the workout and closes the modal. Confirm the empty-list message and card button labels are in Spanish.
- [ ] **Step 4: Commit**
```bash
git add src/components/workout/WorkoutList.tsx src/components/workout/WorkoutCard.tsx
git commit -m "feat: add delete confirmation modal to the workout library and localize labels"
```

---

### Task 13: `WorkoutOfTheDay` — CTA on empty state + i18n

**Files:**
- Modify: `src/components/dashboard/WorkoutOfTheDay.tsx`

Pure UI (adds a `Link`+`Button` CTA, relabels text) — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/components/dashboard/WorkoutOfTheDay.tsx
"use client";

import Link from "next/link";
import type { Workout } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface WorkoutOfTheDayProps {
  workout: Workout | null;
}

export function WorkoutOfTheDay({ workout }: WorkoutOfTheDayProps) {
  if (!workout) {
    return (
      <Card className="space-y-3">
        <p className="text-gray-400">Todavía no hay entrenamiento del día — creá uno.</p>
        <Link href="/app/workouts/new">
          <Button size="md">+ Crear entrenamiento</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="space-y-2">
      <p className="text-sm uppercase text-brand-500 tracking-wide">Entrenamiento del día</p>
      <p className="text-2xl font-bold text-white">{workout.name}</p>
      <Link href={`/app/workouts/${workout.id}/run`}>
        <Button size="lg">Iniciar</Button>
      </Link>
    </Card>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/app` with no saved workouts — confirm the empty-state card shows "Todavía no hay entrenamiento del día — creá uno." plus a "+ Crear entrenamiento" button that navigates to `/app/workouts/new`. Save a workout and reopen `/app` — confirm the card now shows "Entrenamiento del día" / the workout name / an "Iniciar" button.
- [ ] **Step 3: Commit**
```bash
git add src/components/dashboard/WorkoutOfTheDay.tsx
git commit -m "feat: add create-workout CTA to empty WorkoutOfTheDay state and localize labels"
```

---

### Task 14: `RecentWorkouts` i18n

**Files:**
- Modify: `src/components/dashboard/RecentWorkouts.tsx`

Pure text relabeling — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/components/dashboard/RecentWorkouts.tsx
"use client";

import Link from "next/link";
import type { Workout } from "@/types";

interface RecentWorkoutsProps {
  workouts: Workout[];
}

export function RecentWorkouts({ workouts }: RecentWorkoutsProps) {
  const recent = [...workouts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-white font-semibold">Entrenamientos recientes</h2>
      <ul className="space-y-1">
        {recent.map((workout) => (
          <li key={workout.id}>
            <Link href={`/app/workouts/${workout.id}/run`} className="text-brand-500 hover:underline">
              {workout.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/app` with at least one saved workout — confirm the heading reads "Entrenamientos recientes".
- [ ] **Step 3: Commit**
```bash
git add src/components/dashboard/RecentWorkouts.tsx
git commit -m "feat: localize RecentWorkouts heading to Spanish"
```

---

### Task 15: `TimerControls` i18n

**Files:**
- Modify: `src/components/timer/TimerControls.tsx`

Pure text relabeling — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/components/timer/TimerControls.tsx
import { Button } from "@/components/ui/Button";

interface TimerControlsProps {
  status: "ready" | "running" | "paused" | "finished" | "waiting";
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onAddTime: () => void;
  onSubtractTime: () => void;
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
  onNext,
  onPrevious,
  onAddTime,
  onSubtractTime,
}: TimerControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
      {status === "ready" || status === "finished" ? (
        <Button size="lg" className="col-span-2" onClick={onStart}>
          INICIAR
        </Button>
      ) : status === "running" ? (
        <Button size="lg" className="col-span-2" onClick={onPause}>
          PAUSAR
        </Button>
      ) : (
        <Button size="lg" className="col-span-2" onClick={onResume}>
          REANUDAR
        </Button>
      )}
      <Button size="md" variant="secondary" onClick={onPrevious}>
        ◀ ANTERIOR
      </Button>
      <Button size="md" variant="secondary" onClick={onNext}>
        SIGUIENTE ▶
      </Button>
      <Button size="md" variant="secondary" onClick={onSubtractTime}>
        -10 SEG
      </Button>
      <Button size="md" variant="secondary" onClick={onAddTime}>
        +10 SEG
      </Button>
      <Button size="md" variant="danger" className="col-span-2" onClick={onReset}>
        REINICIAR
      </Button>
    </div>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/app/workouts/[id]/run`, confirm all button labels (INICIAR/PAUSAR/REANUDAR/ANTERIOR/SIGUIENTE/-10 SEG/+10 SEG/REINICIAR) are in Spanish across the ready/running/paused states.
- [ ] **Step 3: Commit**
```bash
git add src/components/timer/TimerControls.tsx
git commit -m "feat: localize TimerControls button labels to Spanish"
```

---

### Task 16: `PhaseIndicator` i18n

**Files:**
- Modify: `src/components/timer/PhaseIndicator.tsx`

Pure text relabeling — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/components/timer/PhaseIndicator.tsx
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
  finished: "text-white",
};

export function PhaseIndicator({ phase }: { phase: WorkoutPhase }) {
  return (
    <p className={`text-2xl md:text-4xl font-bold tracking-widest text-center ${PHASE_CLASSES[phase]}`}>
      {PHASE_LABELS[phase]}
    </p>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/app/workouts/[id]/run`, click "INICIAR" and step through phases (getReady → work → rest for an interval block → finished) confirming "PREPARATE"/"TRABAJO"/"DESCANSO"/"TIEMPO" render at the right times.
- [ ] **Step 3: Commit**
```bash
git add src/components/timer/PhaseIndicator.tsx
git commit -m "feat: localize PhaseIndicator labels to Spanish"
```

---

### Task 17: `RoundIndicator` i18n

**Files:**
- Modify: `src/components/timer/RoundIndicator.tsx`

Pure text relabeling — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/components/timer/RoundIndicator.tsx
export function RoundIndicator({ round, totalRounds }: { round: number; totalRounds: number }) {
  if (totalRounds <= 1) return null;
  return (
    <p className="text-lg md:text-2xl text-gray-400 text-center">
      RONDA {round} / {totalRounds}
    </p>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, run a workout with an `interval`/`tabata`/`emom` block with `rounds > 1`, confirm the indicator reads "RONDA {n} / {total}".
- [ ] **Step 3: Commit**
```bash
git add src/components/timer/RoundIndicator.tsx
git commit -m "feat: localize RoundIndicator label to Spanish"
```

---

### Task 18: Trainer run panel — reset confirmation modal, copy-code button, i18n

**Files:**
- Modify: `src/app/app/workouts/[id]/run/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `Modal` from `@/components/ui/Modal`; `navigator.clipboard.writeText`

Pure UI (confirmation flow + Clipboard API glue + relabeling) — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/app/app/workouts/[id]/run/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFullscreen } from "@/hooks/useFullscreen";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { generateCode } from "@/lib/session/generateCode";
import { AudioManager } from "@/lib/audio/AudioManager";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { TimerControls } from "@/components/timer/TimerControls";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export default function RunWorkoutPage() {
  const params = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null | undefined>(undefined);
  const [code] = useState(() => generateCode());
  const audio = useMemo(() => new AudioManager({ enabled: true, voiceEnabled: false }), []);

  useEffect(() => {
    const repo = new LocalWorkoutRepository();
    const result = repo.get(params.id);
    setWorkout(result.ok ? result.value : null);
  }, [params.id]);

  if (workout === undefined) return <p className="p-4 text-white">Cargando…</p>;
  if (workout === null) return <p className="p-4 text-white">Entrenamiento no encontrado.</p>;

  return <RunWorkoutContent workout={workout} code={code} audio={audio} />;
}

function RunWorkoutContent({
  workout,
  code,
  audio,
}: {
  workout: Workout;
  code: string;
  audio: AudioManager;
}) {
  const session = useWorkoutSession(workout);
  const channelRef = useRef<SessionChannel | null>(null);
  const { toggle: toggleFullscreen } = useFullscreen();
  const [resetPending, setResetPending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Created and destroyed in the same effect (rather than via useMemo + a
  // separate cleanup effect) so React Strict Mode's dev-only double-invoke
  // of effects always pairs a channel's creation with its own destroy call,
  // instead of destroying a memoized channel that a later effect still holds.
  useEffect(() => {
    const channel = new SessionChannel(code, "trainer");
    channelRef.current = channel;
    return () => {
      channel.destroy();
      channelRef.current = null;
    };
  }, [code]);

  useEffect(() => {
    channelRef.current?.sendState({ ...session.state, code });
    if (session.state.status === "finished") audio.playFinish();
  }, [session.state, code, audio]);

  useKeyboardShortcuts({
    onPauseResume: () => (session.state.status === "running" ? session.pause() : session.resume()),
    onReset: () => setResetPending(true),
    onNext: () => session.nextRound(),
    onPrevious: () => session.previousRound(),
    onFullscreen: toggleFullscreen,
  });

  function handleStart() {
    audio.unlock();
    audio.playStart();
    session.start();
  }

  function confirmReset() {
    session.reset();
    setResetPending(false);
  }

  async function handleCopyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-6 p-4">
      <p className="text-gray-400 flex items-center gap-2">
        Código de pantalla: <span className="font-mono text-white">{code}</span>
        <Button size="md" variant="secondary" onClick={handleCopyCode} aria-label="Copiar código">
          {copied ? "Copiado ✓" : "Copiar código"}
        </Button>
        <Link href={`/display/${code}`} className="text-brand-500 underline">
          abrir pantalla
        </Link>
      </p>
      <PhaseIndicator phase={session.state.currentPhase} />
      <TimerDisplay
        remainingMs={session.state.timer.remainingMs}
        elapsedMs={session.state.timer.elapsedMs}
        mode={session.state.timer.mode}
      />
      <RoundIndicator round={session.state.currentRound} totalRounds={session.state.totalRounds} />
      <TimerControls
        status={session.state.status}
        onStart={handleStart}
        onPause={session.pause}
        onResume={session.resume}
        onReset={() => setResetPending(true)}
        onNext={session.nextRound}
        onPrevious={session.previousRound}
        onAddTime={() => session.addTime(10_000)}
        onSubtractTime={() => session.subtractTime(10_000)}
      />
      <Modal
        open={resetPending}
        onClose={() => setResetPending(false)}
        title="¿Reiniciar el entrenamiento?"
      >
        <p className="text-gray-400 mb-4">Se perderá el progreso de la sesión actual.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setResetPending(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmReset}>
            Reiniciar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/app/workouts/[id]/run`. Confirm: "Código de pantalla:" label, a "Copiar código" button next to the code that copies it to the clipboard and briefly shows "Copiado ✓", an "abrir pantalla" link, and clicking RESET (button or keyboard shortcut) opens a "¿Reiniciar el entrenamiento?" modal that only resets on "Reiniciar" and does nothing on "Cancelar". Confirm "Cargando…"/"Entrenamiento no encontrado." render for the loading/not-found states (e.g. by navigating to a bogus workout id).
- [ ] **Step 3: Commit**
```bash
git add "src/app/app/workouts/[id]/run/page.tsx"
git commit -m "feat: add reset confirmation and copy-code button to the trainer run panel"
```

---

### Task 19: `[id]/page.tsx` (edit workout) i18n

**Files:**
- Modify: `src/app/app/workouts/[id]/page.tsx`

Pure text relabeling — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/app/app/workouts/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutBuilder } from "@/components/workout/WorkoutBuilder";

export default function EditWorkoutPage() {
  const params = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null | undefined>(undefined);

  useEffect(() => {
    const repo = new LocalWorkoutRepository();
    const result = repo.get(params.id);
    setWorkout(result.ok ? result.value : null);
  }, [params.id]);

  if (workout === undefined) return <p className="p-4 text-white">Cargando…</p>;
  if (workout === null) return <p className="p-4 text-white">Entrenamiento no encontrado.</p>;

  return <WorkoutBuilder initialWorkout={workout} />;
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, navigate to `/app/workouts/{valid-id}` and confirm the builder loads; navigate to `/app/workouts/does-not-exist` and confirm "Entrenamiento no encontrado." renders.
- [ ] **Step 3: Commit**
```bash
git add "src/app/app/workouts/[id]/page.tsx"
git commit -m "feat: localize edit-workout page loading/not-found text to Spanish"
```

---

### Task 20: `workouts/page.tsx` (library) i18n

**Files:**
- Modify: `src/app/app/workouts/page.tsx`

Pure text relabeling — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/app/app/workouts/page.tsx
import Link from "next/link";
import { WorkoutList } from "@/components/workout/WorkoutList";
import { Button } from "@/components/ui/Button";

export default function WorkoutsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-white">Entrenamientos</h1>
        <Link href="/app/workouts/new">
          <Button>+ Nuevo entrenamiento</Button>
        </Link>
      </div>
      <WorkoutList />
    </div>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/app/workouts`, confirm the heading reads "Entrenamientos" and the button reads "+ Nuevo entrenamiento".
- [ ] **Step 3: Commit**
```bash
git add src/app/app/workouts/page.tsx
git commit -m "feat: localize workouts library page heading and CTA to Spanish"
```

---

### Task 21: `display/page.tsx` (display entry) i18n

**Files:**
- Modify: `src/app/display/page.tsx`

Pure text relabeling — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/app/display/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function DisplayEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold text-white">Abrir una pantalla</h1>
      <Input
        aria-label="Código de conexión"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ABC123"
        className="max-w-xs text-center text-2xl font-mono"
      />
      <Button size="lg" onClick={() => router.push(`/display/${code}`)} disabled={code.length !== 6}>
        Conectar
      </Button>
    </div>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open `/display`, confirm the heading reads "Abrir una pantalla", the input's aria-label is "Código de conexión", and the button reads "Conectar" (enabled only once a 6-character code is entered).
- [ ] **Step 3: Commit**
```bash
git add src/app/display/page.tsx
git commit -m "feat: localize display entry page to Spanish"
```

---

### Task 22: `layout.tsx` — `lang="es"` and app metadata

**Files:**
- Modify: `src/app/layout.tsx`

Pure config/text change — implement + manually verify.

- [ ] **Step 1: Implement**
```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```
- [ ] **Step 2: Manually verify**
Run: `npm run dev`, open any page, inspect the document element (`document.documentElement.lang`) and confirm it is `"es"`; confirm the browser tab title reads "GymTimer Pro".
- [ ] **Step 3: Commit**
```bash
git add src/app/layout.tsx
git commit -m "feat: set lang=es and GymTimer Pro app metadata"
```

---

## Self-Review

### 1. Spec coverage

**Parte 1 — Modelo de datos y catálogo:**
- 2.1 `sets` field added to `Exercise` → Task 1
- 2.2 Static catalog `exerciseCatalog.ts`, ~40-50 exercises, 6 categories → Task 1 (48 exercises, 8 per category)
- 2.3 `ExerciseEditor` catalog `<Select>` with `<optgroup>`, Series/Peso/Notas fields → Task 2
- 2.3 "+ Add exercise" defaults to catalog's first entry instead of `name: ""` → Task 3
- 2.4 No new validation for `sets`/`weightKg`/`notes` → honored (Global Constraints; no such rules added in Task 5)

**Parte 2 — Display exercise list:**
- 3.1 No `WorkoutEngine` changes, reads `blocks[currentBlockIndex].exercises` → Task 10 (`currentBlock = state.workout.blocks[state.currentBlockIndex]`, confirmed field name `currentBlockIndex` from `WorkoutEngine.getState()`)
- 3.2 Placed between/below `PhaseIndicator`/`RoundIndicator`, format `NOMBRE · Nreps · Sseries · Pkg` omitting unset segments → Task 8 (`formatExerciseLine`) + Task 10 (placement after `RoundIndicator`)
- 3.3 Hidden for `rest` blocks, max 4 lines + "+N más" → Task 9 (`selectVisibleExercises`) + Task 10 (`ExerciseListDisplay`'s `block.type === "rest"` early return)
- 3.4 Timer stays dominant, list text ~2.5-3rem → Task 10 (`text-[2.75rem]` on the exercise lines; `TimerDisplay` is untouched by this plan and keeps its existing `text-7xl md:text-9xl` ≈ 4.5-8rem scale, still the largest element on screen)

**Parte 3 — UX audit:**
- 4.1 Landing: no changes → honored (not touched by any task)
- 4.2 Dashboard CTA on empty `WorkoutOfTheDay` → Task 13
- 4.3 Library delete confirmation via `Modal` → Task 12; label/aria-label cleanup → Task 12
- 4.4 `ExerciseEditor` grid layout → Task 2; block/exercise counter in builder header → Task 6; per-block visual error association → Task 7
- 4.5 Run panel RESET confirmation via `Modal` → Task 18; copy-code button via Clipboard API → Task 18
- 4.6 Display connection dot + text → Task 10

**Parte 4 — i18n:** every row of every table in section 5 is covered:
- `ExerciseEditor.tsx` → Task 2 (aria-labels "Ejercicio"/"Quitar ejercicio"/"Series"/"Peso (kg)"/"Notas"; "Reps" unchanged)
- `BlockEditor.tsx` → Task 3 (all 9 rows)
- `WorkoutBuilder.tsx` → Task 6 (aria-label, placeholder, "+ Agregar bloque", "Guardar entrenamiento")
- `WorkoutList.tsx` → Task 12 (empty-state text)
- `WorkoutCard.tsx` → Task 12 ("▶ Iniciar", "✏ Editar")
- `WorkoutOfTheDay.tsx` → Task 13 (empty text + CTA, heading, "Iniciar")
- `RecentWorkouts.tsx` → Task 14
- `TimerControls.tsx` → Task 15 (all 7 rows)
- `PhaseIndicator.tsx` → Task 16 (all 4 rows)
- `RoundIndicator.tsx` → Task 17
- `DisplayScreen.tsx` → Task 10 ("Conectado"/"Desconectado", "Pantalla completa", "ENTRENAMIENTO COMPLETADO")
- `DisplayConnection.tsx` → Task 11 ("CONECTADO ✓", "Esperando al entrenador…")
- `app/app/workouts/page.tsx` → Task 20
- `app/app/workouts/[id]/page.tsx` and `run/page.tsx` → Task 19, Task 18
- `app/display/page.tsx` → Task 21
- `app/layout.tsx` → Task 22

**Section 6 — explicitly out of scope:** confirmed none of the 22 tasks touch a catalog free-text fallback, `WorkoutEngine` per-exercise timing, a Display visual redesign, cross-device sync beyond `BroadcastChannel`, or `AudioManager`'s unused beep methods.

**Fix applied during self-review:** Task 10's exercise-list line originally used `text-2xl md:text-3xl` (1.5rem/1.875rem), which undershoots the spec's literal "~2.5-3rem" target range. Tailwind's default scale has no built-in step in that range, so the code block in Task 10 was corrected to use the arbitrary-value class `text-[2.75rem]` (2.75rem, the midpoint of the spec's range) for the exercise lines, with the overflow "+N más" indicator one step down at `text-2xl` (1.5rem). The timer (`TimerDisplay`, untouched by this plan) keeps its existing ~10rem scale, so it remains clearly dominant over the 2.75rem exercise lines.

### 2. Placeholder scan

Searched every task for "TBD", "similar to Task", "add appropriate", "..." elisions in code blocks, or any non-literal instruction. None found — every code block is complete, copy-pasteable file content or a fully-specified diff. `EXERCISE_CATALOG` is fully enumerated (48 entries), not truncated with "etc."

### 3. Type/signature consistency check

- `Exercise.sets?: number` (Task 1) — referenced identically in `ExerciseEditor.tsx` (Task 2), `formatExerciseLine.ts` (Task 8) tests.
- `CatalogExercise` / `EXERCISE_CATALOG` / `groupCatalogByCategory` (Task 1) — consumed with identical names/signatures in `ExerciseEditor.tsx` (Task 2) and `BlockEditor.tsx` (Task 3).
- `countBlocksAndExercises(workout: Workout): { blocks: number; exercises: number }` (Task 4) — consumed identically in `WorkoutBuilder.tsx` (Task 6) as `counts.blocks`/`counts.exercises`.
- `ValidationError { message: string; blockId?: string }` / `validateWorkout(workout: Workout): ValidationError[]` (Task 5) — consumed identically in `WorkoutBuilder.tsx` (Task 6, both as `errors` state type and filtered into `generalErrors`/per-block arrays) and referenced in `BlockEditor.tsx`'s new `errors?: string[]` prop (Task 7 — note `BlockEditor` receives pre-filtered `string[]`, not `ValidationError[]`, which is correct and consistent since `WorkoutBuilder` does the `.map((error) => error.message)` filtering before passing down).
- `formatExerciseLine(exercise: Exercise): string` (Task 8) and `selectVisibleExercises(exercises: Exercise[], max?: number): { visible: Exercise[]; overflowCount: number }` (Task 9) — both consumed with identical names/signatures in `ExerciseListDisplay.tsx` (Task 10).
- `BlockEditorProps.errors?: string[]` — introduced in Task 7's interface, and Task 6's `WorkoutBuilder` already passes `errors={...}` of type `string[]` to `<BlockEditor>`, matching the prop Task 7 later makes it render. No naming drift (always `errors`, never `blockErrors` or `validationErrors` for this prop).
- `WorkoutEngine.getState()`'s field is confirmed as `currentBlockIndex` (read directly from `src/lib/workout/WorkoutEngine.ts` line 101) — Task 10 uses `state.currentBlockIndex`, not a guessed alternate name like `blockIndex`.

No inconsistencies found requiring further fixes beyond the Task 10 font-size correction noted above.
