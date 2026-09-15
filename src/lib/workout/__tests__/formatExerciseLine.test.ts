import { describe, it, expect } from "vitest";
import { formatExerciseLine } from "../formatExerciseLine";
import type { Exercise } from "@/types";

describe("formatExerciseLine", () => {
  it("renders only the name when no other fields are set", () => {
    const exercise: Exercise = { id: "e1", name: "Burpees" };
    expect(formatExerciseLine(exercise)).toBe("Burpees");
  });

  it("appends reps when set", () => {
    const exercise: Exercise = { id: "e1", name: "Burpees", reps: 15 };
    expect(formatExerciseLine(exercise)).toBe("Burpees · 15reps");
  });

  it("appends sets when set", () => {
    const exercise: Exercise = { id: "e1", name: "Sentadilla", sets: 4 };
    expect(formatExerciseLine(exercise)).toBe("Sentadilla · 4series");
  });

  it("appends weight when set", () => {
    const exercise: Exercise = { id: "e1", name: "Peso muerto", weightKg: 60 };
    expect(formatExerciseLine(exercise)).toBe("Peso muerto · 60kg");
  });

  it("combines all segments in reps, sets, weight order", () => {
    const exercise: Exercise = { id: "e1", name: "Sentadilla", reps: 10, sets: 3, weightKg: 40 };
    expect(formatExerciseLine(exercise)).toBe("Sentadilla · 10reps · 3series · 40kg");
  });

  it("omits weight of 0 as unset-like but keeps an explicit weight of 0 hidden is wrong — treats 0 as a real value", () => {
    const exercise: Exercise = { id: "e1", name: "Curl", weightKg: 0 };
    expect(formatExerciseLine(exercise)).toBe("Curl · 0kg");
  });

  it("keeps old-shape output byte-identical even with a block ctx that carries no repScheme", () => {
    const exercise: Exercise = { id: "e1", name: "Burpees", reps: 15, sets: 3, weightKg: 20 };
    expect(formatExerciseLine(exercise, { block: { type: "amrap" } as never })).toBe(
      "Burpees · 15reps · 3series · 20kg",
    );
  });

  it("renders calories as Ncal", () => {
    const exercise: Exercise = { id: "e1", name: "Row", calories: 50, metricKind: "calories" };
    expect(formatExerciseLine(exercise)).toBe("Row · 50cal");
  });

  it("infers calories from the field alone (no explicit metricKind)", () => {
    const exercise: Exercise = { id: "e1", name: "Row", calories: 50 };
    expect(formatExerciseLine(exercise)).toBe("Row · 50cal");
  });

  it("renders distance in meters", () => {
    const exercise: Exercise = { id: "e1", name: "Run", distanceMeters: 400 };
    expect(formatExerciseLine(exercise)).toBe("Run · 400m");
  });

  it("renders timeSeconds through formatTimeInput", () => {
    const exercise: Exercise = { id: "e1", name: "L-Sit", timeSeconds: 30 };
    expect(formatExerciseLine(exercise)).toBe("L-Sit · 0:30");
  });

  it("renders max as a MÁX badge segment, no amount", () => {
    const exercise: Exercise = { id: "e1", name: "Clean", metricKind: "max" };
    expect(formatExerciseLine(exercise)).toBe("Clean · MÁX");
  });

  it("applies the block ladder to reps when a repScheme and round are given", () => {
    const exercise: Exercise = { id: "e1", name: "Thruster", reps: 21 };
    const block: import("@/types").WorkoutBlock = {
      id: "b",
      type: "forTime",
      durationSeconds: 0,
      rounds: 3,
      exercises: [exercise],
      repScheme: { start: 21, step: -6, min: 9 },
    };
    expect(formatExerciseLine(exercise, { block, round: 2 })).toBe("Thruster · 15reps");
  });

  it("leaves per-exercise reps untouched when no ladder is present", () => {
    const exercise: Exercise = { id: "e1", name: "Thruster", reps: 21 };
    expect(formatExerciseLine(exercise, { block: { id: "b", type: "emom" } as never, round: 3 })).toBe(
      "Thruster · 21reps",
    );
  });
});
