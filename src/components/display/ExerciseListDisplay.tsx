import type { WorkoutBlock } from "@/types";
import { formatExerciseLine } from "@/lib/workout/formatExerciseLine";
import { selectVisibleExercises } from "@/lib/workout/selectVisibleExercises";

interface ExerciseListDisplayProps {
  block: WorkoutBlock;
}

export function ExerciseListDisplay({ block }: ExerciseListDisplayProps) {
  if (block.type === "rest") return null;

  const { visible, overflowCount } = selectVisibleExercises(block.exercises);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      {visible.map((exercise) => (
        <p key={exercise.id} className="text-[2.75rem] leading-tight text-gray-300 text-center">
          {formatExerciseLine(exercise)}
        </p>
      ))}
      {overflowCount > 0 && (
        <p className="text-2xl text-gray-500 text-center">+{overflowCount} más</p>
      )}
    </div>
  );
}
