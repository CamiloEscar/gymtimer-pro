import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WorkoutEngine } from "../WorkoutEngine";
import type { AudioManager } from "@/lib/audio/AudioManager";
import type { Workout } from "@/types";

type AudioSpy = {
  audio: AudioManager;
  playRoundChange: ReturnType<typeof vi.fn>;
  playCountdownBeep: ReturnType<typeof vi.fn>;
  playStart: ReturnType<typeof vi.fn>;
  playWorkToRest: ReturnType<typeof vi.fn>;
  playRestToWork: ReturnType<typeof vi.fn>;
  playFinish: ReturnType<typeof vi.fn>;
  speak: ReturnType<typeof vi.fn>;
};

// Minimal audio spy — we only need the transition-cue methods the engine
// actually calls. Cast to AudioManager so the constructor accepts it; keep
// typed refs to the mocks so test code can call `.mockClear()` without losing
// visibility.
function makeAudioSpy(): AudioSpy {
  const playRoundChange = vi.fn();
  const playCountdownBeep = vi.fn();
  const playStart = vi.fn();
  const playWorkToRest = vi.fn();
  const playRestToWork = vi.fn();
  const playFinish = vi.fn();
  const speak = vi.fn();
  return {
    audio: {
      playRoundChange,
      playCountdownBeep,
      playStart,
      playWorkToRest,
      playRestToWork,
      playFinish,
      speak,
    } as unknown as AudioManager,
    playRoundChange,
    playCountdownBeep,
    playStart,
    playWorkToRest,
    playRestToWork,
    playFinish,
    speak,
  };
}

// Pre-work 3-2-1 countdown is a real phase in production; tests that want
// to assert on the work phase directly call this helper to fast-forward
// through it deterministically (without timer-tick overshoot) instead of
// routing through `vi.advanceTimersByTime` and racing against the inner
// TimerEngine's 100ms tick.
function skipGetReady(engine: WorkoutEngine) {
  engine.skipGetReadyForTest();
}

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

const emomWorkout: Workout = {
  id: "w4",
  name: "EMOM 3",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [
    {
      id: "b1",
      type: "emom",
      durationSeconds: 0,
      workSeconds: 40,
      restSeconds: 0,
      rounds: 3,
      intervalSeconds: 60,
      exercises: [{ id: "e1", name: "Burpees" }],
    },
  ],
};

const otmWorkout: Workout = {
  id: "w5",
  name: "OTM 2",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [
    {
      id: "b1",
      type: "otm",
      durationSeconds: 0,
      workSeconds: 30,
      restSeconds: 10,
      rounds: 2,
      intervalSeconds: 90,
      exercises: [{ id: "e1", name: "Pull Ups" }],
    },
  ],
};

const rmWorkout: Workout = {
  id: "w6",
  name: "RM 2min",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [
    {
      id: "b1",
      type: "rm",
      durationSeconds: 5,
      exercises: [{ id: "e1", name: "Push Press" }],
    },
  ],
};

const multiBlockRMWorkout: Workout = {
  id: "w8",
  name: "RM Multi",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [
    {
      id: "b1",
      type: "rm",
      durationSeconds: 3,
      exercises: [{ id: "e1", name: "Push Press" }],
    },
    {
      id: "b2",
      type: "rm",
      durationSeconds: 3,
      exercises: [{ id: "e2", name: "Deadlift" }],
    },
  ],
};

