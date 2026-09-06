import type { Exercise } from "@/types";

export function selectVisibleExercises(
  exercises: Exercise[],
  max = 4
): { visible: Exercise[]; overflowCount: number } {
  return {
    visible: exercises.slice(0, max),
    overflowCount: Math.max(0, exercises.length - max),
  };
}
