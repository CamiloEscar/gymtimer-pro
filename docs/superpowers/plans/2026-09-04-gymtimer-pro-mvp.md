# GymTimer Pro MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working GymTimer Pro MVP — a Next.js app where a trainer builds and runs
timed workouts (Countdown, Count Up, AMRAP, EMOM, Interval, Tabata, For Time) from a
control panel, mirrored live to a Display screen in the same browser via BroadcastChannel,
with sound, local persistence, and full responsive support — no backend.

**Architecture:** Framework-agnostic TS engines (`Timer`, `Workout`, `Audio`, `Session`)
under `src/lib/`, each timestamp-driven and independently unit-tested with Vitest. React
components under `src/components/` are presentational only and consume engine state via
custom hooks. Persistence via a `WorkoutRepository` interface backed by `localStorage`.
Trainer↔Display sync via `BroadcastChannel`, keyed by a short connection code.

**Tech Stack:** Next.js 15 (App Router) + React + TypeScript (strict) + Tailwind CSS +
Vitest + Testing Library (for the few DOM-adjacent hook tests) + Web Audio API +
SpeechSynthesis API (optional) + BroadcastChannel API. No state-management library,
no UI kit, no charting/animation libraries.

## Global Constraints

- No `any` in TypeScript except with an inline comment justifying it (prompt Sección 77).
- No `setInterval`/`setTimeout` tick count as the source of truth for elapsed/remaining
  time — always derive from `Date.now()` timestamps (prompt Sección 31, 61, Regla 7).
- No new runtime dependencies beyond what's listed in Tech Stack without explicit
  justification in a commit message (Regla 2).
- Every engine (`timer`, `workout`, `audio`, `storage`, `session`) must be usable and
  testable with zero React import (Regla 8, Sección 58).
- `LocalWorkoutRepository` must implement a `WorkoutRepository` interface so it can be
  swapped for a Supabase-backed implementation later without touching callers (Regla 9).
- Must run correctly on mobile Chrome and desktop Chrome at 320px+, 768px+, 1024px+, and
  1920x1080 (Sección 28, 94 Caso 10).
- Display screen: dark theme by default, large typography, minimal chrome (Sección 27, 69).
- Zero paid infrastructure; `npm install && npm run dev` must be sufficient to run
  everything (Sección 85, 96).

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: entire project root via `create-next-app` (package.json, tsconfig.json,
  next.config.ts, tailwind config, `src/app/layout.tsx`, `src/app/page.tsx`,
  `src/app/globals.css`, `.eslintrc`/`eslint.config.mjs`)
- Create: `vitest.config.ts`
- Create: `.env.example`
- Modify: `.gitignore` (created by create-next-app; verify `node_modules`, `.next`,
  `.env*.local` are present)

**Interfaces:**
- Produces: a runnable Next.js app skeleton with `npm run dev`, `npm run build`,
  `npm run lint`, `npm run test` scripts. All later tasks build inside `src/`.

- [ ] **Step 1: Scaffold with create-next-app**

Run from `C:\Users\camil\Proyectos\GymTimer`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

When prompted about the current directory not being empty, confirm to proceed (only
`GYMTIMER-PRO-PROMPT.md`, `docs/`, `.remember/`, `.git/` exist — no conflicts with
generated files).

- [ ] **Step 2: Verify the dev server boots**

Run: `npm run dev` (then Ctrl+C after confirming it serves on localhost:3000)
Expected: "Ready in ..." log line, default Next.js welcome page reachable.

- [ ] **Step 3: Install Vitest and Testing Library**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 5: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 6: Add test script to `package.json`**

Add under `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Write a smoke test to confirm the harness works**

Create `src/lib/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 8: Run the smoke test**

Run: `npm run test`
Expected: `1 passed`

- [ ] **Step 9: Create `.env.example`**

```bash
# GymTimer Pro — environment variables
# MVP (Phase 1) requires none. Reserved for Phase 2+:

# Phase 2 — realtime sync between devices
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Phase 3 — auth
# SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript, Tailwind, Vitest"
```

---

## Task 2: Domain types

**Files:**
- Create: `src/types/timer.ts`
- Create: `src/types/workout.ts`
- Create: `src/types/session.ts`
- Create: `src/types/index.ts` (barrel re-export)

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces: every type used by Tasks 3–13. Exact names below are load-bearing —
  later tasks reference them verbatim.

- [ ] **Step 1: Create `src/types/timer.ts`**

```ts
export type TimerMode = "countdown" | "countup";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  durationMs: number;
  elapsedMs: number;
  remainingMs: number;
}

export type TimerListener = (state: TimerState) => void;
export type Unsubscribe = () => void;
```

- [ ] **Step 2: Create `src/types/workout.ts`**

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

export interface Exercise {
  id: string;
  name: string;
  reps?: number;
  timeSeconds?: number;
  distanceMeters?: number;
  weightKg?: number;
  notes?: string;
}

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

export interface Workout {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  favorite: boolean;
  blocks: WorkoutBlock[];
}

export interface WorkoutResult {
  id: string;
  workoutId: string;
  athleteName: string;
  rounds?: number;
  reps?: number;
  weightKg?: number;
  timeSeconds?: number;
  notes?: string;
  recordedAt: string;
}
```

- [ ] **Step 3: Create `src/types/session.ts`**

```ts
import type { TimerState } from "./timer";
import type { Workout, WorkoutBlock } from "./workout";

export type SessionStatus = "waiting" | "ready" | "running" | "paused" | "finished";

export type WorkoutPhase = "getReady" | "work" | "rest" | "finished";

export interface SessionState {
  code: string;
  workout: Workout;
  status: SessionStatus;
  currentBlockIndex: number;
  currentRound: number;
  totalRounds: number;
  currentPhase: WorkoutPhase;
  currentExerciseIndex: number;
  timer: TimerState;
}

export type ConnectionStatus = "waiting" | "connected" | "disconnected";

export interface SessionMessage {
  kind: "state" | "heartbeat" | "ping";
  state?: SessionState;
  sentAt: number;
}

export type CurrentBlock = WorkoutBlock;
```

- [ ] **Step 4: Create `src/types/index.ts`**

```ts
export * from "./timer";
export * from "./workout";
export * from "./session";
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/types
git commit -m "feat: add domain types for timer, workout, session"
```

---

## Task 3: Timer Engine

**Files:**
- Create: `src/lib/timer/TimerEngine.ts`
- Test: `src/lib/timer/__tests__/TimerEngine.test.ts`

**Interfaces:**
- Consumes: `TimerMode`, `TimerStatus`, `TimerState`, `TimerListener`, `Unsubscribe`
  from `@/types`.
- Produces: `class TimerEngine` with constructor `(mode: TimerMode, durationMs: number)`,
  methods `start(): void`, `pause(): void`, `resume(): void`, `reset(): void`,
  `addTime(ms: number): void`, `subtractTime(ms: number): void`,
  `getState(): TimerState`, `subscribe(listener: TimerListener): Unsubscribe`,
  `destroy(): void`. Later tasks (Workout Engine, hooks) depend on these exact names.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/timer/__tests__/TimerEngine.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TimerEngine } from "../TimerEngine";

describe("TimerEngine — countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle with full duration remaining", () => {
    const engine = new TimerEngine("countdown", 10_000);
    const state = engine.getState();
    expect(state.status).toBe("idle");
    expect(state.remainingMs).toBe(10_000);
    expect(state.elapsedMs).toBe(0);
  });

  it("counts down based on elapsed wall-clock time, not tick count", () => {
    const engine = new TimerEngine("countdown", 10_000);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:03.000Z"));
    vi.advanceTimersByTime(3000);
    expect(engine.getState().remainingMs).toBe(7000);
  });

  it("reaches finished exactly at 0 and clamps there", () => {
    const engine = new TimerEngine("countdown", 5000);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:06.000Z"));
    vi.advanceTimersByTime(6000);
    const state = engine.getState();
    expect(state.status).toBe("finished");
    expect(state.remainingMs).toBe(0);
  });

  it("survives a simulated tab sleep: only wall-clock time matters", () => {
    const engine = new TimerEngine("countdown", 10_000);
    engine.start();
    // Simulate the tab being suspended for 4s with zero intervening ticks:
    // jump the system clock without calling advanceTimersByTime.
    vi.setSystemTime(new Date("2026-01-01T00:00:04.000Z"));
    expect(engine.getState().remainingMs).toBe(6000);
  });

  it("pause freezes remaining time; resume continues from there", () => {
    const engine = new TimerEngine("countdown", 10_000);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:03.000Z"));
    engine.pause();
    expect(engine.getState().status).toBe("paused");
    expect(engine.getState().remainingMs).toBe(7000);

    // Time passes while paused — must not count.
    vi.setSystemTime(new Date("2026-01-01T00:00:08.000Z"));
    expect(engine.getState().remainingMs).toBe(7000);

    engine.resume();
    vi.setSystemTime(new Date("2026-01-01T00:00:10.000Z"));
    expect(engine.getState().remainingMs).toBe(5000);
  });

  it("reset returns to idle at full duration", () => {
    const engine = new TimerEngine("countdown", 10_000);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:05.000Z"));
    engine.reset();
    const state = engine.getState();
    expect(state.status).toBe("idle");
    expect(state.remainingMs).toBe(10_000);
  });

  it("addTime extends remaining time; subtractTime reduces it", () => {
    const engine = new TimerEngine("countdown", 10_000);
    engine.start();
    engine.addTime(5000);
    expect(engine.getState().remainingMs).toBe(15_000);
    engine.subtractTime(3000);
    expect(engine.getState().remainingMs).toBe(12_000);
  });

  it("notifies subscribers on start/pause/resume/reset", () => {
    const engine = new TimerEngine("countdown", 10_000);
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);

    engine.start();
    expect(listener).toHaveBeenCalled();
    listener.mockClear();

    engine.pause();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    listener.mockClear();
    engine.resume();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("TimerEngine — count up", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("grows elapsedMs without a finish condition", () => {
    const engine = new TimerEngine("countup", 0);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:15:32.000Z"));
    const state = engine.getState();
    expect(state.status).toBe("running");
    expect(state.elapsedMs).toBe(15 * 60_000 + 32_000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- TimerEngine`
