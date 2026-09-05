import type { Exercise } from "@/types";

export function formatExerciseLine(exercise: Exercise): string {
  const segments: string[] = [exercise.name];

  if (exercise.reps !== undefined) segments.push(`${exercise.reps}reps`);
  if (exercise.sets !== undefined) segments.push(`${exercise.sets}series`);
  if (exercise.weightKg !== undefined) segments.push(`${exercise.weightKg}kg`);

  return segments.join(" · ");
}
