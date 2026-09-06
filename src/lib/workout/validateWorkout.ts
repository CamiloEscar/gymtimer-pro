import type { Workout } from "@/types";

export interface ValidationError {
  message: string;
  blockId?: string;
}

export function validateWorkout(workout: Workout): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!workout.name.trim()) {
    errors.push({ message: "Name is required" });
  }

  if (workout.blocks.length === 0) {
    errors.push({ message: "Add at least one block" });
  }

  for (const block of workout.blocks) {
    if (block.exercises.length === 0) {
      errors.push({ message: "Each block needs at least one exercise", blockId: block.id });
    }
    const needsRounds = block.type === "interval" || block.type === "tabata" || block.type === "emom";
    if (needsRounds && (block.rounds ?? 0) <= 0) {
      errors.push({ message: "Rounds must be greater than 0", blockId: block.id });
    }
  }

  return errors;
}
