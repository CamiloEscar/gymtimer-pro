import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WorkoutEngine } from "../WorkoutEngine";
import { formatExerciseLine } from "../formatExerciseLine";
import { validateWorkout } from "../validateWorkout";
import { getEffectiveCatalog } from "../exerciseCatalog";
import { CROSSFIT_CATALOG } from "../exerciseCatalogCrossfit";
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

function skipGetReady(engine: WorkoutEngine) {
  engine.skipGetReadyForTest();
}

// ---- Spec R1/R3 helper: the metric/cadence speech the ladder fires on a round bump.
const CADENCE_UNITS = ["REPETICIONES", "METROS", "CALORÍAS", "SEGUNDOS", "MÁXIMO"];
const cadenceSpeech = (speak: ReturnType<typeof vi.fn>) =>
  speak.mock.calls.filter(([text]) => CADENCE_UNITS.some((unit) => text.includes(unit)));

describe("S1 — mixed block: AMRAP ladder → FOR TIME rounds → TABATA (3 adjacent blocks)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  const mixedWorkout: Workout = {
    id: "s1",
    name: "Mixto",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 3,
        rounds: 1,
        repScheme: { start: 21, step: -3, min: 15 },
        exercises: [
          { id: "e1", name: "Push Ups" },
          { id: "e2", name: "Air Squats" },
        ],
      },
      {
        id: "b2",
        type: "forTime",
        durationSeconds: 5,
        rounds: 3,
        exercises: [
          { id: "e3", name: "Thrusters" },
          { id: "e4", name: "Pull-ups" },
        ],
      },
      {
        id: "b3",
        type: "tabata",
        durationSeconds: 0,
        workSeconds: 2,
        restSeconds: 1,
        rounds: 2,
        exercises: [{ id: "e5", name: "Burpees" }],
      },
    ],
  };

  it("runs block 1 as an AMRAP ladder on ONE continuous clock, re-speaking the cadencia per round", () => {
    const { audio, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(mixedWorkout, audio);
    engine.start();
    skipGetReady(engine);

    expect(engine.getState().currentBlockIndex).toBe(0);
    expect(engine.getState().currentPhase).toBe("work");
    expect(engine.getState().timer.remainingMs).toBe(3_000);

    engine.nextRound();
    expect(engine.getState().currentRound).toBe(2);
    // Continuous clock: the cap keeps counting from where it was.
    expect(engine.getState().timer.remainingMs).toBe(3_000);
    expect(speak).toHaveBeenCalledWith("18 REPETICIONES");

    engine.nextRound();
    expect(engine.getState().currentRound).toBe(3);
    expect(speak).toHaveBeenCalledWith("15 REPETICIONES");
    expect(engine.getState().timer.remainingMs).toBe(3_000);
  });

  it("hands off to the FOR TIME rounds block (judge-advance) and then to a TABATA left untouched", () => {
    const { audio, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(mixedWorkout, audio);
    engine.start();
    skipGetReady(engine);

    // One ladder bump re-speaks the cadencia before the cap hands the block off.
    engine.nextRound();
    expect(engine.getState().currentRound).toBe(2);
    expect(speak).toHaveBeenCalledWith("18 REPETICIONES");

    // AMRAP cap (3s) expires → next block's getReady.
    vi.advanceTimersByTime(3_100);
    expect(engine.getState().currentBlockIndex).toBe(1);
    expect(engine.getState().currentPhase).toBe("getReady");
    skipGetReady(engine);

    // FOR TIME: single countdown cap, judge advances the rounds.
    expect(engine.getState().currentPhase).toBe("work");
    expect(engine.getState().totalRounds).toBe(3);
    expect(engine.getState().timer.remainingMs).toBe(5_000);
    engine.nextRound();
    expect(engine.getState().currentRound).toBe(2);
    expect(engine.getState().timer.remainingMs).toBe(5_000);
    engine.nextRound();
    expect(engine.getState().currentRound).toBe(3);
    engine.nextRound();
    expect(engine.getState().currentBlockIndex).toBe(2);
    skipGetReady(engine);
    // The forTime/rounds hand-off itself stays silent (block 2 has no repScheme).
    const cadenceMessages = cadenceSpeech(speak);
    expect(cadenceMessages.map(([text]) => text)).toEqual(["18 REPETICIONES"]);

    // TABATA untouched: the classic work/rest advance machinery takes over
    // with the usual spoken cues, unchanged by the ladder work above.
    speak.mockClear();
    expect(engine.getState().currentPhase).toBe("work");
    expect(engine.getState().currentRound).toBe(1);
    vi.advanceTimersByTime(2_100);
    expect(engine.getState().currentPhase).toBe("rest");
    expect(engine.getState().currentRound).toBe(1);
    vi.advanceTimersByTime(1_100);
    expect(engine.getState().currentPhase).toBe("work");
    expect(engine.getState().currentRound).toBe(2);
    vi.advanceTimersByTime(2_100);
    expect(engine.getState().currentPhase).toBe("rest");
    vi.advanceTimersByTime(1_100);
    expect(engine.getState().status).toBe("finished");
    expect(speak).toHaveBeenCalledWith("DESCANSO");
    expect(speak).toHaveBeenCalledWith("TRABAJO");
    expect(cadenceSpeech(speak)).toHaveLength(0);
  });
});

