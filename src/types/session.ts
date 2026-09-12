import type { TimerState } from "./timer";
import type { Workout, WorkoutBlock } from "./workout";

export type SessionStatus = "waiting" | "ready" | "running" | "paused" | "finished";

export type WorkoutPhase = "getReady" | "work" | "rest" | "wait" | "finished";

export interface SessionVideoInfo {
  videoUrl: string;
  thumbnailUrl?: string;
}

export interface SessionState {
  code: string;
  workout: Workout;
  status: SessionStatus;
  currentBlockIndex: number;
  currentRound: number;
  totalRounds: number;
  currentPhase: WorkoutPhase;
  // For fightGoneBad this carries the current station index within the
  // current round; for every other block type it is 0.
  currentExerciseIndex: number;
  // Only meaningful for "rm" blocks: live count the trainer tallies with
  // +1/-1 during the run. undefined for non-RM blocks.
  accumulatedReps?: number;
  // Videos to show on the TV display, keyed by the workout-exercise UUID.
  // undefined when no exercise in the workout has an associated video.
  videoByExerciseId?: Record<string, SessionVideoInfo>;
  // Mirrors the trainer's "show video on display" toggle. Carried
  // explicitly so the TV can render an "video oculto" affordance instead
  // of falling silently to the gym logo when the trainer turned it off.
  showVideoOnDisplay?: boolean;
  timer: TimerState;
}

export type ConnectionStatus = "waiting" | "connected" | "disconnected";

export interface SessionMessage {
  kind: "state" | "heartbeat" | "ping";
  state?: SessionState;
  sentAt: number;
}

export type CurrentBlock = WorkoutBlock;
