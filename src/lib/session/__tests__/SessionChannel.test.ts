import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SessionChannel } from "../SessionChannel";
import type { SessionState } from "@/types";

const sampleState: SessionState = {
  code: "ABC123",
  workout: {
    id: "w1",
    name: "AMRAP 10",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [],
  },
  status: "running",
  currentBlockIndex: 0,
  currentRound: 1,
  totalRounds: 1,
  currentPhase: "work",
  currentExerciseIndex: 0,
  timer: {
    mode: "countdown",
    status: "running",
    durationMs: 10_000,
    elapsedMs: 0,
    remainingMs: 10_000,
  },
};

describe("SessionChannel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delivers state sent by the trainer to a display on the same code", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ABC123", "display");
    const received: SessionState[] = [];
    // Node/jsdom's BroadcastChannel delivers messages asynchronously via the
    // real event loop (not via a JS timer), so we must await the actual
    // delivery event rather than assert synchronously right after
    // sendState() -- see task-7-report.md for the empirical investigation.
    const delivered = new Promise<void>((resolve) => {
      display.onState((state) => {
        received.push(state);
        resolve();
      });
    });

    trainer.sendState(sampleState);
    await delivered;

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(sampleState);

    trainer.destroy();
    display.destroy();
  });

  it("does not deliver state across different codes", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ZZZ999", "display");
    const received: SessionState[] = [];
    display.onState((state) => received.push(state));

    trainer.sendState(sampleState);

    // There is no positive event to await here (display is on a different
    // code, so it should never fire). Briefly switch to real timers to give
    // the async BroadcastChannel delivery mechanism a genuine chance to
    // (incorrectly) deliver before we assert the negative.
    vi.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 100));
    vi.useFakeTimers();

    expect(received).toHaveLength(0);

    trainer.destroy();
    display.destroy();
  });

  it("reports 'connected' after receiving a message, 'disconnected' after 5s of silence", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ABC123", "display");
    const statuses: string[] = [];
    const connected = new Promise<void>((resolve) => {
      display.onConnectionStatusChange((status) => {
        statuses.push(status);
        if (status === "connected") resolve();
      });
    });

    trainer.sendState(sampleState);
    await connected;
    expect(display.getConnectionStatus()).toBe("connected");

    await vi.advanceTimersByTimeAsync(5100);
    expect(display.getConnectionStatus()).toBe("disconnected");
    expect(statuses).toContain("disconnected");

    trainer.destroy();
    display.destroy();
  });
});