const fgbWorkout: Workout = {
  id: "w7",
  name: "Fight Gone Bad",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [
    {
      id: "b1",
      type: "fightGoneBad",
      durationSeconds: 0,
      rounds: 2,
      stationSeconds: 3,
      roundRestSeconds: 2,
      exercises: [
        { id: "e1", name: "Wall Ball" },
        { id: "e2", name: "SDHP" },
        { id: "e3", name: "Box Jump" },
      ],
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
    skipGetReady(engine);
    expect(engine.getState().status).toBe("running");
    expect(engine.getState().currentPhase).toBe("work");
    expect(engine.getState().timer.remainingMs).toBe(10_000);
  });

  it("finishes the workout when the AMRAP duration elapses", () => {
    const engine = new WorkoutEngine(amrapWorkout);
    engine.start();
    // 3s getReady + 10s AMRAP work + buffer = 14s
    vi.advanceTimersByTime(14_000);
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
    skipGetReady(engine);
    const state = engine.getState();
    expect(state.currentPhase).toBe("work");
    expect(state.currentRound).toBe(1);
    expect(state.totalRounds).toBe(2);
    expect(state.timer.remainingMs).toBe(5_000);
  });

  it("transitions work -> rest after workSeconds elapses", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    skipGetReady(engine);
    // skipGetReady is deterministic — work phase starts exactly at its
    // 5000ms duration. Advance 5100ms to land 100ms into the rest phase.
    vi.advanceTimersByTime(5_100);
    const state = engine.getState();
    expect(state.currentPhase).toBe("rest");
    expect(state.timer.remainingMs).toBe(2_900);
  });

  it("transitions rest -> next round's work phase", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    skipGetReady(engine);
    // 5s work + 3s rest + 100ms overshoot = 8_100ms into round 2's work.
    vi.advanceTimersByTime(5_100);
    vi.advanceTimersByTime(3_100);
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.currentPhase).toBe("work");
  });

  it("finishes after the last round's rest completes", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    skipGetReady(engine);
    // 2 rounds * (5s work + 3s rest) = 16s + 200ms buffer.
    vi.advanceTimersByTime(16_200);
    expect(engine.getState().status).toBe("finished");
  });

  it("pause/resume preserves the current phase and round", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    skipGetReady(engine);
    vi.setSystemTime(new Date("2026-01-01T00:00:02.000Z"));
    engine.pause();
    expect(engine.getState().status).toBe("paused");
    expect(engine.getState().currentPhase).toBe("work");

    engine.resume();
    // Clock already at 2000ms from the getReady skip + 2s setSystemTime
    // jump (used deliberately, without an accompanying advance, to simulate
    // the pause happening at t=2s without needing intervening ticks — same
    // pattern as TimerEngine.test.ts's "survives a simulated tab sleep"
    // case). advanceTimersByTime(3100) alone moves it to 5100ms, crossing
    // the 5000ms work boundary.
    vi.advanceTimersByTime(3100);
    expect(engine.getState().currentPhase).toBe("rest");
  });

  it("nextRound skips directly to the following round's work phase", () => {
    const engine = new WorkoutEngine(intervalWorkout);
    engine.start();
    skipGetReady(engine);
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

describe("WorkoutEngine — Basic (reuses interval/tabata state machine)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("starts round 1 in the work phase for workSeconds", () => {
    const engine = new WorkoutEngine(basicWorkout);
    engine.start();
    skipGetReady(engine);
    const state = engine.getState();
    expect(state.currentPhase).toBe("work");
    expect(state.currentRound).toBe(1);
    expect(state.totalRounds).toBe(2);
    expect(state.timer.remainingMs).toBe(5_000);
  });

  it("transitions work -> rest after workSeconds elapses", () => {
    const engine = new WorkoutEngine(basicWorkout);
    engine.start();
    skipGetReady(engine);
    // 5s work + 100ms overshoot into 3s rest.
    vi.advanceTimersByTime(5_100);
    expect(engine.getState().currentPhase).toBe("rest");
  });

  it("transitions rest -> next round's work phase, then finishes after the last round's rest", () => {
    const engine = new WorkoutEngine(basicWorkout);
    engine.start();
    skipGetReady(engine);
    vi.advanceTimersByTime(5_100);
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentRound).toBe(2);
    expect(engine.getState().currentPhase).toBe("work");

    vi.advanceTimersByTime(5_100);
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().status).toBe("finished");
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

describe("WorkoutEngine — EMOM true interval cycling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("starts the first round in work phase for workSeconds (not the whole duration)", () => {
    const engine = new WorkoutEngine(emomWorkout);
    engine.start();
    skipGetReady(engine);
    const state = engine.getState();
    expect(state.currentPhase).toBe("work");
    expect(state.currentRound).toBe(1);
    expect(state.totalRounds).toBe(3);
    // 40s work, not 60s — the bug the refactor fixes: previously the
    // engine built a single countdown for durationSeconds and never
    // advanced per minute.
    expect(state.timer.remainingMs).toBe(40_000);
  });

  it("fills the rest of the minute with a 'wait' phase when workSeconds < intervalSeconds", () => {
    const engine = new WorkoutEngine(emomWorkout);
    engine.start();
    skipGetReady(engine);
    // skipGetReady gives us a fresh 40s work phase. Advance 40_100ms to
    // land 100ms into the 20s wait phase.
    vi.advanceTimersByTime(40_100);
    expect(engine.getState().currentPhase).toBe("wait");
    expect(engine.getState().timer.remainingMs).toBe(20_000 - 100);
  });

  it("rolls over to the next round after the wait phase completes", () => {
    const engine = new WorkoutEngine(emomWorkout);
    engine.start();
    skipGetReady(engine);
    // 40s work + 20s wait = 60s for round 1; advance 60_100ms to land
    // 100ms into round 2's work phase.
    vi.advanceTimersByTime(60_100);
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.currentPhase).toBe("work");
    expect(state.timer.remainingMs).toBe(40_000 - 100);
  });

  it("finishes after N rounds complete", () => {
    const engine = new WorkoutEngine(emomWorkout);
    engine.start();
    skipGetReady(engine);
    // 3 rounds * 60s = 180s; advance a bit past the end (skipGetReady has
    // already consumed 3_100ms of clock).
    vi.advanceTimersByTime(181_000);
    expect(engine.getState().status).toBe("finished");
    expect(engine.getState().currentRound).toBe(3);
  });
});

