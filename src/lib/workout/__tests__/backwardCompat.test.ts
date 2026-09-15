import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WorkoutEngine } from "../WorkoutEngine";
import { formatExerciseLine } from "../formatExerciseLine";
import { validateWorkout } from "../validateWorkout";
import type { Workout } from "@/types";

function skipGetReady(engine: WorkoutEngine) {
  engine.skipGetReadyForTest();
}

// An old-shape exercise carries NONE of the crossfit-wod-models fields:
// no metricKind, no repScheme (block-level anyway), no windowKind, no calories.
type OldExercise = { id: string; name: string; reps?: number; sets?: number; timeSeconds?: number; distanceMeters?: number; weightKg?: number };

describe("T5.4 — backward compat: old-shape formatExerciseLine stays byte-identical", () => {
  const oldBlock = { id: "b1", type: "amrap", durationSeconds: 600, rounds: 1 } as never;

  it("pins the pre-change strings for every old-shape combo, with and without a block ctx", () => {
    const battery: { exercise: OldExercise; ctx?: boolean; expected: string }[] = [
      { exercise: { id: "e1", name: "Burpees" }, expected: "Burpees" },
      { exercise: { id: "e1", name: "Burpees", reps: 15 }, expected: "Burpees · 15reps" },
      { exercise: { id: "e1", name: "Sentadilla", sets: 4 }, expected: "Sentadilla · 4series" },
      { exercise: { id: "e1", name: "Peso muerto", weightKg: 60 }, expected: "Peso muerto · 60kg" },
      {
        exercise: { id: "e1", name: "Sentadilla", reps: 10, sets: 3, weightKg: 40 },
        expected: "Sentadilla · 10reps · 3series · 40kg",
      },
      // timeSeconds was a declared-dead pre-change field; its old rendering
      // through formatTimeInput is unchanged.
      { exercise: { id: "e1", name: "L-Sit", timeSeconds: 30 }, expected: "L-Sit · 0:30" },
      { exercise: { id: "e1", name: "Run", distanceMeters: 400 }, expected: "Run · 400m" },
      {
        exercise: { id: "e1", name: "Curl", reps: 10, weightKg: 0 },
        expected: "Curl · 10reps · 0kg",
      },
    ];
    for (const { exercise, ctx, expected } of battery) {
      expect(formatExerciseLine(exercise)).toBe(expected);
      if (ctx) {
        // A block ctx without a repScheme leaves old shapes untouched, even
        // with a non-default round.
        expect(formatExerciseLine(exercise, { block: oldBlock, round: 3 })).toBe(expected);
      }
    }
  });

  it("old-shape ctx round never scales per-exercise reps (no repScheme present)", () => {
    const exercise: OldExercise = { id: "e1", name: "Thrusters", reps: 21 };
    expect(formatExerciseLine(exercise, { block: oldBlock, round: 3 })).toBe("Thrusters · 21reps");
  });
});

