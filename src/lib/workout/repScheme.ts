import type { Exercise, MetricKind, RepScheme, WorkoutBlock } from "@/types";

// Pure ladder math, shared by the engine (round cadencia), the editor preview
// and the display. `undefined` scheme ⇒ fixed per-exercise amount.
export const ladderReps = (scheme: RepScheme | undefined, round: number) =>
  scheme ? Math.max(scheme.min, scheme.start + scheme.step * (round - 1)) : undefined;

// True when ANY exercise in the block carries its own ladder. This drives the
// "rounds keep bumping instead of finishing" gate (engine), the zero-wall-clock
// estimation PIN, and the ladder validation — a laddered cadence is a round
// property even though each movement defines its own scheme.
export const blockHasLadder = (block: WorkoutBlock) =>
  block.exercises.some((exercise) => exercise.repScheme !== undefined);

// Chipper = a single-round forTime that sweeps its stations instead of running
// a single timer. `exercises.length > 1` keeps the classic one-movement
// forTime on the single-timer lane.
export const isChipper = (block: WorkoutBlock) =>
  block.type === "forTime" && (block.rounds ?? 1) === 1 && block.exercises.length > 1;

// The only block types a repScheme ladder is valid on (spec R8 matrix).
// RepScheme anywhere else is a validation error; the editor surfaces it only
// on these.
const LADDER_BLOCK_TYPES: ReadonlySet<WorkoutBlock["type"]> = new Set([
  "amrap",
  "forTime",
  "emom",
  "otm",
]);

export const isLadderType = (type: WorkoutBlock["type"]) => LADDER_BLOCK_TYPES.has(type);

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