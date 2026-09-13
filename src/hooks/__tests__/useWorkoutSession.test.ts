import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWorkoutSession } from "../useWorkoutSession";
import { WorkoutEngine } from "@/lib/workout/WorkoutEngine";
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
    window.localStorage.clear();
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
    expect(result.current.state.currentPhase).toBe("getReady");
  });

  it("re-renders as time passes", () => {
    const { result } = renderHook(() => useWorkoutSession(workout));
    act(() => result.current.start());
    // 3s getReady countdown then 3s of the 10s AMRAP work phase.
    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    expect(result.current.state.timer.remainingMs).toBe(7_000);
  });

  it("starts fresh when no snapshot was saved", () => {
    const { result } = renderHook(() => useWorkoutSession(workout));
    expect(result.current.state.status).toBe("ready");
    // Fresh engine: the 10s AMRAP timer is full, no 3s getReady countdown.
    expect(result.current.state.timer.remainingMs).toBe(10_000);
  });

  it("resumes from a saved running snapshot instead of resetting", () => {
    const engine = new WorkoutEngine(workout);
    engine.start();
    window.localStorage.setItem(
      `gymtimer.sessionState.${workout.id}`,
      JSON.stringify({ state: engine.getState(), savedAt: Date.now() })
    );
    engine.destroy();

    const { result } = renderHook(() => useWorkoutSession(workout));
    expect(result.current.state.status).toBe("running");
    expect(result.current.state.currentPhase).toBe("getReady");
    // In the 3s getReady countdown, NOT the fresh full 10s timer a
    // reset/rebuild would show.
    expect(result.current.state.timer.remainingMs).toBeLessThan(10_000);
  });

  it("ignores a saved snapshot for a different workout", () => {
    const other = { ...workout, id: "w2" };
    const engine = new WorkoutEngine(other);
    engine.start();
    window.localStorage.setItem(
      `gymtimer.sessionState.${other.id}`,
      JSON.stringify({ state: engine.getState(), savedAt: Date.now() })
    );
    engine.destroy();

    const { result } = renderHook(() => useWorkoutSession(workout));
    expect(result.current.state.status).toBe("ready");
  });

  it("falls back to a fresh engine when the saved snapshot is corrupt", () => {
    window.localStorage.setItem(`gymtimer.sessionState.${workout.id}`, "{corrupt");
    const { result } = renderHook(() => useWorkoutSession(workout));
    expect(result.current.state.status).toBe("ready");
  });

  it("falls back to fresh when a saved snapshot is stale (points at a missing block)", () => {
    const stale = {
      ...new WorkoutEngine(workout).getState(),
      currentBlockIndex: 99,
    };
    window.localStorage.setItem(
      `gymtimer.sessionState.${workout.id}`,
      JSON.stringify({ state: stale, savedAt: Date.now() })
    );
    const { result } = renderHook(() => useWorkoutSession(workout));
    expect(result.current.state.status).toBe("ready");
  });
});