Expected: FAIL — `Cannot find module '../TimerEngine'`

- [ ] **Step 3: Implement `src/lib/timer/TimerEngine.ts`**

```ts
import type {
  TimerMode,
  TimerStatus,
  TimerState,
  TimerListener,
  Unsubscribe,
} from "@/types";

const TICK_INTERVAL_MS = 100;

export class TimerEngine {
  private mode: TimerMode;
  private durationMs: number;
  private status: TimerStatus = "idle";
  private startedAt: number | null = null;
  private accumulatedMs = 0;
  private listeners = new Set<TimerListener>();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(mode: TimerMode, durationMs: number) {
    this.mode = mode;
    this.durationMs = durationMs;
  }

  start(): void {
    if (this.status === "running") return;
    this.status = "running";
    this.startedAt = Date.now();
    this.startTicking();
    this.notify();
  }

  pause(): void {
    if (this.status !== "running") return;
    this.accumulatedMs = this.computeElapsedMs();
    this.startedAt = null;
    this.status = "paused";
    this.stopTicking();
    this.notify();
  }

  resume(): void {
    if (this.status !== "paused") return;
    this.status = "running";
    this.startedAt = Date.now();
    this.startTicking();
    this.notify();
  }

  reset(): void {
    this.stopTicking();
    this.status = "idle";
    this.startedAt = null;
    this.accumulatedMs = 0;
    this.notify();
  }

  addTime(ms: number): void {
    this.accumulatedMs = Math.max(0, this.accumulatedMs - ms);
    if (this.status === "running") {
      this.startedAt = Date.now();
    }
    this.notify();
  }

  subtractTime(ms: number): void {
    this.addTime(-ms);
  }

  getState(): TimerState {
    const elapsedMs = this.computeElapsedMs();
    const remainingMs =
      this.mode === "countdown" ? Math.max(0, this.durationMs - elapsedMs) : 0;
    return {
      mode: this.mode,
      status: this.status,
      durationMs: this.durationMs,
      elapsedMs,
      remainingMs,
    };
  }

  subscribe(listener: TimerListener): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.stopTicking();
    this.listeners.clear();
  }

  private computeElapsedMs(): number {
    const runningMs =
      this.status === "running" && this.startedAt !== null
        ? Date.now() - this.startedAt
        : 0;
    return this.accumulatedMs + runningMs;
  }

  private startTicking(): void {
    this.stopTicking();
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  private stopTicking(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    if (this.status !== "running") return;
    if (this.mode === "countdown" && this.computeElapsedMs() >= this.durationMs) {
      this.accumulatedMs = this.durationMs;
      this.startedAt = null;
      this.status = "finished";
      this.stopTicking();
    }
    this.notify();
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
```

Note: `setInterval` here only *triggers a re-check/notify* every 100ms — the actual
`remainingMs`/`elapsedMs` values always come from `Date.now() - startedAt`, satisfying
the "no naive setInterval as clock" constraint.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- TimerEngine`
Expected: all tests in the file PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/timer
git commit -m "feat: add timestamp-based TimerEngine with countdown/countup support"
```

---

## Task 4: Audio Engine

**Files:**
- Create: `src/lib/audio/AudioManager.ts`
- Test: `src/lib/audio/__tests__/AudioManager.test.ts`

**Interfaces:**
- Consumes: nothing external (uses `AudioContext`, `SpeechSynthesis` behind feature
  checks).
- Produces: `class AudioManager` with `constructor(options?: { enabled?: boolean;
  voiceEnabled?: boolean })`, methods `playStart(): void`, `playCountdownBeep(): void`,
  `playRoundChange(): void`, `playWorkToRest(): void`, `playRestToWork(): void`,
  `playFinish(): void`, `speak(text: string): void`, `setEnabled(enabled: boolean): void`,
  `setVoiceEnabled(enabled: boolean): void`, `unlock(): void`. Later tasks (WorkoutEngine
  consumer hook, Settings UI) call these exact method names.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/audio/__tests__/AudioManager.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AudioManager } from "../AudioManager";

