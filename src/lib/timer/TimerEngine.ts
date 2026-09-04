import type {
  TimerMode,
  TimerStatus,
  TimerState,
  TimerListener,
  Unsubscribe,
} from "@/types";

const TICK_INTERVAL_MS = 100;

export class TimerEngine {
  private mode: TimerMode;
  private durationMs: number;
  private status: TimerStatus = "idle";
  private startedAt: number | null = null;
  private accumulatedMs = 0;
  private listeners = new Set<TimerListener>();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(mode: TimerMode, durationMs: number) {
    this.mode = mode;
    this.durationMs = durationMs;
  }

  start(): void {
    if (this.status === "running") return;
    this.status = "running";
    this.startedAt = Date.now();
    this.startTicking();
    this.notify();
  }

  pause(): void {
    if (this.status !== "running") return;
    this.accumulatedMs = this.computeElapsedMs();
    this.startedAt = null;
    this.status = "paused";
    this.stopTicking();
    this.notify();
  }

  resume(): void {
    if (this.status !== "paused") return;
    this.status = "running";
    this.startedAt = Date.now();
    this.startTicking();
    this.notify();
  }

  reset(): void {
    this.stopTicking();
    this.status = "idle";
    this.startedAt = null;
    this.accumulatedMs = 0;
    this.notify();
  }

  addTime(ms: number): void {
    // Fold any elapsed time accrued while running into the accumulator
    // before adjusting it, then re-baseline `startedAt` to now so we
    // never double-count the running portion.
    this.accumulatedMs = this.computeElapsedMs() - ms;
    if (this.status === "running") {
      this.startedAt = Date.now();
    }
    this.notify();
  }

  subtractTime(ms: number): void {
    this.addTime(-ms);
  }

  getState(): TimerState {
    const elapsedMs = this.computeElapsedMs();
    const remainingMs =
      this.mode === "countdown" ? Math.max(0, this.durationMs - elapsedMs) : 0;
    return {
      mode: this.mode,
      status: this.status,
      durationMs: this.durationMs,
      elapsedMs,
      remainingMs,
    };
  }

  subscribe(listener: TimerListener): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.stopTicking();
    this.listeners.clear();
  }

  private computeElapsedMs(): number {
    const runningMs =
      this.status === "running" && this.startedAt !== null
        ? Date.now() - this.startedAt
        : 0;
    return this.accumulatedMs + runningMs;
  }

  private startTicking(): void {
    this.stopTicking();
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  private stopTicking(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    if (this.status !== "running") return;
    if (this.mode === "countdown" && this.computeElapsedMs() >= this.durationMs) {
      this.accumulatedMs = this.durationMs;
      this.startedAt = null;
      this.status = "finished";
      this.stopTicking();
    }
    this.notify();
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
