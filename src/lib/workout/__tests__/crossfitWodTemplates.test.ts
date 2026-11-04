import { describe, it, expect } from "vitest";
import {
  CROSSFIT_WOD_TEMPLATES,
  instantiateTemplate,
} from "../crossfitWodTemplates";
import { validateWorkout } from "../validateWorkout";
import { EXERCISE_CATALOG } from "../exerciseCatalog";
import { CROSSFIT_CATALOG } from "../exerciseCatalogCrossfit";
import { WEIGHTLIFTING_CATALOG } from "../exerciseCatalogWeightlifting";

const CATALOG_NAMES = new Set(
  [...EXERCISE_CATALOG, ...CROSSFIT_CATALOG, ...WEIGHTLIFTING_CATALOG].map(
    (entry) => entry.name,
  ),
);

describe("CROSSFIT_WOD_TEMPLATES", () => {
  it("keeps the 10 classics in order", () => {
    expect(CROSSFIT_WOD_TEMPLATES.map((t) => t.name)).toEqual([
      "Fran",
      "Cindy",
      "Annie",
      "Helen",
      "Grace",
      "Isabel",
      "DT",
      "Murph",
      "Fight Gone Bad",
      "Kelly",
    ]);
  });

  it("validates every template clean (zero errors)", () => {
    for (const template of CROSSFIT_WOD_TEMPLATES) {
      const workout = instantiateTemplate(template);
      expect(validateWorkout(workout), template.name).toEqual([]);
    }
  });

  it("only uses exercise names that exist in the catalogs", () => {
    for (const template of CROSSFIT_WOD_TEMPLATES) {
      for (const block of template.blocks) {
        for (const exercise of block.exercises) {
          expect(
            CATALOG_NAMES.has(exercise.name),
            `${template.name}: ${exercise.name}`,
          ).toBe(true);
        }
      }
    }
  });

  it("gives every template a non-empty Spanish description", () => {
    for (const template of CROSSFIT_WOD_TEMPLATES) {
      expect(template.description.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("instantiateTemplate", () => {
  it("produces a unique id per instantiation", () => {
    const template = CROSSFIT_WOD_TEMPLATES[0];
    const first = instantiateTemplate(template);
    const second = instantiateTemplate(template);
    expect(first.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
  });

  it("does not alias blocks with the template", () => {
    const template = CROSSFIT_WOD_TEMPLATES[0];
    const workout = instantiateTemplate(template);
    expect(workout.blocks).not.toBe(template.blocks);
    expect(workout.blocks[0]).not.toBe(template.blocks[0]);
    expect(workout.blocks[0].exercises).not.toBe(template.blocks[0].exercises);
    expect(workout.blocks[0].exercises[0]).not.toBe(
      template.blocks[0].exercises[0],
    );

    workout.blocks[0].exercises[0].weightKg = 999;
    workout.blocks[0].durationSeconds = 1;
    expect(template.blocks[0].exercises[0].weightKg).toBe(43);
    expect(template.blocks[0].durationSeconds).toBe(300);
  });

  it("copies name/description and stamps createdAt/favorite", () => {
    const template = CROSSFIT_WOD_TEMPLATES[1];
    const workout = instantiateTemplate(template);
    expect(workout.name).toBe(template.name);
    expect(workout.description).toBe(template.description);
    expect(workout.favorite).toBe(false);
    expect(workout.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