describe("WorkoutEngine — OTM (mirrors EMOM with rest phase)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("cycles work -> rest -> wait -> next round, respecting intervalSeconds", () => {
    const engine = new WorkoutEngine(otmWorkout);
    engine.start();
    skipGetReady(engine);
    expect(engine.getState().currentPhase).toBe("work");
    expect(engine.getState().timer.remainingMs).toBe(30_000);

    // Work 30s -> rest phase. Advance 30_100ms to land 100ms into rest.
    vi.advanceTimersByTime(30_100);
    expect(engine.getState().currentPhase).toBe("rest");
    expect(engine.getState().currentRound).toBe(1);

    // Rest 10s -> wait phase. Boundary is at 40s; 10_100ms lands 100ms into
    // the 50s wait (interval 90 - work 30 - rest 10 = 50).
    vi.advanceTimersByTime(10_100);
    expect(engine.getState().currentPhase).toBe("wait");
    // Two ticks of TimerEngine fire inside this single advance call,
    // eating 200ms from the wait timer at the boundary.
    expect(engine.getState().timer.remainingMs).toBe(50_000 - 200);

    // Wait 50s -> round 2. Boundary at 90s; 50_100ms lands 100ms into r2.
    vi.advanceTimersByTime(50_100);
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.currentPhase).toBe("work");
    expect(state.timer.remainingMs).toBe(29_700);
  });

  it("falls back to work+rest round length when intervalSeconds is unset", () => {
    const workoutNoInterval: Workout = {
      ...otmWorkout,
      blocks: [
        {
          id: "b1",
          type: "otm",
          durationSeconds: 0,
          workSeconds: 30,
          restSeconds: 10,
          rounds: 2,
          exercises: [{ id: "e1", name: "Pull Ups" }],
        },
      ],
    };
    const engine = new WorkoutEngine(workoutNoInterval);
    engine.start();
    skipGetReady(engine);
    // 30s work + 100ms overshoot into rest.
    vi.advanceTimersByTime(30_100);
    expect(engine.getState().currentPhase).toBe("rest");
    // No wait phase: 10s rest, advance 100ms more lands in r2.
    vi.advanceTimersByTime(10_100);
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.currentPhase).toBe("work");
    expect(state.timer.remainingMs).toBe(29_800);
  });
});

describe("WorkoutEngine — RM rep counter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("exposes accumulatedReps=0 in the initial state", () => {
    const engine = new WorkoutEngine(rmWorkout);
    expect(engine.getState().accumulatedReps).toBe(0);
  });

  it("addRep increments and notifies subscribers", () => {
    const engine = new WorkoutEngine(rmWorkout);
    engine.start();
    skipGetReady(engine);
    const snapshots: number[] = [];
    const unsubscribe = engine.subscribe((s) => snapshots.push(s.accumulatedReps ?? 0));
    engine.addRep();
    engine.addRep();
    engine.addRep();
    unsubscribe();
    expect(engine.getState().accumulatedReps).toBe(3);
    // subscribe() does not replay the current state — each addRep()
    // fires one notification.
    expect(snapshots).toEqual([1, 2, 3]);
  });

  it("removeRep decrements but never goes below zero", () => {
    const engine = new WorkoutEngine(rmWorkout);
    engine.start();
    skipGetReady(engine);
    engine.removeRep();
    expect(engine.getState().accumulatedReps).toBe(0);
    engine.addRep();
    engine.addRep();
    engine.removeRep();
    expect(engine.getState().accumulatedReps).toBe(1);
    engine.removeRep();
    engine.removeRep();
    expect(engine.getState().accumulatedReps).toBe(0);
  });

  it("is a no-op on non-RM blocks", () => {
    const engine = new WorkoutEngine(amrapWorkout);
    engine.start();
    skipGetReady(engine);
    engine.addRep();
    engine.removeRep();
    // Non-RM blocks don't carry the field at all.
    expect(engine.getState().accumulatedReps).toBeUndefined();
  });

  it("reset() zeros the rep counter", () => {
    const engine = new WorkoutEngine(rmWorkout);
    engine.start();
    skipGetReady(engine);
    engine.addRep();
    engine.addRep();
    engine.reset();
    expect(engine.getState().accumulatedReps).toBe(0);
  });

  it("finishes when the timecap elapses", () => {
    const engine = new WorkoutEngine(rmWorkout);
    engine.start();
    skipGetReady(engine);
    // RM timecap is 5s; skipGetReady gave us 100ms into work, advance
    // 5_100ms more to land past the cap.
    vi.advanceTimersByTime(5_200);
    expect(engine.getState().status).toBe("finished");
    expect(engine.getState().currentPhase).toBe("finished");
  });

  it("advances to the next RM block (getReady) and resets reps when the timecap elapses", () => {
    const engine = new WorkoutEngine(multiBlockRMWorkout);
    engine.start();
    skipGetReady(engine);
    engine.addRep();
    engine.addRep();
    expect(engine.getState().accumulatedReps).toBe(2);

    vi.advanceTimersByTime(3_200);
    expect(engine.getState().currentBlockIndex).toBe(1);
    expect(engine.getState().currentPhase).toBe("getReady");
    expect(engine.getState().status).toBe("running");
    expect(engine.getState().accumulatedReps).toBe(0);
  });

  it("finishes the workout when the last RM block's timecap elapses", () => {
    const engine = new WorkoutEngine(multiBlockRMWorkout);
    engine.start();
    skipGetReady(engine);
    // Block 1: 3s timecap.
    vi.advanceTimersByTime(3_200);
    // Block 2 getReady 3s + work 3s + buffer.
    vi.advanceTimersByTime(6_300);
    expect(engine.getState().status).toBe("finished");
    expect(engine.getState().currentPhase).toBe("finished");
    expect(engine.getState().currentBlockIndex).toBe(1);
  });
});

