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

  it("self-corrects status to finished via getState() alone, without waiting for a tick callback", () => {
    const engine = new TimerEngine("countdown", 5000);
    engine.start();
    // Simulate a throttled/backgrounded tab: the system clock jumps past
    // durationMs but no interval tick ever fires (no advanceTimersByTime).
    vi.setSystemTime(new Date("2026-01-01T00:00:06.000Z"));
    const state = engine.getState();
    expect(state.status).toBe("finished");
    expect(state.remainingMs).toBe(0);
  });

  it("notifies subscribers when getState() alone discovers the finished transition", () => {
    const engine = new TimerEngine("countdown", 5000);
    const listener = vi.fn();
    engine.start();
    engine.subscribe(listener);
    listener.mockClear();

    // Simulate a throttled/backgrounded tab: jump the system clock past
    // durationMs but never fire an interval tick (no advanceTimersByTime).
    // Only a direct getState() call should discover the transition.
    vi.setSystemTime(new Date("2026-01-01T00:00:06.000Z"));
    const state = engine.getState();

    expect(state.status).toBe("finished");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].status).toBe("finished");
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

describe("TimerEngine — hydrate (remote sync)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adopts a running remote snapshot and keeps ticking locally", () => {
    const local = new TimerEngine("countdown", 10_000);
    const referenceMs = Date.now();
    local.hydrate(
      { mode: "countdown", status: "running", durationMs: 10_000, elapsedMs: 3000, remainingMs: 7000 },
      referenceMs,
    );
    expect(local.getState().status).toBe("running");
    expect(local.getState().remainingMs).toBe(7000);

    // Keeps counting down on its own after hydration, no further snapshots.
    vi.advanceTimersByTime(2000);
    expect(local.getState().remainingMs).toBe(5000);
  });

  it("folds in network/processing lag so a running timer doesn't rewind", () => {
    const local = new TimerEngine("countdown", 10_000);
    const referenceMs = Date.now();
    // The snapshot took 500ms to arrive.
    vi.setSystemTime(new Date("2026-01-01T00:00:00.500Z"));
    local.hydrate(
      { mode: "countdown", status: "running", durationMs: 10_000, elapsedMs: 3000, remainingMs: 7000 },
      referenceMs,
    );
    expect(local.getState().remainingMs).toBe(6500);
  });

  it("adopts a paused remote snapshot and freezes at that remaining time", () => {
    const local = new TimerEngine("countdown", 10_000);
    local.start();
    vi.setSystemTime(new Date("2026-01-01T00:00:04.000Z"));
    const referenceMs = Date.now();
    local.hydrate(
      { mode: "countdown", status: "paused", durationMs: 10_000, elapsedMs: 3000, remainingMs: 7000 },
      referenceMs,
    );
    expect(local.getState().status).toBe("paused");
    vi.advanceTimersByTime(5000);
    expect(local.getState().remainingMs).toBe(7000);
  });

  it("self-corrects to finished if time elapses past duration after hydration with no further ticks", () => {
    const local = new TimerEngine("countdown", 5000);
    const referenceMs = Date.now();
    local.hydrate(
      { mode: "countdown", status: "running", durationMs: 5000, elapsedMs: 4900, remainingMs: 100 },
      referenceMs,
    );
    // Simulate the receiving tab itself getting backgrounded right after
    // hydration: the clock jumps past durationMs with no intervening tick.
    vi.setSystemTime(new Date("2026-01-01T00:00:03.000Z"));
    const state = local.getState();
    expect(state.status).toBe("finished");
    expect(state.remainingMs).toBe(0);
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
