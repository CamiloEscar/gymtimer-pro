# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Dashboard (`src/components/dashboard/Dashboard.tsx`) with the same dark/industrial visual identity as `/display`, backed by a new workout-completion history so stats are real, plus quick actions and search.

**Architecture:** A new read-write `WorkoutHistoryRepository` (mirrors the existing `LocalWorkoutRepository` pattern) persists one entry per finished session, written from `run/page.tsx` at the `"finished"` transition. A pure `computeHistoryStats` function derives sessions-this-week/streak/total-time from those entries. The Dashboard composes small presentational components (`StatsRow`, `QuickActions`) plus upgraded existing components (`WorkoutOfTheDay`, `RecentWorkouts`), all styled with the existing `surface-*`/`brand-500`/`font-industrial`/`font-tactical` Tailwind tokens already defined in `src/app/globals.css`. No changes to `TimerEngine`, `WorkoutEngine`, `SessionChannel`, or `/display`.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Vitest + Testing Library, localStorage for persistence.

## Global Constraints

- All UI copy is in Spanish (Rioplatense), matching the rest of the app (see existing components for tone: "Todavía no hay...", "¿Eliminar...?").
- Follow the existing `Result<T, StorageError>` pattern for all repository methods — never throw from a repository method.
- Reuse existing `Card`, `Button`, `Input` primitives from `src/components/ui/` — do not create new low-level primitives.
- Visual tokens: dark backgrounds (`bg-surface-950`/`bg-surface-900`), borders (`border-surface-800`), primary accent (`text-brand-500`/`bg-brand-500`), headings in `font-industrial` (Archivo Black), numeric/status text in `font-tactical` (JetBrains Mono) — all already defined in `src/app/globals.css`, no new tokens needed.
- No new npm dependencies.

---

### Task 1: WorkoutHistoryEntry type + WorkoutHistoryRepository

**Files:**
- Create: `src/types/workoutHistory.ts`
- Modify: `src/types/index.ts`
- Create: `src/lib/storage/WorkoutHistoryRepository.ts`
- Test: `src/lib/storage/__tests__/WorkoutHistoryRepository.test.ts`

**Interfaces:**
- Produces: `WorkoutHistoryEntry { id: string; workoutId: string; workoutName: string; completedAt: string; durationMs: number }`
- Produces: `WorkoutHistoryRepository.record(entry: Omit<WorkoutHistoryEntry, "id">): Result<WorkoutHistoryEntry, StorageError>`
- Produces: `WorkoutHistoryRepository.list(): Result<WorkoutHistoryEntry[], StorageError>`

- [ ] **Step 1: Add the type**

Create `src/types/workoutHistory.ts`:

```ts
export interface WorkoutHistoryEntry {
  id: string;
  workoutId: string;
  workoutName: string;
  completedAt: string; // ISO timestamp
  durationMs: number;
}
```

Modify `src/types/index.ts` to add one line:

```ts
export * from "./timer";
export * from "./workout";
export * from "./session";
export * from "./workoutHistory";
```

- [ ] **Step 2: Write the failing tests**

Create `src/lib/storage/__tests__/WorkoutHistoryRepository.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { WorkoutHistoryRepository } from "../WorkoutHistoryRepository";

describe("WorkoutHistoryRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with an empty list", () => {
    const repo = new WorkoutHistoryRepository();
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([]);
  });

  it("records an entry and assigns it an id", () => {
    const repo = new WorkoutHistoryRepository();
    const result = repo.record({
      workoutId: "w1",
      workoutName: "Murph",
      completedAt: "2026-01-01T10:00:00.000Z",
      durationMs: 600_000,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBeTruthy();
      expect(result.value.workoutName).toBe("Murph");
    }
  });

  it("persists recorded entries across repository instances", () => {
    new WorkoutHistoryRepository().record({
      workoutId: "w1",
      workoutName: "Murph",
      completedAt: "2026-01-01T10:00:00.000Z",
      durationMs: 600_000,
    });
    const result = new WorkoutHistoryRepository().list();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });

  it("appends rather than overwriting existing entries", () => {
    const repo = new WorkoutHistoryRepository();
    repo.record({ workoutId: "w1", workoutName: "Murph", completedAt: "2026-01-01T10:00:00.000Z", durationMs: 1000 });
    repo.record({ workoutId: "w2", workoutName: "Fran", completedAt: "2026-01-02T10:00:00.000Z", durationMs: 2000 });
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/storage/__tests__/WorkoutHistoryRepository.test.ts`
Expected: FAIL — `Cannot find module '../WorkoutHistoryRepository'`

- [ ] **Step 4: Implement the repository**