describe("WorkoutEngine — Fight Gone Bad nested loop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("starts round 1 station 0 in the work phase for stationSeconds", () => {
    const engine = new WorkoutEngine(fgbWorkout);
    engine.start();
    skipGetReady(engine);
    const state = engine.getState();
    expect(state.currentPhase).toBe("work");
    expect(state.currentRound).toBe(1);
    expect(state.currentExerciseIndex).toBe(0);
    expect(state.totalRounds).toBe(2);
    expect(state.timer.remainingMs).toBe(3000);
  });

  it("advances through stations within a round", () => {
    const engine = new WorkoutEngine(fgbWorkout);
    engine.start();
    skipGetReady(engine);
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentExerciseIndex).toBe(1);
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentExerciseIndex).toBe(2);
  });

  it("enters rest phase between rounds, then resumes at station 0 of the next round", () => {
    const engine = new WorkoutEngine(fgbWorkout);
    engine.start();
    skipGetReady(engine);
    // 3 stations * 3s = 9s of work, then 2s of rest, then round 2 station 0.
    vi.advanceTimersByTime(9_100);
    expect(engine.getState().currentPhase).toBe("rest");
    expect(engine.getState().currentRound).toBe(1);
    vi.advanceTimersByTime(2_100);
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.currentExerciseIndex).toBe(0);
    expect(state.currentPhase).toBe("work");
  });

  it("finishes after the last round's last station completes", () => {
    const engine = new WorkoutEngine(fgbWorkout);
    engine.start();
    skipGetReady(engine);
    // 2 rounds * 3 stations * 3s = 18s of work, + 2s of rest between rounds.
    vi.advanceTimersByTime(20_100);
    expect(engine.getState().status).toBe("finished");
    expect(engine.getState().currentExerciseIndex).toBe(2);
  });
});

