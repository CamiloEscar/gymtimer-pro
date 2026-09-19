import { describe, it, expect } from "vitest";
import { BAR_KG, loadPlates, PLATE_SIZES } from "../barbell";

describe("loadPlates", () => {
  it("treats weightKg as total on the bar including the 20kg bar", () => {
    const result = loadPlates(60);
    expect(result.barKg).toBe(20);
    expect(result.plates).toEqual([{ size: 20, count: 1 }]);
    expect(result.loadedKg).toBe(60);
  });

  it("prefers the biggest plate first — 100kg loads 20 + 20 per side", () => {
    const result = loadPlates(100);
    expect(result.plates).toEqual([{ size: 20, count: 2 }]);
    expect(result.loadedKg).toBe(100);
  });

  it("greedily mixes plate sizes (80kg → 20 + 10 per side)", () => {
    const result = loadPlates(80);
    expect(result.plates).toEqual([
      { size: 20, count: 1 },
      { size: 10, count: 1 },
    ]);
    expect(result.loadedKg).toBe(80);
  });

  it("handles the small collar plates (35kg → 5 + 2.5 per side)", () => {
    const result = loadPlates(35);
    expect(result.plates).toEqual([
      { size: 5, count: 1 },
      { size: 2.5, count: 1 },
    ]);
    expect(result.loadedKg).toBe(35);
  });

  it("returns an empty stack and the bar alone when weight is at or below the bar", () => {
    for (const weight of [20, 15]) {
      const result = loadPlates(weight);
      expect(result.plates).toEqual([]);
      expect(result.loadedKg).toBe(20);
    }
  });

  it("drops the sub-plate remainder and reports an honest loaded weight (58 → 57)", () => {
    const result = loadPlates(58);
    expect(result.plates.at(-1)).toEqual({ size: 1, count: 1 });
    expect(result.loadedKg).toBe(57);
  });

  it("caps each plate size at 4 per side and reports the real loaded weight", () => {
    const result = loadPlates(700);
    expect(result.plates.every((p) => p.count <= 4)).toBe(true);
    expect(result.loadedKg).toBe(328);
  });

  it("honors a custom bar weight", () => {
    const result = loadPlates(75, 15);
    expect(result.loadedKg).toBe(75);
    expect(result.barKg).toBe(15);
  });

  it("keeps plate sizes to the known set, sorted descending", () => {
    const result = loadPlates(180);
    for (const p of result.plates) {
      expect(PLATE_SIZES).toContain(p.size);
    }
    expect(BAR_KG).toBe(20);
  });
});