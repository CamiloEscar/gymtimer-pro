import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WorkoutEngine } from "../WorkoutEngine";
import type { AudioManager } from "@/lib/audio/AudioManager";
import type { Workout } from "@/types";

type AudioSpy = {
  audio: AudioManager;
  playRoundChange: ReturnType<typeof vi.fn>;
  playCountdownBeep: ReturnType<typeof vi.fn>;
};

// Minimal audio spy — we only need the transition-cue methods the engine
// actually calls (playRoundChange / playCountdownBeep). Cast to AudioManager
// so the constructor accepts it; keep typed refs to the mocks so test code
// can call `.mockClear()` without losing visibility.
function makeAudioSpy(): AudioSpy {
  const playRoundChange = vi.fn();
  const playCountdownBeep = vi.fn();
  return {
    audio: {
      playRoundChange,
      playCountdownBeep,
      // remaining methods are unused by the engine in this scope
      playStart: vi.fn(),
      playFinish: vi.fn(),
      playWorkToRest: vi.fn(),
      playRestToWork: vi.fn(),
      speak: vi.fn(),
    } as unknown as AudioManager,
    playRoundChange,
    playCountdownBeep,
  };
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
    // Work is 40s; the rest of the 60s interval (20s) is the wait phase.
    // 40_100ms lands us 100ms into the wait phase — same boundary-overshoot
    // pattern the existing interval tests use (see the comment block on
    // the `transitions work -> rest` test below for the full trace).
    vi.advanceTimersByTime(40_100);
    expect(engine.getState().currentPhase).toBe("wait");
    expect(engine.getState().timer.remainingMs).toBe(20_000 - 100);
  });

  it("rolls over to the next round after the wait phase completes", () => {
    const engine = new WorkoutEngine(emomWorkout);
    engine.start();
    // 40s work + 20s wait = 60s for round 1; advance 60_100 to land 100ms
    // into round 2's work phase.
    vi.advanceTimersByTime(60_100);
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.currentPhase).toBe("work");
    expect(state.timer.remainingMs).toBe(40_000 - 100);
  });

  it("finishes after N rounds complete", () => {
    const engine = new WorkoutEngine(emomWorkout);
    engine.start();
    // 3 rounds * 60s = 180s; advance a bit past the end.
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
    expect(engine.getState().currentPhase).toBe("work");
    expect(engine.getState().timer.remainingMs).toBe(30_000);

    // Work 30s -> rest phase. 30_100 lands 100ms into the rest phase.
    vi.advanceTimersByTime(30_100);
    expect(engine.getState().currentPhase).toBe("rest");
    expect(engine.getState().currentRound).toBe(1);

    // Rest 10s -> wait phase. Boundary is at 40s; 40_100 lands 100ms into
    // the 50s wait (interval 90 - work 30 - rest 10 = 50).
    vi.advanceTimersByTime(10_000);
    expect(engine.getState().currentPhase).toBe("wait");
    expect(engine.getState().timer.remainingMs).toBe(50_000 - 100);

    // Wait 50s -> round 2. Boundary at 90s; 90_100 lands 100ms into r2.
    vi.advanceTimersByTime(50_000);
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.currentPhase).toBe("work");
    expect(state.timer.remainingMs).toBe(30_000 - 100);
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
    vi.advanceTimersByTime(30_100);
    expect(engine.getState().currentPhase).toBe("rest");
    // No wait phase: 10s rest ends at 40s, advance 100ms more lands in r2.
    vi.advanceTimersByTime(10_000);
    const state = engine.getState();
    expect(state.currentRound).toBe(2);
    expect(state.currentPhase).toBe("work");
    expect(state.timer.remainingMs).toBe(30_000 - 100);
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
    engine.addRep();
    engine.removeRep();
    // Non-RM blocks don't carry the field at all.
    expect(engine.getState().accumulatedReps).toBeUndefined();
  });

  it("reset() zeros the rep counter", () => {
    const engine = new WorkoutEngine(rmWorkout);
    engine.start();
    engine.addRep();
    engine.addRep();
    engine.reset();
    expect(engine.getState().accumulatedReps).toBe(0);
  });

  it("finishes when the timecap elapses", () => {
    const engine = new WorkoutEngine(rmWorkout);
    engine.start();
    vi.advanceTimersByTime(5_200);
    expect(engine.getState().status).toBe("finished");
    expect(engine.getState().currentPhase).toBe("finished");
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
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentExerciseIndex).toBe(1);
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentExerciseIndex).toBe(2);
  });

  it("enters rest phase between rounds, then resumes at station 0 of the next round", () => {
    const engine = new WorkoutEngine(fgbWorkout);
    engine.start();
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
    // First station ends -> moves to station 1 (same round). ONE beep.
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentExerciseIndex).toBe(1);
    expect(playRoundChange).toHaveBeenCalledTimes(1);

    // Station 1 -> station 2. ANOTHER beep.
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentExerciseIndex).toBe(2);
    expect(playRoundChange).toHaveBeenCalledTimes(2);
    expect(playCountdownBeep).not.toHaveBeenCalled();
  });

  it("does NOT play the round-change cue at the end of the round's last station", () => {
    const { audio, playRoundChange } = makeAudioSpy();
    const engine = new WorkoutEngine(fgbWorkout, audio);
    engine.start();
    // Burn through all 3 stations of round 1 (no beep yet), landing in rest.
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
    // Burn through all 3 stations of round 1 -> land on station 2 (index 2).
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
    // Round 1 ends at 60s (40s work + 20s wait). Advance past it.
    vi.advanceTimersByTime(60_100);
    expect(engine.getState().currentRound).toBe(2);
    expect(engine.getState().currentPhase).toBe("work");
    expect(playRoundChange).toHaveBeenCalledTimes(1);
  });

  it("plays the round-change cue when an OTM rounds over to the next round", () => {
    const { audio, playRoundChange } = makeAudioSpy();
    const engine = new WorkoutEngine(otmWorkout, audio);
    engine.start();
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
    // Round 1: work 5s -> rest 3s -> round 2.
    vi.advanceTimersByTime(8_100);
    expect(engine.getState().currentRound).toBe(2);
    expect(playRoundChange).not.toHaveBeenCalled();
  });

  it("plays a short countdown beep when addRep() is called on an RM block", () => {
    const { audio, playRoundChange, playCountdownBeep } = makeAudioSpy();
    const engine = new WorkoutEngine(rmWorkout, audio);
    engine.start();
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
    engine.addRep();
    engine.addRep();
    expect(playCountdownBeep).not.toHaveBeenCalled();
    expect(playRoundChange).not.toHaveBeenCalled();
  });

  it("does NOT play any audio cue when removeRep() is called on an RM block", () => {
    const { audio, playCountdownBeep } = makeAudioSpy();
    const engine = new WorkoutEngine(rmWorkout, audio);
    engine.start();
    engine.addRep();
    playCountdownBeep.mockClear();
    engine.removeRep();
    expect(playCountdownBeep).not.toHaveBeenCalled();
  });

  it("is a no-op when constructed without an audio sink", () => {
    // Should not throw and must not crash across any transition.
    const engine = new WorkoutEngine(fgbWorkout, null);
    engine.start();
    vi.advanceTimersByTime(20_100);
    expect(engine.getState().status).toBe("finished");
  });
});
