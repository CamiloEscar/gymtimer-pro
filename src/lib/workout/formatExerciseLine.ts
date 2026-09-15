import type { Exercise, WorkoutBlock } from "@/types";
import { formatTimeInput } from "@/lib/workout/formatTimeInput";
import { ladderReps, metricOf } from "@/lib/workout/repScheme";

export function formatExerciseLine(
  exercise: Exercise,
  ctx?: { block?: WorkoutBlock; round?: number }
): string {
  const segments: string[] = [exercise.name];
  const kind = metricOf(exercise);
  const scheme = exercise.repScheme;

  // The amount segment sits where `reps` used to — one metric amount per
  // exercise, followed by series and weight. Old-shape exercises resolve to
  // `reps` via metricOf and keep byte-identical output.
  if (kind === "reps") {
    const effectiveReps =
      scheme !== undefined ? ladderReps(scheme, ctx?.round ?? 1) : exercise.reps;
    if (effectiveReps !== undefined) segments.push(`${effectiveReps}reps`);
  } else if (kind === "calories") {
    if (exercise.calories !== undefined) segments.push(`${exercise.calories}cal`);
  } else if (kind === "distanceMeters") {
    if (exercise.distanceMeters !== undefined) segments.push(`${exercise.distanceMeters}m`);
  } else if (kind === "timeSeconds") {
    if (exercise.timeSeconds !== undefined) segments.push(formatTimeInput(exercise.timeSeconds));
  } else {
    segments.push("MÁX");
  }

  if (exercise.sets !== undefined) segments.push(`${exercise.sets}series`);
  if (exercise.weightKg !== undefined) segments.push(`${exercise.weightKg}kg`);

  return segments.join(" · ");
}