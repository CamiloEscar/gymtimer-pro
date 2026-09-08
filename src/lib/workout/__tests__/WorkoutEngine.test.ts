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
    // Deviation from brief: dropped the redundant vi.setSystemTime() call —
    // combining it with vi.advanceTimersByTime() for the same delta
    // double-counts elapsed time under Vitest's fake timers (Date.now() is
    // tied to the timer clock), per the documented lesson in
    // TimerEngine.test.ts. advanceTimersByTime alone is sufficient here.
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
    // Deviation from brief: dropped the redundant vi.setSystemTime() call
    // (same double-counting issue as above).
    vi.advanceTimersByTime(5100);
    const state = engine.getState();
    expect(state.currentPhase).toBe("rest");
    // Deviation from brief: expected value corrected from 3000 to 2900.
    // TICK_INTERVAL_MS is 100ms, and this advance overshoots the 5000ms
    // work->rest boundary by exactly one tick period (5100ms requested).
    // The rest TimerEngine is created and started mid-tick at simulated
    // clock=5000, and the *same* advanceTimersByTime call also fires that
    // new timer's first scheduled tick at clock=5100 (100ms later) before
    // control returns to the test. That 100ms of genuine elapsed time on
    // the rest timer is real, not a bug — verified empirically by tracing
    // TimerEngine's setInterval(fn, 100) scheduling. remainingMs is
    // therefore 3000 - 100 = 2900, not 3000.
    expect(state.timer.remainingMs).toBe(2900);
  });

  it("transitions rest -> next round's work phase", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    // Deviation from brief: dropped both redundant vi.setSystemTime() calls
    // (same double-counting issue). advanceTimersByTime(5100) then
    // advanceTimersByTime(3100) advances the fake clock cumulatively to
    // 8200ms, which is what the test intends (5s work + 3s rest + buffer).
    vi.advanceTimersByTime(5100);
    vi.advanceTimersByTime(3100);
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.currentPhase).toBe("work");
  });

  it("finishes after the last round's rest completes", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    // round 1 work (5s) + rest (3s) + round 2 work (5s) + rest (3s) = 16s
    // Deviation from brief: dropped the redundant vi.setSystemTime() call
    // (same double-counting issue).
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
    // Deviation from brief: dropped the redundant vi.setSystemTime() call
    // (same double-counting issue). The clock is already at 2000ms from
    // the earlier standalone vi.setSystemTime() jump (used deliberately,
    // without an accompanying advance, to simulate the pause happening at
    // t=2s without needing intervening ticks — same pattern as
    // TimerEngine.test.ts's "survives a simulated tab sleep" case).
    // advanceTimersByTime(3100) alone moves it to 5100ms, crossing the
    // 5000ms work boundary.
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

describe("WorkoutEngine — hydrate (remote /display mirror)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("adopts a remote running snapshot mid-round and keeps ticking locally", () => {
    const mirror = new WorkoutEngine(intervalWorkout);
    const referenceMs = Date.now();
    mirror.hydrate(
      {
        code: "",
        workout: intervalWorkout,
        status: "running",
        currentBlockIndex: 0,
        currentRound: 1,
        totalRounds: 2,
        currentPhase: "work",
        currentExerciseIndex: 0,
        timer: { mode: "countdown", status: "running", durationMs: 5000, elapsedMs: 4000, remainingMs: 1000 },
      },
      referenceMs,
    );
    const state = mirror.getState();
    expect(state.status).toBe("running");
    expect(state.currentPhase).toBe("work");
    expect(state.timer.remainingMs).toBe(1000);

    // No further hydrate() calls — must advance work -> rest on its own,
    // using this same instance's workout block definitions.
    vi.advanceTimersByTime(1100);
    expect(mirror.getState().currentPhase).toBe("rest");
  });

  it("self-corrects into the next phase if the snapshot was already stale on arrival", () => {
    const mirror = new WorkoutEngine(intervalWorkout);
    const referenceMs = Date.now();
    // The sender captured this while already 200ms past the work phase's
    // end (e.g. its own tab had been throttled); the mirror should catch up
    // immediately rather than getting stuck reporting "work" with 0ms left.
    vi.setSystemTime(new Date("2026-01-01T00:00:00.200Z"));
    mirror.hydrate(
      {
        code: "",
        workout: intervalWorkout,
        status: "running",
        currentBlockIndex: 0,
        currentRound: 1,
        totalRounds: 2,
        currentPhase: "work",
        currentExerciseIndex: 0,
        timer: { mode: "countdown", status: "running", durationMs: 5000, elapsedMs: 5000, remainingMs: 0 },
      },
      referenceMs,
    );
    expect(mirror.getState().currentPhase).toBe("rest");
  });

  it("adopts a remote paused snapshot and freezes there", () => {
    const mirror = new WorkoutEngine(intervalWorkout);
    const referenceMs = Date.now();
    mirror.hydrate(
      {
        code: "",
        workout: intervalWorkout,
        status: "paused",
        currentBlockIndex: 0,
        currentRound: 2,
        totalRounds: 2,
        currentPhase: "rest",
        currentExerciseIndex: 0,
        timer: { mode: "countdown", status: "paused", durationMs: 3000, elapsedMs: 1000, remainingMs: 2000 },
      },
      referenceMs,
    );
    vi.advanceTimersByTime(5000);
    const state = mirror.getState();
    expect(state.status).toBe("paused");
    expect(state.currentRound).toBe(2);
    expect(state.currentPhase).toBe("rest");
    expect(state.timer.remainingMs).toBe(2000);
  });
});