describe("T5.4 — backward compat: old-shape workouts validate and run unchanged", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("validates an old-shape workout with zero errors", () => {
    const oldShape: Workout = {
      id: "w1",
      name: "Clásico",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        {
          id: "b1",
          type: "amrap",
          durationSeconds: 600,
          rounds: 1,
          exercises: [
            { id: "e1", name: "Push Ups", reps: 15, sets: 4 },
            { id: "e2", name: "Deadlift", reps: 10, weightKg: 80 },
            { id: "e3", name: "L-Sit", timeSeconds: 30 },
          ],
        },
      ],
    };
    expect(validateWorkout(oldShape)).toEqual([]);
  });

  it("runs an old-shape multi-block workout end-to-end with the unmodified machinery", () => {
    const oldShape: Workout = {
      id: "w2",
      name: "Clásico completo",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        {
          id: "b1",
          type: "amrap",
          durationSeconds: 5,
          rounds: 1,
          exercises: [{ id: "e1", name: "Push Ups", reps: 10 }],
        },
        {
          id: "b2",
          type: "interval",
          durationSeconds: 0,
          workSeconds: 2,
          restSeconds: 1,
          rounds: 2,
          exercises: [{ id: "e2", name: "Row" }],
        },
        {
          id: "b3",
          type: "rm",
          durationSeconds: 3,
          exercises: [{ id: "e3", name: "Push Press" }],
        },
      ],
    };
    const engine = new WorkoutEngine(oldShape);
    engine.start();
    skipGetReady(engine);
    expect(engine.getState().currentBlockIndex).toBe(0);

    vi.advanceTimersByTime(5_200);
    expect(engine.getState().currentBlockIndex).toBe(1);
    expect(engine.getState().status).toBe("running");
    skipGetReady(engine);
    vi.advanceTimersByTime(2_100);
    expect(engine.getState().currentPhase).toBe("rest");
    vi.advanceTimersByTime(1_100);
    expect(engine.getState().currentRound).toBe(2);
    vi.advanceTimersByTime(2_100);
    vi.advanceTimersByTime(1_100);
    expect(engine.getState().currentBlockIndex).toBe(2);
    skipGetReady(engine);
    expect(engine.getState().accumulatedReps).toBe(0);
    vi.advanceTimersByTime(3_200);
    expect(engine.getState().status).toBe("finished");
  });

  it("an old-shape single-exercise forTime stays on the classic rounds=1 → finish lane", () => {
    const oldForTime: Workout = {
      id: "w3",
      name: "For time clásico",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        {
          id: "b1",
          type: "forTime",
          durationSeconds: 120,
          exercises: [{ id: "e1", name: "Thruster", reps: 21 }],
        },
      ],
    };
    const engine = new WorkoutEngine(oldForTime);
    engine.start();
    skipGetReady(engine);
    const state = engine.getState();
    expect(state.timer.mode).toBe("countdown");
    expect(state.timer.remainingMs).toBe(120_000);
    engine.nextRound();
    expect(engine.getState().status).toBe("finished");
  });
});

describe("T5.4 — backward compat: pre-change snapshots hydrate gracefully", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("hydrates a snapshot missing currentExerciseIndex to station 0 and keeps ticking", () => {
    const chipper: Workout = {
      id: "w4",
      name: "Murph",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        {
          id: "b1",
          type: "forTime",
          durationSeconds: 0,
          rounds: 1,
          stationSeconds: 60,
          exercises: [
            { id: "e1", name: "Run" },
            { id: "e2", name: "Pull-ups" },
          ],
        },
      ],
    };
    const engine = new WorkoutEngine(chipper);
    engine.start();
    skipGetReady(engine);
    // Simulate a pre-change localStorage snapshot: JSON round-trip, then drop
    // the post-change-adjacent session key (spec R6).
    const raw = JSON.parse(JSON.stringify(engine.getState()));
    delete raw.currentExerciseIndex;
    const mirror = new WorkoutEngine(chipper);
    mirror.hydrate(raw, Date.now());
    // Guard falls back to 0 instead of crashing.
    expect(mirror.getState().currentExerciseIndex).toBe(0);
    expect(mirror.getState().status).toBe("running");
    expect(mirror.getState().currentPhase).toBe("work");
  });

  it("hydrates an rm snapshot missing accumulatedReps to 0 (precedent guard)", () => {
    const rm: Workout = {
      id: "w5",
      name: "RM",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        {
          id: "b1",
          type: "rm",
          durationSeconds: 10,
          exercises: [{ id: "e1", name: "Push Press" }],
        },
      ],
    };
    const engine = new WorkoutEngine(rm);
    engine.start();
    skipGetReady(engine);
    engine.addRep();
    engine.addRep();
    const raw = JSON.parse(JSON.stringify(engine.getState()));
    delete raw.accumulatedReps;
    const mirror = new WorkoutEngine(rm);
    mirror.hydrate(raw, Date.now());
    expect(mirror.getState().accumulatedReps).toBe(0);
    expect(mirror.getState().status).toBe("running");
  });
});