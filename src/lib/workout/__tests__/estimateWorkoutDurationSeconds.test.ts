import { describe, it, expect } from "vitest";
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "../estimateWorkoutDurationSeconds";
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

describe("estimateWorkoutDurationSeconds — basic blocks", () => {
  it("computes (work + rest) * rounds for basic blocks, same as interval", () => {
    const w = workout([
      { id: "b1", type: "basic", durationSeconds: 0, workSeconds: 45, restSeconds: 15, rounds: 4, exercises: [] },
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe((45 + 15) * 4);
  });
});

describe("estimateWorkoutDurationSeconds — EMOM/OTM", () => {
  it("uses intervalSeconds as the per-round length when set", () => {
    const w = workout([
      {
        id: "b1",
        type: "emom",
        durationSeconds: 0,
        workSeconds: 40,
        restSeconds: 0,
        rounds: 5,
        intervalSeconds: 60,
        exercises: [],
      },
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe(60 * 5);
  });

  it("falls back to (work + rest) * rounds when intervalSeconds is unset", () => {
    const w = workout([
      {
        id: "b1",
        type: "otm",
        durationSeconds: 0,
        workSeconds: 30,
        restSeconds: 10,
        rounds: 3,
        exercises: [],
      },
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe((30 + 10) * 3);
  });
});

describe("estimateWorkoutDurationSeconds — RM", () => {
  it("returns the timecap as the block duration", () => {
    const w = workout([
      { id: "b1", type: "rm", durationSeconds: 120, exercises: [] },
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe(120);
  });
});

describe("estimateWorkoutDurationSeconds — fightGoneBad", () => {
  it("sums stations * stationSeconds * rounds + (rounds - 1) * roundRest", () => {
    const w = workout([
      {
        id: "b1",
        type: "fightGoneBad",
        durationSeconds: 0,
        rounds: 3,
        stationSeconds: 60,
        roundRestSeconds: 60,
        exercises: [
          { id: "e1", name: "Wall Ball" },
          { id: "e2", name: "SDHP" },
          { id: "e3", name: "Box Jump" },
        ],
      },
    ]);
    // 3 stations * 60s * 3 rounds = 540s, + 2 inter-round rests * 60s = 120s
    expect(estimateWorkoutDurationSeconds(w)).toBe(540 + 120);
  });
});

describe("estimateWorkoutDurationSeconds — forTime station-sweep lane (T5.1)", () => {
  it("sums the station windows once for a chipper (rounds 1, Murph: 5 * 60s)", () => {
    const w = workout([
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
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe(5 * 60);
  });

  it("adds the inter-round rests for a rounds-of-stations forTime", () => {
    const w = workout([
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 0,
        rounds: 3,
        stationSeconds: 60,
        roundRestSeconds: 60,
        exercises: [
          { id: "e1", name: "Thrusters" },
          { id: "e2", name: "Pull-ups" },
        ],
      },
    ]);
    // 2 stations * 60s * 3 rounds = 360s + 2 rests * 60s = 480s
    expect(estimateWorkoutDurationSeconds(w)).toBe(360 + 120);
  });

  it("lets the per-exercise window win over block.stationSeconds in the sum", () => {
    const w = workout([
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
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe(60 + 30);
  });

  it("leaves a rounds>1 forTime WITHOUT station windows on its durationSeconds", () => {
    const w = workout([
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 120,
        rounds: 3,
        exercises: [
          { id: "e1", name: "Thrusters" },
          { id: "e2", name: "Pull-ups" },
        ],
      },
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe(120);
  });

  it("PIN: a repScheme ladder adds ZERO wall-clock — a sweep-capable ladder forTime is estimated as the classic durationSeconds, never as a station sweep", () => {
    const ladderScheme = { start: 21, step: -6, min: 9 };
    const ladderBlock = {
      id: "b1",
      type: "forTime" as const,
      durationSeconds: 300,
      rounds: 3,
      stationSeconds: 60,
      roundRestSeconds: 60,
      exercises: [
        { id: "e1", name: "Thrusters", repScheme: ladderScheme },
        { id: "e2", name: "Pull-ups", repScheme: ladderScheme },
      ],
    };
    // Without any repScheme on the exercises the same geometry IS a sweep:
    // 2 stations * 60s * 3 rounds + 2 rests * 60s = 480s.
    const w = workout([ladderBlock]);
    const withoutLadder = workout([
      {
        ...ladderBlock,
        exercises: ladderBlock.exercises.map((exercise) => {
          // Drop repScheme so the same geometry exercises the no-ladder lane.
          const { repScheme: _ignored, ...rest } = exercise as typeof exercise & { repScheme?: unknown };
          void _ignored;
          return rest;
        }),
      },
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe(300);
    expect(estimateWorkoutDurationSeconds(withoutLadder)).toBe(480);
  });

  it("PIN: an amrap ladder stays on the fixed cap (no ladder inflation)", () => {
    const w = workout([
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 600,
        rounds: 1,
        exercises: [
          { id: "e1", name: "Thrusters", repScheme: { start: 21, step: -3, min: 15 } },
          { id: "e2", name: "Pull-ups", repScheme: { start: 21, step: -3, min: 15 } },
        ],
      },
    ]);
    expect(estimateWorkoutDurationSeconds(w)).toBe(600);
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
