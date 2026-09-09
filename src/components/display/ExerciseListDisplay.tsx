import type { WorkoutBlock, WorkoutPhase } from "@/types";
import { Icon } from "@/components/ui/Icon";
import { formatExerciseLine } from "@/lib/workout/formatExerciseLine";
import { selectVisibleExercises } from "@/lib/workout/selectVisibleExercises";

interface ExerciseListDisplayProps {
  block: WorkoutBlock;
  phase?: WorkoutPhase;
}

export function ExerciseListDisplay({ block, phase }: ExerciseListDisplayProps) {
  if (block.type === "rest") return null;

  const { visible, overflowCount } = selectVisibleExercises(block.exercises);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      {visible.map((exercise, index) => (
        <p
          key={exercise.id}
          className="font-industrial text-3xl md:text-4xl uppercase tracking-tight leading-tight text-phosphor-dim text-center"
        >
          {index + 1}) {formatExerciseLine(exercise)}
        </p>
      ))}
      {overflowCount > 0 && (
        <p className="font-tactical text-sm uppercase tracking-widest text-phosphor-muted text-center">
          [ +{overflowCount} MÁS ]
        </p>
      )}
      {block.repsPerRound && phase === "work" && (
        <p className="font-tactical text-lg uppercase tracking-widest text-brand-500 text-center inline-flex items-center gap-2">
          <Icon name="dumbbell" className="size-6" />
          <span>{block.repsPerRound} REPS</span>
        </p>
      )}
    </div>
  );
}
