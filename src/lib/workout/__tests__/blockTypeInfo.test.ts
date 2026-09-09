import { describe, it, expect } from "vitest";
import { BLOCK_TYPE_INFO } from "../blockTypeInfo";

describe("BLOCK_TYPE_INFO", () => {
  it("marks basic, rest, countdown, countup as not requiring exercises", () => {
    expect(BLOCK_TYPE_INFO.basic.requiresExercises).toBe(false);
    expect(BLOCK_TYPE_INFO.rest.requiresExercises).toBe(false);
    expect(BLOCK_TYPE_INFO.countdown.requiresExercises).toBe(false);
    expect(BLOCK_TYPE_INFO.countup.requiresExercises).toBe(false);
  });

  it("marks amrap, emom, otm, interval, tabata, forTime, rm, fightGoneBad as requiring exercises", () => {
    expect(BLOCK_TYPE_INFO.amrap.requiresExercises).toBe(true);
    expect(BLOCK_TYPE_INFO.emom.requiresExercises).toBe(true);
    expect(BLOCK_TYPE_INFO.otm.requiresExercises).toBe(true);
    expect(BLOCK_TYPE_INFO.interval.requiresExercises).toBe(true);
    expect(BLOCK_TYPE_INFO.tabata.requiresExercises).toBe(true);
    expect(BLOCK_TYPE_INFO.forTime.requiresExercises).toBe(true);
    expect(BLOCK_TYPE_INFO.rm.requiresExercises).toBe(true);
    expect(BLOCK_TYPE_INFO.fightGoneBad.requiresExercises).toBe(true);
  });

  it("provides a noExercisesHint for every non-exercise-requiring type", () => {
    for (const type of ["basic", "rest", "countdown", "countup"] as const) {
      expect(BLOCK_TYPE_INFO[type].noExercisesHint).toBeTruthy();
    }
  });

  it("exposes a non-empty label and description for the 3 new types", () => {
    for (const type of ["otm", "rm", "fightGoneBad"] as const) {
      expect(BLOCK_TYPE_INFO[type].label.length).toBeGreaterThan(0);
      expect(BLOCK_TYPE_INFO[type].description.length).toBeGreaterThan(0);
    }
  });
});