function makeFakeAudioContext() {
  const oscillator = {
    type: "sine",
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  return {
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
    destination: {},
    currentTime: 0,
    resume: vi.fn().mockResolvedValue(undefined),
    state: "suspended",
  };
}

describe("AudioManager", () => {
  let fakeCtx: ReturnType<typeof makeFakeAudioContext>;

  beforeEach(() => {
    fakeCtx = makeFakeAudioContext();
    vi.stubGlobal(
      "AudioContext",
      vi.fn(() => fakeCtx)
    );
  });

  it("does not play any sound when disabled", () => {
    const manager = new AudioManager({ enabled: false });
    manager.playStart();
    expect(fakeCtx.createOscillator).not.toHaveBeenCalled();
  });

  it("plays a beep via the Web Audio API when enabled", () => {
    const manager = new AudioManager({ enabled: true });
    manager.unlock();
    manager.playStart();
    expect(fakeCtx.createOscillator).toHaveBeenCalled();
  });

  it("setEnabled(false) silences subsequent calls", () => {
    const manager = new AudioManager({ enabled: true });
    manager.unlock();
    manager.setEnabled(false);
    manager.playFinish();
    expect(fakeCtx.createOscillator).not.toHaveBeenCalled();
  });

  it("speak() is a no-op when voice is disabled", () => {
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      vi.fn().mockImplementation((text: string) => ({ text }))
    );

    const manager = new AudioManager({ enabled: true, voiceEnabled: false });
    manager.speak("Get ready");
    expect(speak).not.toHaveBeenCalled();
  });

  it("speak() calls speechSynthesis when voice is enabled", () => {
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      vi.fn().mockImplementation((text: string) => ({ text }))
    );

    const manager = new AudioManager({ enabled: true, voiceEnabled: true });
    manager.speak("Get ready");
    expect(speak).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- AudioManager`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/audio/AudioManager.ts`**

```ts
interface AudioManagerOptions {
  enabled?: boolean;
  voiceEnabled?: boolean;
}

type ToneSpec = { frequency: number; durationMs: number };

export class AudioManager {
  private enabled: boolean;
  private voiceEnabled: boolean;
  private ctx: AudioContext | null = null;

  constructor(options: AudioManagerOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.voiceEnabled = options.voiceEnabled ?? false;
  }

  /** Must be called from a user gesture (e.g. the first START tap) to satisfy
   * browser autoplay policies (prompt Sección 13). */
  unlock(): void {
    if (!this.enabled) return;
    this.ctx ??= new AudioContext();
    void this.ctx.resume();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled;
  }

  playStart(): void {
    this.playTone({ frequency: 880, durationMs: 150 });
  }

  playCountdownBeep(): void {
    this.playTone({ frequency: 660, durationMs: 100 });
  }

  playRoundChange(): void {
    this.playTone({ frequency: 520, durationMs: 120 });
  }

  playWorkToRest(): void {
    this.playTone({ frequency: 400, durationMs: 200 });
  }

  playRestToWork(): void {
    this.playTone({ frequency: 700, durationMs: 200 });
  }

  playFinish(): void {
    this.playTone({ frequency: 1000, durationMs: 400 });
  }

  speak(text: string): void {
    if (!this.enabled || !this.voiceEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  private playTone({ frequency, durationMs }: ToneSpec): void {
    if (!this.enabled) return;
    this.ctx ??= new AudioContext();
    const ctx = this.ctx;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);
    oscillator.start();
    oscillator.stop(ctx.currentTime + durationMs / 1000);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- AudioManager`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/audio
git commit -m "feat: add AudioManager with synthesized beeps and optional speech"
```

---

## Task 5: Storage repository

**Files:**
- Create: `src/lib/storage/WorkoutRepository.ts` (interface + `Result` type)
- Create: `src/lib/storage/LocalWorkoutRepository.ts`
- Test: `src/lib/storage/__tests__/LocalWorkoutRepository.test.ts`

**Interfaces:**
- Consumes: `Workout` from `@/types`.
- Produces: `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`,
  `interface WorkoutRepository` with `list(): Result<Workout[], StorageError>`,
  `get(id: string): Result<Workout | null, StorageError>`,
  `save(workout: Workout): Result<Workout, StorageError>`,
  `delete(id: string): Result<void, StorageError>`,
  `duplicate(id: string): Result<Workout, StorageError>`, and
  `class LocalWorkoutRepository implements WorkoutRepository`. Task 9 (Builder) and
  Task 10 (Library) depend on these exact signatures.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/storage/__tests__/LocalWorkoutRepository.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalWorkoutRepository } from "../LocalWorkoutRepository";
import type { Workout } from "@/types";

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: overrides.id ?? "w1",
    name: overrides.name ?? "AMRAP 10",
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
    favorite: overrides.favorite ?? false,
    blocks: overrides.blocks ?? [],
    ...overrides,
  };
}

describe("LocalWorkoutRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty list when nothing is saved", () => {
    const repo = new LocalWorkoutRepository();
    const result = repo.list();
    expect(result).toEqual({ ok: true, value: [] });
  });

  it("saves and retrieves a workout", () => {
    const repo = new LocalWorkoutRepository();
    const workout = makeWorkout();
    repo.save(workout);
    const result = repo.get("w1");
    expect(result).toEqual({ ok: true, value: workout });
  });

  it("lists all saved workouts", () => {
    const repo = new LocalWorkoutRepository();
    repo.save(makeWorkout({ id: "w1" }));
    repo.save(makeWorkout({ id: "w2", name: "EMOM 10" }));
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
    }
  });

  it("deletes a workout", () => {
    const repo = new LocalWorkoutRepository();
    repo.save(makeWorkout({ id: "w1" }));
    repo.delete("w1");
    const result = repo.get("w1");
    expect(result).toEqual({ ok: true, value: null });
  });

  it("duplicates a workout with a new id and '(copy)' suffix", () => {
    const repo = new LocalWorkoutRepository();
    repo.save(makeWorkout({ id: "w1", name: "Fran" }));
    const result = repo.duplicate("w1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).not.toBe("w1");
      expect(result.value.name).toBe("Fran (copy)");
    }
    const listResult = repo.list();
    expect(listResult.ok && listResult.value).toHaveLength(2);
  });

  it("returns an error Result instead of throwing when localStorage is unavailable", () => {
    const repo = new LocalWorkoutRepository();
    const spy = vi
      .spyOn(window.localStorage.__proto__, "setItem")
      .mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

    const result = repo.save(makeWorkout());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("write_failed");
    }

    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- LocalWorkoutRepository`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/storage/WorkoutRepository.ts`**

```ts
import type { Workout } from "@/types";

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export interface StorageError {
  kind: "read_failed" | "write_failed" | "not_found";
  message: string;
}

export interface WorkoutRepository {
  list(): Result<Workout[], StorageError>;
  get(id: string): Result<Workout | null, StorageError>;
  save(workout: Workout): Result<Workout, StorageError>;
  delete(id: string): Result<void, StorageError>;
  duplicate(id: string): Result<Workout, StorageError>;
}
```

- [ ] **Step 4: Implement `src/lib/storage/LocalWorkoutRepository.ts`**

```ts
import type { Workout } from "@/types";
import type { Result, StorageError, WorkoutRepository } from "./WorkoutRepository";

const STORAGE_KEY = "gymtimer.workouts";

function ok<T>(value: T): Result<T, StorageError> {
  return { ok: true, value };
}

function err<T>(kind: StorageError["kind"], message: string): Result<T, StorageError> {
  return { ok: false, error: { kind, message } };
}

export class LocalWorkoutRepository implements WorkoutRepository {
  list(): Result<Workout[], StorageError> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const workouts: Workout[] = raw ? JSON.parse(raw) : [];
      return ok(workouts);
    } catch {
      return err("read_failed", "Could not read workouts from localStorage");
    }
  }

  get(id: string): Result<Workout | null, StorageError> {
    const listResult = this.list();
    if (!listResult.ok) return listResult;
    return ok(listResult.value.find((w) => w.id === id) ?? null);
  }

  save(workout: Workout): Result<Workout, StorageError> {
    const listResult = this.list();
    if (!listResult.ok) return listResult;
    const existingIndex = listResult.value.findIndex((w) => w.id === workout.id);
    const next = [...listResult.value];
    if (existingIndex >= 0) {
      next[existingIndex] = workout;
    } else {
      next.push(workout);
    }
    return this.writeAll(next, workout);
  }

  delete(id: string): Result<void, StorageError> {
    const listResult = this.list();
    if (!listResult.ok) return listResult;
    const next = listResult.value.filter((w) => w.id !== id);
    const writeResult = this.writeAll(next, undefined);
    if (!writeResult.ok) return writeResult;
    return ok(undefined);
  }

  duplicate(id: string): Result<Workout, StorageError> {
    const getResult = this.get(id);
    if (!getResult.ok) return getResult;
    if (!getResult.value) {
      return err("not_found", `Workout ${id} not found`);
    }
    const copy: Workout = {
      ...getResult.value,
      id: crypto.randomUUID(),
      name: `${getResult.value.name} (copy)`,
      createdAt: new Date().toISOString(),
    };
    return this.save(copy);
  }

  private writeAll<T>(
    workouts: Workout[],
    returnValue: T
  ): Result<T, StorageError> {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
      return ok(returnValue as T);
    } catch {
      return err("write_failed", "Could not write workouts to localStorage");
    }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- LocalWorkoutRepository`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/storage
git commit -m "feat: add WorkoutRepository interface and LocalWorkoutRepository"
```

---

## Task 6: Workout Engine

**Files:**
- Create: `src/lib/workout/WorkoutEngine.ts`
- Test: `src/lib/workout/__tests__/WorkoutEngine.test.ts`

**Interfaces:**
- Consumes: `TimerEngine` from `@/lib/timer/TimerEngine`; `Workout`, `WorkoutBlock`,
  `SessionState`, `SessionStatus`, `WorkoutPhase` from `@/types`.
- Produces: `class WorkoutEngine` with `constructor(workout: Workout)`, methods
  `start(): void`, `pause(): void`, `resume(): void`, `reset(): void`,
  `nextRound(): void`, `previousRound(): void`, `skipBlock(): void`,
  `addTime(ms: number): void`, `subtractTime(ms: number): void`,
  `getState(): SessionState`, `subscribe(listener: (state: SessionState) => void):
  () => void`, `destroy(): void`. Task 7 (Session Engine) and Task 12 (run panel hook)
  depend on these exact names.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/workout/__tests__/WorkoutEngine.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WorkoutEngine } from "../WorkoutEngine";
import type { Workout } from "@/types";

const amrapWorkout: Workout = {
  id: "w1",
  name: "AMRAP 10",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [
    {
      id: "b1",
      type: "amrap",
      durationSeconds: 10,
      rounds: 1,
      exercises: [
        { id: "e1", name: "Push Ups", reps: 10 },
        { id: "e2", name: "Air Squats", reps: 15 },
      ],
    },
  ],
};

const intervalWorkout: Workout = {
  id: "w2",
  name: "Intervals",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [
    {
      id: "b1",
      type: "interval",
      durationSeconds: 0,
      workSeconds: 5,
      restSeconds: 3,
      rounds: 2,
      exercises: [{ id: "e1", name: "Row" }],
    },
  ],
};

describe("WorkoutEngine — AMRAP", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("starts in the getReady phase before start()", () => {
    const engine = new WorkoutEngine(amrapWorkout);
    expect(engine.getState().currentPhase).toBe("getReady");
    expect(engine.getState().status).toBe("ready");
  });

  it("moves to work phase and counts down the AMRAP duration", () => {
    const engine = new WorkoutEngine(amrapWorkout);
    engine.start();
    expect(engine.getState().status).toBe("running");
    expect(engine.getState().currentPhase).toBe("work");
    expect(engine.getState().timer.remainingMs).toBe(10_000);
  });

  it("finishes the workout when the AMRAP duration elapses", () => {
    const engine = new WorkoutEngine(amrapWorkout);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:11.000Z"));
    vi.advanceTimersByTime(11_000);
    expect(engine.getState().status).toBe("finished");
    expect(engine.getState().currentPhase).toBe("finished");
  });
});