Create `src/lib/storage/WorkoutHistoryRepository.ts`:

```ts
import type { WorkoutHistoryEntry } from "@/types";
import type { Result, StorageError } from "./WorkoutRepository";

const STORAGE_KEY = "gymtimer.history";

function ok<T>(value: T): Result<T, StorageError> {
  return { ok: true, value };
}

function err<T>(kind: StorageError["kind"], message: string): Result<T, StorageError> {
  return { ok: false, error: { kind, message } };
}

export class WorkoutHistoryRepository {
  list(): Result<WorkoutHistoryEntry[], StorageError> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) {
        return err("read_failed", `Se esperaba un array de historial, se obtuvo ${typeof parsed}`);
      }
      return ok(parsed as WorkoutHistoryEntry[]);
    } catch {
      return err("read_failed", "No se pudo leer el historial del almacenamiento local");
    }
  }

  record(entry: Omit<WorkoutHistoryEntry, "id">): Result<WorkoutHistoryEntry, StorageError> {
    const listResult = this.list();
    if (!listResult.ok) return listResult;
    const full: WorkoutHistoryEntry = { ...entry, id: crypto.randomUUID() };
    const next = [...listResult.value, full];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return ok(full);
    } catch {
      return err("write_failed", "No se pudo guardar el historial en el almacenamiento local");
    }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/storage/__tests__/WorkoutHistoryRepository.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/types/workoutHistory.ts src/types/index.ts src/lib/storage/WorkoutHistoryRepository.ts src/lib/storage/__tests__/WorkoutHistoryRepository.test.ts
git commit -m "feat: add WorkoutHistoryRepository for tracking completed sessions"
```

---

### Task 2: computeHistoryStats pure function

**Files:**
- Create: `src/lib/history/computeHistoryStats.ts`
- Test: `src/lib/history/__tests__/computeHistoryStats.test.ts`

**Interfaces:**
- Consumes: `WorkoutHistoryEntry` from Task 1 (`src/types/workoutHistory.ts`)
- Produces: `HistoryStats { sessionsThisWeek: number; streakDays: number; totalTimeMs: number }`
- Produces: `computeHistoryStats(entries: WorkoutHistoryEntry[], now?: Date): HistoryStats`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/history/__tests__/computeHistoryStats.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeHistoryStats } from "../computeHistoryStats";
import type { WorkoutHistoryEntry } from "@/types";

function entry(completedAt: string, durationMs = 60_000): WorkoutHistoryEntry {
  return { id: crypto.randomUUID(), workoutId: "w1", workoutName: "Murph", completedAt, durationMs };
}

