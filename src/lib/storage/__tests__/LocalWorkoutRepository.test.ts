import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalWorkoutRepository } from "../LocalWorkoutRepository";
import type { Workout } from "@/types";

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: overrides.id ?? "w1",
    name: overrides.name ?? "AMRAP 10",
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
    favorite: overrides.favorite ?? false,
    blocks: overrides.blocks ?? [],
    ...overrides,
  };
}

describe("LocalWorkoutRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty list when nothing is saved", () => {
    const repo = new LocalWorkoutRepository();
    const result = repo.list();
    expect(result).toEqual({ ok: true, value: [] });
  });

  it("saves and retrieves a workout", () => {
    const repo = new LocalWorkoutRepository();
    const workout = makeWorkout();
    repo.save(workout);
    const result = repo.get("w1");
    expect(result).toEqual({ ok: true, value: workout });
  });

  it("lists all saved workouts", () => {
    const repo = new LocalWorkoutRepository();
    repo.save(makeWorkout({ id: "w1" }));
    repo.save(makeWorkout({ id: "w2", name: "EMOM 10" }));
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
    }
  });

  it("deletes a workout", () => {
    const repo = new LocalWorkoutRepository();
    repo.save(makeWorkout({ id: "w1" }));
    repo.delete("w1");
    const result = repo.get("w1");
    expect(result).toEqual({ ok: true, value: null });
  });

  it("duplicates a workout with a new id and '(copy)' suffix", () => {
    const repo = new LocalWorkoutRepository();
    repo.save(makeWorkout({ id: "w1", name: "Fran" }));
    const result = repo.duplicate("w1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).not.toBe("w1");
      expect(result.value.name).toBe("Fran (copy)");
    }
    const listResult = repo.list();
    expect(listResult.ok && listResult.value).toHaveLength(2);
  });

  it("returns an error Result instead of throwing when localStorage is unavailable", () => {
    const repo = new LocalWorkoutRepository();
    const spy = vi
      .spyOn(window.localStorage.__proto__, "setItem")
      .mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

    const result = repo.save(makeWorkout());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("write_failed");
    }

    spy.mockRestore();
  });
});