describe("S2 — Fran 21-15-9 lockstep ladder (full flow)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  const franWorkout: Workout = {
    id: "s2",
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

  it("validates clean and scales BOTH stations lockstep 21 → 15 → 9 (display parity)", () => {
    expect(validateWorkout(franWorkout)).toEqual([]);
    const block = franWorkout.blocks[0];
    const round1 = block.exercises.map((ex) => formatExerciseLine(ex, { block, round: 1 }));
    const round2 = block.exercises.map((ex) => formatExerciseLine(ex, { block, round: 2 }));
    const round3 = block.exercises.map((ex) => formatExerciseLine(ex, { block, round: 3 }));
    expect(round1).toEqual(["Thrusters · 21reps", "Pull-ups · 21reps"]);
    expect(round2).toEqual(["Thrusters · 15reps", "Pull-ups · 15reps"]);
    expect(round3).toEqual(["Thrusters · 9reps", "Pull-ups · 9reps"]);
  });

  it("bumps rounds with a continuous clock and fires the cadencia speech per round, finishing on the 3rd judge call", () => {
    const { audio, playRoundChange, speak } = makeAudioSpy();
    const engine = new WorkoutEngine(franWorkout, audio);
    engine.start();
    skipGetReady(engine);
    speak.mockClear();

    engine.nextRound();
    expect(engine.getState().currentRound).toBe(2);
    expect(engine.getState().timer.remainingMs).toBe(120_000);
    expect(playRoundChange).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledWith("15 REPETICIONES");

    engine.nextRound();
    expect(engine.getState().currentRound).toBe(3);
    expect(engine.getState().timer.remainingMs).toBe(120_000);
    expect(playRoundChange).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenCalledWith("9 REPETICIONES");

    engine.nextRound();
    expect(engine.getState().status).toBe("finished");
    expect(playRoundChange).toHaveBeenCalledTimes(2);
    expect(cadenceSpeech(speak)).toHaveLength(2);
  });
});

