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
});
