import type { WorkoutPhase } from "@/types";

const PHASE_LABELS: Record<WorkoutPhase, string> = {
  getReady: "PREPARATE",
  work: "TRABAJO",
  rest: "DESCANSO",
  wait: "ESPERA",
  finished: "TIEMPO",
};

const PHASE_CLASSES: Record<WorkoutPhase, string> = {
  getReady: "text-phase-ready",
  work: "text-brand-500",
  rest: "text-danger-500",
  wait: "text-phosphor-dim",
  finished: "text-phosphor",
};

export function PhaseIndicator({ phase }: { phase: WorkoutPhase }) {
  return (
    <p
      className={`font-industrial text-4xl md:text-6xl lg:text-7xl uppercase tracking-tight leading-none text-center ${PHASE_CLASSES[phase]}`}
    >
      {PHASE_LABELS[phase]}
    </p>
  );
}
