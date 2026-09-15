import { describe, it, expect } from "vitest";
import { CROSSFIT_CATALOG } from "../exerciseCatalogCrossfit";
import { groupCatalogByCategory } from "../exerciseCatalog";
import { metricOf } from "../repScheme";
import type { Exercise } from "@/types";

const KNOWN_CATEGORIES = ["Weightlifting", "Gymnastics", "Monostructural/Cardio"];

describe("CROSSFIT_CATALOG", () => {
  it("has at least 40 exercises", () => {
    expect(CROSSFIT_CATALOG.length).toBeGreaterThanOrEqual(40);
  });

  it("has unique ids", () => {
    const ids = CROSSFIT_CATALOG.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses known categories", () => {
    for (const exercise of CROSSFIT_CATALOG) {
      expect(KNOWN_CATEGORIES).toContain(exercise.category);
    }
  });

  it("has a non-empty name for every exercise", () => {
    for (const exercise of CROSSFIT_CATALOG) {
      expect(exercise.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("has a non-empty description for every exercise", () => {
    for (const exercise of CROSSFIT_CATALOG) {
      expect(exercise.description?.trim().length).toBeGreaterThan(0);
    }
  });

  it("groups into all three known categories with groupCatalogByCategory", () => {
    const grouped = groupCatalogByCategory(CROSSFIT_CATALOG);
    expect(Object.keys(grouped).sort()).toEqual([...KNOWN_CATEGORIES].sort());
  });

  it.each([
    ["Row", "calories"],
    ["Assault Bike", "calories"],
    ["Ski Erg", "calories"],
    ["Run", "distanceMeters"],
    ["L-Sit", "timeSeconds"],
  ])("defaults %s to metricKind %s", (name, metricKind) => {
    const entry = CROSSFIT_CATALOG.find((exercise) => exercise.name === name);
    expect(entry?.metricKind).toBe(metricKind);
  });

  it("resolves any catalog entry without an explicit metricKind to reps", () => {
    const entry = CROSSFIT_CATALOG.find((exercise) => exercise.name === "Back Squat");
    expect(entry).toBeDefined();
    expect(metricOf(entry! as Exercise)).toBe("reps");
  });
});
