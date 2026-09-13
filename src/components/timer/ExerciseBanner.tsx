import type { SessionStatus, WorkoutPhase } from "@/types";
import type { WorkoutBlock } from "@/types";
import { deriveCurrentExercise } from "@/lib/workout/deriveCurrentExercise";
import { formatExerciseLine } from "@/lib/workout/formatExerciseLine";

interface ExerciseBannerProps {
  block: WorkoutBlock | undefined;
  currentRound: number;
  currentExerciseIndex: number;
  status: SessionStatus;
  phase: WorkoutPhase;
}

// One-line "now playing" for the trainer: what the athletes are doing this
// second (and what comes next). The TV is the source of truth for the box;
// this is the trainer-side echo so they don't have to look away from their
// athletes.
export function ExerciseBanner({
  block,
  currentRound,
  currentExerciseIndex,
  status,
  phase,
}: ExerciseBannerProps) {
  const { visible, current, next } = deriveCurrentExercise({
    block,
    currentRound,
    currentExerciseIndex,
    status,
    phase,
  });

  if (!visible || !current) return null;

  const currentLine = formatExerciseLine(current);
  const nextLine = next ? formatExerciseLine(next) : undefined;
  const isPreview = status === "ready";

  return (
    <div className="w-full max-w-2xl text-center space-y-0.5">
      <p className="font-tactical text-xs md:text-base uppercase tracking-widest text-brand-500">
        <span aria-hidden>▸</span>
        {isPreview && <> Vas a empezar:</>}
        <span className="ml-1 font-industrial text-base md:text-xl tracking-tight text-phosphor">
          {currentLine}
        </span>
      </p>
      {!isPreview && nextLine && (
        <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
          SIGUIENTE: <span className="text-phosphor">{nextLine}</span>
        </p>
      )}
    </div>
  );
}