describe("WorkoutEngine — Interval (work/rest rounds)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("starts round 1 in the work phase for workSeconds", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    const state = engine.getState();
    expect(state.currentPhase).toBe("work");
    expect(state.currentRound).toBe(1);
    expect(state.totalRounds).toBe(2);
    expect(state.timer.remainingMs).toBe(5000);
  });

  it("transitions work -> rest after workSeconds elapses", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:05.100Z"));
    vi.advanceTimersByTime(5100);
    const state = engine.getState();
    expect(state.currentPhase).toBe("rest");
    expect(state.timer.remainingMs).toBe(3000);
  });

  it("transitions rest -> next round's work phase", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:05.100Z"));
    vi.advanceTimersByTime(5100);
    vi.setSystemTime(new Date("2026-01-01T00:00:08.200Z"));
    vi.advanceTimersByTime(3100);
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.currentPhase).toBe("work");
  });

  it("finishes after the last round's rest completes", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    // round 1 work (5s) + rest (3s) + round 2 work (5s) + rest (3s) = 16s
    vi.setSystemTime(new Date("2026-01-01T00:00:16.200Z"));
    vi.advanceTimersByTime(16_200);
    expect(engine.getState().status).toBe("finished");
  });

  it("pause/resume preserves the current phase and round", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:02.000Z"));
    engine.pause();
    expect(engine.getState().status).toBe("paused");
    expect(engine.getState().currentPhase).toBe("work");

    engine.resume();
    vi.setSystemTime(new Date("2026-01-01T00:00:05.100Z"));
    vi.advanceTimersByTime(3100);
    expect(engine.getState().currentPhase).toBe("rest");
  });

  it("nextRound skips directly to the following round's work phase", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    engine.nextRound();
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.currentPhase).toBe("work");
  });

  it("reset returns to the ready state at round 1", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    engine.nextRound();
    engine.reset();
    const state = engine.getState();
    expect(state.status).toBe("ready");
    expect(state.currentRound).toBe(1);
    expect(state.currentPhase).toBe("getReady");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- WorkoutEngine`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/workout/WorkoutEngine.ts`**

```ts
import { TimerEngine } from "@/lib/timer/TimerEngine";
import type {
  SessionState,
  SessionStatus,
  Workout,
  WorkoutBlock,
  WorkoutPhase,
} from "@/types";

type Listener = (state: SessionState) => void;

export class WorkoutEngine {
  private workout: Workout;
  private status: SessionStatus = "ready";
  private blockIndex = 0;
  private round = 1;
  private phase: WorkoutPhase = "getReady";
  private timer: TimerEngine;
  private listeners = new Set<Listener>();
  private unsubscribeTimer: () => void;

  constructor(workout: Workout) {
    this.workout = workout;
    this.timer = this.buildTimerForCurrentPhase();
    this.unsubscribeTimer = this.timer.subscribe(() => this.onTimerTick());
  }

  start(): void {
    if (this.status === "running") return;
    this.status = "running";
    this.phase = "work";
    this.timer.start();
    this.notify();
  }

  pause(): void {
    this.timer.pause();
    this.status = "paused";
    this.notify();
  }

  resume(): void {
    this.status = "running";
    this.timer.resume();
    this.notify();
  }

  reset(): void {
    this.timer.destroy();
    this.blockIndex = 0;
    this.round = 1;
    this.phase = "getReady";
    this.status = "ready";
    this.timer = this.buildTimerForCurrentPhase();
    this.unsubscribeTimer = this.timer.subscribe(() => this.onTimerTick());
    this.notify();
  }

  nextRound(): void {
    const block = this.currentBlock();
    const totalRounds = block.rounds ?? 1;
    if (this.round >= totalRounds) {
      this.finish();
      return;
    }
    this.round += 1;
    this.phase = "work";
    this.replaceTimer("work");
    if (this.status === "running") this.timer.start();
    this.notify();
  }

  previousRound(): void {
    if (this.round <= 1) return;
    this.round -= 1;
    this.phase = "work";
    this.replaceTimer("work");
    if (this.status === "running") this.timer.start();
    this.notify();
  }

  skipBlock(): void {
    this.finish();
  }

  addTime(ms: number): void {
    this.timer.addTime(ms);
  }

  subtractTime(ms: number): void {
    this.timer.subtractTime(ms);
  }

  getState(): SessionState {
    const block = this.currentBlock();
    return {
      code: "",
      workout: this.workout,
      status: this.status,
      currentBlockIndex: this.blockIndex,
      currentRound: this.round,
      totalRounds: block.rounds ?? 1,
      currentPhase: this.phase,
      currentExerciseIndex: 0,
      timer: this.timer.getState(),
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.unsubscribeTimer();
    this.timer.destroy();
    this.listeners.clear();
  }

  private currentBlock(): WorkoutBlock {
    return this.workout.blocks[this.blockIndex];
  }

  private onTimerTick(): void {
    const timerState = this.timer.getState();
    if (timerState.status === "finished") {
      this.advancePhase();
    }
    this.notify();
  }

  private advancePhase(): void {
    const block = this.currentBlock();

    if (block.type === "interval" || block.type === "tabata") {
      const totalRounds = block.rounds ?? 1;
      if (this.phase === "work") {
        if (block.restSeconds && block.restSeconds > 0) {
          this.phase = "rest";
          this.replaceTimer("rest");
          this.timer.start();
          return;
        }
        this.advanceRoundOrFinish(totalRounds);
        return;
      }
      if (this.phase === "rest") {
        this.advanceRoundOrFinish(totalRounds);
        return;
      }
    }

    // amrap / countdown / countup / emom / forTime / rest: single duration, then finish.
    this.finish();
  }

  private advanceRoundOrFinish(totalRounds: number): void {
    if (this.round >= totalRounds) {
      this.finish();
      return;
    }
    this.round += 1;
    this.phase = "work";
    this.replaceTimer("work");
    this.timer.start();
  }

  private finish(): void {
    this.timer.pause();
    this.phase = "finished";
    this.status = "finished";
    this.notify();
  }

  private replaceTimer(phase: "work" | "rest"): void {
    this.unsubscribeTimer();
    this.timer.destroy();
    const block = this.currentBlock();
    const seconds =
      phase === "work" ? block.workSeconds ?? block.durationSeconds : block.restSeconds ?? 0;
    this.timer = new TimerEngine("countdown", seconds * 1000);
    this.unsubscribeTimer = this.timer.subscribe(() => this.onTimerTick());
  }

  private buildTimerForCurrentPhase(): TimerEngine {
    const block = this.currentBlock();
    if (block.type === "countup" || block.type === "forTime") {
      return new TimerEngine("countup", 0);
    }
    if (block.type === "interval" || block.type === "tabata") {
      return new TimerEngine("countdown", (block.workSeconds ?? 0) * 1000);
    }
    return new TimerEngine("countdown", block.durationSeconds * 1000);
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
```

Note: EMOM is modeled as an `interval` block with `workSeconds = 60`, `restSeconds = 0`,
`rounds = number of minutes` at the Workout Builder level (Task 9) — this reuses the
interval phase machine instead of adding a fifth phase-transition branch, per YAGNI.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- WorkoutEngine`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/workout
git commit -m "feat: add WorkoutEngine with phase/round state machine"
```

---

## Task 7: Session Engine (BroadcastChannel transport)

**Files:**
- Create: `src/lib/session/SessionChannel.ts`
- Create: `src/lib/session/generateCode.ts`
- Test: `src/lib/session/__tests__/SessionChannel.test.ts`
- Test: `src/lib/session/__tests__/generateCode.test.ts`

**Interfaces:**
- Consumes: `SessionState`, `SessionMessage`, `ConnectionStatus` from `@/types`.
- Produces: `function generateCode(): string` (6 uppercase alphanumeric chars, e.g.
  `ABC123`); `class SessionChannel` with `constructor(code: string, role: "trainer" |
  "display")`, methods `sendState(state: SessionState): void`,
  `onState(listener: (state: SessionState) => void): () => void`,
  `onConnectionStatusChange(listener: (status: ConnectionStatus) => void): () => void`,
  `getConnectionStatus(): ConnectionStatus`, `destroy(): void`. Task 12 (Trainer run
  panel) and Task 13 (Display) depend on these exact names.

- [ ] **Step 1: Write the failing test for `generateCode`**

Create `src/lib/session/__tests__/generateCode.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateCode } from "../generateCode";

describe("generateCode", () => {
  it("returns a 6-character uppercase alphanumeric code", () => {
    const code = generateCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("returns different codes across calls (no fixed seed)", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails, then implement `generateCode.ts`**

Run: `npm run test -- generateCode` → FAIL (module not found).

```ts
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity

export function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
```

Run: `npm run test -- generateCode` → PASS.

- [ ] **Step 3: Write the failing test for `SessionChannel`**

Create `src/lib/session/__tests__/SessionChannel.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SessionChannel } from "../SessionChannel";
import type { SessionState } from "@/types";

const sampleState: SessionState = {
  code: "ABC123",
  workout: {
    id: "w1",
    name: "AMRAP 10",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [],
  },
  status: "running",
  currentBlockIndex: 0,
  currentRound: 1,
  totalRounds: 1,
  currentPhase: "work",
  currentExerciseIndex: 0,
  timer: {
    mode: "countdown",
    status: "running",
    durationMs: 10_000,
    elapsedMs: 0,
    remainingMs: 10_000,
  },
};

