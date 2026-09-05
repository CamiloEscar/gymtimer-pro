import { describe, it, expect } from "vitest";
import { selectVisibleExercises } from "../selectVisibleExercises";
import type { Exercise } from "@/types";

function exercises(count: number): Exercise[] {
  return Array.from({ length: count }, (_, i) => ({ id: `e${i}`, name: `Exercise ${i}` }));
}

describe("selectVisibleExercises", () => {
  it("returns all exercises with no overflow when under the default max of 4", () => {
    const result = selectVisibleExercises(exercises(3));
    expect(result.visible).toHaveLength(3);
    expect(result.overflowCount).toBe(0);
  });

  it("returns exactly 4 with no overflow when equal to the default max", () => {
    const result = selectVisibleExercises(exercises(4));
    expect(result.visible).toHaveLength(4);
    expect(result.overflowCount).toBe(0);
  });

  it("truncates to the default max of 4 and reports the overflow count", () => {
    const result = selectVisibleExercises(exercises(7));
    expect(result.visible).toHaveLength(4);
    expect(result.visible.map((e) => e.id)).toEqual(["e0", "e1", "e2", "e3"]);
    expect(result.overflowCount).toBe(3);
  });

  it("respects a custom max", () => {
    const result = selectVisibleExercises(exercises(5), 2);
    expect(result.visible).toHaveLength(2);
    expect(result.overflowCount).toBe(3);
  });

  it("returns an empty visible list and zero overflow for an empty input", () => {
    expect(selectVisibleExercises([])).toEqual({ visible: [], overflowCount: 0 });
  });
});
