import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TimerEngine } from "../TimerEngine";

describe("TimerEngine — countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle with full duration remaining", () => {
    const engine = new TimerEngine("countdown", 10_000);
    const state = engine.getState();
    expect(state.status).toBe("idle");
    expect(state.remainingMs).toBe(10_000);
    expect(state.elapsedMs).toBe(0);
  });

  it("counts down based on elapsed wall-clock time, not tick count", () => {
    const engine = new TimerEngine("countdown", 10_000);
    engine.start();
    // vi.advanceTimersByTime both advances the fake Date clock and fires
    // any interval ticks scheduled in that window. Do NOT also call
    // vi.setSystemTime for the same delta — Sinon's fake timers tie
    // Date.now() to the timer clock, so combining the two would
    // double-count the elapsed time (verified empirically).
    vi.advanceTimersByTime(3000);
    expect(engine.getState().remainingMs).toBe(7000);
  });

  it("reaches finished exactly at 0 and clamps there", () => {
    const engine = new TimerEngine("countdown", 5000);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:06.000Z"));
    vi.advanceTimersByTime(6000);
    const state = engine.getState();
    expect(state.status).toBe("finished");
    expect(state.remainingMs).toBe(0);
  });

  it("survives a simulated tab sleep: only wall-clock time matters", () => {
    const engine = new TimerEngine("countdown", 10_000);
    engine.start();
    // Simulate the tab being suspended for 4s with zero intervening ticks:
    // jump the system clock without calling advanceTimersByTime.
    vi.setSystemTime(new Date("2026-01-01T00:00:04.000Z"));
    expect(engine.getState().remainingMs).toBe(6000);
  });

  it("pause freezes remaining time; resume continues from there", () => {
    const engine = new TimerEngine("countdown", 10_000);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:03.000Z"));
    engine.pause();
    expect(engine.getState().status).toBe("paused");
    expect(engine.getState().remainingMs).toBe(7000);

    // Time passes while paused — must not count.
    vi.setSystemTime(new Date("2026-01-01T00:00:08.000Z"));
    expect(engine.getState().remainingMs).toBe(7000);

    engine.resume();
    vi.setSystemTime(new Date("2026-01-01T00:00:10.000Z"));
    expect(engine.getState().remainingMs).toBe(5000);
  });

  it("reset returns to idle at full duration", () => {
    const engine = new TimerEngine("countdown", 10_000);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:05.000Z"));
    engine.reset();
    const state = engine.getState();
    expect(state.status).toBe("idle");
    expect(state.remainingMs).toBe(10_000);
  });

  it("addTime extends remaining time; subtractTime reduces it", () => {
    const engine = new TimerEngine("countdown", 10_000);
    engine.start();
    engine.addTime(5000);
    expect(engine.getState().remainingMs).toBe(15_000);
    engine.subtractTime(3000);
    expect(engine.getState().remainingMs).toBe(12_000);
  });

  it("notifies subscribers on start/pause/resume/reset", () => {
    const engine = new TimerEngine("countdown", 10_000);
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);

    engine.start();
    expect(listener).toHaveBeenCalled();
    listener.mockClear();

    engine.pause();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    listener.mockClear();
    engine.resume();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("TimerEngine — count up", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("grows elapsedMs without a finish condition", () => {
    const engine = new TimerEngine("countup", 0);
    engine.start();
    vi.setSystemTime(new Date("2026-01-01T00:15:32.000Z"));
    const state = engine.getState();
    expect(state.status).toBe("running");
    expect(state.elapsedMs).toBe(15 * 60_000 + 32_000);
  });
});
