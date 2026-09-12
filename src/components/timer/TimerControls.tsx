import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface TimerControlsProps {
  status: "ready" | "running" | "paused" | "finished" | "waiting";
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onAddTime: () => void;
  onSubtractTime: () => void;
  // Visible label step for ±SEG buttons. The runner scales this so a Tabata
  // (20s phase) doesn't get +10s jumps, while a 10min AMRAP stays snappy.
  stepSeconds: number;
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
  onNext,
  onPrevious,
  onAddTime,
  onSubtractTime,
  stepSeconds,
}: TimerControlsProps) {
  const safeStep = Math.max(1, Math.round(stepSeconds));
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-md mx-auto">
      {status === "ready" || status === "finished" ? (
        <Button size="md" className="col-span-2 sm:text-lg sm:py-4" onClick={onStart}>
          INICIAR
        </Button>
      ) : status === "running" ? (
        <Button size="md" className="col-span-2 sm:text-lg sm:py-4" onClick={onPause}>
          PAUSAR
        </Button>
      ) : (
        <Button size="md" className="col-span-2 sm:text-lg sm:py-4" onClick={onResume}>
          REANUDAR
        </Button>
      )}
      <Button size="md" variant="secondary" onClick={onPrevious} aria-label="Anterior">
        <Icon name="arrow-left" />
        ANTERIOR
      </Button>
      <Button size="md" variant="secondary" onClick={onNext} aria-label="Siguiente">
        SIGUIENTE
        <Icon name="arrow-left" className="size-4 rotate-180" />
      </Button>
      <Button size="md" variant="secondary" onClick={onSubtractTime}>
        -{safeStep} SEG
      </Button>
      <Button size="md" variant="secondary" onClick={onAddTime}>
        +{safeStep} SEG
      </Button>
      <Button size="md" variant="danger" className="col-span-2" onClick={onReset}>
        REINICIAR
      </Button>
    </div>
  );
}