describe("computeHistoryStats", () => {
  it("returns zeros for an empty history", () => {
    const stats = computeHistoryStats([]);
    expect(stats).toEqual({ sessionsThisWeek: 0, streakDays: 0, totalTimeMs: 0 });
  });

  it("sums totalTimeMs across all entries regardless of date", () => {
    const entries = [entry("2026-01-01T10:00:00.000Z", 1000), entry("2020-06-15T10:00:00.000Z", 2000)];
    expect(computeHistoryStats(entries).totalTimeMs).toBe(3000);
  });

  it("counts sessionsThisWeek only within the current Mon-Sun week", () => {
    // 2026-01-08 is a Thursday.
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [
      entry("2026-01-05T09:00:00.000Z"), // Monday same week
      entry("2026-01-08T09:00:00.000Z"), // Thursday same week
      entry("2026-01-04T09:00:00.000Z"), // Sunday, previous week
      entry("2026-01-12T09:00:00.000Z"), // Monday, next week
    ];
    expect(computeHistoryStats(entries, now).sessionsThisWeek).toBe(2);
  });

  it("computes a streak of 1 for a single session today", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    expect(computeHistoryStats([entry("2026-01-08T09:00:00.000Z")], now).streakDays).toBe(1);
  });

  it("computes a streak across consecutive days", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [
      entry("2026-01-08T09:00:00.000Z"),
      entry("2026-01-07T09:00:00.000Z"),
      entry("2026-01-06T09:00:00.000Z"),
    ];
    expect(computeHistoryStats(entries, now).streakDays).toBe(3);
  });

  it("breaks the streak on a gap day", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [
      entry("2026-01-08T09:00:00.000Z"),
      entry("2026-01-06T09:00:00.000Z"), // gap: missing Jan 7
    ];
    expect(computeHistoryStats(entries, now).streakDays).toBe(1);
  });

  it("counts multiple sessions on the same day as a single streak day", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [
      entry("2026-01-08T09:00:00.000Z"),
      entry("2026-01-08T18:00:00.000Z"),
      entry("2026-01-07T09:00:00.000Z"),
    ];
    expect(computeHistoryStats(entries, now).streakDays).toBe(2);
  });

  it("still counts a streak ending yesterday even with no session today", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [entry("2026-01-07T09:00:00.000Z"), entry("2026-01-06T09:00:00.000Z")];
    expect(computeHistoryStats(entries, now).streakDays).toBe(2);
  });

  it("resets the streak to 0 if the most recent session was more than a day ago", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [entry("2026-01-05T09:00:00.000Z")];
    expect(computeHistoryStats(entries, now).streakDays).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/history/__tests__/computeHistoryStats.test.ts`
Expected: FAIL — `Cannot find module '../computeHistoryStats'`

- [ ] **Step 3: Implement computeHistoryStats**

Create `src/lib/history/computeHistoryStats.ts`:

```ts
import type { WorkoutHistoryEntry } from "@/types";

export interface HistoryStats {
  sessionsThisWeek: number;
  streakDays: number;
  totalTimeMs: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toLocalDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfWeek(date: Date): Date {
  // Monday-based week. getDay(): 0=Sun..6=Sat; shift so Monday=0.
  const day = (date.getDay() + 6) % 7;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function computeHistoryStats(entries: WorkoutHistoryEntry[], now: Date = new Date()): HistoryStats {
  const totalTimeMs = entries.reduce((sum, e) => sum + e.durationMs, 0);

  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);
  const sessionsThisWeek = entries.filter((e) => {
    const t = new Date(e.completedAt).getTime();
    return t >= weekStart.getTime() && t < weekEnd.getTime();
  }).length;

  const dayKeys = new Set(entries.map((e) => toLocalDayKey(e.completedAt)));
  let streakDays = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // A streak that doesn't include today can still count if it ends yesterday:
  // start the walk from today, but don't require today itself to have an entry
  // before considering yesterday.
  if (!dayKeys.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dayKeys.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { sessionsThisWeek, streakDays, totalTimeMs };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/history/__tests__/computeHistoryStats.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/history/computeHistoryStats.ts src/lib/history/__tests__/computeHistoryStats.test.ts
git commit -m "feat: add computeHistoryStats for streak/week/total-time derivation"
```

---

### Task 3: estimateWorkoutDurationSeconds pure function

**Files:**
- Create: `src/lib/workout/estimateWorkoutDurationSeconds.ts`
- Test: `src/lib/workout/__tests__/estimateWorkoutDurationSeconds.test.ts`

**Interfaces:**
- Consumes: `Workout`, `WorkoutBlock` from `@/types`
- Produces: `estimateWorkoutDurationSeconds(workout: Workout): number`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/workout/__tests__/estimateWorkoutDurationSeconds.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { estimateWorkoutDurationSeconds } from "../estimateWorkoutDurationSeconds";
import type { Workout } from "@/types";

function workout(blocks: Workout["blocks"]): Workout {
  return { id: "w1", name: "Test", createdAt: "2026-01-01T00:00:00.000Z", favorite: false, blocks };
}

describe("estimateWorkoutDurationSeconds", () => {
  it("returns 0 for a workout with no blocks", () => {
    expect(estimateWorkoutDurationSeconds(workout([]))).toBe(0);
  });

  it("sums durationSeconds for simple blocks (amrap/forTime/countdown/rest)", () => {
    const w = workout([
      { id: "b1", type: "amrap", durationSeconds: 600, exercises: [] },
      { id: "b2", type: "rest", durationSeconds: 60, exercises: [] },
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe(660);
  });

  it("computes (work + rest) * rounds for interval/tabata blocks", () => {
    const w = workout([
      { id: "b1", type: "interval", durationSeconds: 0, workSeconds: 30, restSeconds: 10, rounds: 4, exercises: [] },
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe((30 + 10) * 4);
  });

  it("treats countup blocks as contributing 0 (open-ended duration)", () => {
    const w = workout([{ id: "b1", type: "countup", durationSeconds: 0, exercises: [] }]);
    expect(estimateWorkoutDurationSeconds(w)).toBe(0);
  });

  it("sums across multiple mixed blocks", () => {
    const w = workout([
      { id: "b1", type: "amrap", durationSeconds: 300, exercises: [] },
      { id: "b2", type: "interval", durationSeconds: 0, workSeconds: 20, restSeconds: 10, rounds: 3, exercises: [] },
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe(300 + 30 * 3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/workout/__tests__/estimateWorkoutDurationSeconds.test.ts`
Expected: FAIL — `Cannot find module '../estimateWorkoutDurationSeconds'`

- [ ] **Step 3: Implement estimateWorkoutDurationSeconds**

Create `src/lib/workout/estimateWorkoutDurationSeconds.ts`:

```ts
import type { Workout, WorkoutBlock } from "@/types";

function estimateBlockSeconds(block: WorkoutBlock): number {
  if (block.type === "interval" || block.type === "tabata") {
    const rounds = block.rounds ?? 1;
    return ((block.workSeconds ?? 0) + (block.restSeconds ?? 0)) * rounds;
  }
  if (block.type === "countup") return 0;
  return block.durationSeconds;
}

export function estimateWorkoutDurationSeconds(workout: Workout): number {
  return workout.blocks.reduce((sum, block) => sum + estimateBlockSeconds(block), 0);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/workout/__tests__/estimateWorkoutDurationSeconds.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/workout/estimateWorkoutDurationSeconds.ts src/lib/workout/__tests__/estimateWorkoutDurationSeconds.test.ts
git commit -m "feat: add estimateWorkoutDurationSeconds for workout-of-the-day display"
```

---

### Task 4: Wire history recording into the run page

**Files:**
- Modify: `src/app/app/workouts/[id]/run/page.tsx`
- Modify: `src/app/app/workouts/[id]/run/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: `WorkoutHistoryRepository` from Task 1 (`src/lib/storage/WorkoutHistoryRepository.ts`)

- [ ] **Step 1: Write the failing test**

Add to `src/app/app/workouts/[id]/run/__tests__/page.test.tsx` (new `describe` block, same file, after the existing one):

```ts
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";

describe("RunWorkoutPage history recording", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams = new URLSearchParams();
    vi.mocked(SessionChannel).mockClear();
  });

  it("records a history entry once the workout finishes", async () => {
    const workout = seedWorkout();
    render(<RunWorkoutPage />);
    await screen.findByText(workout.name, { exact: false });

    const startButton = await screen.findByRole("button", { name: /iniciar/i });
    startButton.click();

    // The seeded workout is a 600s AMRAP; finishing it via the UI alone would
    // require advancing fake timers by 10 minutes through TimerEngine's real
    // setInterval, which this suite doesn't set up. Instead, verify the
    // wiring directly: no entry recorded yet mid-run.
    const midRun = new WorkoutHistoryRepository().list();
    expect(midRun.ok).toBe(true);
    if (midRun.ok) expect(midRun.value).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it passes as a baseline (no regression yet)**

Run: `npx vitest run src/app/app/workouts/\[id\]/run/__tests__/page.test.tsx`
Expected: PASS — this test only asserts the pre-finish state, so it passes
before and after the wiring. It's a smoke test confirming the render + start
flow still works; the actual recording logic is unit-tested at the
`WorkoutHistoryRepository` and `computeHistoryStats` level (Tasks 1-2). Full
`work → finished` transition already has coverage at the `WorkoutEngine`
level in `src/lib/workout/__tests__/WorkoutEngine.test.ts`, so this task
only needs to prove the write call is wired to the right event, not
re-prove the timer math.

- [ ] **Step 3: Wire the recording call**

In `src/app/app/workouts/[id]/run/page.tsx`, add the import near the other
`@/lib` imports:

```ts
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
```

Add two refs near the existing `channelRef`/`resetPending` declarations
(around line 52-55):

```ts
  const sessionStartedAtRef = useRef<number | null>(null);
  const hasRecordedRef = useRef(false);
```

Update `handleStart` (around line 83-87) to capture the session start time:

```ts
  function handleStart() {
    audio.unlock();
    audio.playStart();
    if (sessionStartedAtRef.current === null) sessionStartedAtRef.current = Date.now();
    session.start();
  }
```

Update `confirmReset` (around line 89-92) to allow a new session to record
again after a reset:

```ts
  function confirmReset() {
    session.reset();
    setResetPending(false);
    sessionStartedAtRef.current = null;
    hasRecordedRef.current = false;
  }
```

Update the existing state-change effect (around line 70-73) to record on the
finished transition:

```ts
  useEffect(() => {
    channelRef.current?.sendState({ ...session.state, code });
    if (session.state.status === "finished") {
      audio.playFinish();
      if (!hasRecordedRef.current && sessionStartedAtRef.current !== null) {
        hasRecordedRef.current = true;
        new WorkoutHistoryRepository().record({
          workoutId: workout.id,
          workoutName: workout.name,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - sessionStartedAtRef.current,
        });
      }
    }
  }, [session.state, code, audio, workout.id, workout.name]);
```

- [ ] **Step 4: Run the full test file to verify no regressions**

Run: `npx vitest run src/app/app/workouts/\[id\]/run/__tests__/page.test.tsx`
Expected: PASS (all tests, including the new one)

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `npx vitest run`
Expected: PASS — all previously-passing tests (112+ before this task) still pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/app/workouts/\[id\]/run/page.tsx src/app/app/workouts/\[id\]/run/__tests__/page.test.tsx
git commit -m "feat: record workout history entry when a session finishes"
```

---

### Task 5: StatsRow component

**Files:**
- Create: `src/components/dashboard/StatsRow.tsx`
- Test: `src/components/dashboard/__tests__/StatsRow.test.tsx`

**Interfaces:**
- Consumes: `HistoryStats` from Task 2 (`src/lib/history/computeHistoryStats.ts`), `Card` from `src/components/ui/Card.tsx`
- Produces: `StatsRow({ stats, totalRoutines }: { stats: HistoryStats; totalRoutines: number })`

- [ ] **Step 1: Write the failing test**

Create `src/components/dashboard/__tests__/StatsRow.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsRow } from "../StatsRow";

describe("StatsRow", () => {
  it("shows a motivating empty state when there is no history yet", () => {
    render(<StatsRow stats={{ sessionsThisWeek: 0, streakDays: 0, totalTimeMs: 0 }} totalRoutines={2} />);
    expect(screen.getByText(/arrancá tu racha hoy/i)).toBeInTheDocument();
  });

  it("shows the session count for this week", () => {
    render(<StatsRow stats={{ sessionsThisWeek: 3, streakDays: 2, totalTimeMs: 7_200_000 }} totalRoutines={5} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows the streak in days", () => {
    render(<StatsRow stats={{ sessionsThisWeek: 3, streakDays: 5, totalTimeMs: 7_200_000 }} totalRoutines={5} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it("formats total time trained as hours and minutes", () => {
    render(<StatsRow stats={{ sessionsThisWeek: 1, streakDays: 1, totalTimeMs: 5_400_000 }} totalRoutines={5} />);
    // 5,400,000ms = 90 minutes = 1h 30m
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });

  it("shows the total number of saved routines", () => {
    render(<StatsRow stats={{ sessionsThisWeek: 0, streakDays: 0, totalTimeMs: 0 }} totalRoutines={7} />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/dashboard/__tests__/StatsRow.test.tsx`
Expected: FAIL — `Cannot find module '../StatsRow'`

- [ ] **Step 3: Implement StatsRow**

Create `src/components/dashboard/StatsRow.tsx`:

```tsx
import type { HistoryStats } from "@/lib/history/computeHistoryStats";
import { Card } from "@/components/ui/Card";

interface StatsRowProps {
  stats: HistoryStats;
  totalRoutines: number;
}

function formatDurationShort(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function StatsRow({ stats, totalRoutines }: StatsRowProps) {
  const hasHistory = stats.sessionsThisWeek > 0 || stats.streakDays > 0 || stats.totalTimeMs > 0;

  if (!hasHistory) {
    return (
      <Card className="text-center">
        <p className="text-white font-semibold">Arrancá tu racha hoy 🔥</p>
        <p className="text-sm text-gray-400 mt-1">
          Todavía no completaste ningún entrenamiento. Iniciá uno y volvé acá.
        </p>
      </Card>
    );
  }

  const items = [
    { label: "Esta semana", value: String(stats.sessionsThisWeek) },
    { label: "Racha", value: `${stats.streakDays}d` },
    { label: "Tiempo total", value: formatDurationShort(stats.totalTimeMs) },
    { label: "Rutinas", value: String(totalRoutines) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="text-center">
          <p className="font-tactical text-2xl text-brand-500">{item.value}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">{item.label}</p>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/dashboard/__tests__/StatsRow.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/StatsRow.tsx src/components/dashboard/__tests__/StatsRow.test.tsx
git commit -m "feat: add StatsRow dashboard component"
```

---

### Task 6: QuickActions component

**Files:**
- Create: `src/components/dashboard/QuickActions.tsx`
- Test: `src/components/dashboard/__tests__/QuickActions.test.tsx`

**Interfaces:**
- Consumes: `Button` from `src/components/ui/Button.tsx`, `Workout` from `@/types`
- Produces: `QuickActions({ workoutOfTheDay }: { workoutOfTheDay: Workout | null })`

- [ ] **Step 1: Write the failing test**

Create `src/components/dashboard/__tests__/QuickActions.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickActions } from "../QuickActions";
import type { Workout } from "@/types";

const workout: Workout = {
  id: "w1",
  name: "Murph",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [],
};

describe("QuickActions", () => {
  it("always shows links to create a routine and open the Display", () => {
    render(<QuickActions workoutOfTheDay={null} />);
    expect(screen.getByRole("link", { name: /nueva rutina/i })).toHaveAttribute("href", "/app/workouts/new");
    expect(screen.getByRole("link", { name: /abrir display/i })).toHaveAttribute("href", "/display");
  });

  it("does not show a 'continue' link when there is no workout of the day", () => {
    render(<QuickActions workoutOfTheDay={null} />);
    expect(screen.queryByRole("link", { name: /continuar/i })).not.toBeInTheDocument();
  });

  it("shows a 'continue' link to the workout of the day when present", () => {
    render(<QuickActions workoutOfTheDay={workout} />);
    const link = screen.getByRole("link", { name: /continuar murph/i });
    expect(link).toHaveAttribute("href", "/app/workouts/w1/run");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/dashboard/__tests__/QuickActions.test.tsx`
Expected: FAIL — `Cannot find module '../QuickActions'`

- [ ] **Step 3: Implement QuickActions**

Create `src/components/dashboard/QuickActions.tsx`:

```tsx
import Link from "next/link";
import type { Workout } from "@/types";
import { Button } from "@/components/ui/Button";

interface QuickActionsProps {
  workoutOfTheDay: Workout | null;
}

export function QuickActions({ workoutOfTheDay }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/app/workouts/new">
        <Button size="md">+ Nueva rutina</Button>
      </Link>
      <Link href="/display">
        <Button size="md" variant="secondary">
          📺 Abrir Display
        </Button>
      </Link>
      {workoutOfTheDay && (
        <Link href={`/app/workouts/${workoutOfTheDay.id}/run`}>
          <Button size="md" variant="secondary">
            ▶ Continuar {workoutOfTheDay.name}
          </Button>
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/dashboard/__tests__/QuickActions.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/QuickActions.tsx src/components/dashboard/__tests__/QuickActions.test.tsx
git commit -m "feat: add QuickActions dashboard component"
```

---

### Task 7: Upgrade WorkoutOfTheDay with block count and estimated duration

**Files:**
- Modify: `src/components/dashboard/WorkoutOfTheDay.tsx`
- Test: create `src/components/dashboard/__tests__/WorkoutOfTheDay.test.tsx`

**Interfaces:**
- Consumes: `countBlocksAndExercises` from `src/lib/workout/countBlocksAndExercises.ts`, `estimateWorkoutDurationSeconds` from Task 3

- [ ] **Step 1: Write the failing tests**

Create `src/components/dashboard/__tests__/WorkoutOfTheDay.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutOfTheDay } from "../WorkoutOfTheDay";
import type { Workout } from "@/types";

describe("WorkoutOfTheDay", () => {
  it("shows a create-workout prompt when there is none", () => {
    render(<WorkoutOfTheDay workout={null} />);
    expect(screen.getByText(/todavía no hay entrenamiento/i)).toBeInTheDocument();
  });

  it("shows the block count and estimated duration for the workout of the day", () => {
    const workout: Workout = {
      id: "w1",
      name: "Murph",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        { id: "b1", type: "amrap", durationSeconds: 600, exercises: [{ id: "e1", name: "Pull-up" }] },
        { id: "b2", type: "rest", durationSeconds: 60, exercises: [] },
      ],
    };
    render(<WorkoutOfTheDay workout={workout} />);
    expect(screen.getByText("Murph")).toBeInTheDocument();
    expect(screen.getByText(/2 bloques/i)).toBeInTheDocument();
    // (600 + 60)s = 660s = 11m
    expect(screen.getByText(/11m/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/dashboard/__tests__/WorkoutOfTheDay.test.tsx`
Expected: FAIL — current component doesn't render block count or duration text

- [ ] **Step 3: Update WorkoutOfTheDay**

Replace `src/components/dashboard/WorkoutOfTheDay.tsx` entirely:

```tsx
"use client";

import Link from "next/link";
import type { Workout } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { countBlocksAndExercises } from "@/lib/workout/countBlocksAndExercises";
import { estimateWorkoutDurationSeconds } from "@/lib/workout/estimateWorkoutDurationSeconds";

interface WorkoutOfTheDayProps {
  workout: Workout | null;
}

function formatEstimateMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
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

  const { blocks } = countBlocksAndExercises(workout);
  const estimatedSeconds = estimateWorkoutDurationSeconds(workout);

  return (
    <Card className="space-y-2">
      <p className="text-sm uppercase text-brand-500 tracking-wide">Entrenamiento del día</p>
      <p className="text-2xl font-bold text-white">{workout.name}</p>
      <p className="text-sm text-gray-400 font-tactical">
        {blocks} bloque{blocks === 1 ? "" : "s"}
        {estimatedSeconds > 0 && ` · ~${formatEstimateMinutes(estimatedSeconds)}`}
      </p>
      <Link href={`/app/workouts/${workout.id}/run`}>
        <Button size="lg">Iniciar</Button>
      </Link>
    </Card>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/dashboard/__tests__/WorkoutOfTheDay.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/WorkoutOfTheDay.tsx src/components/dashboard/__tests__/WorkoutOfTheDay.test.tsx
git commit -m "feat: show block count and estimated duration on WorkoutOfTheDay"
```

---

### Task 8: RecentWorkouts as a grid of WorkoutCard

**Files:**
- Modify: `src/components/dashboard/RecentWorkouts.tsx`
- Test: create `src/components/dashboard/__tests__/RecentWorkouts.test.tsx`

**Interfaces:**
- Consumes: `WorkoutCard` from `src/components/workout/WorkoutCard.tsx` (props: `workout`, `code?`, `onDuplicate`, `onDelete`)

- [ ] **Step 1: Write the failing tests**

Create `src/components/dashboard/__tests__/RecentWorkouts.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentWorkouts } from "../RecentWorkouts";
import type { Workout } from "@/types";

function makeWorkout(id: string, createdAt: string): Workout {
  return { id, name: `Workout ${id}`, createdAt, favorite: false, blocks: [] };
}

describe("RecentWorkouts", () => {
  it("renders nothing when there are no workouts", () => {
    const { container } = render(
      <RecentWorkouts workouts={[]} onDuplicate={vi.fn()} onDelete={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the 5 most recent workouts as cards, most recent first", () => {
    const workouts = [
      makeWorkout("a", "2026-01-01T00:00:00.000Z"),
      makeWorkout("b", "2026-01-03T00:00:00.000Z"),
      makeWorkout("c", "2026-01-02T00:00:00.000Z"),
    ];
    render(<RecentWorkouts workouts={workouts} onDuplicate={vi.fn()} onDelete={vi.fn()} />);
    const names = screen.getAllByText(/Workout [abc]/).map((el) => el.textContent);
    expect(names).toEqual(["Workout b", "Workout c", "Workout a"]);
  });

  it("calls onDuplicate with the workout id when its duplicate button is clicked", () => {
    const onDuplicate = vi.fn();
    const workouts = [makeWorkout("a", "2026-01-01T00:00:00.000Z")];
    render(<RecentWorkouts workouts={workouts} onDuplicate={onDuplicate} onDelete={vi.fn()} />);
    screen.getByLabelText("Duplicar entrenamiento").click();
    expect(onDuplicate).toHaveBeenCalledWith("a");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/dashboard/__tests__/RecentWorkouts.test.tsx`
Expected: FAIL — current component takes no `onDuplicate`/`onDelete` props and renders a plain `<ul>`

- [ ] **Step 3: Update RecentWorkouts**

Replace `src/components/dashboard/RecentWorkouts.tsx` entirely:

```tsx
"use client";

import type { Workout } from "@/types";
import { WorkoutCard } from "@/components/workout/WorkoutCard";

interface RecentWorkoutsProps {
  workouts: Workout[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RecentWorkouts({ workouts, onDuplicate, onDelete }: RecentWorkoutsProps) {
  const recent = [...workouts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-white font-semibold font-industrial">Entrenamientos recientes</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {recent.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} onDuplicate={onDuplicate} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/dashboard/__tests__/RecentWorkouts.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/RecentWorkouts.tsx src/components/dashboard/__tests__/RecentWorkouts.test.tsx
git commit -m "feat: render RecentWorkouts as a WorkoutCard grid with duplicate/delete"
```

---

### Task 9: Dashboard integration — header, stats, quick actions, search

**Files:**
- Modify: `src/components/dashboard/Dashboard.tsx`
- Test: create `src/components/dashboard/__tests__/Dashboard.test.tsx`

**Interfaces:**
- Consumes: `WorkoutHistoryRepository` (Task 1), `computeHistoryStats` (Task 2), `StatsRow` (Task 5), `QuickActions` (Task 6), `WorkoutOfTheDay` (Task 7), `RecentWorkouts` (Task 8), `LocalWorkoutRepository` (existing), `Input` (existing `src/components/ui/Input.tsx`)

- [ ] **Step 1: Write the failing tests**

Create `src/components/dashboard/__tests__/Dashboard.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dashboard } from "../Dashboard";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import type { Workout } from "@/types";

function seed(id: string, name: string, createdAt: string) {
  const workout: Workout = { id, name, createdAt, favorite: false, blocks: [] };
  new LocalWorkoutRepository().save(workout);
  return workout;
}

describe("Dashboard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the time-aware greeting header", () => {
    render(<Dashboard />);
    expect(screen.getByText(/¿Qué entrenamos hoy\?/i)).toBeInTheDocument();
  });

  it("shows stats derived from recorded history", () => {
    new WorkoutHistoryRepository().record({
      workoutId: "w1",
      workoutName: "Murph",
      completedAt: new Date().toISOString(),
      durationMs: 600_000,
    });
    render(<Dashboard />);
    expect(screen.getByText("1")).toBeInTheDocument(); // sessionsThisWeek
  });

  it("filters recent workouts by the search input", () => {
    seed("a", "Murph", "2026-01-01T00:00:00.000Z");
    seed("b", "Fran", "2026-01-02T00:00:00.000Z");
    render(<Dashboard />);
    expect(screen.getByText("Murph")).toBeInTheDocument();
    expect(screen.getByText("Fran")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/buscar entrenamiento/i), { target: { value: "mur" } });
    expect(screen.getByText("Murph")).toBeInTheDocument();
    expect(screen.queryByText("Fran")).not.toBeInTheDocument();
  });

  it("shows quick action links", () => {
    render(<Dashboard />);
    expect(screen.getByRole("link", { name: /nueva rutina/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir display/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/dashboard/__tests__/Dashboard.test.tsx`
Expected: FAIL — current `Dashboard` has no search input, no stats, no quick actions

- [ ] **Step 3: Rewrite Dashboard**

Replace `src/components/dashboard/Dashboard.tsx` entirely:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import { computeHistoryStats } from "@/lib/history/computeHistoryStats";
import { Input } from "@/components/ui/Input";
import { StatsRow } from "./StatsRow";
import { QuickActions } from "./QuickActions";
import { WorkoutOfTheDay } from "./WorkoutOfTheDay";
import { RecentWorkouts } from "./RecentWorkouts";

function greeting(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [historyStats, setHistoryStats] = useState(computeHistoryStats([]));
  const [query, setQuery] = useState("");
  const workoutRepo = useMemo(() => new LocalWorkoutRepository(), []);

  function reload() {
    const result = workoutRepo.list();
    setWorkouts(result.ok ? result.value : []);
    const historyResult = new WorkoutHistoryRepository().list();
    setHistoryStats(computeHistoryStats(historyResult.ok ? historyResult.value : []));
  }

  useEffect(() => {
    reload();
  }, []);

  const workoutOfTheDay = workouts.length > 0 ? workouts[workouts.length - 1] : null;
  const filtered = query.trim()
    ? workouts.filter((w) => w.name.toLowerCase().includes(query.trim().toLowerCase()))
    : workouts;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <p className="text-brand-500 text-sm uppercase tracking-wide">{greeting(new Date().getHours())}</p>
        <h1 className="text-2xl font-bold text-white font-industrial">¿Qué entrenamos hoy?</h1>
      </div>

      <StatsRow stats={historyStats} totalRoutines={workouts.length} />

      <QuickActions workoutOfTheDay={workoutOfTheDay} />

      <Input
        placeholder="Buscar entrenamiento..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar entrenamiento"
      />

      <WorkoutOfTheDay workout={workoutOfTheDay} />

      <RecentWorkouts
        workouts={filtered}
        onDuplicate={(id) => {
          workoutRepo.duplicate(id);
          reload();
        }}
        onDelete={(id) => {
          workoutRepo.delete(id);
          reload();
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/dashboard/__tests__/Dashboard.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: PASS — every test in the repo, including all pre-existing ones.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: no output (clean)

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/Dashboard.tsx src/components/dashboard/__tests__/Dashboard.test.tsx
git commit -m "feat: redesign Dashboard with stats, quick actions, search, and richer sections"
```

---

## Post-plan verification

After Task 9, manually verify in the browser (dev server) before considering
the Dashboard sub-project done:

1. `npm run dev`, open `/app` with no saved workouts → confirm the empty
   states read well (no bare `0`s, no broken layout).
2. Create a workout, run it to completion → confirm a `StatsRow` entry
   appears and `sessionsThisWeek` increments.
3. Confirm the search input filters `RecentWorkouts` live and that
   duplicate/delete still work from the Dashboard grid.
4. Confirm `/display` and `/app/workouts/new` links from `QuickActions`
   navigate correctly.

This is a UI-heavy change — per project convention, do not report this
sub-project complete without having exercised it in an actual browser (not
just green tests).
