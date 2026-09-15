import { describe, it, expect } from "vitest";
import { ladderReps, isChipper, metricOf, stationWindow } from "../repScheme";
import type { Exercise, WorkoutBlock } from "@/types";
import type { RepScheme } from "@/types";

const FRAN: RepScheme = { start: 21, step: -6, min: 9 };
const ASC: RepScheme = { start: 10, step: 5, min: 25 };
const FIXED: RepScheme = { start: 15, step: 0, min: 10 };

describe("ladderReps", () => {
  it("returns undefined when no scheme is present (per-exercise reps)", () => {
    expect(ladderReps(undefined, 3)).toBeUndefined();
  });

  it("computes a descending Fran ladder 21 → 15 → 9", () => {
    expect(ladderReps(FRAN, 1)).toBe(21);
    expect(ladderReps(FRAN, 2)).toBe(15);
    expect(ladderReps(FRAN, 3)).toBe(9);
  });

  it("clamps at min once the arithmetic drops below it", () => {
    expect(ladderReps(FRAN, 4)).toBe(9);
    expect(ladderReps(FRAN, 10)).toBe(9);
  });

  it("floors ascending rounds at min until the arithmetic passes it", () => {
    // Pinned formula: max(min, start + step·(n−1)). start < min is the only
    // legal ascending geometry, so early rounds clamp UP at min.
    expect(ladderReps(ASC, 1)).toBe(ASC.min);
    expect(ladderReps(ASC, 2)).toBe(ASC.min);
    expect(ladderReps(ASC, 4)).toBe(ASC.min);
    expect(ladderReps(ASC, 5)).toBe(30); // 10 + 5·4 crosses min
    expect(ladderReps(ASC, 6)).toBe(35);
  });

  it("holds a fixed value when step is 0", () => {
    expect(ladderReps(FIXED, 1)).toBe(15);
    expect(ladderReps(FIXED, 5)).toBe(15);
  });

  it("never goes negative — min floor caps at >= 0", () => {
    expect(ladderReps({ start: 5, step: -10, min: 0 }, 3)).toBe(0);
  });
});

describe("isChipper", () => {
  function block(overrides: Partial<WorkoutBlock>): WorkoutBlock {
    return {
      id: "b",
      type: "forTime",
      durationSeconds: 0,
      exercises: [{ id: "e1", name: "A" }],
      ...overrides,
    };
  }

  it("is a chipper when a single-round forTime sweeps more than one exercise", () => {
    expect(isChipper(block({ exercises: [{ id: "e1", name: "A" }, { id: "e2", name: "B" }] }))).toBe(true);
  });

  it("is NOT a chipper for a single-movement forTime", () => {
    expect(isChipper(block({ exercises: [{ id: "e1", name: "A" }] }))).toBe(false);
  });

  it("is NOT a chipper when rounds > 1 (rounds-for-time)", () => {
    expect(
      isChipper(block({ rounds: 5, exercises: [{ id: "e1", name: "A" }, { id: "e2", name: "B" }] })),
    ).toBe(false);
  });

  it("explicit rounds:1 with multiple exercises IS a chipper", () => {
    expect(
      isChipper(block({ rounds: 1, exercises: [{ id: "e1", name: "A" }, { id: "e2", name: "B" }] })),
    ).toBe(true);
  });

  it("is never a chipper on non-forTime blocks", () => {
    const amrap: WorkoutBlock = {
      id: "b",
      type: "amrap",
      durationSeconds: 600,
      exercises: [{ id: "e1", name: "A" }, { id: "e2", name: "B" }],
    };
    expect(isChipper(amrap)).toBe(false);
  });
});

describe("metricOf (design D5 inference)", () => {
  const ex = (overrides: Partial<Exercise>): Exercise => ({ id: "e1", name: "X", ...overrides });

  it("explicit metricKind wins", () => {
    expect(metricOf(ex({ metricKind: "calories" }))).toBe("calories");
    expect(metricOf(ex({ metricKind: "max" }))).toBe("max");
  });

  it("infers calories from the calories field", () => {
    expect(metricOf(ex({ calories: 50 }))).toBe("calories");
  });

  it("infers distanceMeters from the distance field", () => {
    expect(metricOf(ex({ distanceMeters: 400 }))).toBe("distanceMeters");
  });

  it("infers timeSeconds from the time field", () => {
    expect(metricOf(ex({ timeSeconds: 30 }))).toBe("timeSeconds");
  });

  it("falls back to reps for old-shape exercises (and plain names)", () => {
    expect(metricOf(ex({ reps: 21 }))).toBe("reps");
    expect(metricOf(ex({}))).toBe("reps");
  });
});

describe("stationWindow (spec R2: exercise wins, block falls back)", () => {
  it("uses the per-exercise timeSeconds when set", () => {
    const block: WorkoutBlock = {
      id: "b",
      type: "fightGoneBad",
      durationSeconds: 0,
      stationSeconds: 60,
      exercises: [],
    };
    expect(stationWindow({ id: "e", name: "L-Sit", timeSeconds: 30 }, block)).toBe(30);
  });

  it("falls back to the block stationSeconds", () => {
    const block: WorkoutBlock = {
      id: "b",
      type: "fightGoneBad",
      durationSeconds: 0,
      stationSeconds: 60,
      exercises: [],
    };
    expect(stationWindow({ id: "e", name: "Row" }, block)).toBe(60);
  });
});