describe("WorkoutEngine — audio cues for transitions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("plays a round-change cue when advancing through stations within an FGB round", () => {
    const { audio, playRoundChange, playCountdownBeep } = makeAudioSpy();
    const engine = new WorkoutEngine(fgbWorkout, audio);
    engine.start();
    skipGetReady(engine);
    // First station ends -> moves to station 1 (same round).
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentExerciseIndex).toBe(1);
    expect(playRoundChange).toHaveBeenCalledTimes(1);

    // Station 1 -> station 2.
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentExerciseIndex).toBe(2);
    expect(playRoundChange).toHaveBeenCalledTimes(2);
    expect(playCountdownBeep).not.toHaveBeenCalled();
  });

  it("does NOT play the round-change cue at the end of the round's last station", () => {
    const { audio, playRoundChange } = makeAudioSpy();
    const engine = new WorkoutEngine(fgbWorkout, audio);
    engine.start();
    skipGetReady(engine);
    // Burn through all 3 stations of round 1, landing in rest.
    vi.advanceTimersByTime(9_100);
    expect(engine.getState().currentPhase).toBe("rest");
    expect(playRoundChange).toHaveBeenCalledTimes(2);
    // Rest ends -> enters round 2 station 0 silently (round-to-round
    // transition, not a station change within a round).
    vi.advanceTimersByTime(2_100);
    expect(playRoundChange).toHaveBeenCalledTimes(2);
  });

  it("plays the round-change cue when nextRound() skips ahead within an FGB round", () => {
    const { audio, playRoundChange } = makeAudioSpy();
    const engine = new WorkoutEngine(fgbWorkout, audio);
    engine.start();
    skipGetReady(engine);
    // Skip from station 0 -> station 1 (manual advance via next button).
    engine.nextRound();
    expect(engine.getState().currentExerciseIndex).toBe(1);
    expect(playRoundChange).toHaveBeenCalledTimes(1);
    // Skip again -> station 2.
    engine.nextRound();
    expect(engine.getState().currentExerciseIndex).toBe(2);
    expect(playRoundChange).toHaveBeenCalledTimes(2);
  });

  it("does NOT play the round-change cue when nextRound() rolls FGB over to the next round", () => {
    const { audio, playRoundChange } = makeAudioSpy();
    const engine = new WorkoutEngine(fgbWorkout, audio);
    engine.start();
    skipGetReady(engine);
    engine.nextRound(); // -> station 1
    engine.nextRound(); // -> station 2
    expect(playRoundChange).toHaveBeenCalledTimes(2);
    // One more nextRound wraps to round 2 station 0 (round-to-round, not a
    // station change within a round) — matches the silent auto-advance path.
    engine.nextRound();
    expect(engine.getState().currentRound).toBe(2);
    expect(engine.getState().currentExerciseIndex).toBe(0);
    expect(playRoundChange).toHaveBeenCalledTimes(2);
  });

  it("plays the round-change cue when an EMOM rounds over to the next round", () => {
    const { audio, playRoundChange } = makeAudioSpy();
    const engine = new WorkoutEngine(emomWorkout, audio);
    engine.start();
    skipGetReady(engine);
    // Round 1 ends at 60s (40s work + 20s wait). Advance 60_100ms to land
    // 100ms into r2.
    vi.advanceTimersByTime(60_100);
    expect(engine.getState().currentRound).toBe(2);
    expect(engine.getState().currentPhase).toBe("work");
    expect(playRoundChange).toHaveBeenCalledTimes(1);
  });

  it("plays the round-change cue when an OTM rounds over to the next round", () => {
    const { audio, playRoundChange } = makeAudioSpy();
    const engine = new WorkoutEngine(otmWorkout, audio);
    engine.start();
    skipGetReady(engine);
    // Round 1 of OTM (work 30 + rest 10 + wait 50) ends at 90s.
    vi.advanceTimersByTime(90_100);
    expect(engine.getState().currentRound).toBe(2);
    expect(engine.getState().currentPhase).toBe("work");
    expect(playRoundChange).toHaveBeenCalledTimes(1);
  });

  it("does NOT play the round-change cue for basic/interval/tabata block round advances", () => {
    const { audio, playRoundChange } = makeAudioSpy();
    const engine = new WorkoutEngine(intervalWorkout, audio);
    engine.start();
    skipGetReady(engine);
    // Round 1 (work 5s -> rest 3s) ends at 8s after start.
    vi.advanceTimersByTime(8_100);
    expect(engine.getState().currentRound).toBe(2);
    expect(playRoundChange).not.toHaveBeenCalled();
  });

  it("plays a short countdown beep when addRep() is called on an RM block", () => {
    const { audio, playRoundChange, playCountdownBeep } = makeAudioSpy();
    const engine = new WorkoutEngine(rmWorkout, audio);
    engine.start();
    skipGetReady(engine);
    engine.addRep();
    engine.addRep();
    engine.addRep();
    expect(playCountdownBeep).toHaveBeenCalledTimes(3);
    expect(playRoundChange).not.toHaveBeenCalled();
  });

  it("does NOT play any audio cue when addRep() is called on a non-RM block", () => {
    const { audio, playRoundChange, playCountdownBeep } = makeAudioSpy();
    const engine = new WorkoutEngine(amrapWorkout, audio);
    engine.start();
    skipGetReady(engine);
    engine.addRep();
    engine.addRep();
    expect(playCountdownBeep).not.toHaveBeenCalled();
    expect(playRoundChange).not.toHaveBeenCalled();
  });

  it("does NOT play any audio cue when removeRep() is called on an RM block", () => {
    const { audio, playCountdownBeep } = makeAudioSpy();
    const engine = new WorkoutEngine(rmWorkout, audio);
    engine.start();
    skipGetReady(engine);
    engine.addRep();
    playCountdownBeep.mockClear();
    engine.removeRep();
    expect(playCountdownBeep).not.toHaveBeenCalled();
  });

  it("is a no-op when constructed without an audio sink", () => {
    // Should not throw and must not crash across any transition.
    const engine = new WorkoutEngine(fgbWorkout, null);
    engine.start();
    skipGetReady(engine);
    vi.advanceTimersByTime(20_100);
    expect(engine.getState().status).toBe("finished");
  });
});

