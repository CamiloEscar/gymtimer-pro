import type { Exercise } from "@/types";

export function selectVisibleExercises(
  exercises: Exercise[],
  max = Infinity
): { visible: Exercise[]; overflowCount: number } {
  return {
    visible: exercises.slice(0, max),
    overflowCount: Math.max(0, exercises.length - max),
  };
}
