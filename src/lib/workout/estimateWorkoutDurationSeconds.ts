import type { WorkoutBlock } from "@/types";

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