describe("SessionChannel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delivers state sent by the trainer to a display on the same code", () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ABC123", "display");
    const received: SessionState[] = [];
    display.onState((state) => received.push(state));

    trainer.sendState(sampleState);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(sampleState);

    trainer.destroy();
    display.destroy();
  });

  it("does not deliver state across different codes", () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ZZZ999", "display");
    const received: SessionState[] = [];
    display.onState((state) => received.push(state));

    trainer.sendState(sampleState);

    expect(received).toHaveLength(0);

    trainer.destroy();
    display.destroy();
  });

  it("reports 'connected' after receiving a message, 'disconnected' after 5s of silence", () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ABC123", "display");
    const statuses: string[] = [];
    display.onConnectionStatusChange((status) => statuses.push(status));

    trainer.sendState(sampleState);
    expect(display.getConnectionStatus()).toBe("connected");

    vi.advanceTimersByTime(5100);
    expect(display.getConnectionStatus()).toBe("disconnected");
    expect(statuses).toContain("disconnected");

    trainer.destroy();
    display.destroy();
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm run test -- SessionChannel`
Expected: FAIL — module not found.

- [ ] **Step 5: Implement `src/lib/session/SessionChannel.ts`**

```ts
import type { ConnectionStatus, SessionMessage, SessionState } from "@/types";

const DISCONNECT_TIMEOUT_MS = 5000;

type StateListener = (state: SessionState) => void;
type StatusListener = (status: ConnectionStatus) => void;

export class SessionChannel {
  private channel: BroadcastChannel;
  private stateListeners = new Set<StateListener>();
  private statusListeners = new Set<StatusListener>();
  private status: ConnectionStatus = "waiting";
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly code: string,
    private readonly role: "trainer" | "display"
  ) {
    this.channel = new BroadcastChannel(`gymtimer:session:${code}`);
    this.channel.addEventListener("message", (event: MessageEvent<SessionMessage>) =>
      this.handleMessage(event.data)
    );
  }

  sendState(state: SessionState): void {
    const message: SessionMessage = { kind: "state", state, sentAt: Date.now() };
    this.channel.postMessage(message);
  }

  onState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onConnectionStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  getConnectionStatus(): ConnectionStatus {
    return this.status;
  }

  destroy(): void {
    if (this.disconnectTimer) clearTimeout(this.disconnectTimer);
    this.channel.close();
    this.stateListeners.clear();
    this.statusListeners.clear();
  }

  private handleMessage(message: SessionMessage): void {
    if (message.kind === "state" && message.state) {
      this.stateListeners.forEach((listener) => listener(message.state!));
    }
    this.markConnected();
  }

  private markConnected(): void {
    this.setStatus("connected");
    if (this.disconnectTimer) clearTimeout(this.disconnectTimer);
    this.disconnectTimer = setTimeout(() => {
      this.setStatus("disconnected");
    }, DISCONNECT_TIMEOUT_MS);
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test -- SessionChannel`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/session
git commit -m "feat: add SessionChannel BroadcastChannel transport and code generator"
```

---

## Task 8: Design tokens and UI primitives

**Files:**
- Modify: `src/app/globals.css` (design tokens as CSS variables + Tailwind theme)
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Select.tsx`
- Create: `src/components/ui/Modal.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `Button`, `Card`, `Input`, `Select`, `Modal` React components used by every
  UI task from here on (9–14). Props kept intentionally small — extend later only when
  a concrete screen needs it (YAGNI).

- [ ] **Step 1: Add design tokens to `src/app/globals.css`**

Append to the existing `@import "tailwindcss";` file (Tailwind v4 CSS-first config):

```css
@theme {
  --color-brand-500: oklch(0.7 0.19 150); /* energetic green — "GO" */
  --color-brand-600: oklch(0.6 0.19 150);
  --color-danger-500: oklch(0.63 0.24 25); /* rest / stop */
  --color-surface-950: oklch(0.14 0 0); /* display background */
  --color-surface-900: oklch(0.18 0 0);
  --color-surface-800: oklch(0.24 0 0);
  --font-display: var(--font-geist-sans), sans-serif;
}
```

- [ ] **Step 2: Create `src/components/ui/Button.tsx`**

```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand-500 hover:bg-brand-600 text-black",
  secondary: "bg-surface-800 hover:bg-surface-900 text-white",
  danger: "bg-danger-500 hover:opacity-90 text-white",
  ghost: "bg-transparent hover:bg-surface-800 text-white",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "px-4 py-2 text-base",
  lg: "px-6 py-4 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-semibold transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 3: Create `src/components/ui/Card.tsx`**

```tsx
import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-surface-900 border border-surface-800 p-4 ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Create `src/components/ui/Input.tsx`**

```tsx
import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg bg-surface-800 border border-surface-800 px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 5: Create `src/components/ui/Select.tsx`**

```tsx
import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg bg-surface-800 border border-surface-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
```

- [ ] **Step 6: Create `src/components/ui/Modal.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface-900 border border-surface-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify the app still builds**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css src/components/ui
git commit -m "feat: add design tokens and Button/Card/Input/Select/Modal primitives"
```

---

## Task 9: Workout Builder

**Files:**
- Create: `src/components/workout/ExerciseEditor.tsx`
- Create: `src/components/workout/BlockEditor.tsx`
- Create: `src/components/workout/WorkoutBuilder.tsx`
- Create: `src/app/app/workouts/new/page.tsx`
- Create: `src/app/app/workouts/[id]/page.tsx`
- Test: `src/lib/workout/__tests__/validateWorkout.test.ts`
- Create: `src/lib/workout/validateWorkout.ts`

**Interfaces:**
- Consumes: `Workout`, `WorkoutBlock`, `Exercise`, `BlockType` from `@/types`;
  `LocalWorkoutRepository` from `@/lib/storage/LocalWorkoutRepository`; `Button`, `Card`,
  `Input`, `Select` from `@/components/ui`.
- Produces: `function validateWorkout(workout: Workout): string[]` (list of human-readable
  errors, empty = valid) used by `WorkoutBuilder`; the `/app/workouts/new` and
  `/app/workouts/[id]` pages.

- [ ] **Step 1: Write the failing validation tests**

Create `src/lib/workout/__tests__/validateWorkout.test.ts`:

```ts
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
    expect(errors).toContain("Name is required");
  });

  it("requires at least one block", () => {
    const errors = validateWorkout(baseWorkout({ blocks: [] }));
    expect(errors).toContain("Add at least one block");
  });

  it("rejects a block with rounds <= 0", () => {
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
    expect(validateWorkout(workout)).toContain("Rounds must be greater than 0");
  });

  it("rejects a block with no exercises", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "amrap", durationSeconds: 600, exercises: [] }],
    });
    expect(validateWorkout(workout)).toContain("Each block needs at least one exercise");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- validateWorkout`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/workout/validateWorkout.ts`**

```ts
import type { Workout } from "@/types";

export function validateWorkout(workout: Workout): string[] {
  const errors: string[] = [];

  if (!workout.name.trim()) {
    errors.push("Name is required");
  }

  if (workout.blocks.length === 0) {
    errors.push("Add at least one block");
  }

  for (const block of workout.blocks) {
    if (block.exercises.length === 0) {
      errors.push("Each block needs at least one exercise");
    }
    const needsRounds = block.type === "interval" || block.type === "tabata" || block.type === "emom";
    if (needsRounds && (block.rounds ?? 0) <= 0) {
      errors.push("Rounds must be greater than 0");
    }
  }

  return errors;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- validateWorkout`
Expected: all tests PASS.

- [ ] **Step 5: Create `src/components/workout/ExerciseEditor.tsx`**

```tsx
"use client";

import type { Exercise } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ExerciseEditorProps {
  exercise: Exercise;
  onChange: (exercise: Exercise) => void;
  onRemove: () => void;
}

export function ExerciseEditor({ exercise, onChange, onRemove }: ExerciseEditorProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        aria-label="Exercise name"
        value={exercise.name}
        onChange={(e) => onChange({ ...exercise, name: e.target.value })}
        placeholder="Push Ups"
        className="flex-1"
      />
      <Input
        aria-label="Reps"
        type="number"
        value={exercise.reps ?? ""}
        onChange={(e) =>
          onChange({ ...exercise, reps: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder="Reps"
        className="w-20"
      />
      <Button variant="ghost" size="md" type="button" onClick={onRemove} aria-label="Remove exercise">
        ✕
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: Create `src/components/workout/BlockEditor.tsx`**

```tsx
"use client";

