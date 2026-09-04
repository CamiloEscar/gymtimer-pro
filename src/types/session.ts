import type { TimerState } from "./timer";
import type { Workout, WorkoutBlock } from "./workout";

export type SessionStatus = "waiting" | "ready" | "running" | "paused" | "finished";

export type WorkoutPhase = "getReady" | "work" | "rest" | "finished";

export interface SessionState {
  code: string;
  workout: Workout;
  status: SessionStatus;
  currentBlockIndex: number;
  currentRound: number;
  totalRounds: number;
  currentPhase: WorkoutPhase;
  currentExerciseIndex: number;
  timer: TimerState;
}

export type ConnectionStatus = "waiting" | "connected" | "disconnected";

export interface SessionMessage {
  kind: "state" | "heartbeat" | "ping";
  state?: SessionState;
  sentAt: number;
}

export type CurrentBlock = WorkoutBlock;
