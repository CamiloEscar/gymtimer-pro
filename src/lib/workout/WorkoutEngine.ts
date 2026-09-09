import { TimerEngine } from "@/lib/timer/TimerEngine";
import { AudioManager } from "@/lib/audio/AudioManager";
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
  // FGB: which station within the current round is active. Surfaced via
  // SessionState.currentExerciseIndex (always 0 for non-FGB blocks).
  private currentStationIndex = 0;
  // RM: running rep tally the trainer nudges with addRep()/removeRep().
  // Surfaced via SessionState.accumulatedReps.
  private accumulatedReps = 0;
  // Optional audio sink for transition cues (FGB station change, EMOM/OTM
  // round change, RM rep +1). null = no audio (tests that don't care;
  // production pages pass a shared AudioManager so unlock() applies).
  private readonly audio: AudioManager | null;

  constructor(workout: Workout, audio: AudioManager | null = null) {
    this.workout = workout;
    this.audio = audio;
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
    this.currentStationIndex = 0;
    this.accumulatedReps = 0;
    this.status = "ready";
    this.timer = this.buildTimerForCurrentPhase();
    this.unsubscribeTimer = this.timer.subscribe(() => this.onTimerTick());
    this.notify();
  }

  nextRound(): void {
    const block = this.currentBlock();
    if (block.type === "fightGoneBad") {
      this.advanceFgbRound();
      return;
    }
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
    this.currentStationIndex = remote.currentExerciseIndex;
    if (typeof remote.accumulatedReps === "number") {
      this.accumulatedReps = remote.accumulatedReps;
    }
    this.timer.hydrate(remote.timer, referenceTimestampMs);
    this.notify();
  }

  subtractTime(ms: number): void {
    this.timer.subtractTime(ms);
  }

  addRep(): void {
    if (this.currentBlock().type !== "rm") return;
    this.accumulatedReps += 1;
    this.audio?.playCountdownBeep();
    this.notify();
  }

  removeRep(): void {
    if (this.currentBlock().type !== "rm") return;
    if (this.accumulatedReps <= 0) return;
    this.accumulatedReps -= 1;
    this.notify();
  }

  getState(): SessionState {
    const timerState = this.syncTimerState();
    const block = this.currentBlock();
    const isRepCountingBlock = block.type === "rm";
    return {
      code: "",
      workout: this.workout,
      status: this.status,
      currentBlockIndex: this.blockIndex,
      currentRound: this.round,
      totalRounds: block.rounds ?? 1,
      currentPhase: this.phase,
      currentExerciseIndex: this.currentStationIndex,
      ...(isRepCountingBlock ? { accumulatedReps: this.accumulatedReps } : {}),
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
      this.advanceRoundBlock(block);
      return;
    }

    if (block.type === "emom" || block.type === "otm") {
      this.advanceIntervalCyclingBlock(block);
      return;
    }

    if (block.type === "fightGoneBad") {
      this.advanceFgb(block);
      return;
    }

    // amrap / countdown / countup / rm / forTime / rest: single duration, then finish.
    this.finish();
  }

  private advanceRoundBlock(block: WorkoutBlock): void {
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

  /**
   * EMOM/OTM: each round is work → rest (if rest > 0) → wait (if
   * intervalSeconds leaves leftover time) → next round. If intervalSeconds
   * is not set, work + rest defines the round length with no wait.
   */
  private advanceIntervalCyclingBlock(block: WorkoutBlock): void {
    const totalRounds = block.rounds ?? 1;
    const workSec = block.workSeconds ?? 0;
    const restSec = block.restSeconds ?? 0;
    const intervalSec = block.intervalSeconds;

    if (this.phase === "work") {
      if (restSec > 0) {
        this.phase = "rest";
        this.replaceTimer("rest");
        this.timer.start();
        return;
      }
      // No rest phase: jump straight from work into the optional wait fill.
      this.advanceAfterRest(totalRounds, workSec, restSec, intervalSec);
      return;
    }

    if (this.phase === "rest") {
      this.advanceAfterRest(totalRounds, workSec, restSec, intervalSec);
      return;
    }

    if (this.phase === "wait") {
      this.advanceRoundOrFinish(totalRounds);
    }
  }

  private advanceAfterRest(
    totalRounds: number,
    workSec: number,
    restSec: number,
    intervalSec: number | undefined
  ): void {
    const waitSec = intervalSec !== undefined ? Math.max(0, intervalSec - workSec - restSec) : 0;
    if (waitSec > 0) {
      this.phase = "wait";
      this.replaceTimerWithDuration(waitSec);
      this.timer.start();
      return;
    }
    this.advanceRoundOrFinish(totalRounds);
  }

  /**
   * FGB: nested loop. On a station finishing, either advance to the next
   * station in the current round or, when the round is done, rest between
   * rounds. The "rest between rounds" is itself a normal rest phase whose
   * end is the trigger to roll over to round+1, station 0.
   */
  private advanceFgb(block: WorkoutBlock): void {
    const stations = block.exercises;
    if (stations.length === 0) {
      this.finish();
      return;
    }
    const totalRounds = block.rounds ?? 1;
    const stationSec = block.stationSeconds ?? 0;
    const roundRestSec = block.roundRestSeconds ?? 0;

    if (this.phase === "work") {
      if (this.currentStationIndex + 1 < stations.length) {
        this.currentStationIndex += 1;
        this.replaceTimerWithDuration(stationSec);
        this.timer.start();
        this.audio?.playRoundChange();
        return;
      }
      // All stations in this round are done.
      if (this.round < totalRounds && roundRestSec > 0) {
        this.phase = "rest";
        this.replaceTimerWithDuration(roundRestSec);
        this.timer.start();
        return;
      }
      // No inter-round rest requested (or this was the last round) — jump
      // straight to the next round's first station or finish.
      if (this.round < totalRounds) {
        this.round += 1;
        this.currentStationIndex = 0;
        this.replaceTimerWithDuration(stationSec);
        this.timer.start();
        return;
      }
      this.finish();
      return;
    }

    if (this.phase === "rest") {
      this.round += 1;
      this.currentStationIndex = 0;
      this.phase = "work";
      this.replaceTimerWithDuration(stationSec);
      this.timer.start();
    }
  }

  private advanceFgbRound(): void {
    const block = this.currentBlock();
    if (block.type !== "fightGoneBad") return;
    const stations = block.exercises.length;
    const totalRounds = block.rounds ?? 1;
    if (this.round >= totalRounds && this.currentStationIndex + 1 >= stations) {
      this.finish();
      return;
    }
    if (this.currentStationIndex + 1 < stations) {
      this.currentStationIndex += 1;
    } else {
      this.round += 1;
      this.currentStationIndex = 0;
    }
    this.phase = "work";
    this.replaceTimerWithDuration(block.stationSeconds ?? 0);
    if (this.status === "running") this.timer.start();
    this.notify();
  }

  private advanceRoundOrFinish(totalRounds: number): void {
    if (this.round >= totalRounds) {
      this.finish();
      return;
    }
    this.round += 1;
    this.phase = "work";
    // EMOM/OTM cycling uses a per-round start bell so the trainer hears
    // each new interval; basic/interval/tabata keep silent here (their
    // cadence already has work→rest cues separately if needed).
    if (this.currentBlock().type === "emom" || this.currentBlock().type === "otm") {
      this.audio?.playRoundChange();
    }
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
    const block = this.currentBlock();
    const seconds =
      phase === "work" ? block.workSeconds ?? block.durationSeconds : block.restSeconds ?? 0;
    this.replaceTimerWithDuration(seconds);
  }

  private replaceTimerWithDuration(seconds: number): void {
    this.unsubscribeTimer();
    this.timer.destroy();
    this.timer = new TimerEngine("countdown", seconds * 1000);
    this.unsubscribeTimer = this.timer.subscribe(() => this.onTimerTick());
  }

  private buildTimerForCurrentPhase(): TimerEngine {
    const block = this.currentBlock();
    if (block.type === "countup" || block.type === "forTime") {
      return new TimerEngine("countup", 0);
    }
    if (
      block.type === "interval" ||
      block.type === "tabata" ||
      block.type === "basic" ||
      block.type === "emom" ||
      block.type === "otm"
    ) {
      return new TimerEngine("countdown", (block.workSeconds ?? 0) * 1000);
    }
    if (block.type === "fightGoneBad") {
      return new TimerEngine("countdown", (block.stationSeconds ?? 0) * 1000);
    }
    return new TimerEngine("countdown", block.durationSeconds * 1000);
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
