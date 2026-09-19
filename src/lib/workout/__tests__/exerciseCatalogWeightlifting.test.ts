import { describe, it, expect } from "vitest";
import {
  WEIGHTLIFTING_CATALOG,
  isLiftExercise,
} from "../exerciseCatalogWeightlifting";
import { groupCatalogByCategory } from "../exerciseCatalog";

const KNOWN_CATEGORIES = [
  "Powerlifting",
  "Olympic Lifts",
  "Lower Body",
  "Upper Body",
  "Core & Accessories",
];

describe("WEIGHTLIFTING_CATALOG", () => {
  it("has at least 28 exercises", () => {
    expect(WEIGHTLIFTING_CATALOG.length).toBeGreaterThanOrEqual(28);
  });

  it("has unique ids", () => {
    const ids = WEIGHTLIFTING_CATALOG.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses only known lifting categories", () => {
    for (const exercise of WEIGHTLIFTING_CATALOG) {
      expect(KNOWN_CATEGORIES).toContain(exercise.category);
    }
  });

  it("spans all lifting categories via groupCatalogByCategory", () => {
    const grouped = groupCatalogByCategory(WEIGHTLIFTING_CATALOG);
    expect(Object.keys(grouped).sort()).toEqual([...KNOWN_CATEGORIES].sort());
    for (const category of KNOWN_CATEGORIES) {
      expect(grouped[category]?.length).toBeGreaterThan(0);
    }
  });

  it("has a non-empty name for every exercise", () => {
    for (const exercise of WEIGHTLIFTING_CATALOG) {
      expect(exercise.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("has a non-empty description for every exercise", () => {
    for (const exercise of WEIGHTLIFTING_CATALOG) {
      expect(exercise.description?.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("isLiftExercise", () => {
  it("matches every catalog name regardless of case", () => {
    for (const exercise of WEIGHTLIFTING_CATALOG) {
      expect(isLiftExercise(exercise.name)).toBe(true);
      expect(isLiftExercise(exercise.name.toUpperCase())).toBe(true);
    }
  });

  it("matches gym-catalog barbell movements too", () => {
    expect(isLiftExercise("Sentadilla")).toBe(true);
    expect(isLiftExercise("peso muerto")).toBe(true);
    expect(isLiftExercise("Press banca")).toBe(true);
  });

  it("rejects movements from other catalogs", () => {
    expect(isLiftExercise("Thruster")).toBe(false);
    expect(isLiftExercise("Sentadilla goblet")).toBe(false);
    expect(isLiftExercise("Kettlebell Swing")).toBe(false);
    expect(isLiftExercise("Zancada")).toBe(false);
  });
});