describe("WorkoutEngine — repScheme ladder + continuous clock (Stage 2)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  const ladderAmrapWorkout: Workout = {
    id: "w9",
    name: "AMRAP ladder",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 10,
        rounds: 1,
        repScheme: { start: 21, step: -3, min: 15 },
        exercises: [
          { id: "e1", name: "Thrusters", reps: 10 },
          { id: "e2", name: "Pull-ups", reps: 10 },
        ],
      },
    ],
  };

  const roundsForTimeWorkout: Workout = {
    id: "w10",
    name: "Fran",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 120,
        rounds: 3,
        repScheme: { start: 21, step: -6, min: 9 },
        exercises: [
          { id: "e1", name: "Thrusters" },
          { id: "e2", name: "Pull-ups" },
        ],
      },
    ],
  };

  it("bumps the AMRAP round WITHOUT resetting the running countdown clock", () => {
    const engine = new WorkoutEngine(ladderAmrapWorkout);
    engine.start();
    skipGetReady(engine);
    // 3s into the 10s cap — the clock is alive and counting down.
    vi.advanceTimersByTime(3_000);
    expect(engine.getState().timer.remainingMs).toBe(7_000);

    engine.nextRound();
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.status).toBe("running");
    expect(state.currentPhase).toBe("work");
    // The fixed-time contract: the countdown keeps counting from where it
    // was — NOT restarted, NOT replaced.
    expect(state.timer.remainingMs).toBe(7_000);
  });

  it("keeps bumping the ladder past rounds=1 — only the fixed AMRAP cap ends the block", () => {
    const engine = new WorkoutEngine(ladderAmrapWorkout);
    engine.start();
    skipGetReady(engine);
    engine.nextRound();
    engine.nextRound();
    engine.nextRound();
    const state = engine.getState();
    expect(state.currentRound).toBe(4);
    expect(state.status).toBe("running");
    // Ladder clamps at min (21 → 18 → 15 → 15); the block is NOT finished by
    // the round bump, the cap handles termination.
    expect(state.timer.remainingMs).toBe(10_000);
  });

  it("does NOT replace the timer when forTime rounds judge-advance", () => {
    const engine = new WorkoutEngine(roundsForTimeWorkout);
    engine.start();
    skipGetReady(engine);
    vi.advanceTimersByTime(5_000);
    expect(engine.getState().timer.remainingMs).toBe(115_000);

    engine.nextRound();
    expect(engine.getState().currentRound).toBe(2);
    expect(engine.getState().timer.remainingMs).toBe(115_000);

    engine.nextRound();
    expect(engine.getState().currentRound).toBe(3);
    expect(engine.getState().timer.remainingMs).toBe(115_000);
  });

  it("finishes after the last forTime round is judged complete", () => {
    const engine = new WorkoutEngine(roundsForTimeWorkout);
    engine.start();
    skipGetReady(engine);
    engine.nextRound();
    engine.nextRound();
    engine.nextRound();
    expect(engine.getState().status).toBe("finished");
  });

  it("previousRound decrements the round without touching the running clock", () => {
    const engine = new WorkoutEngine(roundsForTimeWorkout);
    engine.start();
    skipGetReady(engine);
    vi.advanceTimersByTime(5_000);
    engine.nextRound();
    expect(engine.getState().currentRound).toBe(2);

    engine.previousRound();
    const state = engine.getState();
    expect(state.currentRound).toBe(1);
    expect(state.timer.remainingMs).toBe(115_000);
  });

  it("an amrap WITHOUT a repScheme keeps the historical rounds=1 → finish behavior", () => {
    const engine = new WorkoutEngine(amrapWorkout);
    engine.start();
    skipGetReady(engine);
    engine.nextRound();
    expect(engine.getState().status).toBe("finished");
  });
});

describe("WorkoutEngine — chipper lane (Stage 3)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  // S3 Murph: 5 countup stations, judge-driven sweep, block.stationSeconds as
  // the fallback window.
  const murphChipperWorkout: Workout = {
    id: "w11",
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
          { id: "e1", name: "Run 1 mile" },
          { id: "e2", name: "Pull-ups" },
          { id: "e3", name: "Push-ups" },
          { id: "e4", name: "Squats" },
          { id: "e5", name: "Run 1 mile" },
        ],
      },
    ],
  };

  it("sweeps countup stations judge-to-judge: nextRound 0 → last → finish", () => {
    const engine = new WorkoutEngine(murphChipperWorkout);
    engine.start();
    skipGetReady(engine);
    expect(engine.getState().currentPhase).toBe("work");
    expect(engine.getState().currentExerciseIndex).toBe(0);
    // Stations without a per-exercise window count UP (spec R2 / design RISK A):
    // the judge stops each one with nextRound().
    expect(engine.getState().timer.mode).toBe("countup");
    // Passing time must NOT move a countup station on its own.
    vi.advanceTimersByTime(5_000);
    expect(engine.getState().currentExerciseIndex).toBe(0);

    engine.nextRound();
    expect(engine.getState().currentExerciseIndex).toBe(1);
    engine.nextRound();
    engine.nextRound();
    expect(engine.getState().currentExerciseIndex).toBe(3);
    engine.nextRound();
    expect(engine.getState().currentExerciseIndex).toBe(4);
    engine.nextRound();
    expect(engine.getState().status).toBe("finished");
  });

  it("falls back to block.stationSeconds when a station has no per-exercise window", () => {
    const engine = new WorkoutEngine(murphChipperWorkout);
    engine.start();
    skipGetReady(engine);
    const state = engine.getState();
    expect(state.timer.mode).toBe("countup");
    expect(state.timer.durationMs).toBe(60_000);
  });

  it("counts down a per-exercise window (exercise wins over stationSeconds) and auto-advances", () => {
    const workout: Workout = {
      id: "w12",
      name: "Murph mix",
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
            { id: "e2", name: "L-Sit", timeSeconds: 30 },
            { id: "e3", name: "Squats" },
          ],
        },
      ],
    };
    const engine = new WorkoutEngine(workout);
    engine.start();
    skipGetReady(engine);
    // Station 0 has no window → countup; judge advances to the L-Sit.
    expect(engine.getState().timer.mode).toBe("countup");
    engine.nextRound();
    const lSit = engine.getState();
    expect(lSit.currentExerciseIndex).toBe(1);
    expect(lSit.timer.mode).toBe("countdown");
    // The 30s exercise window WINS over the block's 60s stationSeconds.
    expect(lSit.timer.remainingMs).toBe(30_000);
    // Expiry auto-advances to station 2 with the stationSeconds fallback.
    vi.advanceTimersByTime(30_100);
    const after = engine.getState();
    expect(after.currentExerciseIndex).toBe(2);
    expect(after.timer.mode).toBe("countup");
    expect(after.timer.durationMs).toBe(60_000);
  });

  it("finishes when the last chipper station's countdown expires", () => {
    const workout: Workout = {
      id: "w14",
      name: "Run + L-Sit",
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
            { id: "e2", name: "L-Sit", timeSeconds: 30 },
          ],
        },
      ],
    };
    const engine = new WorkoutEngine(workout);
    engine.start();
    skipGetReady(engine);
    engine.nextRound(); // judge Run → L-Sit (countdown 30s)
    expect(engine.getState().currentExerciseIndex).toBe(1);
    vi.advanceTimersByTime(30_100);
    expect(engine.getState().status).toBe("finished");
  });

  it("keeps a single-exercise forTime on the classic single-timer lane (isChipper guard)", () => {
    const workout: Workout = {
      id: "w13",
      name: "Single thruster forTime",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        {
          id: "b1",
          type: "forTime",
          durationSeconds: 120,
          rounds: 1,
          stationSeconds: 60,
          exercises: [{ id: "e1", name: "Thruster", timeSeconds: 30 }],
        },
      ],
    };
    const engine = new WorkoutEngine(workout);
    engine.start();
    skipGetReady(engine);
    // NOT a sweep: the classic single countdown over durationSeconds runs as
    // today — no per-station timer, no drift.
    const state = engine.getState();
    expect(state.timer.mode).toBe("countdown");
    expect(state.timer.remainingMs).toBe(120_000);
    // rounds=1 → judge nextRound finishes; it does NOT rotate a station.
    engine.nextRound();
    expect(engine.getState().status).toBe("finished");
  });
});

