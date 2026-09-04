export type TimerMode = "countdown" | "countup";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  durationMs: number;
  elapsedMs: number;
  remainingMs: number;
}

export type TimerListener = (state: TimerState) => void;
export type Unsubscribe = () => void;
