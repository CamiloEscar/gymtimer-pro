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
    expect(errors).toContainEqual({ message: "El nombre es obligatorio" });
  });

  it("requires at least one block", () => {
    const errors = validateWorkout(baseWorkout({ blocks: [] }));
    expect(errors).toContainEqual({ message: "Agregá al menos un bloque" });
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
      message: "Las rondas deben ser mayores a 0",
      blockId: "b1",
    });
  });

  it("rejects a block with no exercises and attaches the block id", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "amrap", durationSeconds: 600, exercises: [] }],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Cada bloque necesita al menos un ejercicio",
      blockId: "b1",
    });
  });

  it("accepts a basic block with no exercises", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "basic", durationSeconds: 0, exercises: [] }],
    });
    expect(validateWorkout(workout)).toEqual([]);
  });

  it("accepts a rest block with no exercises", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "rest", durationSeconds: 60, exercises: [] }],
    });
    const errors = validateWorkout(workout);
    expect(errors).not.toContainEqual(
      expect.objectContaining({ blockId: "b1", message: expect.stringMatching(/ejercicio/i) })
    );
  });

  it("accepts a countdown block with no exercises", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "countdown", durationSeconds: 60, exercises: [] }],
    });
    const errors = validateWorkout(workout);
    expect(errors).not.toContainEqual(
      expect.objectContaining({ blockId: "b1", message: expect.stringMatching(/ejercicio/i) })
    );
  });

  it("accepts a countup block with no exercises", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "countup", durationSeconds: 0, exercises: [] }],
    });
    const errors = validateWorkout(workout);
    expect(errors).not.toContainEqual(
      expect.objectContaining({ blockId: "b1", message: expect.stringMatching(/ejercicio/i) })
    );
  });

  it("rejects an interval block with no exercises", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "interval",
          durationSeconds: 0,
          workSeconds: 20,
          restSeconds: 10,
          rounds: 4,
          exercises: [],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Cada bloque necesita al menos un ejercicio",
      blockId: "b1",
    });
  });
});
