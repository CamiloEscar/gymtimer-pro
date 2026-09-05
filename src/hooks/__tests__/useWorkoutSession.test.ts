import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWorkoutSession } from "../useWorkoutSession";
import type { Workout } from "@/types";

const workout: Workout = {
  id: "w1",
  name: "AMRAP 10",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [
    { id: "b1", type: "amrap", durationSeconds: 10, exercises: [{ id: "e1", name: "Push Ups" }] },
  ],
};

describe("useWorkoutSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("exposes ready state before start() is called", () => {
    const { result } = renderHook(() => useWorkoutSession(workout));
    expect(result.current.state.status).toBe("ready");
  });

  it("updates state when start() is called", () => {
    const { result } = renderHook(() => useWorkoutSession(workout));
    act(() => result.current.start());
    expect(result.current.state.status).toBe("running");
    expect(result.current.state.currentPhase).toBe("work");
  });

  it("re-renders as time passes", () => {
    const { result } = renderHook(() => useWorkoutSession(workout));
    act(() => result.current.start());
    // Deviation from brief: dropped the redundant vi.setSystemTime() call —
    // combining it with vi.advanceTimersByTime() for the same delta
    // double-counts elapsed time (see TimerEngine.test.ts / WorkoutEngine.test.ts
    // for the same fix). advanceTimersByTime alone is sufficient here.
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.state.timer.remainingMs).toBe(7000);
  });
});
