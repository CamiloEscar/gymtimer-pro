import { describe, it, expect, beforeEach } from "vitest";
import { WorkoutHistoryRepository } from "../WorkoutHistoryRepository";

describe("WorkoutHistoryRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with an empty list", () => {
    const repo = new WorkoutHistoryRepository();
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([]);
  });

  it("records an entry and assigns it an id", () => {
    const repo = new WorkoutHistoryRepository();
    const result = repo.record({
      workoutId: "w1",
      workoutName: "Murph",
      completedAt: "2026-01-01T10:00:00.000Z",
      durationMs: 600_000,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBeTruthy();
      expect(result.value.workoutName).toBe("Murph");
    }
  });

  it("persists recorded entries across repository instances", () => {
    new WorkoutHistoryRepository().record({
      workoutId: "w1",
      workoutName: "Murph",
      completedAt: "2026-01-01T10:00:00.000Z",
      durationMs: 600_000,
    });
    const result = new WorkoutHistoryRepository().list();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });

  it("appends rather than overwriting existing entries", () => {
    const repo = new WorkoutHistoryRepository();
    repo.record({ workoutId: "w1", workoutName: "Murph", completedAt: "2026-01-01T10:00:00.000Z", durationMs: 1000 });
    repo.record({ workoutId: "w2", workoutName: "Fran", completedAt: "2026-01-02T10:00:00.000Z", durationMs: 2000 });
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(2);
  });

  it("preserves the optional reps tally when an RM block was the last block", () => {
    const repo = new WorkoutHistoryRepository();
    const result = repo.record({
      workoutId: "w1",
      workoutName: "Push Press RM",
      completedAt: "2026-01-01T10:00:00.000Z",
      durationMs: 120_000,
      reps: 17,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.reps).toBe(17);

    const list = repo.list();
    expect(list.ok).toBe(true);
    if (list.ok) expect(list.value[0].reps).toBe(17);
  });

  it("persists entries without a reps field (workouts with no RM block last)", () => {
    const repo = new WorkoutHistoryRepository();
    repo.record({
      workoutId: "w1",
      workoutName: "Fran",
      completedAt: "2026-01-01T10:00:00.000Z",
      durationMs: 240_000,
    });
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) {
      const [entry] = result.value;
      expect(entry.reps).toBeUndefined();
    }
  });

  it("records reps=0 when the trainer finished an RM block but never tapped +1", () => {
    const repo = new WorkoutHistoryRepository();
    repo.record({
      workoutId: "w1",
      workoutName: "Push Press RM",
      completedAt: "2026-01-01T10:00:00.000Z",
      durationMs: 120_000,
      reps: 0,
    });
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value[0].reps).toBe(0);
  });
});
