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

  it("persists a profile with name and logoUrl", () => {
    const repo = new GymProfileRepository();
    const saveResult = repo.save({ name: "Box del Sur", logoUrl: "/logos/box.png" });
    expect(saveResult.ok).toBe(true);
    const result = new GymProfileRepository().get();
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value).toEqual({ name: "Box del Sur", logoUrl: "/logos/box.png" });
  });

  it("strips undefined logoUrl and linkCode from stored JSON", () => {
    const repo = new GymProfileRepository();
    repo.save({ name: "CrossFit Norte" });
    const raw = window.localStorage.getItem("gymtimer.gymProfile");
    expect(raw).toBe(JSON.stringify({ name: "CrossFit Norte" }));
  });

  it("persists and round-trips a configured linkCode (uppercased, trimmed)", () => {
    const repo = new GymProfileRepository();
    const saveResult = repo.save({ name: "Box del Sur", linkCode: "  boxsur " });
    expect(saveResult.ok).toBe(true);
    if (saveResult.ok) expect(saveResult.value.linkCode).toBe("BOXSUR");
    const result = new GymProfileRepository().get();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.linkCode).toBe("BOXSUR");
  });

  it("drops empty/whitespace linkCode when saving", () => {
    const repo = new GymProfileRepository();
    repo.save({ name: "Box", linkCode: "   " });
    const raw = window.localStorage.getItem("gymtimer.gymProfile");
    expect(raw).toBe(JSON.stringify({ name: "Box" }));
  });

  it("tolerates a stored profile with extra fields and returns only known ones", () => {
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Gym X", logoUrl: "/l.png", extra: "ignored" })
    );
    const repo = new GymProfileRepository();
    const result = repo.get();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ name: "Gym X", logoUrl: "/l.png" });
  });

  it("reads a stored linkCode", () => {
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Gym X", linkCode: "abcd" })
    );
    const repo = new GymProfileRepository();
    const result = repo.get();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ name: "Gym X", linkCode: "ABCD" });
  });

  it("ignores a non-string linkCode in storage", () => {
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Gym X", linkCode: 12345 })
    );
    const repo = new GymProfileRepository();
    const result = repo.get();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ name: "Gym X" });
  });

  it("corrupt JSON returns read_failed", () => {
    window.localStorage.setItem("gymtimer.gymProfile", "{ not json");
    const repo = new GymProfileRepository();
    const result = repo.get();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("read_failed");
  });
});