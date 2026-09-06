import { describe, it, expect } from "vitest";
import { validateWorkout } from "../validateWorkout";
import type { Workout } from "@/types";

function baseWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: "w1",
    name: "Fran",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 0,
        exercises: [{ id: "e1", name: "Thrusters", reps: 21 }],
      },
    ],
    ...overrides,
  };
}

describe("validateWorkout", () => {
  it("accepts a valid workout with no errors", () => {
    expect(validateWorkout(baseWorkout())).toEqual([]);
  });

  it("requires a name", () => {
    const errors = validateWorkout(baseWorkout({ name: "" }));
    expect(errors).toContainEqual({ message: "Name is required" });
  });

  it("requires at least one block", () => {
    const errors = validateWorkout(baseWorkout({ blocks: [] }));
    expect(errors).toContainEqual({ message: "Add at least one block" });
  });

  it("rejects a block with rounds <= 0 and attaches the block id", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "interval",
          durationSeconds: 0,
          workSeconds: 20,
          restSeconds: 10,
          rounds: 0,
          exercises: [{ id: "e1", name: "Row" }],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Rounds must be greater than 0",
      blockId: "b1",
    });
  });

  it("rejects a block with no exercises and attaches the block id", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "amrap", durationSeconds: 600, exercises: [] }],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Each block needs at least one exercise",
      blockId: "b1",
    });
  });
});