import type { BlockType, WorkoutBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
          aria-label="Block type"
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
        <Button variant="ghost" type="button" onClick={onRemove} aria-label="Remove block">
          🗑
        </Button>
      </div>

      {showDuration && (
        <Input
          aria-label="Duration (seconds)"
          type="number"
          value={block.durationSeconds}
          onChange={(e) => onChange({ ...block, durationSeconds: Number(e.target.value) })}
          placeholder="Duration (seconds)"
        />
      )}

      {showWorkRest && (
        <div className="grid grid-cols-3 gap-2">
          <Input
            aria-label="Work seconds"
            type="number"
            value={block.workSeconds ?? ""}
            onChange={(e) => onChange({ ...block, workSeconds: Number(e.target.value) })}
            placeholder="Work (s)"
          />
          <Input
            aria-label="Rest seconds"
            type="number"
            value={block.restSeconds ?? ""}
            onChange={(e) => onChange({ ...block, restSeconds: Number(e.target.value) })}
            placeholder="Rest (s)"
          />
          <Input
            aria-label="Rounds"
            type="number"
            value={block.rounds ?? ""}
            onChange={(e) => onChange({ ...block, rounds: Number(e.target.value) })}
            placeholder="Rounds"
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
              exercises: [...block.exercises, { id: crypto.randomUUID(), name: "" }],
            })
          }
        >
          + Add exercise
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 7: Create `src/components/workout/WorkoutBuilder.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Workout, WorkoutBlock } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { validateWorkout } from "@/lib/workout/validateWorkout";
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
  const [errors, setErrors] = useState<string[]>([]);

  function handleSave() {
    const validationErrors = validateWorkout(workout);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    const repo = new LocalWorkoutRepository();
    const result = repo.save(workout);
    if (!result.ok) {
      setErrors([result.error.message]);
      return;
    }
    router.push("/app/workouts");
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Input
        aria-label="Workout name"
        value={workout.name}
        onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
        placeholder="Workout name (e.g. Murph Training)"
      />

      {errors.length > 0 && (
        <ul className="text-danger-500 text-sm space-y-1">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="space-y-3">
        {workout.blocks.map((block) => (
          <BlockEditor
            key={block.id}
            block={block}
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
          + Add block
        </Button>
      </div>

      <Button type="button" size="lg" onClick={handleSave} className="w-full">
        Save workout
      </Button>
    </div>
  );
}
```

- [ ] **Step 8: Create `src/app/app/workouts/new/page.tsx`**

```tsx
import { WorkoutBuilder } from "@/components/workout/WorkoutBuilder";

export default function NewWorkoutPage() {
  return <WorkoutBuilder />;
}
```

- [ ] **Step 9: Create `src/app/app/workouts/[id]/page.tsx`**

```tsx
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

  if (workout === undefined) return <p className="p-4 text-white">Loading…</p>;
  if (workout === null) return <p className="p-4 text-white">Workout not found.</p>;

  return <WorkoutBuilder initialWorkout={workout} />;
}
```

- [ ] **Step 10: Manual verification in the browser**

Run: `npm run dev`, open `http://localhost:3000/app/workouts/new`.
Expected: can type a name, add a block, change its type to AMRAP, add two exercises with
reps, click "Save workout", and land on `/app/workouts` (page not built yet — a 404 here
is expected and resolved by Task 10; confirm no console errors before that point and that
`window.localStorage.getItem("gymtimer.workouts")` contains the new workout via DevTools).

- [ ] **Step 11: Commit**

```bash
git add src/lib/workout/validateWorkout.ts src/lib/workout/__tests__/validateWorkout.test.ts src/components/workout src/app/app/workouts
git commit -m "feat: add Workout Builder UI with block/exercise editing and validation"
```

---

## Task 10: Workout Library and Dashboard

**Files:**
- Create: `src/components/workout/WorkoutCard.tsx`
- Create: `src/components/workout/WorkoutList.tsx`
- Create: `src/app/app/workouts/page.tsx`
- Create: `src/components/dashboard/RecentWorkouts.tsx`
- Create: `src/components/dashboard/WorkoutOfTheDay.tsx`
- Create: `src/components/dashboard/Dashboard.tsx`
- Create: `src/app/app/page.tsx`

**Interfaces:**
- Consumes: `Workout` from `@/types`; `LocalWorkoutRepository` from
  `@/lib/storage/LocalWorkoutRepository`; `Button`, `Card` from `@/components/ui`.
- Produces: `/app` (Dashboard) and `/app/workouts` (Library) routes, both reachable from
  the Landing page built in Task 14.

- [ ] **Step 1: Create `src/components/workout/WorkoutCard.tsx`**

```tsx
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
    <Card className="flex items-center justify-between gap-4">
      <div>
        <p className="text-white font-semibold">{workout.name}</p>
        <p className="text-sm text-gray-400">
          {workout.blocks.length} block{workout.blocks.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex gap-2">
        <Link href={`/app/workouts/${workout.id}/run`}>
          <Button size="md">▶ Run</Button>
        </Link>
        <Link href={`/app/workouts/${workout.id}`}>
          <Button size="md" variant="secondary">
            ✏ Edit
          </Button>
        </Link>
        <Button size="md" variant="secondary" onClick={() => onDuplicate(workout.id)}>
          📋
        </Button>
        <Button size="md" variant="danger" onClick={() => onDelete(workout.id)}>
          🗑
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Create `src/components/workout/WorkoutList.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutCard } from "./WorkoutCard";

