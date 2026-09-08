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

  /**
   * Re-anchor this engine to a snapshot produced by a remote TimerEngine
   * (e.g. received over Pusher), so it can keep ticking locally and stay
   * self-correcting even if no further snapshots arrive for a while — the
   * scenario that matters is the sender's tab getting backgrounded/locked
   * and its setInterval throttling to a halt. `referenceTimestampMs` is the
   * sender's Date.now() at the moment `remote` was captured; the gap between
   * that and our own Date.now() (network + processing lag) is folded into
   * the accumulated time so a running timer doesn't visibly rewind.
   */
  hydrate(remote: TimerState, referenceTimestampMs: number): void {
    this.stopTicking();
    this.mode = remote.mode;
    this.durationMs = remote.durationMs;
    this.status = remote.status;
    const staleMs = remote.status === "running" ? Math.max(0, Date.now() - referenceTimestampMs) : 0;
    this.accumulatedMs = remote.elapsedMs + staleMs;
    if (remote.status === "running") {
      this.startedAt = Date.now();
      this.startTicking();
    } else {
      this.startedAt = null;
    }
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
    const didTransition = this.checkFinished();
    const elapsedMs = this.computeElapsedMs();
    const remainingMs =
      this.mode === "countdown" ? Math.max(0, this.durationMs - elapsedMs) : 0;
    const state: TimerState = {
      mode: this.mode,
      status: this.status,
      durationMs: this.durationMs,
      elapsedMs,
      remainingMs,
    };
    // If this call is the one that just discovered the running -> finished
    // transition (e.g. a subscriber-driven getState() poll after tick()'s
    // setInterval was throttled/backgrounded), push it to subscribers now.
    // Safe from infinite recursion: notify() -> getState() -> checkFinished()
    // re-enters here, but by then this.status is already "finished", so
    // checkFinished()'s own `status === "running"` guard makes that inner
    // call a no-op (didTransition = false) and the recursion stops after
    // exactly one extra level.
    if (didTransition) {
      this.notify();
    }
    return state;
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
    this.checkFinished();
    this.notify();
  }

  /**
   * Self-correcting transition: if a countdown has elapsed past its
   * duration (per Date.now()-derived elapsed time), flip status to
   * "finished" regardless of whether the interval callback has fired
   * yet. Called from both tick() and getState() so a throttled/backgrounded
   * tab that delays setInterval callbacks can never leave the reported
   * status stale relative to remainingMs.
   */
  private checkFinished(): boolean {
    if (this.status !== "running") return false;
    if (this.mode === "countdown" && this.computeElapsedMs() >= this.durationMs) {
      this.accumulatedMs = this.durationMs;
      this.startedAt = null;
      this.status = "finished";
      this.stopTicking();
      return true;
    }
    return false;
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