describe("WorkoutEngine — voice announcements", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it('speaks "TRABAJO" when getReady countdown ends', () => {
    const { audio, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(intervalWorkout, audio);
    engine.start();
    skipGetReady(engine);
    expect(speak).toHaveBeenCalledWith("TRABAJO");
  });

  it('speaks "DESCANSO" on work→rest transition', () => {
    const { audio, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(intervalWorkout, audio);
    engine.start();
    skipGetReady(engine);
    speak.mockClear();
    vi.advanceTimersByTime(5_100);
    expect(engine.getState().currentPhase).toBe("rest");
    expect(speak).toHaveBeenCalledWith("DESCANSO");
  });

  it('speaks "TRABAJO" on rest→work transition', () => {
    const { audio, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(intervalWorkout, audio);
    engine.start();
    skipGetReady(engine);
    vi.advanceTimersByTime(5_100);
    speak.mockClear();
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentRound).toBe(2);
    expect(engine.getState().currentPhase).toBe("work");
    expect(speak).toHaveBeenCalledWith("TRABAJO");
  });

  it('speaks "TIEMPO" when the workout finishes', () => {
    const { audio, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(intervalWorkout, audio);
    engine.start();
    skipGetReady(engine);
    // Round 1 (5+3) + Round 2 (5+3) = 16s.
    vi.advanceTimersByTime(16_200);
    expect(engine.getState().status).toBe("finished");
    expect(speak).toHaveBeenCalledWith("TIEMPO");
  });

  it("speaks the next station name when FGB advances within a round", () => {
    const { audio, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(fgbWorkout, audio);
    engine.start();
    skipGetReady(engine);
    speak.mockClear();
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentExerciseIndex).toBe(1);
    expect(speak).toHaveBeenCalledWith("SDHP");
  });
});

describe("WorkoutEngine — cadencia voice cue (Stage 4)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  const CADENCE_UNITS = ["REPETICIONES", "METROS", "CALORÍAS", "SEGUNDOS", "MÁXIMO"];
  const cadenceSpeech = (speak: ReturnType<typeof vi.fn>) =>
    speak.mock.calls.filter(([text]) => CADENCE_UNITS.some((unit) => text.includes(unit)));

  const cadenceFranWorkout: Workout = {
    id: "w15",
    name: "Fran",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 120,
        rounds: 3,
        repScheme: { start: 21, step: -6, min: 9 },
        exercises: [
          { id: "e1", name: "Thrusters" },
          { id: "e2", name: "Pull-ups" },
        ],
      },
    ],
  };

  const cadenceAmrapWorkout: Workout = {
    id: "w16",
    name: "AMRAP ladder",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 10,
        rounds: 1,
        repScheme: { start: 21, step: -3, min: 15 },
        exercises: [
          { id: "e1", name: "Thrusters" },
          { id: "e2", name: "Pull-ups" },
        ],
      },
    ],
  };

  it("speaks the round cadencia once per Fran round bump (beep + cadence) and finishes silently", () => {
    const { audio, playRoundChange, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(cadenceFranWorkout, audio);
    engine.start();
    skipGetReady(engine);
    speak.mockClear();

    engine.nextRound();
    expect(engine.getState().currentRound).toBe(2);
    expect(playRoundChange).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledWith("15 REPETICIONES");

    engine.nextRound();
    expect(engine.getState().currentRound).toBe(3);
    expect(playRoundChange).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenCalledWith("9 REPETICIONES");

    // Last round judged complete → finish without an extra cadencia cue.
    engine.nextRound();
    expect(engine.getState().status).toBe("finished");
    expect(playRoundChange).toHaveBeenCalledTimes(2);
    expect(cadenceSpeech(speak)).toHaveLength(2);
  });

  it("re-spokes the cadencia on every AMRAP ladder round, clamping at min", () => {
    const { audio, playRoundChange, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(cadenceAmrapWorkout, audio);
    engine.start();
    skipGetReady(engine);
    speak.mockClear();

    engine.nextRound();
    expect(speak).toHaveBeenCalledWith("18 REPETICIONES");
    engine.nextRound();
    expect(speak).toHaveBeenCalledWith("15 REPETICIONES");
    engine.nextRound();
    // Round 4 clamps at min (21 → 18 → 15 → 15); the fixed cap still ends it.
    expect(speak).toHaveBeenCalledWith("15 REPETICIONES");
    expect(playRoundChange).toHaveBeenCalledTimes(3);
    expect(engine.getState().status).toBe("running");
  });

  it("picks the cadencia unit from the current station's metric (banner-parity rotation)", () => {
    const workout: Workout = {
      id: "w17",
      name: "Ladder mixto",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        {
          id: "b1",
          type: "forTime",
          durationSeconds: 120,
          rounds: 3,
          repScheme: { start: 10, step: -1, min: 5 },
          exercises: [
            { id: "e1", name: "Thrusters" },
            { id: "e2", name: "Row", calories: 50 },
          ],
        },
      ],
    };
    const { audio, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(workout, audio);
    engine.start();
    skipGetReady(engine);
    speak.mockClear();

    // Round 2 → TV highlights station (2-1)%2 = 1 (Row) → CALORÍAS unit.
    engine.nextRound();
    expect(speak).toHaveBeenCalledWith("9 CALORÍAS");
    // Round 3 → station 0 (Thrusters) → REPS unit.
    engine.nextRound();
    expect(speak).toHaveBeenCalledWith("8 REPETICIONES");
  });

  it("fires the cadence on top of EMOM's existing TRABAJO cue when the EMOM carries a repScheme", () => {
    const emomLadderWorkout: Workout = {
      ...emomWorkout,
      blocks: [
        {
          ...emomWorkout.blocks[0],
          repScheme: { start: 20, step: -5, min: 5 },
        },
      ],
    };
    const { audio, playRoundChange, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(emomLadderWorkout, audio);
    engine.start();
    skipGetReady(engine);
    speak.mockClear();
    playRoundChange.mockClear();

    vi.advanceTimersByTime(60_100);
    expect(engine.getState().currentRound).toBe(2);
    expect(engine.getState().currentPhase).toBe("work");
    // Existing round cue (beep + TRABAJO) still fires…
    expect(speak).toHaveBeenCalledWith("TRABAJO");
    // …and the new cadencia cue lands on top of it: one more beep + speech.
    expect(playRoundChange).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenCalledWith("15 REPETICIONES");
  });

  it("does NOT add cadence speech when a non-ladder EMOM rounds over (existing cue intact)", () => {
    const { audio, playRoundChange, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(emomWorkout, audio);
    engine.start();
    skipGetReady(engine);
    speak.mockClear();
    playRoundChange.mockClear();

    vi.advanceTimersByTime(60_100);
    expect(engine.getState().currentRound).toBe(2);
    expect(playRoundChange).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledWith("TRABAJO");
    expect(cadenceSpeech(speak)).toHaveLength(0);
  });

  it("skips the cue when the engine is paused even though the round advances", () => {
    const { audio, playRoundChange, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(cadenceAmrapWorkout, audio);
    engine.start();
    skipGetReady(engine);
    engine.pause();
    speak.mockClear();
    playRoundChange.mockClear();

    engine.nextRound();
    expect(engine.getState().currentRound).toBe(2);
    expect(playRoundChange).not.toHaveBeenCalled();
    expect(cadenceSpeech(speak)).toHaveLength(0);
  });

  it("keeps chipper station announcements name-only (no cadence strings on the sweep)", () => {
    const murph: Workout = {
      id: "w18",
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
            { id: "e1", name: "Run 1 mile" },
            { id: "e2", name: "Pull-ups" },
          ],
        },
      ],
    };
    const { audio, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(murph, audio);
    engine.start();
    skipGetReady(engine);
    speak.mockClear();

    engine.nextRound();
    expect(engine.getState().currentExerciseIndex).toBe(1);
    expect(speak).toHaveBeenCalledWith("Pull-ups");
    expect(cadenceSpeech(speak)).toHaveLength(0);
  });
});