export function WorkoutList() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const repo = new LocalWorkoutRepository();

  function reload() {
    const result = repo.list();
    setWorkouts(result.ok ? result.value : []);
  }

  useEffect(() => {
    reload();
  }, []);

  if (workouts.length === 0) {
    return <p className="text-gray-400 p-4">No workouts yet. Create your first one.</p>;
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
          onDelete={(id) => {
            repo.delete(id);
            reload();
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/app/workouts/page.tsx`**

```tsx
import Link from "next/link";
import { WorkoutList } from "@/components/workout/WorkoutList";
import { Button } from "@/components/ui/Button";

export default function WorkoutsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-white">Workouts</h1>
        <Link href="/app/workouts/new">
          <Button>+ New workout</Button>
        </Link>
      </div>
      <WorkoutList />
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/dashboard/RecentWorkouts.tsx`**

```tsx
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
      <h2 className="text-white font-semibold">Recent workouts</h2>
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

- [ ] **Step 5: Create `src/components/dashboard/WorkoutOfTheDay.tsx`**

```tsx
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
      <Card>
        <p className="text-gray-400">No workout of the day yet — create one in the Library.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-2">
      <p className="text-sm uppercase text-brand-500 tracking-wide">Workout of the day</p>
      <p className="text-2xl font-bold text-white">{workout.name}</p>
      <Link href={`/app/workouts/${workout.id}/run`}>
        <Button size="lg">Start</Button>
      </Link>
    </Card>
  );
}
```

- [ ] **Step 6: Create `src/components/dashboard/Dashboard.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutOfTheDay } from "./WorkoutOfTheDay";
import { RecentWorkouts } from "./RecentWorkouts";

export function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    const repo = new LocalWorkoutRepository();
    const result = repo.list();
    setWorkouts(result.ok ? result.value : []);
  }, []);

  const workoutOfTheDay = workouts.length > 0 ? workouts[workouts.length - 1] : null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white">¿Qué entrenamos hoy?</h1>
      <WorkoutOfTheDay workout={workoutOfTheDay} />
      <RecentWorkouts workouts={workouts} />
    </div>
  );
}
```

- [ ] **Step 7: Create `src/app/app/page.tsx`**

```tsx
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function AppHomePage() {
  return <Dashboard />;
}
```

- [ ] **Step 8: Manual verification**

Run: `npm run dev`, visit `/app/workouts`, confirm the workout saved in Task 9 renders,
Run/Edit/Duplicate/Delete buttons work, and `/app` shows it as "Workout of the day".

- [ ] **Step 9: Commit**

```bash
git add src/components/workout/WorkoutCard.tsx src/components/workout/WorkoutList.tsx src/app/app/workouts/page.tsx src/components/dashboard src/app/app/page.tsx
git commit -m "feat: add workout library and dashboard pages"
```

---

## Task 11: `useWorkoutSession` hook

**Files:**
- Create: `src/hooks/useWorkoutSession.ts`
- Test: `src/hooks/__tests__/useWorkoutSession.test.ts`

**Interfaces:**
- Consumes: `WorkoutEngine` from `@/lib/workout/WorkoutEngine`; `Workout`, `SessionState`
  from `@/types`.
- Produces: `function useWorkoutSession(workout: Workout): { state: SessionState;
  start: () => void; pause: () => void; resume: () => void; reset: () => void;
  nextRound: () => void; previousRound: () => void; addTime: (ms: number) => void;
  subtractTime: (ms: number) => void }`. Task 12 (run panel) and Task 13 (Display, in
  read-only mode) consume this shape.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useWorkoutSession.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWorkoutSession } from "../useWorkoutSession";
import type { Workout } from "@/types";

const workout: Workout = {
  id: "w1",
  name: "AMRAP 10",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [
    { id: "b1", type: "amrap", durationSeconds: 10, exercises: [{ id: "e1", name: "Push Ups" }] },
  ],
};

describe("useWorkoutSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("exposes ready state before start() is called", () => {
    const { result } = renderHook(() => useWorkoutSession(workout));
    expect(result.current.state.status).toBe("ready");
  });

  it("updates state when start() is called", () => {
    const { result } = renderHook(() => useWorkoutSession(workout));
    act(() => result.current.start());
    expect(result.current.state.status).toBe("running");
    expect(result.current.state.currentPhase).toBe("work");
  });

  it("re-renders as time passes", () => {
    const { result } = renderHook(() => useWorkoutSession(workout));
    act(() => result.current.start());
    act(() => {
      vi.setSystemTime(new Date("2026-01-01T00:00:03.000Z"));
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.state.timer.remainingMs).toBe(7000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- useWorkoutSession`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/hooks/useWorkoutSession.ts`**

```ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkoutEngine } from "@/lib/workout/WorkoutEngine";
import type { SessionState, Workout } from "@/types";

export function useWorkoutSession(workout: Workout) {
  const engine = useMemo(() => new WorkoutEngine(workout), [workout]);
  const [state, setState] = useState<SessionState>(() => engine.getState());

  useEffect(() => {
    const unsubscribe = engine.subscribe(setState);
    return () => {
      unsubscribe();
      engine.destroy();
    };
  }, [engine]);

  return {
    state,
    start: () => engine.start(),
    pause: () => engine.pause(),
    resume: () => engine.resume(),
    reset: () => engine.reset(),
    nextRound: () => engine.nextRound(),
    previousRound: () => engine.previousRound(),
    addTime: (ms: number) => engine.addTime(ms),
    subtractTime: (ms: number) => engine.subtractTime(ms),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- useWorkoutSession`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks
git commit -m "feat: add useWorkoutSession hook bridging WorkoutEngine to React"
```

---

## Task 12: Trainer run panel (control screen)

**Files:**
- Create: `src/components/timer/TimerDisplay.tsx`
- Create: `src/components/timer/PhaseIndicator.tsx`
- Create: `src/components/timer/RoundIndicator.tsx`
- Create: `src/components/timer/TimerControls.tsx`
- Create: `src/hooks/useKeyboardShortcuts.ts`
- Create: `src/app/app/workouts/[id]/run/page.tsx`

**Interfaces:**
- Consumes: `useWorkoutSession` from `@/hooks/useWorkoutSession`; `SessionChannel`,
  `generateCode` from `@/lib/session`; `AudioManager` from `@/lib/audio/AudioManager`;
  `Button` from `@/components/ui`.
- Produces: the `/app/workouts/[id]/run` route — the primary screen a trainer uses
  during a class. Broadcasts `SessionState` on every change so Task 13's Display can
  mirror it.

- [ ] **Step 1: Create `src/components/timer/TimerDisplay.tsx`**

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
    <p className="text-7xl md:text-9xl font-black tabular-nums text-white text-center">
      {formatTime(value)}
    </p>
  );
}
```

- [ ] **Step 2: Create `src/components/timer/PhaseIndicator.tsx`**

```tsx
import type { WorkoutPhase } from "@/types";

const PHASE_LABELS: Record<WorkoutPhase, string> = {
  getReady: "GET READY",
  work: "WORK",
  rest: "REST",
  finished: "TIME",
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

- [ ] **Step 3: Create `src/components/timer/RoundIndicator.tsx`**

```tsx
export function RoundIndicator({ round, totalRounds }: { round: number; totalRounds: number }) {
  if (totalRounds <= 1) return null;
  return (
    <p className="text-lg md:text-2xl text-gray-400 text-center">
      ROUND {round} / {totalRounds}
    </p>
  );
}
```

- [ ] **Step 4: Create `src/components/timer/TimerControls.tsx`**

```tsx
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
          START
        </Button>
      ) : status === "running" ? (
        <Button size="lg" className="col-span-2" onClick={onPause}>
          PAUSE
        </Button>
      ) : (
        <Button size="lg" className="col-span-2" onClick={onResume}>
          RESUME
        </Button>
      )}
      <Button size="md" variant="secondary" onClick={onPrevious}>
        ◀ PREVIOUS
      </Button>
      <Button size="md" variant="secondary" onClick={onNext}>
        NEXT ▶
      </Button>
      <Button size="md" variant="secondary" onClick={onSubtractTime}>
        -10 SEC
      </Button>
      <Button size="md" variant="secondary" onClick={onAddTime}>
        +10 SEC
      </Button>
      <Button size="md" variant="danger" className="col-span-2" onClick={onReset}>
        RESET
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/hooks/useKeyboardShortcuts.ts`**

```ts
"use client";

import { useEffect } from "react";

interface Shortcuts {
  onPauseResume: () => void;
  onReset: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onFullscreen: () => void;
}

const TEXT_INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && TEXT_INPUT_TAGS.has(target.tagName)) return;

      switch (event.code) {
        case "Space":
          event.preventDefault();
          shortcuts.onPauseResume();
          break;
        case "KeyR":
          shortcuts.onReset();
          break;
        case "KeyN":
        case "ArrowRight":
          shortcuts.onNext();
          break;
        case "ArrowLeft":
          shortcuts.onPrevious();
          break;
        case "KeyF":
          shortcuts.onFullscreen();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
```

- [ ] **Step 6: Create `src/app/app/workouts/[id]/run/page.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { generateCode } from "@/lib/session/generateCode";
import { AudioManager } from "@/lib/audio/AudioManager";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { TimerControls } from "@/components/timer/TimerControls";

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

  if (workout === undefined) return <p className="p-4 text-white">Loading…</p>;
  if (workout === null) return <p className="p-4 text-white">Workout not found.</p>;

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
  const channel = useMemo(() => new SessionChannel(code, "trainer"), [code]);

  useEffect(() => () => channel.destroy(), [channel]);

  useEffect(() => {
    channel.sendState({ ...session.state, code });
    if (session.state.status === "finished") audio.playFinish();
  }, [session.state, channel, code, audio]);

  useKeyboardShortcuts({
    onPauseResume: () => (session.state.status === "running" ? session.pause() : session.resume()),
    onReset: () => session.reset(),
    onNext: () => session.nextRound(),
    onPrevious: () => session.previousRound(),
    onFullscreen: () => document.documentElement.requestFullscreen?.(),
  });

  function handleStart() {
    audio.unlock();
    audio.playStart();
    session.start();
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-6 p-4">
      <p className="text-gray-400">
        Display code: <span className="font-mono text-white">{code}</span> —{" "}
        <Link href={`/display/${code}`} className="text-brand-500 underline">
          open display
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
        onReset={session.reset}
        onNext={session.nextRound}
        onPrevious={session.previousRound}
        onAddTime={() => session.addTime(10_000)}
        onSubtractTime={() => session.subtractTime(10_000)}
      />
    </div>
  );
}
```

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, open `/app/workouts/[id]/run` for the saved AMRAP workout. Confirm:
START plays a beep and the timer counts down every second; PAUSE/RESUME/RESET/NEXT/
PREVIOUS/+10s/-10s all work; Space/R/N/ArrowRight/ArrowLeft/F keyboard shortcuts work
except while focused in a text input (there are none on this page, but verify no errors).

- [ ] **Step 8: Commit**

```bash
git add src/components/timer src/hooks/useKeyboardShortcuts.ts src/app/app/workouts/[id]/run
git commit -m "feat: add trainer run panel with timer controls and keyboard shortcuts"
```

---

## Task 13: Display screen

**Files:**
- Create: `src/components/display/DisplayConnection.tsx`
- Create: `src/components/display/DisplayScreen.tsx`
- Create: `src/app/display/page.tsx`
- Create: `src/app/display/[code]/page.tsx`
- Install: `qrcode.react` (justification: only feasible zero-effort way to render a QR
  code without hand-rolling a QR encoder; ~3KB, no other dependencies)

**Interfaces:**
- Consumes: `SessionChannel` from `@/lib/session/SessionChannel`; `SessionState`,
  `ConnectionStatus` from `@/types`; `TimerDisplay`, `PhaseIndicator`, `RoundIndicator`
  from `@/components/timer`.
- Produces: `/display` (code entry) and `/display/[code]` (mirrored full-screen view) —
  the second screen shown on the gym's TV/projector.

- [ ] **Step 1: Install the QR code dependency**

```bash
npm install qrcode.react
```

- [ ] **Step 2: Create `src/components/display/DisplayConnection.tsx`**

```tsx
"use client";

import { QRCodeSVG } from "qrcode.react";
import type { ConnectionStatus } from "@/types";

interface DisplayConnectionProps {
  code: string;
  status: ConnectionStatus;
}

export function DisplayConnection({ code, status }: DisplayConnectionProps) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/display/${code}` : "";

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-4xl font-black text-white">CONECTAR PANTALLA</h1>
      <p className="text-gray-400">Código:</p>
      <p className="text-6xl font-mono font-bold text-brand-500 tracking-widest">{code}</p>
      {url && <QRCodeSVG value={url} size={200} bgColor="transparent" fgColor="#ffffff" />}
      <p className="text-gray-400">Escaneá para conectar</p>
      <p className={status === "connected" ? "text-brand-500" : "text-gray-500"}>
        {status === "connected" ? "CONNECTED ✓" : "Waiting for coach…"}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/display/DisplayScreen.tsx`**

```tsx
"use client";

import type { ConnectionStatus, SessionState } from "@/types";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";

interface DisplayScreenProps {
  state: SessionState;
  connectionStatus: ConnectionStatus;
}

export function DisplayScreen({ state, connectionStatus }: DisplayScreenProps) {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-8 p-4 relative">
      <span
        className={`absolute top-4 right-4 text-sm ${
          connectionStatus === "connected" ? "text-brand-500" : "text-gray-600"
        }`}
      >
        ● {connectionStatus === "connected" ? "Connected" : "Disconnected"}
      </span>
      <p className="text-3xl md:text-5xl text-gray-400 font-bold">{state.workout.name}</p>
      <PhaseIndicator phase={state.currentPhase} />
      <TimerDisplay
        remainingMs={state.timer.remainingMs}
        elapsedMs={state.timer.elapsedMs}
        mode={state.timer.mode}
      />
      <RoundIndicator round={state.currentRound} totalRounds={state.totalRounds} />
      {state.currentPhase === "finished" && (
        <p className="text-4xl font-black text-white">WORKOUT COMPLETE</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/display/page.tsx`**

```tsx
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
      <h1 className="text-2xl font-bold text-white">Open a display</h1>
      <Input
        aria-label="Connection code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ABC123"
        className="max-w-xs text-center text-2xl font-mono"
      />
      <Button size="lg" onClick={() => router.push(`/display/${code}`)} disabled={code.length !== 6}>
        Connect
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/app/display/[code]/page.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { ConnectionStatus, SessionState } from "@/types";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { DisplayConnection } from "@/components/display/DisplayConnection";
import { DisplayScreen } from "@/components/display/DisplayScreen";

export default function DisplayCodePage() {
  const params = useParams<{ code: string }>();
  const code = params.code.toUpperCase();
  const channel = useMemo(() => new SessionChannel(code, "display"), [code]);
  const [state, setState] = useState<SessionState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("waiting");

  useEffect(() => {
    const unsubscribeState = channel.onState(setState);
    const unsubscribeStatus = channel.onConnectionStatusChange(setConnectionStatus);
    return () => {
      unsubscribeState();
      unsubscribeStatus();
      channel.destroy();
    };
  }, [channel]);

  if (!state) {
    return <DisplayConnection code={code} status={connectionStatus} />;
  }

  return <DisplayScreen state={state} connectionStatus={connectionStatus} />;
}
```

- [ ] **Step 6: Manual verification — this is the core product loop**

Run: `npm run dev`. In one browser tab, open `/app/workouts/[id]/run` for a saved
workout — note its display code. In a second tab (or window), open `/display/[code]`
with that exact code. Confirm: the display first shows "Waiting for coach…"; after
clicking START on the trainer tab, the display shows the phase, timer, and round in
sync within ~100ms; PAUSE/RESUME/NEXT/+10s all reflect live on the display; closing the
trainer tab causes the display to show "Disconnected" within 5 seconds.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/components/display src/app/display
git commit -m "feat: add Display screen with QR connection and live BroadcastChannel mirroring"
```

---

## Task 14: Fullscreen, Landing page, responsive pass, README, deploy

**Files:**
- Create: `src/hooks/useFullscreen.ts`
- Modify: `src/app/app/workouts/[id]/run/page.tsx` (wire fullscreen button)
- Modify: `src/app/display/[code]/page.tsx` (wire fullscreen button)
- Create: `src/app/page.tsx` (Landing, replaces the default create-next-app page)
- Modify: `README.md`

**Interfaces:**
- Consumes: everything built in Tasks 1–13.
- Produces: `function useFullscreen(): { isFullscreen: boolean; toggle: () => void }`
  used by the run panel and display; the public Landing route at `/`; a complete README.

- [ ] **Step 1: Create `src/hooks/useFullscreen.ts`**

```ts
"use client";

import { useCallback, useEffect, useState } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen();
    }
  }, []);

  return { isFullscreen, toggle };
}
```

- [ ] **Step 2: Wire fullscreen into the Display screen**

In `src/app/display/[code]/page.tsx`, add the import and call:

```tsx
import { useFullscreen } from "@/hooks/useFullscreen";
```

Inside `DisplayCodePage`, add `const { toggle } = useFullscreen();` and pass it down:
change `<DisplayScreen state={state} connectionStatus={connectionStatus} />` to
`<DisplayScreen state={state} connectionStatus={connectionStatus} onFullscreenToggle={toggle} />`.

In `src/components/display/DisplayScreen.tsx`, add `onFullscreenToggle: () => void` to
`DisplayScreenProps` and render a minimal corner button:

```tsx
<button
  onClick={onFullscreenToggle}
  className="absolute top-4 left-4 text-gray-600 hover:text-white text-sm"
  aria-label="Toggle fullscreen"
