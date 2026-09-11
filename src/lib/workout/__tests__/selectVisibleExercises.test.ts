import { describe, it, expect } from "vitest";
import { selectVisibleExercises } from "../selectVisibleExercises";
import type { Exercise } from "@/types";

function exercises(count: number): Exercise[] {
  return Array.from({ length: count }, (_, i) => ({ id: `e${i}`, name: `Exercise ${i}` }));
}

describe("selectVisibleExercises", () => {
  it("returns all exercises with no overflow under the default max", () => {
    const result = selectVisibleExercises(exercises(3));
    expect(result.visible).toHaveLength(3);
    expect(result.overflowCount).toBe(0);
  });

  it("returns all exercises when equal to the default max", () => {
    const result = selectVisibleExercises(exercises(4));
    expect(result.visible).toHaveLength(4);
    expect(result.overflowCount).toBe(0);
  });

  it("returns every exercise by default (no hidden overflow)", () => {
    const result = selectVisibleExercises(exercises(7));
    expect(result.visible).toHaveLength(7);
    expect(result.visible.map((e) => e.id)).toEqual(["e0", "e1", "e2", "e3", "e4", "e5", "e6"]);
    expect(result.overflowCount).toBe(0);
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