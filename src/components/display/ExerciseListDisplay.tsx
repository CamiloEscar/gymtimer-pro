import type { WorkoutBlock, WorkoutPhase } from "@/types";
import { Icon } from "@/components/ui/Icon";
import { formatExerciseLine } from "@/lib/workout/formatExerciseLine";
import { selectVisibleExercises } from "@/lib/workout/selectVisibleExercises";

interface ExerciseListDisplayProps {
  block: WorkoutBlock;
  phase?: WorkoutPhase;
  currentExerciseId?: string;
  nextExerciseId?: string;
}

export function ExerciseListDisplay({
  block,
  phase,
  currentExerciseId,
  nextExerciseId,
}: ExerciseListDisplayProps) {
  if (block.type === "rest") return null;

  const { visible } = selectVisibleExercises(block.exercises);
  if (visible.length === 0) return null;

  const nextExercise = visible.find((e) => e.id === nextExerciseId);

  return (
    <div
      className="w-full border border-surface-700 rounded-xl overflow-hidden bg-surface-950/60"
      data-testid="exercise-list-table"
    >
      {visible.map((exercise, index) => {
        const isCurrent = exercise.id === currentExerciseId;
        return (
          <div
            key={exercise.id}
            data-testid={`exercise-list-item-${isCurrent ? "current" : "other"}`}
            data-exercise-id={exercise.id}
            className={`flex items-center gap-3 px-4 py-3 border-b border-surface-700 last:border-b-0 text-left transition-colors ${
              isCurrent
                ? "bg-brand-500 text-black"
                : "bg-transparent text-phosphor-dim"
            }`}
          >
            <span
              className={`shrink-0 w-7 text-center font-tactical text-sm uppercase tracking-widest ${
                isCurrent ? "text-black" : "text-phosphor-muted"
              }`}
            >
              {isCurrent ? (
                <Icon name="play" aria-hidden className="size-5 mx-auto" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={`flex-1 min-w-0 text-left ${
                isCurrent ? "text-black" : "text-phosphor-dim"
              }`}
            >
              <span
                className={`block font-industrial uppercase tracking-tight ${
                  isCurrent
                    ? "text-xl md:text-2xl font-bold leading-tight"
                    : "text-base md:text-lg leading-snug"
                }`}
              >
                {formatExerciseLine(exercise)}
              </span>
              {exercise.notes && (
                <span
                  className={`block mt-0.5 text-xs md:text-sm leading-snug font-tactical tracking-wide ${
                    isCurrent ? "text-black/80" : "text-phosphor-muted"
                  }`}
                >
                  {exercise.notes}
                </span>
              )}
            </span>
          </div>
        );
      })}
      {block.repsPerRound && phase === "work" && (
        <div className="px-4 py-3 border-t-2 border-brand-500 text-center bg-surface-900/40">
          <span className="font-tactical text-base uppercase tracking-widest text-brand-500 inline-flex items-center gap-2">
            <Icon name="dumbbell" className="size-5" />
            {block.repsPerRound} REPS POR SERIE
          </span>
        </div>
      )}
      {nextExercise && phase !== "finished" && (
        <div className="px-4 py-3 border-t-2 border-phosphor-muted text-center bg-surface-900/60" data-testid="next-exercise-preview">
          <span className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted block">
            SIGUIENTE
          </span>
          <span className="font-industrial text-lg md:text-xl uppercase tracking-tight text-phosphor block truncate">
            {formatExerciseLine(nextExercise)}
          </span>
        </div>
      )}
    </div>
  );
}