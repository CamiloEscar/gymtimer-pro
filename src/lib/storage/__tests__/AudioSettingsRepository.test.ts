import { describe, it, expect, beforeEach } from "vitest";
import { AudioSettingsRepository } from "../AudioSettingsRepository";

describe("AudioSettingsRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns defaults when nothing is stored", () => {
    const result = new AudioSettingsRepository().get();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ volume: 0.5, soundEnabled: true, voiceEnabled: false });
  });

  it("round-trips saved settings", () => {
    const repo = new AudioSettingsRepository();
    const settings = { volume: 0.15, soundEnabled: false, voiceEnabled: true };
    const saved = repo.save(settings);
    expect(saved.ok).toBe(true);
    const got = repo.get();
    expect(got.ok).toBe(true);
    if (!got.ok) return;
    expect(got.value).toEqual(settings);
  });

  it("fills missing fields with defaults (forward-compatible partial data)", () => {
    window.localStorage.setItem("gymtimer.audioSettings", JSON.stringify({ volume: 0.7 }));
    const result = new AudioSettingsRepository().get();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ volume: 0.7, soundEnabled: true, voiceEnabled: false });
  });

  it("falls back to defaults on corrupt JSON", () => {
    window.localStorage.setItem("gymtimer.audioSettings", "{not-json");
    const result = new AudioSettingsRepository().get();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ volume: 0.5, soundEnabled: true, voiceEnabled: false });
  });
});