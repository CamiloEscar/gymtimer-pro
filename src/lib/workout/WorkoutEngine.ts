import { TimerEngine } from "@/lib/timer/TimerEngine";
import type {
  SessionState,
  SessionStatus,
  Workout,
  WorkoutBlock,
  WorkoutPhase,
} from "@/types";

type Listener = (state: SessionState) => void;

export class WorkoutEngine {
  private workout: Workout;
  private status: SessionStatus = "ready";
  private blockIndex = 0;
  private round = 1;
  private phase: WorkoutPhase = "getReady";
  private timer: TimerEngine;
  private listeners = new Set<Listener>();
  private unsubscribeTimer: () => void;

  constructor(workout: Workout) {
    this.workout = workout;
    this.timer = this.buildTimerForCurrentPhase();
    this.unsubscribeTimer = this.timer.subscribe(() => this.onTimerTick());
  }

  start(): void {
    if (this.status === "running") return;
    this.status = "running";
    this.phase = "work";
    this.timer.start();
    this.notify();
  }

  pause(): void {
    this.timer.pause();
    this.status = "paused";
    this.notify();
  }

  resume(): void {
    this.status = "running";
    this.timer.resume();
    this.notify();
  }

  reset(): void {
    this.timer.destroy();
    this.blockIndex = 0;
    this.round = 1;
    this.phase = "getReady";
    this.status = "ready";
    this.timer = this.buildTimerForCurrentPhase();
    this.unsubscribeTimer = this.timer.subscribe(() => this.onTimerTick());
    this.notify();
  }

  nextRound(): void {
    const block = this.currentBlock();
    const totalRounds = block.rounds ?? 1;
    if (this.round >= totalRounds) {
      this.finish();
      return;
    }
    this.round += 1;
    this.phase = "work";
    this.replaceTimer("work");
    if (this.status === "running") this.timer.start();
    this.notify();
  }

  previousRound(): void {
    if (this.round <= 1) return;
    this.round -= 1;
    this.phase = "work";
    this.replaceTimer("work");
    if (this.status === "running") this.timer.start();
    this.notify();
  }

  skipBlock(): void {
    this.finish();
  }

  addTime(ms: number): void {
    this.timer.addTime(ms);
  }

  /**
   * Re-anchor this engine to a remote SessionState snapshot (e.g. received
   * over Pusher by a /display mirror), then let it keep advancing locally —
   * phase/round transitions included — using this same workout's block
   * definitions. `referenceTimestampMs` is the sender's Date.now() at
   * capture time, passed through to the inner TimerEngine.hydrate() so a
   * running timer accounts for network/processing lag instead of rewinding.
   *
   * this.timer.hydrate() below synchronously triggers onTimerTick() via the
   * timer's own subscription, so if the remote snapshot is already stale
   * enough to be finished, advancePhase()/finish() run as part of that call
   * and can overwrite the phase/status assigned here — same self-correcting
   * cascade the trainer's own local ticking already relies on.
   */
  hydrate(remote: SessionState, referenceTimestampMs: number): void {
    this.blockIndex = remote.currentBlockIndex;
    this.round = remote.currentRound;
    this.phase = remote.currentPhase;
    this.status = remote.status;
    this.timer.hydrate(remote.timer, referenceTimestampMs);
    this.notify();
  }

  subtractTime(ms: number): void {
    this.timer.subtractTime(ms);
  }

  getState(): SessionState {
    const timerState = this.syncTimerState();
    const block = this.currentBlock();
    return {
      code: "",
      workout: this.workout,
      status: this.status,
      currentBlockIndex: this.blockIndex,
      currentRound: this.round,
      totalRounds: block.rounds ?? 1,
      currentPhase: this.phase,
      currentExerciseIndex: 0,
      timer: timerState,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.unsubscribeTimer();
    this.timer.destroy();
    this.listeners.clear();
  }

  private currentBlock(): WorkoutBlock {
    return this.workout.blocks[this.blockIndex];
  }

  /**
   * Read the current timer's state, letting TimerEngine's self-correction
   * run first.
   *
   * TimerEngine.getState() can synchronously detect a stale "running"
   * timer that has actually elapsed past its duration (e.g. after a large
   * wall-clock jump with no intervening ticks) and, via its finished-notify,
   * drive WorkoutEngine.onTimerTick() -> advancePhase() -> replaceTimer(),
   * which reassigns `this.timer`/`this.phase` as a side effect *during*
   * that call. The snapshot returned by that first call still describes the
   * OLD (now-replaced) timer, taken before the swap. Re-reading
   * `this.timer.getState()` afterwards returns the swapped-in timer's fresh
   * state instead. Looped because a single query can legitimately cross
   * more than one phase boundary (e.g. a rest phase with restSeconds = 0,
   * or a jump spanning several rounds) — each iteration either advances the
   * round/phase or reaches the terminal "finished" phase, so this always
   * terminates.
   */
  private syncTimerState() {
    let state = this.timer.getState();
    while (state.status === "finished" && this.phase !== "finished") {
      state = this.timer.getState();
    }
    return state;
  }

  private onTimerTick(): void {
    const timerState = this.timer.getState();
    if (timerState.status === "finished") {
      this.advancePhase();
    }
    this.notify();
  }

  private advancePhase(): void {
    const block = this.currentBlock();

    if (block.type === "interval" || block.type === "tabata" || block.type === "basic") {
      const totalRounds = block.rounds ?? 1;
      if (this.phase === "work") {
        if (block.restSeconds && block.restSeconds > 0) {
          this.phase = "rest";
          this.replaceTimer("rest");
          this.timer.start();
          return;
        }
        this.advanceRoundOrFinish(totalRounds);
        return;
      }
      if (this.phase === "rest") {
        this.advanceRoundOrFinish(totalRounds);
        return;
      }
    }

    // amrap / countdown / countup / emom / forTime / rest: single duration, then finish.
    this.finish();
  }

  private advanceRoundOrFinish(totalRounds: number): void {
    if (this.round >= totalRounds) {
      this.finish();
      return;
    }
    this.round += 1;
    this.phase = "work";
    this.replaceTimer("work");
    this.timer.start();
  }

  private finish(): void {
    this.timer.pause();
    this.phase = "finished";
    this.status = "finished";
    this.notify();
  }

  private replaceTimer(phase: "work" | "rest"): void {
    this.unsubscribeTimer();
    this.timer.destroy();
    const block = this.currentBlock();
    const seconds =
      phase === "work" ? block.workSeconds ?? block.durationSeconds : block.restSeconds ?? 0;
    this.timer = new TimerEngine("countdown", seconds * 1000);
    this.unsubscribeTimer = this.timer.subscribe(() => this.onTimerTick());
  }

  private buildTimerForCurrentPhase(): TimerEngine {
    const block = this.currentBlock();
    if (block.type === "countup" || block.type === "forTime") {
      return new TimerEngine("countup", 0);
    }
    if (block.type === "interval" || block.type === "tabata" || block.type === "basic") {
      return new TimerEngine("countdown", (block.workSeconds ?? 0) * 1000);
    }
    return new TimerEngine("countdown", block.durationSeconds * 1000);
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
