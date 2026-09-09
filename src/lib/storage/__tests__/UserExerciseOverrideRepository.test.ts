import { describe, it, expect, beforeEach } from "vitest";
import { UserExerciseOverrideRepository } from "../UserExerciseOverrideRepository";

describe("UserExerciseOverrideRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with an empty list", () => {
    const repo = new UserExerciseOverrideRepository();
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([]);
  });

  it("persists a saved override and lists it", () => {
    const repo = new UserExerciseOverrideRepository();
    repo.save({ exerciseId: "leg-01", name: "Sentadilla profunda" });
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([{ exerciseId: "leg-01", name: "Sentadilla profunda" }]);
  });

  it("upserts by exerciseId: saving the same exercise twice keeps one entry with the latest fields", () => {
    const repo = new UserExerciseOverrideRepository();
    repo.save({ exerciseId: "leg-01", name: "Sentadilla" });
    repo.save({ exerciseId: "leg-01", name: "Sentadilla profunda", videoUrl: "https://example.com/video.mp4" });
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toEqual({
        exerciseId: "leg-01",
        name: "Sentadilla profunda",
        videoUrl: "https://example.com/video.mp4",
      });
    }
  });

  it("strips undefined fields when saving", () => {
    const repo = new UserExerciseOverrideRepository();
    const result = repo.save({ exerciseId: "leg-01", name: undefined, videoUrl: "https://example.com/video.mp4" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ exerciseId: "leg-01", videoUrl: "https://example.com/video.mp4" });
    const list = repo.list();
    if (list.ok) expect(list.value).toEqual([{ exerciseId: "leg-01", videoUrl: "https://example.com/video.mp4" }]);
  });

  it("removes an override by exerciseId", () => {
    const repo = new UserExerciseOverrideRepository();
    repo.save({ exerciseId: "leg-01", name: "Sentadilla" });
    repo.save({ exerciseId: "leg-02", name: "Zancada" });
    const removeResult = repo.remove("leg-01");
    expect(removeResult.ok).toBe(true);
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.map((o) => o.exerciseId)).toEqual(["leg-02"]);
  });

  it("remove of a non-existent id is a no-op success", () => {
    const repo = new UserExerciseOverrideRepository();
    repo.save({ exerciseId: "leg-01", name: "Sentadilla" });
    const removeResult = repo.remove("does-not-exist");
    expect(removeResult.ok).toBe(true);
    const result = repo.list();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });

  it("returns read_failed on corrupt JSON", () => {
    window.localStorage.setItem("gymtimer.exerciseOverrides", JSON.stringify({ not: "an array" }));
    const repo = new UserExerciseOverrideRepository();
    const result = repo.list();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("read_failed");
  });
});