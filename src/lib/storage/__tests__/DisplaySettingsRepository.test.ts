import { describe, it, expect, beforeEach } from "vitest";
import { DisplaySettingsRepository } from "../DisplaySettingsRepository";

describe("DisplaySettingsRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to showVideoOnDisplay false", () => {
    const repo = new DisplaySettingsRepository();
    const result = repo.get();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ showVideoOnDisplay: false });
  });

  it("persists a saved setting and reads it back", () => {
    const repo = new DisplaySettingsRepository();
    const saveResult = repo.save({ showVideoOnDisplay: true });
    expect(saveResult.ok).toBe(true);
    const result = new DisplaySettingsRepository().get();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ showVideoOnDisplay: true });
  });

  it("corrupt JSON returns read_failed", () => {
    window.localStorage.setItem("gymtimer.displaySettings", "{ not json");
    const repo = new DisplaySettingsRepository();
    const result = repo.get();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("read_failed");
  });
});