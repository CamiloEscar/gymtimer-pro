import type { WorkoutBlock } from "@/types";

function estimateBlockSeconds(block: WorkoutBlock): number {
  if (block.type === "interval" || block.type === "tabata" || block.type === "basic") {
    const rounds = block.rounds ?? 1;
    return ((block.workSeconds ?? 0) + (block.restSeconds ?? 0)) * rounds;
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
