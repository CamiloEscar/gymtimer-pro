import type { WorkoutPhase } from "@/types";

const PHASE_LABELS: Record<WorkoutPhase, string> = {
  getReady: "PREPARATE",
  work: "TRABAJO",
  rest: "DESCANSO",
  finished: "TIEMPO",
};

const PHASE_CLASSES: Record<WorkoutPhase, string> = {
  getReady: "text-yellow-400",
  work: "text-brand-500",
  rest: "text-danger-500",
  finished: "text-white",
};

export function PhaseIndicator({ phase }: { phase: WorkoutPhase }) {
  return (
    <p className={`text-2xl md:text-4xl font-bold tracking-widest text-center ${PHASE_CLASSES[phase]}`}>
      {PHASE_LABELS[phase]}
    </p>
  );
}
