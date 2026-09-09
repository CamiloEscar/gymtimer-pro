import { describe, it, expect } from "vitest";
import { computeHistoryStats } from "../computeHistoryStats";
import type { WorkoutHistoryEntry } from "@/types";

function entry(completedAt: string, durationMs = 60_000): WorkoutHistoryEntry {
  return { id: crypto.randomUUID(), workoutId: "w1", workoutName: "Murph", completedAt, durationMs };
}

describe("computeHistoryStats", () => {
  it("returns zeros for an empty history", () => {
    const stats = computeHistoryStats([]);
    expect(stats).toEqual({ sessionsThisWeek: 0, streakDays: 0, totalTimeMs: 0 });
  });

  it("sums totalTimeMs across all entries regardless of date", () => {
    const entries = [entry("2026-01-01T10:00:00.000Z", 1000), entry("2020-06-15T10:00:00.000Z", 2000)];
    expect(computeHistoryStats(entries).totalTimeMs).toBe(3000);
  });

  it("counts sessionsThisWeek only within the current Mon-Sun week", () => {
    // 2026-01-08 is a Thursday.
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [
      entry("2026-01-05T09:00:00.000Z"), // Monday same week
      entry("2026-01-08T09:00:00.000Z"), // Thursday same week
      entry("2026-01-04T09:00:00.000Z"), // Sunday, previous week
      entry("2026-01-12T09:00:00.000Z"), // Monday, next week
    ];
    expect(computeHistoryStats(entries, now).sessionsThisWeek).toBe(2);
  });

  it("computes a streak of 1 for a single session today", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    expect(computeHistoryStats([entry("2026-01-08T09:00:00.000Z")], now).streakDays).toBe(1);
  });

  it("computes a streak across consecutive days", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [
      entry("2026-01-08T09:00:00.000Z"),
      entry("2026-01-07T09:00:00.000Z"),
      entry("2026-01-06T09:00:00.000Z"),
    ];
    expect(computeHistoryStats(entries, now).streakDays).toBe(3);
  });

  it("breaks the streak on a gap day", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [
      entry("2026-01-08T09:00:00.000Z"),
      entry("2026-01-06T09:00:00.000Z"), // gap: missing Jan 7
    ];
    expect(computeHistoryStats(entries, now).streakDays).toBe(1);
  });

  it("counts multiple sessions on the same day as a single streak day", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [
      entry("2026-01-08T09:00:00.000Z"),
      entry("2026-01-08T18:00:00.000Z"),
      entry("2026-01-07T09:00:00.000Z"),
    ];
    expect(computeHistoryStats(entries, now).streakDays).toBe(2);
  });

  it("still counts a streak ending yesterday even with no session today", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [entry("2026-01-07T09:00:00.000Z"), entry("2026-01-06T09:00:00.000Z")];
    expect(computeHistoryStats(entries, now).streakDays).toBe(2);
  });

  it("resets the streak to 0 if the most recent session was more than a day ago", () => {
    const now = new Date("2026-01-08T12:00:00.000Z");
    const entries = [entry("2026-01-05T09:00:00.000Z")];
    expect(computeHistoryStats(entries, now).streakDays).toBe(0);
  });
});