>
  ⛶
</button>
```

- [ ] **Step 3: Wire the `F` keyboard shortcut on the run panel to real fullscreen**

In `src/app/app/workouts/[id]/run/page.tsx`, replace
`onFullscreen: () => document.documentElement.requestFullscreen?.(),` with:

```tsx
onFullscreen: toggleFullscreen,
```

and add `const { toggle: toggleFullscreen } = useFullscreen();` plus the import
`import { useFullscreen } from "@/hooks/useFullscreen";` inside `RunWorkoutContent`.

- [ ] **Step 4: Create the Landing page `src/app/page.tsx`**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-8 p-4 text-center">
      <div>
        <h1 className="text-5xl md:text-7xl font-black text-white">GYMTIMER</h1>
        <p className="text-gray-400 text-lg mt-2">
          Tu entrenamiento. Tu ritmo. Tu tiempo.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/app/workouts/new">
          <Button size="lg" className="w-full">
            CREAR ENTRENAMIENTO
          </Button>
        </Link>
        <Link href="/app">
          <Button size="lg" variant="secondary" className="w-full">
            IR AL DASHBOARD
          </Button>
        </Link>
        <Link href="/display">
          <Button size="lg" variant="secondary" className="w-full">
            ABRIR PANTALLA
          </Button>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Responsive verification pass**

Run: `npm run dev`. Using Chrome DevTools device toolbar, check `/`, `/app`,
`/app/workouts`, `/app/workouts/new`, `/app/workouts/[id]/run`, and `/display/[code]`
at 320px, 768px, 1024px, and a simulated 1920x1080 display. Confirm no horizontal
scroll and no overlapping/clipped text on the timer displays at any width.

- [ ] **Step 6: Run the full test suite and lint**

Run: `npm run test`
Expected: all tests across `TimerEngine`, `AudioManager`, `LocalWorkoutRepository`,
`WorkoutEngine`, `generateCode`, `SessionChannel`, `validateWorkout`,
`useWorkoutSession` PASS.

Run: `npm run lint`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Write `README.md`**

```markdown
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

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000.

## Testing

\`\`\`bash
npm run test        # run once
npm run test:watch  # watch mode
\`\`\`

## Build

\`\`\`bash
npm run build
npm run start
\`\`\`

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

\`\`\`bash
npx vercel
\`\`\`

## Roadmap

Phase 1 (this repo) → Phase 2 (cross-device realtime sync) → Phase 3 (accounts
and gyms) → Phase 4 (athletes and results) → Phase 5 (SaaS/billing) → Phase 6
(per-gym branding). Full detail in `GYMTIMER-PRO-PROMPT.md` Section 90.
```

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useFullscreen.ts src/app/app/workouts/[id]/run/page.tsx src/app/display/[code]/page.tsx src/components/display/DisplayScreen.tsx src/app/page.tsx README.md
git commit -m "feat: add fullscreen support, landing page, and README"
```

- [ ] **Step 9: Final manual acceptance pass against prompt Sección 94**

Run through, in order, on Chrome desktop and Chrome Android (or mobile emulation):
create an AMRAP 10 with 10 Push Ups / 15 Squats and save it (Caso 1); start it from
`/app/workouts/[id]/run` (Caso 2); confirm the timer counts down accurately (Caso 3);
confirm start/finish sounds play (Caso 4); confirm the Display at `/display/[code]`
shows phase/time/round/exercise (Caso 5); pause from the trainer view and confirm the
Display reflects it (Caso 6/7); reset (Caso 8); let it finish (Caso 9). Note results.

---

## Deferred to Phase 2+ (explicitly out of scope here)

Cross-device realtime sync (Supabase Realtime), `/join/[code]` and `/wod/[id]` student
routes, result logging, accounts/gyms/roles, Supabase-backed repository, subscriptions
and billing, per-gym branding/theming. See design doc Section 9 for the full list.
