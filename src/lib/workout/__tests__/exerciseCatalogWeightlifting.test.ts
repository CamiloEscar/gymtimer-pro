import { describe, it, expect } from "vitest";
import { WEIGHTLIFTING_CATALOG } from "../exerciseCatalogWeightlifting";
import { groupCatalogByCategory } from "../exerciseCatalog";

describe("WEIGHTLIFTING_CATALOG", () => {
  it("has at least 8 exercises", () => {
    expect(WEIGHTLIFTING_CATALOG.length).toBeGreaterThanOrEqual(8);
  });

  it("has unique ids", () => {
    const ids = WEIGHTLIFTING_CATALOG.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses the Weightlifting category", () => {
    for (const exercise of WEIGHTLIFTING_CATALOG) {
      expect(exercise.category).toBe("Weightlifting");
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

  it("groups cleanly under a single category via groupCatalogByCategory", () => {
    const grouped = groupCatalogByCategory(WEIGHTLIFTING_CATALOG);
    expect(Object.keys(grouped)).toEqual(["Weightlifting"]);
    expect(grouped["Weightlifting"]?.length).toBe(WEIGHTLIFTING_CATALOG.length);
  });
});
