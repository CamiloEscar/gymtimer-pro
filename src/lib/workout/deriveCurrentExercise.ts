import type { SessionStatus, WorkoutPhase } from "@/types";
import type { Exercise, WorkoutBlock } from "@/types";
import { isChipper } from "@/lib/workout/repScheme";

export interface DerivedExerciseInfo {
  visible: boolean;
  current?: Exercise;
  next?: Exercise;
}

// Blocks whose exercise list shouldn't drive the "now playing" banner. Rest
// and RM are self-evident (RM already has its own live rep tally on the run
// page); countdown/countup are time-chasing blocks where the banner reads as
// noise.
const BANNERLESS_BLOCK_TYPES = new Set<WorkoutBlock["type"]>([
  "rest",
  "rm",
  "countdown",
  "countup",
]);

export function deriveCurrentExercise({
  block,
  currentRound,
  currentExerciseIndex,
  status,
  phase,
}: {
  block: WorkoutBlock | undefined;
  currentRound: number;
  currentExerciseIndex: number;
  status: SessionStatus;
  phase: WorkoutPhase;
}): DerivedExerciseInfo {
  if (!block || block.exercises.length === 0) return { visible: false };

  // Pre-start preview: tell the trainer what the first movement is.
  if (status === "ready") return { visible: true, current: block.exercises[0] };

  if (status !== "running" && status !== "paused") return { visible: false };
  if (BANNERLESS_BLOCK_TYPES.has(block.type)) return { visible: false };
  // Passive phases — work-to-rest transition, EMOM/OTM wait tail — show
  // nothing; there is no active movement to point at.
  if (phase === "rest" || phase === "wait" || phase === "finished") {
    return { visible: false };
  }

  const count = block.exercises.length;
  // FGB and chipper rotate stations inside a round; the engine tracks the
  // exact index. Every other block type has no per-exercise engine index, so
  // derive it from the round for parity with the TV (DisplayScreen rotates on
  // `(currentRound - 1) % count`).
  const index =
    block.type === "fightGoneBad" || isChipper(block)
      ? Math.min(currentExerciseIndex, count - 1)
      : (Math.max(1, currentRound) - 1) % count;
  const current = block.exercises[index];
  const next = count > 1 ? block.exercises[(index + 1) % count] : undefined;
  return { visible: true, current, next };
}