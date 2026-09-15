import type { WorkoutBlock } from "@/types";
import { stationWindow } from "@/lib/workout/repScheme";

function estimateBlockSeconds(block: WorkoutBlock): number {
  if (block.type === "interval" || block.type === "tabata" || block.type === "basic") {
    const rounds = block.rounds ?? 1;
    return ((block.workSeconds ?? 0) + (block.restSeconds ?? 0)) * rounds;
  }
  if (block.type === "emom" || block.type === "otm") {
    const rounds = block.rounds ?? 1;
    const perRound = block.intervalSeconds ?? (block.workSeconds ?? 0) + (block.restSeconds ?? 0);
    return perRound * rounds;
  }
  if (block.type === "fightGoneBad") {
    const rounds = block.rounds ?? 1;
    const stations = block.exercises.length;
    const stationSec = block.stationSeconds ?? 0;
    const roundRestSec = block.roundRestSeconds ?? 0;
    return rounds * (stations * stationSec) + Math.max(0, rounds - 1) * roundRestSec;
  }
  // Station-sequence sweep lane: a forTime that carries a station window
  // (block.stationSeconds or any per-exercise timeSeconds) is a chipper or a
  // rounds-of-stations loop — not one open clock. Sum the per-station windows
  // (exercise wins over the block, spec R2) across rounds, plus the inter-round
  // rests.
  if (
    block.type === "forTime" &&
    (block.stationSeconds !== undefined || block.exercises.some((e) => e.timeSeconds !== undefined))
  ) {
    // PIN (T5.1): a repScheme ladder adds ZERO wall-clock. A ladder only scales
    // the announced/displayed cadencia across the existing rounds of the SAME
    // continuous forTime clock (design D2); it must never inflate the estimate
    // into a station-sweep sum. A ladder forTime is estimated exactly like the
    // classic block (its durationSeconds / countup 0), byte-identical to the
    // pre-change behavior.
    if (block.repScheme) return block.durationSeconds;
    const rounds = block.rounds ?? 1;
    const stationsSeconds = block.exercises.reduce(
      (sum, exercise) => sum + (stationWindow(exercise, block) ?? 0),
      0
    );
    const roundRestSec = block.roundRestSeconds ?? 0;
    return rounds * stationsSeconds + Math.max(0, rounds - 1) * roundRestSec;
  }
  if (block.type === "countup") return 0;
  return block.durationSeconds;
}

export function estimateWorkoutDurationSeconds(workout: { blocks: WorkoutBlock[] }): number {
  return workout.blocks.reduce((sum, block) => sum + estimateBlockSeconds(block), 0);
}

export function formatEstimateMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}
