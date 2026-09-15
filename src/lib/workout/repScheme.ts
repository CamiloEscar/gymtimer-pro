import type { Exercise, MetricKind, RepScheme, WorkoutBlock } from "@/types";

// Pure ladder math, shared by the engine (round cadencia), the editor preview
// and the display. `undefined` scheme ⇒ per-exercise reps (status quo).
export const ladderReps = (scheme: RepScheme | undefined, round: number) =>
  scheme ? Math.max(scheme.min, scheme.start + scheme.step * (round - 1)) : undefined;

// Chipper = a single-round forTime that sweeps its stations instead of running
// a single timer. `exercises.length > 1` keeps the classic one-movement
// forTime on the single-timer lane.
export const isChipper = (block: WorkoutBlock) =>
  block.type === "forTime" && (block.rounds ?? 1) === 1 && block.exercises.length > 1;

// Runtime-resolved metric kind (design D5): explicit override wins, then field
// presence (calories→calories, distance→distance, time→time), else reps — so
// old no-metricKind exercises render exactly as today.
export function metricOf(exercise: Exercise): MetricKind {
  if (exercise.metricKind) return exercise.metricKind;
  if (exercise.calories !== undefined) return "calories";
  if (exercise.distanceMeters !== undefined) return "distanceMeters";
  if (exercise.timeSeconds !== undefined) return "timeSeconds";
  return "reps";
}

// Per-exercise window for station-sequence lanes. Exercise value wins; the
// block-level stationSeconds is the fallback (spec R2).
export const stationWindow = (exercise: Exercise, block: WorkoutBlock) =>
  exercise.timeSeconds ?? block.stationSeconds;