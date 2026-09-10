import { describe, it, expect, beforeEach } from "vitest";
import { GymProfileRepository } from "../GymProfileRepository";

describe("GymProfileRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to an empty name when nothing is stored", () => {
    const repo = new GymProfileRepository();
    const result = repo.get();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ name: "" });
  });

  it("persists a profile with name and videoUrl", () => {
    const repo = new GymProfileRepository();
    const saveResult = repo.save({ name: "Box del Sur", videoUrl: "/videos/box.mp4" });
    expect(saveResult.ok).toBe(true);
    const result = new GymProfileRepository().get();
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value).toEqual({ name: "Box del Sur", videoUrl: "/videos/box.mp4" });
  });

  it("strips undefined videoUrl from stored JSON", () => {
    const repo = new GymProfileRepository();
    repo.save({ name: "CrossFit Norte" });
    const raw = window.localStorage.getItem("gymtimer.gymProfile");
    expect(raw).toBe(JSON.stringify({ name: "CrossFit Norte" }));
  });

  it("tolerates a stored profile with extra fields and returns only known ones", () => {
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Gym X", videoUrl: "/v.mp4", extra: "ignored" })
    );
    const repo = new GymProfileRepository();
    const result = repo.get();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ name: "Gym X", videoUrl: "/v.mp4" });
  });

  it("corrupt JSON returns read_failed", () => {
    window.localStorage.setItem("gymtimer.gymProfile", "{ not json");
    const repo = new GymProfileRepository();
    const result = repo.get();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("read_failed");
  });
});