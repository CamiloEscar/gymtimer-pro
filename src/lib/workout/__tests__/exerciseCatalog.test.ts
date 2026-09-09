import { describe, it, expect } from "vitest";
import { EXERCISE_CATALOG, groupCatalogByCategory } from "../exerciseCatalog";

const KNOWN_CATEGORIES = [
  "Piernas",
  "Pecho",
  "Espalda",
  "Core",
  "Cardio/Funcional",
  "Hombros/Brazos",
];

describe("EXERCISE_CATALOG", () => {
  it("has at least 40 exercises", () => {
    expect(EXERCISE_CATALOG.length).toBeGreaterThanOrEqual(40);
  });

  it("has unique ids", () => {
    const ids = EXERCISE_CATALOG.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses known categories", () => {
    for (const exercise of EXERCISE_CATALOG) {
      expect(KNOWN_CATEGORIES).toContain(exercise.category);
    }
  });

  it("has a non-empty name for every exercise", () => {
    for (const exercise of EXERCISE_CATALOG) {
      expect(exercise.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("has a non-empty description for every exercise", () => {
    for (const exercise of EXERCISE_CATALOG) {
      expect(exercise.description?.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("groupCatalogByCategory", () => {
  it("groups exercises under their category key", () => {
    const catalog = [
      { id: "a", name: "Sentadilla", category: "Piernas" },
      { id: "b", name: "Press banca", category: "Pecho" },
      { id: "c", name: "Zancada", category: "Piernas" },
    ];
    const grouped = groupCatalogByCategory(catalog);
    expect(Object.keys(grouped)).toEqual(["Piernas", "Pecho"]);
    expect(grouped["Piernas"].map((e) => e.id)).toEqual(["a", "c"]);
    expect(grouped["Pecho"].map((e) => e.id)).toEqual(["b"]);
  });

  it("returns an empty object for an empty catalog", () => {
    expect(groupCatalogByCategory([])).toEqual({});
  });
});
