import type { Workout } from "@/types";

export function countBlocksAndExercises(workout: Workout): { blocks: number; exercises: number } {
  return {
    blocks: workout.blocks.length,
    exercises: workout.blocks.reduce((sum, block) => sum + block.exercises.length, 0),
  };
}
