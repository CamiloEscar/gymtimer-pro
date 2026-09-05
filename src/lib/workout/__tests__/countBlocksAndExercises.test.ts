import { describe, it, expect } from "vitest";
import { countBlocksAndExercises } from "../countBlocksAndExercises";
import type { Workout } from "@/types";

function workoutWith(blocks: Workout["blocks"]): Workout {
  return {
    id: "w1",
    name: "Test",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks,
  };
}

describe("countBlocksAndExercises", () => {
  it("counts zero blocks and zero exercises for an empty workout", () => {
    expect(countBlocksAndExercises(workoutWith([]))).toEqual({ blocks: 0, exercises: 0 });
  });

  it("counts blocks and sums exercises across all blocks", () => {
    const workout = workoutWith([
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 600,
        exercises: [
          { id: "e1", name: "Burpees" },
          { id: "e2", name: "Sentadilla" },
        ],
      },
      {
        id: "b2",
        type: "forTime",
        durationSeconds: 0,
        exercises: [{ id: "e3", name: "Remo" }],
      },
    ]);
    expect(countBlocksAndExercises(workout)).toEqual({ blocks: 2, exercises: 3 });
  });
});
