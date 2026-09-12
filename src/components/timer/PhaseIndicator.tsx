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
  // Red = effort (work); brand = recovery (rest). Inverted from a
  // traffic-light reading where green means "go" — a box convention is
  // closer to "intensity": work pushes, rest recovers.
  work: "text-danger-500",
  rest: "text-brand-500",
  wait: "text-phosphor-dim",
  finished: "text-phosphor",
};

interface PhaseIndicatorProps {
  phase: WorkoutPhase;
  // Remaining ms is only used during the getReady countdown to render the
  // giant 3-2-1 instead of the PREPARATE label. Optional so callers that
  // only know the phase (tests, etc.) keep working.
  remainingMs?: number;
}

export function PhaseIndicator({ phase, remainingMs }: PhaseIndicatorProps) {
  if (phase === "getReady" && typeof remainingMs === "number") {
    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    return (
      <p
        aria-live="polite"
        className={`font-industrial tabular-nums text-center leading-none tracking-tight text-[clamp(4.5rem,20vw,14rem)] ${PHASE_CLASSES[phase]}`}
      >
        {seconds}
      </p>
    );
  }
  return (
    <p
      className={`font-industrial text-3xl md:text-5xl lg:text-6xl uppercase tracking-tight leading-none text-center ${PHASE_CLASSES[phase]}`}
    >
      {PHASE_LABELS[phase]}
    </p>
  );
}
