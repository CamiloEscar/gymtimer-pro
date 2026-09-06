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
  finished: "text-phosphor",
};

export function PhaseIndicator({ phase }: { phase: WorkoutPhase }) {
  return (
    <p
      className={`font-industrial text-3xl md:text-5xl uppercase tracking-tight leading-none text-center ${PHASE_CLASSES[phase]}`}
    >
      {PHASE_LABELS[phase]}
    </p>
  );
}
