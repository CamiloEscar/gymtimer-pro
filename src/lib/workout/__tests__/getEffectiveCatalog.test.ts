import { describe, it, expect } from "vitest";
import { getEffectiveCatalog, type CatalogExercise } from "../exerciseCatalog";

const catalog: CatalogExercise[] = [
  { id: "leg-01", name: "Sentadilla", category: "Piernas", description: "Original" },
  { id: "leg-02", name: "Zancada", category: "Piernas" },
  { id: "chest-01", name: "Press banca", category: "Pecho" },
];

describe("getEffectiveCatalog", () => {
  it("applies an override to the matching exercise", () => {
    const result = getEffectiveCatalog(catalog, [
      { exerciseId: "leg-01", name: "Sentadilla búlgara", videoUrl: "/exercises/squat.mp4", description: "Reemplazada" },
    ]);
    expect(result[0]).toMatchObject({
      id: "leg-01",
      name: "Sentadilla búlgara",
      videoUrl: "/exercises/squat.mp4",
      description: "Reemplazada",
    });
  });

  it("leaves exercises without an override untouched", () => {
    const result = getEffectiveCatalog(catalog, [{ exerciseId: "leg-01", name: "X" }]);
    expect(result[1]).toEqual(catalog[1]);
    expect(result[2]).toEqual(catalog[2]);
  });

  it("a partial override keeps the original fields it does not set", () => {
    const result = getEffectiveCatalog(catalog, [{ exerciseId: "leg-01", description: "Nueva desc" }]);
    expect(result[0]).toMatchObject({
      id: "leg-01",
      name: "Sentadilla",
      category: "Piernas",
      description: "Nueva desc",
    });
  });

  it("unknown override ids are ignored", () => {
    const result = getEffectiveCatalog(catalog, [{ exerciseId: "ghost", name: "Fantasmita" }]);
    expect(result).toEqual(catalog);
  });

  it("empty catalog returns empty array", () => {
    const result = getEffectiveCatalog([], [{ exerciseId: "leg-01", name: "X" }]);
    expect(result).toEqual([]);
  });

  it("a metricKind override wins over the catalog default; absence keeps it (T5.2)", () => {
    const withDefault: CatalogExercise[] = [
      { id: "cf-mo-01", name: "Row", category: "Cardio", metricKind: "calories" },
      { id: "cf-gy-13", name: "L-Sit", category: "Gymnastics", metricKind: "timeSeconds" },
    ];
    const result = getEffectiveCatalog(withDefault, [
      { exerciseId: "cf-mo-01", metricKind: "reps" },
    ]);
    expect(result[0].metricKind).toBe("reps");
    expect(result[1].metricKind).toBe("timeSeconds");
    // An override with no metricKind never erases the catalog default.
    const untouched = getEffectiveCatalog(withDefault, [{ exerciseId: "cf-mo-01", name: "Remo" }]);
    expect(untouched[0].metricKind).toBe("calories");
  });
});