describe("S3 — Murph chipper: one-pass multi-station sweep + catalog default vs override", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  const murphWorkout: Workout = {
    id: "s3",
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
          { id: "e1", name: "Run", metricKind: "distanceMeters", distanceMeters: 1609 },
          { id: "e2", name: "Row", metricKind: "calories", calories: 50 },
          { id: "e3", name: "L-Sit", metricKind: "timeSeconds", timeSeconds: 30 },
          { id: "e4", name: "Squats" },
        ],
      },
    ],
  };

  it("sweeps the stations 0 → last → finish with BOTH clock kinds (judge-stopped countup and expiring countdown)", () => {
    const engine = new WorkoutEngine(murphWorkout);
    engine.start();
    skipGetReady(engine);
    expect(engine.getState().totalRounds).toBe(1);
    expect(engine.getState().currentExerciseIndex).toBe(0);
    expect(engine.getState().timer.mode).toBe("countup");

    engine.nextRound();
    expect(engine.getState().currentExerciseIndex).toBe(1); // Row (countup)
    expect(engine.getState().timer.mode).toBe("countup");
    engine.nextRound();
    const lSit = engine.getState();
    expect(lSit.currentExerciseIndex).toBe(2);
    // Per-exercise window wins: countdown 30s, not the block's 60s.
    expect(lSit.timer.mode).toBe("countdown");
    expect(lSit.timer.remainingMs).toBe(30_000);

    // Countdown expiry self-advances (no judge nudge needed).
    vi.advanceTimersByTime(30_100);
    expect(engine.getState().currentExerciseIndex).toBe(3); // Squats (countup)
    expect(engine.getState().timer.mode).toBe("countup");

    // Last station judge-stopped → finish.
    engine.nextRound();
    expect(engine.getState().status).toBe("finished");
  });

  it("renders each station's metric via formatExerciseLine (display parity with the banner)", () => {
    const block = murphWorkout.blocks[0];
    const lines = block.exercises.map((ex) => formatExerciseLine(ex, { block, round: 1 }));
    expect(lines).toEqual([
      "Run · 1609m",
      "Row · 50cal",
      "L-Sit · 0:30",
      "Squats",
    ]);
  });

  it("shows the catalog default when no override exists and the override wins when present", () => {
    // Catalog default: Row (cf-mo-01) carries metricKind=calories.
    const row = CROSSFIT_CATALOG.find((entry) => entry.id === "cf-mo-01");
    expect(row?.metricKind).toBe("calories");

    const effectiveDefault = getEffectiveCatalog(CROSSFIT_CATALOG, []);
    const rowDefault = effectiveDefault.find((entry) => entry.id === "cf-mo-01");
    // No override → calories: the exercise the editor would prefill renders as
    // "50cal" and validates.
    const defaultExercise = {
      id: rowDefault!.id,
      name: rowDefault!.name,
      metricKind: rowDefault!.metricKind,
      calories: 50,
    };
    expect(formatExerciseLine(defaultExercise)).toBe("Row · 50cal");
    expect(
      validateWorkout({
        id: "v1",
        name: "Con remo",
        createdAt: "2026-01-01T00:00:00.000Z",
        favorite: false,
        blocks: [
          {
            id: "b1",
            type: "forTime",
            durationSeconds: 0,
            rounds: 1,
            exercises: [{ ...defaultExercise }],
          },
        ],
      }),
    ).toEqual([]);

    // Override wins: settings saves metricKind=reps on the SAME catalog entry
    // → the editor prefills reps → the exercise renders "30reps" and validates.
    const effectiveOverridden = getEffectiveCatalog(CROSSFIT_CATALOG, [
      { exerciseId: "cf-mo-01", metricKind: "reps" },
    ]);
    const rowOverridden = effectiveOverridden.find((entry) => entry.id === "cf-mo-01");
    expect(rowOverridden!.metricKind).toBe("reps");
    const overriddenExercise = {
      id: rowOverridden!.id,
      name: rowOverridden!.name,
      metricKind: rowOverridden!.metricKind,
      reps: 30,
    };
    expect(formatExerciseLine(overriddenExercise)).toBe("Row · 30reps");
    expect(
      validateWorkout({
        id: "v2",
        name: "Con remo override",
        createdAt: "2026-01-01T00:00:00.000Z",
        favorite: false,
        blocks: [
          {
            id: "b1",
            type: "forTime",
            durationSeconds: 0,
            rounds: 1,
            exercises: [{ ...overriddenExercise }],
          },
        ],
      }),
    ).toEqual([]);
  });
});