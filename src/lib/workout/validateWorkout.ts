import type { Workout } from "@/types";
import { BLOCK_TYPE_INFO } from "./blockTypeInfo";

export interface ValidationError {
  message: string;
  blockId?: string;
}

export function validateWorkout(workout: Workout): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!workout.name.trim()) {
    errors.push({ message: "El nombre es obligatorio" });
  }

  if (workout.blocks.length === 0) {
    errors.push({ message: "Agregá al menos un bloque" });
  }

  for (const block of workout.blocks) {
    const requiresExercises = BLOCK_TYPE_INFO[block.type].requiresExercises;
    if (requiresExercises && block.exercises.length === 0) {
      errors.push({ message: "Cada bloque necesita al menos un ejercicio", blockId: block.id });
    }
    const needsRounds =
      block.type === "interval" ||
      block.type === "tabata" ||
      block.type === "emom" ||
      block.type === "otm" ||
      block.type === "fightGoneBad";
    if (needsRounds && (block.rounds ?? 0) <= 0) {
      errors.push({ message: "Las rondas deben ser mayores a 0", blockId: block.id });
    }
    if (block.type === "rm" && block.durationSeconds <= 0) {
      errors.push({ message: "El timecap debe ser mayor a 0", blockId: block.id });
    }
  }

  return errors;
}
