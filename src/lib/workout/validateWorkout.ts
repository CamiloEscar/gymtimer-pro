import type { Workout } from "@/types";

export function validateWorkout(workout: Workout): string[] {
  const errors: string[] = [];

  if (!workout.name.trim()) {
    errors.push("Name is required");
  }

  if (workout.blocks.length === 0) {
    errors.push("Add at least one block");
  }

  for (const block of workout.blocks) {
    if (block.exercises.length === 0) {
      errors.push("Each block needs at least one exercise");
    }
    const needsRounds = block.type === "interval" || block.type === "tabata" || block.type === "emom";
    if (needsRounds && (block.rounds ?? 0) <= 0) {
      errors.push("Rounds must be greater than 0");
    }
  }

  return errors;
}
